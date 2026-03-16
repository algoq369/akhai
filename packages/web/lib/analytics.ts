/**
 * PostHog Analytics — Custom Events & User Identification
 * 
 * Centralized analytics tracking for AkhAI.
 * Import and call these functions from any component.
 */

import posthog from 'posthog-js'

// ── User Identification ──
export function identifyUser(userId: string, properties?: {
  username?: string
  email?: string
  authProvider?: string
  walletAddress?: string
}) {
  if (!posthog.__loaded) return
  posthog.identify(userId, {
    ...properties,
    app: 'akhai',
  })
}

export function resetUser() {
  if (!posthog.__loaded) return
  posthog.reset()
}

// ── Query Events ──
export function trackQuerySubmitted(query: string, methodology: string) {
  if (!posthog.__loaded) return
  posthog.capture('query_submitted', {
    query_length: query.length,
    methodology,
    query_preview: query.substring(0, 50),
  })
}

export function trackQueryCompleted(methodology: string, tokens: number, cost: number, latencyMs: number) {
  if (!posthog.__loaded) return
  posthog.capture('query_completed', {
    methodology,
    tokens_used: tokens,
    cost,
    latency_ms: latencyMs,
  })
}

// ── Navigation Events ──
export function trackMindmapOpened(tab: string) {
  if (!posthog.__loaded) return
  posthog.capture('mindmap_opened', { tab })
}

export function trackPhilosophyViewed() {
  if (!posthog.__loaded) return
  posthog.capture('philosophy_viewed')
}

// ── Methodology Events ──
export function trackMethodologyChanged(from: string, to: string) {
  if (!posthog.__loaded) return
  posthog.capture('methodology_changed', { from, to })
}

export function trackLayerPresetApplied(preset: string) {
  if (!posthog.__loaded) return
  posthog.capture('layer_preset_applied', { preset })
}

// ── Auth Events ──
export function trackWalletConnected(address: string) {
  if (!posthog.__loaded) return
  posthog.capture('wallet_connected', {
    wallet_prefix: address.substring(0, 6),
  })
}

export function trackLogout() {
  if (!posthog.__loaded) return
  posthog.capture('user_logout')
  posthog.reset()
}

// ── Feature Events ──
export function trackCanvasOpened() {
  if (!posthog.__loaded) return
  posthog.capture('canvas_opened')
}

export function trackNewsClicked(headline: string, source: string) {
  if (!posthog.__loaded) return
  posthog.capture('news_clicked', { headline: headline.substring(0, 60), source })
}

export function trackFinanceIndicatorClicked(symbol: string) {
  if (!posthog.__loaded) return
  posthog.capture('finance_indicator_clicked', { symbol })
}

export function trackInstinctModeToggled(enabled: boolean) {
  if (!posthog.__loaded) return
  posthog.capture('instinct_mode_toggled', { enabled })
}
