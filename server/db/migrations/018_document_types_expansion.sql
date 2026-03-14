-- Expand doc_type CHECK constraint to include mortgage_contract and payment_schedule
-- SQLite cannot ALTER CHECK constraints, so we recreate the table

PRAGMA foreign_keys=OFF;

CREATE TABLE documents_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL CHECK(entity_type IN ('property','tenant','contract','unit')),
  entity_id INTEGER NOT NULL,
  doc_type TEXT NOT NULL DEFAULT 'other' CHECK(doc_type IN ('title_deed','ejari','tawtheeq','emirates_id','passport','visa','insurance','service_charge','noc','trade_license','mortgage_contract','payment_schedule','other')),
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  expiry_date TEXT,
  reference_number TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','expired','archived')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

INSERT INTO documents_new SELECT * FROM documents;

DROP TABLE documents;

ALTER TABLE documents_new RENAME TO documents;

CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_expiry ON documents(expiry_date);
CREATE INDEX IF NOT EXISTS idx_documents_doc_type ON documents(doc_type);

PRAGMA foreign_keys=ON;
