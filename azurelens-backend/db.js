const initSqlJs = require('sql.js');
const fs        = require('fs');
const path      = require('path');

const DB_PATH = path.join(__dirname, 'azurelens.db');

let db = null;

async function getDB() {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS resources (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      type          TEXT,
      location      TEXT,
      status        TEXT,
      size          TEXT,
      size_gb       INTEGER,
      idle_days     INTEGER DEFAULT 0,
      monthly_cost  REAL DEFAULT 0,
      waste_type    TEXT,
      severity      TEXT,
      last_scanned  TEXT
    );
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT
    );
    CREATE TABLE IF NOT EXISTS scan_history (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      scanned_at        TEXT NOT NULL,
      total_waste_cost  REAL DEFAULT 0,
      items_found       INTEGER DEFAULT 0,
      vms_scanned       INTEGER DEFAULT 0,
      disks_scanned     INTEGER DEFAULT 0
    );
  `);

  save();
  console.log('✅ Database ready');
  return db;
}

function save() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

module.exports = { getDB, save };