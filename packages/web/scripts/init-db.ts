#!/usr/bin/env tsx
/**
 * Database Initialization Script
 *
 * Run this script to initialize or migrate the AkhAI database.
 * Safe to run multiple times - uses IF NOT EXISTS and safe migrations.
 *
 * Usage:
 *   pnpm tsx scripts/init-db.ts
 *   # or
 *   npx tsx scripts/init-db.ts
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
console.log(`[DB Init] Database path: ${dbPath}`);

const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
console.log('[DB Init] WAL mode enabled');

// Schema version tracking
const SCHEMA_VERSION = 3;

// Get current schema version
function getSchemaVersion(): number {
  try {
    const result = db.prepare('SELECT version FROM schema_version LIMIT 1').get() as { version: number } | undefined;
    return result?.version || 0;
  } catch {
    return 0;
  }
}

// Set schema version
function setSchemaVersion(version: number): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL);
    DELETE FROM schema_version;
  `);
  db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(version);
}

// Migration v1: Initial schema
function migrateV1() {
  console.log('[DB Init] Applying migration v1: Initial schema');

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

    -- Queries table
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

    -- Events table
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query_id TEXT NOT NULL,
      type TEXT NOT NULL,
      data TEXT,
      timestamp INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (query_id) REFERENCES queries(id)
    );

    -- Usage tracking
    CREATE TABLE IF NOT EXISTS usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      input_tokens INTEGER NOT NULL,
      output_tokens INTEGER NOT NULL,
      cost REAL NOT NULL,
      timestamp INTEGER DEFAULT (strftime('%s', 'now'))
    );

    -- Create indexes for common queries
    CREATE INDEX IF NOT EXISTS idx_queries_user_id ON queries(user_id);
    CREATE INDEX IF NOT EXISTS idx_queries_created_at ON queries(created_at);
    CREATE INDEX IF NOT EXISTS idx_events_query_id ON events(query_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
  `);
}

// Migration v2: Side Canal system
function migrateV2() {
  console.log('[DB Init] Applying migration v2: Side Canal system');

  db.exec(`
    -- Topics table
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

    -- Topic relationships
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

    -- Query-Topic mapping
    CREATE TABLE IF NOT EXISTS query_topics (
      query_id TEXT NOT NULL,
      topic_id TEXT NOT NULL,
      relevance REAL DEFAULT 1.0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      PRIMARY KEY (query_id, topic_id),
      FOREIGN KEY (query_id) REFERENCES queries(id),
      FOREIGN KEY (topic_id) REFERENCES topics(id)
    );

    -- Synopses
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
    CREATE INDEX IF NOT EXISTS idx_topics_user_id ON topics(user_id);
    CREATE INDEX IF NOT EXISTS idx_topics_category ON topics(category);
  `);
}

// Migration v3: Implementation tracking and gnostic metadata
function migrateV3() {
  console.log('[DB Init] Applying migration v3: Implementation tracking & gnostic metadata');

  db.exec(`
    -- Implementation log
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
      FOREIGN KEY (parent_id) REFERENCES implementation_log(id)
    );

    -- Add gnostic_metadata column to queries (if not exists)
    -- SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so we check first
  `);

  // Check if gnostic_metadata column exists
  const columns = db.prepare("PRAGMA table_info(queries)").all() as { name: string }[];
  const hasGnosticMetadata = columns.some(col => col.name === 'gnostic_metadata');

  if (!hasGnosticMetadata) {
    console.log('[DB Init] Adding gnostic_metadata column to queries table');
    db.exec('ALTER TABLE queries ADD COLUMN gnostic_metadata TEXT;');
  }
}

// Run migrations
function runMigrations() {
  const currentVersion = getSchemaVersion();
  console.log(`[DB Init] Current schema version: ${currentVersion}`);
  console.log(`[DB Init] Target schema version: ${SCHEMA_VERSION}`);

  if (currentVersion >= SCHEMA_VERSION) {
    console.log('[DB Init] Database is up to date');
    return;
  }

  console.log('[DB Init] Starting migrations...');

  // Run each migration if needed
  if (currentVersion < 1) migrateV1();
  if (currentVersion < 2) migrateV2();
  if (currentVersion < 3) migrateV3();

  // Update schema version
  setSchemaVersion(SCHEMA_VERSION);
  console.log(`[DB Init] Migrations complete. Schema version: ${SCHEMA_VERSION}`);
}

// Main
try {
  runMigrations();
  console.log('[DB Init] Database initialization successful');

  // Print table stats
  const tables = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all() as { name: string }[];

  console.log(`\n[DB Init] Tables (${tables.length}):`);
  for (const table of tables) {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get() as { count: number };
    console.log(`  - ${table.name}: ${count.count} rows`);
  }
} catch (error) {
  console.error('[DB Init] Error:', error);
  process.exit(1);
} finally {
  db.close();
}
