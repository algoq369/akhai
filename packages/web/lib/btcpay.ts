/**
 * BTCPay Server API Client
 *
 * Self-hosted, non-custodial cryptocurrency payment processor
 * Supports: BTC, Lightning Network, Monero, Litecoin
 *
 * Documentation: https://docs.btcpayserver.org/API/Greenfield/v1/
 */

// API Configuration
const BTCPAY_SERVER_URL = process.env.BTCPAY_SERVER_URL || 'http://localhost:14142'
const BTCPAY_API_KEY = process.env.BTCPAY_API_KEY || ''
const BTCPAY_STORE_ID = process.env.BTCPAY_STORE_ID || ''
const BTCPAY_WEBHOOK_SECRET = process.env.BTCPAY_WEBHOOK_SECRET || ''

// TypeScript Interfaces
export interface CreateInvoiceParams {
  amount: number
  currency: string // 'USD', 'EUR', etc.
  orderId: string
  description: string
  buyerEmail?: string
  redirectURL?: string
  posData?: string // JSON string with custom data (userId, productType, etc.)
}

export interface BTCPayInvoice {
  id: string
  storeId: string
  amount: string
  currency: string
  status: InvoiceStatus
  checkoutLink: string
  createdTime: number
  expirationTime: number
  monitoringExpiration: number
  paymentMethods: PaymentMethod[]
  metadata: {
    orderId: string
    itemDesc: string
    posData?: string // JSON string with custom data (userId, productType, etc.)
    buyerEmail?: string
  }
}

export interface PaymentMethod {
  cryptoCode: string // 'BTC', 'LTC', 'XMR'
  destination: string // Payment address
  paymentLink: string
  rate: number
  due: string
  totalDue: string
  networkFee: string
  amount: string
}

export type InvoiceStatus =
  | 'New'
  | 'Processing'
  | 'Expired'
  | 'Invalid'
  | 'Settled'
  | 'Refunded'

export interface WebhookPayload {
  deliveryId: string
  webhookId: string
  originalDeliveryId: string
  isRedelivery: boolean
  type: string // 'InvoiceSettled', 'InvoiceExpired', etc.
  timestamp: number
  storeId: string
  invoiceId: string
  overPaid?: boolean
}

// API Client Class
class BTCPayClient {
  private baseUrl: string
  private apiKey: string
  private storeId: string

  constructor(baseUrl: string, apiKey: string, storeId: string) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
    this.storeId = storeId
  }

  /**
   * Make authenticated request to BTCPay Server API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `token ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(
        `BTCPay Server API Error: ${response.status} - ${JSON.stringify(error)}`
      )
    }

    return response.json()
  }

  /**
   * Create a new invoice
   */
  async createInvoice(params: CreateInvoiceParams): Promise<BTCPayInvoice> {
    return this.request<BTCPayInvoice>(
      `/api/v1/stores/${this.storeId}/invoices`,
      {
        method: 'POST',
        body: JSON.stringify({
          amount: params.amount.toString(),
          currency: params.currency,
          metadata: {
            orderId: params.orderId,
            itemDesc: params.description,
            buyerEmail: params.buyerEmail,
            posData: params.posData, // Custom data for webhook processing (userId, productType, etc.)
          },
          checkout: {
            speedPolicy: 'HighSpeed', // 0 confirmations for small amounts
            paymentMethods: ['BTC', 'BTC-LightningNetwork', 'XMR'],
            expirationMinutes: 15,
            monitoringMinutes: 60,
            paymentTolerance: 0,
            redirectURL: params.redirectURL || `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
            redirectAutomatically: false,
            requiresRefundEmail: false,
          },
        }),
      }
    )
  }

  /**
   * Get invoice status
   */
  async getInvoice(invoiceId: string): Promise<BTCPayInvoice> {
    return this.request<BTCPayInvoice>(
      `/api/v1/stores/${this.storeId}/invoices/${invoiceId}`
    )
  }

  /**
   * Get payment methods for an invoice
   */
  async getPaymentMethods(invoiceId: string): Promise<PaymentMethod[]> {
    const invoice = await this.getInvoice(invoiceId)
    return invoice.paymentMethods
  }

  /**
   * Verify webhook signature
   */
  verifyWebhook(signature: string, payload: string): boolean {
    if (!BTCPAY_WEBHOOK_SECRET) {
      console.warn('[BTCPay] Webhook secret not configured')
      return true // Allow in development
    }

    const crypto = require('crypto')
    const hmac = crypto
      .createHmac('sha256', BTCPAY_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex')

    return hmac === signature
  }

  /**
   * Get supported cryptocurrencies
   */
  getSupportedCurrencies(): string[] {
    return ['BTC', 'Lightning', 'XMR', 'LTC']
  }
}

// Export singleton instance
export const btcPay = new BTCPayClient(
  BTCPAY_SERVER_URL,
  BTCPAY_API_KEY,
  BTCPAY_STORE_ID
)

// Featured payment methods for UI
export const BTCPAY_FEATURED = [
  {
    id: 'btc',
    name: 'Bitcoin',
    badge: 'Sovereign',
    description: 'Direct to your wallet'
  },
  {
    id: 'lightning',
    name: 'Lightning',
    badge: 'Instant',
    description: 'Sub-second settlement'
  },
  {
    id: 'xmr',
    name: 'Monero',
    badge: 'Private',
    description: 'Untraceable transactions'
  },
]

// Helper: Get QR code for payment
export function getBTCPayQRCode(paymentLink: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(paymentLink)}`
}

// Helper: Format crypto amount
export function formatBTCPayAmount(amount: string, cryptoCode: string): string {
  const decimals = cryptoCode === 'BTC' ? 8 : 6
  return parseFloat(amount).toFixed(decimals)
}

// Helper: Check if BTCPay is configured
export function isBTCPayConfigured(): boolean {
  return !!(BTCPAY_API_KEY && BTCPAY_STORE_ID)
}
