'use client'

import { useState, useEffect, useRef } from 'react'

interface NewsItem {
  category: string
  source: string
  headline: string
  url: string
  age?: string
  description?: string
}

const FALLBACK_NEWS: NewsItem[] = [
  { category: 'ai', source: 'akhai', headline: 'Sovereign intelligence engine active', url: '/' },
  { category: 'crypto', source: 'akhai', headline: 'Multi-chain analysis ready', url: '/' },
  { category: 'tech', source: 'akhai', headline: 'Grounding guard protecting against hallucination', url: '/' },
]

const REFRESH_INTERVAL = 5 * 60 * 1000
const CAT_COLORS: Record<string, string> = {
  ai: '#6366f1', agi: '#a855f7', crypto: '#f59e0b', sovereign: '#10b981', tech: '#3b82f6', startups: '#ec4899',
}

export default function NewsNotification() {
  const [items, setItems] = useState<NewsItem[]>([])
  const [paused, setPaused] = useState(false)
  const [selected, setSelected] = useState<NewsItem | null>(null)
  const [insight, setInsight] = useState<string | null>(null)
  const [insightLoading, setInsightLoading] = useState(false)
  const insightCache = useRef<Record<string, string>>({})
  const panelRef = useRef<HTMLDivElement>(null)

  const fetchNews = async () => {
    try {
      const res = await fetch('/api/news')
      const data = await res.json()
      if (data.items?.length) setItems(data.items)
      else setItems(FALLBACK_NEWS)
    } catch { setItems(FALLBACK_NEWS) }
  }

  useEffect(() => {
    fetchNews()
    const interval = setInterval(fetchNews, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [])

  // Close panel on outside click
  useEffect(() => {
    if (!selected) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setSelected(null); setInsight(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [selected])

  const handleClick = async (item: NewsItem) => {
    if (item.url === '/') return
    setSelected(item)
    setPaused(true)
    setInsight(null)

    // Check cache first
    const cacheKey = item.headline.slice(0, 50)
    if (insightCache.current[cacheKey]) {
      setInsight(insightCache.current[cacheKey])
      return
    }

    // Fetch AI insight
    setInsightLoading(true)
    try {
      const res = await fetch('/api/quick-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `In 2 sentences (max 40 words), explain the significance of this news for AI/tech researchers: "${item.headline}" from ${item.source}. Be specific about implications.`,
        }),
      })
      const data = await res.json()
      const text = data.content || data.response || 'No insight available.'
      insightCache.current[cacheKey] = text
      setInsight(text)
    } catch {
      setInsight('Insight temporarily unavailable.')
    }
    setInsightLoading(false)
  }

  if (!items.length) return null

  const tickerContent = [...items, ...items]
  const duration = items.length * 5

  return (
    <div ref={panelRef} className="fixed top-0 left-0 right-0 z-50" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
      {/* Ticker bar */}
      <div
        className="overflow-hidden bg-white/80 dark:bg-[#0a0a0b]/80 backdrop-blur-sm border-b border-slate-200/30 dark:border-slate-800/30"
        onMouseEnter={() => !selected && setPaused(true)}
        onMouseLeave={() => !selected && setPaused(false)}
      >
        <div
          className="flex whitespace-nowrap"
          style={{
            animation: `ticker-scroll ${duration}s linear infinite`,
            animationPlayState: paused ? 'paused' : 'running',
          }}
        >
          {tickerContent.map((item, i) => (
            <button
              key={`${item.headline}-${i}`}
              onClick={(e) => { e.preventDefault(); handleClick(item) }}
              className="inline-flex items-center gap-1.5 px-4 py-1 text-[9px] hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors shrink-0 border-0 bg-transparent cursor-pointer"
            >
              <span style={{ color: CAT_COLORS[item.category] || '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: 7, letterSpacing: '0.05em' }}>{item.category}</span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span className="text-slate-400 dark:text-slate-500">{item.source}</span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span className="text-slate-600 dark:text-slate-400">{item.headline}</span>
              {item.age && <span className="text-slate-300 dark:text-slate-600 text-[7px]">{item.age}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Preview panel — slides down on click */}
      {selected && (
        <div className="bg-white dark:bg-[#111] border-b border-slate-200/50 dark:border-slate-800/30 shadow-lg animate-in slide-in-from-top duration-200">
          <div className="max-w-2xl mx-auto px-4 py-3">
            {/* Header row */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ color: CAT_COLORS[selected.category] || '#94a3b8', fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '1px 4px', borderRadius: 2, background: (CAT_COLORS[selected.category] || '#94a3b8') + '15' }}>{selected.category}</span>
                  <span style={{ fontSize: 8, color: '#94a3b8' }}>{selected.source}</span>
                  {selected.age && <span style={{ fontSize: 7, color: '#cbd5e1' }}>{selected.age}</span>}
                </div>
                <h3 style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', lineHeight: 1.3, margin: 0 }} className="dark:text-white">{selected.headline}</h3>
              </div>
              <button onClick={() => { setSelected(null); setInsight(null); setPaused(false) }} style={{ fontSize: 14, border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}>✕</button>
            </div>

            {/* AI Insight */}
            <div className="bg-slate-50 dark:bg-[#1a1a1b] rounded-md px-3 py-2 mb-2">
              {insightLoading ? (
                <div className="flex items-center gap-2" style={{ fontSize: 9, color: '#94a3b8' }}>
                  <div style={{ width: 10, height: 10, border: '1.5px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  generating insight...
                </div>
              ) : insight ? (
                <p style={{ fontSize: 10, color: '#475569', lineHeight: 1.5, margin: 0 }} className="dark:text-slate-400">{insight}</p>
              ) : (
                <p style={{ fontSize: 9, color: '#94a3b8', margin: 0 }}>click to generate AI insight</p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <a
                href={selected.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 9, padding: '3px 10px', borderRadius: 4, background: '#1e293b', color: 'white', textDecoration: 'none', fontWeight: 500 }}
              >
                read full article →
              </a>
              <button
                onClick={() => { setSelected(null); setInsight(null); setPaused(false) }}
                style={{ fontSize: 9, padding: '3px 10px', borderRadius: 4, border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer' }}
              >
                dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
