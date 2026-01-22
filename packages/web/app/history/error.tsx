'use client'

import { useEffect } from 'react'
import { DocumentTextIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

export default function HistoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[History Page Error]:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 mb-6 rounded-full bg-red-50 flex items-center justify-center">
          <DocumentTextIcon className="w-8 h-8 text-red-400" />
        </div>

        {/* Title */}
        <h1 className="text-lg font-medium text-slate-700 mb-2">
          Failed to load history
        </h1>

        {/* Description */}
        <p className="text-sm text-slate-500 mb-6">
          Something went wrong while loading your conversation history. This might be a temporary issue.
        </p>

        {/* Error details (dev mode) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-slate-100 rounded-lg text-left">
            <p className="text-xs font-mono text-slate-600 break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-[10px] font-mono text-slate-400 mt-2">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white text-sm rounded-md hover:bg-slate-800 transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Try again
          </button>
          <a
            href="/"
            className="px-4 py-2 bg-slate-100 text-slate-700 text-sm rounded-md hover:bg-slate-200 transition-colors"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  )
}
