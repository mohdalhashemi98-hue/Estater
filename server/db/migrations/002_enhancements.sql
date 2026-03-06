-- Enhancement migration: AI analysis, calendar, valuations, mortgages

-- Contract AI Analysis
CREATE TABLE IF NOT EXISTS contract_ai_analysis (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_id           INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    file_id               INTEGER NOT NULL REFERENCES contract_files(id) ON DELETE CASCADE,
    extracted_start_date  TEXT,
    extracted_end_date    TEXT,
    extracted_payment_due TEXT,
    key_terms             TEXT,
    obligations           TEXT,
    summary               TEXT,
    raw_response          TEXT,
    milestones            TEXT,
    status                TEXT NOT NULL DEFAULT 'pending'
                              CHECK(status IN ('pending','processing','completed','failed')),
    error_message         TEXT,
    analyzed_at           TEXT,
    created_at            TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_contract ON contract_ai_analysis(contract_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_file ON contract_ai_analysis(file_id);

-- Google Calendar Tokens
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    access_token    TEXT NOT NULL,
    refresh_token   TEXT NOT NULL,
    token_type      TEXT NOT NULL DEFAULT 'Bearer',
    expiry_date     TEXT NOT NULL,
    scope           TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Calendar Events tracking
CREATE TABLE IF NOT EXISTS calendar_events (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    google_event_id TEXT NOT NULL UNIQUE,
    event_type      TEXT NOT NULL CHECK(event_type IN ('contract_end','payment_due','renewal_deadline','ai_milestone')),
    source_type     TEXT NOT NULL CHECK(source_type IN ('contract','payment','ai_analysis')),
    source_id       INTEGER NOT NULL,
    title           TEXT NOT NULL,
    event_date      TEXT NOT NULL,
    synced_at       TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_calendar_events_source ON calendar_events(source_type, source_id);

-- Property Valuations
CREATE TABLE IF NOT EXISTS property_valuations (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id     INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    valuation_date  TEXT NOT NULL,
    estimated_value REAL NOT NULL,
    source          TEXT NOT NULL CHECK(source IN ('manual','scraped','zillow','redfin','realtor')),
    confidence      TEXT CHECK(confidence IN ('high','medium','low')),
    notes           TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(property_id, valuation_date, source)
);
CREATE INDEX IF NOT EXISTS idx_valuations_property ON property_valuations(property_id);
CREATE INDEX IF NOT EXISTS idx_valuations_date ON property_valuations(valuation_date);

-- Mortgages
CREATE TABLE IF NOT EXISTS mortgages (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id       INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    lender_name       TEXT NOT NULL,
    loan_amount       REAL NOT NULL,
    interest_rate     REAL NOT NULL,
    term_months       INTEGER NOT NULL,
    start_date        TEXT NOT NULL,
    monthly_payment   REAL NOT NULL,
    remaining_balance REAL,
    loan_type         TEXT NOT NULL DEFAULT 'fixed'
                          CHECK(loan_type IN ('fixed','variable','interest_only')),
    account_number    TEXT,
    notes             TEXT,
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_mortgages_property ON mortgages(property_id);

-- Mortgage Payments
CREATE TABLE IF NOT EXISTS mortgage_payments (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    mortgage_id       INTEGER NOT NULL REFERENCES mortgages(id) ON DELETE CASCADE,
    payment_number    INTEGER NOT NULL,
    due_date          TEXT NOT NULL,
    principal         REAL NOT NULL,
    interest          REAL NOT NULL,
    total_amount      REAL NOT NULL,
    remaining_balance REAL NOT NULL,
    status            TEXT NOT NULL DEFAULT 'pending'
                          CHECK(status IN ('pending','paid','overdue')),
    paid_date         TEXT,
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(mortgage_id, payment_number)
);
CREATE INDEX IF NOT EXISTS idx_mortgage_payments_mortgage ON mortgage_payments(mortgage_id);

-- Add columns to properties table
ALTER TABLE properties ADD COLUMN purchase_price REAL;
ALTER TABLE properties ADD COLUMN purchase_date TEXT;
ALTER TABLE properties ADD COLUMN current_estimated_value REAL;
ALTER TABLE properties ADD COLUMN last_valuation_date TEXT;
ALTER TABLE properties ADD COLUMN zillow_url TEXT;
ALTER TABLE properties ADD COLUMN redfin_url TEXT;
