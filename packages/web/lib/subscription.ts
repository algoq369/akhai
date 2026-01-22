/**
 * Subscription Management
 * Helper functions for managing user subscriptions, tiers, and token balances
 */

import { db } from './database'
import { randomBytes } from 'crypto'

export type Tier = 'free' | 'pro' | 'instinct' | 'team'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing'

export interface UserSubscription {
  id: string
  userId: string
  plan: Tier
  status: SubscriptionStatus
  tokenBalance: number
  queriesUsedToday: number
  queriesLimit: number
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  currentPeriodEnd: number | null
  createdAt: number
  updatedAt: number
}

export interface SubscriptionCreateParams {
  userId: string
  plan: Tier
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  currentPeriodStart?: number
  currentPeriodEnd?: number
}

export interface TokenCreditTiers {
  [key: string]: number
}

// Token credit mapping (from pricing page)
export const TOKEN_CREDIT_TIERS: TokenCreditTiers = {
  'credit-10': 100000,    // $10 = 100K tokens
  'credit-50': 750000,    // $50 = 750K tokens (50% bonus)
  'credit-100': 2000000,  // $100 = 2M tokens (100% bonus)
  'credit-500': 12500000, // $500 = 12.5M tokens (150% bonus)
}

// Query limits per plan
export const QUERY_LIMITS: Record<Tier, number> = {
  free: 3,
  pro: 999999,    // Effectively unlimited
  instinct: 999999,
  team: 999999,
}

/**
 * Get user subscription (or create default free subscription)
 */
export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  const result = db.prepare(`
    SELECT * FROM subscriptions
    WHERE user_id = ?
  `).get(userId) as any

  if (!result) {
    return null
  }

  return {
    id: result.id,
    userId: result.user_id,
    plan: result.plan as Tier,
    status: result.status as SubscriptionStatus,
    tokenBalance: result.token_balance || 0,
    queriesUsedToday: result.queries_used_today || 0,
    queriesLimit: result.queries_limit || QUERY_LIMITS[result.plan as Tier] || 3,
    stripeCustomerId: result.stripe_customer_id,
    stripeSubscriptionId: result.stripe_subscription_id,
    currentPeriodEnd: result.current_period_end,
    createdAt: result.created_at,
    updatedAt: result.updated_at,
  }
}

/**
 * Get subscription by Stripe customer ID
 */
export async function getSubscriptionByStripeCustomer(stripeCustomerId: string): Promise<UserSubscription | null> {
  const result = db.prepare(`
    SELECT * FROM subscriptions
    WHERE stripe_customer_id = ?
  `).get(stripeCustomerId) as any

  if (!result) {
    return null
  }

  return {
    id: result.id,
    userId: result.user_id,
    plan: result.plan as Tier,
    status: result.status as SubscriptionStatus,
    tokenBalance: result.token_balance || 0,
    queriesUsedToday: result.queries_used_today || 0,
    queriesLimit: result.queries_limit || QUERY_LIMITS[result.plan as Tier] || 3,
    stripeCustomerId: result.stripe_customer_id,
    stripeSubscriptionId: result.stripe_subscription_id,
    currentPeriodEnd: result.current_period_end,
    createdAt: result.created_at,
    updatedAt: result.updated_at,
  }
}

/**
 * Create or update subscription
 */
export async function upsertSubscription(params: SubscriptionCreateParams): Promise<UserSubscription> {
  const {
    userId,
    plan,
    stripeCustomerId,
    stripeSubscriptionId,
    currentPeriodStart,
    currentPeriodEnd,
  } = params

  const subscriptionId = randomBytes(16).toString('hex')
  const queriesLimit = QUERY_LIMITS[plan] || 3

  db.prepare(`
    INSERT INTO subscriptions (
      id,
      user_id,
      plan,
      status,
      stripe_customer_id,
      stripe_subscription_id,
      queries_limit,
      current_period_start,
      current_period_end,
      updated_at
    )
    VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?, strftime('%s', 'now'))
    ON CONFLICT(stripe_customer_id) DO UPDATE SET
      plan = excluded.plan,
      status = 'active',
      stripe_subscription_id = excluded.stripe_subscription_id,
      queries_limit = excluded.queries_limit,
      current_period_start = excluded.current_period_start,
      current_period_end = excluded.current_period_end,
      updated_at = strftime('%s', 'now')
  `).run(
    subscriptionId,
    userId,
    plan,
    stripeCustomerId || null,
    stripeSubscriptionId || null,
    queriesLimit,
    currentPeriodStart || null,
    currentPeriodEnd || null
  )

  const subscription = await getUserSubscription(userId)
  if (!subscription) {
    throw new Error('Failed to create subscription')
  }

  return subscription
}

/**
 * Add tokens to user's balance
 */
export async function addTokens(userId: string, tokens: number): Promise<void> {
  // Check if subscription exists
  const existing = await getUserSubscription(userId)

  if (existing) {
    // Update existing subscription
    db.prepare(`
      UPDATE subscriptions
      SET token_balance = token_balance + ?, updated_at = strftime('%s', 'now')
      WHERE user_id = ?
    `).run(tokens, userId)
  } else {
    // Create new free subscription with tokens
    db.prepare(`
      INSERT INTO subscriptions (id, user_id, plan, token_balance)
      VALUES (?, ?, 'free', ?)
    `).run(randomBytes(16).toString('hex'), userId, tokens)
  }
}

/**
 * Cancel subscription (downgrade to free)
 */
export async function cancelSubscription(userId: string): Promise<void> {
  db.prepare(`
    UPDATE subscriptions
    SET plan = 'free',
        status = 'canceled',
        queries_limit = ?,
        stripe_subscription_id = NULL,
        updated_at = strftime('%s', 'now')
    WHERE user_id = ?
  `).run(QUERY_LIMITS.free, userId)
}

/**
 * Cancel subscription by Stripe customer ID
 */
export async function cancelSubscriptionByStripeCustomer(stripeCustomerId: string): Promise<void> {
  db.prepare(`
    UPDATE subscriptions
    SET plan = 'free',
        status = 'canceled',
        queries_limit = ?,
        stripe_subscription_id = NULL,
        updated_at = strftime('%s', 'now')
    WHERE stripe_customer_id = ?
  `).run(QUERY_LIMITS.free, stripeCustomerId)
}

/**
 * Update subscription status (e.g., to 'past_due' for failed payments)
 */
export async function updateSubscriptionStatus(
  stripeCustomerId: string,
  status: SubscriptionStatus
): Promise<void> {
  db.prepare(`
    UPDATE subscriptions
    SET status = ?,
        updated_at = strftime('%s', 'now')
    WHERE stripe_customer_id = ?
  `).run(status, stripeCustomerId)
}

/**
 * Check if user can use a specific feature
 */
export async function canUseFeature(userId: string, feature: string): Promise<boolean> {
  const sub = await getUserSubscription(userId)

  if (!sub) {
    return false // No subscription = free tier
  }

  const featureTiers: Record<string, Tier[]> = {
    'instinct-mode': ['instinct'],
    'unlimited-queries': ['pro', 'instinct', 'team'],
    'extended-context': ['instinct'],
    'team-workspace': ['team'],
    'api-access': ['instinct'],
    'priority-support': ['pro', 'instinct', 'team'],
    'advanced-analytics': ['instinct', 'team'],
    'custom-integrations': ['team'],
  }

  const allowedTiers = featureTiers[feature] || ['free', 'pro', 'instinct', 'team']
  return allowedTiers.includes(sub.plan)
}

/**
 * Record a payment
 */
export async function recordPayment(params: {
  userId: string
  paymentProvider: 'stripe' | 'nowpayments' | 'btcpay'
  paymentType: 'subscription' | 'credits' | 'one_time'
  amount: number
  currency: string
  tokensGranted?: number
  planPurchased?: string
  providerPaymentId?: string
  providerCustomerId?: string
  metadata?: Record<string, any>
}): Promise<void> {
  const paymentId = randomBytes(16).toString('hex')

  db.prepare(`
    INSERT INTO payment_records (
      id,
      user_id,
      payment_provider,
      payment_type,
      amount,
      currency,
      tokens_granted,
      plan_purchased,
      status,
      provider_payment_id,
      provider_customer_id,
      metadata,
      completed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?, strftime('%s', 'now'))
  `).run(
    paymentId,
    params.userId,
    params.paymentProvider,
    params.paymentType,
    params.amount,
    params.currency,
    params.tokensGranted || 0,
    params.planPurchased || null,
    params.providerPaymentId || null,
    params.providerCustomerId || null,
    JSON.stringify(params.metadata || {})
  )
}
