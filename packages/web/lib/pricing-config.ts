/**
 * Pricing Configuration
 * Client-safe pricing data (no Stripe SDK imports)
 */

// ============================================
// PRICING CONFIGURATION
// ============================================

export const PRICING_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: null,
    stripe_price_id: undefined,
    features: [
      '10 queries per day',
      'Claude Opus 4.5',
      'All 7 methodologies',
      'Grounding Guard',
      'Side Canal context',
      'Mind Map visualization',
      'Community support',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 20,
    interval: 'month' as const,
    stripe_price_id: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    features: [
      'Unlimited queries',
      'Claude Opus 4.5',
      'All 7 methodologies',
      'Grounding Guard',
      'Side Canal context',
      'Mind Map visualization',
      'Priority support',
    ],
  },
  instinct: {
    id: 'instinct',
    name: 'Instinct',
    price: 200,
    interval: 'month' as const,
    stripe_price_id: process.env.NEXT_PUBLIC_STRIPE_INSTINCT_PRICE_ID,
    badge: '⚡',
    features: [
      'Everything in Pro',
      'Extended context (200K)',
      'Custom methodologies',
      'Advanced guardrails',
      'Research artifacts',
      'API access',
      'White-glove support',
    ],
  },
  team: {
    id: 'team',
    name: 'Team',
    price: 40,
    interval: 'month' as const,
    per_user: true,
    stripe_price_id: process.env.NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID,
    features: [
      'Everything in Pro',
      'Team workspace',
      'Shared mind maps',
      'Collaboration tools',
      'Admin dashboard',
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
