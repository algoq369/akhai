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
 * Run all migrations. Called from database.ts on module load.
 */
export function runMigrations() {
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
}
