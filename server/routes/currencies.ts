import { Router, Request, Response } from 'express';
import db from '../db/connection.js';

const router = Router();

// GET / - list all currencies
router.get('/', (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM currencies ORDER BY code').all();
  res.json(rows);
});

// POST / - add currency
router.post('/', (req: Request, res: Response) => {
  const { code, name, symbol, exchange_rate } = req.body;
  db.prepare('INSERT INTO currencies (code, name, symbol, exchange_rate) VALUES (?, ?, ?, ?)')
    .run(code, name, symbol, exchange_rate);
  const currency = db.prepare('SELECT * FROM currencies WHERE code = ?').get(code);
  res.status(201).json(currency);
});

// PUT /:code - update exchange rate
router.put('/:code', (req: Request, res: Response) => {
  const { exchange_rate, name, symbol } = req.body;
  db.prepare("UPDATE currencies SET exchange_rate = ?, name = COALESCE(?, name), symbol = COALESCE(?, symbol), updated_at = datetime('now') WHERE code = ?")
    .run(exchange_rate, name || null, symbol || null, req.params.code);
  const currency = db.prepare('SELECT * FROM currencies WHERE code = ?').get(req.params.code);
  if (!currency) return res.status(404).json({ error: 'Currency not found' });
  res.json(currency);
});

export default router;
