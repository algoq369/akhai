'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
    <div className="min-h-screen bg-relic-white matrix-grid flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-6 h-6 border border-relic-mist border-t-relic-slate rounded-full animate-spin" />
        <p className="text-xs text-relic-silver mt-5">redirecting to home...</p>
      </div>
    </div>
  )
}
