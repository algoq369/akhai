/**
 * NOWPayments API Client
 *
 * Supports 300+ cryptocurrencies including privacy coins (XMR, ZEC)
 * API Documentation: https://nowpayments.io/help/api-documentation
 */

import crypto from 'crypto'

// API Configuration
const NOWPAYMENTS_API_URL = process.env.NOWPAYMENTS_SANDBOX === 'true'
  ? 'https://api-sandbox.nowpayments.io/v1'
  : 'https://api.nowpayments.io/v1'

const API_KEY = process.env.NOWPAYMENTS_API_KEY || ''
const IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET || ''

// TypeScript Interfaces
export interface CreatePaymentParams {
  amount: number
  currency: string // Price currency (USD, EUR, etc.)
  payCurrency: string // Crypto currency user wants to pay with (BTC, ETH, XMR, etc.)
  orderId: string
  description: string
  customerId?: string
  customerEmail?: string
}

export interface PaymentResponse {
  payment_id: string
  payment_status: PaymentStatus
  pay_address: string
  pay_amount: number
  pay_currency: string
  order_id: string
  order_description: string
  payment_url: string
  created_at: string
  updated_at: string
  expiration_estimate_date: string
}

export interface PaymentStatusResponse {
  payment_id: string
  payment_status: PaymentStatus
  pay_address: string
  pay_amount: number
  actually_paid: number
  pay_currency: string
  order_id: string
  created_at: string
  updated_at: string
  outcome_amount: number
  outcome_currency: string
}

export interface Currency {
  id: string
  name: string
  logo_url: string
  is_popular: boolean
  network?: string
}

export interface MinimumAmountResponse {
  currency_from: string
  currency_to: string
  min_amount: number
}

export type PaymentStatus =
  | 'waiting'
  | 'confirming'
  | 'confirmed'
  | 'sending'
  | 'partially_paid'
  | 'finished'
  | 'failed'
  | 'refunded'
  | 'expired'

export interface IPNPayload {
  payment_id: string
  payment_status: PaymentStatus
  pay_address: string
  pay_amount: number
  actually_paid: number
  pay_currency: string
  order_id: string
  order_description: string
  outcome_amount: number
  outcome_currency: string
}

// API Client Class
class NOWPaymentsClient {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey
    this.baseUrl = baseUrl
  }

  /**
   * Make authenticated request to NOWPayments API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(
        `NOWPayments API Error: ${response.status} - ${JSON.stringify(error)}`
      )
    }

    return response.json()
  }

  /**
   * Create a new payment
   */
  async createPayment(params: CreatePaymentParams): Promise<PaymentResponse> {
    return this.request<PaymentResponse>('/payment', {
      method: 'POST',
      body: JSON.stringify({
        price_amount: params.amount,
        price_currency: params.currency, // USD, EUR, etc.
        pay_currency: params.payCurrency, // BTC, ETH, XMR, etc.
        order_id: params.orderId,
        order_description: params.description,
        ipn_callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/crypto`,
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancelled`,
      }),
    })
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
    return this.request<PaymentStatusResponse>(`/payment/${paymentId}`)
  }

  /**
   * Get list of available currencies
   */
  async getAvailableCurrencies(): Promise<Currency[]> {
    const response = await this.request<{ currencies: string[] }>('/currencies')

    // Map to Currency objects with metadata
    return response.currencies.map(id => ({
      id,
      name: this.getCurrencyName(id),
      logo_url: `https://nowpayments.io/images/coins/${id}.svg`,
      is_popular: this.isPopularCurrency(id),
    }))
  }

  /**
   * Get minimum payment amount for a currency
   */
  async getMinimumAmount(
    currencyFrom: string,
    currencyTo: string = 'usd'
  ): Promise<number> {
    const response = await this.request<MinimumAmountResponse>(
      `/min-amount?currency_from=${currencyFrom}&currency_to=${currencyTo}`
    )
    return response.min_amount
  }

  /**
   * Verify IPN callback signature
   */
  verifyIPN(signature: string, payload: string): boolean {
    if (!IPN_SECRET) {
      throw new Error('IPN_SECRET not configured')
    }

    const hmac = crypto
      .createHmac('sha512', IPN_SECRET)
      .update(payload)
      .digest('hex')

    return hmac === signature
  }

  /**
   * Get currency display name
   */
  private getCurrencyName(id: string): string {
    const names: Record<string, string> = {
      btc: 'Bitcoin',
      eth: 'Ethereum',
      xmr: 'Monero',
      usdt: 'Tether',
      usdc: 'USD Coin',
      sol: 'Solana',
      doge: 'Dogecoin',
      ltc: 'Litecoin',
      ada: 'Cardano',
      dot: 'Polkadot',
      matic: 'Polygon',
      avax: 'Avalanche',
      trx: 'TRON',
      bnb: 'BNB',
      zec: 'Zcash',
    }
    return names[id.toLowerCase()] || id.toUpperCase()
  }

  /**
   * Check if currency is in popular list
   */
  private isPopularCurrency(id: string): boolean {
    const popular = ['btc', 'eth', 'xmr', 'usdt', 'usdc', 'sol', 'doge', 'ltc']
    return popular.includes(id.toLowerCase())
  }
}

// Export singleton instance
export const nowPayments = new NOWPaymentsClient(API_KEY, NOWPAYMENTS_API_URL)

// Featured currencies for UI
export const FEATURED_CURRENCIES = [
  { id: 'xmr', name: 'Monero', badge: 'Privacy First' },
  { id: 'btc', name: 'Bitcoin', badge: 'Most Popular' },
  { id: 'eth', name: 'Ethereum', badge: 'Smart Contracts' },
  { id: 'usdt', name: 'Tether', badge: 'Stablecoin' },
  { id: 'sol', name: 'Solana', badge: 'Fast & Cheap' },
  { id: 'doge', name: 'Dogecoin', badge: 'Community' },
]

// Helper: Format crypto amount
export function formatCryptoAmount(amount: number, currency: string): string {
  const decimals = ['btc', 'eth', 'xmr'].includes(currency.toLowerCase()) ? 8 : 6
  return amount.toFixed(decimals)
}

// Helper: Get QR code URL
export function getQRCodeURL(address: string, amount: number, currency: string): string {
  const data = `${currency.toLowerCase()}:${address}?amount=${amount}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data)}`
}
