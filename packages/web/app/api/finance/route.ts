import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface PriceItem {
  symbol: string;
  price: number;
  change: number;
  category: string;
  unit?: string;
  name?: string;
}

interface FinanceResponse {
  prices: PriceItem[];
  sentiment: { fng: number; label: string } | null;
  updatedAt: number;
}

// ── Cache (2 min TTL) ─────────────────────────────────────────────────────────

let priceCache: { data: FinanceResponse; ts: number } | null = null;
const PRICE_CACHE_TTL = 2 * 60 * 1000;

// ── Yahoo Finance ─────────────────────────────────────────────────────────────

const YAHOO_SYMBOLS: { symbol: string; display: string; category: string; name: string }[] = [
  { symbol: 'GC=F', display: 'GOLD', category: 'commodity', name: 'Gold' },
  { symbol: 'CL=F', display: 'OIL', category: 'commodity', name: 'WTI Crude Oil' },
  { symbol: 'DX-Y.NYB', display: 'DXY', category: 'index', name: 'US Dollar Index' },
];

async function fetchYahoo(sym: string): Promise<{ price: number; change: number } | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=2d`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;
    const price = meta.regularMarketPrice ?? 0;
    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;
    return { price, change: Math.round(change * 100) / 100 };
  } catch {
    return null;
  }
}

// ── CoinGecko (BTC + total market cap) ────────────────────────────────────────

async function fetchCrypto(): Promise<PriceItem[]> {
  const items: PriceItem[] = [];
  try {
    const [priceRes, globalRes] = await Promise.allSettled([
      fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true',
        {
          signal: AbortSignal.timeout(5000),
        }
      ),
      fetch('https://api.coingecko.com/api/v3/global', {
        signal: AbortSignal.timeout(5000),
      }),
    ]);

    if (priceRes.status === 'fulfilled' && priceRes.value.ok) {
      const data = await priceRes.value.json();
      if (data.bitcoin) {
        items.push({
          symbol: 'BTC',
          price: data.bitcoin.usd,
          change: Math.round((data.bitcoin.usd_24h_change || 0) * 100) / 100,
          category: 'crypto',
          name: 'Bitcoin',
        });
      }
    }

    if (globalRes.status === 'fulfilled' && globalRes.value.ok) {
      const data = await globalRes.value.json();
      const gd = data?.data;
      if (gd) {
        const mcapT = (gd.total_market_cap?.usd || 0) / 1e12;
        const mcapChange = gd.market_cap_change_percentage_24h_usd || 0;
        items.push({
          symbol: 'MCAP',
          price: Math.round(mcapT * 100) / 100,
          change: Math.round(mcapChange * 100) / 100,
          category: 'crypto',
          unit: 'T',
          name: 'Total Market Cap',
        });
      }
    }
  } catch {
    // silently fail
  }
  return items;
}

// ── Fear & Greed ──────────────────────────────────────────────────────────────

async function fetchFearGreed(): Promise<{ fng: number; label: string } | null> {
  try {
    const res = await fetch('https://api.alternative.me/fng/?limit=1', {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const entry = data?.data?.[0];
    if (!entry) return null;
    return {
      fng: parseInt(entry.value) || 0,
      label: entry.value_classification || 'Neutral',
    };
  } catch {
    return null;
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function GET() {
  if (priceCache && Date.now() - priceCache.ts < PRICE_CACHE_TTL) {
    return NextResponse.json(priceCache.data);
  }

  const [cryptoItems, yahooResults, sentiment] = await Promise.all([
    fetchCrypto(),
    Promise.allSettled(
      YAHOO_SYMBOLS.map(async (s) => {
        const result = await fetchYahoo(s.symbol);
        if (!result) return null;
        return {
          symbol: s.display,
          price: result.price,
          change: result.change,
          category: s.category,
          name: s.name,
        } as PriceItem;
      })
    ),
    fetchFearGreed(),
  ]);

  const prices: PriceItem[] = [...cryptoItems];
  for (const r of yahooResults) {
    if (r.status === 'fulfilled' && r.value) {
      prices.push(r.value);
    }
  }

  const response: FinanceResponse = { prices, sentiment, updatedAt: Date.now() };
  priceCache = { data: response, ts: Date.now() };

  return NextResponse.json(response);
}
