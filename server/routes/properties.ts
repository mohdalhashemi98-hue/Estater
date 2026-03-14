import { Router, Request, Response } from 'express';
import db from '../db/connection.js';

const router = Router();

const VALID_PROPERTY_TYPES = [
  'villa', 'apartment', 'townhouse', 'penthouse', 'studio', 'duplex',
  'commercial', 'warehouse', 'office', 'retail',
  'land', 'mixed_use',
  'building', 'standalone',
];

const VALID_EMIRATES = [
  'Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman',
  'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah',
];

// List all properties with unit counts
router.get('/', (_req: Request, res: Response) => {
  const rows = db.prepare(`
    SELECT p.*,
      COUNT(u.id) as unit_count,
      SUM(CASE WHEN u.status = 'occupied' THEN 1 ELSE 0 END) as occupied_count
    FROM properties p
    LEFT JOIN units u ON u.property_id = p.id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `).all();
  res.json(rows);
});

// List properties with financial summaries
router.get('/enriched', (_req: Request, res: Response) => {
  const today = new Date().toISOString().split('T')[0];

  const rows = db.prepare(`
    SELECT p.*,
      COUNT(u.id) as unit_count,
      SUM(CASE WHEN u.status = 'occupied' THEN 1 ELSE 0 END) as occupied_count,
      COUNT(u.id) - SUM(CASE WHEN u.status = 'occupied' THEN 1 ELSE 0 END) as vacant_count,

      (SELECT COALESCE(SUM(
        c2.rent_amount / CASE c2.payment_frequency
          WHEN 'monthly' THEN 1
          WHEN 'quarterly' THEN 3
          WHEN 'semi_annual' THEN 6
          WHEN 'annual' THEN 12
          ELSE 1
        END
      ), 0)
      FROM contracts c2
      JOIN units u2 ON c2.unit_id = u2.id
      WHERE u2.property_id = p.id AND c2.status = 'active'
      ) as monthly_revenue,

      (SELECT CASE
        WHEN COUNT(CASE WHEN pay.due_date <= '${today}' THEN 1 END) = 0 THEN 0
        ELSE ROUND(
          CAST(COUNT(CASE WHEN pay.due_date <= '${today}' AND pay.status = 'paid' THEN 1 END) AS REAL)
          / COUNT(CASE WHEN pay.due_date <= '${today}' THEN 1 END) * 100, 2)
        END
      FROM payments pay
      JOIN contracts c3 ON pay.contract_id = c3.id
      JOIN units u3 ON c3.unit_id = u3.id
      WHERE u3.property_id = p.id
      ) as collection_rate,

      (SELECT COALESCE(SUM(pay2.amount), 0)
      FROM payments pay2
      JOIN contracts c4 ON pay2.contract_id = c4.id
      JOIN units u4 ON c4.unit_id = u4.id
      WHERE u4.property_id = p.id AND pay2.status IN ('pending', 'overdue')
      ) as outstanding_balance,

      (SELECT MIN(c5.end_date)
      FROM contracts c5
      JOIN units u5 ON c5.unit_id = u5.id
      WHERE u5.property_id = p.id AND c5.status = 'active'
      ) as next_expiry,

      (SELECT COUNT(*)
      FROM maintenance_requests mr
      WHERE mr.property_id = p.id AND mr.status IN ('reported', 'in_progress')
      ) as maintenance_open

    FROM properties p
    LEFT JOIN units u ON u.property_id = p.id
    GROUP BY p.id
    ORDER BY p.name
  `).all();

  res.json(rows);
});

// Get single property with units
router.get('/:id', (req: Request, res: Response) => {
  const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id);
  if (!property) return res.status(404).json({ error: 'Property not found' });

  const units = db.prepare('SELECT * FROM units WHERE property_id = ? ORDER BY unit_number').all(req.params.id);
  res.json({ ...property as any, units });
});

// Create property with optional units
router.post('/', (req: Request, res: Response) => {
  const { name, type, emirate, city, neighborhood, street, villa_number, notes, units } = req.body;

  if (!VALID_PROPERTY_TYPES.includes(type)) {
    return res.status(400).json({ error: `Invalid property type: ${type}` });
  }

  if (!VALID_EMIRATES.includes(emirate)) {
    return res.status(400).json({ error: `Invalid emirate: ${emirate}` });
  }

  const createProperty = db.transaction(() => {
    const result = db.prepare(
      'INSERT INTO properties (name, type, emirate, city, neighborhood, street, villa_number, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(name, type, emirate, city || null, neighborhood || null, street || null, villa_number || null, notes || null);

    const propertyId = result.lastInsertRowid;

    if (units && Array.isArray(units)) {
      const insertUnit = db.prepare(
        'INSERT INTO units (property_id, unit_number, floor, bedrooms, bathrooms, area_sqm, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      for (const unit of units) {
        insertUnit.run(propertyId, unit.unit_number, unit.floor || null, unit.bedrooms || null, unit.bathrooms || null, unit.area_sqm || null, unit.notes || null);
      }
    }

    return propertyId;
  });

  const id = createProperty();
  const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
  res.status(201).json(property);
});

// Update property
router.put('/:id', (req: Request, res: Response) => {
  const { name, type, emirate, city, neighborhood, street, villa_number, notes } = req.body;

  if (type && !VALID_PROPERTY_TYPES.includes(type)) {
    return res.status(400).json({ error: `Invalid property type: ${type}` });
  }

  if (emirate && !VALID_EMIRATES.includes(emirate)) {
    return res.status(400).json({ error: `Invalid emirate: ${emirate}` });
  }

  db.prepare(
    'UPDATE properties SET name=?, type=?, emirate=?, city=?, neighborhood=?, street=?, villa_number=?, notes=?, updated_at=datetime(\'now\') WHERE id=?'
  ).run(name, type, emirate, city || null, neighborhood || null, street || null, villa_number || null, notes || null, req.params.id);

  const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id);
  res.json(property);
});

// Delete property
router.delete('/:id', (req: Request, res: Response) => {
  db.prepare('DELETE FROM properties WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Add unit to property
router.post('/:id/units', (req: Request, res: Response) => {
  const { unit_number, floor, bedrooms, bathrooms, area_sqm, notes } = req.body;
  const result = db.prepare(
    'INSERT INTO units (property_id, unit_number, floor, bedrooms, bathrooms, area_sqm, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(req.params.id, unit_number, floor || null, bedrooms || null, bathrooms || null, area_sqm || null, notes || null);

  const unit = db.prepare('SELECT * FROM units WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(unit);
});

// Update unit
router.put('/units/:id', (req: Request, res: Response) => {
  const { unit_number, floor, bedrooms, bathrooms, area_sqm, status, notes } = req.body;
  db.prepare(
    'UPDATE units SET unit_number=?, floor=?, bedrooms=?, bathrooms=?, area_sqm=?, status=?, notes=?, updated_at=datetime(\'now\') WHERE id=?'
  ).run(unit_number, floor || null, bedrooms || null, bathrooms || null, area_sqm || null, status, notes || null, req.params.id);

  const unit = db.prepare('SELECT * FROM units WHERE id = ?').get(req.params.id);
  res.json(unit);
});

// Delete unit
router.delete('/units/:id', (req: Request, res: Response) => {
  db.prepare('DELETE FROM units WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
