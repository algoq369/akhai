/**
 * Custom Credits Checkout API
 * Creates checkout sessions for custom token credit amounts
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { trackServerEvent } from '@/lib/posthog-server'
import { getAnonymousDistinctId } from '@/lib/posthog-events'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, tokens } = body

    // Validate amount
    if (!amount || typeof amount !== 'number' || amount < 5 || amount > 10000) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be between $5 and $10,000' },
        { status: 400 }
      )
    }

    // Get the base URL for redirects
    const origin = request.headers.get('origin') || 'http://localhost:3000'

    // Create checkout session with custom amount
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(amount * 100), // Convert to cents
            product_data: {
              name: 'AkhAI Token Credits',
              description: `${(tokens / 1000).toLocaleString()}K tokens for Claude Opus 4.5`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,

      // Enable payment methods
      payment_method_types: ['card'],

      // Payment method options
      payment_method_options: {
        card: {
          setup_future_usage: 'off_session',
        },
      },

      // Metadata for webhook processing
      metadata: {
        type: 'custom_credits',
        amount: amount.toString(),
        tokens: tokens.toString(),
      },

      // Invoice creation
      invoice_creation: {
        enabled: true,
      },
    })

    // Track custom credits checkout started
    try {
      const distinctId = getAnonymousDistinctId(request)
      trackServerEvent('custom_credits_checkout_started', distinctId, {
        amount,
        tokens,
        session_id: session.id,
      })
    } catch (trackError) {
      console.warn('[Custom Credits] PostHog tracking failed:', trackError)
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error: any) {
    console.error('[Custom Credits] Error creating session:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
