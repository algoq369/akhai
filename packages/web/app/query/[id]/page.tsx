'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function QueryResultsPage() {
  const params = useParams()
  const queryId = params.id as string
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (queryId) {
      fetchResult()
      // Poll for updates if status is processing
      const interval = setInterval(() => {
        if (result?.status === 'processing' || result?.status === 'pending') {
          fetchResult()
        }
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [queryId, result?.status])

  const fetchResult = async () => {
    try {
      setError(null)

      console.log('[Query Page] Fetching query:', queryId)
      const res = await fetch(`/api/query/${queryId}`)

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Query not found')
        }
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to fetch query')
      }

      const data = await res.json()
      console.log('[Query Page] Query result:', data)
      setResult(data)
      setLoading(false)
    } catch (e) {
      console.error('[Query Page] Fetch error:', e)
      setError(e instanceof Error ? e.message : 'Failed to load query')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-relic-white matrix-grid">
      <header className="border-b border-relic-mist/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="text-[10px] uppercase tracking-[0.3em] text-relic-silver hover:text-relic-slate transition-colors">
              ← akhai
            </a>
            <span className="text-[10px] text-relic-silver font-mono">{queryId}</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-6 h-6 border border-relic-mist border-t-relic-slate rounded-full animate-spin" />
            <p className="text-xs text-relic-silver mt-5">loading query...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="mb-6">
              <span className="text-4xl text-relic-mist">◊</span>
            </div>
            <p className="text-relic-slate mb-2 font-medium">Error</p>
            <p className="text-relic-silver text-sm mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={fetchResult} className="relic-button text-xs">
                retry
              </button>
              <a href="/" className="relic-button text-xs">
                ← home
              </a>
            </div>
          </div>
        ) : result ? (
          <div className="space-y-8 animate-fade-in">
            {/* Status Indicator */}
            {result.status && result.status !== 'complete' && (
              <div className="p-4 bg-relic-ghost/30 border border-relic-mist">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-relic-void animate-pulse" />
                  <span className="text-xs uppercase tracking-widest text-relic-slate">
                    {result.status === 'processing' ? 'Processing...' : result.status}
                  </span>
                </div>
              </div>
            )}

            {/* Query */}
            {result.query && (
              <div>
                <span className="text-[10px] uppercase tracking-widest text-relic-silver">query</span>
                <p className="text-relic-void mt-2 leading-relaxed">{result.query}</p>
              </div>
            )}

            {/* Methodology */}
            {result.methodology && (
              <div>
                <span className="text-[10px] uppercase tracking-widest text-relic-silver">methodology</span>
                <p className="text-relic-slate mt-2 text-sm">{result.methodology}</p>
              </div>
            )}

            {/* Response */}
            {(result.response || result.finalDecision) && (
              <div>
                <span className="text-[10px] uppercase tracking-widest text-relic-silver">response</span>
                <div className="mt-3 p-5 bg-relic-ghost/30 border-l border-relic-slate">
                  <p className="text-relic-void leading-relaxed whitespace-pre-wrap text-sm">
                    {result.response || result.finalDecision}
                  </p>
                </div>
              </div>
            )}

            {/* Error */}
            {result.error && (
              <div>
                <span className="text-[10px] uppercase tracking-widest text-red-600">error</span>
                <div className="mt-3 p-4 bg-red-50 border-l-2 border-red-600">
                  <p className="text-red-800 text-sm">{result.error}</p>
                </div>
              </div>
            )}

            {/* Metrics */}
            {result.metrics && (
              <div>
                <span className="text-[10px] uppercase tracking-widest text-relic-silver">metrics</span>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  <div className="p-3 bg-relic-ghost/20 border border-relic-mist/50">
                    <span className="text-[9px] text-relic-silver uppercase">tokens</span>
                    <p className="text-relic-slate text-sm mt-1">
                      {result.metrics.tokens !== undefined ? (
                        result.metrics.tokens === 0 ? (
                          <span className="text-green-600">0 (free)</span>
                        ) : (
                          result.metrics.tokens
                        )
                      ) : '—'}
                    </p>
                  </div>
                  <div className="p-3 bg-relic-ghost/20 border border-relic-mist/50">
                    <span className="text-[9px] text-relic-silver uppercase">latency</span>
                    <p className="text-relic-slate text-sm mt-1">
                      {result.metrics.latency !== undefined && result.metrics.latency > 0
                        ? `${(result.metrics.latency / 1000).toFixed(2)}s`
                        : '—'}
                    </p>
                  </div>
                  <div className="p-3 bg-relic-ghost/20 border border-relic-mist/50">
                    <span className="text-[9px] text-relic-silver uppercase">cost</span>
                    <p className="text-relic-slate text-sm mt-1">
                      {result.metrics.cost !== undefined ? (
                        result.metrics.cost === 0 ? (
                          <span className="text-green-600">$0.00 (free)</span>
                        ) : (
                          `$${result.metrics.cost.toFixed(4)}`
                        )
                      ) : '—'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Events (development only) */}
            {process.env.NODE_ENV === 'development' && result.events && result.events.length > 0 && (
              <details className="mt-8">
                <summary className="text-[10px] uppercase tracking-widest text-relic-silver cursor-pointer hover:text-relic-slate">
                  events ({result.events.length}) — dev only
                </summary>
                <div className="mt-3 space-y-2">
                  {result.events.map((event: any, i: number) => (
                    <div key={i} className="p-2 bg-relic-ghost/20 border-l-2 border-relic-mist text-xs">
                      <span className="text-relic-slate font-mono">{event.type}</span>
                      {event.data && (
                        <pre className="mt-1 text-relic-silver text-[10px] overflow-auto">
                          {JSON.stringify(event.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            )}

            {/* Actions */}
            <div className="pt-4 flex gap-3">
              <a href="/" className="relic-button text-xs">
                ← new query
              </a>
              <a 
                href={`/?continue=${queryId}`} 
                className="relic-button-primary text-xs"
              >
                continue chat →
              </a>
              {result.status === 'processing' && (
                <button onClick={fetchResult} className="relic-button text-xs">
                  refresh
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="mb-6">
              <span className="text-4xl text-relic-mist">◊</span>
            </div>
            <p className="text-relic-silver text-sm">No data available</p>
            <a href="/" className="relic-button mt-4 inline-block text-xs">
              ← back
            </a>
          </div>
        )}
      </main>
    </div>
  )
}
