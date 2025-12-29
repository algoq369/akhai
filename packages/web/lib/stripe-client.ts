/**
 * Stripe Client-Side Utilities
 * Safe for use in client components
 */

import { loadStripe } from '@stripe/stripe-js'

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
