import { NextResponse } from 'next/server'

// ── Types ─────────────────────────────────────────────────────────────────────

interface PriceItem {
  symbol: string
  price: number
  change: number
  category: string
  unit?: string
  name?: string
}

interface FinanceResponse {
  prices: PriceItem[]
  sentiment: { fng: number; label: string } | null
  etf: { flow: string; source: string } | null
  updatedAt: number
}

// ── Cache ─────────────────────────────────────────────────────────────────────

let priceCache: { data: FinanceResponse; ts: number } | null = null
const PRICE_CACHE_TTL = 2 * 60 * 1000 // 2 min

// ── Yahoo Finance helper ──────────────────────────────────────────────────────

const YAHOO_SYMBOLS: { symbol: string; display: string; category: string; name: string }[] = [
  { symbol: 'GC=F', display: 'GOLD', category: 'commodity', name: 'Gold' },
  { symbol: 'CL=F', display: 'OIL', category: 'commodity', name: 'WTI Crude Oil' },
  { symbol: 'NG=F', display: 'GAS', category: 'commodity', name: 'Natural Gas' },
  { symbol: '^GSPC', display: 'S&P', category: 'index', name: 'S&P 500' },
  { symbol: '^IXIC', display: 'NDQ', category: 'index', name: 'NASDAQ Composite' },
  { symbol: 'DX-Y.NYB', display: 'DXY', category: 'index', name: 'US Dollar Index' },
  { symbol: '^VIX', display: 'VIX', category: 'sentiment', name: 'CBOE Volatility Index' },
  { symbol: '^TNX', display: '10Y', category: 'bond', name: '10Y Treasury Yield' },
  { symbol: 'EURUSD=X', display: 'EUR', category: 'forex', name: 'EUR/USD' },
]

async function fetchYahoo(sym: string): Promise<{ price: number; change: number } | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=2d`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(5000) }
    )
    if (!res.ok) return null
    const data = await res.json()
    const meta = data?.chart?.result?.[0]?.meta
    if (!meta) return null
    const price = meta.regularMarketPrice ?? 0
    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price
    const change = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0
    return { price, change: Math.round(change * 100) / 100 }
  } catch {
    return null
  }
}

// ── CoinGecko ─────────────────────────────────────────────────────────────────

async function fetchCrypto(): Promise<PriceItem[]> {
  const items: PriceItem[] = []
  try {
    const [priceRes, globalRes] = await Promise.allSettled([
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ripple&vs_currencies=usd&include_24hr_change=true', {
        signal: AbortSignal.timeout(5000),
      }),
      fetch('https://api.coingecko.com/api/v3/global', {
        signal: AbortSignal.timeout(5000),
      }),
    ])

    if (priceRes.status === 'fulfilled' && priceRes.value.ok) {
      const data = await priceRes.value.json()
      if (data.bitcoin) {
        items.push({
          symbol: 'BTC', price: data.bitcoin.usd,
          change: Math.round((data.bitcoin.usd_24h_change || 0) * 100) / 100,
          category: 'crypto', name: 'Bitcoin',
        })
      }
      if (data.ripple) {
        items.push({
          symbol: 'XRP', price: data.ripple.usd,
          change: Math.round((data.ripple.usd_24h_change || 0) * 100) / 100,
          category: 'crypto', name: 'XRP',
        })
      }
    }

    if (globalRes.status === 'fulfilled' && globalRes.value.ok) {
      const data = await globalRes.value.json()
      const gd = data?.data
      if (gd) {
        const mcapT = (gd.total_market_cap?.usd || 0) / 1e12
        const mcapChange = gd.market_cap_change_percentage_24h_usd || 0
        items.push({
          symbol: 'MCAP', price: Math.round(mcapT * 100) / 100,
          change: Math.round(mcapChange * 100) / 100,
          category: 'crypto', unit: 'T', name: 'Total Market Cap',
        })
        items.push({
          symbol: 'BTC.D', price: Math.round((gd.market_cap_percentage?.btc || 0) * 10) / 10,
          change: 0, category: 'crypto', unit: '%', name: 'BTC Dominance',
        })
      }
    }
  } catch {
    // silently fail
  }
  return items
}

// ── Fear & Greed ──────────────────────────────────────────────────────────────

async function fetchFearGreed(): Promise<{ fng: number; label: string } | null> {
  try {
    const res = await fetch('https://api.alternative.me/fng/?limit=1', {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const entry = data?.data?.[0]
    if (!entry) return null
    return {
      fng: parseInt(entry.value) || 0,
      label: entry.value_classification || 'Neutral',
    }
  } catch {
    return null
  }
}

// ── ETF flows via Brave Search ────────────────────────────────────────────────

async function fetchETFFlows(): Promise<{ flow: string; source: string } | null> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY
  if (!apiKey) return null
  try {
    const res = await fetch(
      `https://api.search.brave.com/res/v1/news/search?q=${encodeURIComponent('bitcoin ETF inflow outflow today')}&count=3&freshness=pd`,
      {
        headers: { 'Accept': 'application/json', 'X-Subscription-Token': apiKey },
        signal: AbortSignal.timeout(5000),
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    const results = data?.results || []
    for (const r of results) {
      const text = (r.title || '') + ' ' + (r.description || '')
      const match = text.match(/([+-]?\$[\d,.]+\s*[BMbm](?:illion)?)/i)
      if (match) {
        let flow = match[1].replace(/illion/i, '').replace(/\s/g, '').toUpperCase()
        if (!flow.startsWith('+') && !flow.startsWith('-')) flow = '+' + flow
        return { flow, source: 'news' }
      }
    }
    return null
  } catch {
    return null
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function GET() {
  // Return cache if fresh
  if (priceCache && Date.now() - priceCache.ts < PRICE_CACHE_TTL) {
    return NextResponse.json(priceCache.data)
  }

  const [cryptoItems, yahooResults, sentiment, etf] = await Promise.all([
    fetchCrypto(),
    Promise.allSettled(YAHOO_SYMBOLS.map(async (s) => {
      const result = await fetchYahoo(s.symbol)
      if (!result) return null
      return {
        symbol: s.display, price: result.price, change: result.change,
        category: s.category, name: s.name,
      } as PriceItem
    })),
    fetchFearGreed(),
    fetchETFFlows(),
  ])

  const prices: PriceItem[] = [...cryptoItems]
  for (const r of yahooResults) {
    if (r.status === 'fulfilled' && r.value) {
      prices.push(r.value)
    }
  }

  const response: FinanceResponse = { prices, sentiment, etf, updatedAt: Date.now() }

  priceCache = { data: response, ts: Date.now() }

  return NextResponse.json(response)
}
