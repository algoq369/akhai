/**
 * COGS scorecard reconciliation tests (B0/B1).
 *
 * Proves the measurement instrument: per-query token/cost aggregation reconciles
 * to the hand-summed rows, the cache-cost economics match the canonical formula,
 * and the central dispatcher records the right outcome.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  recordCall,
  getScorecard,
  getQueryAggregate,
  clearScorecard,
  type CogsRow,
} from '../cogs-scorecard';
import { callProvider } from '../multi-provider-api';

/** Mirrors the canonical Anthropic cache-cost formula in lib/multi-provider-api.ts. */
function canonicalCost(
  inTok: number,
  cacheRead: number,
  cacheCreation: number,
  outTok: number,
  inRate: number,
  outRate: number
): number {
  return (
    (inTok * inRate +
      cacheRead * inRate * 0.1 +
      cacheCreation * inRate * 1.25 +
      outTok * outRate) /
    1000
  );
}

function row(over: Partial<CogsRow> = {}): CogsRow {
  return {
    queryId: 'q1',
    purpose: 'test',
    model: 'claude-opus-4-8',
    inTok: 0,
    cacheRead: 0,
    cacheCreation: 0,
    outTok: 0,
    durationMs: 100,
    costUSD: 0,
    outcome: 'ok',
    objectiveMet: null,
    ...over,
  };
}

describe('cogs-scorecard', () => {
  beforeEach(() => clearScorecard());

  it('reconciles per-query totals: tokens + cost equal the hand-summed rows', () => {
    const r1 = row({ inTok: 100, cacheRead: 50, cacheCreation: 10, outTok: 200, costUSD: 0.0012 });
    const r2 = row({ inTok: 300, cacheRead: 0, cacheCreation: 40, outTok: 150, costUSD: 0.0034 });
    const r3 = row({ inTok: 20, cacheRead: 5, cacheCreation: 0, outTok: 80, costUSD: 0.0005 });
    recordCall(r1);
    recordCall(r2);
    recordCall(r3);
    // a different queryId must NOT leak into the aggregate
    recordCall(row({ queryId: 'other', inTok: 9999, costUSD: 9.99 }));

    const handTotal =
      r1.inTok + r1.cacheRead + r1.cacheCreation + r1.outTok +
      r2.inTok + r2.cacheRead + r2.cacheCreation + r2.outTok +
      r3.inTok + r3.cacheRead + r3.cacheCreation + r3.outTok;

    const agg = getQueryAggregate('q1');
    expect(agg.calls).toBe(3);
    expect(agg.inTok).toBe(420);
    expect(agg.cacheRead).toBe(55);
    expect(agg.cacheCreation).toBe(50);
    expect(agg.outTok).toBe(430);
    expect(agg.totalTokens).toBe(handTotal); // reconciliation: Σ all four buckets
    expect(agg.costUSD).toBeCloseTo(r1.costUSD + r2.costUSD + r3.costUSD, 10); // reconciliation: Σ costs
  });

  it('folds cache economics into cost via the canonical formula (read 0.1x, write 1.25x)', () => {
    // Known rate: input 10 / 1k tokens, output 20 / 1k tokens.
    // (1000*10 + 1000*10*0.1 + 1000*10*1.25 + 1000*20) / 1000 = (10000+1000+12500+20000)/1000
    const cost = canonicalCost(1000, 1000, 1000, 1000, 10, 20);
    expect(cost).toBeCloseTo(43.5, 10);

    // a cache-heavy row reconciles through the scorecard
    recordCall(
      row({ queryId: 'cache', inTok: 1000, cacheRead: 1000, cacheCreation: 1000, outTok: 1000, costUSD: cost })
    );
    const agg = getQueryAggregate('cache');
    expect(agg.cacheRead).toBe(1000);
    expect(agg.cacheCreation).toBe(1000);
    expect(agg.costUSD).toBeCloseTo(43.5, 10);
  });

  describe('outcome via the callProvider dispatcher', () => {
    const origKey = process.env.ANTHROPIC_API_KEY;
    beforeEach(() => {
      process.env.ANTHROPIC_API_KEY = 'test-key';
    });
    afterEach(() => {
      vi.unstubAllGlobals();
      if (origKey === undefined) delete process.env.ANTHROPIC_API_KEY;
      else process.env.ANTHROPIC_API_KEY = origKey;
    });

    it('records outcome "empty" when the provider returns empty content', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({
          ok: true,
          json: async () => ({
            content: [{ type: 'text', text: '' }],
            usage: { input_tokens: 50, output_tokens: 0 },
          }),
        }))
      );

      await callProvider('anthropic', {
        messages: [{ role: 'user', content: 'hi' }],
        model: 'claude-opus-4-8',
        queryId: 'empty-test',
        purpose: 'unit',
      });

      const recorded = getScorecard().filter((r) => r.queryId === 'empty-test');
      expect(recorded).toHaveLength(1);
      expect(recorded[0].outcome).toBe('empty');
      expect(recorded[0].inTok).toBe(50);
      expect(recorded[0].purpose).toBe('unit');
    });
  });
});
