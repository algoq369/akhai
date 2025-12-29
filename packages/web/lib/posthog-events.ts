/**
 * PostHog Event Schemas and Tracking Helpers
 * Type-safe event tracking for AkhAI analytics
 */

import { trackEvent } from './posthog'
import { trackServerEvent } from './posthog-server'

// ============================================
// EVENT SCHEMAS
// ============================================

export interface QuerySubmittedEvent {
  query: string
  methodology: string
  methodology_selected: string // Auto-selected or user-chosen
  methodology_used: string // Actual methodology used
  tokens: number
  cost: number
  latency_ms: number
  provider: string
  model: string
  guard_active: boolean
  side_canal_enabled: boolean
  legend_mode: boolean
}

export interface GuardTriggeredEvent {
  guard_type: 'hype' | 'echo' | 'drift' | 'factuality'
  action: 'pending' | 'accepted' | 'refined' | 'pivoted'
  query: string
  methodology: string
  scores: {
    hype: number
    echo: number
    drift: number
    fact: number
  }
  issues: string[]
}

export interface MethodologySelectedEvent {
  methodology: string
  previous_methodology?: string
  trigger: 'user_click' | 'auto_router' | 'methodology_change'
  query_length: number
  complexity: number
}

export interface PricingPageViewedEvent {
  source?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
}

export interface CheckoutStartedEvent {
  plan: 'starter' | 'pro' | 'enterprise'
  price: number
  billing_period: 'monthly' | 'annual'
}

export interface SubscriptionCreatedEvent {
  plan: 'starter' | 'pro' | 'enterprise'
  mrr: number
  billing_period: 'monthly' | 'annual'
  user_id: string
}

export interface SideCanalEvent {
  action: 'topic_extracted' | 'synopsis_generated' | 'suggestion_clicked' | 'panel_opened'
  topic_count?: number
  topic_names?: string[]
  suggestion_clicked?: string
}

export interface MindmapEvent {
  action: 'view_toggled' | 'node_clicked' | 'export_requested'
  view_mode?: 'sefirot' | 'insight' | 'mindmap'
  node_count?: number
  methodology?: string
}

export interface CreditsPurchasedEvent {
  credit_tier: string
  amount: number
  user_id: string
  payment_intent?: string
  customer_email?: string | null
}

export interface CreditsCheckoutStartedEvent {
  credit_tier: string
  price: number
  tokens: number
  session_id: string
}

// ============================================
// CLIENT-SIDE TRACKING HELPERS
// ============================================

export function trackQuerySubmitted(event: QuerySubmittedEvent) {
  trackEvent('query_submitted', {
    query_preview: event.query.substring(0, 100),
    methodology: event.methodology,
    methodology_selected: event.methodology_selected,
    methodology_used: event.methodology_used,
    tokens: event.tokens,
    cost: event.cost,
    latency_ms: event.latency_ms,
    provider: event.provider,
    model: event.model,
    guard_active: event.guard_active,
    side_canal_enabled: event.side_canal_enabled,
    legend_mode: event.legend_mode,
  })
}

export function trackGuardTriggered(event: GuardTriggeredEvent) {
  trackEvent('guard_triggered', {
    guard_type: event.guard_type,
    action: event.action,
    query_preview: event.query.substring(0, 100),
    methodology: event.methodology,
    scores: event.scores,
    issues_count: event.issues.length,
  })
}

export function trackMethodologySelected(event: MethodologySelectedEvent) {
  trackEvent('methodology_selected', {
    methodology: event.methodology,
    previous_methodology: event.previous_methodology,
    trigger: event.trigger,
    query_length: event.query_length,
    complexity: event.complexity,
  })
}

export function trackPricingPageViewed(event: PricingPageViewedEvent = {}) {
  trackEvent('pricing_page_viewed', {
    source: event.source,
    utm_source: event.utm_source,
    utm_medium: event.utm_medium,
    utm_campaign: event.utm_campaign,
  })
}

export function trackCheckoutStarted(event: CheckoutStartedEvent) {
  trackEvent('checkout_started', {
    plan: event.plan,
    price: event.price,
    billing_period: event.billing_period,
  })
}

export function trackSubscriptionCreated(event: SubscriptionCreatedEvent) {
  trackEvent('subscription_created', {
    plan: event.plan,
    mrr: event.mrr,
    billing_period: event.billing_period,
    user_id: event.user_id,
  })
}

export function trackSideCanalEvent(event: SideCanalEvent) {
  trackEvent('side_canal_event', {
    action: event.action,
    topic_count: event.topic_count,
    topic_names: event.topic_names,
    suggestion_clicked: event.suggestion_clicked,
  })
}

export function trackMindmapEvent(event: MindmapEvent) {
  trackEvent('mindmap_event', {
    action: event.action,
    view_mode: event.view_mode,
    node_count: event.node_count,
    methodology: event.methodology,
  })
}

// ============================================
// SERVER-SIDE TRACKING HELPERS
// ============================================

export function trackServerQuerySubmitted(distinctId: string, event: QuerySubmittedEvent) {
  trackServerEvent('query_submitted', distinctId, {
    query_preview: event.query.substring(0, 100),
    methodology: event.methodology,
    methodology_selected: event.methodology_selected,
    methodology_used: event.methodology_used,
    tokens: event.tokens,
    cost: event.cost,
    latency_ms: event.latency_ms,
    provider: event.provider,
    model: event.model,
    guard_active: event.guard_active,
    side_canal_enabled: event.side_canal_enabled,
    legend_mode: event.legend_mode,
  })
}

export function trackServerGuardTriggered(distinctId: string, event: GuardTriggeredEvent) {
  trackServerEvent('guard_triggered', distinctId, {
    guard_type: event.guard_type,
    action: event.action,
    query_preview: event.query.substring(0, 100),
    methodology: event.methodology,
    scores: event.scores,
    issues_count: event.issues.length,
  })
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generate anonymous distinct ID for server-side tracking
 * Uses IP hash or session ID if available
 */
export function getAnonymousDistinctId(request?: Request): string {
  if (typeof window !== 'undefined') {
    // Client-side: use PostHog's distinct ID
    return 'client-side'
  }

  // Server-side: generate from IP or use random ID
  if (request) {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    if (ip) {
      // Simple hash of IP address
      return `anon-${hashString(ip)}`
    }
  }

  // Fallback to random ID
  return `anon-${Math.random().toString(36).substring(2, 12)}`
}

/**
 * Simple string hash function
 */
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}
