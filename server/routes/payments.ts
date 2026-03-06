import { Router, Request, Response } from 'express';
import db from '../db/connection.js';
import { emitWebhookEvent } from '../services/webhookEmitter.js';

const router = Router();

// List payments with filters
router.get('/', (req: Request, res: Response) => {
  const { status, contract_id, from_date, to_date } = req.query;
  let sql = `
    SELECT pay.*, t.first_name || ' ' || t.last_name as tenant_name,
           u.unit_number, p.name as property_name
    FROM payments pay
    JOIN contracts c ON pay.contract_id = c.id
    JOIN tenants t ON c.tenant_id = t.id
    JOIN units u ON c.unit_id = u.id
    JOIN properties p ON u.property_id = p.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status) { sql += ' AND pay.status = ?'; params.push(status); }
  if (contract_id) { sql += ' AND pay.contract_id = ?'; params.push(contract_id); }
  if (from_date) { sql += ' AND pay.due_date >= ?'; params.push(from_date); }
  if (to_date) { sql += ' AND pay.due_date <= ?'; params.push(to_date); }

  sql += ' ORDER BY pay.due_date ASC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

// Get single payment
router.get('/:id', (req: Request, res: Response) => {
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id);
  if (!payment) return res.status(404).json({ error: 'Payment not found' });
  res.json(payment);
});

// Update payment
router.put('/:id', (req: Request, res: Response) => {
  const { status, paid_date, payment_method, reference, notes } = req.body;
  db.prepare(`
    UPDATE payments SET status=?, paid_date=?, payment_method=?, reference=?, notes=?, updated_at=datetime('now')
    WHERE id=?
  `).run(status, paid_date || null, payment_method || null, reference || null, notes || null, req.params.id);

  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id);
  res.json(payment);
});

// Mark payment as paid
router.post('/:id/mark-paid', (req: Request, res: Response) => {
  const { payment_method, reference } = req.body;
  const today = new Date().toISOString().split('T')[0];

  db.prepare(`
    UPDATE payments SET status='paid', paid_date=?, payment_method=?, reference=?, updated_at=datetime('now')
    WHERE id=?
  `).run(today, payment_method || 'cash', reference || null, req.params.id);

  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id);
  emitWebhookEvent('payment.paid', payment as object);
  res.json(payment);
});

export default router;
