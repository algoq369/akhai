import { NextRequest, NextResponse } from 'next/server'
import { nowPayments, IPNPayload, PaymentStatus } from '@/lib/nowpayments'
import { trackServerEvent } from '@/lib/posthog-server'
import { db } from '@/lib/database'
import {
  addTokens,
  upsertSubscription,
  recordPayment,
  type Tier,
} from '@/lib/subscription'

export const runtime = 'nodejs'

/**
 * NOWPayments IPN Webhook Handler
 *
 * Receives payment status updates from NOWPayments
 * Verifies signature and processes completed payments
 *
 * FLOW:
 * 1. Checkout creates payment with orderId containing userId
 * 2. User pays via cryptocurrency
 * 3. NOWPayments calls this webhook with status update
 * 4. We parse orderId, add tokens/subscription, record payment
 *
 * Order ID formats:
 * - Credits: akhai-credits-{userId}-{tokenAmount}-{nanoId}
 * - Subscription: akhai-subscription-{userId}-{planId}-{nanoId}
 */
export async function POST(req: NextRequest) {
  try {
    // Get signature from header
    const signature = req.headers.get('x-nowpayments-sig')
    if (!signature) {
      console.error('[Crypto Webhook] Missing signature header')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      )
    }

    // Get raw body for signature verification
    const rawBody = await req.text()

    // Verify IPN signature
    const isValid = nowPayments.verifyIPN(signature, rawBody)
    if (!isValid) {
      console.error('[Crypto Webhook] Invalid signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Parse payload
    const payload: IPNPayload = JSON.parse(rawBody)

    console.log('[Crypto Webhook] Received IPN:', {
      payment_id: payload.payment_id,
      status: payload.payment_status,
      order_id: payload.order_id,
    })

    // Process based on status
    await processPaymentStatus(payload)

    // Return success
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Crypto Webhook Error]:', error)

    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Parse orderId to extract userId, productType, and metadata
 *
 * Formats:
 * - New: akhai-credits-{userId}-{tokenAmount}-{nanoId}
 * - New: akhai-subscription-{userId}-{planId}-{nanoId}
 * - Legacy: akhai-{type}-{nanoId}
 */
interface ParsedOrder {
  productType: 'subscription' | 'credits'
  userId: string | null
  tokenAmount?: number
  planId?: string
  isLegacy: boolean
}

function parseOrderId(orderId: string): ParsedOrder {
  const parts = orderId.split('-')

  // New format: akhai-{type}-{userId}-{metadata}-{nanoId}
  if (parts.length >= 5 && parts[0] === 'akhai') {
    const productType = parts[1] as 'subscription' | 'credits'
    const userId = parts[2]

    if (productType === 'credits') {
      const tokenAmount = parseInt(parts[3]) || 0
      return { productType, userId, tokenAmount, isLegacy: false }
    } else {
      const planId = parts[3]
      return { productType, userId, planId, isLegacy: false }
    }
  }

  // Legacy format: akhai-{type}-{nanoId}
  if (parts.length >= 3 && parts[0] === 'akhai') {
    const productType = parts[1] as 'subscription' | 'credits'
    return { productType, userId: null, isLegacy: true }
  }

  // Unknown format
  console.error('[Crypto Webhook] Unknown order ID format:', orderId)
  return { productType: 'credits', userId: null, isLegacy: true }
}

/**
 * Process payment based on status
 */
async function processPaymentStatus(payload: IPNPayload) {
  const {
    payment_id,
    payment_status,
    order_id,
    order_description,
    outcome_amount,
    outcome_currency,
    pay_currency,
    actually_paid,
  } = payload

  // Parse order ID to get user info
  const parsedOrder = parseOrderId(order_id)

  switch (payment_status) {
    case 'finished':
      // Payment completed successfully
      console.log('[Crypto Webhook] Payment finished:', payment_id)

      if (parsedOrder.isLegacy || !parsedOrder.userId) {
        // Legacy processing without user info
        console.warn('[Crypto Webhook] Legacy payment without userId:', payment_id)
        if (parsedOrder.productType === 'credits') {
          await processLegacyCreditsPayment(payment_id, order_description, outcome_amount)
        } else if (parsedOrder.productType === 'subscription') {
          await processLegacySubscriptionPayment(payment_id, order_description)
        }
      } else {
        // New processing with full user info
        if (parsedOrder.productType === 'credits') {
          await processCreditsPayment(payment_id, parsedOrder, outcome_amount)
        } else if (parsedOrder.productType === 'subscription') {
          await processSubscriptionPayment(payment_id, parsedOrder, outcome_amount)
        }
      }

      // Track success
      trackServerEvent('crypto_payment_completed', parsedOrder.userId || 'anonymous', {
        payment_id,
        product_type: parsedOrder.productType,
        amount: outcome_amount,
        currency: outcome_currency,
        crypto_currency: pay_currency,
        crypto_amount: actually_paid,
        user_id: parsedOrder.userId,
      })

      break

    case 'failed':
    case 'expired':
      // Payment failed or expired
      console.log('[Crypto Webhook] Payment failed/expired:', payment_id, payment_status)

      trackServerEvent('crypto_payment_failed', parsedOrder.userId || 'anonymous', {
        payment_id,
        status: payment_status,
        product_type: parsedOrder.productType,
      })

      break

    case 'waiting':
    case 'confirming':
    case 'confirmed':
    case 'sending':
      // Intermediate states - log but don't process yet
      console.log('[Crypto Webhook] Payment in progress:', payment_id, payment_status)
      break

    case 'partially_paid':
      // Payment partially received
      console.log('[Crypto Webhook] Partial payment:', payment_id)
      break

    case 'refunded':
      // Payment refunded
      console.log('[Crypto Webhook] Payment refunded:', payment_id)
      break

    default:
      console.warn('[Crypto Webhook] Unknown status:', payment_status)
  }
}

/**
 * Process credits purchase (with full user info)
 */
async function processCreditsPayment(
  paymentId: string,
  parsedOrder: ParsedOrder,
  amountUSD: number
) {
  const { userId, tokenAmount } = parsedOrder

  if (!userId) {
    throw new Error('No userId in parsedOrder')
  }

  const tokens = tokenAmount || 0
  if (tokens <= 0) {
    throw new Error('Invalid token amount in parsedOrder')
  }

  // Add tokens to user account (same as Stripe webhook)
  await addTokens(userId, tokens)

  // Record payment in database
  await recordPayment({
    userId,
    paymentProvider: 'nowpayments',
    paymentType: 'credits',
    amount: amountUSD,
    currency: 'usd',
    tokensGranted: tokens,
    providerPaymentId: paymentId,
    metadata: {
      payment_id: paymentId,
      crypto_payment: true,
    },
  })

  // Store in crypto_payments table for reference
  db.prepare(
    `INSERT INTO crypto_payments (
      payment_id,
      user_id,
      product_type,
      amount_usd,
      token_amount,
      status,
      created_at,
      completed_at
    ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
  ).run(paymentId, userId, 'credits', amountUSD, tokens, 'completed')

  console.log('[Crypto Webhook] Credits payment completed:', {
    paymentId,
    userId,
    tokenAmount: tokens,
    amountUSD,
  })
}

/**
 * Process subscription purchase (with full user info)
 */
async function processSubscriptionPayment(
  paymentId: string,
  parsedOrder: ParsedOrder,
  amountUSD: number
) {
  const { userId, planId } = parsedOrder

  if (!userId) {
    throw new Error('No userId in parsedOrder')
  }

  if (!planId) {
    throw new Error('No planId in parsedOrder for subscription')
  }

  // Calculate subscription period (30 days from now)
  const now = Math.floor(Date.now() / 1000)
  const periodEnd = now + 30 * 24 * 60 * 60 // 30 days

  // Activate subscription (same as Stripe webhook)
  await upsertSubscription({
    userId,
    plan: planId as Tier,
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
  })

  // Record payment in database
  await recordPayment({
    userId,
    paymentProvider: 'nowpayments',
    paymentType: 'subscription',
    amount: amountUSD,
    currency: 'usd',
    planPurchased: planId,
    providerPaymentId: paymentId,
    metadata: {
      payment_id: paymentId,
      crypto_payment: true,
      period_start: now,
      period_end: periodEnd,
    },
  })

  // Store in crypto_payments table for reference
  db.prepare(
    `INSERT INTO crypto_payments (
      payment_id,
      user_id,
      product_type,
      plan_id,
      amount_usd,
      status,
      created_at,
      completed_at
    ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
  ).run(paymentId, userId, 'subscription', planId, amountUSD, 'completed')

  console.log('[Crypto Webhook] Subscription payment completed:', {
    paymentId,
    userId,
    plan: planId,
    amountUSD,
  })
}

/**
 * Legacy: Process credits purchase (without userId - for backwards compatibility)
 */
async function processLegacyCreditsPayment(
  paymentId: string,
  description: string,
  amountUSD: number
) {
  // Parse token amount from description
  // Format: "AkhAI Token Credits - XXK tokens"
  const match = description.match(/(\d+)K tokens/)
  if (!match) {
    throw new Error('Cannot parse token amount from description')
  }

  const tokenAmount = parseInt(match[1]) * 1000

  // Store payment record (without user association)
  db.prepare(
    `INSERT INTO crypto_payments (
      payment_id,
      product_type,
      amount_usd,
      token_amount,
      status,
      created_at
    ) VALUES (?, ?, ?, ?, ?, datetime('now'))`
  ).run(paymentId, 'credits', amountUSD, tokenAmount, 'pending_user')

  console.warn('[Crypto Webhook] Legacy credits payment processed (no user):', {
    paymentId,
    tokenAmount,
    amountUSD,
    note: 'Payment recorded but tokens not added - no userId in order_id',
  })
}

/**
 * Legacy: Process subscription purchase (without userId - for backwards compatibility)
 */
async function processLegacySubscriptionPayment(
  paymentId: string,
  description: string
) {
  // Parse plan from description
  // Format: "AkhAI Pro Subscription" or "AkhAI Legend Subscription"
  const planMatch = description.match(/AkhAI (\w+) Subscription/)
  if (!planMatch) {
    throw new Error('Cannot parse plan from description')
  }

  const plan = planMatch[1].toLowerCase()

  // Store payment record (without user association)
  db.prepare(
    `INSERT INTO crypto_payments (
      payment_id,
      product_type,
      plan_id,
      status,
      created_at
    ) VALUES (?, ?, ?, ?, datetime('now'))`
  ).run(paymentId, 'subscription', plan, 'pending_user')

  console.warn('[Crypto Webhook] Legacy subscription payment processed (no user):', {
    paymentId,
    plan,
    note: 'Payment recorded but subscription not activated - no userId in order_id',
  })
}

// Create crypto_payments table if it doesn't exist
function initializePaymentsTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS crypto_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_id TEXT UNIQUE NOT NULL,
      user_id TEXT,
      product_type TEXT NOT NULL,
      plan_id TEXT,
      token_amount INTEGER,
      amount_usd REAL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      completed_at TEXT
    )
  `)
}

// Initialize on module load
initializePaymentsTable()
