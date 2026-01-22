'use client'

import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'

/**
 * PostHog Pageview Tracker
 * Must be wrapped in Suspense due to useSearchParams()
 */
function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Track pageviews on route change
  useEffect(() => {
    if (!posthog.__loaded) return

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')

    posthog.capture('$pageview', {
      $current_url: url,
    })
  }, [pathname, searchParams])

  return null
}

/**
 * PostHog Analytics Provider
 * Wraps the app to enable client-side tracking
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  // Initialize PostHog on mount
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY

    if (!apiKey) {
      console.warn('[PostHog] API key not configured')
      return
    }

    // Initialize PostHog
    if (!posthog.__loaded) {
      posthog.init(apiKey, {
        // Use reverse proxy to avoid ad blockers
        api_host: '/ingest',
        ui_host: 'https://eu.posthog.com',

        // Cookieless tracking
        persistence: 'localStorage+cookie',
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: true,

        // Session recording
        session_recording: {
          recordCrossOriginIframes: false,
          maskAllInputs: true,
          maskTextSelector: '[data-private]',
        },

        loaded: (posthog) => {
          // Disable debug mode to reduce console noise
          // if (process.env.NODE_ENV === 'development') {
          //   posthog.debug()
          // }
        },
      })
    }
  }, [])

  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    // PostHog not configured, render children without provider
    return <>{children}</>
  }

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  )
}
