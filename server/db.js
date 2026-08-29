// Base de datos SQLite (basada en node:sqlite, incluido en Node 22+).
// El archivo se crea en db/technova.db en la primera ejecución.
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const DB_DIR = path.join(__dirname, '..', 'db');
fs.mkdirSync(DB_DIR, { recursive: true });
const DB_PATH = path.join(DB_DIR, 'technova.db');

const db = new DatabaseSync(DB_PATH);

db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS customers (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT NOT NULL,
    phone     TEXT NOT NULL,
    email     TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    UNIQUE(phone)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    service     TEXT NOT NULL,
    fecha       TEXT,
    hora        TEXT,
    descripcion TEXT,
    status      TEXT NOT NULL DEFAULT 'pendiente',
    total       REAL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id  INTEGER NOT NULL REFERENCES orders(id),
    number    TEXT NOT NULL UNIQUE,
    subtotal  REAL NOT NULL,
    tax       REAL NOT NULL DEFAULT 0,
    total     REAL NOT NULL,
    issued_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    notes     TEXT
  );
`);

module.exports = db;
