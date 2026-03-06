import { Router, Request, Response } from 'express';
import {
  getAuthUrl,
  handleCallback,
  getConnectionStatus,
  syncContractEvents,
  disconnectCalendar,
} from '../services/googleCalendar.js';
import db from '../db/connection.js';

const router = Router();

// GET /api/calendar/auth-url
router.get('/calendar/auth-url', (_req: Request, res: Response) => {
  try {
    const url = getAuthUrl();
    res.json({ url });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate auth URL' });
  }
});

// GET /api/calendar/callback
router.get('/calendar/callback', async (req: Request, res: Response) => {
  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Missing authorization code' });
    }

    await handleCallback(code);
    // Redirect to calendar settings page after successful auth
    res.redirect('/settings/calendar?connected=true');
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'OAuth callback failed' });
  }
});

// GET /api/calendar/status
router.get('/calendar/status', (_req: Request, res: Response) => {
  const status = getConnectionStatus();
  res.json(status);
});

// POST /api/calendar/sync/contract/:id
router.post('/calendar/sync/contract/:id', async (req: Request, res: Response) => {
  try {
    const synced = await syncContractEvents(Number(req.params.id));
    res.json({ synced, message: `${synced} event(s) synced to Google Calendar` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Sync failed' });
  }
});

// POST /api/calendar/sync/all
router.post('/calendar/sync/all', async (req: Request, res: Response) => {
  try {
    const contracts = db.prepare(
      `SELECT id FROM contracts WHERE status = 'active'`
    ).all() as any[];

    let totalSynced = 0;
    for (const c of contracts) {
      const synced = await syncContractEvents(c.id);
      totalSynced += synced;
    }

    res.json({ synced: totalSynced, contracts: contracts.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Sync failed' });
  }
});

// POST /api/calendar/disconnect
router.post('/calendar/disconnect', async (_req: Request, res: Response) => {
  try {
    await disconnectCalendar();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Disconnect failed' });
  }
});

export default router;
