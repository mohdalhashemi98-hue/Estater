-- DLD Transaction cache
CREATE TABLE IF NOT EXISTS dld_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id TEXT UNIQUE,
  area TEXT NOT NULL,
  building TEXT,
  project TEXT,
  property_type TEXT,
  property_sub_type TEXT,
  reg_type TEXT,
  rooms TEXT,
  actual_worth REAL,
  meter_sale_price REAL,
  area_sqm REAL,
  transaction_date TEXT,
  buyer_count INTEGER,
  seller_count INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_dld_area ON dld_transactions(area);
CREATE INDEX IF NOT EXISTS idx_dld_building ON dld_transactions(building);
CREATE INDEX IF NOT EXISTS idx_dld_date ON dld_transactions(transaction_date);

-- Link user properties to DLD areas/buildings
CREATE TABLE IF NOT EXISTS property_dld_match (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  dld_area TEXT,
  dld_building TEXT,
  dld_project TEXT,
  match_confidence TEXT DEFAULT 'manual',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Add DLD columns to properties
ALTER TABLE properties ADD COLUMN dld_area TEXT;
ALTER TABLE properties ADD COLUMN dld_building TEXT;
ALTER TABLE properties ADD COLUMN dld_project TEXT;
