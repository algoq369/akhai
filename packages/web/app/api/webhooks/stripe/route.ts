/**
 * Stripe Webhook Handler
 * Processes Stripe events (subscription created, payment succeeded, etc.)
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { trackServerEvent } from '@/lib/posthog-server'
import {
  upsertSubscription,
  addTokens,
  cancelSubscriptionByStripeCustomer,
  getSubscriptionByStripeCustomer,
  updateSubscriptionStatus,
  recordPayment,
  TOKEN_CREDIT_TIERS,
  type Tier,
} from '@/lib/subscription'
import Stripe from 'stripe'

// Disable body parsing, need raw body for signature verification
export const runtime = 'nodejs'

// Extended Stripe types with properties that may not be in the type definitions
interface StripeSubscriptionExtended extends Stripe.Subscription {
  current_period_start: number
  current_period_end: number
}

interface StripeInvoiceExtended extends Stripe.Invoice {
  subscription?: string | Stripe.Subscription
  payment_intent?: string | Stripe.PaymentIntent
}

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
          ) as unknown as StripeSubscriptionExtended

          const planId = session.metadata?.planId || 'pro'
          const userId = session.metadata?.userId || session.customer_email || session.customer as string
          const customerId = session.customer as string

          // Create/update subscription in database
          await upsertSubscription({
            userId,
            plan: planId as Tier,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            currentPeriodStart: subscription.current_period_start,
            currentPeriodEnd: subscription.current_period_end,
          })

          // Record payment
          await recordPayment({
            userId,
            paymentProvider: 'stripe',
            paymentType: 'subscription',
            amount: (session.amount_total || 0) / 100,
            currency: session.currency || 'usd',
            planPurchased: planId,
            providerPaymentId: session.payment_intent as string,
            providerCustomerId: customerId,
            metadata: {
              subscription_id: subscription.id,
              customer_email: session.customer_email,
            },
          })

          // Track subscription created
          trackServerEvent('subscription_created', userId, {
            plan: planId,
            mrr: (session.amount_total || 0) / 100,
            billing_period: 'monthly',
            user_id: userId,
            subscription_id: subscription.id,
            customer_email: session.customer_email,
          })

          console.log(`[Webhook] Subscription created and saved to DB: ${subscription.id} | Plan: ${planId}`)

        } else if (session.mode === 'payment') {
          // One-time payment (token credits)
          const creditTier = session.metadata?.planId || 'unknown'
          const userId = session.metadata?.userId || session.customer_email || session.customer as string
          const amount = (session.amount_total || 0) / 100
          const customerId = session.customer as string

          // Get token amount from tier
          const tokens = TOKEN_CREDIT_TIERS[creditTier] || 0

          if (tokens > 0) {
            // Add tokens to user's account
            await addTokens(userId, tokens)

            // Record payment
            await recordPayment({
              userId,
              paymentProvider: 'stripe',
              paymentType: 'credits',
              amount,
              currency: session.currency || 'usd',
              tokensGranted: tokens,
              providerPaymentId: session.payment_intent as string,
              providerCustomerId: customerId,
              metadata: {
                credit_tier: creditTier,
                customer_email: session.customer_email,
              },
            })

            console.log(`[Webhook] Tokens added to DB: ${tokens} tokens for user ${userId}`)
          }

          // Track credits purchased
          trackServerEvent('credits_purchased', userId, {
            credit_tier: creditTier,
            tokens,
            amount,
            user_id: userId,
            payment_intent: session.payment_intent,
            customer_email: session.customer_email,
          })

          console.log(`[Webhook] Credits purchased: ${creditTier} for $${amount} (${tokens} tokens)`)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as StripeSubscriptionExtended
        const customerId = subscription.customer as string

        // Get existing subscription to find user ID
        const existingSub = await getSubscriptionByStripeCustomer(customerId)

        if (existingSub) {
          // Extract plan from subscription metadata or items
          const planId = subscription.items.data[0]?.price?.metadata?.planId || 'pro'

          // Update subscription with new period dates and status
          await upsertSubscription({
            userId: existingSub.userId,
            plan: planId as Tier,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            currentPeriodStart: subscription.current_period_start,
            currentPeriodEnd: subscription.current_period_end,
          })

          console.log(`[Webhook] Subscription updated in DB: ${subscription.id} | Plan: ${planId}`)
        } else {
          console.warn(`[Webhook] Subscription updated but not found in DB: ${subscription.id}`)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Downgrade to free plan, remove subscription_id, set limits to 3
        await cancelSubscriptionByStripeCustomer(customerId)

        // Track subscription canceled
        const existingSub = await getSubscriptionByStripeCustomer(customerId)
        if (existingSub) {
          trackServerEvent('subscription_canceled', existingSub.userId, {
            subscription_id: subscription.id,
            customer_id: customerId,
            canceled_at: Math.floor(Date.now() / 1000),
          })
        }

        console.log(`[Webhook] Subscription canceled, downgraded to free: ${subscription.id}`)
        break
      }

      // ============================================
      // PAYMENT EVENTS
      // ============================================

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as StripeInvoiceExtended
        const customerId = invoice.customer as string

        // Get subscription to find user ID
        const existingSub = await getSubscriptionByStripeCustomer(customerId)

        if (existingSub && typeof invoice.subscription === 'string') {
          // Fetch latest subscription data to get updated period dates
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription) as unknown as StripeSubscriptionExtended

          // Update subscription period dates
          await upsertSubscription({
            userId: existingSub.userId,
            plan: existingSub.plan,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            currentPeriodStart: subscription.current_period_start,
            currentPeriodEnd: subscription.current_period_end,
          })

          // Record payment
          await recordPayment({
            userId: existingSub.userId,
            paymentProvider: 'stripe',
            paymentType: 'subscription',
            amount: (invoice.amount_paid || 0) / 100,
            currency: invoice.currency || 'usd',
            planPurchased: existingSub.plan,
            providerPaymentId: typeof invoice.payment_intent === 'string' ? invoice.payment_intent : invoice.payment_intent?.id || invoice.id,
            providerCustomerId: customerId,
            metadata: {
              invoice_id: invoice.id,
              subscription_id: subscription.id,
            },
          })

          console.log(`[Webhook] Recurring payment succeeded, subscription extended: ${subscription.id}`)
        } else {
          console.warn(`[Webhook] Payment succeeded but subscription not found: ${invoice.id}`)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as StripeInvoiceExtended
        const customerId = invoice.customer as string

        // Update subscription status to 'past_due'
        await updateSubscriptionStatus(customerId, 'past_due')

        // Get subscription for tracking
        const existingSub = await getSubscriptionByStripeCustomer(customerId)
        if (existingSub) {
          trackServerEvent('payment_failed', existingSub.userId, {
            invoice_id: invoice.id,
            subscription_id: typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id,
            customer_id: customerId,
            amount: (invoice.amount_due || 0) / 100,
            currency: invoice.currency,
            attempt_count: invoice.attempt_count,
          })
        }

        console.log(`[Webhook] Payment failed, subscription marked as past_due: ${invoice.id}`)
        // Note: Stripe will automatically retry failed payments
        // After all retry attempts fail, subscription will be canceled automatically
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
