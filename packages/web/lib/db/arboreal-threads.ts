/**
 * Arboreal threads — per-block chat persistence.
 * One thread per (user_id, query_id, layer). Messages stored as JSON in TEXT.
 */

import { getDatabase } from '../database';

export interface ArborealMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ArborealThread {
  id: string;
  userId: string;
  queryId: string;
  layer: number;
  sectionIndex: number;
  messages: ArborealMessage[];
  createdAt: number;
  updatedAt: number;
}

interface ThreadRow {
  id: string;
  user_id: string;
  query_id: string;
  layer: number;
  section_index: number;
  messages: string;
  created_at: number;
  updated_at: number;
}

function rowToThread(row: ThreadRow): ArborealThread {
  let messages: ArborealMessage[] = [];
  try {
    const parsed = JSON.parse(row.messages);
    if (Array.isArray(parsed)) messages = parsed;
  } catch {
    messages = [];
  }
  return {
    id: row.id,
    userId: row.user_id,
    queryId: row.query_id,
    layer: row.layer,
    sectionIndex: row.section_index,
    messages,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const COLS = 'id, user_id, query_id, layer, section_index, messages, created_at, updated_at';

export function getThread(userId: string, queryId: string, layer: number): ArborealThread | null {
  const row = getDatabase()
    .prepare(
      `SELECT ${COLS} FROM arboreal_threads WHERE user_id = ? AND query_id = ? AND layer = ?`
    )
    .get(userId, queryId, layer) as ThreadRow | undefined;
  return row ? rowToThread(row) : null;
}

export function listThreadsForQuery(userId: string, queryId: string): ArborealThread[] {
  const rows = getDatabase()
    .prepare(
      `SELECT ${COLS} FROM arboreal_threads WHERE user_id = ? AND query_id = ? ORDER BY layer ASC`
    )
    .all(userId, queryId) as ThreadRow[];
  return rows.map(rowToThread);
}

export function appendMessage(
  userId: string,
  queryId: string,
  layer: number,
  sectionIndex: number,
  message: ArborealMessage
): ArborealThread {
  const existing = getThread(userId, queryId, layer);
  const messages = existing ? [...existing.messages, message] : [message];
  const db = getDatabase();
  const now = Math.floor(Date.now() / 1000);

  if (existing) {
    db.prepare(
      `UPDATE arboreal_threads SET messages = ?, section_index = ?, updated_at = ? WHERE id = ?`
    ).run(JSON.stringify(messages), sectionIndex, now, existing.id);
    return { ...existing, messages, sectionIndex, updatedAt: now };
  }

  const id = 'at-' + now + '-' + Math.random().toString(36).slice(2, 10);
  db.prepare(`INSERT INTO arboreal_threads (${COLS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id,
    userId,
    queryId,
    layer,
    sectionIndex,
    JSON.stringify(messages),
    now,
    now
  );
  return { id, userId, queryId, layer, sectionIndex, messages, createdAt: now, updatedAt: now };
}
