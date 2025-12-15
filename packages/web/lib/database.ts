/**
 * SQLite Database for AkhAI
 *
 * Provides persistent storage for queries, events, and usage statistics.
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'akhai.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS queries (
    id TEXT PRIMARY KEY,
    query TEXT NOT NULL,
    flow TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    result TEXT,
    tokens_used INTEGER DEFAULT 0,
    cost REAL DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    completed_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query_id TEXT NOT NULL,
    type TEXT NOT NULL,
    data TEXT,
    timestamp INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (query_id) REFERENCES queries(id)
  );

  CREATE TABLE IF NOT EXISTS usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    cost REAL NOT NULL,
    timestamp INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE INDEX IF NOT EXISTS idx_queries_created_at ON queries(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_queries_status ON queries(status);
  CREATE INDEX IF NOT EXISTS idx_events_query_id ON events(query_id);
  CREATE INDEX IF NOT EXISTS idx_usage_provider ON usage(provider);
  CREATE INDEX IF NOT EXISTS idx_usage_timestamp ON usage(timestamp);
`);

console.log(`✅ Database initialized: ${dbPath}`);

export { db };

/**
 * Create a new query
 */
export function createQuery(id: string, query: string, flow: string) {
  const stmt = db.prepare('INSERT INTO queries (id, query, flow) VALUES (?, ?, ?)');
  stmt.run(id, query, flow);
}

/**
 * Update query details
 */
export function updateQuery(
  id: string,
  updates: {
    status?: string;
    result?: string;
    tokens_used?: number;
    cost?: number;
  }
) {
  const fields = Object.keys(updates);
  if (fields.length === 0) return;

  const sets = fields.map((f) => `${f} = ?`).join(', ');
  const values = fields.map((f) => updates[f as keyof typeof updates]);

  const stmt = db.prepare(
    `UPDATE queries SET ${sets}, completed_at = strftime('%s', 'now') WHERE id = ?`
  );
  stmt.run(...values, id);
}

/**
 * Get a query by ID
 */
export function getQuery(id: string) {
  const stmt = db.prepare('SELECT * FROM queries WHERE id = ?');
  return stmt.get(id);
}

/**
 * Add an event to a query
 */
export function addEvent(queryId: string, type: string, data: any) {
  const stmt = db.prepare('INSERT INTO events (query_id, type, data) VALUES (?, ?, ?)');
  stmt.run(queryId, type, JSON.stringify(data));
}

/**
 * Get events for a query
 */
export function getEvents(queryId: string, offset: number = 0) {
  const stmt = db.prepare(
    'SELECT * FROM events WHERE query_id = ? ORDER BY id ASC LIMIT -1 OFFSET ?'
  );
  return stmt.all(queryId, offset) as Array<{
    id: number;
    query_id: string;
    type: string;
    data: string;
    timestamp: number;
  }>;
}

/**
 * Track API usage
 */
export function trackUsage(
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
  cost: number
) {
  const stmt = db.prepare(
    'INSERT INTO usage (provider, model, input_tokens, output_tokens, cost) VALUES (?, ?, ?, ?, ?)'
  );
  stmt.run(provider, model, inputTokens, outputTokens, cost);
}

/**
 * Get dashboard statistics
 */
export function getStats() {
  const now = Math.floor(Date.now() / 1000);
  const todayStart = now - (now % 86400);

  // Start of current month
  const date = new Date();
  const monthStart = Math.floor(new Date(date.getFullYear(), date.getMonth(), 1).getTime() / 1000);

  const queriesToday = db
    .prepare('SELECT COUNT(*) as count FROM queries WHERE created_at >= ?')
    .get(todayStart) as any;

  const queriesMonth = db
    .prepare('SELECT COUNT(*) as count FROM queries WHERE created_at >= ?')
    .get(monthStart) as any;

  const totals = db
    .prepare('SELECT SUM(tokens_used) as tokens, SUM(cost) as cost FROM queries')
    .get() as any;

  const avgTime = db
    .prepare(
      "SELECT AVG(completed_at - created_at) as avg FROM queries WHERE status = 'complete' AND completed_at IS NOT NULL"
    )
    .get() as any;

  const providerStats = db
    .prepare(
      `SELECT provider, COUNT(*) as queries, SUM(cost) as cost
       FROM usage
       GROUP BY provider`
    )
    .all() as Array<{ provider: string; queries: number; cost: number }>;

  return {
    queriesToday: queriesToday?.count || 0,
    queriesThisMonth: queriesMonth?.count || 0,
    totalTokens: totals?.tokens || 0,
    totalCost: totals?.cost || 0,
    avgResponseTime: avgTime?.avg || 0,
    providerStats,
  };
}

/**
 * Get recent queries
 */
export function getRecentQueries(limit: number = 10) {
  const stmt = db.prepare(`
    SELECT id, query, flow, status, created_at, completed_at
    FROM queries
    ORDER BY created_at DESC
    LIMIT ?
  `);
  return stmt.all(limit) as Array<{
    id: string;
    query: string;
    flow: string;
    status: string;
    created_at: number;
    completed_at: number | null;
  }>;
}

/**
 * Close database connection (for graceful shutdown)
 */
export function closeDatabase() {
  db.close();
  console.log('Database connection closed');
}
