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
  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT,
    email TEXT,
    avatar_url TEXT,
    auth_provider TEXT NOT NULL,
    auth_id TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    UNIQUE(auth_provider, auth_id)
  );

  -- Sessions table
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at INTEGER NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- Queries table (with user_id support)
  CREATE TABLE IF NOT EXISTS queries (
    id TEXT PRIMARY KEY,
    query TEXT NOT NULL,
    flow TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    result TEXT,
    tokens_used INTEGER DEFAULT 0,
    cost REAL DEFAULT 0,
    user_id TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    completed_at INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id)
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

  -- Side Canal: Topics table
  CREATE TABLE IF NOT EXISTS topics (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    user_id TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(name, user_id)
  );

  -- Side Canal: Topic relationships
  CREATE TABLE IF NOT EXISTS topic_relationships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_from TEXT NOT NULL,
    topic_to TEXT NOT NULL,
    relationship_type TEXT DEFAULT 'related',
    strength REAL DEFAULT 1.0,
    user_id TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (topic_from) REFERENCES topics(id),
    FOREIGN KEY (topic_to) REFERENCES topics(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(topic_from, topic_to, relationship_type, user_id)
  );

  -- Side Canal: Query-Topic mapping
  CREATE TABLE IF NOT EXISTS query_topics (
    query_id TEXT NOT NULL,
    topic_id TEXT NOT NULL,
    relevance REAL DEFAULT 1.0,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    PRIMARY KEY (query_id, topic_id),
    FOREIGN KEY (query_id) REFERENCES queries(id),
    FOREIGN KEY (topic_id) REFERENCES topics(id)
  );

  -- Side Canal: Synopses
  CREATE TABLE IF NOT EXISTS synopses (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL,
    content TEXT NOT NULL,
    query_ids TEXT NOT NULL,
    user_id TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (topic_id) REFERENCES topics(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- Indexes
  CREATE INDEX IF NOT EXISTS idx_queries_created_at ON queries(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_queries_status ON queries(status);
  -- Note: idx_queries_user_id will be created after migration
  CREATE INDEX IF NOT EXISTS idx_events_query_id ON events(query_id);
  CREATE INDEX IF NOT EXISTS idx_usage_provider ON usage(provider);
  CREATE INDEX IF NOT EXISTS idx_usage_timestamp ON usage(timestamp);
  CREATE INDEX IF NOT EXISTS idx_topics_user_id ON topics(user_id);
  CREATE INDEX IF NOT EXISTS idx_topics_name ON topics(name);
  CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
  CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
`);

console.log(`✅ Database initialized: ${dbPath}`);

export { db };

export function getDatabase() {
  return db;
}

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
  },
  userId: string | null
) {
  const fields = Object.keys(updates);
  if (fields.length === 0) return;

  const sets = fields.map((f) => `${f} = ?`).join(', ');
  const values = fields.map((f) => updates[f as keyof typeof updates]);

  const stmt = db.prepare(
    `UPDATE queries SET ${sets}, completed_at = strftime('%s', 'now') WHERE id = ? AND user_id = ?`
  );
  stmt.run(...values, id, userId);
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
 * Get dashboard statistics (optionally scoped to user)
 */
export function getStats(userId?: string | null) {
  const now = Math.floor(Date.now() / 1000);
  const todayStart = now - (now % 86400);

  // Start of current month
  const date = new Date();
  const monthStart = Math.floor(new Date(date.getFullYear(), date.getMonth(), 1).getTime() / 1000);

  const userFilter = userId ? 'AND user_id = ?' : '';
  const userParams = userId ? [userId] : [];

  const queriesToday = db
    .prepare(`SELECT COUNT(*) as count FROM queries WHERE created_at >= ? ${userFilter}`)
    .get(...(userId ? [todayStart, userId] : [todayStart])) as any;

  const queriesMonth = db
    .prepare(`SELECT COUNT(*) as count FROM queries WHERE created_at >= ? ${userFilter}`)
    .get(...(userId ? [monthStart, userId] : [monthStart])) as any;

  const totals = db
    .prepare(`SELECT SUM(tokens_used) as tokens, SUM(cost) as cost FROM queries ${userId ? 'WHERE user_id = ?' : ''}`)
    .get(...userParams) as any;

  const avgTime = db
    .prepare(
      `SELECT AVG(completed_at - created_at) as avg FROM queries WHERE status = 'complete' AND completed_at IS NOT NULL ${userFilter}`
    )
    .get(...userParams) as any;

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
 * Get recent queries (optionally scoped to user)
 */
export function getRecentQueries(limit: number = 10, userId?: string | null) {
  if (userId) {
    const stmt = db.prepare(`
      SELECT id, query, flow, status, created_at, completed_at, tokens_used, cost
      FROM queries
      WHERE user_id = ?
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
  const stmt = db.prepare(`
    SELECT id, query, flow, status, created_at, completed_at, tokens_used, cost
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
    tokens_used: number;
    cost: number;
  }>;
}

/**
 * Close database connection (for graceful shutdown)
 */
export function closeDatabase() {
  db.close();
  console.log('Database connection closed');
}

/**
 * Migration: Add user_id columns to existing tables if they don't exist
 * SQLite doesn't support ALTER TABLE ADD COLUMN IF NOT EXISTS, so we check first
 */
export function migrateAddUserIdColumns() {
  try {
    console.log('[DEBUG] Starting migration: migrateAddUserIdColumns');
    // Check if user_id column exists in queries table
    const queriesInfo = db.prepare("PRAGMA table_info(queries)").all() as Array<{ name: string }>;
    const hasUserIdInQueries = queriesInfo.some(col => col.name === 'user_id');
    console.log('[DEBUG] Queries table columns:', queriesInfo.map(c => c.name), 'hasUserId:', hasUserIdInQueries);
    
    if (!hasUserIdInQueries) {
      console.log('[DEBUG] Adding user_id column to queries table');
      db.exec('ALTER TABLE queries ADD COLUMN user_id TEXT');
      db.exec('CREATE INDEX IF NOT EXISTS idx_queries_user_id ON queries(user_id)');
      console.log('✅ Added user_id column to queries table');
    } else {
      console.log('[DEBUG] user_id column already exists in queries table');
    }

    // Check if user_id column exists in topics table (will be created if table doesn't exist)
    const topicsInfo = db.prepare("PRAGMA table_info(topics)").all() as Array<{ name: string }>;
    const hasUserIdInTopics = topicsInfo.some(col => col.name === 'user_id');
    
    if (topicsInfo.length > 0 && !hasUserIdInTopics) {
      console.log('[DEBUG] Adding user_id column to topics table');
      db.exec('ALTER TABLE topics ADD COLUMN user_id TEXT');
      console.log('✅ Added user_id column to topics table');
    } else {
      console.log('[DEBUG] Topics table check - table exists:', topicsInfo.length > 0, 'hasUserId:', topicsInfo.length > 0 ? hasUserIdInTopics : 'N/A (table does not exist)');
    }
  } catch (error) {
    const errorInfo = {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Unknown',
      code: (error as any)?.code || 'no code',
      stack: error instanceof Error ? error.stack?.substring(0, 300) : 'no stack'
    };
    console.error('[DEBUG] Migration error:', errorInfo);
    throw error; // Re-throw to prevent silent failures
  }
}

// Run migration on module load (after schema initialization)
try {
  console.log('[DEBUG] Running migration on module load');
  migrateAddUserIdColumns();
  console.log('[DEBUG] Migration completed successfully');
} catch (error) {
  console.error('[DEBUG] Failed to run migration on module load:', error);
  // Don't throw - allow app to start but log the error
}

/**
 * User Management Functions
 */

export interface User {
  id: string;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  auth_provider: 'github' | 'wallet';
  auth_id: string;
  created_at: number;
  updated_at: number;
}

/**
 * Create or get user by auth provider and ID
 */
export function createOrGetUser(
  authProvider: 'github' | 'wallet',
  authId: string,
  userData?: {
    username?: string;
    email?: string;
    avatar_url?: string;
  }
): User {
  // Check if user exists
  const existing = db.prepare('SELECT * FROM users WHERE auth_provider = ? AND auth_id = ?').get(authProvider, authId) as User | undefined;
  
  if (existing) {
    // Update if new data provided
    if (userData && (userData.username || userData.email || userData.avatar_url)) {
      const updates: string[] = [];
      const values: any[] = [];
      
      if (userData.username !== undefined) {
        updates.push('username = ?');
        values.push(userData.username);
      }
      if (userData.email !== undefined) {
        updates.push('email = ?');
        values.push(userData.email);
      }
      if (userData.avatar_url !== undefined) {
        updates.push('avatar_url = ?');
        values.push(userData.avatar_url);
      }
      
      if (updates.length > 0) {
        updates.push('updated_at = strftime(\'%s\', \'now\')');
        values.push(existing.id);
        db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
        return db.prepare('SELECT * FROM users WHERE id = ?').get(existing.id) as User;
      }
    }
    return existing;
  }
  
  // Create new user
  const userId = Math.random().toString(36).substring(2, 15);
  db.prepare(`
    INSERT INTO users (id, username, email, avatar_url, auth_provider, auth_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    userData?.username || null,
    userData?.email || null,
    userData?.avatar_url || null,
    authProvider,
    authId
  );
  
  return db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User;
}

/**
 * Get user by ID
 */
export function getUser(userId: string): User | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User | undefined;
}

/**
 * Get anonymous user (for migration)
 */
export function getOrCreateAnonymousUser(): User {
  const anonymous = db.prepare('SELECT * FROM users WHERE auth_provider = ? AND auth_id = ?').get('wallet', 'anonymous') as User | undefined;
  
  if (anonymous) {
    return anonymous;
  }
  
  return createOrGetUser('wallet', 'anonymous', {
    username: 'Anonymous',
  });
}

/**
 * Session Management Functions
 */

export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: number;
  created_at: number;
}

/**
 * Create a new session
 */
export function createSession(userId: string, expiresInSeconds: number = 30 * 24 * 60 * 60): Session {
  const sessionId = Math.random().toString(36).substring(2, 15);
  const token = Math.random().toString(36).substring(2, 30) + Date.now().toString(36);
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  
  db.prepare(`
    INSERT INTO sessions (id, user_id, token, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(sessionId, userId, token, expiresAt);
  
  return db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) as Session;
}

/**
 * Validate session token and return user
 */
export function validateSession(token: string): User | null {
  console.log('[DEBUG] validateSession entry, token:', token.substring(0, 10));
  // #region agent log
  try { fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/database.ts:492',message:'validateSession entry',data:{token:token.substring(0,10)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{}); } catch(e) {}
  // #endregion
  
  try {
    console.log('[DEBUG] Before SQL query');
    // #region agent log
    try { fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/database.ts:495',message:'Before SQL query',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{}); } catch(e) {}
    // #endregion
    
    // Check if tables exist
    const tablesCheck = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND (name='users' OR name='sessions')
    `).all() as Array<{ name: string }>;
    console.log('[DEBUG] Tables check:', tablesCheck.map(t => t.name), 'hasUsers:', !!tablesCheck.find(t => t.name === 'users'), 'hasSessions:', !!tablesCheck.find(t => t.name === 'sessions'));
    // #region agent log
    try { fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/database.ts:502',message:'Tables check',data:{tablesFound:tablesCheck.map(t=>t.name),hasUsers:!!tablesCheck.find(t=>t.name==='users'),hasSessions:!!tablesCheck.find(t=>t.name==='sessions')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{}); } catch(e) {}
    // #endregion
    
    console.log('[DEBUG] Executing SQL query with token');
    let session;
    try {
      session = db.prepare(`
        SELECT s.id as session_id, s.user_id, s.token, s.expires_at, s.created_at as session_created_at,
               u.id, u.username, u.email, u.avatar_url, u.auth_provider, u.auth_id, u.created_at, u.updated_at
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ? AND s.expires_at > strftime('%s', 'now')
      `).get(token) as {
      session_id: string;
      user_id: string;
      token: string;
      expires_at: number;
      session_created_at: number;
      id: string;
      username: string | null;
      email: string | null;
      avatar_url: string | null;
      auth_provider: 'github' | 'wallet';
      auth_id: string;
      created_at: number;
      updated_at: number;
    } | undefined;
    } catch (sqlError) {
      console.error('[DEBUG] SQL query error:', sqlError);
      throw sqlError;
    }
    
    console.log('[DEBUG] After SQL query, hasSession:', !!session, 'userId:', session?.id || null);
    // #region agent log
    try { fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/database.ts:520',message:'After SQL query',data:{hasSession:!!session,userId:session?.id||null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{}); } catch(e) {}
    // #endregion
    
    if (!session) {
      return null;
    }
    
    return {
      id: session.id,
      username: session.username,
      email: session.email,
      avatar_url: session.avatar_url,
      auth_provider: session.auth_provider,
      auth_id: session.auth_id,
      created_at: session.created_at,
      updated_at: session.updated_at,
    };
  } catch (error) {
    const errorInfo = {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Unknown',
      code: (error as any)?.code || 'no code',
      stack: error instanceof Error ? error.stack?.substring(0, 300) : 'no stack'
    };
    console.error('[DEBUG] validateSession error:', errorInfo);
    // #region agent log
    try { fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/database.ts:540',message:'validateSession error',data:errorInfo,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{}); } catch(e) {}
    // #endregion
    throw error;
  }
}

/**
 * Destroy session (logout)
 */
export function destroySession(token: string): void {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

/**
 * Clean expired sessions
 */
export function cleanExpiredSessions(): void {
  db.prepare('DELETE FROM sessions WHERE expires_at <= strftime(\'%s\', \'now\')').run();
}
