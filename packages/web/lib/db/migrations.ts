import { db } from '@/lib/database';
import { log } from '@/lib/logger';

/**
 * Migration: Add user_id columns to existing tables if they don't exist
 * SQLite doesn't support ALTER TABLE ADD COLUMN IF NOT EXISTS, so we check first
 */
export function migrateAddUserIdColumns() {
  try {
    // Check if user_id column exists in queries table
    const queriesInfo = db.prepare('PRAGMA table_info(queries)').all() as Array<{ name: string }>;
    const hasUserIdInQueries = queriesInfo.some((col) => col.name === 'user_id');

    if (!hasUserIdInQueries) {
      db.exec('ALTER TABLE queries ADD COLUMN user_id TEXT');
      db.exec('CREATE INDEX IF NOT EXISTS idx_queries_user_id ON queries(user_id)');
      log('INFO', 'DB_MIGRATIONS', 'Added user_id column to queries table');
    } else {
    }

    // Check if user_id column exists in topics table (will be created if table doesn't exist)
    const topicsInfo = db.prepare('PRAGMA table_info(topics)').all() as Array<{ name: string }>;
    const hasUserIdInTopics = topicsInfo.some((col) => col.name === 'user_id');

    if (topicsInfo.length > 0 && !hasUserIdInTopics) {
      db.exec('ALTER TABLE topics ADD COLUMN user_id TEXT');
      log('INFO', 'DB_MIGRATIONS', 'Added user_id column to topics table');
    } else {
    }
  } catch (error) {
    const errorInfo = {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Unknown',
      code: (error as any)?.code || 'no code',
      stack: error instanceof Error ? error.stack?.substring(0, 300) : 'no stack',
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
    const tableInfo = db.prepare('PRAGMA table_info(tree_configurations)').all() as Array<{
      name: string;
    }>;
    const hasProcessingMode = tableInfo.some((col) => col.name === 'processing_mode');

    if (!hasProcessingMode) {
      db.exec("ALTER TABLE tree_configurations ADD COLUMN processing_mode TEXT DEFAULT 'weighted'");
      log('INFO', 'DB_MIGRATIONS', 'Added processing_mode column to tree_configurations table');
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
    const tableInfo = db.prepare('PRAGMA table_info(topics)').all() as Array<{ name: string }>;
    const columnNames = tableInfo.map((col) => col.name);

    if (!columnNames.includes('color')) {
      db.exec("ALTER TABLE topics ADD COLUMN color TEXT DEFAULT '#94a3b8'");
      log('INFO', 'DB_MIGRATIONS', 'Added color column to topics table');
    }
    if (!columnNames.includes('pinned')) {
      db.exec('ALTER TABLE topics ADD COLUMN pinned INTEGER DEFAULT 0');
      log('INFO', 'DB_MIGRATIONS', 'Added pinned column to topics table');
    }
    if (!columnNames.includes('archived')) {
      db.exec('ALTER TABLE topics ADD COLUMN archived INTEGER DEFAULT 0');
      log('INFO', 'DB_MIGRATIONS', 'Added archived column to topics table');
    }
    if (!columnNames.includes('ai_instructions')) {
      db.exec('ALTER TABLE topics ADD COLUMN ai_instructions TEXT');
      log('INFO', 'DB_MIGRATIONS', 'Added ai_instructions column to topics table');
    }
  } catch (error) {
    console.error('[Migration Error] Failed to add topics columns:', error);
    // Don't throw - allow app to continue
  }
}

/**
 * Migration: Add annotations + annotations_version columns to queries table
 */
export function migrateAddAnnotationsColumns() {
  try {
    const tableInfo = db.prepare('PRAGMA table_info(queries)').all() as Array<{ name: string }>;
    const columnNames = tableInfo.map((col) => col.name);

    if (!columnNames.includes('annotations')) {
      db.exec('ALTER TABLE queries ADD COLUMN annotations TEXT DEFAULT NULL');
      log('INFO', 'DB_MIGRATIONS', 'Added annotations column to queries table');
    }
    if (!columnNames.includes('annotations_version')) {
      db.exec('ALTER TABLE queries ADD COLUMN annotations_version INTEGER DEFAULT 0');
      log('INFO', 'DB_MIGRATIONS', 'Added annotations_version column to queries table');
    }
  } catch (error) {
    console.error('[Migration Error] Failed to add annotations columns:', error);
  }
}

/**
 * Migration: Add cognitive_signature columns to queries table
 */
export function migrateAddCognitiveSignatureColumns() {
  try {
    const tableInfo = db.prepare('PRAGMA table_info(queries)').all() as Array<{ name: string }>;
    const columnNames = tableInfo.map((col) => col.name);

    if (!columnNames.includes('cognitive_signature')) {
      db.exec('ALTER TABLE queries ADD COLUMN cognitive_signature TEXT DEFAULT NULL');
      log('INFO', 'DB_MIGRATIONS', 'Added cognitive_signature column to queries table');
    }
    if (!columnNames.includes('cognitive_signature_version')) {
      db.exec('ALTER TABLE queries ADD COLUMN cognitive_signature_version INTEGER DEFAULT 0');
      log('INFO', 'DB_MIGRATIONS', 'Added cognitive_signature_version column to queries table');
    }
  } catch (error) {
    console.error('[Migration Error] Failed to add cognitive_signature columns:', error);
  }
}

/**
 * Migration: Create conversation_syntheses table for living conversation story
 */
export function migrateCreateConversationSyntheses() {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS conversation_syntheses (
        chat_id TEXT PRIMARY KEY,
        synthesis TEXT NOT NULL,
        exchanges_hash TEXT NOT NULL,
        version INTEGER DEFAULT 0,
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);
  } catch (error) {
    console.error('[Migration Error] Failed to create conversation_syntheses table:', error);
  }
}

/**
 * Migration: Create arboreal_threads table for per-block chat persistence
 */
export function migrateCreateArborealThreads() {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS arboreal_threads (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        query_id TEXT NOT NULL,
        layer INTEGER NOT NULL,
        section_index INTEGER DEFAULT 0,
        messages TEXT NOT NULL DEFAULT '[]',
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      CREATE INDEX IF NOT EXISTS idx_arboreal_threads_lookup
        ON arboreal_threads(user_id, query_id, layer);
    `);
  } catch (error) {
    console.error('[Migration Error] Failed to create arboreal_threads table:', error);
  }
}

/**
 * Migration: Drop FK on query_id from arboreal_threads.
 * query_id is a lookup key (may be a message id), not a row in queries.
 * SQLite can't ALTER to drop FK — must recreate the table.
 */
export function migrateDropArborealQueryFk() {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS arboreal_threads_new (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        query_id TEXT NOT NULL,
        layer INTEGER NOT NULL,
        section_index INTEGER DEFAULT 0,
        messages TEXT NOT NULL DEFAULT '[]',
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      INSERT OR IGNORE INTO arboreal_threads_new SELECT * FROM arboreal_threads;
      DROP TABLE IF EXISTS arboreal_threads;
      ALTER TABLE arboreal_threads_new RENAME TO arboreal_threads;
      CREATE INDEX IF NOT EXISTS idx_arboreal_threads_lookup
        ON arboreal_threads(user_id, query_id, layer);
    `);
  } catch (error) {
    console.warn('[Migration Warn] migrateDropArborealQueryFk:', error);
  }
}

/**
 * Migration: Add raw_thinking column to queries table for extended thinking storage
 */
export function migrateAddRawThinkingColumn() {
  try {
    const tableInfo = db.prepare('PRAGMA table_info(queries)').all() as Array<{ name: string }>;
    const columnNames = tableInfo.map((col) => col.name);

    if (!columnNames.includes('raw_thinking')) {
      db.exec('ALTER TABLE queries ADD COLUMN raw_thinking TEXT DEFAULT NULL');
      log('INFO', 'DB_MIGRATIONS', 'Added raw_thinking column to queries table');
    }
  } catch (error) {
    console.error('[Migration Error] Failed to add raw_thinking column:', error);
  }
}

/**
 * Migration: Add tier column to users table (monetization: free/pro/legend daily budgets)
 */
export function migrateAddUserTier() {
  try {
    const tableInfo = db.prepare('PRAGMA table_info(users)').all() as Array<{ name: string }>;
    const hasTier = tableInfo.some((col) => col.name === 'tier');

    if (!hasTier) {
      db.exec("ALTER TABLE users ADD COLUMN tier TEXT NOT NULL DEFAULT 'free'");
      log('INFO', 'DB_MIGRATIONS', 'Added tier column to users table');
    }
  } catch (error) {
    console.error('[Migration Error] Failed to add tier column:', error);
    throw error; // budgets depend on this column — fail loudly, not silently
  }
}

/**
 * Migration: Create wallet_nonces table for single-use anti-replay wallet-login challenges
 */
export function migrateCreateWalletNonces() {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS wallet_nonces (
        nonce TEXT PRIMARY KEY,
        address TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);
  } catch (error) {
    console.error('[Migration Error] Failed to create wallet_nonces table:', error);
  }
}

/**
 * Migration: Create processed_webhook_events table for Stripe webhook idempotency
 */
export function migrateCreateWebhookEvents() {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS processed_webhook_events (
        event_id TEXT PRIMARY KEY,
        processed_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);
  } catch (error) {
    console.error('[Migration Error] Failed to create processed_webhook_events table:', error);
  }
}

/**
 * M4a mindmap-rank: neighborhood-scan indices so hover ranking is a bounded seek, not a table
 * scan. Before this, topic_relationships had only the autoindex on (topic_from, topic_to,
 * relationship_type, user_id) — so the reverse-direction neighbor lookup (WHERE topic_to=? ) and
 * query_topics substance lookup (WHERE topic_id=?) both fell back to full scans (EXPLAIN: SCAN).
 */
export function migrateAddMindmapRankIndices() {
  try {
    db.exec(
      'CREATE INDEX IF NOT EXISTS idx_rel_from_user ON topic_relationships(topic_from, user_id)'
    );
    db.exec('CREATE INDEX IF NOT EXISTS idx_rel_to_user ON topic_relationships(topic_to, user_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_query_topics_topic ON query_topics(topic_id)');
  } catch (error) {
    console.error('[Migration Error] Failed to create mindmap-rank indices:', error);
  }
}

/**
 * Run all migrations. Called from database.ts on module load.
 */
export function runMigrations() {
  try {
    migrateAddUserIdColumns();
    migrateAddProcessingMode();
    migrateAddTopicsColumns();
    migrateAddAnnotationsColumns();
    migrateAddCognitiveSignatureColumns();
    migrateCreateConversationSyntheses();
    migrateAddRawThinkingColumn();
    migrateCreateArborealThreads();
    migrateDropArborealQueryFk();
    migrateAddUserTier();
    migrateCreateWalletNonces();
    migrateCreateWebhookEvents();
    migrateAddMindmapRankIndices();
  } catch (error) {
    console.error('[Migration Failed]', error);
  }
}
