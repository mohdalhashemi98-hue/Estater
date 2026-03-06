CREATE TABLE IF NOT EXISTS reminder_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reminder_type TEXT NOT NULL CHECK(reminder_type IN ('payment_due','contract_expiry','maintenance')),
  days_before INTEGER NOT NULL DEFAULT 7,
  enabled INTEGER NOT NULL DEFAULT 1,
  notification_method TEXT NOT NULL DEFAULT 'webhook' CHECK(notification_method IN ('email','webhook')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reminder_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reminder_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  triggered_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'sent'
);

CREATE INDEX IF NOT EXISTS idx_reminder_logs_type ON reminder_logs(reminder_type);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_entity ON reminder_logs(entity_type, entity_id);

INSERT OR IGNORE INTO reminder_settings (id, reminder_type, days_before, enabled) VALUES
  (1, 'payment_due', 7, 1),
  (2, 'payment_due', 3, 1),
  (3, 'contract_expiry', 30, 1),
  (4, 'contract_expiry', 7, 1);
