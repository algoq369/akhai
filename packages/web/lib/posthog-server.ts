/**
 * PostHog Server-Side Configuration
 * Only imported in API routes and server components
 */

import { PostHog } from 'posthog-node'

let serverPostHog: PostHog | null = null

export function getServerPostHog(): PostHog | null {
  // Only initialize once
  if (serverPostHog) return serverPostHog

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com'

  if (!apiKey) {
    console.warn('[PostHog Server] API key not configured')
    return null
  }

  serverPostHog = new PostHog(apiKey, {
    host,

    // Serverless-safe configuration (flush immediately)
    flushAt: 1, // Send events immediately (don't batch)
    flushInterval: 0, // Don't wait for interval
  })

  return serverPostHog
}

/**
 * Track custom event (server-side)
 */
export function trackServerEvent(
  eventName: string,
  distinctId: string,
  properties?: Record<string, any>
) {
  const ph = getServerPostHog()
  if (!ph) return

  ph.capture({
    distinctId,
    event: eventName,
    properties,
  })
}

/**
 * Flush events before page unload (server)
 */
export async function flushServerEvents() {
  const ph = getServerPostHog()
  if (!ph) return

  await ph.shutdown()
}
