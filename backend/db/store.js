/**
 * store.js
 * --------
 * Tiny storage layer for evaluated proposals.
 *
 *  - Normally uses SQLite (better-sqlite3).
 *  - On Vercel the only writable folder is /tmp, so the database lives there.
 *  - If the native SQLite module can't load (possible on serverless hosts),
 *    it falls back to an in-memory list so the app keeps working instead of crashing.
 *
 * Note: on serverless/free hosts, saved evaluations are temporary either way —
 * fine for a demo; a production system would use a hosted database.
 */
const path = require('path');

const DB_PATH = process.env.DB_PATH
  || (process.env.VERCEL ? '/tmp/proposals.db' : path.join(__dirname, 'proposals.db'));

const COLUMNS = ['title', 'proposer', 'proposal_text', 'requested_budget', 'scope_summary', 'novelty_score',
  'novelty_reasoning', 'financial_flag', 'financial_reasoning', 'overall_score'];

function createSqliteStore() {
  const Database = require('better-sqlite3');
  const db = new Database(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS proposals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      proposer TEXT,
      proposal_text TEXT NOT NULL,
      requested_budget REAL,
      scope_summary TEXT,
      novelty_score INTEGER,
      novelty_reasoning TEXT,
      financial_flag TEXT,
      financial_reasoning TEXT,
      overall_score REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  const insert = db.prepare(`INSERT INTO proposals (${COLUMNS.join(', ')}) VALUES (${COLUMNS.map(() => '?').join(', ')})`);
  return {
    kind: 'sqlite',
    insert: (row) => insert.run(...COLUMNS.map((c) => row[c] ?? null)).lastInsertRowid,
    all: () => db.prepare('SELECT * FROM proposals ORDER BY created_at DESC, id DESC').all(),
    get: (id) => db.prepare('SELECT * FROM proposals WHERE id = ?').get(id),
    remove: (id) => db.prepare('DELETE FROM proposals WHERE id = ?').run(id)
  };
}

function createMemoryStore() {
  const rows = [];
  let nextId = 1;
  const now = () => new Date().toISOString().slice(0, 19).replace('T', ' ');
  return {
    kind: 'memory',
    insert: (row) => {
      const id = nextId++;
      rows.push({ id, ...Object.fromEntries(COLUMNS.map((c) => [c, row[c] ?? null])), created_at: now() });
      return id;
    },
    all: () => [...rows].reverse(),
    get: (id) => rows.find((r) => r.id === Number(id)),
    remove: (id) => {
      const i = rows.findIndex((r) => r.id === Number(id));
      if (i >= 0) rows.splice(i, 1);
    }
  };
}

let store;
try {
  store = createSqliteStore();
} catch (err) {
  console.warn(`[store] SQLite unavailable (${err.message}) — using in-memory storage instead.`);
  store = createMemoryStore();
}

module.exports = store;
