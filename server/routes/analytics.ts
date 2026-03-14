import { Router, Request, Response } from 'express';
import db from '../db/connection.js';

const router = Router();

// ---------- 1. Rent Benchmark ----------
router.get('/rent-benchmark', (_req: Request, res: Response) => {
  try {
    const contracts = db.prepare(`
      SELECT
        c.id as contract_id,
        t.first_name || ' ' || t.last_name as tenant_name,
        p.name as property_name,
        u.unit_number,
        c.rent_amount,
        c.payment_frequency,
        u.area_sqm,
        p.type as property_type,
        p.city as area
      FROM contracts c
      JOIN units u ON c.unit_id = u.id
      JOIN properties p ON u.property_id = p.id
      JOIN tenants t ON c.tenant_id = t.id
      WHERE c.status = 'active'
    `).all() as any[];

    const dldAvgStmt = db.prepare(`
      SELECT AVG(meter_sale_price) as avg_price_sqm
      FROM dld_transactions
      WHERE area = ?
        AND property_type = ?
    `);

    const results = [];
    for (const c of contracts) {
      const dld = dldAvgStmt.get(c.area, c.property_type) as any;
      if (!dld || !dld.avg_price_sqm) continue;

      let your_rent_annual = c.rent_amount;
      switch (c.payment_frequency) {
        case 'monthly': your_rent_annual = c.rent_amount * 12; break;
        case 'quarterly': your_rent_annual = c.rent_amount * 4; break;
        case 'semi-annually': your_rent_annual = c.rent_amount * 2; break;
        case 'annually': your_rent_annual = c.rent_amount; break;
        default: your_rent_annual = c.rent_amount * 12;
      }

      const market_estimate_annual = dld.avg_price_sqm * (c.area_sqm || 0) * 0.07;
      const delta_percent = market_estimate_annual > 0
        ? Math.round(((your_rent_annual - market_estimate_annual) / market_estimate_annual) * 10000) / 100
        : 0;

      results.push({
        contract_id: c.contract_id,
        tenant_name: c.tenant_name,
        property_name: c.property_name,
        unit_number: c.unit_number,
        your_rent_annual,
        market_estimate_annual: Math.round(market_estimate_annual * 100) / 100,
        delta_percent,
        area: c.area,
      });
    }

    res.json(results);
  } catch (err) {
    console.error('Error in /rent-benchmark:', err);
    res.status(500).json({ error: 'Failed to fetch rent benchmark data' });
  }
});

// ---------- 2. Portfolio Health ----------
router.get('/portfolio-health', (_req: Request, res: Response) => {
  try {
    // Occupancy
    const units = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied
      FROM units
    `).get() as any;

    const occupancy_score = units.total > 0
      ? (units.occupied / units.total) * 100
      : 100;

    // Collection
    const collection = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid
      FROM payments
      WHERE due_date >= date('now', 'start of year')
        AND due_date < date('now', 'start of year', '+1 year')
    `).get() as any;

    const collection_score = collection.total > 0
      ? (collection.paid / collection.total) * 100
      : 100;

    // Market fit
    const contracts = db.prepare(`
      SELECT
        c.rent_amount,
        c.payment_frequency,
        u.area_sqm,
        p.type as property_type,
        p.city as area
      FROM contracts c
      JOIN units u ON c.unit_id = u.id
      JOIN properties p ON u.property_id = p.id
      WHERE c.status = 'active'
    `).all() as any[];

    const dldAvgStmt = db.prepare(`
      SELECT AVG(meter_sale_price) as avg_price_sqm
      FROM dld_transactions
      WHERE area = ? AND property_type = ?
    `);

    let market_fit_sum = 0;
    let market_fit_count = 0;
    for (const c of contracts) {
      const dld = dldAvgStmt.get(c.area, c.property_type) as any;
      if (!dld || !dld.avg_price_sqm) continue;

      let annual_rent = c.rent_amount;
      switch (c.payment_frequency) {
        case 'monthly': annual_rent = c.rent_amount * 12; break;
        case 'quarterly': annual_rent = c.rent_amount * 4; break;
        case 'semi-annually': annual_rent = c.rent_amount * 2; break;
        case 'annually': annual_rent = c.rent_amount; break;
        default: annual_rent = c.rent_amount * 12;
      }

      const market_rent = dld.avg_price_sqm * (c.area_sqm || 0) * 0.07;
      if (market_rent > 0) {
        market_fit_sum += Math.min(annual_rent / market_rent, 1);
        market_fit_count++;
      }
    }

    const market_fit_score = market_fit_count > 0
      ? (market_fit_sum / market_fit_count) * 100
      : 75;

    // Maintenance
    const maintenance = db.prepare(`
      SELECT COUNT(*) as open_requests
      FROM maintenance
      WHERE status IN ('open', 'pending', 'in_progress')
    `).get() as any ?? { open_requests: 0 };

    const maintenance_score = Math.max(
      0,
      100 - ((maintenance.open_requests || 0) / Math.max(units.total, 1)) * 20
    );

    // Expiry
    const expiry = db.prepare(`
      SELECT
        COUNT(*) as expiring_soon
      FROM contracts
      WHERE status = 'active'
        AND end_date BETWEEN date('now') AND date('now', '+30 days')
    `).get() as any;

    const active_contracts = db.prepare(`
      SELECT COUNT(*) as count FROM contracts WHERE status = 'active'
    `).get() as any;

    const expiry_score = active_contracts.count > 0
      ? 100 - (expiry.expiring_soon / active_contracts.count) * 100
      : 100;

    // Overall weighted average
    const overall =
      occupancy_score * 0.30 +
      collection_score * 0.30 +
      market_fit_score * 0.15 +
      maintenance_score * 0.10 +
      expiry_score * 0.15;

    res.json({
      overall: Math.round(overall * 100) / 100,
      occupancy: { score: Math.round(occupancy_score * 100) / 100, occupied: units.occupied, total: units.total },
      collection: { score: Math.round(collection_score * 100) / 100, paid: collection.paid, total: collection.total },
      market_fit: { score: Math.round(market_fit_score * 100) / 100 },
      maintenance: { score: Math.round(maintenance_score * 100) / 100, open_requests: maintenance.open_requests || 0 },
      expiry: { score: Math.round(expiry_score * 100) / 100, expiring_soon: expiry.expiring_soon, active: active_contracts.count },
    });
  } catch (err) {
    console.error('Error in /portfolio-health:', err);
    res.status(500).json({ error: 'Failed to calculate portfolio health' });
  }
});

// ---------- 3. Projections ----------
router.get('/projections', (_req: Request, res: Response) => {
  try {
    const months: any[] = [];

    // Average monthly expenses from last 6 months
    const avgExpenses = db.prepare(`
      SELECT COALESCE(SUM(amount) / 6.0, 0) as avg_monthly
      FROM expenses
      WHERE expense_date >= date('now', '-6 months')
    `).get() as any;

    const expected_expenses = Math.round(avgExpenses.avg_monthly * 100) / 100;

    // Total monthly mortgage payments
    const mortgageTotal = db.prepare(`
      SELECT COALESCE(SUM(monthly_payment), 0) as total
      FROM mortgages
    `).get() as any;

    const mortgage_payments = mortgageTotal.total;

    const incomeStmt = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM payments p
      JOIN contracts c ON p.contract_id = c.id
      WHERE c.status = 'active'
        AND p.due_date >= date(?)
        AND p.due_date < date(?, '+1 month')
    `);

    const expiringStmt = db.prepare(`
      SELECT COUNT(*) as count,
             COALESCE(SUM(c.rent_amount), 0) as revenue
      FROM contracts c
      WHERE c.status = 'active'
        AND c.end_date >= date(?)
        AND c.end_date < date(?, '+1 month')
    `);

    for (let i = 0; i < 12; i++) {
      const offset = i === 0 ? '+0 months' : `+${i} months`;
      const monthStart = db.prepare(`SELECT date('now', 'start of month', ?) as d`).get(offset) as any;
      const monthStr = (monthStart.d as string).substring(0, 7);

      const income = incomeStmt.get(monthStart.d, monthStart.d) as any;
      const expiring = expiringStmt.get(monthStart.d, monthStart.d) as any;

      const expected_income = income.total;
      const net = expected_income - expected_expenses - mortgage_payments;

      months.push({
        month: monthStr,
        expected_income,
        expected_expenses,
        mortgage_payments,
        net: Math.round(net * 100) / 100,
        contracts_expiring: expiring.count,
        revenue_at_risk: expiring.revenue,
      });
    }

    res.json({ months });
  } catch (err) {
    console.error('Error in /projections:', err);
    res.status(500).json({ error: 'Failed to generate projections' });
  }
});

// ---------- 4. Insights ----------
router.get('/insights', (_req: Request, res: Response) => {
  try {
    const insights: { id: string; type: 'positive' | 'warning' | 'info'; icon: string; text: string }[] = [];

    // Collection rate this month vs last month
    const collectionThis = db.prepare(`
      SELECT
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid,
        COUNT(*) as total
      FROM payments
      WHERE due_date >= date('now', 'start of month')
        AND due_date < date('now', 'start of month', '+1 month')
    `).get() as any;

    const collectionLast = db.prepare(`
      SELECT
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid,
        COUNT(*) as total
      FROM payments
      WHERE due_date >= date('now', 'start of month', '-1 month')
        AND due_date < date('now', 'start of month')
    `).get() as any;

    const rateThis = collectionThis.total > 0 ? (collectionThis.paid / collectionThis.total) * 100 : 0;
    const rateLast = collectionLast.total > 0 ? (collectionLast.paid / collectionLast.total) * 100 : 0;

    if (collectionThis.total > 0) {
      const diff = rateThis - rateLast;
      insights.push({
        id: 'collection-rate',
        type: diff >= 0 ? 'positive' : 'warning',
        icon: diff >= 0 ? 'TrendingUp' : 'TrendingDown',
        text: `Collection rate is ${Math.round(rateThis)}% this month${rateLast > 0 ? `, ${diff >= 0 ? 'up' : 'down'} ${Math.abs(Math.round(diff))}% from last month` : ''}.`,
      });
    }

    // Portfolio yield
    const yieldData = db.prepare(`
      SELECT
        COALESCE(SUM(c.rent_amount * 12), 0) as annual_rent,
        COALESCE(SUM(p.current_estimated_value), 0) as total_value
      FROM contracts c
      JOIN units u ON c.unit_id = u.id
      JOIN properties p ON u.property_id = p.id
      WHERE c.status = 'active'
    `).get() as any;

    if (yieldData.total_value > 0) {
      const portfolioYield = (yieldData.annual_rent / yieldData.total_value) * 100;
      insights.push({
        id: 'portfolio-yield',
        type: portfolioYield >= 5 ? 'positive' : 'info',
        icon: 'PieChart',
        text: `Portfolio yield is ${Math.round(portfolioYield * 10) / 10}% based on current property values.`,
      });
    }

    // Best and worst performing property by ROI
    const roiProperties = db.prepare(`
      SELECT
        p.id, p.name, p.purchase_price,
        COALESCE((SELECT SUM(pay.amount) FROM payments pay
          JOIN contracts c2 ON pay.contract_id = c2.id
          JOIN units u2 ON c2.unit_id = u2.id
          WHERE u2.property_id = p.id AND pay.status = 'paid'
          AND pay.paid_date >= date('now', '-1 year')), 0) as annual_revenue,
        COALESCE((SELECT SUM(e.amount) FROM expenses e
          WHERE e.property_id = p.id
          AND e.expense_date >= date('now', '-1 year')), 0) as annual_expenses
      FROM properties p
      WHERE p.purchase_price > 0
    `).all() as any[];

    if (roiProperties.length > 0) {
      const withRoi = roiProperties.map(p => ({
        ...p,
        roi: ((p.annual_revenue - p.annual_expenses) / p.purchase_price) * 100,
      })).sort((a, b) => b.roi - a.roi);

      const best = withRoi[0];
      insights.push({
        id: 'best-roi',
        type: 'positive',
        icon: 'Star',
        text: `${best.name} is your best performer with ${Math.round(best.roi * 10) / 10}% ROI over the past year.`,
      });

      if (withRoi.length > 1) {
        const worst = withRoi[withRoi.length - 1];
        insights.push({
          id: 'worst-roi',
          type: worst.roi < 0 ? 'warning' : 'info',
          icon: 'AlertTriangle',
          text: `${worst.name} has the lowest ROI at ${Math.round(worst.roi * 10) / 10}% — consider reviewing expenses or rent.`,
        });
      }
    }

    // Overdue payments
    const overdue = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total
      FROM payments WHERE status = 'overdue'
    `).get() as any;

    if (overdue.count > 0) {
      insights.push({
        id: 'overdue-payments',
        type: 'warning',
        icon: 'AlertCircle',
        text: `${overdue.count} overdue payment${overdue.count > 1 ? 's' : ''} totalling ${Math.round(overdue.total).toLocaleString()} need immediate attention.`,
      });
    }

    // Contracts expiring soon
    const expiringSoon = db.prepare(`
      SELECT COUNT(*) as count
      FROM contracts
      WHERE status = 'active'
        AND end_date BETWEEN date('now') AND date('now', '+30 days')
    `).get() as any;

    if (expiringSoon.count > 0) {
      insights.push({
        id: 'expiring-contracts',
        type: 'warning',
        icon: 'Clock',
        text: `${expiringSoon.count} contract${expiringSoon.count > 1 ? 's' : ''} expiring in the next 30 days — start renewal discussions.`,
      });
    }

    // Year-over-year revenue
    const revenueThisYear = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM payments
      WHERE status = 'paid' AND paid_date >= date('now', 'start of year')
    `).get() as any;

    const revenueLastYear = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM payments
      WHERE status = 'paid'
        AND paid_date >= date('now', 'start of year', '-1 year')
        AND paid_date < date('now', 'start of year')
    `).get() as any;

    if (revenueLastYear.total > 0) {
      const change = ((revenueThisYear.total - revenueLastYear.total) / revenueLastYear.total) * 100;
      insights.push({
        id: 'yoy-revenue',
        type: change >= 0 ? 'positive' : 'warning',
        icon: change >= 0 ? 'TrendingUp' : 'TrendingDown',
        text: `Year-to-date revenue is ${change >= 0 ? 'up' : 'down'} ${Math.abs(Math.round(change))}% compared to the same period last year.`,
      });
    }

    // Vacancy cost
    const vacantUnits = db.prepare(`
      SELECT COUNT(*) as count FROM units WHERE status = 'vacant'
    `).get() as any;

    if (vacantUnits.count > 0) {
      const avgRent = db.prepare(`
        SELECT COALESCE(AVG(c.rent_amount), 0) as avg_rent
        FROM contracts c WHERE c.status = 'active'
      `).get() as any;

      if (avgRent.avg_rent > 0) {
        const monthlyCost = vacantUnits.count * avgRent.avg_rent;
        insights.push({
          id: 'vacancy-cost',
          type: 'info',
          icon: 'DollarSign',
          text: `${vacantUnits.count} vacant unit${vacantUnits.count > 1 ? 's' : ''} represent an estimated ${Math.round(monthlyCost).toLocaleString()}/month in lost revenue.`,
        });
      }
    }

    // Return top 6
    res.json(insights.slice(0, 6));
  } catch (err) {
    console.error('Error in /insights:', err);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// ---------- 5. Revenue Calendar ----------
router.get('/revenue-calendar', (req: Request, res: Response) => {
  try {
    const year = req.query.year ? String(req.query.year) : new Date().getFullYear().toString();

    const payments = db.prepare(`
      SELECT
        paid_date,
        SUM(amount) as amount,
        COUNT(*) as count
      FROM payments
      WHERE paid_date IS NOT NULL
        AND paid_date >= date(? || '-01-01')
        AND paid_date < date(? || '-01-01', '+1 year')
        AND status = 'paid'
      GROUP BY paid_date
      ORDER BY paid_date
    `).all(year, year) as any[];

    const monthsMap: Record<string, { total_collected: number; days: any[] }> = {};

    for (let m = 1; m <= 12; m++) {
      const monthStr = `${year}-${String(m).padStart(2, '0')}`;
      monthsMap[monthStr] = { total_collected: 0, days: [] };
    }

    for (const p of payments) {
      const monthStr = (p.paid_date as string).substring(0, 7);
      if (monthsMap[monthStr]) {
        monthsMap[monthStr].total_collected += p.amount;
        monthsMap[monthStr].days.push({
          date: p.paid_date,
          amount: p.amount,
          count: p.count,
        });
      }
    }

    const months = Object.entries(monthsMap).map(([month, data]) => ({
      month,
      total_collected: Math.round(data.total_collected * 100) / 100,
      days: data.days,
    }));

    res.json({ year: parseInt(year), months });
  } catch (err) {
    console.error('Error in /revenue-calendar:', err);
    res.status(500).json({ error: 'Failed to fetch revenue calendar' });
  }
});

// ---------- 6. Property Comparison ----------
router.get('/property-comparison', (req: Request, res: Response) => {
  try {
    const idsParam = req.query.ids as string;
    if (!idsParam) {
      return res.status(400).json({ error: 'Missing ids query parameter' });
    }

    const ids = idsParam.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
    if (ids.length === 0) {
      return res.status(400).json({ error: 'No valid property IDs provided' });
    }

    const placeholders = ids.map(() => '?').join(',');

    const properties = db.prepare(`
      SELECT id, name, type, emirate, purchase_price, current_estimated_value
      FROM properties
      WHERE id IN (${placeholders})
    `).all(...ids) as any[];

    const unitCountStmt = db.prepare(`
      SELECT
        COUNT(*) as unit_count,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied_count
      FROM units WHERE property_id = ?
    `);

    const revenueStmt = db.prepare(`
      SELECT COALESCE(SUM(pay.amount), 0) as total_revenue
      FROM payments pay
      JOIN contracts c ON pay.contract_id = c.id
      JOIN units u ON c.unit_id = u.id
      WHERE u.property_id = ? AND pay.status = 'paid'
    `);

    const expenseStmt = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total_expenses
      FROM expenses WHERE property_id = ?
    `);

    const mortgageStmt = db.prepare(`
      SELECT COALESCE(SUM(monthly_payment), 0) as mortgage_total
      FROM mortgages WHERE property_id = ?
    `);

    const avgRentStmt = db.prepare(`
      SELECT COALESCE(AVG(c.rent_amount), 0) as avg_rent
      FROM contracts c
      JOIN units u ON c.unit_id = u.id
      WHERE u.property_id = ? AND c.status = 'active'
    `);

    const results = properties.map(p => {
      const unitData = unitCountStmt.get(p.id) as any;
      const revenue = revenueStmt.get(p.id) as any;
      const expenses = expenseStmt.get(p.id) as any;
      const mortgage = mortgageStmt.get(p.id) as any;
      const avgRent = avgRentStmt.get(p.id) as any;

      const net_income = revenue.total_revenue - expenses.total_expenses - mortgage.mortgage_total;
      const occupancy_rate = unitData.unit_count > 0
        ? Math.round((unitData.occupied_count / unitData.unit_count) * 10000) / 100
        : 0;
      const roi = p.purchase_price > 0
        ? Math.round((net_income / p.purchase_price) * 10000) / 100
        : null;

      return {
        id: p.id,
        name: p.name,
        type: p.type,
        emirate: p.emirate,
        unit_count: unitData.unit_count,
        occupied_count: unitData.occupied_count,
        total_revenue: revenue.total_revenue,
        total_expenses: expenses.total_expenses,
        mortgage_total: mortgage.mortgage_total,
        net_income: Math.round(net_income * 100) / 100,
        occupancy_rate,
        avg_rent_per_unit: Math.round(avgRent.avg_rent * 100) / 100,
        roi,
      };
    });

    res.json(results);
  } catch (err) {
    console.error('Error in /property-comparison:', err);
    res.status(500).json({ error: 'Failed to compare properties' });
  }
});

// ---------- 7. Tenant Risk ----------
router.get('/tenant-risk', (_req: Request, res: Response) => {
  try {
    const tenants = db.prepare(`
      SELECT DISTINCT
        t.id as tenant_id,
        t.first_name || ' ' || t.last_name as tenant_name,
        (SELECT COUNT(*) FROM contracts c2 WHERE c2.tenant_id = t.id AND c2.status = 'active') as active_contracts
      FROM tenants t
      JOIN contracts c ON c.tenant_id = t.id
      WHERE c.status = 'active'
    `).all() as any[];

    const paymentStatsStmt = db.prepare(`
      SELECT
        COUNT(*) as total_payments,
        SUM(CASE WHEN p.status = 'paid' AND p.paid_date <= p.due_date THEN 1 ELSE 0 END) as on_time,
        SUM(CASE WHEN p.status = 'paid' AND p.paid_date > p.due_date THEN 1 ELSE 0 END) as late,
        SUM(CASE WHEN p.status IN ('overdue', 'pending') AND p.due_date < date('now') THEN 1 ELSE 0 END) as missed
      FROM payments p
      JOIN contracts c ON p.contract_id = c.id
      WHERE c.tenant_id = ?
    `);

    const avgDaysLateStmt = db.prepare(`
      SELECT COALESCE(AVG(julianday(p.paid_date) - julianday(p.due_date)), 0) as avg_days
      FROM payments p
      JOIN contracts c ON p.contract_id = c.id
      WHERE c.tenant_id = ?
        AND p.status = 'paid'
        AND p.paid_date > p.due_date
    `);

    const results = tenants.map(t => {
      const stats = paymentStatsStmt.get(t.tenant_id) as any;
      const lateDays = avgDaysLateStmt.get(t.tenant_id) as any;

      const total = stats.total_payments || 0;
      const on_time = stats.on_time || 0;
      const late = stats.late || 0;
      const missed = stats.missed || 0;
      const on_time_rate = total > 0 ? Math.round((on_time / total) * 10000) / 100 : 100;

      let risk_score: 'low' | 'medium' | 'high';
      if (on_time_rate >= 90) risk_score = 'low';
      else if (on_time_rate >= 70) risk_score = 'medium';
      else risk_score = 'high';

      return {
        tenant_id: t.tenant_id,
        tenant_name: t.tenant_name,
        total_payments: total,
        on_time,
        late,
        missed,
        on_time_rate,
        risk_score,
        avg_days_late: Math.round((lateDays.avg_days || 0) * 10) / 10,
        active_contracts: t.active_contracts,
      };
    });

    // Sort by risk: high first, then medium, then low
    const riskOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    results.sort((a, b) => riskOrder[a.risk_score] - riskOrder[b.risk_score]);

    res.json(results);
  } catch (err) {
    console.error('Error in /tenant-risk:', err);
    res.status(500).json({ error: 'Failed to calculate tenant risk' });
  }
});

// ---------- 8. Market Pulse ----------
router.get('/market-pulse', (_req: Request, res: Response) => {
  try {
    // Recent transactions
    const recent_transactions = db.prepare(`
      SELECT id, area, building, property_type, rooms, actual_worth,
             meter_sale_price, area_sqm, transaction_date
      FROM dld_transactions
      ORDER BY transaction_date DESC
      LIMIT 10
    `).all();

    // Current avg (last 7 days) vs previous 30 days
    const currentAvg = db.prepare(`
      SELECT COALESCE(AVG(meter_sale_price), 0) as avg_price
      FROM dld_transactions
      WHERE transaction_date >= date('now', '-7 days')
    `).get() as any;

    const prevAvg = db.prepare(`
      SELECT COALESCE(AVG(meter_sale_price), 0) as avg_price
      FROM dld_transactions
      WHERE transaction_date >= date('now', '-30 days')
        AND transaction_date < date('now', '-7 days')
    `).get() as any;

    const current_avg = Math.round(currentAvg.avg_price * 100) / 100;
    const prev_avg = Math.round(prevAvg.avg_price * 100) / 100;
    const change_percent = prev_avg > 0
      ? Math.round(((current_avg - prev_avg) / prev_avg) * 10000) / 100
      : 0;

    let direction: 'up' | 'down' | 'flat';
    if (change_percent > 1) direction = 'up';
    else if (change_percent < -1) direction = 'down';
    else direction = 'flat';

    // Top 3 most active areas
    const top_areas = db.prepare(`
      SELECT
        area,
        COUNT(*) as transaction_count,
        ROUND(AVG(meter_sale_price), 2) as avg_price
      FROM dld_transactions
      WHERE transaction_date >= date('now', '-30 days')
      GROUP BY area
      ORDER BY transaction_count DESC
      LIMIT 3
    `).all();

    res.json({
      recent_transactions,
      trend: {
        current_avg,
        prev_avg,
        change_percent,
        direction,
      },
      top_areas,
    });
  } catch (err) {
    console.error('Error in /market-pulse:', err);
    res.status(500).json({ error: 'Failed to fetch market pulse data' });
  }
});

export default router;
