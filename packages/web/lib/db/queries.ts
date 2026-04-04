import { db } from '@/lib/database';

/**
 * Create a new query
 */
export function createQuery(id: string, query: string, flow: string, userId?: string | null) {
  const stmt = db.prepare('INSERT INTO queries (id, query, flow, user_id) VALUES (?, ?, ?, ?)');
  stmt.run(id, query, flow, userId || null);
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
    gnostic_metadata?: string | null;
  },
  userId: string | null
) {
  const fields = Object.keys(updates);
  if (fields.length === 0) return;

  const sets = fields.map((f) => `${f} = ?`).join(', ');
  const values = fields.map((f) => updates[f as keyof typeof updates]);

  // Handle both authenticated and anonymous users
  let stmt;
  if (userId) {
    stmt = db.prepare(
      `UPDATE queries SET ${sets}, completed_at = strftime('%s', 'now') WHERE id = ? AND user_id = ?`
    );
    stmt.run(...values, id, userId);
  } else {
    // For anonymous users, just match by ID
    stmt = db.prepare(
      `UPDATE queries SET ${sets}, completed_at = strftime('%s', 'now') WHERE id = ?`
    );
    stmt.run(...values, id);
  }
}

/**
 * Get a query by ID (optionally scoped to user)
 */
export function getQuery(id: string, userId?: string | null) {
  if (userId) {
    const stmt = db.prepare('SELECT * FROM queries WHERE id = ? AND user_id = ?');
    return stmt.get(id, userId);
  }
  const stmt = db.prepare('SELECT * FROM queries WHERE id = ?');
  return stmt.get(id);
}

/**
 * Get recent queries (scoped to user or session)
 */
export function getRecentQueries(
  limit: number = 10,
  userId?: string | null,
  sessionId?: string | null
) {
  // If user is authenticated, show their queries + legacy queries without user_id
  if (userId) {
    const stmt = db.prepare(`
      SELECT id, query, flow, status, created_at, completed_at, tokens_used, cost
      FROM queries
      WHERE user_id = ? OR user_id IS NULL
      ORDER BY created_at DESC
      LIMIT ?
    `);
    return stmt.all(userId, limit) as Array<{
      id: string;
      query: string;
      flow: string;
      status: string;
      created_at: number;
      completed_at: number | null;
      tokens_used: number;
      cost: number;
    }>;
  }

  // If anonymous user with session, show their session queries + legacy queries
  if (sessionId) {
    const stmt = db.prepare(`
      SELECT id, query, flow, status, created_at, completed_at, tokens_used, cost
      FROM queries
      WHERE session_id = ? OR (session_id IS NULL OR session_id = '')
      ORDER BY created_at DESC
      LIMIT ?
    `);
    return stmt.all(sessionId, limit) as Array<{
      id: string;
      query: string;
      flow: string;
      status: string;
      created_at: number;
      completed_at: number | null;
      tokens_used: number;
      cost: number;
    }>;
  }

  // No user, no session = no data
  return [];
}
