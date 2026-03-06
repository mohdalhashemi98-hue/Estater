CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_id INTEGER REFERENCES units(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK(category IN ('maintenance','insurance','property_tax','utilities','management_fee','legal','cleaning','landscaping','pest_control','other')),
  amount REAL NOT NULL,
  expense_date TEXT NOT NULL,
  vendor_name TEXT,
  description TEXT,
  receipt_file TEXT,
  recurring INTEGER DEFAULT 0,
  recurring_frequency TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_expenses_property ON expenses(property_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
