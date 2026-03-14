CREATE TABLE IF NOT EXISTS maintenance_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_id INTEGER REFERENCES units(id) ON DELETE SET NULL,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general' CHECK(category IN ('plumbing', 'electrical', 'ac_hvac', 'structural', 'pest_control', 'painting', 'appliance', 'cleaning', 'general')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'reported' CHECK(status IN ('reported', 'in_progress', 'resolved', 'cancelled')),
  reported_date TEXT NOT NULL DEFAULT (date('now')),
  resolved_date TEXT,
  cost REAL,
  vendor_name TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_maintenance_property ON maintenance_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_requests(status);
