/**
 * Canvas stage persistence — tracks which queries (max 5) are staged on the canvas per user.
 * Backing table: user_canvas_stage (see schema.ts).
 */

import { getDatabase } from '../database';

const MAX_STAGE = 5;

export function getStageIds(userId: string): string[] {
  const db = getDatabase();
  const row = db
    .prepare('SELECT stage_ids FROM user_canvas_stage WHERE user_id = ?')
    .get(userId) as { stage_ids: string } | undefined;
  if (!row) return [];
  try {
    const parsed = JSON.parse(row.stage_ids);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id: unknown): id is string => typeof id === 'string').slice(0, MAX_STAGE);
  } catch {
    return [];
  }
}

export function setStageIds(userId: string, stageIds: string[]): void {
  const db = getDatabase();
  const validated = Array.isArray(stageIds)
    ? stageIds.filter((id): id is string => typeof id === 'string').slice(0, MAX_STAGE)
    : [];
  const json = JSON.stringify(validated);
  db.prepare(
    `INSERT INTO user_canvas_stage (user_id, stage_ids, updated_at)
     VALUES (?, ?, strftime('%s', 'now'))
     ON CONFLICT(user_id) DO UPDATE SET
       stage_ids = excluded.stage_ids,
       updated_at = excluded.updated_at`
  ).run(userId, json);
}

/**
 * Toggle a query's presence on the stage.
 * - If already on stage: remove.
 * - If not on stage and stage has room: append.
 * - If not on stage and stage is full: bump the oldest (per allQueriesByIdSortedByCreatedAsc order) and append.
 *
 * @param allQueriesByIdSortedByCreatedAsc list of all query ids for this user, oldest first.
 *        Used to resolve which staged id is "oldest" when auto-bumping.
 */
export function toggleStageId(
  userId: string,
  queryId: string,
  allQueriesByIdSortedByCreatedAsc: string[]
): string[] {
  const current = getStageIds(userId);

  if (current.includes(queryId)) {
    const next = current.filter((id) => id !== queryId);
    setStageIds(userId, next);
    return next;
  }

  if (current.length < MAX_STAGE) {
    const next = [...current, queryId];
    setStageIds(userId, next);
    return next;
  }

  // Stage full: bump oldest of current by the provided global order.
  const oldestOnStage = allQueriesByIdSortedByCreatedAsc.find((id) => current.includes(id));
  const next = current.filter((id) => id !== oldestOnStage).concat([queryId]);
  setStageIds(userId, next);
  return next;
}
