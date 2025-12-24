/**
 * Query store with SQLite persistence and in-memory cache
 */

import {
  createQuery as dbCreateQuery,
  updateQuery as dbUpdateQuery,
  getQuery as dbGetQuery,
  addEvent as dbAddEvent,
  getEvents as dbGetEvents,
} from './database';

export interface QueryEvent {
  type:
    | 'advisor-start'
    | 'advisor-complete'
    | 'advisor-response'
    | 'consensus-reached'
    | 'round-complete'
    | 'redactor-start'
    | 'redactor-complete'
    | 'redactor-synthesis'
    | 'mother-base-review'
    | 'mother-base-decision'
    | 'sub-agent-start'
    | 'sub-agent-complete'
    | 'sub-agent-response'
    | 'complete'
    | 'error'
    // GTP-specific events
    | 'gtp-analysis'
    | 'flash-prepare'
    | 'flash-broadcast'
    | 'advisor-failed'
    | 'merge-update'
    | 'quorum-progress'
    | 'quorum-reached'
    | 'synthesis-start'
    | 'synthesis-complete'
    // Direct mode event
    | 'fast-path';
  data: any;
  timestamp: number;
}

export interface QueryData {
  query: string;
  flow: 'A' | 'B' | 'direct' | 'gtp' | 'cot' | 'aot' | 'auto';
  status: 'pending' | 'processing' | 'complete' | 'error';
  result?: any;
  events: QueryEvent[];
  error?: string;
}

// In-memory cache for fast access
export const queries = new Map<string, QueryData>();

/**
 * Create a new query (persists to database)
 */
export function createQueryRecord(id: string, query: string, flow: QueryData['flow']): void {
  const queryData: QueryData = {
    query,
    flow,
    status: 'pending',
    events: [],
  };

  queries.set(id, queryData);

  // Persist to database (store methodology in flow field for backward compatibility)
  try {
    dbCreateQuery(id, query, flow);
  } catch (error) {
    console.error('Failed to create query in database:', error);
  }
}

/**
 * Update query status (persists to database)
 */
export function updateQueryStatus(
  queryId: string,
  status: QueryData['status'],
  result?: any,
  error?: string
): void {
  const queryData = queries.get(queryId);
  if (!queryData) return;

  queryData.status = status;
  if (result) queryData.result = result;
  if (error) queryData.error = error;

  // Persist to database
  try {
    dbUpdateQuery(queryId, { status, result: result ? JSON.stringify(result) : undefined }, null);
  } catch (dbError) {
    console.error('Failed to update query in database:', dbError);
  }
}

/**
 * Add an event to a query's event stream (persists to database)
 */
export function addQueryEvent(queryId: string, type: QueryEvent['type'], data: any): void {
  const queryData = queries.get(queryId);
  if (!queryData) return;

  const event = {
    type,
    data,
    timestamp: Date.now(),
  };

  queryData.events.push(event);

  // Persist to database
  try {
    dbAddEvent(queryId, type, data);
  } catch (error) {
    console.error('Failed to add event to database:', error);
  }
}

/**
 * Get events for a query starting from a specific index
 */
export function getQueryEvents(queryId: string, fromIndex: number = 0): QueryEvent[] {
  const queryData = queries.get(queryId);
  if (!queryData) return [];

  return queryData.events.slice(fromIndex);
}

/**
 * Load query from database if not in memory
 */
export function loadQuery(queryId: string): QueryData | null {
  // Check memory cache first
  if (queries.has(queryId)) {
    return queries.get(queryId)!;
  }

  // Try to load from database
  try {
    const dbQuery = dbGetQuery(queryId) as any;
    if (!dbQuery) return null;

    const events = dbGetEvents(queryId).map((e) => ({
      type: e.type as QueryEvent['type'],
      data: JSON.parse(e.data),
      timestamp: e.timestamp * 1000, // Convert to milliseconds
    }));

    const queryData: QueryData = {
      query: dbQuery.query,
      flow: dbQuery.flow,
      status: dbQuery.status,
      result: dbQuery.result ? JSON.parse(dbQuery.result) : undefined,
      events,
      error: undefined,
    };

    // Cache in memory
    queries.set(queryId, queryData);

    return queryData;
  } catch (error) {
    console.error('Failed to load query from database:', error);
    return null;
  }
}
