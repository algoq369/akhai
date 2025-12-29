'use client'

import { useState } from 'react'
import { formatPrice } from '@/lib/pricing-config'
import { trackEvent } from '@/lib/posthog'

export function CustomCreditCard() {
  const [amount, setAmount] = useState<string>('50')
  const [loading, setLoading] = useState(false)

  // Calculate tokens based on amount (using Builder tier rate: $0.04 per 1K tokens)
  const calculateTokens = (dollars: number): number => {
    return Math.floor((dollars / 0.04) * 1000)
  }

  const handlePurchase = async () => {
    const amountNum = parseFloat(amount)

    if (isNaN(amountNum) || amountNum < 5) {
      alert('Minimum purchase is $5')
      return
    }

    if (amountNum > 10000) {
      alert('Maximum purchase is $10,000. Contact us for larger amounts.')
      return
    }

    setLoading(true)

    try {
      // Track custom credit purchase
      trackEvent('custom_credits_checkout_started', {
        amount: amountNum,
        tokens: calculateTokens(amountNum),
      })

      // Create checkout session with custom amount
      const response = await fetch('/api/checkout/custom-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountNum,
          tokens: calculateTokens(amountNum),
        }),
      })

      const { url } = await response.json()

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      window.location.href = url
    } catch (error) {
      console.error('[Custom Credits] Error:', error)
      alert('Failed to start checkout. Please try again.')
      setLoading(false)
    }
  }

  const amountNum = parseFloat(amount) || 0
  const tokens = calculateTokens(amountNum)
  const costPerK = amountNum > 0 ? (amountNum / tokens) * 1000 : 0

  return (
    <div className="relative border border-relic-mist/20 rounded-sm p-4 bg-relic-white hover:border-relic-silver/40 transition-all">
      {/* Plan name */}
      <div className="mb-3">
        <h3 className="text-sm font-medium text-relic-void flex items-center gap-1.5">
          Custom
        </h3>
      </div>

      {/* Custom amount input */}
      <div className="mb-4">
        <label className="text-[10px] text-relic-silver uppercase tracking-wider mb-1.5 block">
          Enter Amount
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-relic-slate text-lg">
            $
          </span>
          <input
            type="number"
            min="5"
            max="10000"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full pl-7 pr-3 py-2 border border-relic-mist/30 rounded-sm text-lg font-semibold text-relic-void focus:outline-none focus:border-relic-slate transition-colors cursor-text"
            placeholder="50"
          />
        </div>
        {amountNum >= 5 && (
          <p className="text-[10px] text-relic-silver mt-1">
            {(tokens / 1000).toLocaleString()}K tokens
          </p>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-1.5 mb-4">
        <li className="text-[11px] text-relic-slate flex items-start gap-1.5">
          <span className="text-relic-silver text-[8px] mt-0.5">•</span>
          <span>Claude Opus 4.5</span>
        </li>
        <li className="text-[11px] text-relic-slate flex items-start gap-1.5">
          <span className="text-relic-silver text-[8px] mt-0.5">•</span>
          <span>All methodologies</span>
        </li>
        <li className="text-[11px] text-relic-slate flex items-start gap-1.5">
          <span className="text-relic-silver text-[8px] mt-0.5">•</span>
          <span>No expiration</span>
        </li>
        {amountNum >= 5 && (
          <li className="text-[11px] text-relic-slate flex items-start gap-1.5">
            <span className="text-relic-silver text-[8px] mt-0.5">•</span>
            <span>${costPerK.toFixed(3)} per 1K tokens</span>
          </li>
        )}
      </ul>

      {/* CTA Button */}
      <button
        onClick={handlePurchase}
        disabled={loading || amountNum < 5}
        className={`
          w-full py-2 px-3 rounded-sm text-[11px] font-mono uppercase tracking-wider transition-colors
          ${
            amountNum < 5
              ? 'bg-relic-ghost/50 text-relic-silver cursor-not-allowed'
              : 'bg-relic-ghost text-relic-void hover:bg-relic-mist border border-relic-mist/20 cursor-pointer'
          }
          ${loading ? 'opacity-50 cursor-wait' : ''}
        `}
      >
        {loading ? 'Processing...' : amountNum < 5 ? 'Min $5' : 'Purchase Custom'}
      </button>

      {/* Fine print */}
      <p className="text-[9px] text-relic-silver text-center mt-2">
        min $5 • max $10,000
      </p>
    </div>
  )
}
