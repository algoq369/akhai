'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface QueryHistoryItem {
  id: string
  query: string
  flow: string
  status: string
  created_at: number
  tokens_used: number
  cost: number
}

export default function HistoryPage() {
  const router = useRouter()
  const [queries, setQueries] = useState<QueryHistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/history')
      .then(res => res.json())
      .then(data => {
        setQueries(data.queries || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp * 1000)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-relic-white matrix-grid">
      <header className="border-b border-relic-mist/50">
        <div className="relic-container py-5">
          <a href="/" className="text-[10px] uppercase tracking-[0.3em] text-relic-silver hover:text-relic-slate">← akhai</a>
        </div>
      </header>

      <main className="relic-container py-10">
        <h1 className="text-xl font-light text-relic-void mb-8">history</h1>

        {loading ? (
          <p className="text-relic-silver text-xs">loading...</p>
        ) : queries.length === 0 ? (
          <p className="text-relic-silver text-xs">no queries yet</p>
        ) : (
          <div className="space-y-4">
            {queries.map((q) => (
              <button
                key={q.id}
                onClick={() => router.push(`/?continue=${q.id}`)}
                className="w-full text-left p-4 bg-relic-ghost/30 border border-relic-mist hover:border-relic-silver transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-relic-void font-mono text-sm flex-1 mr-4">
                    {q.query}
                  </p>
                  <span className="relic-label shrink-0">{q.flow}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-relic-silver">
                  <span>{formatDate(q.created_at)}</span>
                  <span>·</span>
                  <span>{q.tokens_used?.toLocaleString() || '0'} tok</span>
                  <span>·</span>
                  <span>${q.cost?.toFixed(4) || '0.00'}</span>
                  <span>·</span>
                  <span className={`
                    ${q.status === 'complete' ? 'text-green-600' : ''}
                    ${q.status === 'processing' ? 'text-relic-silver' : ''}
                    ${q.status === 'error' ? 'text-red-600' : ''}
                  `}>
                    {q.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
