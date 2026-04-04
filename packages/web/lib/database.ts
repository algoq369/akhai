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

  -- Linked accounts (wallet → github user mapping)
  CREATE TABLE IF NOT EXISTS linked_accounts (
    user_id TEXT NOT NULL,
    auth_provider TEXT NOT NULL,
    auth_id TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    UNIQUE(auth_provider, auth_id),
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
import { insertPresetTreeConfigurations } from '@/lib/db/presets';
insertPresetTreeConfigurations();

console.log(`✅ Database initialized: ${dbPath}`);

export { db };

export function getDatabase() {
  return db;
}

/**
 * Close database connection (for graceful shutdown)
 */
export function closeDatabase() {
  db.close();
  console.log('Database connection closed');
}

// Run migrations on module load (after schema initialization)
import { runMigrations } from '@/lib/db/migrations';
runMigrations();

// Re-export auth functions (already extracted to lib/db/auth.ts)
export {
  type User,
  createOrGetUser,
  getUser,
  getOrCreateAnonymousUser,
  type Session,
  createSession,
  validateSession,
  destroySession,
  cleanExpiredSessions,
  type SocialConnection,
  saveSocialConnection,
  getUserSocialConnections,
  getSocialConnection,
  deleteSocialConnection,
  updateSocialConnectionMetadata,
  savePKCEVerifier,
  getPKCEVerifier,
  deletePKCEVerifier,
  cleanupExpiredPKCEVerifiers,
} from '@/lib/db/auth';

// Re-export query functions (extracted to lib/db/queries.ts)
export { createQuery, updateQuery, getQuery, getRecentQueries } from '@/lib/db/queries';

// Re-export event functions (extracted to lib/db/events.ts)
export { addEvent, getEvents } from '@/lib/db/events';

// Re-export stats functions (extracted to lib/db/stats.ts)
export { trackUsage, getStats } from '@/lib/db/stats';

// Re-export migration functions (extracted to lib/db/migrations.ts)
export {
  migrateAddUserIdColumns,
  migrateAddProcessingMode,
  migrateAddTopicsColumns,
} from '@/lib/db/migrations';

// Re-export cleanup functions (extracted to lib/db/cleanup.ts)
export {
  cleanupStalePendingQueries,
  getQueryStatusCounts,
  startCleanupScheduler,
  stopCleanupScheduler,
} from '@/lib/db/cleanup';

// Auto-start cleanup scheduler when module loads
import { scheduleCleanup } from '@/lib/db/cleanup';
scheduleCleanup();
