'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Force dynamic rendering to avoid prerender errors
export const dynamic = 'force-dynamic'

/**
 * /query route redirects to homepage
 * Individual query results are at /query/[id]
 */
export default function QueryPage() {
  const router = useRouter()

  useEffect(() => {
    router.push('/')
  }, [router])

  return (
    <div className="min-h-screen bg-relic-white dark:bg-relic-void matrix-grid flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-6 h-6 border border-relic-mist dark:border-relic-slate/30 border-t-relic-slate dark:border-t-white rounded-full animate-spin" />
        <p className="text-xs text-relic-silver dark:text-relic-ghost mt-5">redirecting to home...</p>
      </div>
    </div>
  )
}
