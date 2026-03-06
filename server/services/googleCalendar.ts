import { google, calendar_v3 } from 'googleapis';
import db from '../db/connection.js';

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/calendar/callback'
  );
}

export function getAuthUrl(): string {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

export async function handleCallback(code: string): Promise<void> {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);

  db.prepare(`
    INSERT OR REPLACE INTO google_calendar_tokens (id, access_token, refresh_token, expiry_date)
    VALUES (1, ?, ?, ?)
  `).run(tokens.access_token, tokens.refresh_token, tokens.expiry_date?.toString() || '');
}

function getStoredTokens(): { access_token: string; refresh_token: string; expiry_date: string } | null {
  return db.prepare('SELECT * FROM google_calendar_tokens WHERE id = 1').get() as any;
}

async function getAuthenticatedClient() {
  const tokens = getStoredTokens();
  if (!tokens) throw new Error('Google Calendar not connected');

  const client = getOAuth2Client();
  client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date ? Number(tokens.expiry_date) : undefined,
  });

  client.on('tokens', (newTokens) => {
    db.prepare(`
      UPDATE google_calendar_tokens SET access_token = ?, expiry_date = ? WHERE id = 1
    `).run(newTokens.access_token, newTokens.expiry_date?.toString() || '');
  });

  return client;
}

export async function createCalendarEvent(event: {
  summary: string;
  description?: string;
  date: string;
  reminderDays?: number;
  sourceType: string;
  sourceId: number;
  eventType: string;
}): Promise<string> {
  const auth = await getAuthenticatedClient();
  const calendar = google.calendar({ version: 'v3', auth });

  const calendarEvent: calendar_v3.Schema$Event = {
    summary: event.summary,
    description: event.description || '',
    start: { date: event.date },
    end: { date: event.date },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: (event.reminderDays || 3) * 24 * 60 },
        { method: 'popup', minutes: (event.reminderDays || 3) * 24 * 60 },
      ],
    },
  };

  const res = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: calendarEvent,
  });

  const googleEventId = res.data.id!;

  db.prepare(`
    INSERT INTO calendar_events (google_event_id, event_type, source_type, source_id, title, event_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(googleEventId, event.eventType, event.sourceType, event.sourceId, event.summary, event.date);

  return googleEventId;
}

export async function syncContractEvents(contractId: number): Promise<number> {
  const contract = db.prepare(`
    SELECT c.*, t.first_name || ' ' || t.last_name as tenant_name,
           p.name as property_name, u.unit_number
    FROM contracts c
    JOIN tenants t ON t.id = c.tenant_id
    JOIN units u ON u.id = c.unit_id
    JOIN properties p ON p.id = u.property_id
    WHERE c.id = ?
  `).get(contractId) as any;

  if (!contract) throw new Error('Contract not found');

  let synced = 0;
  const label = `${contract.tenant_name} - ${contract.property_name} ${contract.unit_number}`;

  // Contract end date (30-day reminder)
  const existingEnd = db.prepare(
    `SELECT id FROM calendar_events WHERE source_type = 'contract' AND source_id = ? AND event_type = 'contract_end'`
  ).get(contractId);

  if (!existingEnd) {
    await createCalendarEvent({
      summary: `Contract Ending: ${label}`,
      description: `Lease contract ending on ${contract.end_date}. Tenant: ${contract.tenant_name}.`,
      date: contract.end_date,
      reminderDays: 30,
      sourceType: 'contract',
      sourceId: contractId,
      eventType: 'contract_end',
    });
    synced++;
  }

  // Renewal deadline (60 days before end)
  const existingRenewal = db.prepare(
    `SELECT id FROM calendar_events WHERE source_type = 'contract' AND source_id = ? AND event_type = 'renewal_deadline'`
  ).get(contractId);

  if (!existingRenewal) {
    const endDate = new Date(contract.end_date);
    endDate.setDate(endDate.getDate() - 60);
    const renewalDate = endDate.toISOString().split('T')[0];

    await createCalendarEvent({
      summary: `Renewal Decision: ${label}`,
      description: `Contract #${contractId} ends in 60 days. Decide on renewal for ${contract.tenant_name}.`,
      date: renewalDate,
      reminderDays: 7,
      sourceType: 'contract',
      sourceId: contractId,
      eventType: 'renewal_deadline',
    });
    synced++;
  }

  // Sync AI-extracted milestones
  const milestones = db.prepare(`
    SELECT milestones FROM contract_ai_analysis
    WHERE contract_id = ? AND status = 'completed' AND milestones IS NOT NULL
  `).all(contractId) as any[];

  for (const row of milestones) {
    const parsed = JSON.parse(row.milestones || '[]');
    for (const m of parsed) {
      if (!m.date) continue;
      const existingMilestone = db.prepare(
        `SELECT id FROM calendar_events WHERE source_type = 'ai_analysis' AND source_id = ? AND event_type = 'ai_milestone' AND event_date = ?`
      ).get(contractId, m.date);

      if (!existingMilestone) {
        await createCalendarEvent({
          summary: `Milestone: ${m.description}`,
          description: `AI-extracted milestone for contract #${contractId}: ${m.description}`,
          date: m.date,
          reminderDays: 7,
          sourceType: 'ai_analysis',
          sourceId: contractId,
          eventType: 'ai_milestone',
        });
        synced++;
      }
    }
  }

  return synced;
}

export function getConnectionStatus(): { connected: boolean; events_synced: number } {
  const tokens = getStoredTokens();
  if (!tokens) return { connected: false, events_synced: 0 };

  const count = db.prepare('SELECT COUNT(*) as count FROM calendar_events').get() as any;
  return { connected: true, events_synced: count.count };
}

export async function disconnectCalendar(): Promise<void> {
  db.prepare('DELETE FROM google_calendar_tokens WHERE id = 1').run();
  db.prepare('DELETE FROM calendar_events').run();
}
