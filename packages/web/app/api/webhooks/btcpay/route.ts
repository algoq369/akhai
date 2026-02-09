import { NextRequest, NextResponse } from 'next/server'
import { btcPay, WebhookPayload } from '@/lib/btcpay'
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
 * BTCPay Server Webhook Handler
 *
 * Receives payment status updates from BTCPay Server
 * Verifies signature and processes completed payments
 *
 * FLOW:
 * 1. Checkout creates invoice with posData containing userId, productType, etc.
 * 2. User pays via Bitcoin/Lightning/Monero
 * 3. BTCPay Server calls this webhook with InvoiceSettled event
 * 4. We read posData, add tokens/subscription, record payment
 */
export async function POST(req: NextRequest) {
  try {
    // Get signature from header
    const signature = req.headers.get('btcpay-sig')
    if (!signature) {
      console.error('[BTCPay Webhook] Missing signature header')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      )
    }

    // Get raw body for signature verification
    const rawBody = await req.text()

    // Verify webhook signature
    const isValid = btcPay.verifyWebhook(signature, rawBody)
    if (!isValid) {
      console.error('[BTCPay Webhook] Invalid signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Parse payload
    const payload: WebhookPayload = JSON.parse(rawBody)

    console.log('[BTCPay Webhook] Received:', {
      type: payload.type,
      invoiceId: payload.invoiceId,
      storeId: payload.storeId,
    })

    // Process based on event type
    await processWebhookEvent(payload)

    // Return success
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[BTCPay Webhook Error]:', error)

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
 * Process webhook event based on type
 */
async function processWebhookEvent(payload: WebhookPayload) {
  const { type, invoiceId } = payload

  switch (type) {
    case 'InvoiceSettled':
      // Payment completed successfully
      console.log('[BTCPay Webhook] Invoice settled:', invoiceId)
      await handleInvoiceSettled(invoiceId)
      break

    case 'InvoiceProcessing':
      // Payment received, confirming
      console.log('[BTCPay Webhook] Invoice processing:', invoiceId)
      await handleInvoiceProcessing(invoiceId)
      break

    case 'InvoiceExpired':
      // Invoice expired without payment
      console.log('[BTCPay Webhook] Invoice expired:', invoiceId)
      await handleInvoiceExpired(invoiceId)
      break

    case 'InvoiceInvalid':
      // Payment failed or invalid
      console.log('[BTCPay Webhook] Invoice invalid:', invoiceId)
      await handleInvoiceInvalid(invoiceId)
      break

    default:
      console.log('[BTCPay Webhook] Unknown event type:', type)
  }
}

/**
 * Parse posData from invoice metadata
 */
interface PosData {
  userId: string
  productType: 'subscription' | 'credits'
  planId?: string
  creditAmount?: number
  tokenAmount?: number
}

function parsePosData(posDataString: string | undefined): PosData | null {
  if (!posDataString) {
    console.error('[BTCPay Webhook] No posData in invoice metadata')
    return null
  }

  try {
    return JSON.parse(posDataString) as PosData
  } catch (error) {
    console.error('[BTCPay Webhook] Failed to parse posData:', error)
    return null
  }
}

/**
 * Handle settled invoice (payment complete)
 */
async function handleInvoiceSettled(invoiceId: string) {
  try {
    // Get full invoice details
    const invoice = await btcPay.getInvoice(invoiceId)

    // Parse posData from metadata (this is where userId and product info is stored)
    const posData = parsePosData(invoice.metadata.posData)

    if (!posData || !posData.userId) {
      // Fallback: try to parse from orderId for backwards compatibility
      // Format: akhai-btc-{type}-{nanoId}
      const orderId = invoice.metadata.orderId
      const orderParts = orderId.split('-')
      const productType = orderParts[2] as 'subscription' | 'credits'

      console.warn('[BTCPay Webhook] No posData found, using legacy processing for:', invoiceId)

      // Store payment record without user association (legacy behavior)
      if (productType === 'credits') {
        await processLegacyCreditsPayment(invoiceId, invoice.metadata.itemDesc, parseFloat(invoice.amount))
      } else if (productType === 'subscription') {
        await processLegacySubscriptionPayment(invoiceId, invoice.metadata.itemDesc)
      }

      return
    }

    // Process based on product type with full user info
    const amountUSD = parseFloat(invoice.amount)

    if (posData.productType === 'credits') {
      await processCreditsPayment(invoiceId, posData, amountUSD)
    } else if (posData.productType === 'subscription') {
      await processSubscriptionPayment(invoiceId, posData, amountUSD)
    }

    // Track success
    trackServerEvent('btcpay_payment_completed', posData.userId, {
      invoice_id: invoiceId,
      product_type: posData.productType,
      amount: invoice.amount,
      currency: invoice.currency,
      user_id: posData.userId,
    })
  } catch (error) {
    console.error('[BTCPay] Error handling settled invoice:', error)
    throw error
  }
}

/**
 * Handle processing invoice (payment received, confirming)
 */
async function handleInvoiceProcessing(invoiceId: string) {
  trackServerEvent('btcpay_payment_processing', 'anonymous', {
    invoice_id: invoiceId,
  })
}

/**
 * Handle expired invoice
 */
async function handleInvoiceExpired(invoiceId: string) {
  trackServerEvent('btcpay_payment_expired', 'anonymous', {
    invoice_id: invoiceId,
  })
}

/**
 * Handle invalid invoice
 */
async function handleInvoiceInvalid(invoiceId: string) {
  trackServerEvent('btcpay_payment_invalid', 'anonymous', {
    invoice_id: invoiceId,
  })
}

/**
 * Process credits purchase (with full user info)
 */
async function processCreditsPayment(
  invoiceId: string,
  posData: PosData,
  amountUSD: number
) {
  const { userId, tokenAmount, creditAmount } = posData

  // Determine token amount
  const tokens = tokenAmount || creditAmount || 0

  if (tokens <= 0) {
    throw new Error('Invalid token amount in posData')
  }

  // Add tokens to user account (same as Stripe webhook)
  await addTokens(userId, tokens)

  // Record payment in database
  await recordPayment({
    userId,
    paymentProvider: 'btcpay',
    paymentType: 'credits',
    amount: amountUSD,
    currency: 'usd',
    tokensGranted: tokens,
    providerPaymentId: invoiceId,
    metadata: {
      invoice_id: invoiceId,
      crypto_payment: true,
    },
  })

  // Store in btcpay_payments table for reference
  db.prepare(
    `INSERT INTO btcpay_payments (
      invoice_id,
      user_id,
      product_type,
      amount_usd,
      token_amount,
      status,
      created_at,
      completed_at
    ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
  ).run(invoiceId, userId, 'credits', amountUSD, tokens, 'completed')

  console.log('[BTCPay Webhook] Credits payment completed:', {
    invoiceId,
    userId,
    tokenAmount: tokens,
    amountUSD,
  })
}

/**
 * Process subscription purchase (with full user info)
 */
async function processSubscriptionPayment(
  invoiceId: string,
  posData: PosData,
  amountUSD: number
) {
  const { userId, planId } = posData

  if (!planId) {
    throw new Error('No planId in posData for subscription')
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
    paymentProvider: 'btcpay',
    paymentType: 'subscription',
    amount: amountUSD,
    currency: 'usd',
    planPurchased: planId,
    providerPaymentId: invoiceId,
    metadata: {
      invoice_id: invoiceId,
      crypto_payment: true,
      period_start: now,
      period_end: periodEnd,
    },
  })

  // Store in btcpay_payments table for reference
  db.prepare(
    `INSERT INTO btcpay_payments (
      invoice_id,
      user_id,
      product_type,
      plan_id,
      amount_usd,
      status,
      created_at,
      completed_at
    ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
  ).run(invoiceId, userId, 'subscription', planId, amountUSD, 'completed')

  console.log('[BTCPay Webhook] Subscription payment completed:', {
    invoiceId,
    userId,
    plan: planId,
    amountUSD,
  })
}

/**
 * Legacy: Process credits purchase (without posData - for backwards compatibility)
 */
async function processLegacyCreditsPayment(
  invoiceId: string,
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
    `INSERT INTO btcpay_payments (
      invoice_id,
      product_type,
      amount_usd,
      token_amount,
      status,
      created_at
    ) VALUES (?, ?, ?, ?, ?, datetime('now'))`
  ).run(invoiceId, 'credits', amountUSD, tokenAmount, 'pending_user')

  console.warn('[BTCPay Webhook] Legacy credits payment processed (no user):', {
    invoiceId,
    tokenAmount,
    amountUSD,
    note: 'Payment recorded but tokens not added - no userId in metadata',
  })
}

/**
 * Legacy: Process subscription purchase (without posData - for backwards compatibility)
 */
async function processLegacySubscriptionPayment(
  invoiceId: string,
  description: string
) {
  // Parse plan from description
  // Format: "AkhAI Pro Subscription" or "AkhAI Instinct Subscription"
  const planMatch = description.match(/AkhAI (\w+) Subscription/)
  if (!planMatch) {
    throw new Error('Cannot parse plan from description')
  }

  const plan = planMatch[1].toLowerCase()

  // Store payment record (without user association)
  db.prepare(
    `INSERT INTO btcpay_payments (
      invoice_id,
      product_type,
      plan_id,
      status,
      created_at
    ) VALUES (?, ?, ?, ?, datetime('now'))`
  ).run(invoiceId, 'subscription', plan, 'pending_user')

  console.warn('[BTCPay Webhook] Legacy subscription payment processed (no user):', {
    invoiceId,
    plan,
    note: 'Payment recorded but subscription not activated - no userId in metadata',
  })
}

// Create btcpay_payments table if it doesn't exist
function initializePaymentsTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS btcpay_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id TEXT UNIQUE NOT NULL,
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
