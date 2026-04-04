import { db } from '@/lib/database';
import {
  cleanExpiredSessions as _cleanExpiredSessions,
  cleanupExpiredPKCEVerifiers as _cleanupExpiredPKCEVerifiers,
} from '@/lib/db/auth';

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
  const staleQueries = db
    .prepare(
      `
    SELECT id FROM queries
    WHERE status = 'pending' AND created_at < ?
  `
    )
    .all(oneHourAgo) as Array<{ id: string }>;

  if (staleQueries.length === 0) {
    return { cleaned: 0, queries: [] };
  }

  // Update stale queries to failed status
  const result = db
    .prepare(
      `
    UPDATE queries
    SET status = 'failed',
        result = '{"error": "Timeout - Query exceeded 1 hour processing limit"}',
        completed_at = strftime('%s', 'now')
    WHERE status = 'pending' AND created_at < ?
  `
    )
    .run(oneHourAgo);

  const cleanedIds = staleQueries.map((q) => q.id);
  console.log(
    `[Cleanup] Marked ${result.changes} stale pending queries as failed:`,
    cleanedIds.slice(0, 5)
  );

  return { cleaned: result.changes, queries: cleanedIds };
}

/**
 * Get count of queries by status
 */
export function getQueryStatusCounts(): Record<string, number> {
  const counts = db
    .prepare(
      `
    SELECT status, COUNT(*) as count
    FROM queries
    GROUP BY status
  `
    )
    .all() as Array<{ status: string; count: number }>;

  return counts.reduce(
    (acc, row) => {
      acc[row.status] = row.count;
      return acc;
    },
    {} as Record<string, number>
  );
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
  cleanupIntervalId = setInterval(
    () => {
      runCleanupTasks();
    },
    60 * 60 * 1000
  ); // 1 hour

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
    _cleanExpiredSessions();

    // 3. Clean expired PKCE verifiers
    const expiredPKCE = _cleanupExpiredPKCEVerifiers();

    console.log(
      `[Cleanup] Completed: ${staleQueries} stale queries, ${expiredPKCE} expired PKCE verifiers`
    );
  } catch (error) {
    console.error('[Cleanup] Error during cleanup tasks:', error);
  }
}

/**
 * Schedule cleanup to start after database is fully initialized.
 * Called from database.ts on module load.
 */
export function scheduleCleanup(): void {
  setTimeout(() => {
    startCleanupScheduler();
  }, 5000); // Wait 5 seconds after module load
}
