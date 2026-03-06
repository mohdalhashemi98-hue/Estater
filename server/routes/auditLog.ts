import { Router, Request, Response } from 'express';
import db from '../db/connection.js';

const router = Router();

// GET / - list with filters and pagination
router.get('/', (req: Request, res: Response) => {
  const { entity_type, action, from_date, to_date, page = '1', limit = '50' } = req.query;
  let where = 'WHERE 1=1';
  const params: any[] = [];

  if (entity_type) { where += ' AND entity_type = ?'; params.push(entity_type); }
  if (action) { where += ' AND action = ?'; params.push(action); }
  if (from_date) { where += ' AND timestamp >= ?'; params.push(from_date); }
  if (to_date) { where += ' AND timestamp <= ?'; params.push(to_date); }

  const offset = (Number(page) - 1) * Number(limit);
  const total = (db.prepare(`SELECT COUNT(*) as count FROM audit_logs ${where}`).get(...params) as any).count;

  const rows = db.prepare(`
    SELECT * FROM audit_logs ${where}
    ORDER BY timestamp DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset);

  res.json({ data: rows, total, page: Number(page), limit: Number(limit) });
});

// GET /:id
router.get('/:id', (req: Request, res: Response) => {
  const log = db.prepare('SELECT * FROM audit_logs WHERE id = ?').get(req.params.id);
  if (!log) return res.status(404).json({ error: 'Audit log not found' });
  res.json(log);
});

export default router;
