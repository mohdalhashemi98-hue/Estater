import { Router, Request, Response } from 'express';
import db from '../db/connection.js';
import { generateAmortizationSchedule, calculateMonthlyPayment } from '../utils/amortizationGenerator.js';

const router = Router();

// GET /api/properties/:id/mortgages
router.get('/properties/:id/mortgages', (req: Request, res: Response) => {
  const mortgages = db.prepare(`
    SELECT m.*, p.name as property_name
    FROM mortgages m
    JOIN properties p ON p.id = m.property_id
    WHERE m.property_id = ?
    ORDER BY m.created_at DESC
  `).all(req.params.id);
  res.json(mortgages);
});

// POST /api/properties/:id/mortgages
router.post('/properties/:id/mortgages', (req: Request, res: Response) => {
  const { lender_name, loan_amount, interest_rate, term_months, start_date, monthly_payment, loan_type, account_number, notes, currency } = req.body;

  const calculatedMonthly = monthly_payment || calculateMonthlyPayment(loan_amount, interest_rate, term_months);

  const result = db.prepare(`
    INSERT INTO mortgages (property_id, lender_name, loan_amount, interest_rate, term_months, start_date, monthly_payment, remaining_balance, loan_type, account_number, notes, currency)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.params.id, lender_name, loan_amount, interest_rate, term_months, start_date, calculatedMonthly, loan_amount, loan_type || 'fixed', account_number, notes, currency || 'AED');

  // Auto-generate amortization schedule
  const mortgageId = result.lastInsertRowid;
  const schedule = generateAmortizationSchedule(loan_amount, interest_rate, term_months, start_date, calculatedMonthly);

  const insertPayment = db.prepare(`
    INSERT INTO mortgage_payments (mortgage_id, payment_number, due_date, principal, interest, total_amount, remaining_balance)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((rows: any[]) => {
    for (const row of rows) {
      insertPayment.run(mortgageId, row.payment_number, row.due_date, row.principal, row.interest, row.total_amount, row.remaining_balance);
    }
  });

  insertMany(schedule);

  const mortgage = db.prepare('SELECT * FROM mortgages WHERE id = ?').get(mortgageId);
  res.status(201).json(mortgage);
});

// GET /api/mortgages/:id
router.get('/mortgages/:id', (req: Request, res: Response) => {
  const mortgage = db.prepare(`
    SELECT m.*, p.name as property_name
    FROM mortgages m
    JOIN properties p ON p.id = m.property_id
    WHERE m.id = ?
  `).get(req.params.id) as any;

  if (!mortgage) return res.status(404).json({ error: 'Mortgage not found' });

  const payments = db.prepare(`
    SELECT * FROM mortgage_payments WHERE mortgage_id = ? ORDER BY payment_number
  `).all(req.params.id);

  res.json({ ...mortgage, payments });
});

// PUT /api/mortgages/:id
router.put('/mortgages/:id', (req: Request, res: Response) => {
  const { lender_name, loan_amount, interest_rate, term_months, start_date, monthly_payment, loan_type, account_number, notes } = req.body;

  db.prepare(`
    UPDATE mortgages SET lender_name=?, loan_amount=?, interest_rate=?, term_months=?, start_date=?,
    monthly_payment=?, loan_type=?, account_number=?, notes=?, updated_at=datetime('now')
    WHERE id=?
  `).run(lender_name, loan_amount, interest_rate, term_months, start_date, monthly_payment, loan_type, account_number, notes, req.params.id);

  const mortgage = db.prepare('SELECT * FROM mortgages WHERE id = ?').get(req.params.id);
  res.json(mortgage);
});

// DELETE /api/mortgages/:id
router.delete('/mortgages/:id', (req: Request, res: Response) => {
  db.prepare('DELETE FROM mortgages WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// POST /api/mortgages/:id/payments/:payId/mark-paid
router.post('/mortgages/:id/payments/:payId/mark-paid', (req: Request, res: Response) => {
  db.prepare(`
    UPDATE mortgage_payments SET status='paid', paid_date=date('now') WHERE id=? AND mortgage_id=?
  `).run(req.params.payId, req.params.id);

  // Update remaining balance on the mortgage
  const payment = db.prepare('SELECT remaining_balance FROM mortgage_payments WHERE id=?').get(req.params.payId) as any;
  if (payment) {
    db.prepare('UPDATE mortgages SET remaining_balance=?, updated_at=datetime(\'now\') WHERE id=?')
      .run(payment.remaining_balance, req.params.id);
  }

  res.json({ success: true });
});

// GET /api/mortgages/cashflow
router.get('/mortgages/cashflow', (_req: Request, res: Response) => {
  // Get monthly rent income and mortgage payments per property for last 12 months
  const cashflow = db.prepare(`
    WITH months AS (
      SELECT date('now', '-' || n || ' months', 'start of month') as month_start,
             date('now', '-' || (n-1) || ' months', 'start of month') as month_end
      FROM (SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
            UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11)
    ),
    rent_income AS (
      SELECT p.id as property_id, p.name as property_name,
             strftime('%Y-%m', pay.due_date) as month,
             COALESCE(SUM(CASE WHEN pay.status='paid' THEN pay.amount ELSE 0 END), 0) as rent_income
      FROM properties p
      LEFT JOIN units u ON u.property_id = p.id
      LEFT JOIN contracts c ON c.unit_id = u.id
      LEFT JOIN payments pay ON pay.contract_id = c.id
      GROUP BY p.id, strftime('%Y-%m', pay.due_date)
    ),
    mortgage_out AS (
      SELECT m.property_id,
             strftime('%Y-%m', mp.due_date) as month,
             COALESCE(SUM(mp.total_amount), 0) as mortgage_payment
      FROM mortgages m
      LEFT JOIN mortgage_payments mp ON mp.mortgage_id = m.id
      GROUP BY m.property_id, strftime('%Y-%m', mp.due_date)
    )
    SELECT ri.property_id, ri.property_name, ri.month,
           ri.rent_income,
           COALESCE(mo.mortgage_payment, 0) as mortgage_payment,
           ri.rent_income - COALESCE(mo.mortgage_payment, 0) as net_cash_flow
    FROM rent_income ri
    LEFT JOIN mortgage_out mo ON mo.property_id = ri.property_id AND mo.month = ri.month
    WHERE ri.month IS NOT NULL
    ORDER BY ri.month DESC, ri.property_name
  `).all();

  res.json(cashflow);
});

// GET /api/mortgages/summary
router.get('/mortgages/summary', (_req: Request, res: Response) => {
  const summary = db.prepare(`
    SELECT
      COUNT(*) as total_mortgages,
      COALESCE(SUM(loan_amount), 0) as total_loan_amount,
      COALESCE(SUM(remaining_balance), 0) as total_remaining,
      COALESCE(SUM(monthly_payment), 0) as total_monthly_payment
    FROM mortgages
  `).get();

  res.json(summary);
});

export default router;
