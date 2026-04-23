import { describe, it, expect, beforeEach, vi } from 'vitest';
import Database from 'better-sqlite3';

const testDb = new Database(':memory:');
testDb.exec(`
  CREATE TABLE IF NOT EXISTS arboreal_threads (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    query_id TEXT NOT NULL,
    layer INTEGER NOT NULL,
    section_index INTEGER DEFAULT 0,
    messages TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
  );
`);

vi.mock('../database', () => ({
  getDatabase: () => testDb,
}));

import { getThread, listThreadsForQuery, appendMessage } from '../db/arboreal-threads';

beforeEach(() => {
  testDb.prepare('DELETE FROM arboreal_threads').run();
});

describe('arboreal-threads helpers', () => {
  it('getThread returns null for non-existent thread', () => {
    expect(getThread('u-1', 'q-1', 0)).toBeNull();
  });

  it('appendMessage creates a new thread when none exists', () => {
    const thread = appendMessage('u-1', 'q-1', 2, 0, {
      role: 'user',
      content: 'hello',
      timestamp: 1000,
    });
    expect(thread.userId).toBe('u-1');
    expect(thread.queryId).toBe('q-1');
    expect(thread.layer).toBe(2);
    expect(thread.messages).toHaveLength(1);
    expect(thread.messages[0].content).toBe('hello');
  });

  it('appendMessage appends to existing thread', () => {
    appendMessage('u-1', 'q-1', 2, 0, { role: 'user', content: 'hi', timestamp: 1 });
    const second = appendMessage('u-1', 'q-1', 2, 0, {
      role: 'assistant',
      content: 'reply',
      timestamp: 2,
    });
    expect(second.messages).toHaveLength(2);
    expect(second.messages[0].content).toBe('hi');
    expect(second.messages[1].content).toBe('reply');
  });

  it('getThread returns thread with parsed messages', () => {
    appendMessage('u-1', 'q-1', 3, 1, { role: 'user', content: 'x', timestamp: 10 });
    const thread = getThread('u-1', 'q-1', 3);
    expect(thread).not.toBeNull();
    expect(thread?.messages[0].content).toBe('x');
    expect(thread?.sectionIndex).toBe(1);
  });

  it('listThreadsForQuery returns all threads for a query', () => {
    appendMessage('u-1', 'q-1', 0, 0, { role: 'user', content: 'a', timestamp: 1 });
    appendMessage('u-1', 'q-1', 5, 0, { role: 'user', content: 'b', timestamp: 2 });
    appendMessage('u-1', 'q-2', 0, 0, { role: 'user', content: 'c', timestamp: 3 });
    const threads = listThreadsForQuery('u-1', 'q-1');
    expect(threads).toHaveLength(2);
    expect(threads.map((t) => t.layer).sort()).toEqual([0, 5]);
  });

  it('listThreadsForQuery returns empty array when no threads exist', () => {
    expect(listThreadsForQuery('u-1', 'q-nonexistent')).toEqual([]);
  });
});
