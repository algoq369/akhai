'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams?.get('session_id')
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          window.location.href = '/'
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-relic-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto bg-green-50 border border-green-200 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-2xl font-medium text-relic-void mb-2">
          Payment Successful
        </h1>
        <p className="text-sm text-relic-slate mb-6">
          Your subscription is now active. Welcome to sovereign intelligence.
        </p>

        {/* Session ID */}
        {sessionId && (
          <div className="bg-relic-ghost/30 border border-relic-mist/20 rounded-sm p-3 mb-6">
            <p className="text-[10px] font-mono text-relic-silver uppercase tracking-wider mb-1">
              Transaction ID
            </p>
            <p className="text-xs font-mono text-relic-slate break-all">
              {sessionId}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full py-2.5 px-4 bg-relic-void text-relic-white rounded-sm text-sm font-mono uppercase tracking-wider hover:bg-relic-slate transition-colors"
          >
            Start Exploring
          </Link>

          <p className="text-xs text-relic-silver">
            Redirecting in {countdown} seconds...
          </p>
        </div>

        {/* Next Steps */}
        <div className="mt-8 pt-6 border-t border-relic-mist/20">
          <p className="text-xs font-mono uppercase tracking-wider text-relic-void mb-3">
            What's Next?
          </p>
          <ul className="text-left space-y-2 text-xs text-relic-slate">
            <li className="flex items-start gap-2">
              <span className="text-relic-silver">•</span>
              <span>Access all 7 reasoning methodologies</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-relic-silver">•</span>
              <span>Grounding Guard enabled for zero hallucinations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-relic-silver">•</span>
              <span>Side Canal context awareness active</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-relic-silver">•</span>
              <span>Mind Map visualization unlocked</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function PricingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-relic-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-pulse text-relic-slate">Loading...</div>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
