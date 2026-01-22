import { NextRequest, NextResponse } from 'next/server'
import { btcPay, WebhookPayload } from '@/lib/btcpay'
import { trackEvent } from '@/lib/posthog'
import { db } from '@/lib/database'

export const runtime = 'nodejs'

/**
 * BTCPay Server Webhook Handler
 *
 * Receives payment status updates from BTCPay Server
 * Verifies signature and processes completed payments
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
 * Handle settled invoice (payment complete)
 */
async function handleInvoiceSettled(invoiceId: string) {
  try {
    // Get full invoice details
    const invoice = await btcPay.getInvoice(invoiceId)

    // Extract product type and metadata from order ID
    // Format: akhai-btc-{type}-{nanoId}
    const orderId = invoice.metadata.orderId
    const orderParts = orderId.split('-')
    const productType = orderParts[2] as 'subscription' | 'credits'

    // Process based on product type
    if (productType === 'credits') {
      await processCreditsPayment(invoiceId, invoice.metadata.itemDesc, parseFloat(invoice.amount))
    } else if (productType === 'subscription') {
      await processSubscriptionPayment(invoiceId, invoice.metadata.itemDesc)
    }

    // Track success
    trackEvent('btcpay_payment_completed', {
      invoice_id: invoiceId,
      product_type: productType,
      amount: invoice.amount,
      currency: invoice.currency,
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
  trackEvent('btcpay_payment_processing', {
    invoice_id: invoiceId,
  })
}

/**
 * Handle expired invoice
 */
async function handleInvoiceExpired(invoiceId: string) {
  trackEvent('btcpay_payment_expired', {
    invoice_id: invoiceId,
  })
}

/**
 * Handle invalid invoice
 */
async function handleInvoiceInvalid(invoiceId: string) {
  trackEvent('btcpay_payment_invalid', {
    invoice_id: invoiceId,
  })
}

/**
 * Process credits purchase
 */
async function processCreditsPayment(
  invoiceId: string,
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
    db.prepare(
      `INSERT INTO btcpay_payments (
        invoice_id,
        product_type,
        amount_usd,
        token_amount,
        status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now'))`
    ).run(invoiceId, 'credits', amountUSD, tokenAmount, 'completed')

    console.log('[BTCPay Webhook] Credits payment processed:', {
      invoiceId,
      tokenAmount,
      amountUSD,
    })

    // TODO: Add tokens to user account
    // This will require user_id in the invoice metadata
  } catch (error) {
    console.error('[BTCPay Webhook] Credits processing error:', error)
    throw error
  }
}

/**
 * Process subscription purchase
 */
async function processSubscriptionPayment(
  invoiceId: string,
  description: string
) {
  try {
    // Parse plan from description
    // Format: "AkhAI Pro Subscription" or "AkhAI Instinct Subscription"
    const planMatch = description.match(/AkhAI (\w+) Subscription/)
    if (!planMatch) {
      throw new Error('Cannot parse plan from description')
    }

    const plan = planMatch[1].toLowerCase()

    // Store payment record
    db.prepare(
      `INSERT INTO btcpay_payments (
        invoice_id,
        product_type,
        plan_id,
        status,
        created_at
      ) VALUES (?, ?, ?, ?, datetime('now'))`
    ).run(invoiceId, 'subscription', plan, 'completed')

    console.log('[BTCPay Webhook] Subscription payment processed:', {
      invoiceId,
      plan,
    })

    // TODO: Activate subscription for user
    // This will require user_id in the invoice metadata
  } catch (error) {
    console.error('[BTCPay Webhook] Subscription processing error:', error)
    throw error
  }
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
