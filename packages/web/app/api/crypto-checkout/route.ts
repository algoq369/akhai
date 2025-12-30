import { NextRequest, NextResponse } from 'next/server'
import { nowPayments, CreatePaymentParams, getQRCodeURL } from '@/lib/nowpayments'
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
    const orderId = `akhai-${body.productType}-${nanoid(12)}`

    // Create description
    let description = ''
    if (body.productType === 'subscription' && body.planId) {
      description = `AkhAI ${body.planId.charAt(0).toUpperCase() + body.planId.slice(1)} Subscription`
    } else if (body.productType === 'credits' && body.creditAmount) {
      description = `AkhAI Token Credits - ${(body.creditAmount / 1000).toLocaleString()}K tokens`
    } else {
      description = `AkhAI ${body.productType}`
    }

    // Create payment with NOWPayments
    const params: CreatePaymentParams = {
      amount: body.amount,
      currency: 'usd', // Price currency (what we charge in)
      payCurrency: body.currency, // Crypto currency user selected (btc, eth, xmr, etc.)
      orderId,
      description,
    }

    const payment = await nowPayments.createPayment(params)

    // Generate QR code URL
    const qrCodeUrl = getQRCodeURL(
      payment.pay_address,
      payment.pay_amount,
      payment.pay_currency
    )

    // Track analytics
    if (typeof window !== 'undefined') {
      trackEvent('crypto_checkout_started', {
        product_type: body.productType,
        amount: body.amount,
        currency: body.currency,
        plan_id: body.planId,
        credit_amount: body.creditAmount,
        payment_id: payment.payment_id,
      })
    }

    // Return payment details
    return NextResponse.json({
      success: true,
      paymentId: payment.payment_id,
      paymentUrl: payment.payment_url,
      payAddress: payment.pay_address,
      payAmount: payment.pay_amount,
      payCurrency: payment.pay_currency,
      qrCodeUrl,
      orderId: payment.order_id,
      status: payment.payment_status,
      expiresAt: payment.expiration_estimate_date,
    })
  } catch (error) {
    console.error('[Crypto Checkout Error]:', error)

    return NextResponse.json(
      {
        error: 'Failed to create crypto payment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check payment status or minimum amount for a currency
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const paymentId = searchParams.get('paymentId')
    const currency = searchParams.get('currency')

    // Check payment status
    if (paymentId) {
      const payment = await nowPayments.getPaymentStatus(paymentId)

      return NextResponse.json({
        success: true,
        paymentId: payment.payment_id,
        status: payment.payment_status,
        payAmount: payment.pay_amount,
        actuallyPaid: payment.actually_paid,
        payCurrency: payment.pay_currency,
        outcomeAmount: payment.outcome_amount,
        outcomeCurrency: payment.outcome_currency,
      })
    }

    // Check minimum amount
    if (currency) {
      const minAmount = await nowPayments.getMinimumAmount(currency)

      return NextResponse.json({
        success: true,
        currency,
        minAmount,
      })
    }

    return NextResponse.json(
      { error: 'Either paymentId or currency parameter required' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[Crypto Checkout GET Error]:', error)

    return NextResponse.json(
      {
        error: 'Request failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
