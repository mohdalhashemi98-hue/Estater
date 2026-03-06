CREATE TABLE IF NOT EXISTS currencies (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  exchange_rate REAL NOT NULL DEFAULT 1.0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO currencies (code, name, symbol, exchange_rate) VALUES
  ('AED', 'UAE Dirham', 'د.إ', 1.0),
  ('USD', 'US Dollar', '$', 3.6725),
  ('EUR', 'Euro', '€', 3.98),
  ('GBP', 'British Pound', '£', 4.65),
  ('SAR', 'Saudi Riyal', '﷼', 0.9793),
  ('INR', 'Indian Rupee', '₹', 0.0447);

ALTER TABLE contracts ADD COLUMN currency TEXT DEFAULT 'AED';
ALTER TABLE payments ADD COLUMN currency TEXT DEFAULT 'AED';
ALTER TABLE expenses ADD COLUMN currency TEXT DEFAULT 'AED';
ALTER TABLE mortgages ADD COLUMN currency TEXT DEFAULT 'AED';
ALTER TABLE property_valuations ADD COLUMN currency TEXT DEFAULT 'AED';
