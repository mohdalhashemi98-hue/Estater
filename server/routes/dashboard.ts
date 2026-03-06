import { Router, Request, Response } from 'express';
import db from '../db/connection.js';

const router = Router();

// Mark overdue payments
function markOverdue() {
  db.prepare(`
    UPDATE payments SET status = 'overdue', updated_at = datetime('now')
    WHERE status = 'pending' AND due_date < date('now')
  `).run();
}

// Summary stats
router.get('/summary', (_req: Request, res: Response) => {
  markOverdue();

  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM properties) as total_properties,
      (SELECT COUNT(*) FROM units) as total_units,
      (SELECT COUNT(*) FROM units WHERE status = 'occupied') as occupied_units,
      (SELECT COUNT(*) FROM units WHERE status = 'vacant') as vacant_units,
      (SELECT COUNT(*) FROM contracts WHERE status = 'active') as active_contracts,
      (SELECT COUNT(*) FROM tenants) as total_tenants,
      (SELECT COALESCE(SUM(amount), 0) FROM payments
       WHERE status = 'paid'
       AND paid_date >= date('now', 'start of month')
       AND paid_date < date('now', 'start of month', '+1 month')
      ) as revenue_this_month,
      (SELECT COUNT(*) FROM payments WHERE status = 'overdue') as overdue_count,
      (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'overdue') as overdue_amount
  `).get();

  res.json(stats);
});

// Expiring contracts
router.get('/expiring-contracts', (req: Request, res: Response) => {
  const days = req.query.days || 30;
  const rows = db.prepare(`
    SELECT c.*, t.first_name || ' ' || t.last_name as tenant_name,
           u.unit_number, p.name as property_name
    FROM contracts c
    JOIN tenants t ON c.tenant_id = t.id
    JOIN units u ON c.unit_id = u.id
    JOIN properties p ON u.property_id = p.id
    WHERE c.status = 'active'
      AND c.end_date BETWEEN date('now') AND date('now', '+' || ? || ' days')
    ORDER BY c.end_date ASC
  `).all(days);
  res.json(rows);
});

// Upcoming payments
router.get('/upcoming-payments', (req: Request, res: Response) => {
  const days = req.query.days || 14;
  const rows = db.prepare(`
    SELECT pay.*, t.first_name || ' ' || t.last_name as tenant_name,
           u.unit_number, p.name as property_name
    FROM payments pay
    JOIN contracts c ON pay.contract_id = c.id
    JOIN tenants t ON c.tenant_id = t.id
    JOIN units u ON c.unit_id = u.id
    JOIN properties p ON u.property_id = p.id
    WHERE pay.status = 'pending'
      AND pay.due_date BETWEEN date('now') AND date('now', '+' || ? || ' days')
    ORDER BY pay.due_date ASC
  `).all(days);
  res.json(rows);
});

// Overdue payments
router.get('/overdue-payments', (_req: Request, res: Response) => {
  markOverdue();
  const rows = db.prepare(`
    SELECT pay.*, t.first_name || ' ' || t.last_name as tenant_name,
           u.unit_number, p.name as property_name
    FROM payments pay
    JOIN contracts c ON pay.contract_id = c.id
    JOIN tenants t ON c.tenant_id = t.id
    JOIN units u ON c.unit_id = u.id
    JOIN properties p ON u.property_id = p.id
    WHERE pay.status = 'overdue'
    ORDER BY pay.due_date ASC
  `).all();
  res.json(rows);
});

// Revenue chart data
router.get('/revenue', (req: Request, res: Response) => {
  const months = req.query.months || 6;
  const rows = db.prepare(`
    SELECT strftime('%Y-%m', paid_date) as month,
           SUM(amount) as total
    FROM payments
    WHERE status = 'paid'
      AND paid_date >= date('now', '-' || ? || ' months')
    GROUP BY strftime('%Y-%m', paid_date)
    ORDER BY month
  `).all(months);
  res.json(rows);
});

// Feature 7: Occupancy trend - 12 month occupancy %
router.get('/occupancy-trend', (_req: Request, res: Response) => {
  const rows = db.prepare(`
    WITH months AS (
      SELECT date('now', '-' || n || ' months', 'start of month') as month_date,
             strftime('%Y-%m', date('now', '-' || n || ' months')) as month
      FROM (SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
            UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11)
    )
    SELECT m.month,
           (SELECT COUNT(*) FROM units) as total_units,
           (SELECT COUNT(DISTINCT c.unit_id)
            FROM contracts c
            WHERE c.status IN ('active', 'renewed', 'expired')
              AND c.start_date <= date(m.month_date, '+1 month', '-1 day')
              AND c.end_date >= m.month_date
           ) as occupied_units
    FROM months m
    ORDER BY m.month
  `).all() as any[];

  const result = rows.map(r => ({
    month: r.month,
    total_units: r.total_units,
    occupied_units: r.occupied_units,
    occupancy_pct: r.total_units > 0 ? Math.round((r.occupied_units / r.total_units) * 100) : 0,
  }));

  res.json(result);
});

// Feature 7: Vacancy cost - vacant units with estimated lost rent
router.get('/vacancy-cost', (_req: Request, res: Response) => {
  const rows = db.prepare(`
    SELECT u.id, u.unit_number, p.name as property_name,
           (SELECT c.rent_amount FROM contracts c WHERE c.unit_id = u.id
            ORDER BY c.end_date DESC LIMIT 1) as last_rent
    FROM units u
    JOIN properties p ON p.id = u.property_id
    WHERE u.status = 'vacant'
  `).all() as any[];

  const total_monthly_loss = rows.reduce((s: number, r: any) => s + (r.last_rent || 0), 0);
  res.json({ vacant_units: rows, total_monthly_loss });
});

// Feature 7: Collection rate - paid vs total due
router.get('/collection-rate', (req: Request, res: Response) => {
  const months = req.query.months || 6;
  const data = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as collected,
      COALESCE(SUM(amount), 0) as total_due
    FROM payments
    WHERE due_date >= date('now', '-' || ? || ' months')
      AND status IN ('paid', 'pending', 'overdue')
  `).get(months) as any;

  res.json({
    collected: data.collected,
    total_due: data.total_due,
    rate: data.total_due > 0 ? Math.round((data.collected / data.total_due) * 100) : 100,
  });
});

// Feature 7: Expense breakdown by category
router.get('/expense-breakdown', (req: Request, res: Response) => {
  const months = req.query.months || 12;
  const rows = db.prepare(`
    SELECT category, SUM(amount) as total, COUNT(*) as count
    FROM expenses
    WHERE expense_date >= date('now', '-' || ? || ' months')
    GROUP BY category
    ORDER BY total DESC
  `).all(months);
  res.json(rows);
});

// Feature 7: Net income - monthly rent - expenses - mortgage
router.get('/net-income', (req: Request, res: Response) => {
  const months = req.query.months || 12;
  const rows = db.prepare(`
    WITH months AS (
      SELECT strftime('%Y-%m', date('now', '-' || n || ' months')) as month
      FROM (SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
            UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11)
    )
    SELECT m.month,
      COALESCE((SELECT SUM(pay.amount) FROM payments pay WHERE pay.status = 'paid' AND strftime('%Y-%m', pay.paid_date) = m.month), 0) as rent_income,
      COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE strftime('%Y-%m', e.expense_date) = m.month), 0) as expenses,
      COALESCE((SELECT SUM(mp.total_amount) FROM mortgage_payments mp WHERE mp.status = 'paid' AND strftime('%Y-%m', mp.paid_date) = m.month), 0) as mortgage_payments
    FROM months m
    ORDER BY m.month
  `).all() as any[];

  const result = rows.map(r => ({
    month: r.month,
    rent_income: r.rent_income,
    expenses: r.expenses,
    mortgage_payments: r.mortgage_payments,
    net_income: r.rent_income - r.expenses - r.mortgage_payments,
  }));

  res.json(result);
});

export default router;
