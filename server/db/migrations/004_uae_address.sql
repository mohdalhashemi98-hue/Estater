-- Migration: Replace generic address/city with UAE address fields
-- Emirates: Abu Dhabi, Dubai, Sharjah, Ajman, Umm Al Quwain, Ras Al Khaimah, Fujairah

-- SQLite table rebuild to change columns
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

-- Copy existing data: city -> emirate, address -> street
INSERT INTO properties_new (id, name, type, emirate, city, street, notes, purchase_price, purchase_date, current_estimated_value, last_valuation_date, zillow_url, redfin_url, created_at, updated_at)
SELECT id, name, type,
    CASE WHEN city IN ('Abu Dhabi','Dubai','Sharjah','Ajman','Umm Al Quwain','Ras Al Khaimah','Fujairah')
         THEN city ELSE 'Dubai' END,
    CASE WHEN city NOT IN ('Abu Dhabi','Dubai','Sharjah','Ajman','Umm Al Quwain','Ras Al Khaimah','Fujairah')
         THEN city ELSE NULL END,
    address,
    notes, purchase_price, purchase_date, current_estimated_value, last_valuation_date, zillow_url, redfin_url, created_at, updated_at
FROM properties;

DROP TABLE properties;
ALTER TABLE properties_new RENAME TO properties;

PRAGMA foreign_keys = ON;
