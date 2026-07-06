/**
 * Migration Script: Assign existing data to anonymous user
 * 
 * This script should be run once when user profiles are first introduced.
 * It creates an anonymous user and assigns all existing queries/topics to that user.
 */

import { db, getOrCreateAnonymousUser } from '../database';
import { log } from '../logger';

export function migrateToUsers() {
  log('INFO', 'DB_MIGRATIONS', 'Starting migration to user-based system');
  
  try {
    // Get or create anonymous user
    const anonymousUser = getOrCreateAnonymousUser();
    log('INFO', 'DB_MIGRATIONS', `Anonymous user created/found: ${anonymousUser.id}`);
    
    // Update all queries without user_id to anonymous user
    const queriesUpdated = db.prepare(`
      UPDATE queries 
      SET user_id = ? 
      WHERE user_id IS NULL
    `).run(anonymousUser.id).changes;
    log('INFO', 'DB_MIGRATIONS', `Updated ${queriesUpdated} queries with anonymous user`);
    
    // Update all topics without user_id to anonymous user
    const topicsUpdated = db.prepare(`
      UPDATE topics 
      SET user_id = ? 
      WHERE user_id IS NULL
    `).run(anonymousUser.id).changes;
    log('INFO', 'DB_MIGRATIONS', `Updated ${topicsUpdated} topics with anonymous user`);
    
    // Update all synopses without user_id to anonymous user
    const synopsesUpdated = db.prepare(`
      UPDATE synopses 
      SET user_id = ? 
      WHERE user_id IS NULL
    `).run(anonymousUser.id).changes;
    log('INFO', 'DB_MIGRATIONS', `Updated ${synopsesUpdated} synopses with anonymous user`);
    
    // Update all topic_relationships without user_id to anonymous user
    const relationshipsUpdated = db.prepare(`
      UPDATE topic_relationships 
      SET user_id = ? 
      WHERE user_id IS NULL
    `).run(anonymousUser.id).changes;
    log('INFO', 'DB_MIGRATIONS', `Updated ${relationshipsUpdated} topic relationships with anonymous user`);
    
    log('INFO', 'DB_MIGRATIONS', 'Migration completed successfully!');
    return {
      success: true,
      anonymousUserId: anonymousUser.id,
      queriesUpdated,
      topicsUpdated,
      synopsesUpdated,
      relationshipsUpdated,
    };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateToUsers();
}

