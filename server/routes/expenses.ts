import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import db from '../db/connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'receipts');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed.`));
    }
  },
});

const router = Router();

// GET /summary - aggregates (must be before /:id)
router.get('/summary', (req: Request, res: Response) => {
  const { property_id, from_date, to_date } = req.query;
  let where = 'WHERE 1=1';
  const params: any[] = [];

  if (property_id) { where += ' AND e.property_id = ?'; params.push(property_id); }
  if (from_date) { where += ' AND e.expense_date >= ?'; params.push(from_date); }
  if (to_date) { where += ' AND e.expense_date <= ?'; params.push(to_date); }

  const by_category = db.prepare(`
    SELECT e.category, SUM(e.amount) as total, COUNT(*) as count
    FROM expenses e ${where}
    GROUP BY e.category ORDER BY total DESC
  `).all(...params);

  const by_property = db.prepare(`
    SELECT e.property_id, p.name as property_name, SUM(e.amount) as total, COUNT(*) as count
    FROM expenses e JOIN properties p ON p.id = e.property_id ${where}
    GROUP BY e.property_id ORDER BY total DESC
  `).all(...params);

  const monthly_trend = db.prepare(`
    SELECT strftime('%Y-%m', e.expense_date) as month, SUM(e.amount) as total
    FROM expenses e ${where}
    GROUP BY strftime('%Y-%m', e.expense_date) ORDER BY month
  `).all(...params);

  const totals = db.prepare(`
    SELECT COALESCE(SUM(e.amount), 0) as total_amount, COUNT(*) as total_count
    FROM expenses e ${where}
  `).get(...params) as any;

  res.json({ by_category, by_property, monthly_trend, ...totals });
});

// GET / - list with filters
router.get('/', (req: Request, res: Response) => {
  const { property_id, category, unit_id, from_date, to_date } = req.query;
  let sql = `
    SELECT e.*, p.name as property_name, u.unit_number
    FROM expenses e
    JOIN properties p ON p.id = e.property_id
    LEFT JOIN units u ON u.id = e.unit_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (property_id) { sql += ' AND e.property_id = ?'; params.push(property_id); }
  if (category) { sql += ' AND e.category = ?'; params.push(category); }
  if (unit_id) { sql += ' AND e.unit_id = ?'; params.push(unit_id); }
  if (from_date) { sql += ' AND e.expense_date >= ?'; params.push(from_date); }
  if (to_date) { sql += ' AND e.expense_date <= ?'; params.push(to_date); }

  sql += ' ORDER BY e.expense_date DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

// GET /:id
router.get('/:id', (req: Request, res: Response) => {
  const expense = db.prepare(`
    SELECT e.*, p.name as property_name, u.unit_number
    FROM expenses e
    JOIN properties p ON p.id = e.property_id
    LEFT JOIN units u ON u.id = e.unit_id
    WHERE e.id = ?
  `).get(req.params.id);
  if (!expense) return res.status(404).json({ error: 'Expense not found' });
  res.json(expense);
});

// POST / - create
router.post('/', upload.single('receipt'), (req: Request, res: Response) => {
  const { property_id, unit_id, category, amount, expense_date, vendor_name, description, recurring, recurring_frequency, currency } = req.body;
  const receipt_file = req.file ? req.file.filename : null;

  const result = db.prepare(`
    INSERT INTO expenses (property_id, unit_id, category, amount, expense_date, vendor_name, description, receipt_file, recurring, recurring_frequency, currency)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    property_id, unit_id || null, category, amount, expense_date,
    vendor_name || null, description || null, receipt_file,
    recurring ? 1 : 0, recurring_frequency || null, currency || 'AED'
  );

  const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(expense);
});

// PUT /:id - update
router.put('/:id', (req: Request, res: Response) => {
  const { property_id, unit_id, category, amount, expense_date, vendor_name, description, recurring, recurring_frequency, currency } = req.body;

  db.prepare(`
    UPDATE expenses SET property_id=?, unit_id=?, category=?, amount=?, expense_date=?, vendor_name=?, description=?,
    recurring=?, recurring_frequency=?, currency=?, updated_at=datetime('now')
    WHERE id=?
  `).run(
    property_id, unit_id || null, category, amount, expense_date,
    vendor_name || null, description || null,
    recurring ? 1 : 0, recurring_frequency || null, currency || 'AED',
    req.params.id
  );

  const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id);
  res.json(expense);
});

// DELETE /:id
router.delete('/:id', (req: Request, res: Response) => {
  const expense = db.prepare('SELECT receipt_file FROM expenses WHERE id = ?').get(req.params.id) as any;
  if (!expense) return res.status(404).json({ error: 'Expense not found' });

  if (expense.receipt_file) {
    const filePath = path.join(uploadsDir, expense.receipt_file);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// POST /:id/receipt - upload receipt
router.post('/:id/receipt', upload.single('receipt'), (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });

  const existing = db.prepare('SELECT receipt_file FROM expenses WHERE id = ?').get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: 'Expense not found' });

  // Remove old receipt
  if (existing.receipt_file) {
    const oldPath = path.join(uploadsDir, existing.receipt_file);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  db.prepare("UPDATE expenses SET receipt_file = ?, updated_at = datetime('now') WHERE id = ?")
    .run(req.file.filename, req.params.id);

  res.json({ receipt_file: req.file.filename });
});

// GET /:id/receipt - download receipt
router.get('/:id/receipt', (req: Request, res: Response) => {
  const expense = db.prepare('SELECT receipt_file FROM expenses WHERE id = ?').get(req.params.id) as any;
  if (!expense?.receipt_file) return res.status(404).json({ error: 'No receipt found' });

  const filePath = path.join(uploadsDir, expense.receipt_file);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Receipt file missing' });

  res.sendFile(filePath);
});

export default router;
