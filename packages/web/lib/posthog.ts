/**
 * PostHog Client-Side Configuration
 * Only for browser tracking
 */

import posthog from 'posthog-js'

// ============================================
// CLIENT CONFIGURATION (Browser)
// ============================================

export function initPostHog() {
  if (typeof window === 'undefined') return null

  // Only initialize once
  if (posthog.__loaded) return posthog

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY

  if (!apiKey) {
    console.warn('[PostHog] API key not configured')
    return null
  }

  posthog.init(apiKey, {
    // Use reverse proxy to avoid ad blockers (/ingest/* → eu.i.posthog.com/*)
    api_host: '/ingest',

    // UI host for dashboard links
    ui_host: 'https://eu.posthog.com',

    // Cookieless tracking (privacy-friendly)
    persistence: 'localStorage+cookie',
    autocapture: false, // Disable automatic event capture
    capture_pageview: false, // Manual pageview tracking
    capture_pageleave: true,

    // Session recording (optional - disable if not needed)
    session_recording: {
      recordCrossOriginIframes: false,
      maskAllInputs: true,
      maskTextSelector: '[data-private]',
    },

    // Performance
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') {
        posthog.debug()
      }
    },
  })

  return posthog
}

export { posthog }

// ============================================
// CLIENT-SIDE UTILITY FUNCTIONS
// ============================================

/**
 * Identify user with properties
 */
export function identifyUser(userId: string, properties?: Record<string, any>) {
  if (typeof window === 'undefined') return

  const ph = posthog
  if (!ph) return

  ph.identify(userId, properties)
}

/**
 * Track custom event (client-side)
 */
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (typeof window === 'undefined') return

  const ph = posthog
  if (!ph) return

  ph.capture(eventName, properties)
}

/**
 * Reset user session (logout)
 */
export function resetUser() {
  if (typeof window === 'undefined') return

  const ph = posthog
  if (!ph) return

  ph.reset()
}

/**
 * Set user properties
 */
export function setUserProperties(properties: Record<string, any>) {
  if (typeof window === 'undefined') return

  const ph = posthog
  if (!ph) return

  ph.people.set(properties)
}
