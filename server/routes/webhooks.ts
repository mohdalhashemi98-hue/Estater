import { Router, Request, Response } from 'express';
import db from '../db/connection.js';
import { sendTestPing } from '../services/webhookEmitter.js';

const router = Router();

const VALID_EVENTS = [
  'payment.paid', 'payment.overdue',
  'contract.created', 'contract.renewed', 'contract.terminated', 'contract.created_from_ai',
];

// ===== Inbound routes (n8n → Estater) — MUST come before /:id =====

router.post('/inbound/mark-paid', (req: Request, res: Response) => {
  const secret = req.headers['x-estater-secret'] as string;
  if (!process.env.INBOUND_WEBHOOK_SECRET || secret !== process.env.INBOUND_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Invalid or missing X-Estater-Secret header' });
  }

  const { payment_id, payment_method, reference } = req.body;
  if (!payment_id) return res.status(400).json({ error: 'payment_id is required' });

  const existing = db.prepare('SELECT * FROM payments WHERE id = ?').get(payment_id);
  if (!existing) return res.status(404).json({ error: 'Payment not found' });

  const today = new Date().toISOString().split('T')[0];
  db.prepare(
    "UPDATE payments SET status='paid', paid_date=?, payment_method=?, reference=?, updated_at=datetime('now') WHERE id=?"
  ).run(today, payment_method || 'bank_transfer', reference || null, payment_id);

  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(payment_id);
  res.json({ success: true, payment });
});

router.post('/inbound/add-note', (req: Request, res: Response) => {
  const secret = req.headers['x-estater-secret'] as string;
  if (!process.env.INBOUND_WEBHOOK_SECRET || secret !== process.env.INBOUND_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Invalid or missing X-Estater-Secret header' });
  }

  const { contract_id, note } = req.body;
  if (!contract_id || !note) return res.status(400).json({ error: 'contract_id and note are required' });

  const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(contract_id) as any;
  if (!contract) return res.status(404).json({ error: 'Contract not found' });

  const existingNotes = contract.notes || '';
  const timestamp = new Date().toISOString().split('T')[0];
  const updatedNotes = existingNotes
    ? `${existingNotes}\n[${timestamp}] ${note}`
    : `[${timestamp}] ${note}`;

  db.prepare("UPDATE contracts SET notes=?, updated_at=datetime('now') WHERE id=?").run(updatedNotes, contract_id);

  const updated = db.prepare('SELECT * FROM contracts WHERE id = ?').get(contract_id);
  res.json({ success: true, contract: updated });
});

// ===== CRUD routes =====

// List all webhooks
router.get('/', (_req: Request, res: Response) => {
  const webhooks = db.prepare('SELECT * FROM webhooks ORDER BY created_at DESC').all();
  res.json(webhooks);
});

// Create webhook
router.post('/', (req: Request, res: Response) => {
  const { name, url, secret, events, active } = req.body;

  if (!name || !url) return res.status(400).json({ error: 'name and url are required' });

  // Validate URL format
  try { new URL(url); } catch { return res.status(400).json({ error: 'Invalid URL format' }); }

  // Validate events
  if (events && events !== '*') {
    const eventList = typeof events === 'string' ? events.split(',').map((e: string) => e.trim()) : events;
    const invalid = (Array.isArray(eventList) ? eventList : [eventList]).filter((e: string) => !VALID_EVENTS.includes(e));
    if (invalid.length) return res.status(400).json({ error: `Invalid event types: ${invalid.join(', ')}` });
  }

  const eventsStr = Array.isArray(events) ? events.join(',') : (events || '*');
  const result = db.prepare(
    'INSERT INTO webhooks (name, url, secret, events, active) VALUES (?, ?, ?, ?, ?)'
  ).run(name, url, secret || null, eventsStr, active !== undefined ? (active ? 1 : 0) : 1);

  const webhook = db.prepare('SELECT * FROM webhooks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(webhook);
});

// Update webhook
router.put('/:id', (req: Request, res: Response) => {
  const { name, url, secret, events, active } = req.body;

  if (url) {
    try { new URL(url); } catch { return res.status(400).json({ error: 'Invalid URL format' }); }
  }

  if (events && events !== '*') {
    const eventList = typeof events === 'string' ? events.split(',').map((e: string) => e.trim()) : events;
    const invalid = (Array.isArray(eventList) ? eventList : [eventList]).filter((e: string) => !VALID_EVENTS.includes(e));
    if (invalid.length) return res.status(400).json({ error: `Invalid event types: ${invalid.join(', ')}` });
  }

  const existing = db.prepare('SELECT * FROM webhooks WHERE id = ?').get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: 'Webhook not found' });

  const eventsStr = events ? (Array.isArray(events) ? events.join(',') : events) : existing.events;
  db.prepare(
    "UPDATE webhooks SET name=?, url=?, secret=?, events=?, active=?, updated_at=datetime('now') WHERE id=?"
  ).run(
    name || existing.name,
    url || existing.url,
    secret !== undefined ? (secret || null) : existing.secret,
    eventsStr,
    active !== undefined ? (active ? 1 : 0) : existing.active,
    req.params.id
  );

  const webhook = db.prepare('SELECT * FROM webhooks WHERE id = ?').get(req.params.id);
  res.json(webhook);
});

// Delete webhook (CASCADE cleans logs and retry queue)
router.delete('/:id', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM webhooks WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Webhook not found' });

  db.prepare('DELETE FROM webhooks WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Test ping
router.post('/:id/test', async (req: Request, res: Response) => {
  const result = await sendTestPing(Number(req.params.id));
  res.json(result);
});

// Get delivery logs
router.get('/:id/logs', (req: Request, res: Response) => {
  const limit = Number(req.query.limit) || 50;
  const logs = db.prepare(
    'SELECT * FROM webhook_logs WHERE webhook_id = ? ORDER BY created_at DESC LIMIT ?'
  ).all(req.params.id, limit);
  res.json(logs);
});

export default router;
