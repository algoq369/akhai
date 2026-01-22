'use client'

import { useState, useEffect } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'

interface NewsItem {
  id: string
  title: string
  category: 'AI' | 'AGI' | 'ASI' | 'CRYPTO' | 'TECH'
  source: string
  url: string
  timestamp: number
}

const INITIAL_NEWS: NewsItem[] = [
  { id: '1', title: 'Claude 4 Opus achieves new benchmarks', category: 'AI', source: 'Anthropic', url: 'https://anthropic.com', timestamp: Date.now() },
  { id: '2', title: 'Bitcoin whale moves 10K BTC', category: 'CRYPTO', source: 'Whale Alert', url: 'https://whale-alert.io', timestamp: Date.now() },
  { id: '3', title: 'OpenAI announces GPT-5 preview', category: 'AGI', source: 'TechCrunch', url: 'https://techcrunch.com', timestamp: Date.now() },
]

// Removed colored categories - using raw text only

const ONE_DAY_MS = 24 * 60 * 60 * 1000

export default function NewsNotification() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('akhai_news_history')
    const now = Date.now()
    
    if (stored) {
      try {
        const parsed: NewsItem[] = JSON.parse(stored)
        const filtered = parsed.filter(item => now - item.timestamp < ONE_DAY_MS)
        if (filtered.length > 0) {
          setNews(filtered)
          localStorage.setItem('akhai_news_history', JSON.stringify(filtered))
          return
        }
      } catch (e) {
        console.error('Failed to parse news history:', e)
      }
    }
    
    setNews(INITIAL_NEWS)
    localStorage.setItem('akhai_news_history', JSON.stringify(INITIAL_NEWS))
  }, [])

  useEffect(() => {
    if (news.length === 0 || isExpanded) return
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % news.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [news.length, isExpanded])

  const currentNews = news[currentIndex]
  if (news.length === 0 || !currentNews) return null

  // Minimalist raw text - top left corner
  return (
    <div className="fixed top-3 left-4 z-30">
      <div className="flex items-center gap-1">
        <a
          href={currentNews.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[8px] text-relic-silver hover:text-relic-slate flex items-center gap-1"
        >
          <span>{currentNews.category.toLowerCase()}</span>
          <span>·</span>
          <span>{currentNews.source}</span>
          <span>·</span>
          <span className="max-w-[120px] truncate">{currentNews.title}</span>
        </a>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-relic-silver hover:text-relic-slate ml-0.5"
        >
          {isExpanded ? <ChevronUpIcon className="w-2.5 h-2.5" /> : <ChevronDownIcon className="w-2.5 h-2.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="absolute left-0 mt-1 border-b border-relic-mist p-1 space-y-0.5 min-w-[220px]">
          {news.map((item, i) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1 font-mono text-[8px] px-1 py-0.5 ${
                i === currentIndex ? 'text-relic-slate' : 'text-relic-silver'
              } hover:text-relic-slate`}
            >
              <span>{item.category.toLowerCase()}</span>
              <span>·</span>
              <span>{item.source}</span>
              <span>·</span>
              <span className="truncate flex-1">{item.title}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
