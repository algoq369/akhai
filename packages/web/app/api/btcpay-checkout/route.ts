import { NextRequest, NextResponse } from 'next/server'
import { btcPay, isBTCPayConfigured, getBTCPayQRCode } from '@/lib/btcpay'
import { trackEvent } from '@/lib/posthog'
import { nanoid } from 'nanoid'

export const runtime = 'nodejs'

interface CheckoutRequest {
  amount: number
  currency: string
  productType: 'subscription' | 'credits'
  planId?: string
  creditAmount?: number
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

    const body: CheckoutRequest = await req.json()

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

    // Generate unique order ID
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
    const invoice = await btcPay.createInvoice({
      amount: body.amount,
      currency: 'USD',
      orderId,
      description,
    })

    // Get payment methods
    const paymentMethods = await btcPay.getPaymentMethods(invoice.id)

    // Track analytics
    if (typeof window !== 'undefined') {
      trackEvent('btcpay_checkout_started', {
        product_type: body.productType,
        amount: body.amount,
        currency: body.currency,
        plan_id: body.planId,
        credit_amount: body.creditAmount,
        invoice_id: invoice.id,
      })
    }

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
