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

// Get single tenant with contracts
router.get('/:id', (req: Request, res: Response) => {
  const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(req.params.id);
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

  const contracts = db.prepare(`
    SELECT c.*, u.unit_number, p.name as property_name
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
