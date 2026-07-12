import 'server-only';
import { db } from '@/lib/database';
import type { User } from '@/lib/db/auth';
import { getCreditBalance } from '@/lib/subscription';

/**
 * limits: daily token budgets per tier (monetization v3).
 *
 * free   —    50,000 tokens/day (input + output combined)
 * pro    — 1,000,000 tokens/day
 * legend — unlimited
 *
 * Anonymous (no session) queries never reach this check: simple-query routes them to the
 * free OpenRouter model only ($0 COGS), so they have no budget to consume.
 *
 * Usage is the SUM of queries.tokens_used for completed queries since the start of the
 * current UTC day — no new tables, rides idx_queries_user_id. Cache hits record 0 tokens,
 * so they never consume budget. Resets at midnight UTC by construction.
 */

export type Tier = 'free' | 'pro' | 'legend';

export const TIER_BUDGETS: Record<Tier, number | null> = {
  free: 50_000,
  pro: 1_000_000,
  legend: null, // unlimited
};

export function getTierFor(user: User | null): Tier | 'anonymous' {
  if (!user) return 'anonymous';
  return (['free', 'pro', 'legend'] as const).includes(user.tier) ? user.tier : 'free';
}

/** Epoch seconds for 00:00:00 UTC of the current day (queries.created_at is epoch seconds). */
function startOfUtcDay(): number {
  const now = new Date();
  return Math.floor(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 1000
  );
}

/** Total tokens a user has consumed today (UTC). Completed queries only; cache hits are 0. */
export function getDailyUsage(userId: string): number {
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(tokens_used), 0) AS used
       FROM queries
       WHERE user_id = ? AND created_at >= ? AND status = 'complete'`
    )
    .get(userId, startOfUtcDay()) as { used: number };
  return row.used;
}

export interface BudgetCheck {
  allowed: boolean;
  used: number;
  budget: number | null; // null = unlimited
  tier: Tier | 'anonymous';
  // payment-chain B3: which pool this request draws from. 'credits' means the daily tier budget
  // is already exhausted and the request is covered by the purchased overflow pool — the caller
  // must debit creditsRemaining by the query's tokens_used once it completes.
  source: 'tier' | 'credits';
  creditsRemaining?: number;
}

/** usage{} field for successful query responses (no `allowed` flag — it succeeded). */
export function usageSnapshot(user: User | null): {
  used: number;
  budget: number | null;
  tier: Tier | 'anonymous';
  source: 'tier' | 'credits';
  creditsRemaining?: number;
} {
  const { used, budget, tier, source, creditsRemaining } = checkBudget(user);
  return { used, budget, tier, source, creditsRemaining };
}

/**
 * Pure read — no side effects. Anonymous users are allowed (they only ever hit $0 paths).
 * Enforcement order: daily tier budget first; when that is exhausted, fall back to the purchased
 * credit pool (payment-chain B3). A 402 (allowed:false) fires only when BOTH are empty.
 */
export function checkBudget(user: User | null): BudgetCheck {
  const tier = getTierFor(user);
  if (tier === 'anonymous') {
    return { allowed: true, used: 0, budget: null, tier, source: 'tier' };
  }
  const budget = TIER_BUDGETS[tier];
  const used = getDailyUsage(user!.id);
  if (budget === null || used < budget) {
    return { allowed: true, used, budget, tier, source: 'tier' };
  }
  // Over the daily tier budget — spend from purchased credits if any remain.
  const creditsRemaining = getCreditBalance(user!.id);
  if (creditsRemaining > 0) {
    return { allowed: true, used, budget, tier, source: 'credits', creditsRemaining };
  }
  return { allowed: false, used, budget, tier, source: 'tier', creditsRemaining: 0 };
}
