/**
 * Stripe Webhook Handler
 * Processes Stripe events (subscription created, payment succeeded, etc.)
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { trackServerEvent } from '@/lib/posthog-server'
import Stripe from 'stripe'

// Disable body parsing, need raw body for signature verification
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error: any) {
    console.error('[Webhook] Signature verification failed:', error.message)
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${error.message}` },
      { status: 400 }
    )
  }

  // Handle the event
  try {
    switch (event.type) {
      // ============================================
      // SUBSCRIPTION EVENTS
      // ============================================

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === 'subscription') {
          // Subscription created
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )

          const planId = session.metadata?.planId || 'unknown'
          const userId = session.metadata?.userId || session.customer as string

          // Track subscription created
          trackServerEvent('subscription_created', userId, {
            plan: planId,
            mrr: (session.amount_total || 0) / 100,
            billing_period: 'monthly',
            user_id: userId,
            subscription_id: subscription.id,
            customer_email: session.customer_email,
          })

          console.log(`[Webhook] Subscription created: ${subscription.id}`)

          // TODO: Update user's subscription in database
          // - Set user's plan to Pro/Legend/Team
          // - Store subscription_id
          // - Set unlimited queries
        } else if (session.mode === 'payment') {
          // One-time payment (token credits)
          const creditTier = session.metadata?.planId || 'unknown'
          const userId = session.metadata?.userId || session.customer as string
          const amount = (session.amount_total || 0) / 100

          // Track credits purchased
          trackServerEvent('credits_purchased', userId, {
            credit_tier: creditTier,
            amount,
            user_id: userId,
            payment_intent: session.payment_intent,
            customer_email: session.customer_email,
          })

          console.log(`[Webhook] Credits purchased: ${creditTier} for $${amount}`)

          // TODO: Update user's token balance in database
          // - Add tokens to user's account
          // - Store purchase record
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        console.log(`[Webhook] Subscription updated: ${subscription.id}`)

        // TODO: Handle subscription changes
        // - Plan upgrades/downgrades
        // - Billing cycle changes
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        console.log(`[Webhook] Subscription cancelled: ${subscription.id}`)

        // TODO: Handle cancellation
        // - Revert user to free plan
        // - Remove subscription_id
        // - Set query limits
        break
      }

      // ============================================
      // PAYMENT EVENTS
      // ============================================

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        console.log(`[Webhook] Payment succeeded: ${invoice.id}`)

        // TODO: Handle successful recurring payment
        // - Extend subscription period
        // - Send receipt email
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log(`[Webhook] Payment failed: ${invoice.id}`)

        // TODO: Handle failed payment
        // - Notify user
        // - Retry payment
        // - Grace period before cancellation
        break
      }

      // ============================================
      // CUSTOMER EVENTS
      // ============================================

      case 'customer.created': {
        const customer = event.data.object as Stripe.Customer
        console.log(`[Webhook] Customer created: ${customer.id}`)
        break
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error(`[Webhook] Error processing ${event.type}:`, error)
    return NextResponse.json(
      { error: `Webhook handler failed: ${error.message}` },
      { status: 500 }
    )
  }
}
