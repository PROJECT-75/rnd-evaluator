const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'proposals.db'));

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

module.exports = db;
