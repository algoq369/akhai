import 'server-only';

/**
 * COGS per-call scorecard (B0/B1) — the measurement instrument.
 *
 * Records one reconciling row per LLM call: token breakdown (incl. cache),
 * cost, duration, and outcome. In-memory ring buffer; read it back per-query to
 * reconcile total tokens and cost. This is the instrument WEBNA mandates BEFORE
 * any token optimization — you can't optimize what you don't measure.
 */

export interface CogsRow {
  queryId: string;
  purpose: string;
  model: string;
  inTok: number;
  cacheRead: number;
  cacheCreation: number;
  outTok: number;
  durationMs: number;
  costUSD: number;
  outcome: 'ok' | 'empty' | 'error';
  objectiveMet: boolean | null;
}

const MAX_ROWS = 500;
const rows: CogsRow[] = [];

/** Record one per-call row. In dev, also logs a one-liner for live visibility. */
export function recordCall(row: CogsRow): void {
  rows.push(row);
  if (rows.length > MAX_ROWS) rows.shift(); // evict oldest

  if (process.env.NODE_ENV !== 'production') {
    console.debug(
      `[COGS] ${row.purpose} ${row.model} in=${row.inTok} cR=${row.cacheRead} cC=${row.cacheCreation} out=${row.outTok} $${row.costUSD.toFixed(6)} ${row.durationMs}ms`
    );
  }
}

/** Copy of the current scorecard rows (newest last). */
export function getScorecard(): CogsRow[] {
  return rows.slice();
}

export interface QueryAggregate {
  calls: number;
  inTok: number;
  cacheRead: number;
  cacheCreation: number;
  outTok: number;
  totalTokens: number;
  costUSD: number;
}

/** Reconciling aggregate for one queryId: summed tokens (all four buckets) and cost. */
export function getQueryAggregate(queryId: string): QueryAggregate {
  const agg: QueryAggregate = {
    calls: 0,
    inTok: 0,
    cacheRead: 0,
    cacheCreation: 0,
    outTok: 0,
    totalTokens: 0,
    costUSD: 0,
  };
  for (const r of rows) {
    if (r.queryId !== queryId) continue;
    agg.calls += 1;
    agg.inTok += r.inTok;
    agg.cacheRead += r.cacheRead;
    agg.cacheCreation += r.cacheCreation;
    agg.outTok += r.outTok;
    agg.costUSD += r.costUSD;
  }
  agg.totalTokens = agg.inTok + agg.cacheRead + agg.cacheCreation + agg.outTok;
  return agg;
}

/** Clear all rows (tests). */
export function clearScorecard(): void {
  rows.length = 0;
}
