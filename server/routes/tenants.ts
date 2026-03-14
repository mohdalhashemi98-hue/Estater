import { Router, Request, Response } from 'express';
import db from '../db/connection.js';

const router = Router();

// List all tenants
router.get('/', (_req: Request, res: Response) => {
  const rows = db.prepare(`
    SELECT t.*,
      COUNT(CASE WHEN c.status = 'active' THEN 1 END) as active_contracts
    FROM tenants t
    LEFT JOIN contracts c ON c.tenant_id = t.id
    GROUP BY t.id
    ORDER BY t.first_name, t.last_name
  `).all();
  res.json(rows);
});

// List tenants with payment and contract summaries
router.get('/enriched', (_req: Request, res: Response) => {
  const tenants = db.prepare('SELECT * FROM tenants ORDER BY first_name, last_name').all() as any[];

  const enriched = tenants.map((tenant: any) => {
    // Active contracts count
    const contractStats = db.prepare(`
      SELECT COUNT(*) as active_contracts
      FROM contracts WHERE tenant_id = ? AND status = 'active'
    `).get(tenant.id) as any;

    // Current property and unit from most recent active contract
    const currentLease = db.prepare(`
      SELECT p.name as current_property, u.unit_number as current_unit,
        c.rent_amount, c.payment_frequency
      FROM contracts c
      JOIN units u ON c.unit_id = u.id
      JOIN properties p ON u.property_id = p.id
      WHERE c.tenant_id = ? AND c.status = 'active'
      ORDER BY c.start_date DESC
      LIMIT 1
    `).get(tenant.id) as any;

    // Calculate monthly rent
    let monthly_rent = 0;
    if (currentLease) {
      const divisor = { monthly: 1, quarterly: 3, semi_annual: 6, annual: 12 }[currentLease.payment_frequency as string] || 1;
      monthly_rent = currentLease.rent_amount / divisor;
    }

    // Payment stats
    const paymentStats = db.prepare(`
      SELECT
        COUNT(*) as total_payments,
        COUNT(CASE WHEN pay.status = 'paid' AND pay.paid_date <= pay.due_date THEN 1 END) as on_time_payments,
        COUNT(CASE WHEN pay.status = 'paid' AND pay.paid_date > pay.due_date THEN 1 END) as late_payments,
        COUNT(CASE WHEN pay.status = 'overdue' THEN 1 END) as missed_payments,
        COUNT(CASE WHEN pay.status IN ('paid', 'overdue') THEN 1 END) as resolved_payments,
        COALESCE(SUM(CASE WHEN pay.status IN ('pending', 'overdue') THEN pay.amount ELSE 0 END), 0) as outstanding_balance,
        MAX(pay.paid_date) as last_payment_date
      FROM payments pay
      JOIN contracts c ON pay.contract_id = c.id
      WHERE c.tenant_id = ?
    `).get(tenant.id) as any;

    const on_time_rate = paymentStats.resolved_payments > 0
      ? Math.round((paymentStats.on_time_payments / paymentStats.resolved_payments) * 10000) / 100
      : 0;

    const risk_score = on_time_rate >= 90 ? 'low' : on_time_rate >= 70 ? 'medium' : 'high';

    return {
      ...tenant,
      active_contracts: contractStats.active_contracts,
      current_property: currentLease?.current_property || null,
      current_unit: currentLease?.current_unit || null,
      monthly_rent,
      total_payments: paymentStats.total_payments,
      on_time_payments: paymentStats.on_time_payments,
      late_payments: paymentStats.late_payments,
      missed_payments: paymentStats.missed_payments,
      on_time_rate,
      outstanding_balance: paymentStats.outstanding_balance,
      last_payment_date: paymentStats.last_payment_date,
      risk_score,
    };
  });

  res.json(enriched);
});

// Get single tenant with contracts
router.get('/:id', (req: Request, res: Response) => {
  const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(req.params.id);
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

  const contracts = db.prepare(`
    SELECT c.*, u.unit_number, p.id as property_id, p.name as property_name
    FROM contracts c
    JOIN units u ON c.unit_id = u.id
    JOIN properties p ON u.property_id = p.id
    WHERE c.tenant_id = ?
    ORDER BY c.start_date DESC
  `).all(req.params.id);

  res.json({ ...tenant as any, contracts });
});

// Create tenant
router.post('/', (req: Request, res: Response) => {
  const { first_name, last_name, email, phone, id_number, company_name, notes } = req.body;
  const result = db.prepare(
    'INSERT INTO tenants (first_name, last_name, email, phone, id_number, company_name, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(first_name, last_name, email || null, phone, id_number || null, company_name || null, notes || null);

  const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(tenant);
});

// Update tenant
router.put('/:id', (req: Request, res: Response) => {
  const { first_name, last_name, email, phone, id_number, company_name, notes } = req.body;
  db.prepare(
    'UPDATE tenants SET first_name=?, last_name=?, email=?, phone=?, id_number=?, company_name=?, notes=?, updated_at=datetime(\'now\') WHERE id=?'
  ).run(first_name, last_name, email || null, phone, id_number || null, company_name || null, notes || null, req.params.id);

  const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(req.params.id);
  res.json(tenant);
});

// Delete tenant
router.delete('/:id', (req: Request, res: Response) => {
  const active = db.prepare(
    "SELECT COUNT(*) as count FROM contracts WHERE tenant_id = ? AND status = 'active'"
  ).get(req.params.id) as any;

  if (active.count > 0) {
    return res.status(400).json({ error: 'Cannot delete tenant with active contracts' });
  }

  db.prepare('DELETE FROM tenants WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
