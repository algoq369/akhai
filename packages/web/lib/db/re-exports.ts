/**
 * Barrel re-exports for database sub-modules.
 * Extracted from database.ts for file-size compliance.
 */

// Re-export auth functions
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

// Re-export query functions
export { createQuery, updateQuery, getQuery, getRecentQueries } from '@/lib/db/queries';

// Re-export event functions
export { addEvent, getEvents } from '@/lib/db/events';

// Re-export stats functions
export { trackUsage, getStats } from '@/lib/db/stats';

// Re-export migration functions
export {
  migrateAddUserIdColumns,
  migrateAddProcessingMode,
  migrateAddTopicsColumns,
} from '@/lib/db/migrations';

// Re-export cleanup functions
export {
  cleanupStalePendingQueries,
  getQueryStatusCounts,
  startCleanupScheduler,
  stopCleanupScheduler,
} from '@/lib/db/cleanup';
