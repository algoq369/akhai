'use client'

import { useEffect, useState } from 'react'
import { PricingCard } from '@/components/PricingCard'
import { CustomCreditCard } from '@/components/CustomCreditCard'
import { PRICING_PLANS, TOKEN_CREDITS } from '@/lib/pricing-config'
import { trackEvent } from '@/lib/posthog'
import Link from 'next/link'

export default function PricingPage() {
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'credits'>('subscriptions')
  const [selectedPlan, setSelectedPlan] = useState<string | null>('pro') // Default to Pro

  useEffect(() => {
    // Track pricing page view (only if PostHog is loaded)
    if (typeof window !== 'undefined') {
      try {
        trackEvent('pricing_page_viewed', {})
      } catch (error) {
        console.warn('[Pricing] Failed to track page view:', error)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-relic-white">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="text-[10px] font-mono text-relic-silver hover:text-relic-slate mb-3 inline-block uppercase tracking-wider"
          >
            ← back
          </Link>

          <h1 className="text-2xl font-medium text-relic-void mb-2 tracking-tight">
            Pricing
          </h1>
          <p className="text-relic-slate text-sm max-w-xl mx-auto">
            Claude Opus 4.5 • 7 Methodologies • Grounding Guard
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center gap-1 mb-8">
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`
              px-4 py-1.5 text-[11px] font-mono uppercase tracking-wider transition-all
              ${
                activeTab === 'subscriptions'
                  ? 'text-relic-void border-b-2 border-relic-void'
                  : 'text-relic-silver hover:text-relic-slate'
              }
            `}
          >
            Subscriptions
          </button>
          <button
            onClick={() => setActiveTab('credits')}
            className={`
              px-4 py-1.5 text-[11px] font-mono uppercase tracking-wider transition-all
              ${
                activeTab === 'credits'
                  ? 'text-relic-void border-b-2 border-relic-void'
                  : 'text-relic-silver hover:text-relic-slate'
              }
            `}
          >
            Pay-as-you-go
          </button>
        </div>

        {/* Subscriptions */}
        {activeTab === 'subscriptions' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <PricingCard
              id={PRICING_PLANS.free.id}
              name={PRICING_PLANS.free.name}
              price={PRICING_PLANS.free.price}
              interval={PRICING_PLANS.free.interval}
              features={PRICING_PLANS.free.features}
              isSelected={selectedPlan === PRICING_PLANS.free.id}
              onSelect={() => setSelectedPlan(PRICING_PLANS.free.id)}
            />

            <PricingCard
              id={PRICING_PLANS.pro.id}
              name={PRICING_PLANS.pro.name}
              price={PRICING_PLANS.pro.price}
              interval={PRICING_PLANS.pro.interval}
              features={PRICING_PLANS.pro.features}
              stripePriceId={PRICING_PLANS.pro.stripe_price_id}
              recommended
              mode="subscription"
              isSelected={selectedPlan === PRICING_PLANS.pro.id}
              onSelect={() => setSelectedPlan(PRICING_PLANS.pro.id)}
            />

            <PricingCard
              id={PRICING_PLANS.instinct.id}
              name={PRICING_PLANS.instinct.name}
              price={PRICING_PLANS.instinct.price}
              interval={PRICING_PLANS.instinct.interval}
              features={PRICING_PLANS.instinct.features}
              stripePriceId={PRICING_PLANS.instinct.stripe_price_id}
              badge={PRICING_PLANS.instinct.badge}
              mode="subscription"
              isSelected={selectedPlan === PRICING_PLANS.instinct.id}
              onSelect={() => setSelectedPlan(PRICING_PLANS.instinct.id)}
            />

            <PricingCard
              id={PRICING_PLANS.team.id}
              name={PRICING_PLANS.team.name}
              price={PRICING_PLANS.team.price}
              interval={PRICING_PLANS.team.interval}
              features={PRICING_PLANS.team.features}
              stripePriceId={PRICING_PLANS.team.stripe_price_id}
              perUser={PRICING_PLANS.team.per_user}
              mode="subscription"
              isSelected={selectedPlan === PRICING_PLANS.team.id}
              onSelect={() => setSelectedPlan(PRICING_PLANS.team.id)}
            />
          </div>
        )}

        {/* Token Credits */}
        {activeTab === 'credits' && (
          <>
            <div className="bg-relic-ghost/30 border border-relic-mist/20 rounded-sm p-4 mb-6 max-w-2xl mx-auto">
              <p className="text-xs text-relic-slate text-center">
                One-time purchase • No expiration • Flexible usage
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-12">
              <PricingCard
                id={TOKEN_CREDITS.starter.id}
                name={TOKEN_CREDITS.starter.name}
                price={TOKEN_CREDITS.starter.price}
                features={[
                  `${(TOKEN_CREDITS.starter.tokens / 1000).toLocaleString()}K tokens`,
                  'Claude Opus 4.5',
                  'All methodologies',
                  'No expiration',
                  '$0.05 per 1K tokens',
                ]}
                stripePriceId={TOKEN_CREDITS.starter.stripe_price_id}
                tokens={TOKEN_CREDITS.starter.tokens}
                mode="payment"
                isSelected={selectedPlan === TOKEN_CREDITS.starter.id}
                onSelect={() => setSelectedPlan(TOKEN_CREDITS.starter.id)}
              />

              <PricingCard
                id={TOKEN_CREDITS.builder.id}
                name={TOKEN_CREDITS.builder.name}
                price={TOKEN_CREDITS.builder.price}
                features={[
                  `${(TOKEN_CREDITS.builder.tokens / 1000).toLocaleString()}K tokens`,
                  'Claude Opus 4.5',
                  'All methodologies',
                  'No expiration',
                  '$0.04 per 1K tokens',
                ]}
                stripePriceId={TOKEN_CREDITS.builder.stripe_price_id}
                tokens={TOKEN_CREDITS.builder.tokens}
                recommended
                mode="payment"
                isSelected={selectedPlan === TOKEN_CREDITS.builder.id}
                onSelect={() => setSelectedPlan(TOKEN_CREDITS.builder.id)}
              />

              <PricingCard
                id={TOKEN_CREDITS.scale.id}
                name={TOKEN_CREDITS.scale.name}
                price={TOKEN_CREDITS.scale.price}
                features={[
                  `${(TOKEN_CREDITS.scale.tokens / 1_000_000).toFixed(1)}M tokens`,
                  'Claude Opus 4.5',
                  'All methodologies',
                  'No expiration',
                  '$0.033 per 1K tokens',
                ]}
                stripePriceId={TOKEN_CREDITS.scale.stripe_price_id}
                tokens={TOKEN_CREDITS.scale.tokens}
                mode="payment"
                isSelected={selectedPlan === TOKEN_CREDITS.scale.id}
                onSelect={() => setSelectedPlan(TOKEN_CREDITS.scale.id)}
              />

              <PricingCard
                id={TOKEN_CREDITS.bulk.id}
                name={TOKEN_CREDITS.bulk.name}
                price={TOKEN_CREDITS.bulk.price}
                features={[
                  `${(TOKEN_CREDITS.bulk.tokens / 1_000_000).toFixed(0)}M tokens`,
                  'Claude Opus 4.5',
                  'All methodologies',
                  'No expiration',
                  '$0.025 per 1K tokens',
                ]}
                stripePriceId={TOKEN_CREDITS.bulk.stripe_price_id}
                tokens={TOKEN_CREDITS.bulk.tokens}
                mode="payment"
                isSelected={selectedPlan === TOKEN_CREDITS.bulk.id}
                onSelect={() => setSelectedPlan(TOKEN_CREDITS.bulk.id)}
              />

              {/* Custom amount card */}
              <CustomCreditCard />
            </div>
          </>
        )}

        {/* FAQ Section */}
        <div className="border-t border-relic-mist/20 pt-8 mt-8 max-w-2xl mx-auto">
          <h2 className="text-sm font-mono uppercase tracking-wider text-relic-void mb-4 text-center">
            FAQ
          </h2>

          <div className="space-y-3">
            <div className="border-b border-relic-mist/10 pb-3">
              <h3 className="text-xs font-medium text-relic-void mb-1">
                Do token credits expire?
              </h3>
              <p className="text-xs text-relic-slate">
                No. Credits never expire.
              </p>
            </div>

            <div className="border-b border-relic-mist/10 pb-3">
              <h3 className="text-xs font-medium text-relic-void mb-1">
                Can I switch plans?
              </h3>
              <p className="text-xs text-relic-slate">
                Yes. Upgrade or downgrade anytime. Changes apply next billing cycle.
              </p>
            </div>

            <div className="border-b border-relic-mist/10 pb-3">
              <h3 className="text-xs font-medium text-relic-void mb-1">
                Refund policy?
              </h3>
              <p className="text-xs text-relic-slate">
                7-day money-back guarantee for subscriptions. Credits non-refundable.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center pb-8">
          <p className="text-[10px] font-mono text-relic-silver">
            enterprise?{' '}
            <a
              href="mailto:support@akhai.ai"
              className="text-relic-slate hover:text-relic-void underline"
            >
              contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
