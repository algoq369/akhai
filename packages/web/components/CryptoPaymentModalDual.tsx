'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, ClipboardDocumentIcon, ClipboardDocumentCheckIcon, ShieldCheckIcon, BoltIcon } from '@heroicons/react/24/outline'
import { FEATURED_CURRENCIES, formatCryptoAmount } from '@/lib/nowpayments'
import { BTCPAY_FEATURED } from '@/lib/btcpay'

interface CryptoPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  amount: number
  productType: 'subscription' | 'credits'
  planId?: string
  creditAmount?: number
  onSuccess?: () => void
}

interface PaymentDetails {
  provider: 'nowpayments' | 'btcpay'
  paymentId: string
  payAddress: string
  payAmount: number
  payCurrency: string
  qrCodeUrl: string
  status: string
  expiresAt: string
}

type PaymentState = 'provider-select' | 'currency-select' | 'pending' | 'confirming' | 'success' | 'failed' | 'expired'
type PaymentProvider = 'nowpayments' | 'btcpay' | null

export default function CryptoPaymentModalDual({
  isOpen,
  onClose,
  amount,
  productType,
  planId,
  creditAmount,
  onSuccess,
}: CryptoPaymentModalProps) {
  const [provider, setProvider] = useState<PaymentProvider>(null)
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null)
  const [paymentState, setPaymentState] = useState<PaymentState>('provider-select')
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  // Poll payment status
  useEffect(() => {
    if (!paymentDetails || paymentState === 'success' || paymentState === 'failed') {
      return
    }

    const pollInterval = setInterval(async () => {
      try {
        if (paymentDetails.provider === 'nowpayments') {
          const response = await fetch(`/api/crypto-checkout?paymentId=${paymentDetails.paymentId}`)
          const data = await response.json()

          if (data.status === 'finished') {
            setPaymentState('success')
            clearInterval(pollInterval)
            onSuccess?.()
          } else if (data.status === 'failed' || data.status === 'expired') {
            setPaymentState(data.status === 'expired' ? 'expired' : 'failed')
            clearInterval(pollInterval)
          } else if (['confirming', 'confirmed', 'sending'].includes(data.status)) {
            setPaymentState('confirming')
          }
        } else if (paymentDetails.provider === 'btcpay') {
          const response = await fetch(`/api/btcpay-checkout?invoiceId=${paymentDetails.paymentId}`)
          const data = await response.json()

          if (data.status === 'Settled') {
            setPaymentState('success')
            clearInterval(pollInterval)
            onSuccess?.()
          } else if (data.status === 'Expired' || data.status === 'Invalid') {
            setPaymentState('expired')
            clearInterval(pollInterval)
          } else if (data.status === 'Processing') {
            setPaymentState('confirming')
          }
        }
      } catch (err) {
        console.error('Error polling payment status:', err)
      }
    }, 10000) // Poll every 10 seconds

    return () => clearInterval(pollInterval)
  }, [paymentDetails, paymentState, onSuccess])

  // Countdown timer
  useEffect(() => {
    if (!paymentDetails?.expiresAt) return

    const updateTimer = () => {
      const expiresAt = new Date(paymentDetails.expiresAt).getTime()
      const now = Date.now()
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000))

      setTimeRemaining(remaining)

      if (remaining === 0) {
        setPaymentState('expired')
      }
    }

    updateTimer()
    const timerInterval = setInterval(updateTimer, 1000)

    return () => clearInterval(timerInterval)
  }, [paymentDetails])

  // Create payment
  const handleCreatePayment = async (currency: string, selectedProvider: PaymentProvider) => {
    setLoading(true)
    setError(null)

    try {
      const endpoint = selectedProvider === 'btcpay' ? '/api/btcpay-checkout' : '/api/crypto-checkout'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency,
          productType,
          planId,
          creditAmount,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle minimum amount error
        if (data.details?.includes('AMOUNT_MINIMAL_ERROR') || data.details?.includes('minimal')) {
          const minAmounts: Record<string, string> = {
            btc: '$25',
            eth: '$20',
            xmr: '$15',
            usdt: '$10',
            usdc: '$10',
            sol: '$5',
            doge: '$10',
          }
          const minAmount = minAmounts[currency.toLowerCase()] || '$15'
          throw new Error(`Minimum payment: ${minAmount} for ${currency.toUpperCase()}. Try USDT (min $10) or increase amount.`)
        }
        throw new Error(data.error || data.details || 'Failed to create payment')
      }

      if (selectedProvider === 'btcpay') {
        // BTCPay returns multiple payment methods
        const btcMethod = data.paymentMethods.find((pm: any) => pm.cryptoCode === 'BTC') || data.paymentMethods[0]

        setPaymentDetails({
          provider: 'btcpay',
          paymentId: data.invoiceId,
          payAddress: btcMethod.address,
          payAmount: parseFloat(btcMethod.amount),
          payCurrency: btcMethod.cryptoCode,
          qrCodeUrl: btcMethod.qrCodeUrl,
          status: data.status,
          expiresAt: data.expiresAt,
        })
      } else {
        // NOWPayments
        setPaymentDetails({
          provider: 'nowpayments',
          paymentId: data.paymentId,
          payAddress: data.payAddress,
          payAmount: data.payAmount,
          payCurrency: data.payCurrency,
          qrCodeUrl: data.qrCodeUrl,
          status: data.status,
          expiresAt: data.expiresAt,
        })
      }

      setPaymentState('pending')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // Copy address to clipboard
  const handleCopyAddress = () => {
    if (paymentDetails) {
      navigator.clipboard.writeText(paymentDetails.payAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Format time remaining
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Reset modal state
  const handleClose = () => {
    setProvider(null)
    setSelectedCurrency(null)
    setPaymentState('provider-select')
    setPaymentDetails(null)
    setError(null)
    setCopied(false)
    setTimeRemaining(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/95 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white border border-relic-slate/20 rounded-sm max-w-md w-full shadow-lg"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-relic-slate/10">
            <h2 className="text-sm font-mono text-relic-void uppercase tracking-wider">
              {paymentState === 'success' ? 'Payment Complete' : 'Pay with Crypto'}
            </h2>
            <button
              onClick={handleClose}
              className="text-relic-slate hover:text-relic-void transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Provider Selection */}
            {paymentState === 'provider-select' && (
              <div className="space-y-3">
                <p className="text-xs text-relic-slate mb-4 text-center">
                  Select payment method for <span className="text-relic-void font-mono">${amount}</span>
                </p>

                {/* Sovereign Mode - BTCPay */}
                <button
                  onClick={() => {
                    setProvider('btcpay')
                    setPaymentState('currency-select')
                  }}
                  className="w-full p-4 bg-relic-ghost border border-relic-slate/20 rounded-sm hover:border-relic-slate/40 hover:bg-relic-slate/5 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-sm bg-relic-slate/10 flex items-center justify-center flex-shrink-0">
                      <ShieldCheckIcon className="w-4 h-4 text-relic-slate" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xs font-mono text-relic-void uppercase tracking-wider">
                          Sovereign Mode
                        </h3>
                        <span className="text-[8px] px-1 py-0.5 bg-relic-slate/10 text-relic-slate rounded uppercase tracking-wider">
                          BTCPay
                        </span>
                      </div>
                      <p className="text-[10px] text-relic-slate mb-2">
                        Direct to wallet • Non-custodial • 0% fees
                      </p>
                      <div className="flex gap-1.5 flex-wrap">
                        {BTCPAY_FEATURED.map((curr) => (
                          <div key={curr.id} className="text-[9px] px-1.5 py-0.5 bg-white text-relic-slate rounded border border-relic-slate/20">
                            {curr.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Convenient Mode - NOWPayments */}
                <button
                  onClick={() => {
                    setProvider('nowpayments')
                    setPaymentState('currency-select')
                  }}
                  className="w-full p-4 bg-relic-ghost border border-relic-slate/20 rounded-sm hover:border-relic-slate/40 hover:bg-relic-slate/5 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-sm bg-relic-slate/10 flex items-center justify-center flex-shrink-0">
                      <BoltIcon className="w-4 h-4 text-relic-slate" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xs font-mono text-relic-void uppercase tracking-wider">
                          Convenient Mode
                        </h3>
                        <span className="text-[8px] px-1 py-0.5 bg-relic-slate/10 text-relic-slate rounded uppercase tracking-wider">
                          300+ Coins
                        </span>
                      </div>
                      <p className="text-[10px] text-relic-slate mb-2">
                        Fast processing • Wide selection • 0.5% fee
                      </p>
                      <div className="flex gap-1.5 flex-wrap">
                        {FEATURED_CURRENCIES.slice(0, 4).map((curr) => (
                          <div key={curr.id} className="text-[9px] px-1.5 py-0.5 bg-white text-relic-slate rounded border border-relic-slate/20">
                            {curr.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>

                <p className="text-[9px] text-relic-slate/60 text-center mt-4">
                  Sovereignty vs convenience
                </p>
              </div>
            )}

            {/* Currency Selection */}
            {paymentState === 'currency-select' && provider && (
              <div className="space-y-3">
                <button
                  onClick={() => setPaymentState('provider-select')}
                  className="text-[10px] text-relic-slate hover:text-relic-void mb-2"
                >
                  ← Back
                </button>

                <p className="text-xs text-relic-slate mb-3">
                  Select cryptocurrency to pay <span className="text-relic-void font-mono">${amount}</span>
                </p>

                <div className="grid grid-cols-3 gap-2">
                  {(provider === 'btcpay' ? BTCPAY_FEATURED : FEATURED_CURRENCIES).map((curr) => (
                    <button
                      key={curr.id}
                      onClick={() => {
                        setSelectedCurrency(curr.id)
                        handleCreatePayment(curr.id, provider)
                      }}
                      disabled={loading}
                      className="p-3 bg-relic-ghost border border-relic-slate/20 rounded-sm hover:border-relic-slate/40 hover:bg-relic-slate/5 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <div className="text-[10px] font-mono text-relic-void uppercase">{curr.name}</div>
                        {curr.badge && (
                          <span className="text-[8px] text-relic-slate/60 uppercase tracking-wider">
                            {curr.badge}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {error && (
                  <div className="mt-3 p-2 bg-relic-ghost border border-relic-slate/20 rounded-sm text-[10px] text-relic-slate">
                    {error}
                  </div>
                )}
              </div>
            )}

            {/* Payment Pending/Confirming */}
            {(paymentState === 'pending' || paymentState === 'confirming') && paymentDetails && (
              <div className="space-y-4">
                {/* Timer */}
                {timeRemaining !== null && (
                  <div className="text-center">
                    <div className="text-[10px] text-relic-slate mb-1">Time remaining</div>
                    <div className="text-2xl font-mono text-relic-void">{formatTime(timeRemaining)}</div>
                  </div>
                )}

                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="p-3 bg-relic-ghost border border-relic-slate/20 rounded-sm">
                    <img
                      src={paymentDetails.qrCodeUrl}
                      alt="Payment QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                </div>

                {/* Amount */}
                <div className="text-center">
                  <div className="text-[10px] text-relic-slate mb-1">Send exactly</div>
                  <div className="text-lg font-mono text-relic-void">
                    {formatCryptoAmount(paymentDetails.payAmount, paymentDetails.payCurrency)} {paymentDetails.payCurrency.toUpperCase()}
                  </div>
                </div>

                {/* Address */}
                <div>
                  <div className="text-[10px] text-relic-slate mb-1.5">Payment Address</div>
                  <div className="flex items-center gap-2 p-2 bg-relic-ghost border border-relic-slate/20 rounded-sm">
                    <code className="flex-1 text-[10px] text-relic-void break-all font-mono">
                      {paymentDetails.payAddress}
                    </code>
                    <button
                      onClick={handleCopyAddress}
                      className="p-1.5 hover:bg-relic-slate/10 rounded-sm transition-colors flex-shrink-0"
                    >
                      {copied ? (
                        <ClipboardDocumentCheckIcon className="w-4 h-4 text-relic-slate" />
                      ) : (
                        <ClipboardDocumentIcon className="w-4 h-4 text-relic-slate" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Status */}
                <div className="text-center p-3 bg-relic-ghost border border-relic-slate/20 rounded-sm">
                  <div className="flex items-center justify-center gap-2 text-relic-slate">
                    <div className="w-1.5 h-1.5 bg-relic-slate rounded-full animate-pulse" />
                    <span className="text-[10px] font-mono">
                      {paymentState === 'confirming' ? 'Confirming...' : 'Waiting for payment...'}
                    </span>
                  </div>
                </div>

                {/* Provider badge */}
                <div className="text-center">
                  <span className="text-[9px] text-relic-slate/60">
                    {paymentDetails.provider === 'btcpay' ? 'BTCPay Server' : 'NOWPayments'}
                  </span>
                </div>
              </div>
            )}

            {/* Success */}
            {paymentState === 'success' && (
              <div className="text-center space-y-3 py-6">
                <div className="flex justify-center">
                  <CheckCircleIcon className="w-12 h-12 text-relic-slate" />
                </div>
                <h3 className="text-sm font-mono text-relic-void">Payment Successful</h3>
                <p className="text-[10px] text-relic-slate">
                  Confirmed and processed
                </p>
                <button
                  onClick={handleClose}
                  className="mt-4 px-4 py-1.5 bg-relic-void text-white rounded-sm font-mono text-[10px] uppercase tracking-wider hover:bg-relic-slate transition-colors"
                >
                  Close
                </button>
              </div>
            )}

            {/* Failed/Expired */}
            {(paymentState === 'failed' || paymentState === 'expired') && (
              <div className="text-center space-y-3 py-6">
                <div className="flex justify-center">
                  <ExclamationCircleIcon className="w-12 h-12 text-relic-slate" />
                </div>
                <h3 className="text-sm font-mono text-relic-void">
                  {paymentState === 'expired' ? 'Payment Expired' : 'Payment Failed'}
                </h3>
                <p className="text-[10px] text-relic-slate">
                  {paymentState === 'expired'
                    ? 'Payment window expired'
                    : 'Could not complete payment'}
                </p>
                <button
                  onClick={() => {
                    setPaymentState('provider-select')
                    setProvider(null)
                    setPaymentDetails(null)
                    setError(null)
                  }}
                  className="mt-4 px-4 py-1.5 bg-relic-void text-white rounded-sm font-mono text-[10px] uppercase tracking-wider hover:bg-relic-slate transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
