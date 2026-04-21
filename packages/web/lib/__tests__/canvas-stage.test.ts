import { describe, it, expect, beforeEach, vi } from 'vitest';
import Database from 'better-sqlite3';

// In-memory SQLite DB, shared across tests in this file.
const testDb = new Database(':memory:');
testDb.exec(`
  CREATE TABLE IF NOT EXISTS user_canvas_stage (
    user_id TEXT PRIMARY KEY,
    stage_ids TEXT NOT NULL DEFAULT '[]',
    updated_at INTEGER
  );
`);

// Stub @/lib/database so canvas-stage.ts uses the in-memory DB.
vi.mock('../database', () => ({
  getDatabase: () => testDb,
}));

// Import AFTER the mock so canvas-stage picks up the stubbed getDatabase.
import { getStageIds, setStageIds, toggleStageId } from '../db/canvas-stage';

beforeEach(() => {
  testDb.prepare('DELETE FROM user_canvas_stage').run();
});

describe('canvas-stage helpers', () => {
  it('returns empty array for an unknown user', () => {
    expect(getStageIds('u-unknown')).toEqual([]);
  });

  it('setStageIds + getStageIds roundtrip', () => {
    setStageIds('u-1', ['q1', 'q2']);
    expect(getStageIds('u-1')).toEqual(['q1', 'q2']);
  });

  it('toggleStageId appends when stage has room', () => {
    setStageIds('u-1', ['q1', 'q2']);
    const next = toggleStageId('u-1', 'q3', ['q1', 'q2', 'q3']);
    expect(next).toEqual(['q1', 'q2', 'q3']);
    expect(getStageIds('u-1')).toEqual(['q1', 'q2', 'q3']);
  });

  it('toggleStageId removes when already staged', () => {
    setStageIds('u-1', ['q1', 'q2', 'q3']);
    const next = toggleStageId('u-1', 'q2', ['q1', 'q2', 'q3']);
    expect(next).toEqual(['q1', 'q3']);
  });

  it('toggleStageId bumps oldest when stage is full', () => {
    // q1 is oldest by the sort-asc order; adding q6 should bump q1 since stage caps at 5.
    setStageIds('u-1', ['q1', 'q2', 'q3', 'q4', 'q5']);
    const next = toggleStageId('u-1', 'q6', ['q1', 'q2', 'q3', 'q4', 'q5', 'q6']);
    expect(next).toEqual(['q2', 'q3', 'q4', 'q5', 'q6']);
  });

  it('setStageIds clamps to 5 entries', () => {
    setStageIds('u-1', ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7']);
    expect(getStageIds('u-1')).toEqual(['q1', 'q2', 'q3', 'q4', 'q5']);
  });
});
