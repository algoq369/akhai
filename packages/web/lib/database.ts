/**
 * SQLite Database for AkhAI
 *
 * Provides persistent storage for queries, events, and usage statistics.
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { randomBytes, randomUUID } from 'crypto';

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

  -- Implementation Tracking: Log all features/tools/enhancements
  CREATE TABLE IF NOT EXISTS implementation_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feature_name TEXT NOT NULL,
    feature_type TEXT NOT NULL CHECK(feature_type IN ('function', 'tool', 'app', 'methodology', 'enhancement', 'fix', 'integration')),
    description TEXT,
    files_created TEXT DEFAULT '[]',
    files_modified TEXT DEFAULT '[]',
    lines_added INTEGER DEFAULT 0,
    lines_modified INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'testing', 'validated', 'reverted')),
    validation_message TEXT,
    validated_at INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    session_id TEXT,
    parent_id INTEGER,
    command_used TEXT,
    rollback_instructions TEXT,
    FOREIGN KEY (parent_id) REFERENCES implementation_log(id)
  );

  -- Social Connectors: OAuth connections to social media platforms
  CREATE TABLE IF NOT EXISTS social_connections (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    platform TEXT NOT NULL CHECK(platform IN ('x', 'telegram', 'github', 'reddit', 'mastodon', 'youtube')),
    username TEXT NOT NULL,
    user_external_id TEXT,
    access_token TEXT,
    refresh_token TEXT,
    expires_at INTEGER,
    connected_at INTEGER DEFAULT (strftime('%s', 'now')),
    last_synced INTEGER,
    metadata TEXT DEFAULT '{}',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, platform)
  );

  -- PKCE Verifiers: Temporary storage for OAuth 2.0 PKCE flow
  CREATE TABLE IF NOT EXISTS pkce_verifiers (
    state TEXT PRIMARY KEY,
    verifier TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Grimoires: Persistent workspaces with memory
  CREATE TABLE IF NOT EXISTS grimoires (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '📜',
    color TEXT DEFAULT 'zinc',
    instructions TEXT,
    user_id TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    archived INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Grimoire Conversations: Chat history within grimoires
  CREATE TABLE IF NOT EXISTS grimoire_conversations (
    id TEXT PRIMARY KEY,
    grimoire_id TEXT NOT NULL,
    title TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (grimoire_id) REFERENCES grimoires(id) ON DELETE CASCADE
  );

  -- Grimoire Messages: Individual messages in conversations
  CREATE TABLE IF NOT EXISTS grimoire_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    methodology TEXT,
    tokens_used INTEGER DEFAULT 0,
    cost REAL DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (conversation_id) REFERENCES grimoire_conversations(id) ON DELETE CASCADE
  );

  -- Grimoire Memories: Extracted insights and context
  CREATE TABLE IF NOT EXISTS grimoire_memories (
    id TEXT PRIMARY KEY,
    grimoire_id TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'insight' CHECK(type IN ('insight', 'fact', 'preference', 'context')),
    source_message_id TEXT,
    confidence REAL DEFAULT 0.8,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    last_accessed INTEGER,
    FOREIGN KEY (grimoire_id) REFERENCES grimoires(id) ON DELETE CASCADE,
    FOREIGN KEY (source_message_id) REFERENCES grimoire_messages(id) ON DELETE SET NULL
  );

  -- Grimoire MindMap Nodes: Knowledge graph nodes
  CREATE TABLE IF NOT EXISTS grimoire_mindmap_nodes (
    id TEXT PRIMARY KEY,
    grimoire_id TEXT NOT NULL,
    label TEXT NOT NULL,
    type TEXT DEFAULT 'concept' CHECK(type IN ('concept', 'entity', 'action', 'insight')),
    x REAL DEFAULT 0,
    y REAL DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (grimoire_id) REFERENCES grimoires(id) ON DELETE CASCADE
  );

  -- Grimoire MindMap Edges: Knowledge graph connections
  CREATE TABLE IF NOT EXISTS grimoire_mindmap_edges (
    id TEXT PRIMARY KEY,
    grimoire_id TEXT NOT NULL,
    source_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    label TEXT,
    weight REAL DEFAULT 1.0,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (grimoire_id) REFERENCES grimoires(id) ON DELETE CASCADE,
    FOREIGN KEY (source_id) REFERENCES grimoire_mindmap_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (target_id) REFERENCES grimoire_mindmap_nodes(id) ON DELETE CASCADE,
    UNIQUE(source_id, target_id)
  );

  -- Grimoire Files: Attached files for context
  CREATE TABLE IF NOT EXISTS grimoire_files (
    id TEXT PRIMARY KEY,
    grimoire_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    size INTEGER NOT NULL,
    path TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (grimoire_id) REFERENCES grimoires(id) ON DELETE CASCADE
  );

  -- Grimoire Links: External URLs for context
  CREATE TABLE IF NOT EXISTS grimoire_links (
    id TEXT PRIMARY KEY,
    grimoire_id TEXT NOT NULL,
    url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (grimoire_id) REFERENCES grimoires(id) ON DELETE CASCADE
  );

  -- Subscriptions: User subscription plans and token balances
  CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT,
    plan TEXT DEFAULT 'free' CHECK(plan IN ('free', 'pro', 'instinct', 'team')),
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'canceled', 'past_due', 'trialing')),
    token_balance INTEGER DEFAULT 0,
    queries_used_today INTEGER DEFAULT 0,
    queries_limit INTEGER DEFAULT 3,
    current_period_start INTEGER,
    current_period_end INTEGER,
    cancel_at_period_end INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Payment Records: Track all payments (Stripe + Crypto)
  CREATE TABLE IF NOT EXISTS payment_records (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    payment_provider TEXT NOT NULL CHECK(payment_provider IN ('stripe', 'nowpayments', 'btcpay')),
    payment_type TEXT NOT NULL CHECK(payment_type IN ('subscription', 'credits', 'one_time')),
    amount REAL NOT NULL,
    currency TEXT NOT NULL,
    tokens_granted INTEGER DEFAULT 0,
    plan_purchased TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'failed', 'refunded')),
    provider_payment_id TEXT,
    provider_customer_id TEXT,
    metadata TEXT DEFAULT '{}',
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    completed_at INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Living Tree System: Dynamic topic tracking and evolution

  -- Living Topics: Dynamic tree nodes generated from conversation
  CREATE TABLE IF NOT EXISTS living_topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    emergence_query_id TEXT,
    dissolution_query_id TEXT,
    parent_topic_id INTEGER,
    importance_score REAL DEFAULT 0.5,
    vibration_level TEXT CHECK(vibration_level IN ('high', 'medium', 'low')),
    polarity TEXT CHECK(polarity IN ('positive', 'negative', 'neutral')),
    rhythm_phase TEXT CHECK(rhythm_phase IN ('rising', 'peak', 'falling', 'trough')),
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (emergence_query_id) REFERENCES queries(id),
    FOREIGN KEY (parent_topic_id) REFERENCES living_topics(id)
  );

  -- Living Topic Edges: Relationships between topics
  CREATE TABLE IF NOT EXISTS living_topic_edges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL,
    source_topic_id INTEGER NOT NULL,
    target_topic_id INTEGER NOT NULL,
    relationship_type TEXT CHECK(relationship_type IN ('causal', 'similar', 'opposite', 'evolves_to', 'merges_with', 'splits_from')),
    strength REAL DEFAULT 0.5,
    hermetic_law TEXT,
    first_seen_query_id TEXT,
    last_seen_query_id TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (source_topic_id) REFERENCES living_topics(id),
    FOREIGN KEY (target_topic_id) REFERENCES living_topics(id),
    FOREIGN KEY (first_seen_query_id) REFERENCES queries(id),
    FOREIGN KEY (last_seen_query_id) REFERENCES queries(id)
  );

  -- Topic Evolution Events: Track emergence, transformation, merger, split, dissolution
  CREATE TABLE IF NOT EXISTS topic_evolution_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL,
    query_id TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK(event_type IN ('emergence', 'transformation', 'merger', 'split', 'dissolution', 'strengthening', 'weakening')),
    topic_ids TEXT NOT NULL,
    description TEXT,
    hermetic_insight TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (query_id) REFERENCES queries(id)
  );

  -- Hermetic Analysis: Cache for 7 Hermetic Laws analysis
  CREATE TABLE IF NOT EXISTS hermetic_analysis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query_id TEXT NOT NULL,
    conversation_id TEXT NOT NULL,
    law_mentalism TEXT,
    law_correspondence TEXT,
    law_vibration TEXT,
    law_polarity TEXT,
    law_rhythm TEXT,
    law_cause_effect TEXT,
    law_gender TEXT,
    instinct_insight TEXT,
    opus_analysis TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (query_id) REFERENCES queries(id)
  );

  -- Tree Configurations: User-defined Layers/Antipatterns weights and personas
  CREATE TABLE IF NOT EXISTS tree_configurations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    is_active INTEGER DEFAULT 0,
    layer_weights TEXT NOT NULL,
    antipattern_suppression TEXT,
    pillar_balance TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
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
  CREATE INDEX IF NOT EXISTS idx_impl_status ON implementation_log(status);
  CREATE INDEX IF NOT EXISTS idx_impl_session ON implementation_log(session_id);
  CREATE INDEX IF NOT EXISTS idx_impl_created ON implementation_log(created_at);
  CREATE INDEX IF NOT EXISTS idx_social_user_id ON social_connections(user_id);
  CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
  CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
  CREATE INDEX IF NOT EXISTS idx_payment_records_user_id ON payment_records(user_id);
  CREATE INDEX IF NOT EXISTS idx_payment_records_status ON payment_records(status);
  CREATE INDEX IF NOT EXISTS idx_social_platform ON social_connections(platform);
  CREATE INDEX IF NOT EXISTS idx_pkce_created_at ON pkce_verifiers(created_at);
  CREATE INDEX IF NOT EXISTS idx_grimoires_user_id ON grimoires(user_id);
  CREATE INDEX IF NOT EXISTS idx_grimoires_created_at ON grimoires(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_grimoire_conversations_grimoire_id ON grimoire_conversations(grimoire_id);
  CREATE INDEX IF NOT EXISTS idx_grimoire_messages_conversation_id ON grimoire_messages(conversation_id);
  CREATE INDEX IF NOT EXISTS idx_grimoire_memories_grimoire_id ON grimoire_memories(grimoire_id);
  CREATE INDEX IF NOT EXISTS idx_grimoire_memories_type ON grimoire_memories(type);
  CREATE INDEX IF NOT EXISTS idx_grimoire_mindmap_nodes_grimoire_id ON grimoire_mindmap_nodes(grimoire_id);
  CREATE INDEX IF NOT EXISTS idx_grimoire_mindmap_edges_grimoire_id ON grimoire_mindmap_edges(grimoire_id);
  CREATE INDEX IF NOT EXISTS idx_grimoire_files_grimoire_id ON grimoire_files(grimoire_id);
  CREATE INDEX IF NOT EXISTS idx_grimoire_links_grimoire_id ON grimoire_links(grimoire_id);

  -- Living Tree Indexes
  CREATE INDEX IF NOT EXISTS idx_living_topics_conversation ON living_topics(conversation_id);
  CREATE INDEX IF NOT EXISTS idx_living_topics_parent ON living_topics(parent_topic_id);
  CREATE INDEX IF NOT EXISTS idx_living_topics_importance ON living_topics(importance_score DESC);
  CREATE INDEX IF NOT EXISTS idx_living_topic_edges_conversation ON living_topic_edges(conversation_id);
  CREATE INDEX IF NOT EXISTS idx_living_topic_edges_source ON living_topic_edges(source_topic_id);
  CREATE INDEX IF NOT EXISTS idx_living_topic_edges_target ON living_topic_edges(target_topic_id);
  CREATE INDEX IF NOT EXISTS idx_topic_evolution_conversation ON topic_evolution_events(conversation_id);
  CREATE INDEX IF NOT EXISTS idx_topic_evolution_query ON topic_evolution_events(query_id);
  CREATE INDEX IF NOT EXISTS idx_hermetic_analysis_query ON hermetic_analysis(query_id);
  CREATE INDEX IF NOT EXISTS idx_hermetic_analysis_conversation ON hermetic_analysis(conversation_id);
  CREATE INDEX IF NOT EXISTS idx_tree_configs_user ON tree_configurations(user_id);
  CREATE INDEX IF NOT EXISTS idx_tree_configs_active ON tree_configurations(is_active);
`);

// Insert preset tree configurations if they don't exist
try {
  const existingPresets = db.prepare('SELECT COUNT(*) as count FROM tree_configurations WHERE user_id IS NULL').get() as { count: number };

  if (existingPresets.count === 0) {
    const insertPreset = db.prepare(`
      INSERT INTO tree_configurations (user_id, name, description, is_active, layer_weights, antipattern_suppression, pillar_balance)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    // Balanced - Default configuration
    insertPreset.run(
      null,
      'Balanced',
      'Default balanced configuration with equal emphasis on all Layers',
      0,
      JSON.stringify({"1":0.5,"2":0.5,"3":0.5,"4":0.5,"5":0.5,"6":0.5,"7":0.5,"8":0.5,"9":0.5,"10":0.5,"11":0.5}),
      JSON.stringify({"1":0.5,"2":0.5,"3":0.5,"4":0.5,"5":0.5,"6":0.5,"7":0.5,"8":0.5,"9":0.5,"10":0.5,"11":0.5,"12":0.5}),
      JSON.stringify({"left":0.33,"middle":0.34,"right":0.33})
    );

    // Analytical - Emphasizes logic and understanding
    insertPreset.run(
      null,
      'Analytical',
      'Emphasizes logic, understanding, and structured reasoning (Reasoning, Encoder, Classifier)',
      0,
      JSON.stringify({"1":0.3,"2":0.9,"3":0.9,"4":0.4,"5":0.7,"6":0.5,"7":0.4,"8":0.8,"9":0.5,"10":0.6,"11":0.4}),
      JSON.stringify({"1":0.8,"2":0.2,"3":0.3,"4":0.7,"5":0.6,"6":0.5,"7":0.6,"8":0.2,"9":0.7,"10":0.6,"11":0.5,"12":0.3}),
      JSON.stringify({"left":0.2,"middle":0.6,"right":0.2})
    );

    // Compassionate - Emphasizes empathy and harmony
    insertPreset.run(
      null,
      'Compassionate',
      'Emphasizes empathy, mercy, and harmonious integration (Expansion, Attention, Generative)',
      0,
      JSON.stringify({"1":0.4,"2":0.5,"3":0.6,"4":0.9,"5":0.3,"6":0.9,"7":0.7,"8":0.5,"9":0.6,"10":0.5,"11":0.5}),
      JSON.stringify({"1":0.6,"2":0.5,"3":0.5,"4":0.3,"5":0.9,"6":0.2,"7":0.4,"8":0.5,"9":0.4,"10":0.5,"11":0.6,"12":0.5}),
      JSON.stringify({"left":0.1,"middle":0.7,"right":0.2})
    );

    // Creative - Emphasizes imagination and possibility
    insertPreset.run(
      null,
      'Creative',
      'Emphasizes imagination, creative expression, and innovative thinking (Generative, Executor, Reasoning)',
      0,
      JSON.stringify({"1":0.5,"2":0.8,"3":0.7,"4":0.6,"5":0.5,"6":0.7,"7":0.9,"8":0.6,"9":0.9,"10":0.5,"11":0.6}),
      JSON.stringify({"1":0.5,"2":0.4,"3":0.4,"4":0.5,"5":0.6,"6":0.4,"7":0.2,"8":0.4,"9":0.1,"10":0.3,"11":0.5,"12":0.6}),
      JSON.stringify({"left":0.15,"middle":0.45,"right":0.4})
    );

    console.log('✅ Inserted 4 preset tree configurations (Balanced, Analytical, Compassionate, Creative)');
  }
} catch (error) {
  console.error('Failed to insert preset tree configurations:', error);
}

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
      WHERE user_id = ? OR user_id IS NULL OR user_id = ''
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

  // Fallback for development: show all queries (single-user system)
  // TODO: In production multi-user system, return [] here
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
    // console.log('[DEBUG] Starting migration: migrateAddUserIdColumns');
    // Check if user_id column exists in queries table
    const queriesInfo = db.prepare("PRAGMA table_info(queries)").all() as Array<{ name: string }>;
    const hasUserIdInQueries = queriesInfo.some(col => col.name === 'user_id');
    // console.log('[DEBUG] Queries table columns:', queriesInfo.map(c => c.name), 'hasUserId:', hasUserIdInQueries);

    if (!hasUserIdInQueries) {
      // console.log('[DEBUG] Adding user_id column to queries table');
      db.exec('ALTER TABLE queries ADD COLUMN user_id TEXT');
      db.exec('CREATE INDEX IF NOT EXISTS idx_queries_user_id ON queries(user_id)');
      console.log('✅ Added user_id column to queries table');
    } else {
      // console.log('[DEBUG] user_id column already exists in queries table');
    }

    // Check if user_id column exists in topics table (will be created if table doesn't exist)
    const topicsInfo = db.prepare("PRAGMA table_info(topics)").all() as Array<{ name: string }>;
    const hasUserIdInTopics = topicsInfo.some(col => col.name === 'user_id');

    if (topicsInfo.length > 0 && !hasUserIdInTopics) {
      // console.log('[DEBUG] Adding user_id column to topics table');
      db.exec('ALTER TABLE topics ADD COLUMN user_id TEXT');
      console.log('✅ Added user_id column to topics table');
    } else {
      // console.log('[DEBUG] Topics table check - table exists:', topicsInfo.length > 0, 'hasUserId:', topicsInfo.length > 0 ? hasUserIdInTopics : 'N/A (table does not exist)');
    }
  } catch (error) {
    const errorInfo = {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Unknown',
      code: (error as any)?.code || 'no code',
      stack: error instanceof Error ? error.stack?.substring(0, 300) : 'no stack'
    };
    console.error('[Migration Error]', errorInfo);
    throw error; // Re-throw to prevent silent failures
  }
}

/**
 * Migration: Add processing_mode column to tree_configurations table
 */
export function migrateAddProcessingMode() {
  try {
    const tableInfo = db.prepare("PRAGMA table_info(tree_configurations)").all() as Array<{ name: string }>;
    const hasProcessingMode = tableInfo.some(col => col.name === 'processing_mode');

    if (!hasProcessingMode) {
      db.exec("ALTER TABLE tree_configurations ADD COLUMN processing_mode TEXT DEFAULT 'weighted'");
      console.log('✅ Added processing_mode column to tree_configurations table');
    }
  } catch (error) {
    console.error('[Migration Error] Failed to add processing_mode column:', error);
    throw error;
  }
}

/**
 * Migration: Add missing columns to topics table (color, pinned, archived, ai_instructions)
 */
export function migrateAddTopicsColumns() {
  try {
    const tableInfo = db.prepare("PRAGMA table_info(topics)").all() as Array<{ name: string }>;
    const columnNames = tableInfo.map(col => col.name);

    if (!columnNames.includes('color')) {
      db.exec("ALTER TABLE topics ADD COLUMN color TEXT DEFAULT '#94a3b8'");
      console.log('✅ Added color column to topics table');
    }
    if (!columnNames.includes('pinned')) {
      db.exec("ALTER TABLE topics ADD COLUMN pinned INTEGER DEFAULT 0");
      console.log('✅ Added pinned column to topics table');
    }
    if (!columnNames.includes('archived')) {
      db.exec("ALTER TABLE topics ADD COLUMN archived INTEGER DEFAULT 0");
      console.log('✅ Added archived column to topics table');
    }
    if (!columnNames.includes('ai_instructions')) {
      db.exec("ALTER TABLE topics ADD COLUMN ai_instructions TEXT");
      console.log('✅ Added ai_instructions column to topics table');
    }
  } catch (error) {
    console.error('[Migration Error] Failed to add topics columns:', error);
    // Don't throw - allow app to continue
  }
}

// Run migrations on module load (after schema initialization)
try {
  // console.log('[DEBUG] Running migrations on module load');
  migrateAddUserIdColumns();
  migrateAddProcessingMode();
  migrateAddTopicsColumns();
  // console.log('[DEBUG] Migrations completed successfully');
} catch (error) {
  console.error('[Migration Failed]', error);
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
  const userId = randomUUID();
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
  const sessionId = randomUUID();
  const token = randomBytes(32).toString('hex');
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
  // console.log('[DEBUG] validateSession entry, token:', token.substring(0, 10));

  try {
    // console.log('[DEBUG] Before SQL query');

    // Check if tables exist
    const tablesCheck = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND (name='users' OR name='sessions')
    `).all() as Array<{ name: string }>;
    // console.log('[DEBUG] Tables check:', tablesCheck.map(t => t.name), 'hasUsers:', !!tablesCheck.find(t => t.name === 'users'), 'hasSessions:', !!tablesCheck.find(t => t.name === 'sessions'));

    // console.log('[DEBUG] Executing SQL query with token');
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
      console.error('[Session Validation] SQL error:', sqlError);
      throw sqlError;
    }

    // console.log('[DEBUG] After SQL query, hasSession:', !!session, 'userId:', session?.id || null);
    
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

/**
 * Social Connections Management
 */

export interface SocialConnection {
  id?: string;
  user_id: string;
  platform: 'x' | 'telegram' | 'github' | 'reddit' | 'mastodon' | 'youtube';
  username: string;
  user_external_id?: string | null;
  access_token?: string | null;
  refresh_token?: string | null;
  expires_at?: number | null;
  connected_at?: number;
  last_synced?: number | null;
  metadata?: string;
}

/**
 * Save or update a social connection
 */
export function saveSocialConnection(connection: SocialConnection): void {
  const id = connection.id || randomBytes(16).toString('hex');
  const connectedAt = connection.connected_at || Math.floor(Date.now() / 1000);
  const metadata = connection.metadata || '{}';

  const stmt = db.prepare(`
    INSERT INTO social_connections (
      id, user_id, platform, username, user_external_id,
      access_token, refresh_token, expires_at, connected_at,
      last_synced, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, platform) DO UPDATE SET
      username = excluded.username,
      user_external_id = excluded.user_external_id,
      access_token = excluded.access_token,
      refresh_token = excluded.refresh_token,
      expires_at = excluded.expires_at,
      last_synced = excluded.last_synced,
      metadata = excluded.metadata
  `);

  stmt.run(
    id,
    connection.user_id,
    connection.platform,
    connection.username,
    connection.user_external_id || null,
    connection.access_token || null,
    connection.refresh_token || null,
    connection.expires_at || null,
    connectedAt,
    connection.last_synced || null,
    metadata
  );
}

/**
 * Get all social connections for a user
 */
export function getUserSocialConnections(userId: string): SocialConnection[] {
  const stmt = db.prepare(`
    SELECT id, user_id, platform, username, user_external_id,
           access_token, refresh_token, expires_at, connected_at,
           last_synced, metadata
    FROM social_connections
    WHERE user_id = ?
    ORDER BY connected_at DESC
  `);

  return stmt.all(userId) as SocialConnection[];
}

/**
 * Get a specific social connection
 */
export function getSocialConnection(
  userId: string,
  platform: SocialConnection['platform']
): SocialConnection | null {
  const stmt = db.prepare(`
    SELECT id, user_id, platform, username, user_external_id,
           access_token, refresh_token, expires_at, connected_at,
           last_synced, metadata
    FROM social_connections
    WHERE user_id = ? AND platform = ?
  `);

  return (stmt.get(userId, platform) as SocialConnection) || null;
}

/**
 * Delete a social connection
 */
export function deleteSocialConnection(
  userId: string,
  platform: SocialConnection['platform']
): void {
  db.prepare('DELETE FROM social_connections WHERE user_id = ? AND platform = ?')
    .run(userId, platform);
}

/**
 * Update social connection metadata
 */
export function updateSocialConnectionMetadata(
  userId: string,
  platform: SocialConnection['platform'],
  metadata: Record<string, any>
): void {
  const stmt = db.prepare(`
    UPDATE social_connections
    SET metadata = ?, last_synced = strftime('%s', 'now')
    WHERE user_id = ? AND platform = ?
  `);

  stmt.run(JSON.stringify(metadata), userId, platform);
}

/**
 * PKCE Verifier Management
 */

/**
 * Save PKCE verifier for OAuth 2.0 flow
 */
export function savePKCEVerifier(state: string, verifier: string, userId: string): void {
  const stmt = db.prepare(`
    INSERT INTO pkce_verifiers (state, verifier, user_id, created_at)
    VALUES (?, ?, ?, strftime('%s', 'now'))
  `);

  stmt.run(state, verifier, userId);
}

/**
 * Get PKCE verifier by state
 */
export function getPKCEVerifier(state: string): { verifier: string; userId: string; timestamp: number } | null {
  const stmt = db.prepare(`
    SELECT verifier, user_id as userId, created_at as timestamp
    FROM pkce_verifiers
    WHERE state = ?
  `);

  const result = stmt.get(state) as { verifier: string; userId: string; timestamp: number } | undefined;
  return result || null;
}

/**
 * Delete PKCE verifier (after successful use)
 */
export function deletePKCEVerifier(state: string): void {
  const stmt = db.prepare(`
    DELETE FROM pkce_verifiers WHERE state = ?
  `);

  stmt.run(state);
}

/**
 * Clean up expired PKCE verifiers (older than 10 minutes)
 */
export function cleanupExpiredPKCEVerifiers(): number {
  const tenMinutesAgo = Math.floor(Date.now() / 1000) - 10 * 60;

  const stmt = db.prepare(`
    DELETE FROM pkce_verifiers WHERE created_at < ?
  `);

  const result = stmt.run(tenMinutesAgo);
  return result.changes;
}

// ============================================
// STALE QUERY CLEANUP
// ============================================

/**
 * Clean up queries stuck in 'pending' status for more than 1 hour
 * Marks them as 'failed' with error message 'Timeout'
 */
export function cleanupStalePendingQueries(): { cleaned: number; queries: string[] } {
  const oneHourAgo = Math.floor(Date.now() / 1000) - 60 * 60; // 1 hour

  // Get IDs of stale queries for logging
  const staleQueries = db.prepare(`
    SELECT id FROM queries
    WHERE status = 'pending' AND created_at < ?
  `).all(oneHourAgo) as Array<{ id: string }>;

  if (staleQueries.length === 0) {
    return { cleaned: 0, queries: [] };
  }

  // Update stale queries to failed status
  const result = db.prepare(`
    UPDATE queries
    SET status = 'failed',
        result = '{"error": "Timeout - Query exceeded 1 hour processing limit"}',
        completed_at = strftime('%s', 'now')
    WHERE status = 'pending' AND created_at < ?
  `).run(oneHourAgo);

  const cleanedIds = staleQueries.map(q => q.id);
  console.log(`[Cleanup] Marked ${result.changes} stale pending queries as failed:`, cleanedIds.slice(0, 5));

  return { cleaned: result.changes, queries: cleanedIds };
}

/**
 * Get count of queries by status
 */
export function getQueryStatusCounts(): Record<string, number> {
  const counts = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM queries
    GROUP BY status
  `).all() as Array<{ status: string; count: number }>;

  return counts.reduce((acc, row) => {
    acc[row.status] = row.count;
    return acc;
  }, {} as Record<string, number>);
}

// ============================================
// AUTOMATIC CLEANUP SCHEDULER
// ============================================

let cleanupIntervalId: NodeJS.Timeout | null = null;

/**
 * Start automatic cleanup scheduler
 * Runs every hour to clean up stale queries and expired sessions
 */
export function startCleanupScheduler(): void {
  if (cleanupIntervalId) {
    console.log('[Cleanup] Scheduler already running');
    return;
  }

  // Run immediately on startup
  runCleanupTasks();

  // Then run every hour (3600000ms)
  cleanupIntervalId = setInterval(() => {
    runCleanupTasks();
  }, 60 * 60 * 1000); // 1 hour

  console.log('[Cleanup] Scheduler started - will run every hour');
}

/**
 * Stop automatic cleanup scheduler
 */
export function stopCleanupScheduler(): void {
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
    console.log('[Cleanup] Scheduler stopped');
  }
}

/**
 * Run all cleanup tasks
 */
function runCleanupTasks(): void {
  const timestamp = new Date().toISOString();
  console.log(`[Cleanup] Running cleanup tasks at ${timestamp}`);

  try {
    // 1. Clean stale pending queries
    const { cleaned: staleQueries } = cleanupStalePendingQueries();

    // 2. Clean expired sessions
    cleanExpiredSessions();

    // 3. Clean expired PKCE verifiers
    const expiredPKCE = cleanupExpiredPKCEVerifiers();

    console.log(`[Cleanup] Completed: ${staleQueries} stale queries, ${expiredPKCE} expired PKCE verifiers`);
  } catch (error) {
    console.error('[Cleanup] Error during cleanup tasks:', error);
  }
}

// Auto-start cleanup scheduler when module loads
// Use setTimeout to ensure database is fully initialized
setTimeout(() => {
  startCleanupScheduler();
}, 5000); // Wait 5 seconds after module load