import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import db from '../db/connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

// Ensure uploads directory exists
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
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'image/jpeg', 'image/png', 'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed. Accepted: PDF, images, Word, Excel, text.`));
    }
  },
});

const router = Router();

// Upload files to a contract (supports multiple files)
router.post('/:contractId/files', upload.array('files', 10), (req: Request, res: Response) => {
  const contractId = req.params.contractId;

  // Verify contract exists
  const contract = db.prepare('SELECT id FROM contracts WHERE id = ?').get(contractId);
  if (!contract) {
    // Clean up uploaded files if contract doesn't exist
    const files = req.files as Express.Multer.File[];
    files?.forEach(f => fs.unlinkSync(f.path));
    return res.status(404).json({ error: 'Contract not found' });
  }

  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files provided' });
  }

  const insertFile = db.prepare(
    'INSERT INTO contract_files (contract_id, original_name, stored_name, mime_type, size_bytes) VALUES (?, ?, ?, ?, ?)'
  );

  const inserted = db.transaction(() => {
    return files.map(file => {
      const result = insertFile.run(contractId, file.originalname, file.filename, file.mimetype, file.size);
      return {
        id: result.lastInsertRowid,
        contract_id: Number(contractId),
        original_name: file.originalname,
        stored_name: file.filename,
        mime_type: file.mimetype,
        size_bytes: file.size,
      };
    });
  })();

  res.status(201).json(inserted);
});

// List files for a contract
router.get('/:contractId/files', (req: Request, res: Response) => {
  const files = db.prepare(
    'SELECT * FROM contract_files WHERE contract_id = ? ORDER BY uploaded_at DESC'
  ).all(req.params.contractId);
  res.json(files);
});

// Download a file
router.get('/files/:fileId/download', (req: Request, res: Response) => {
  const file = db.prepare('SELECT * FROM contract_files WHERE id = ?').get(req.params.fileId) as any;
  if (!file) return res.status(404).json({ error: 'File not found' });

  const filePath = path.join(uploadsDir, file.stored_name);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File missing from disk' });
  }

  res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
  res.setHeader('Content-Type', file.mime_type);
  res.sendFile(filePath);
});

// Delete a file
router.delete('/files/:fileId', (req: Request, res: Response) => {
  const file = db.prepare('SELECT * FROM contract_files WHERE id = ?').get(req.params.fileId) as any;
  if (!file) return res.status(404).json({ error: 'File not found' });

  // Delete from disk
  const filePath = path.join(uploadsDir, file.stored_name);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // Delete from DB
  db.prepare('DELETE FROM contract_files WHERE id = ?').run(req.params.fileId);
  res.json({ success: true });
});

export default router;
