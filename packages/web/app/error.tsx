'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error boundary:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-relic-white">
      <h2 className="text-xl font-semibold text-relic-obsidian mb-4">Something went wrong!</h2>
      <button 
        onClick={() => reset()}
        className="px-4 py-2 bg-relic-slate text-relic-white rounded hover:bg-relic-silver transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
