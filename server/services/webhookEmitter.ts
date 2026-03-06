import crypto from 'crypto';
import db from '../db/connection.js';

export type WebhookEventType =
  | 'payment.paid'
  | 'payment.overdue'
  | 'contract.created'
  | 'contract.renewed'
  | 'contract.terminated'
  | 'contract.created_from_ai'
  | 'test.ping';

interface WebhookRow {
  id: number;
  name: string;
  url: string;
  secret: string | null;
  events: string;
  active: number;
}

function signPayload(payload: string, secret: string): string {
  return 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

async function deliverWebhook(
  webhook: WebhookRow,
  event: string,
  payload: object
): Promise<{ statusCode: number; body: string; success: boolean }> {
  const body = JSON.stringify({ event, timestamp: new Date().toISOString(), data: payload });
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (webhook.secret) {
    headers['X-Estater-Signature'] = signPayload(body, webhook.secret);
  }

  try {
    const res = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(10_000),
    });
    const responseBody = await res.text().catch(() => '');
    return { statusCode: res.status, body: responseBody, success: res.ok };
  } catch (err: any) {
    return { statusCode: 0, body: err.message || 'Network error', success: false };
  }
}

/**
 * Fire-and-forget: emits an event to all matching active webhooks.
 * Never throws, never blocks the caller.
 */
export function emitWebhookEvent(type: WebhookEventType, payload: object): void {
  // Run async work detached — caller doesn't await
  (async () => {
    try {
      const webhooks = db.prepare(
        "SELECT * FROM webhooks WHERE active = 1"
      ).all() as WebhookRow[];

      for (const wh of webhooks) {
        // Check event subscription: '*' means all, otherwise comma-separated list
        if (wh.events !== '*') {
          const subscribed = wh.events.split(',').map(e => e.trim());
          if (!subscribed.includes(type)) continue;
        }

        const result = await deliverWebhook(wh, type, payload);

        // Log delivery
        db.prepare(
          'INSERT INTO webhook_logs (webhook_id, event, payload, status_code, response_body, success) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(wh.id, type, JSON.stringify(payload), result.statusCode, result.body, result.success ? 1 : 0);

        // Queue for retry on failure
        if (!result.success) {
          const retryAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
          db.prepare(
            'INSERT INTO webhook_retry_queue (webhook_id, event, payload, next_retry_at) VALUES (?, ?, ?, ?)'
          ).run(wh.id, type, JSON.stringify(payload), retryAt);
        }
      }
    } catch (err) {
      console.error('[webhookEmitter] Error emitting event:', type, err);
    }
  })();
}

/**
 * Process pending retries. Called on interval from index.ts.
 */
export async function processRetryQueue(): Promise<void> {
  try {
    const now = new Date().toISOString();
    const pending = db.prepare(
      'SELECT rq.*, w.url, w.secret, w.active FROM webhook_retry_queue rq JOIN webhooks w ON rq.webhook_id = w.id WHERE rq.next_retry_at <= ? AND w.active = 1'
    ).all(now) as any[];

    for (const item of pending) {
      const webhook: WebhookRow = {
        id: item.webhook_id,
        name: '',
        url: item.url,
        secret: item.secret,
        events: '*',
        active: item.active,
      };

      const payload = JSON.parse(item.payload);
      const result = await deliverWebhook(webhook, item.event, payload);

      // Log retry result
      db.prepare(
        'INSERT INTO webhook_logs (webhook_id, event, payload, status_code, response_body, success) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(item.webhook_id, item.event + ' (retry)', item.payload, result.statusCode, result.body, result.success ? 1 : 0);

      // Remove from queue regardless of result (single retry only)
      db.prepare('DELETE FROM webhook_retry_queue WHERE id = ?').run(item.id);
    }
  } catch (err) {
    console.error('[webhookEmitter] Error processing retry queue:', err);
  }
}

/**
 * Send a test ping to a specific webhook. Returns the delivery result.
 */
export async function sendTestPing(webhookId: number): Promise<{ success: boolean; statusCode: number; body: string }> {
  const webhook = db.prepare('SELECT * FROM webhooks WHERE id = ?').get(webhookId) as WebhookRow | undefined;
  if (!webhook) {
    return { success: false, statusCode: 0, body: 'Webhook not found' };
  }

  const payload = { message: 'Test ping from Estater', webhook_id: webhookId, webhook_name: webhook.name };
  const result = await deliverWebhook(webhook, 'test.ping', payload);

  // Log the test delivery
  db.prepare(
    'INSERT INTO webhook_logs (webhook_id, event, payload, status_code, response_body, success) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(webhookId, 'test.ping', JSON.stringify(payload), result.statusCode, result.body, result.success ? 1 : 0);

  return result;
}
