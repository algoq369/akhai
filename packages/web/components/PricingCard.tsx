'use client'

import { useState } from 'react'
import { formatPrice } from '@/lib/pricing-config'
import { getStripe } from '@/lib/stripe-client'
import { trackEvent } from '@/lib/posthog'

interface PricingCardProps {
  id: string
  name: string
  price: number
  interval?: 'month' | null
  features: string[]
  stripePriceId?: string
  badge?: string
  perUser?: boolean
  recommended?: boolean
  tokens?: number
  mode?: 'subscription' | 'payment'
  isSelected?: boolean
  onSelect?: () => void
}

export function PricingCard({
  id,
  name,
  price,
  interval,
  features,
  stripePriceId,
  badge,
  perUser = false,
  recommended = false,
  tokens,
  mode = 'subscription',
  isSelected = false,
  onSelect,
}: PricingCardProps) {
  const [loading, setLoading] = useState(false)

  async function handleCheckout(e: React.MouseEvent) {
    e.stopPropagation() // Prevent triggering parent onClick

    if (!stripePriceId) {
      alert('Coming soon!')
      return
    }

    setLoading(true)

    try {
      // Track checkout started
      trackEvent('checkout_started', {
        plan: id,
        price,
        billing_period: interval || 'one-time',
        mode,
      })

      // Create checkout session
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: stripePriceId,
          mode,
          planId: id,
          price,
          tokens,
        }),
      })

      const { sessionId, url } = await response.json()

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url
      } else {
        const stripe = await getStripe()
        await stripe?.redirectToCheckout({ sessionId })
      }
    } catch (error) {
      console.error('[Checkout] Error:', error)
      alert('Failed to start checkout. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div
      onClick={() => onSelect?.()}
      className={`
        relative border rounded-sm p-4 transition-all cursor-pointer
        ${
          isSelected
            ? 'border-relic-void border-[3px] shadow-lg ring-2 ring-relic-void/20'
            : recommended
            ? 'border-relic-slate shadow-sm'
            : 'border-relic-mist/20 hover:border-relic-silver/40'
        }
        ${id === 'free' ? 'bg-relic-ghost/20' : 'bg-relic-white'}
      `}
    >
      {/* Recommended badge */}
      {recommended && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2">
          <span className="bg-relic-slate text-relic-white text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-sm">
            Recommended
          </span>
        </div>
      )}

      {/* Plan name */}
      <div className="mb-3">
        <h3 className="text-sm font-medium text-relic-void flex items-center gap-1.5">
          {name}
          {badge && <span className="text-base">{badge}</span>}
        </h3>
      </div>

      {/* Price */}
      <div className="mb-4">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-semibold text-relic-void">
            {formatPrice(price)}
          </span>
          {interval && (
            <span className="text-[10px] text-relic-slate">
              /{interval}
              {perUser && '/user'}
            </span>
          )}
        </div>
        {tokens && (
          <p className="text-[10px] text-relic-silver mt-0.5">
            {(tokens / 1000).toLocaleString()}K tokens
          </p>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-1.5 mb-4">
        {features.map((feature, i) => (
          <li key={i} className="text-[11px] text-relic-slate flex items-start gap-1.5">
            <span className="text-relic-silver text-[8px] mt-0.5">•</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <button
        onClick={handleCheckout}
        disabled={loading || id === 'free'}
        className={`
          w-full py-2 px-3 rounded-sm text-[11px] font-mono uppercase tracking-wider transition-colors
          ${
            id === 'free'
              ? 'bg-relic-ghost/50 text-relic-silver cursor-not-allowed'
              : recommended
              ? 'bg-relic-void text-relic-white hover:bg-relic-slate cursor-pointer'
              : 'bg-relic-ghost text-relic-void hover:bg-relic-mist border border-relic-mist/20 cursor-pointer'
          }
          ${loading ? 'opacity-50 cursor-wait' : ''}
        `}
      >
        {loading ? 'Processing...' : id === 'free' ? 'Free' : `Get ${name}`}
      </button>

      {/* Fine print */}
      {id !== 'free' && interval && (
        <p className="text-[9px] text-relic-silver text-center mt-2">
          cancel anytime
        </p>
      )}
    </div>
  )
}
