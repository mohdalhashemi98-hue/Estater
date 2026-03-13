import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { errorHandler } from './middleware/errorHandler.js';
import { auditLogger } from './middleware/auditLogger.js';

// Run migrations on startup
import './db/migrate.js';
import db from './db/connection.js';

import propertiesRouter from './routes/properties.js';
import tenantsRouter from './routes/tenants.js';
import contractsRouter from './routes/contracts.js';
import paymentsRouter from './routes/payments.js';
import depositsRouter from './routes/deposits.js';
import dashboardRouter from './routes/dashboard.js';
import filesRouter from './routes/files.js';
import mortgagesRouter from './routes/mortgages.js';
import valuationsRouter from './routes/valuations.js';
import aiRouter from './routes/ai.js';
import calendarRouter from './routes/calendar.js';
import configRouter from './routes/config.js';
import marketRouter from './routes/market.js';
import webhooksRouter from './routes/webhooks.js';
import expensesRouter from './routes/expenses.js';
import auditLogRouter from './routes/auditLog.js';
import currenciesRouter from './routes/currencies.js';
import templatesRouter from './routes/templates.js';
import remindersRouter from './routes/reminders.js';
import reportsRouter from './routes/reports.js';
import authRouter from './routes/auth.js';
import { authMiddleware } from './middleware/auth.js';
import { processRetryQueue, emitWebhookEvent } from './services/webhookEmitter.js';
import { checkReminders } from './services/reminderChecker.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Audit logger middleware - intercepts POST/PUT/DELETE on audited routes
app.use(auditLogger);

// Auth routes (public — no auth middleware)
app.use('/api/auth', authRouter);

// Protect all other API routes
app.use('/api', authMiddleware);

// API routes
app.use('/api/properties', propertiesRouter);
app.use('/api/tenants', tenantsRouter);
app.use('/api/contracts', contractsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/deposits', depositsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/contracts', filesRouter);
app.use('/api', mortgagesRouter);
app.use('/api', valuationsRouter);
app.use('/api', aiRouter);
app.use('/api', calendarRouter);
app.use('/api/config', configRouter);
app.use('/api/market', marketRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/audit-log', auditLogRouter);
app.use('/api/currencies', currenciesRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/reminders', remindersRouter);
app.use('/api/reports', reportsRouter);

// Serve static files in production
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.use(errorHandler);

function checkOverduePayments() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const overdue = db.prepare(
      "SELECT * FROM payments WHERE status = 'pending' AND due_date < ?"
    ).all(today) as any[];

    if (overdue.length > 0) {
      db.prepare(
        "UPDATE payments SET status = 'overdue', updated_at = datetime('now') WHERE status = 'pending' AND due_date < ?"
      ).run(today);

      for (const payment of overdue) {
        emitWebhookEvent('payment.overdue', payment);
      }
      console.log(`[overdueChecker] Marked ${overdue.length} payment(s) as overdue`);
    }
  } catch (err) {
    console.error('[overdueChecker]', err);
  }
}

function cleanupWebhookLogs() {
  try {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const result = db.prepare('DELETE FROM webhook_logs WHERE created_at < ?').run(cutoff);
    if (result.changes > 0) {
      console.log(`[logCleanup] Deleted ${result.changes} webhook log(s) older than 30 days`);
    }
  } catch (err) {
    console.error('[logCleanup]', err);
  }
}

app.listen(PORT, () => {
  console.log(`Estater server running on http://localhost:${PORT}`);

  // Run overdue check immediately on startup
  checkOverduePayments();

  // Run reminder check on startup
  checkReminders();

  // Process webhook retry queue and clean old logs every 10 minutes
  setInterval(() => {
    processRetryQueue().catch(err => console.error('[retryQueue]', err));
    cleanupWebhookLogs();
  }, 10 * 60 * 1000);

  // Check for overdue payments every hour
  setInterval(checkOverduePayments, 60 * 60 * 1000);

  // Check reminders daily (every 24 hours)
  setInterval(checkReminders, 24 * 60 * 60 * 1000);
});
