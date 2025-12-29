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

const CATEGORY_COLORS: Record<NewsItem['category'], string> = {
  AI: 'text-violet-500',
  AGI: 'text-purple-500',
  ASI: 'text-fuchsia-500',
  CRYPTO: 'text-amber-500',
  TECH: 'text-blue-500',
}

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

  // Position: top left corner - Compact horizontal layout
  return (
    <div className="fixed top-3 left-4 z-30">
      <div className="flex items-center gap-1.5">
        <span className="w-1 h-1 bg-violet-500 rounded-full animate-pulse" />
        <a
          href={currentNews.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[8px] hover:underline group flex items-center gap-1"
        >
          <span className={`font-medium ${CATEGORY_COLORS[currentNews.category]}`}>
            {currentNews.category}
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-400">{currentNews.source}</span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-500 group-hover:text-slate-700 max-w-[120px] truncate">{currentNews.title}</span>
        </a>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-slate-400 hover:text-slate-600 ml-0.5"
        >
          {isExpanded ? <ChevronUpIcon className="w-2.5 h-2.5" /> : <ChevronDownIcon className="w-2.5 h-2.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="absolute left-0 mt-1.5 bg-white border border-slate-100 rounded-lg shadow-lg p-1.5 space-y-0.5 min-w-[220px]">
          {news.map((item, i) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1.5 text-[8px] px-1.5 py-0.5 rounded hover:bg-slate-50 ${
                i === currentIndex ? 'bg-slate-50' : ''
              }`}
            >
              <span className={`font-medium ${CATEGORY_COLORS[item.category]}`}>{item.category}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500">{item.source}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600 truncate flex-1">{item.title}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
