import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import multer from 'multer';
import db from '../db/connection.js';
import { analyzeContractFile, analyzeContractForCreation, analyzeMortgageDocument } from '../services/claudeAnalyzer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const tempStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `temp_${uniqueId}${ext}`);
  },
});

const tempUpload = multer({
  storage: tempStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not supported for AI analysis. Use PDF, images, or text.`));
    }
  },
});

const router = Router();

// POST /api/contracts/:contractId/analyze/:fileId
router.post('/contracts/:contractId/analyze/:fileId', async (req: Request, res: Response) => {
  try {
    const { contractId, fileId } = req.params;

    // Verify contract and file exist
    const file = db.prepare(`
      SELECT * FROM contract_files WHERE id = ? AND contract_id = ?
    `).get(fileId, contractId) as any;

    if (!file) {
      return res.status(404).json({ error: 'File not found for this contract' });
    }

    // Check for existing completed analysis
    const existing = db.prepare(`
      SELECT * FROM contract_ai_analysis WHERE file_id = ? AND status = 'completed'
    `).get(fileId) as any;

    if (existing) {
      return res.json({
        ...existing,
        key_terms: JSON.parse(existing.key_terms || '[]'),
        obligations: JSON.parse(existing.obligations || '[]'),
        extracted_payment_due: JSON.parse(existing.extracted_payment_due || '[]'),
        milestones: JSON.parse(existing.milestones || '[]'),
      });
    }

    // Create analysis record
    const result = db.prepare(`
      INSERT INTO contract_ai_analysis (contract_id, file_id, status)
      VALUES (?, ?, 'processing')
    `).run(contractId, fileId);
    const analysisId = result.lastInsertRowid;

    // Run analysis
    const filePath = path.join(uploadsDir, file.stored_name);
    const analysis = await analyzeContractFile(filePath, file.mime_type);

    // Update with results
    db.prepare(`
      UPDATE contract_ai_analysis
      SET extracted_start_date = ?, extracted_end_date = ?, extracted_payment_due = ?,
          key_terms = ?, obligations = ?, summary = ?, milestones = ?,
          status = 'completed', analyzed_at = datetime('now')
      WHERE id = ?
    `).run(
      analysis.extracted_start_date,
      analysis.extracted_end_date,
      JSON.stringify(analysis.extracted_payment_due),
      JSON.stringify(analysis.key_terms),
      JSON.stringify(analysis.obligations),
      analysis.summary,
      JSON.stringify(analysis.milestones),
      analysisId,
    );

    const saved = db.prepare('SELECT * FROM contract_ai_analysis WHERE id = ?').get(analysisId) as any;
    res.json({
      ...saved,
      key_terms: JSON.parse(saved.key_terms || '[]'),
      obligations: JSON.parse(saved.obligations || '[]'),
      extracted_payment_due: JSON.parse(saved.extracted_payment_due || '[]'),
      milestones: JSON.parse(saved.milestones || '[]'),
    });
  } catch (err: any) {
    // Update analysis record with error
    const { fileId } = req.params;
    db.prepare(`
      UPDATE contract_ai_analysis SET status = 'failed', error_message = ? WHERE file_id = ? AND status = 'processing'
    `).run(err.message, fileId);

    res.status(500).json({ error: err.message || 'Analysis failed' });
  }
});

// GET /api/contracts/:contractId/analysis
router.get('/contracts/:contractId/analysis', (req: Request, res: Response) => {
  const analyses = db.prepare(`
    SELECT a.*, f.original_name as file_name
    FROM contract_ai_analysis a
    JOIN contract_files f ON f.id = a.file_id
    WHERE a.contract_id = ?
    ORDER BY a.created_at DESC
  `).all(req.params.contractId) as any[];

  const parsed = analyses.map(a => ({
    ...a,
    key_terms: JSON.parse(a.key_terms || '[]'),
    obligations: JSON.parse(a.obligations || '[]'),
    extracted_payment_due: JSON.parse(a.extracted_payment_due || '[]'),
    milestones: JSON.parse(a.milestones || '[]'),
  }));

  res.json(parsed);
});

// GET /api/ai/analysis/:id
router.get('/ai/analysis/:id', (req: Request, res: Response) => {
  const analysis = db.prepare('SELECT * FROM contract_ai_analysis WHERE id = ?').get(req.params.id) as any;
  if (!analysis) return res.status(404).json({ error: 'Analysis not found' });

  res.json({
    ...analysis,
    key_terms: JSON.parse(analysis.key_terms || '[]'),
    obligations: JSON.parse(analysis.obligations || '[]'),
    extracted_payment_due: JSON.parse(analysis.extracted_payment_due || '[]'),
    milestones: JSON.parse(analysis.milestones || '[]'),
  });
});

// POST /api/ai/analyze-for-creation — Upload contract for AI extraction before creating
router.post('/ai/analyze-for-creation', tempUpload.single('file'), async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  try {
    const analysis = await analyzeContractForCreation(file.path, file.mimetype);
    res.json(analysis);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'AI analysis failed' });
  } finally {
    // Cleanup temp file
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch {}
  }
});

// POST /api/ai/analyze-mortgage — Upload mortgage PDF, returns extracted fields
router.post('/ai/analyze-mortgage', tempUpload.single('file'), async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  try {
    const analysis = await analyzeMortgageDocument(file.path, file.mimetype);
    res.json(analysis);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Mortgage analysis failed' });
  } finally {
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch {}
  }
});

export default router;
