PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS properties (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL,
    type            TEXT    NOT NULL CHECK(type IN (
        'villa','apartment','townhouse','penthouse','studio','duplex',
        'commercial','warehouse','office','retail',
        'land','mixed_use',
        'building','standalone'
    )),
    emirate         TEXT    NOT NULL DEFAULT 'Dubai',
    city            TEXT,
    neighborhood    TEXT,
    street          TEXT,
    villa_number    TEXT,
    notes           TEXT,
    purchase_price  REAL,
    purchase_date   TEXT,
    current_estimated_value REAL,
    last_valuation_date TEXT,
    zillow_url      TEXT,
    redfin_url      TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS units (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id     INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_number     TEXT    NOT NULL,
    floor           TEXT,
    bedrooms        INTEGER,
    bathrooms       INTEGER,
    area_sqm        REAL,
    status          TEXT    NOT NULL DEFAULT 'vacant'
                        CHECK(status IN ('vacant','occupied','maintenance')),
    notes           TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(property_id, unit_number)
);

CREATE TABLE IF NOT EXISTS tenants (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name      TEXT    NOT NULL,
    last_name       TEXT    NOT NULL,
    email           TEXT,
    phone           TEXT    NOT NULL,
    id_number       TEXT,
    company_name    TEXT,
    notes           TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contracts (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_id         INTEGER NOT NULL REFERENCES units(id),
    tenant_id       INTEGER NOT NULL REFERENCES tenants(id),
    start_date      TEXT    NOT NULL,
    end_date        TEXT    NOT NULL,
    rent_amount     REAL    NOT NULL,
    payment_frequency TEXT  NOT NULL DEFAULT 'monthly'
                        CHECK(payment_frequency IN ('monthly','quarterly','semi_annual','annual')),
    total_payments  INTEGER NOT NULL,
    status          TEXT    NOT NULL DEFAULT 'active'
                        CHECK(status IN ('draft','active','expired','terminated','renewed')),
    renewal_of      INTEGER REFERENCES contracts(id),
    notes           TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    CHECK(end_date > start_date)
);

CREATE TABLE IF NOT EXISTS payments (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_id     INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    payment_number  INTEGER NOT NULL,
    due_date        TEXT    NOT NULL,
    amount          REAL    NOT NULL,
    status          TEXT    NOT NULL DEFAULT 'pending'
                        CHECK(status IN ('pending','paid','overdue','cancelled')),
    paid_date       TEXT,
    payment_method  TEXT    CHECK(payment_method IN ('check','bank_transfer','cash','other')),
    reference       TEXT,
    notes           TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(contract_id, payment_number)
);

CREATE TABLE IF NOT EXISTS deposits (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_id     INTEGER NOT NULL REFERENCES contracts(id),
    amount          REAL    NOT NULL,
    date_received   TEXT    NOT NULL,
    status          TEXT    NOT NULL DEFAULT 'held'
                        CHECK(status IN ('held','partially_refunded','refunded','forfeited')),
    refund_amount   REAL,
    refund_date     TEXT,
    refund_reason   TEXT,
    notes           TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contract_files (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_id     INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    original_name   TEXT    NOT NULL,
    stored_name     TEXT    NOT NULL,
    mime_type       TEXT    NOT NULL,
    size_bytes      INTEGER NOT NULL,
    uploaded_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_contract_files_contract ON contract_files(contract_id);
CREATE INDEX IF NOT EXISTS idx_units_property      ON units(property_id);
CREATE INDEX IF NOT EXISTS idx_units_status         ON units(status);
CREATE INDEX IF NOT EXISTS idx_contracts_unit       ON contracts(unit_id);
CREATE INDEX IF NOT EXISTS idx_contracts_tenant     ON contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status     ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date   ON contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_payments_contract    ON payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_payments_due_date    ON payments(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_status      ON payments(status);
CREATE INDEX IF NOT EXISTS idx_deposits_contract    ON deposits(contract_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status      ON deposits(status);
