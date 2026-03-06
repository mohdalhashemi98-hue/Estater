-- ADREC (Abu Dhabi Real Estate Centre) Transaction cache
CREATE TABLE IF NOT EXISTS adrec_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id TEXT UNIQUE,
  area TEXT NOT NULL,
  building TEXT,
  property_type TEXT,
  property_sub_type TEXT,
  reg_type TEXT,
  rooms TEXT,
  actual_worth REAL,
  meter_sale_price REAL,
  area_sqm REAL,
  transaction_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_adrec_area ON adrec_transactions(area);
CREATE INDEX IF NOT EXISTS idx_adrec_building ON adrec_transactions(building);
CREATE INDEX IF NOT EXISTS idx_adrec_date ON adrec_transactions(transaction_date);

-- Link user properties to ADREC areas
ALTER TABLE properties ADD COLUMN adrec_area TEXT;
ALTER TABLE properties ADD COLUMN adrec_building TEXT;
