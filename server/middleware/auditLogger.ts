import { Request, Response, NextFunction } from 'express';
import db from '../db/connection.js';

const AUDITED_ROUTES: Record<string, string> = {
  '/api/properties': 'property',
  '/api/tenants': 'tenant',
  '/api/contracts': 'contract',
  '/api/payments': 'payment',
  '/api/expenses': 'expense',
};

function getEntityType(path: string): string | null {
  for (const [route, type] of Object.entries(AUDITED_ROUTES)) {
    if (path.startsWith(route)) return type;
  }
  return null;
}

function extractEntityId(path: string): string | null {
  const parts = path.split('/');
  // /api/entity/:id or /api/entity/:id/action
  if (parts.length >= 4) {
    const id = parts[3];
    if (/^\d+$/.test(id)) return id;
  }
  return null;
}

export function auditLogger(req: Request, res: Response, next: NextFunction): void {
  if (!['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return next();
  }

  const entityType = getEntityType(req.path);
  if (!entityType) return next();

  const entityId = extractEntityId(req.path);
  const action = req.method === 'POST' ? 'create' : req.method === 'PUT' ? 'update' : 'delete';

  // Capture old values for update/delete
  let oldValues: any = null;
  if ((action === 'update' || action === 'delete') && entityId) {
    const table = entityType === 'property' ? 'properties' : entityType + 's';
    try {
      oldValues = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(entityId);
    } catch { /* table might not match pattern */ }
  }

  // Intercept response to capture new values
  const originalJson = res.json.bind(res);
  res.json = function(body: any) {
    // Log audit entry after response
    try {
      const newEntityId = entityId || body?.id || body?.lastInsertRowid || null;
      db.prepare(`
        INSERT INTO audit_logs (entity_type, entity_id, action, old_values, new_values, ip_address)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        entityType,
        newEntityId,
        action,
        oldValues ? JSON.stringify(oldValues) : null,
        action !== 'delete' ? JSON.stringify(body) : null,
        req.ip || req.socket.remoteAddress || null
      );
    } catch (err) {
      console.error('[auditLogger] Failed to log:', err);
    }
    return originalJson(body);
  };

  next();
}
