import { Router, Request, Response } from 'express';
import db from '../db/connection.js';

const router = Router();

// GET /summary - counts by status (must be before /:id)
router.get('/summary', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT status, COUNT(*) as count FROM maintenance_requests GROUP BY status
    `).all() as any[];

    const summary: Record<string, number> = { reported: 0, in_progress: 0, resolved: 0, cancelled: 0, total: 0 };
    for (const row of rows) {
      summary[row.status] = row.count;
      summary.total += row.count;
    }

    res.json(summary);
  } catch (err) {
    console.error('Error fetching maintenance summary:', err);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// GET / - list with filters
router.get('/', (req: Request, res: Response) => {
  try {
    const { status, property_id } = req.query;
    let sql = `
      SELECT m.*, p.name as property_name, u.unit_number, t.name as tenant_name
      FROM maintenance_requests m
      JOIN properties p ON p.id = m.property_id
      LEFT JOIN units u ON u.id = m.unit_id
      LEFT JOIN tenants t ON t.id = m.tenant_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) { sql += ' AND m.status = ?'; params.push(status); }
    if (property_id) { sql += ' AND m.property_id = ?'; params.push(property_id); }

    sql += `
      ORDER BY
        CASE m.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END,
        m.reported_date DESC
    `;

    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching maintenance requests:', err);
    res.status(500).json({ error: 'Failed to fetch maintenance requests' });
  }
});

// GET /:id
router.get('/:id', (req: Request, res: Response) => {
  try {
    const row = db.prepare(`
      SELECT m.*, p.name as property_name, u.unit_number, t.name as tenant_name
      FROM maintenance_requests m
      JOIN properties p ON p.id = m.property_id
      LEFT JOIN units u ON u.id = m.unit_id
      LEFT JOIN tenants t ON t.id = m.tenant_id
      WHERE m.id = ?
    `).get(req.params.id);

    if (!row) return res.status(404).json({ error: 'Maintenance request not found' });
    res.json(row);
  } catch (err) {
    console.error('Error fetching maintenance request:', err);
    res.status(500).json({ error: 'Failed to fetch maintenance request' });
  }
});

// POST / - create
router.post('/', (req: Request, res: Response) => {
  try {
    const { property_id, unit_id, tenant_id, title, description, category, priority, notes } = req.body;

    if (!property_id || !title || !category) {
      return res.status(400).json({ error: 'property_id, title, and category are required' });
    }

    const result = db.prepare(`
      INSERT INTO maintenance_requests (property_id, unit_id, tenant_id, title, description, category, priority, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      property_id,
      unit_id || null,
      tenant_id || null,
      title,
      description || null,
      category,
      priority || 'medium',
      notes || null
    );

    const created = db.prepare('SELECT * FROM maintenance_requests WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    console.error('Error creating maintenance request:', err);
    res.status(500).json({ error: 'Failed to create maintenance request' });
  }
});

// PUT /:id - update
router.put('/:id', (req: Request, res: Response) => {
  try {
    const existing = db.prepare('SELECT * FROM maintenance_requests WHERE id = ?').get(req.params.id) as any;
    if (!existing) return res.status(404).json({ error: 'Maintenance request not found' });

    const {
      property_id, unit_id, tenant_id, title, description,
      category, priority, status, cost, vendor_name, notes, resolved_date
    } = req.body;

    // Auto-set resolved_date when status changes to 'resolved'
    let finalResolvedDate = resolved_date !== undefined ? resolved_date : existing.resolved_date;
    if (status === 'resolved' && existing.status !== 'resolved' && !resolved_date) {
      finalResolvedDate = new Date().toISOString().split('T')[0];
    }

    db.prepare(`
      UPDATE maintenance_requests
      SET property_id = ?, unit_id = ?, tenant_id = ?, title = ?, description = ?,
          category = ?, priority = ?, status = ?, resolved_date = ?,
          cost = ?, vendor_name = ?, notes = ?
      WHERE id = ?
    `).run(
      property_id ?? existing.property_id,
      unit_id !== undefined ? (unit_id || null) : existing.unit_id,
      tenant_id !== undefined ? (tenant_id || null) : existing.tenant_id,
      title ?? existing.title,
      description !== undefined ? description : existing.description,
      category ?? existing.category,
      priority ?? existing.priority,
      status ?? existing.status,
      finalResolvedDate,
      cost !== undefined ? cost : existing.cost,
      vendor_name !== undefined ? (vendor_name || null) : existing.vendor_name,
      notes !== undefined ? notes : existing.notes,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM maintenance_requests WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error('Error updating maintenance request:', err);
    res.status(500).json({ error: 'Failed to update maintenance request' });
  }
});

// DELETE /:id
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const existing = db.prepare('SELECT id FROM maintenance_requests WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Maintenance request not found' });

    db.prepare('DELETE FROM maintenance_requests WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting maintenance request:', err);
    res.status(500).json({ error: 'Failed to delete maintenance request' });
  }
});

export default router;
