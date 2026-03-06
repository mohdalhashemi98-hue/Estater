-- UAE Building Typologies: expand property type CHECK constraint
-- SQLite cannot alter CHECK constraints, so we rebuild the table

PRAGMA foreign_keys = OFF;

CREATE TABLE properties_new (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL,
    type            TEXT    NOT NULL CHECK(type IN (
        'villa','apartment','townhouse','penthouse','studio','duplex',
        'commercial','warehouse','office','retail',
        'land','mixed_use',
        'building','standalone'
    )),
    address         TEXT    NOT NULL,
    city            TEXT    NOT NULL,
    notes           TEXT,
    purchase_price       REAL,
    purchase_date        TEXT,
    current_estimated_value REAL,
    last_valuation_date  TEXT,
    zillow_url           TEXT,
    redfin_url           TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO properties_new SELECT * FROM properties;

DROP TABLE properties;

ALTER TABLE properties_new RENAME TO properties;

PRAGMA foreign_keys = ON;
