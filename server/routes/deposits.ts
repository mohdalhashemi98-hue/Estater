import { Router, Request, Response } from 'express';
import db from '../db/connection.js';

const router = Router();

// List all deposits
router.get('/', (req: Request, res: Response) => {
  const { status } = req.query;
  let sql = `
    SELECT d.*, t.first_name || ' ' || t.last_name as tenant_name,
           u.unit_number, p.name as property_name
    FROM deposits d
    JOIN contracts c ON d.contract_id = c.id
    JOIN tenants t ON c.tenant_id = t.id
    JOIN units u ON c.unit_id = u.id
    JOIN properties p ON u.property_id = p.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (status) { sql += ' AND d.status = ?'; params.push(status); }
  sql += ' ORDER BY d.date_received DESC';

  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

// Get single deposit
router.get('/:id', (req: Request, res: Response) => {
  const deposit = db.prepare('SELECT * FROM deposits WHERE id = ?').get(req.params.id);
  if (!deposit) return res.status(404).json({ error: 'Deposit not found' });
  res.json(deposit);
});

// Create deposit
router.post('/', (req: Request, res: Response) => {
  const { contract_id, amount, date_received, notes } = req.body;
  const result = db.prepare(
    'INSERT INTO deposits (contract_id, amount, date_received, status, notes) VALUES (?, ?, ?, ?, ?)'
  ).run(contract_id, amount, date_received, 'held', notes || null);

  const deposit = db.prepare('SELECT * FROM deposits WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(deposit);
});

// Update deposit
router.put('/:id', (req: Request, res: Response) => {
  const { amount, status, notes } = req.body;
  db.prepare(
    "UPDATE deposits SET amount=?, status=?, notes=?, updated_at=datetime('now') WHERE id=?"
  ).run(amount, status, notes || null, req.params.id);

  const deposit = db.prepare('SELECT * FROM deposits WHERE id = ?').get(req.params.id);
  res.json(deposit);
});

// Refund deposit
router.post('/:id/refund', (req: Request, res: Response) => {
  const { refund_amount, refund_reason } = req.body;
  const deposit = db.prepare('SELECT * FROM deposits WHERE id = ?').get(req.params.id) as any;
  if (!deposit) return res.status(404).json({ error: 'Deposit not found' });

  const today = new Date().toISOString().split('T')[0];
  const newStatus = refund_amount >= deposit.amount ? 'refunded' : 'partially_refunded';

  db.prepare(`
    UPDATE deposits SET status=?, refund_amount=?, refund_date=?, refund_reason=?, updated_at=datetime('now')
    WHERE id=?
  `).run(newStatus, refund_amount, today, refund_reason || null, req.params.id);

  const updated = db.prepare('SELECT * FROM deposits WHERE id = ?').get(req.params.id);
  res.json(updated);
});

export default router;
