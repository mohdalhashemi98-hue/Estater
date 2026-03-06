import { Router, Request, Response } from 'express';
import db from '../db/connection.js';

const router = Router();

// GET /api/properties/:id/valuations
router.get('/properties/:id/valuations', (req: Request, res: Response) => {
  const valuations = db.prepare(`
    SELECT * FROM property_valuations WHERE property_id = ? ORDER BY valuation_date DESC
  `).all(req.params.id);
  res.json(valuations);
});

// POST /api/properties/:id/valuations
router.post('/properties/:id/valuations', (req: Request, res: Response) => {
  const { valuation_date, estimated_value, source, confidence, notes } = req.body;

  const result = db.prepare(`
    INSERT INTO property_valuations (property_id, valuation_date, estimated_value, source, confidence, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.params.id, valuation_date, estimated_value, source || 'manual', confidence || 'high', notes);

  // Update current estimated value on property
  db.prepare(`
    UPDATE properties SET current_estimated_value=?, last_valuation_date=?, updated_at=datetime('now')
    WHERE id=?
  `).run(estimated_value, valuation_date, req.params.id);

  const valuation = db.prepare('SELECT * FROM property_valuations WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(valuation);
});

// DELETE /api/valuations/:id
router.delete('/valuations/:id', (req: Request, res: Response) => {
  db.prepare('DELETE FROM property_valuations WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// POST /api/properties/:id/valuations/scrape
router.post('/properties/:id/valuations/scrape', async (req: Request, res: Response) => {
  const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id) as any;
  if (!property) return res.status(404).json({ error: 'Property not found' });

  // For now return a message about manual entry - scraping is best-effort
  if (!property.zillow_url && !property.redfin_url) {
    return res.json({ message: 'No listing URLs configured for this property. Add Zillow or Redfin URLs in property settings, or enter valuations manually.' });
  }

  try {
    const { scrapePropertyValue } = await import('../services/valuationScraper.js');
    const result = await scrapePropertyValue(property.zillow_url || property.redfin_url);

    if (result) {
      const today = new Date().toISOString().split('T')[0];
      db.prepare(`
        INSERT OR REPLACE INTO property_valuations (property_id, valuation_date, estimated_value, source, confidence)
        VALUES (?, ?, ?, 'scraped', 'low')
      `).run(req.params.id, today, result);

      db.prepare(`
        UPDATE properties SET current_estimated_value=?, last_valuation_date=?, updated_at=datetime('now')
        WHERE id=?
      `).run(result, today, req.params.id);

      return res.json({ estimated_value: result, source: 'scraped' });
    }

    res.json({ message: 'Could not scrape value. Try adding a valuation manually.' });
  } catch {
    res.json({ message: 'Scraping failed. Add valuations manually for reliable tracking.' });
  }
});

// GET /api/valuations/portfolio
router.get('/valuations/portfolio', (_req: Request, res: Response) => {
  const properties = db.prepare(`
    SELECT id, name, purchase_price, current_estimated_value, last_valuation_date, purchase_date
    FROM properties
    WHERE purchase_price IS NOT NULL OR current_estimated_value IS NOT NULL
  `).all() as any[];

  let totalPurchase = 0;
  let totalCurrent = 0;

  const items = properties.map(p => {
    const purchase = p.purchase_price || 0;
    const current = p.current_estimated_value || purchase;
    const gainLoss = current - purchase;
    const gainLossPercent = purchase > 0 ? (gainLoss / purchase) * 100 : 0;

    totalPurchase += purchase;
    totalCurrent += current;

    return {
      id: p.id,
      name: p.name,
      purchase_price: purchase,
      current_value: current,
      gain_loss: gainLoss,
      gain_loss_percent: Math.round(gainLossPercent * 100) / 100,
      last_updated: p.last_valuation_date || p.purchase_date || '',
    };
  });

  const totalGainLoss = totalCurrent - totalPurchase;
  const totalPercent = totalPurchase > 0 ? (totalGainLoss / totalPurchase) * 100 : 0;

  res.json({
    total_properties: items.length,
    total_purchase_value: totalPurchase,
    total_current_value: totalCurrent,
    total_gain_loss: totalGainLoss,
    gain_loss_percent: Math.round(totalPercent * 100) / 100,
    properties: items,
  });
});

export default router;
