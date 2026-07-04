/**
 * Stripe Checkout Session API
 * Creates checkout sessions for subscriptions and one-time payments
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { stripe } from '@/lib/stripe';
import { trackServerEvent } from '@/lib/posthog-server';
import { getAnonymousDistinctId } from '@/lib/posthog-events';

export const CheckoutSchema = z.object({
  priceId: z.string().min(1).max(200),
  // passed straight through as the Stripe Checkout mode — only these two are valid here
  mode: z.enum(['subscription', 'payment']),
  planId: z.string().max(200).optional(),
  userId: z.string().max(200).optional(),
  // Stripe line-item quantity; the UI always sends 1 — 100 is a generous ceiling
  quantity: z.number().int().min(1).max(100).default(1),
  // analytics-only fields PricingCard sends alongside the checkout body
  price: z.number().nonnegative().max(1_000_000).optional(),
  tokens: z.number().nonnegative().max(1_000_000_000_000).optional(),
});

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const parsed = CheckoutSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { priceId, mode, planId, userId, quantity, price, tokens } = parsed.data;

    // Get the base URL for redirects
    const origin = request.headers.get('origin') || 'http://localhost:3000';

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [
        {
          price: priceId,
          quantity,
        },
      ],
      success_url: `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,

      // Enable payment methods
      payment_method_types: ['card'],

      // Payment method options (only for one-time payments)
      ...(mode === 'payment' && {
        payment_method_options: {
          card: {
            setup_future_usage: 'off_session',
          },
        },
      }),

      // Metadata for webhook processing
      metadata: {
        planId: planId || '',
        userId: userId || '',
      },

      // Customer email (optional - can be pre-filled if user is logged in)
      customer_email: undefined, // TODO: Add email from auth session

      // Subscription settings (only for subscription mode)
      ...(mode === 'subscription' && {
        billing_address_collection: 'auto',
        allow_promotion_codes: true,
      }),

      // One-time payment settings
      ...(mode === 'payment' && {
        invoice_creation: {
          enabled: true,
        },
      }),
    });

    // Track checkout started event
    try {
      const distinctId = userId || getAnonymousDistinctId(request);

      if (mode === 'subscription') {
        trackServerEvent('checkout_started', distinctId, {
          plan: planId,
          price: price || 0,
          billing_period: 'monthly',
          session_id: session.id,
        });
      } else {
        trackServerEvent('credits_checkout_started', distinctId, {
          credit_tier: planId,
          price: price || 0,
          tokens: tokens || 0,
          session_id: session.id,
        });
      }
    } catch (trackError) {
      console.warn('[Checkout] PostHog tracking failed:', trackError);
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('[Checkout] Error creating session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
