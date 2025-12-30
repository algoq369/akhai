import { NextRequest, NextResponse } from 'next/server'
import { nowPayments, IPNPayload, PaymentStatus } from '@/lib/nowpayments'
import { trackEvent } from '@/lib/posthog'
import { getDatabase } from '@/lib/database'

export const runtime = 'nodejs'

/**
 * NOWPayments IPN Webhook Handler
 *
 * Receives payment status updates from NOWPayments
 * Verifies signature and processes completed payments
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

  // Extract product type and metadata from order_id
  // Format: akhai-{type}-{nanoId}
  const orderParts = order_id.split('-')
  const productType = orderParts[1] as 'subscription' | 'credits'

  switch (payment_status) {
    case 'finished':
      // Payment completed successfully
      console.log('[Crypto Webhook] Payment finished:', payment_id)

      // Process based on product type
      if (productType === 'credits') {
        await processCreditsPayment(payment_id, order_description, outcome_amount)
      } else if (productType === 'subscription') {
        await processSubscriptionPayment(payment_id, order_description)
      }

      // Track success
      trackEvent('crypto_payment_completed', {
        payment_id,
        product_type: productType,
        amount: outcome_amount,
        currency: outcome_currency,
        crypto_currency: pay_currency,
        crypto_amount: actually_paid,
      })

      break

    case 'failed':
    case 'expired':
      // Payment failed or expired
      console.log('[Crypto Webhook] Payment failed/expired:', payment_id, payment_status)

      trackEvent('crypto_payment_failed', {
        payment_id,
        status: payment_status,
        product_type: productType,
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
 * Process credits purchase
 */
async function processCreditsPayment(
  paymentId: string,
  description: string,
  amountUSD: number
) {
  try {
    // Parse token amount from description
    // Format: "AkhAI Token Credits - XXK tokens"
    const match = description.match(/(\d+)K tokens/)
    if (!match) {
      throw new Error('Cannot parse token amount from description')
    }

    const tokenAmount = parseInt(match[1]) * 1000

    // Store payment record
    const db = getDatabase()
    db.prepare(
      `INSERT INTO crypto_payments (
        payment_id,
        product_type,
        amount_usd,
        token_amount,
        status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now'))`
    ).run(paymentId, 'credits', amountUSD, tokenAmount, 'completed')

    console.log('[Crypto Webhook] Credits payment processed:', {
      paymentId,
      tokenAmount,
      amountUSD,
    })

    // TODO: Add tokens to user account
    // This will require user_id in the order metadata
    // For now, just log - implement user credit system separately
  } catch (error) {
    console.error('[Crypto Webhook] Credits processing error:', error)
    throw error
  }
}

/**
 * Process subscription purchase
 */
async function processSubscriptionPayment(
  paymentId: string,
  description: string
) {
  try {
    // Parse plan from description
    // Format: "AkhAI Pro Subscription" or "AkhAI Legend Subscription"
    const planMatch = description.match(/AkhAI (\w+) Subscription/)
    if (!planMatch) {
      throw new Error('Cannot parse plan from description')
    }

    const plan = planMatch[1].toLowerCase()

    // Store payment record
    const db = getDatabase()
    db.prepare(
      `INSERT INTO crypto_payments (
        payment_id,
        product_type,
        plan_id,
        status,
        created_at
      ) VALUES (?, ?, ?, ?, datetime('now'))`
    ).run(paymentId, 'subscription', plan, 'completed')

    console.log('[Crypto Webhook] Subscription payment processed:', {
      paymentId,
      plan,
    })

    // TODO: Activate subscription for user
    // This will require user_id in the order metadata
  } catch (error) {
    console.error('[Crypto Webhook] Subscription processing error:', error)
    throw error
  }
}

// Create crypto_payments table if it doesn't exist
function initializePaymentsTable() {
  const db = getDatabase()

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
