import db from '../db/connection.js';

export function portfolioOverview(): any {
  const properties = db.prepare(`
    SELECT p.*,
      (SELECT COUNT(*) FROM units u WHERE u.property_id = p.id) as unit_count,
      (SELECT COUNT(*) FROM units u WHERE u.property_id = p.id AND u.status = 'occupied') as occupied_count,
      (SELECT COALESCE(SUM(pay.amount), 0) FROM payments pay
       JOIN contracts c ON pay.contract_id = c.id
       JOIN units u ON c.unit_id = u.id
       WHERE u.property_id = p.id AND pay.status = 'paid') as total_revenue,
      (SELECT COALESCE(SUM(e.amount), 0) FROM expenses e WHERE e.property_id = p.id) as total_expenses
    FROM properties p ORDER BY p.name
  `).all();

  return {
    title: 'Portfolio Overview',
    generated_at: new Date().toISOString(),
    data: properties,
  };
}

export function propertyPnL(propertyId: number, fromDate?: string, toDate?: string): any {
  const where_date_pay = fromDate ? `AND pay.paid_date >= '${fromDate}' AND pay.paid_date <= '${toDate || new Date().toISOString().split('T')[0]}'` : '';
  const where_date_exp = fromDate ? `AND e.expense_date >= '${fromDate}' AND e.expense_date <= '${toDate || new Date().toISOString().split('T')[0]}'` : '';

  const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(propertyId) as any;
  if (!property) throw new Error('Property not found');

  const income = db.prepare(`
    SELECT COALESCE(SUM(pay.amount), 0) as total
    FROM payments pay
    JOIN contracts c ON pay.contract_id = c.id
    JOIN units u ON c.unit_id = u.id
    WHERE u.property_id = ? AND pay.status = 'paid' ${where_date_pay}
  `).get(propertyId) as any;

  const expenses = db.prepare(`
    SELECT category, SUM(amount) as total
    FROM expenses e WHERE e.property_id = ? ${where_date_exp}
    GROUP BY category
  `).all(propertyId) as any[];

  const totalExpenses = expenses.reduce((s: number, e: any) => s + e.total, 0);

  return {
    title: `P&L Report - ${property.name}`,
    generated_at: new Date().toISOString(),
    data: {
      property_name: property.name,
      total_income: income.total,
      expenses_by_category: expenses,
      total_expenses: totalExpenses,
      net_income: income.total - totalExpenses,
    },
  };
}

export function rentRoll(): any {
  const rows = db.prepare(`
    SELECT c.id as contract_id, t.first_name || ' ' || t.last_name as tenant_name,
           p.name as property_name, u.unit_number,
           c.rent_amount, c.payment_frequency, c.start_date, c.end_date, c.status,
           c.currency
    FROM contracts c
    JOIN tenants t ON c.tenant_id = t.id
    JOIN units u ON c.unit_id = u.id
    JOIN properties p ON u.property_id = p.id
    WHERE c.status = 'active'
    ORDER BY p.name, u.unit_number
  `).all();

  return {
    title: 'Rent Roll',
    generated_at: new Date().toISOString(),
    data: rows,
  };
}

export function paymentHistory(propertyId?: number, fromDate?: string, toDate?: string): any {
  let where = "WHERE pay.status = 'paid'";
  const params: any[] = [];

  if (propertyId) { where += ' AND u.property_id = ?'; params.push(propertyId); }
  if (fromDate) { where += ' AND pay.paid_date >= ?'; params.push(fromDate); }
  if (toDate) { where += ' AND pay.paid_date <= ?'; params.push(toDate); }

  const rows = db.prepare(`
    SELECT pay.*, t.first_name || ' ' || t.last_name as tenant_name,
           p.name as property_name, u.unit_number
    FROM payments pay
    JOIN contracts c ON pay.contract_id = c.id
    JOIN tenants t ON c.tenant_id = t.id
    JOIN units u ON c.unit_id = u.id
    JOIN properties p ON u.property_id = p.id
    ${where}
    ORDER BY pay.paid_date DESC
  `).all(...params);

  return {
    title: 'Payment History',
    generated_at: new Date().toISOString(),
    data: rows,
  };
}

export function occupancyReport(): any {
  const units = db.prepare(`
    SELECT u.*, p.name as property_name,
           c.tenant_id, t.first_name || ' ' || t.last_name as tenant_name,
           c.start_date as contract_start, c.end_date as contract_end, c.rent_amount
    FROM units u
    JOIN properties p ON p.id = u.property_id
    LEFT JOIN contracts c ON c.unit_id = u.id AND c.status = 'active'
    LEFT JOIN tenants t ON t.id = c.tenant_id
    ORDER BY p.name, u.unit_number
  `).all();

  const total = units.length;
  const occupied = units.filter((u: any) => u.status === 'occupied').length;

  return {
    title: 'Occupancy Report',
    generated_at: new Date().toISOString(),
    data: {
      total_units: total,
      occupied_units: occupied,
      vacant_units: total - occupied,
      occupancy_rate: total > 0 ? ((occupied / total) * 100).toFixed(1) : '0',
      units,
    },
  };
}
