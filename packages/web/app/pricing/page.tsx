'use client'

import { useEffect, useState } from 'react'
import { PricingCard } from '@/components/PricingCard'
import { CustomCreditCard } from '@/components/CustomCreditCard'
import CryptoPaymentModalDual from '@/components/CryptoPaymentModalDual'
import { PRICING_PLANS, TOKEN_CREDITS } from '@/lib/pricing-config'
import { trackEvent } from '@/lib/posthog'
import Link from 'next/link'

export default function PricingPage() {
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'credits'>('subscriptions')
  const [selectedPlan, setSelectedPlan] = useState<string | null>('pro') // Default to Pro

  // Crypto payment modal state
  const [cryptoModalOpen, setCryptoModalOpen] = useState(false)
  const [cryptoPaymentData, setCryptoPaymentData] = useState<{
    amount: number
    productType: 'subscription' | 'credits'
    planId?: string
    creditAmount?: number
  } | null>(null)

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

  // Open crypto modal with payment data
  const handleCryptoPayment = (
    amount: number,
    productType: 'subscription' | 'credits',
    planId?: string,
    creditAmount?: number
  ) => {
    setCryptoPaymentData({ amount, productType, planId, creditAmount })
    setCryptoModalOpen(true)

    trackEvent('crypto_payment_clicked', {
      product_type: productType,
      plan_id: planId,
      amount,
    })
  }

  // Handle successful payment
  const handlePaymentSuccess = () => {
    setCryptoModalOpen(false)
    setCryptoPaymentData(null)
    alert('Payment successful! Your account will be updated shortly.')
  }

  return (
    <div className="min-h-screen bg-relic-white">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <Link
            href="/"
            className="text-[9px] font-mono text-relic-silver hover:text-relic-slate mb-2 inline-block uppercase tracking-wider"
          >
            ← back
          </Link>

          <h1 className="text-xl font-medium text-relic-void mb-1.5 tracking-tight">
            Pricing
          </h1>
          <p className="text-relic-slate text-xs max-w-xl mx-auto">
            Claude Opus 4.5 • 7 Methodologies • Grounding Guard
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center gap-1 mb-6">
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`
              px-3 py-1 text-[10px] font-mono uppercase tracking-wider transition-all
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
              px-3 py-1 text-[10px] font-mono uppercase tracking-wider transition-all
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {/* Free Plan */}
            <div className="flex flex-col gap-2">
              <PricingCard
                id={PRICING_PLANS.free.id}
                name={PRICING_PLANS.free.name}
                price={PRICING_PLANS.free.price}
                interval={PRICING_PLANS.free.interval}
                features={PRICING_PLANS.free.features}
                isSelected={selectedPlan === PRICING_PLANS.free.id}
                onSelect={() => setSelectedPlan(PRICING_PLANS.free.id)}
              />
            </div>

            {/* Pro Plan */}
            <div className="flex flex-col gap-2">
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
              <button
                onClick={() =>
                  handleCryptoPayment(PRICING_PLANS.pro.price, 'subscription', PRICING_PLANS.pro.id)
                }
                className="w-full py-1.5 px-3 rounded-sm text-[10px] font-mono uppercase tracking-wider transition-colors bg-purple-500/10 text-purple-700 hover:bg-purple-500/20 border border-purple-500/30"
              >
                Or pay with crypto
              </button>
            </div>

            {/* Instinct Plan */}
            <div className="flex flex-col gap-2">
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
              <button
                onClick={() =>
                  handleCryptoPayment(
                    PRICING_PLANS.instinct.price,
                    'subscription',
                    PRICING_PLANS.instinct.id
                  )
                }
                className="w-full py-1.5 px-3 rounded-sm text-[10px] font-mono uppercase tracking-wider transition-colors bg-purple-500/10 text-purple-700 hover:bg-purple-500/20 border border-purple-500/30"
              >
                Or pay with crypto
              </button>
            </div>

            {/* Team Plan */}
            <div className="flex flex-col gap-2">
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
              <button
                onClick={() =>
                  handleCryptoPayment(PRICING_PLANS.team.price, 'subscription', PRICING_PLANS.team.id)
                }
                className="w-full py-1.5 px-3 rounded-sm text-[10px] font-mono uppercase tracking-wider transition-colors bg-purple-500/10 text-purple-700 hover:bg-purple-500/20 border border-purple-500/30"
              >
                Or pay with crypto
              </button>
            </div>
          </div>
        )}

        {/* Token Credits */}
        {activeTab === 'credits' && (
          <>
            <div className="bg-relic-ghost/30 border border-relic-mist/20 rounded-sm p-3 mb-4 max-w-2xl mx-auto">
              <p className="text-[11px] text-relic-slate text-center">
                One-time purchase • No expiration • Flexible usage
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-8">
              {/* Starter */}
              <div className="flex flex-col gap-2">
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
                <button
                  onClick={() =>
                    handleCryptoPayment(
                      TOKEN_CREDITS.starter.price,
                      'credits',
                      undefined,
                      TOKEN_CREDITS.starter.tokens
                    )
                  }
                  className="w-full py-1.5 px-3 rounded-sm text-[10px] font-mono uppercase tracking-wider transition-colors bg-purple-500/10 text-purple-700 hover:bg-purple-500/20 border border-purple-500/30"
                >
                  Or pay with crypto
                </button>
              </div>

              {/* Builder */}
              <div className="flex flex-col gap-2">
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
                <button
                  onClick={() =>
                    handleCryptoPayment(
                      TOKEN_CREDITS.builder.price,
                      'credits',
                      undefined,
                      TOKEN_CREDITS.builder.tokens
                    )
                  }
                  className="w-full py-1.5 px-3 rounded-sm text-[10px] font-mono uppercase tracking-wider transition-colors bg-purple-500/10 text-purple-700 hover:bg-purple-500/20 border border-purple-500/30"
                >
                  Or pay with crypto
                </button>
              </div>

              {/* Scale */}
              <div className="flex flex-col gap-2">
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
                <button
                  onClick={() =>
                    handleCryptoPayment(
                      TOKEN_CREDITS.scale.price,
                      'credits',
                      undefined,
                      TOKEN_CREDITS.scale.tokens
                    )
                  }
                  className="w-full py-1.5 px-3 rounded-sm text-[10px] font-mono uppercase tracking-wider transition-colors bg-purple-500/10 text-purple-700 hover:bg-purple-500/20 border border-purple-500/30"
                >
                  Or pay with crypto
                </button>
              </div>

              {/* Bulk */}
              <div className="flex flex-col gap-2">
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
                <button
                  onClick={() =>
                    handleCryptoPayment(
                      TOKEN_CREDITS.bulk.price,
                      'credits',
                      undefined,
                      TOKEN_CREDITS.bulk.tokens
                    )
                  }
                  className="w-full py-1.5 px-3 rounded-sm text-[10px] font-mono uppercase tracking-wider transition-colors bg-purple-500/10 text-purple-700 hover:bg-purple-500/20 border border-purple-500/30"
                >
                  Or pay with crypto
                </button>
              </div>

              {/* Custom amount card */}
              <CustomCreditCard />
            </div>
          </>
        )}

        {/* FAQ Section */}
        <div className="border-t border-relic-mist/20 pt-6 mt-6 max-w-2xl mx-auto">
          <h2 className="text-xs font-mono uppercase tracking-wider text-relic-void mb-3 text-center">
            FAQ
          </h2>

          <div className="space-y-2">
            <div className="border-b border-relic-mist/10 pb-2">
              <h3 className="text-[11px] font-medium text-relic-void mb-0.5">
                Do token credits expire?
              </h3>
              <p className="text-[10px] text-relic-slate">
                No. Credits never expire.
              </p>
            </div>

            <div className="border-b border-relic-mist/10 pb-2">
              <h3 className="text-[11px] font-medium text-relic-void mb-0.5">
                Can I switch plans?
              </h3>
              <p className="text-[10px] text-relic-slate">
                Yes. Upgrade or downgrade anytime. Changes apply next billing cycle.
              </p>
            </div>

            <div className="border-b border-relic-mist/10 pb-2">
              <h3 className="text-[11px] font-medium text-relic-void mb-0.5">
                Refund policy?
              </h3>
              <p className="text-[10px] text-relic-slate">
                7-day money-back guarantee for subscriptions. Credits non-refundable.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center pb-6">
          <p className="text-[9px] font-mono text-relic-silver">
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

      {/* Crypto Payment Modal - Dual Provider (BTCPay + NOWPayments) */}
      {cryptoPaymentData && (
        <CryptoPaymentModalDual
          isOpen={cryptoModalOpen}
          onClose={() => {
            setCryptoModalOpen(false)
            setCryptoPaymentData(null)
          }}
          amount={cryptoPaymentData.amount}
          productType={cryptoPaymentData.productType}
          planId={cryptoPaymentData.planId}
          creditAmount={cryptoPaymentData.creditAmount}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  )
}
