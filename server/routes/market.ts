import { Router, Request, Response } from 'express';
import * as dld from '../services/dldClient.js';
import * as adrec from '../services/adrecClient.js';

const router = Router();

// GET /api/market/transactions
router.get('/transactions', (req: Request, res: Response) => {
  try {
    const result = dld.getTransactions({
      area: req.query.area as string,
      building: req.query.building as string,
      type: req.query.type as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      offset: req.query.offset ? Number(req.query.offset) : undefined,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/market/areas
router.get('/areas', (_req: Request, res: Response) => {
  try {
    res.json(dld.getAreas());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/market/areas/:area/trends
router.get('/areas/:area/trends', (req: Request, res: Response) => {
  try {
    res.json(dld.getAreaTrends(req.params.area as string));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/market/buildings/:building/comparables
router.get('/buildings/:building/comparables', (req: Request, res: Response) => {
  try {
    res.json(dld.getBuildingComparables(req.params.building as string));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/market/search
router.get('/search', (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    if (!q) return res.json({ areas: [], buildings: [] });
    res.json(dld.searchAreasAndBuildings(q));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/market/properties/:id/auto-match
router.post('/properties/:id/auto-match', (req: Request, res: Response) => {
  try {
    const match = dld.autoMatchProperty(Number(req.params.id));
    if (!match) return res.json({ matched: false, message: 'No matching DLD data found' });
    res.json({ matched: true, ...match });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/market/properties/:id/estimated-value
router.get('/properties/:id/estimated-value', (req: Request, res: Response) => {
  try {
    const est = dld.getEstimatedValue(Number(req.params.id));
    if (!est) return res.json({ available: false });
    res.json({ available: true, ...est });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---- ADREC (Abu Dhabi) routes ----

// GET /api/market/adrec/transactions
router.get('/adrec/transactions', (req: Request, res: Response) => {
  try {
    const result = adrec.getTransactions({
      area: req.query.area as string,
      building: req.query.building as string,
      type: req.query.type as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      offset: req.query.offset ? Number(req.query.offset) : undefined,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/market/adrec/areas
router.get('/adrec/areas', (_req: Request, res: Response) => {
  try {
    res.json(adrec.getAreas());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/market/adrec/areas/:area/trends
router.get('/adrec/areas/:area/trends', (req: Request, res: Response) => {
  try {
    res.json(adrec.getAreaTrends(req.params.area as string));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/market/adrec/search
router.get('/adrec/search', (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    if (!q) return res.json({ areas: [], buildings: [] });
    res.json(adrec.searchAreasAndBuildings(q));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/market/adrec/summary
router.get('/adrec/summary', (_req: Request, res: Response) => {
  try {
    res.json(adrec.getMarketSummary());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
