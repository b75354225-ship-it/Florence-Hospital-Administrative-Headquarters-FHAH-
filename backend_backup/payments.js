// Lightweight file-based database — zero setup required.
// For production on a real host, point this at MySQL/Postgres instead
// (swap better-sqlite3 for mysql2 or pg, keep the same table shapes).

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'fhah.db');
const db = new Database(dbPath);

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

module.exports = db;
