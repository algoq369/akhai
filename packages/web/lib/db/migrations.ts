import { db } from '@/lib/database';

/**
 * Migration: Add user_id columns to existing tables if they don't exist
 * SQLite doesn't support ALTER TABLE ADD COLUMN IF NOT EXISTS, so we check first
 */
export function migrateAddUserIdColumns() {
  try {
    // console.log('[DEBUG] Starting migration: migrateAddUserIdColumns');
    // Check if user_id column exists in queries table
    const queriesInfo = db.prepare('PRAGMA table_info(queries)').all() as Array<{ name: string }>;
    const hasUserIdInQueries = queriesInfo.some((col) => col.name === 'user_id');
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
    const topicsInfo = db.prepare('PRAGMA table_info(topics)').all() as Array<{ name: string }>;
    const hasUserIdInTopics = topicsInfo.some((col) => col.name === 'user_id');

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
    const tableInfo = db.prepare('PRAGMA table_info(topics)').all() as Array<{ name: string }>;
    const columnNames = tableInfo.map((col) => col.name);

    if (!columnNames.includes('color')) {
      db.exec("ALTER TABLE topics ADD COLUMN color TEXT DEFAULT '#94a3b8'");
      console.log('✅ Added color column to topics table');
    }
    if (!columnNames.includes('pinned')) {
      db.exec('ALTER TABLE topics ADD COLUMN pinned INTEGER DEFAULT 0');
      console.log('✅ Added pinned column to topics table');
    }
    if (!columnNames.includes('archived')) {
      db.exec('ALTER TABLE topics ADD COLUMN archived INTEGER DEFAULT 0');
      console.log('✅ Added archived column to topics table');
    }
    if (!columnNames.includes('ai_instructions')) {
      db.exec('ALTER TABLE topics ADD COLUMN ai_instructions TEXT');
      console.log('✅ Added ai_instructions column to topics table');
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
      console.log('✅ Added annotations column to queries table');
    }
    if (!columnNames.includes('annotations_version')) {
      db.exec('ALTER TABLE queries ADD COLUMN annotations_version INTEGER DEFAULT 0');
      console.log('✅ Added annotations_version column to queries table');
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
      console.log('✅ Added cognitive_signature column to queries table');
    }
    if (!columnNames.includes('cognitive_signature_version')) {
      db.exec('ALTER TABLE queries ADD COLUMN cognitive_signature_version INTEGER DEFAULT 0');
      console.log('✅ Added cognitive_signature_version column to queries table');
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
      console.log('✅ Added raw_thinking column to queries table');
    }
  } catch (error) {
    console.error('[Migration Error] Failed to add raw_thinking column:', error);
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
  } catch (error) {
    console.error('[Migration Failed]', error);
  }
}
