'use client'

import { useState, useEffect } from 'react'

interface NewsItem {
  category: string
  source: string
  headline: string
  url: string
  age?: string
}

const FALLBACK_NEWS: NewsItem[] = [
  { category: 'ai', source: 'akhai', headline: 'Sovereign intelligence engine active', url: '/' },
  { category: 'crypto', source: 'akhai', headline: 'Multi-chain analysis ready', url: '/' },
  { category: 'tech', source: 'akhai', headline: 'Grounding guard protecting against hallucination', url: '/' },
]

const REFRESH_INTERVAL = 5 * 60 * 1000 // 5 minutes

export default function NewsNotification() {
  const [items, setItems] = useState<NewsItem[]>([])
  const [paused, setPaused] = useState(false)

  const fetchNews = async () => {
    try {
      const res = await fetch('/api/news')
      const data = await res.json()
      if (data.items?.length) {
        setItems(data.items)
      } else {
        setItems(FALLBACK_NEWS)
      }
    } catch {
      setItems(FALLBACK_NEWS)
    }
  }

  useEffect(() => {
    fetchNews()
    const interval = setInterval(fetchNews, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [])

  if (!items.length) return null

  // Double items for seamless infinite scroll
  const tickerContent = [...items, ...items]
  const duration = items.length * 5

  return (
    <div
      className="fixed top-0 left-0 right-0 z-30 overflow-hidden bg-white/60 dark:bg-relic-void/60 backdrop-blur-sm border-b border-relic-mist/20 dark:border-relic-slate/10"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="flex whitespace-nowrap"
        style={{
          animation: `ticker-scroll ${duration}s linear infinite`,
          animationPlayState: paused ? 'paused' : 'running',
        }}
      >
        {tickerContent.map((item, i) => (
          <a
            key={`${item.headline}-${i}`}
            href={item.url}
            target={item.url === '/' ? undefined : '_blank'}
            rel={item.url === '/' ? undefined : 'noopener noreferrer'}
            className="inline-flex items-center gap-1.5 px-4 py-1 text-[9px] font-mono text-relic-silver dark:text-relic-ghost/70 hover:text-relic-slate dark:hover:text-white transition-colors shrink-0"
          >
            <span className="text-relic-silver/60 dark:text-relic-ghost/40">{item.category}</span>
            <span className="text-relic-mist dark:text-relic-slate/40">·</span>
            <span className="text-relic-silver/80 dark:text-relic-ghost/50">{item.source}</span>
            <span className="text-relic-mist dark:text-relic-slate/40">·</span>
            <span>{item.headline}</span>
          </a>
        ))}
      </div>

      <style jsx>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
