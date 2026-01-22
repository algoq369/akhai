'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-relic-white dark:bg-relic-void">
      <div className="text-center">
        <h1 className="text-6xl font-light text-relic-slate dark:text-white mb-4">404</h1>
        <h2 className="text-xl font-mono text-relic-silver dark:text-relic-ghost mb-8">Page not found</h2>
        <Link
          href="/"
          className="px-6 py-3 text-sm font-mono text-relic-slate dark:text-relic-ghost border border-relic-mist dark:border-relic-slate/30 hover:bg-relic-ghost dark:hover:bg-relic-slate/20 transition-colors"
        >
          ← Return Home
        </Link>
      </div>
    </div>
  )
}
