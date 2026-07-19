import 'server-only';
import { db } from '@/lib/database';

/**
 * data-deletion: make the privacy page's promise real. deleteAllUserData removes EVERY row a user
 * owns across all 30+ user-scoped tables in a SINGLE transaction, children-before-parents so no
 * foreign-key violation and no orphan is ever created (foreign_keys is ON — an out-of-order delete
 * throws and rolls the whole thing back). Idempotent-safe: on an already-deleted user every
 * statement simply matches 0 rows.
 *
 * NOT deleted (not user-scoped): `usage` (global provider/token telemetry, no user link),
 * `processed_webhook_events` (global Stripe idempotency), `implementation_log` (dev sessions),
 * `wallet_nonces` (transient, address-keyed, single-use, 5-min TTL — no user_id).
 */

// Ordered children-first. Each entry deletes only rows belonging to @uid, either by a direct
// user_id or by scoping through the user's queries / topics / grimoires / agent_configs / chats.
// The scoping subqueries all read tables that are deleted LATER in this list, so they resolve.
const DELETE_ORDER: ReadonlyArray<readonly [string, string]> = [
  // ---- grimoire subtree (deepest children first) ----
  ['grimoire_memories', `DELETE FROM grimoire_memories WHERE grimoire_id IN (SELECT id FROM grimoires WHERE user_id = @uid)`],
  ['grimoire_mindmap_edges', `DELETE FROM grimoire_mindmap_edges WHERE grimoire_id IN (SELECT id FROM grimoires WHERE user_id = @uid)`],
  ['grimoire_messages', `DELETE FROM grimoire_messages WHERE conversation_id IN (SELECT id FROM grimoire_conversations WHERE grimoire_id IN (SELECT id FROM grimoires WHERE user_id = @uid))`],
  ['grimoire_mindmap_nodes', `DELETE FROM grimoire_mindmap_nodes WHERE grimoire_id IN (SELECT id FROM grimoires WHERE user_id = @uid)`],
  ['grimoire_files', `DELETE FROM grimoire_files WHERE grimoire_id IN (SELECT id FROM grimoires WHERE user_id = @uid)`],
  ['grimoire_links', `DELETE FROM grimoire_links WHERE grimoire_id IN (SELECT id FROM grimoires WHERE user_id = @uid)`],
  ['grimoire_conversations', `DELETE FROM grimoire_conversations WHERE grimoire_id IN (SELECT id FROM grimoires WHERE user_id = @uid)`],

  // ---- agent subtree ----
  ['agent_knowledge', `DELETE FROM agent_knowledge WHERE agent_config_id IN (SELECT id FROM agent_configs WHERE user_id = @uid)`],
  ['training_sessions', `DELETE FROM training_sessions WHERE user_id = @uid`],

  // ---- query children (scoped through the user's queries) ----
  ['events', `DELETE FROM events WHERE query_id IN (SELECT id FROM queries WHERE user_id = @uid)`],
  ['query_topics', `DELETE FROM query_topics WHERE query_id IN (SELECT id FROM queries WHERE user_id = @uid)`],
  ['hermetic_analysis', `DELETE FROM hermetic_analysis WHERE query_id IN (SELECT id FROM queries WHERE user_id = @uid)`],
  ['topic_evolution_events', `DELETE FROM topic_evolution_events WHERE query_id IN (SELECT id FROM queries WHERE user_id = @uid)`],
  ['living_topic_edges', `DELETE FROM living_topic_edges WHERE first_seen_query_id IN (SELECT id FROM queries WHERE user_id = @uid) OR last_seen_query_id IN (SELECT id FROM queries WHERE user_id = @uid)`],
  ['living_topics', `DELETE FROM living_topics WHERE emergence_query_id IN (SELECT id FROM queries WHERE user_id = @uid) OR dissolution_query_id IN (SELECT id FROM queries WHERE user_id = @uid)`],
  ['point_transactions', `DELETE FROM point_transactions WHERE user_id = @uid`],
  ['arboreal_threads', `DELETE FROM arboreal_threads WHERE user_id = @uid`],
  ['conversation_syntheses', `DELETE FROM conversation_syntheses WHERE chat_id IN (SELECT chat_id FROM queries WHERE user_id = @uid AND chat_id IS NOT NULL)`],

  // ---- topic children, then the parent tables ----
  ['synopses', `DELETE FROM synopses WHERE user_id = @uid`],
  ['topic_relationships', `DELETE FROM topic_relationships WHERE user_id = @uid`],
  ['queries', `DELETE FROM queries WHERE user_id = @uid`],
  ['topics', `DELETE FROM topics WHERE user_id = @uid`],
  ['agent_configs', `DELETE FROM agent_configs WHERE user_id = @uid`],
  ['grimoires', `DELETE FROM grimoires WHERE user_id = @uid`],

  // ---- direct user-owned rows ----
  ['sessions', `DELETE FROM sessions WHERE user_id = @uid`],
  ['subscriptions', `DELETE FROM subscriptions WHERE user_id = @uid`],
  ['payment_records', `DELETE FROM payment_records WHERE user_id = @uid`],
  ['crypto_payments', `DELETE FROM crypto_payments WHERE user_id = @uid`],
  ['btcpay_payments', `DELETE FROM btcpay_payments WHERE user_id = @uid`],
  ['linked_accounts', `DELETE FROM linked_accounts WHERE user_id = @uid`],
  ['social_connections', `DELETE FROM social_connections WHERE user_id = @uid`],
  ['pkce_verifiers', `DELETE FROM pkce_verifiers WHERE user_id = @uid`],
  ['tree_configurations', `DELETE FROM tree_configurations WHERE user_id = @uid`],
  ['user_canvas_stage', `DELETE FROM user_canvas_stage WHERE user_id = @uid`],
  ['user_points', `DELETE FROM user_points WHERE user_id = @uid`],

  // ---- the user row itself, last ----
  ['users', `DELETE FROM users WHERE id = @uid`],
];

export interface DeletionResult {
  userId: string;
  totalRows: number;
  perTable: Record<string, number>;
}

/**
 * Delete every row owned by `userId`, children before parents, in one transaction. Returns a
 * per-table count of rows removed. Throws (and rolls back) on any DB error — never a partial delete.
 */
export function deleteAllUserData(userId: string): DeletionResult {
  const tx = db.transaction((uid: string) => {
    const perTable: Record<string, number> = {};
    let totalRows = 0;
    for (const [table, sql] of DELETE_ORDER) {
      const { changes } = db.prepare(sql).run({ uid });
      if (changes > 0) {
        perTable[table] = changes;
        totalRows += changes;
      }
    }
    return { perTable, totalRows };
  });
  const { perTable, totalRows } = tx(userId);
  return { userId, totalRows, perTable };
}

/**
 * True when the user has a still-billing paid subscription — deletion is blocked so we never delete
 * an account that Stripe keeps charging. 'free' plans and already-cancelling subs do not block.
 */
export function hasActivePaidSubscription(userId: string): boolean {
  const row = db
    .prepare(
      `SELECT 1 FROM subscriptions
        WHERE user_id = ?
          AND status IN ('active', 'trialing', 'past_due')
          AND plan IS NOT NULL AND plan != 'free'
          AND COALESCE(cancel_at_period_end, 0) = 0
        LIMIT 1`
    )
    .get(userId);
  return !!row;
}
