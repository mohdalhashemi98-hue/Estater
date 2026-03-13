-- Seed demo data: 5 properties, 5 tenants, 5 contracts, max 4 rent checks each
-- Only inserts if no properties exist (first-run seed)

-- Clean existing demo data to start fresh
DELETE FROM payments;
DELETE FROM deposits;
DELETE FROM expenses;
DELETE FROM contracts;
DELETE FROM units;
DELETE FROM tenants;
DELETE FROM properties;

-- 5 Properties (different types across different emirates)
INSERT INTO properties (id, name, type, emirate, neighborhood, street, notes) VALUES
  (1, 'Marina Heights Tower', 'apartment', 'Dubai', 'Dubai Marina', 'Al Marsa Street', 'Waterfront residential tower with marina views'),
  (2, 'Saadiyat Beach Villa', 'villa', 'Abu Dhabi', 'Saadiyat Island', 'Beach Promenade Rd', 'Beachfront luxury villa with private garden'),
  (3, 'Business Bay Office', 'office', 'Dubai', 'Business Bay', 'Bay Avenue', 'Grade A office space on the 18th floor'),
  (4, 'Al Majaz Townhouse', 'townhouse', 'Sharjah', 'Al Majaz', 'Corniche St', 'Modern 3-storey townhouse near the lagoon'),
  (5, 'JBR Penthouse', 'penthouse', 'Dubai', 'Jumeirah Beach Residence', 'The Walk', 'Full-floor penthouse with panoramic sea view');

-- 5 Units (one per property)
INSERT INTO units (id, property_id, unit_number, floor, bedrooms, bathrooms, area_sqm, status) VALUES
  (1, 1, '1204', '12', 2, 2, 120, 'occupied'),
  (2, 2, 'V-08', 'G',  4, 5, 450, 'occupied'),
  (3, 3, '1801', '18', NULL, 1, 95, 'occupied'),
  (4, 4, 'TH-3', 'G',  3, 3, 280, 'occupied'),
  (5, 5, 'PH-1', '42', 3, 4, 310, 'occupied');

-- 5 Tenants
INSERT INTO tenants (id, first_name, last_name, email, phone, id_number, company_name) VALUES
  (1, 'Ahmed',   'Al Maktoum',  'ahmed.mak@email.com',   '+971501234567', '784-1990-1234567-1', NULL),
  (2, 'Sarah',   'Johnson',     'sarah.j@company.ae',    '+971552345678', '784-1985-2345678-2', 'Nexus Consulting'),
  (3, 'Omar',    'Khalil',      'omar.k@techhub.ae',     '+971503456789', '784-1992-3456789-3', 'TechHub FZ-LLC'),
  (4, 'Fatima',  'Al Hosani',   'fatima.h@email.com',    '+971564567890', '784-1988-4567890-4', NULL),
  (5, 'Raj',     'Patel',       'raj.p@globalfirm.com',  '+971505678901', '784-1991-5678901-5', 'Global Trading LLC');

-- 5 Contracts (different payment frequencies, max 4 total_payments)
INSERT INTO contracts (id, unit_id, tenant_id, start_date, end_date, rent_amount, payment_frequency, total_payments, status, currency) VALUES
  (1, 1, 1, '2025-06-01', '2026-05-31', 22000,  'quarterly',    4, 'active', 'AED'),
  (2, 2, 2, '2025-04-01', '2026-03-31', 55000,  'quarterly',    4, 'active', 'AED'),
  (3, 3, 3, '2025-09-01', '2026-08-31', 18000,  'quarterly',    4, 'active', 'AED'),
  (4, 4, 4, '2025-07-01', '2026-06-30', 36000,  'semi_annual',  2, 'active', 'AED'),
  (5, 5, 5, '2025-03-01', '2026-02-28', 120000, 'semi_annual',  2, 'active', 'AED');

-- Payments (rent checks) — max 4 per contract
-- Contract 1: quarterly (4 checks)
INSERT INTO payments (contract_id, payment_number, due_date, amount, status, currency) VALUES
  (1, 1, '2025-06-01', 22000, 'paid',    'AED'),
  (1, 2, '2025-09-01', 22000, 'paid',    'AED'),
  (1, 3, '2025-12-01', 22000, 'paid',    'AED'),
  (1, 4, '2026-03-01', 22000, 'pending', 'AED');

-- Contract 2: quarterly (4 checks)
INSERT INTO payments (contract_id, payment_number, due_date, amount, status, currency) VALUES
  (2, 1, '2025-04-01', 55000, 'paid',    'AED'),
  (2, 2, '2025-07-01', 55000, 'paid',    'AED'),
  (2, 3, '2025-10-01', 55000, 'paid',    'AED'),
  (2, 4, '2026-01-01', 55000, 'paid',    'AED');

-- Contract 3: quarterly (4 checks)
INSERT INTO payments (contract_id, payment_number, due_date, amount, status, currency) VALUES
  (3, 1, '2025-09-01', 18000, 'paid',    'AED'),
  (3, 2, '2025-12-01', 18000, 'paid',    'AED'),
  (3, 3, '2026-03-01', 18000, 'pending', 'AED'),
  (3, 4, '2026-06-01', 18000, 'pending', 'AED');

-- Contract 4: semi-annual (2 checks)
INSERT INTO payments (contract_id, payment_number, due_date, amount, status, currency) VALUES
  (4, 1, '2025-07-01', 36000, 'paid',    'AED'),
  (4, 2, '2026-01-01', 36000, 'paid',    'AED');

-- Contract 5: semi-annual (2 checks)
INSERT INTO payments (contract_id, payment_number, due_date, amount, status, currency) VALUES
  (5, 1, '2025-03-01', 120000, 'paid',    'AED'),
  (5, 2, '2025-09-01', 120000, 'paid',    'AED');

-- 5 Deposits (one per contract)
INSERT INTO deposits (contract_id, amount, date_received, status) VALUES
  (1, 22000,  '2025-05-28', 'held'),
  (2, 55000,  '2025-03-25', 'held'),
  (3, 18000,  '2025-08-28', 'held'),
  (4, 36000,  '2025-06-28', 'held'),
  (5, 120000, '2025-02-25', 'held');

-- A few expenses across properties
INSERT INTO expenses (property_id, unit_id, category, amount, expense_date, vendor_name, description, currency) VALUES
  (1, 1, 'maintenance',    1500,  '2025-08-15', 'CoolTech AC Services',   'Annual AC servicing',            'AED'),
  (2, 2, 'landscaping',    3200,  '2025-06-10', 'Green Oasis LLC',        'Garden maintenance Q2',          'AED'),
  (3, 3, 'cleaning',       800,   '2025-10-01', 'SparkClean',             'Deep office cleaning',           'AED'),
  (4, 4, 'insurance',      4500,  '2025-07-15', 'Aman Insurance',         'Annual property insurance',      'AED'),
  (5, 5, 'maintenance',    6000,  '2025-05-20', 'Marina Facility Mgmt',   'Plumbing & fixture replacement', 'AED');
