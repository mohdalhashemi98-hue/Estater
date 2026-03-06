import { Router, Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import db from '../db/connection.js';
import { renderTemplate } from '../utils/templateRenderer.js';

const router = Router();

// GET /variables - available template variables
router.get('/variables', (_req: Request, res: Response) => {
  res.json({
    contract: ['contract_start_date', 'contract_end_date', 'rent_amount', 'payment_frequency', 'total_payments', 'currency', 'contract_status'],
    tenant: ['tenant_name', 'tenant_email', 'tenant_phone', 'tenant_id_number'],
    property: ['property_name', 'property_type', 'property_emirate', 'property_address'],
    unit: ['unit_number', 'unit_floor', 'unit_bedrooms', 'unit_area_sqm'],
  });
});

// GET / - list templates
router.get('/', (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT id, name, template_type, created_at, updated_at FROM document_templates ORDER BY name').all();
  res.json(rows);
});

// GET /:id
router.get('/:id', (req: Request, res: Response) => {
  const template = db.prepare('SELECT * FROM document_templates WHERE id = ?').get(req.params.id);
  if (!template) return res.status(404).json({ error: 'Template not found' });
  res.json(template);
});

// POST / - create
router.post('/', (req: Request, res: Response) => {
  const { name, template_type, content } = req.body;
  const result = db.prepare('INSERT INTO document_templates (name, template_type, content) VALUES (?, ?, ?)')
    .run(name, template_type, content);
  const template = db.prepare('SELECT * FROM document_templates WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(template);
});

// PUT /:id
router.put('/:id', (req: Request, res: Response) => {
  const { name, template_type, content } = req.body;
  db.prepare("UPDATE document_templates SET name=?, template_type=?, content=?, updated_at=datetime('now') WHERE id=?")
    .run(name, template_type, content, req.params.id);
  const template = db.prepare('SELECT * FROM document_templates WHERE id = ?').get(req.params.id);
  res.json(template);
});

// DELETE /:id
router.delete('/:id', (req: Request, res: Response) => {
  db.prepare('DELETE FROM document_templates WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

function getContractData(contractId: number): Record<string, any> {
  const contract = db.prepare(`
    SELECT c.*, t.first_name || ' ' || t.last_name as tenant_name,
           t.phone as tenant_phone, t.email as tenant_email, t.id_number as tenant_id_number,
           u.unit_number, u.floor as unit_floor, u.bedrooms as unit_bedrooms, u.area_sqm as unit_area_sqm,
           p.name as property_name, p.type as property_type, p.emirate as property_emirate,
           p.street as property_street, p.neighborhood as property_neighborhood, p.city as property_city
    FROM contracts c
    JOIN tenants t ON c.tenant_id = t.id
    JOIN units u ON c.unit_id = u.id
    JOIN properties p ON u.property_id = p.id
    WHERE c.id = ?
  `).get(contractId) as any;

  if (!contract) throw new Error('Contract not found');

  const addressParts = [contract.property_street, contract.property_neighborhood, contract.property_city, contract.property_emirate].filter(Boolean);

  return {
    contract_start_date: contract.start_date,
    contract_end_date: contract.end_date,
    rent_amount: contract.rent_amount,
    payment_frequency: contract.payment_frequency,
    total_payments: contract.total_payments,
    currency: contract.currency || 'AED',
    contract_status: contract.status,
    tenant_name: contract.tenant_name,
    tenant_email: contract.tenant_email || '',
    tenant_phone: contract.tenant_phone || '',
    tenant_id_number: contract.tenant_id_number || '',
    property_name: contract.property_name,
    property_type: contract.property_type,
    property_emirate: contract.property_emirate,
    property_address: addressParts.join(', '),
    unit_number: contract.unit_number,
    unit_floor: contract.unit_floor || '',
    unit_bedrooms: contract.unit_bedrooms || '',
    unit_area_sqm: contract.unit_area_sqm || '',
  };
}

// POST /:id/generate - render HTML
router.post('/:id/generate', (req: Request, res: Response) => {
  const template = db.prepare('SELECT * FROM document_templates WHERE id = ?').get(req.params.id) as any;
  if (!template) return res.status(404).json({ error: 'Template not found' });

  const { contract_id } = req.body;
  if (!contract_id) return res.status(400).json({ error: 'contract_id required' });

  try {
    const data = getContractData(contract_id);
    const html = renderTemplate(template.content, data);
    res.json({ html, data });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /:id/generate-pdf - render + PDF
router.post('/:id/generate-pdf', (req: Request, res: Response) => {
  const template = db.prepare('SELECT * FROM document_templates WHERE id = ?').get(req.params.id) as any;
  if (!template) return res.status(404).json({ error: 'Template not found' });

  const { contract_id } = req.body;
  if (!contract_id) return res.status(400).json({ error: 'contract_id required' });

  try {
    const data = getContractData(contract_id);
    const html = renderTemplate(template.content, data);

    // Strip HTML to text lines for PDF
    const text = html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n### $1\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n')
      .replace(/<strong>(.*?)<\/strong>/gi, '$1')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => {
      const buffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${template.name}.pdf"`);
      res.send(buffer);
    });

    for (const line of text.split('\n')) {
      if (line.startsWith('### ')) {
        doc.moveDown(0.5).fontSize(18).font('Helvetica-Bold').text(line.slice(4));
      } else if (line.startsWith('## ')) {
        doc.moveDown(0.3).fontSize(14).font('Helvetica-Bold').text(line.slice(3));
      } else if (line.trim()) {
        doc.fontSize(11).font('Helvetica').text(line);
      }
    }

    doc.end();
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'PDF generation failed' });
  }
});

export default router;
