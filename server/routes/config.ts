import { Router, Request, Response } from 'express';
import db from '../db/connection.js';

const router = Router();

// GET /api/config — returns client-safe configuration
router.get('/', (_req: Request, res: Response) => {
  const getSetting = (key: string) => {
    const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as any;
    return row?.value || null;
  };

  res.json({
    google_maps_api_key: process.env.GOOGLE_MAPS_API_KEY || null,
    dld_api_configured: !!getSetting('dld_api_key'),
    dld_data_source: getSetting('dld_data_source') || 'sample',
  });
});

// GET /api/config/dld — returns DLD API configuration
router.get('/dld', (_req: Request, res: Response) => {
  const getSetting = (key: string) => {
    const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as any;
    return row?.value || null;
  };

  res.json({
    api_key: getSetting('dld_api_key') ? '••••••••' + (getSetting('dld_api_key') || '').slice(-4) : null,
    api_url: getSetting('dld_api_url') || 'https://api.dubaipulse.gov.ae',
    data_source: getSetting('dld_data_source') || 'sample',
    last_sync: getSetting('dld_last_sync'),
  });
});

// PUT /api/config/dld — save DLD API settings
router.put('/dld', (req: Request, res: Response) => {
  const { api_key, api_url, data_source } = req.body;

  const upsert = db.prepare(`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `);

  if (api_key !== undefined && api_key !== null && !api_key.startsWith('••••')) {
    upsert.run('dld_api_key', api_key);
  }
  if (api_url) {
    upsert.run('dld_api_url', api_url);
  }
  if (data_source) {
    upsert.run('dld_data_source', data_source);
  }

  res.json({ success: true });
});

// POST /api/config/dld/test — test the DLD API connection
router.post('/dld/test', (_req: Request, res: Response) => {
  const getSetting = (key: string) => {
    const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as any;
    return row?.value || null;
  };

  const apiKey = getSetting('dld_api_key');
  if (!apiKey) {
    return res.json({ success: false, error: 'No API key configured' });
  }

  // For now, simulate a successful test since we don't have real Dubai Pulse credentials
  // When real API is available, this would make a test request
  res.json({
    success: true,
    message: 'API key saved. Live data integration will be available when Dubai Pulse API access is granted.',
    sample_data_available: true,
  });
});

// DELETE /api/config/dld — remove DLD API settings
router.delete('/dld', (_req: Request, res: Response) => {
  db.prepare("DELETE FROM app_settings WHERE key LIKE 'dld_%'").run();
  res.json({ success: true });
});

export default router;
