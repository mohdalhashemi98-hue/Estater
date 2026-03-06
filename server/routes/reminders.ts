import { Router, Request, Response } from 'express';
import db from '../db/connection.js';

const router = Router();

// GET /settings - list reminder settings
router.get('/settings', (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM reminder_settings ORDER BY reminder_type, days_before').all();
  res.json(rows);
});

// POST /settings - create setting
router.post('/settings', (req: Request, res: Response) => {
  const { reminder_type, days_before, enabled, notification_method } = req.body;
  const result = db.prepare(
    'INSERT INTO reminder_settings (reminder_type, days_before, enabled, notification_method) VALUES (?, ?, ?, ?)'
  ).run(reminder_type, days_before, enabled ? 1 : 0, notification_method || 'webhook');
  const setting = db.prepare('SELECT * FROM reminder_settings WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(setting);
});

// PUT /settings/:id - update setting
router.put('/settings/:id', (req: Request, res: Response) => {
  const { reminder_type, days_before, enabled, notification_method } = req.body;
  db.prepare(
    "UPDATE reminder_settings SET reminder_type=?, days_before=?, enabled=?, notification_method=?, updated_at=datetime('now') WHERE id=?"
  ).run(reminder_type, days_before, enabled ? 1 : 0, notification_method || 'webhook', req.params.id);
  const setting = db.prepare('SELECT * FROM reminder_settings WHERE id = ?').get(req.params.id);
  res.json(setting);
});

// DELETE /settings/:id
router.delete('/settings/:id', (req: Request, res: Response) => {
  db.prepare('DELETE FROM reminder_settings WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// GET /logs - recent reminder logs
router.get('/logs', (req: Request, res: Response) => {
  const limit = req.query.limit || 50;
  const rows = db.prepare('SELECT * FROM reminder_logs ORDER BY triggered_at DESC LIMIT ?').all(limit);
  res.json(rows);
});

export default router;
