import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth';
import { checkBudget } from '@/lib/token-budget';
import type { User } from '@/lib/db/auth';

/**
 * budget-guard: one reusable gate every paid-provider route calls at the top, BEFORE any
 * provider call. Closes the cost-DoS surface (audit B2) — previously only simple-query ran
 * checkBudget, so 26 other Anthropic-calling routes could be driven anonymously with no cap.
 *
 * These are plain functions a route invokes (not Next middleware) so each route keeps its own
 * zod/body parsing AFTER the guard, and so the guard can read the session cookie synchronously.
 */

function readUser(request: NextRequest): User | null {
  const token = request.cookies.get('session_token')?.value;
  return token ? getUserFromSession(token) : null;
}

/** 402 body shape identical to simple-query's daily_budget_exceeded response. */
function budgetExceeded(budget: ReturnType<typeof checkBudget>): NextResponse {
  return NextResponse.json(
    {
      error: 'daily_budget_exceeded',
      message: `You've used your daily ${(budget.budget ?? 0).toLocaleString()} tokens on the ${budget.tier} plan — resets at midnight UTC. Upgrade for more.`,
      used: budget.used,
      budget: budget.budget,
      tier: budget.tier,
    },
    { status: 402 }
  );
}

/**
 * Gate a paid route on the caller's daily token budget. Returns { user } on pass, or
 * { user, error } with a 402 when the signed-in user is over budget. Anonymous callers
 * pass the budget check (budget is null) — routes that must not let anon spend Anthropic
 * should ALSO call requireAuth, or route anon → the free model, per that route's nature.
 */
export function guardPaidRoute(request: NextRequest): { user: User | null; error?: NextResponse } {
  const user = readUser(request);
  const budget = checkBudget(user);
  if (!budget.allowed) return { user, error: budgetExceeded(budget) };
  return { user };
}

/**
 * Require an authenticated session AND enforce the budget. Returns { user } on pass, or
 * { error } (401 when anonymous, 402 when over budget). Use for login-only paid features
 * (esoteric, god-view, mindmap extractors, depth/cognitive analysis) so anonymous callers
 * can never reach the paid provider at all — the actual fix for the cost-DoS, not just a check.
 */
export function requireAuth(
  request: NextRequest
): { user: User; error?: undefined } | { user: null; error: NextResponse } {
  const user = readUser(request);
  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: 'authentication_required' }, { status: 401 }),
    };
  }
  const budget = checkBudget(user);
  if (!budget.allowed) return { user: null, error: budgetExceeded(budget) };
  return { user };
}
