import { NextResponse } from 'next/server'

interface BraveNewsResult {
  title: string
  url: string
  description?: string
  age?: string
  meta_url?: {
    hostname?: string
    netloc?: string
  }
}

interface NewsItem {
  category: string
  source: string
  headline: string
  url: string
  age?: string
}

// Simple in-memory cache (5 min TTL)
let cache: { data: NewsItem[]; ts: number } | null = null
const CACHE_TTL = 5 * 60 * 1000

const QUERIES = ['AI artificial intelligence', 'crypto blockchain', 'technology startups']

function categorize(headline: string): string {
  const lower = headline.toLowerCase()
  if (lower.match(/crypto|bitcoin|btc|eth|blockchain|defi|token|nft/)) return 'crypto'
  if (lower.match(/ai\b|artificial|llm|gpt|claude|gemini|openai|anthropic|deepseek|model|neural/)) return 'ai'
  if (lower.match(/startup|funding|vc|raise|valuation|ipo/)) return 'startups'
  if (lower.match(/apple|google|meta|microsoft|amazon|nvidia/)) return 'tech'
  return 'tech'
}

function extractSource(result: BraveNewsResult): string {
  if (result.meta_url?.netloc) {
    return result.meta_url.netloc.replace(/^www\./, '').split('.')[0]
  }
  try {
    return new URL(result.url).hostname.replace(/^www\./, '').split('.')[0]
  } catch {
    return 'web'
  }
}

export async function GET() {
  // Return cached if fresh
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json({ items: cache.data })
  }

  const apiKey = process.env.BRAVE_SEARCH_API_KEY
  if (!apiKey) {
    // Return fallback items when no API key
    return NextResponse.json({
      items: [
        { category: 'ai', source: 'akhai', headline: 'Sovereign intelligence engine active', url: '/', age: 'now' },
        { category: 'crypto', source: 'akhai', headline: 'Multi-chain analysis ready', url: '/', age: 'now' },
        { category: 'tech', source: 'akhai', headline: 'Grounding guard protecting against hallucination', url: '/', age: 'now' },
      ],
      fallback: true,
    })
  }

  try {
    const allItems: NewsItem[] = []

    // Fetch from multiple queries in parallel
    const results = await Promise.allSettled(
      QUERIES.map(async (q) => {
        const res = await fetch(
          `https://api.search.brave.com/res/v1/news/search?q=${encodeURIComponent(q)}&count=5&freshness=pd`,
          {
            headers: {
              'Accept': 'application/json',
              'Accept-Encoding': 'gzip',
              'X-Subscription-Token': apiKey,
            },
          }
        )
        if (!res.ok) throw new Error(`Brave API ${res.status}`)
        return res.json()
      })
    )

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value?.results) {
        for (const r of result.value.results) {
          allItems.push({
            category: categorize(r.title || ''),
            source: extractSource(r),
            headline: (r.title || '').slice(0, 120),
            url: r.url,
            age: r.age || '',
          })
        }
      }
    }

    // Dedupe by headline, shuffle, limit
    const seen = new Set<string>()
    const unique = allItems.filter((item) => {
      const key = item.headline.toLowerCase().slice(0, 50)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    // Shuffle for variety
    for (let i = unique.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[unique[i], unique[j]] = [unique[j], unique[i]]
    }

    const items = unique.slice(0, 12)

    // Cache result
    cache = { data: items, ts: Date.now() }

    return NextResponse.json({ items })
  } catch (error) {
    console.error('News fetch error:', error)
    // Return stale cache if available
    if (cache) {
      return NextResponse.json({ items: cache.data, stale: true })
    }
    return NextResponse.json({ items: [], error: 'Failed to fetch news' }, { status: 500 })
  }
}
