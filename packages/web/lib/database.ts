/**
 * SQLite Database for AkhAI
 *
 * Provides persistent storage for queries, events, and usage statistics.
 */

import Database from 'better-sqlite3';
import path from 'path';
import { SCHEMA_SQL } from '@/lib/db/schema';
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
db.exec(SCHEMA_SQL);

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

// Re-export all sub-module functions via barrel (extracted to lib/db/re-exports.ts)
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
  createQuery,
  updateQuery,
  getQuery,
  getRecentQueries,
  addEvent,
  getEvents,
  trackUsage,
  getStats,
  migrateAddUserIdColumns,
  migrateAddProcessingMode,
  migrateAddTopicsColumns,
  cleanupStalePendingQueries,
  getQueryStatusCounts,
  startCleanupScheduler,
  stopCleanupScheduler,
} from '@/lib/db/re-exports';

// Auto-start cleanup scheduler when module loads
import { scheduleCleanup } from '@/lib/db/cleanup';
scheduleCleanup();
