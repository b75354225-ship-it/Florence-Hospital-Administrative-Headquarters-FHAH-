-- Florence Hospital (FHAH) — database schema
-- Written in SQLite dialect (auto-created by server.js on first run).
-- An equivalent MySQL/Postgres version will look almost identical —
-- swap AUTOINCREMENT for AUTO_INCREMENT / SERIAL and TEXT for VARCHAR
-- if you migrate to a hosted MySQL or Postgres database later.

CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    department TEXT NOT NULL,
    appointment_date TEXT NOT NULL,
    appointment_time TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending | confirmed | cancelled
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS support_tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    category TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open', -- open | in_progress | resolved
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT NOT NULL,
    sent_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payer_name TEXT NOT NULL,
    invoice_number TEXT NOT NULL,
    payer_email TEXT NOT NULL,
    payer_phone TEXT NOT NULL,
    amount REAL NOT NULL,
    method TEXT NOT NULL, -- mobile_money | card | bank_transfer
    provider_reference TEXT,
    status TEXT NOT NULL DEFAULT 'initiated', -- initiated | successful | failed
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS donations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    donor_name TEXT NOT NULL,
    donor_email TEXT NOT NULL,
    donor_phone TEXT NOT NULL,
    amount REAL NOT NULL,
    anonymous INTEGER NOT NULL DEFAULT 0,
    provider_reference TEXT,
    status TEXT NOT NULL DEFAULT 'initiated', -- initiated | successful | failed
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
