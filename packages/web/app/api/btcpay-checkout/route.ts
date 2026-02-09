import { NextRequest, NextResponse } from 'next/server'
import { btcPay, isBTCPayConfigured, getBTCPayQRCode } from '@/lib/btcpay'
import { trackServerEvent } from '@/lib/posthog-server'
import { getAnonymousDistinctId } from '@/lib/posthog-events'
import { getUserFromSession } from '@/lib/auth'
import { nanoid } from 'nanoid'

export const runtime = 'nodejs'

interface CheckoutRequest {
  amount: number
  currency: string
  productType: 'subscription' | 'credits'
  planId?: string
  creditAmount?: number
  userId?: string // Optional: can be passed from client if already known
}

export async function POST(req: NextRequest) {
  try {
    // Check if BTCPay is configured
    if (!isBTCPayConfigured()) {
      return NextResponse.json(
        { error: 'BTCPay Server not configured' },
        { status: 503 }
      )
    }

    // Get user from session (same pattern as Stripe checkout)
    const token = req.cookies.get('session_token')?.value
    const user = token ? getUserFromSession(token) : null

    const body: CheckoutRequest = await req.json()

    // Use userId from body if provided, otherwise from session
    const userId = body.userId || user?.id || null

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to make a purchase.' },
        { status: 401 }
      )
    }

    // Validation
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    if (!body.currency) {
      return NextResponse.json(
        { error: 'Currency required' },
        { status: 400 }
      )
    }

    if (!['subscription', 'credits'].includes(body.productType)) {
      return NextResponse.json(
        { error: 'Invalid product type' },
        { status: 400 }
      )
    }

    // Generate unique order ID (include userId for easy lookup)
    const orderId = `akhai-btc-${body.productType}-${nanoid(12)}`

    // Create description
    let description = ''
    if (body.productType === 'subscription' && body.planId) {
      description = `AkhAI ${body.planId.charAt(0).toUpperCase() + body.planId.slice(1)} Subscription`
    } else if (body.productType === 'credits' && body.creditAmount) {
      description = `AkhAI Token Credits - ${(body.creditAmount / 1000).toLocaleString()}K tokens`
    } else {
      description = `AkhAI ${body.productType}`
    }

    // Create invoice with BTCPay Server
    // Include userId in metadata for webhook processing
    const invoice = await btcPay.createInvoice({
      amount: body.amount,
      currency: 'USD',
      orderId,
      description,
      // Pass additional metadata via posData (BTCPay supports this)
      posData: JSON.stringify({
        userId,
        productType: body.productType,
        planId: body.planId || null,
        creditAmount: body.creditAmount || null,
        tokenAmount: body.creditAmount || null, // Store token amount for easy processing
      }),
    })

    // Get payment methods
    const paymentMethods = await btcPay.getPaymentMethods(invoice.id)

    // Track analytics
    const distinctId = userId || getAnonymousDistinctId(req)
    trackServerEvent('btcpay_checkout_started', distinctId, {
      product_type: body.productType,
      amount: body.amount,
      currency: body.currency,
      plan_id: body.planId,
      credit_amount: body.creditAmount,
      invoice_id: invoice.id,
      user_id: userId,
    })

    // Return invoice details
    return NextResponse.json({
      success: true,
      provider: 'btcpay',
      invoiceId: invoice.id,
      checkoutLink: invoice.checkoutLink,
      status: invoice.status,
      expiresAt: new Date(invoice.expirationTime * 1000).toISOString(),
      paymentMethods: paymentMethods.map(pm => ({
        cryptoCode: pm.cryptoCode,
        address: pm.destination,
        amount: pm.amount,
        rate: pm.rate,
        qrCodeUrl: getBTCPayQRCode(pm.paymentLink),
        paymentLink: pm.paymentLink,
      })),
    })
  } catch (error) {
    console.error('[BTCPay Checkout Error]:', error)

    return NextResponse.json(
      {
        error: 'Failed to create BTCPay invoice',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check invoice status
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const invoiceId = searchParams.get('invoiceId')

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID required' },
        { status: 400 }
      )
    }

    if (!isBTCPayConfigured()) {
      return NextResponse.json(
        { error: 'BTCPay Server not configured' },
        { status: 503 }
      )
    }

    const invoice = await btcPay.getInvoice(invoiceId)

    return NextResponse.json({
      success: true,
      invoiceId: invoice.id,
      status: invoice.status,
      amount: invoice.amount,
      currency: invoice.currency,
      createdTime: invoice.createdTime,
      expirationTime: invoice.expirationTime,
    })
  } catch (error) {
    console.error('[BTCPay Get Invoice Error]:', error)

    return NextResponse.json(
      {
        error: 'Failed to get invoice status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
