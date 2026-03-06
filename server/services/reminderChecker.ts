import db from '../db/connection.js';
import { emitWebhookEvent } from './webhookEmitter.js';

export function checkReminders(): void {
  try {
    const settings = db.prepare(
      "SELECT * FROM reminder_settings WHERE enabled = 1"
    ).all() as any[];

    const today = new Date().toISOString().split('T')[0];

    for (const setting of settings) {
      if (setting.reminder_type === 'payment_due') {
        checkPaymentReminders(setting, today);
      } else if (setting.reminder_type === 'contract_expiry') {
        checkContractReminders(setting, today);
      }
    }
  } catch (err) {
    console.error('[reminderChecker]', err);
  }
}

function checkPaymentReminders(setting: any, today: string): void {
  const targetDate = addDays(today, setting.days_before);

  const payments = db.prepare(`
    SELECT pay.*, t.first_name || ' ' || t.last_name as tenant_name,
           u.unit_number, p.name as property_name
    FROM payments pay
    JOIN contracts c ON pay.contract_id = c.id
    JOIN tenants t ON c.tenant_id = t.id
    JOIN units u ON c.unit_id = u.id
    JOIN properties p ON u.property_id = p.id
    WHERE pay.status = 'pending' AND pay.due_date = ?
  `).all(targetDate) as any[];

  for (const payment of payments) {
    // Dedupe: check if already logged today
    const existing = db.prepare(
      "SELECT id FROM reminder_logs WHERE reminder_type = 'payment_due' AND entity_type = 'payment' AND entity_id = ? AND date(triggered_at) = ?"
    ).get(payment.id, today);

    if (existing) continue;

    emitWebhookEvent('reminder.payment_due' as any, {
      payment_id: payment.id,
      tenant_name: payment.tenant_name,
      property_name: payment.property_name,
      unit_number: payment.unit_number,
      amount: payment.amount,
      due_date: payment.due_date,
      days_before: setting.days_before,
    });

    db.prepare(
      "INSERT INTO reminder_logs (reminder_type, entity_type, entity_id, status) VALUES ('payment_due', 'payment', ?, 'sent')"
    ).run(payment.id);
  }
}

function checkContractReminders(setting: any, today: string): void {
  const targetDate = addDays(today, setting.days_before);

  const contracts = db.prepare(`
    SELECT c.*, t.first_name || ' ' || t.last_name as tenant_name,
           u.unit_number, p.name as property_name
    FROM contracts c
    JOIN tenants t ON c.tenant_id = t.id
    JOIN units u ON c.unit_id = u.id
    JOIN properties p ON u.property_id = p.id
    WHERE c.status = 'active' AND c.end_date = ?
  `).all(targetDate) as any[];

  for (const contract of contracts) {
    const existing = db.prepare(
      "SELECT id FROM reminder_logs WHERE reminder_type = 'contract_expiry' AND entity_type = 'contract' AND entity_id = ? AND date(triggered_at) = ?"
    ).get(contract.id, today);

    if (existing) continue;

    emitWebhookEvent('reminder.contract_expiring' as any, {
      contract_id: contract.id,
      tenant_name: contract.tenant_name,
      property_name: contract.property_name,
      unit_number: contract.unit_number,
      end_date: contract.end_date,
      days_before: setting.days_before,
    });

    db.prepare(
      "INSERT INTO reminder_logs (reminder_type, entity_type, entity_id, status) VALUES ('contract_expiry', 'contract', ?, 'sent')"
    ).run(contract.id);
  }
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
