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
      const text = data.content || data.response || ''
      if (text && !text.includes('error') && !text.includes('Sorry')) {
        insightCache.current[cacheKey] = text
        setInsight(text)
      } else {
        // Fallback to description
        const fallback = item.description || `${item.category.toUpperCase()} news from ${item.source}. Click "read full article" for details.`
        insightCache.current[cacheKey] = fallback
        setInsight(fallback)
      }
    } catch {
      const fallback = item.description || 'Click "read full article" to learn more.'
      insightCache.current[cacheKey] = fallback
      setInsight(fallback)
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

      {/* Preview panel — compact single-line insight */}
      {selected && (
        <div className="bg-white/95 dark:bg-[#111]/95 backdrop-blur-sm border-b border-slate-200/40 dark:border-slate-700/30 shadow-md">
          <div className="max-w-4xl mx-auto px-3 py-1.5 flex items-center gap-3">
            <span style={{ color: CAT_COLORS[selected.category] || '#94a3b8', fontSize: 7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '1px 4px', borderRadius: 2, background: (CAT_COLORS[selected.category] || '#94a3b8') + '12', flexShrink: 0 }}>{selected.category}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 300 }} className="dark:text-white">{selected.headline}</span>
            <span style={{ fontSize: 9, color: '#64748b', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="dark:text-slate-400">
              {insightLoading ? '◌ loading...' : (insight || selected.description || '—')}
            </span>
            <a href={selected.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 8, padding: '2px 8px', borderRadius: 3, background: '#1e293b', color: 'white', textDecoration: 'none', fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }}>read →</a>
            <button onClick={() => { setSelected(null); setInsight(null); setPaused(false) }} style={{ fontSize: 12, border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, lineHeight: 1, flexShrink: 0 }}>✕</button>
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
