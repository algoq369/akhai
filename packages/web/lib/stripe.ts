/**
 * Stripe Configuration
 * Server-side and client-side Stripe setup
 */

import Stripe from 'stripe'
import { loadStripe } from '@stripe/stripe-js'

// ============================================
// SERVER-SIDE STRIPE INSTANCE
// ============================================

// Only initialize server-side Stripe if secret key is available
const getServerStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('[Stripe Server] Secret key not configured')
    return null
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
    typescript: true,
  })
}

export const stripe = getServerStripe()!

// ============================================
// CLIENT-SIDE STRIPE INSTANCE
// ============================================

let stripePromise: Promise<any> | null = null

export function getStripe() {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    console.warn('[Stripe] Publishable key not configured')
    return null
  }

  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  }
  return stripePromise
}

// ============================================
// PRICING CONFIGURATION
// ============================================

export const PRICING_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: null,
    queries_per_day: 10,
    features: [
      '10 queries/day',
      'Claude Opus 4.5',
      '7 methodologies',
      'Grounding Guard',
      'Basic analytics',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 20,
    interval: 'month' as const,
    stripe_price_id: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    queries_per_day: null, // unlimited
    features: [
      'Unlimited queries',
      'Claude Opus 4.5',
      'All methodologies',
      'Grounding Guard',
      'Side Canal context',
      'Advanced analytics',
      'Priority support',
    ],
  },
  legend: {
    id: 'legend',
    name: 'Legend',
    price: 200,
    interval: 'month' as const,
    stripe_price_id: process.env.NEXT_PUBLIC_STRIPE_LEGEND_PRICE_ID,
    queries_per_day: null, // unlimited
    badge: '👑',
    features: [
      'Unlimited R&D queries',
      'Claude Opus 4.5 Premium',
      'All methodologies',
      'Enhanced Grounding Guard',
      'Side Canal + Mind Map',
      'Artifact system',
      'White-glove support',
      'Early feature access',
    ],
  },
  team: {
    id: 'team',
    name: 'Team',
    price: 40,
    interval: 'month' as const,
    per_user: true,
    stripe_price_id: process.env.NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID,
    queries_per_day: null, // unlimited
    features: [
      'Unlimited queries per user',
      'Claude Opus 4.5',
      'All methodologies',
      'Team workspace',
      'Shared artifacts',
      'Usage analytics',
      'Team support',
    ],
  },
}

export const TOKEN_CREDITS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 5,
    tokens: 100_000,
    stripe_price_id: process.env.NEXT_PUBLIC_STRIPE_CREDITS_STARTER_ID,
  },
  builder: {
    id: 'builder',
    name: 'Builder',
    price: 20,
    tokens: 500_000,
    stripe_price_id: process.env.NEXT_PUBLIC_STRIPE_CREDITS_BUILDER_ID,
  },
  scale: {
    id: 'scale',
    name: 'Scale',
    price: 100,
    tokens: 3_000_000,
    stripe_price_id: process.env.NEXT_PUBLIC_STRIPE_CREDITS_SCALE_ID,
  },
  bulk: {
    id: 'bulk',
    name: 'Bulk',
    price: 500,
    tokens: 20_000_000,
    stripe_price_id: process.env.NEXT_PUBLIC_STRIPE_CREDITS_BULK_ID,
  },
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(price)
}

/**
 * Format token count for display
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(0)}K`
  }
  return tokens.toString()
}

/**
 * Calculate cost per 1K tokens
 */
export function calculateTokenCost(price: number, tokens: number): number {
  return (price / tokens) * 1000
}
