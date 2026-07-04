/**
 * Custom Credits Checkout API
 * Creates checkout sessions for custom token credit amounts
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { stripe } from '@/lib/stripe';
import { trackServerEvent } from '@/lib/posthog-server';
import { getAnonymousDistinctId } from '@/lib/posthog-events';

export const CheckoutCustomCreditsSchema = z.object({
  // handler contract: $5–$10,000; fractional dollars are valid (UI parseFloat, Stripe gets
  // Math.round(amount*100) cents) — int() would 400 a currently-valid $7.50 purchase
  amount: z.number().min(5).max(10000),
  // UI computes Math.floor(dollars/0.04*1000) — max legit is 250M at $10,000; 1e9 = absurdity guard
  tokens: z.number().int().positive().max(1_000_000_000),
});

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const parsed = CheckoutCustomCreditsSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { amount, tokens } = parsed.data;

    // Get the base URL for redirects
    const origin = request.headers.get('origin') || 'http://localhost:3000';

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
    });

    // Track custom credits checkout started
    try {
      const distinctId = getAnonymousDistinctId(request);
      trackServerEvent('custom_credits_checkout_started', distinctId, {
        amount,
        tokens,
        session_id: session.id,
      });
    } catch (trackError) {
      console.warn('[Custom Credits] PostHog tracking failed:', trackError);
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('[Custom Credits] Error creating session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
