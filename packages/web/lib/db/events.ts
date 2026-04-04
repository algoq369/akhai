import { db } from '@/lib/database';

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
