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

type ThreadRow = Omit<ArborealThread, 'messages'> & { messages: string };

const SELECT_COLS =
  'id, user_id AS userId, query_id AS queryId, layer, section_index AS sectionIndex, messages, created_at AS createdAt, updated_at AS updatedAt';

function parseRow(row: ThreadRow): ArborealThread {
  let messages: ArborealMessage[] = [];
  try {
    const parsed = JSON.parse(row.messages);
    if (Array.isArray(parsed)) messages = parsed;
  } catch {
    messages = [];
  }
  return { ...row, messages };
}

export function getThread(userId: string, queryId: string, layer: number): ArborealThread | null {
  const row = getDatabase()
    .prepare(
      `SELECT ${SELECT_COLS} FROM arboreal_threads WHERE user_id = ? AND query_id = ? AND layer = ?`
    )
    .get(userId, queryId, layer) as ThreadRow | undefined;
  return row ? parseRow(row) : null;
}

export function listThreadsForQuery(userId: string, queryId: string): ArborealThread[] {
  const rows = getDatabase()
    .prepare(
      `SELECT ${SELECT_COLS} FROM arboreal_threads WHERE user_id = ? AND query_id = ? ORDER BY layer ASC`
    )
    .all(userId, queryId) as ThreadRow[];
  return rows.map(parseRow);
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
  const msgJson = JSON.stringify(messages);

  if (existing) {
    db.prepare(
      `UPDATE arboreal_threads SET messages = ?, section_index = ?, updated_at = ? WHERE id = ?`
    ).run(msgJson, sectionIndex, now, existing.id);
    return { ...existing, messages, sectionIndex, updatedAt: now };
  }

  const id = 'at-' + now + '-' + Math.random().toString(36).slice(2, 10);
  const insertCols =
    'id, user_id, query_id, layer, section_index, messages, created_at, updated_at';
  db.prepare(`INSERT INTO arboreal_threads (${insertCols}) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id,
    userId,
    queryId,
    layer,
    sectionIndex,
    msgJson,
    now,
    now
  );
  return { id, userId, queryId, layer, sectionIndex, messages, createdAt: now, updatedAt: now };
}
