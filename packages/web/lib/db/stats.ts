import { db } from '@/lib/database';

/**
 * Track API usage
 */
export function trackUsage(
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
  cost: number
) {
  const stmt = db.prepare(
    'INSERT INTO usage (provider, model, input_tokens, output_tokens, cost) VALUES (?, ?, ?, ?, ?)'
  );
  stmt.run(provider, model, inputTokens, outputTokens, cost);
}

/**
 * Get dashboard statistics (optionally scoped to user)
 */
export function getStats(userId?: string | null) {
  const now = Math.floor(Date.now() / 1000);
  const todayStart = now - (now % 86400);

  // Start of current month
  const date = new Date();
  const monthStart = Math.floor(new Date(date.getFullYear(), date.getMonth(), 1).getTime() / 1000);

  const userFilter = userId ? 'AND user_id = ?' : '';
  const userParams = userId ? [userId] : [];

  const queriesToday = db
    .prepare(`SELECT COUNT(*) as count FROM queries WHERE created_at >= ? ${userFilter}`)
    .get(...(userId ? [todayStart, userId] : [todayStart])) as any;

  const queriesMonth = db
    .prepare(`SELECT COUNT(*) as count FROM queries WHERE created_at >= ? ${userFilter}`)
    .get(...(userId ? [monthStart, userId] : [monthStart])) as any;

  const totals = db
    .prepare(
      `SELECT SUM(tokens_used) as tokens, SUM(cost) as cost FROM queries ${userId ? 'WHERE user_id = ?' : ''}`
    )
    .get(...userParams) as any;

  const avgTime = db
    .prepare(
      `SELECT AVG(completed_at - created_at) as avg FROM queries WHERE status = 'complete' AND completed_at IS NOT NULL ${userFilter}`
    )
    .get(...userParams) as any;

  const providerStats = db
    .prepare(
      `SELECT provider, COUNT(*) as queries, SUM(cost) as cost
       FROM usage
       GROUP BY provider`
    )
    .all() as Array<{ provider: string; queries: number; cost: number }>;

  return {
    queriesToday: queriesToday?.count || 0,
    queriesThisMonth: queriesMonth?.count || 0,
    totalTokens: totals?.tokens || 0,
    totalCost: totals?.cost || 0,
    avgResponseTime: avgTime?.avg || 0,
    providerStats,
  };
}
