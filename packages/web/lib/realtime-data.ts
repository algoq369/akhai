/**
 * Real-time data fetching service
 * Provides crypto prices, web search, and other live data
 */

interface CryptoPrice {
  symbol: string
  price: number
  change24h: number
  source: string
}

/**
 * CoinGecko API (free, no key required for basic use)
 */
export async function getCryptoPriceFromCoinGecko(symbol: string): Promise<CryptoPrice | null> {
  const symbolMap: Record<string, string> = {
    btc: 'bitcoin',
    bitcoin: 'bitcoin',
    eth: 'ethereum',
    ethereum: 'ethereum',
    sol: 'solana',
    solana: 'solana',
    xrp: 'ripple',
    ripple: 'ripple',
    ada: 'cardano',
    cardano: 'cardano',
    doge: 'dogecoin',
    dogecoin: 'dogecoin',
    matic: 'matic-network',
    polygon: 'matic-network',
    avax: 'avalanche-2',
    avalanche: 'avalanche-2',
    dot: 'polkadot',
    polkadot: 'polkadot',
    link: 'chainlink',
    chainlink: 'chainlink',
    bnb: 'binancecoin',
    binance: 'binancecoin',
  }

  const coinId = symbolMap[symbol.toLowerCase()] || symbol.toLowerCase()

  try {
    console.log(`[CoinGecko] Fetching price for: ${coinId}`)

    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`,
      {
        next: { revalidate: 60 }, // Cache for 60 seconds
        headers: {
          'Accept': 'application/json'
        }
      }
    )

    if (!res.ok) {
      console.error(`[CoinGecko] API error: ${res.status}`)
      return null
    }

    const data = await res.json()
    const coinData = data[coinId]

    if (!coinData) {
      console.log(`[CoinGecko] No data for: ${coinId}`)
      return null
    }

    console.log(`[CoinGecko] Success: ${symbol.toUpperCase()} = $${coinData.usd}`)

    return {
      symbol: symbol.toUpperCase(),
      price: coinData.usd,
      change24h: coinData.usd_24h_change || 0,
      source: 'CoinGecko'
    }
  } catch (e) {
    console.error('[CoinGecko] Error:', e)
    return null
  }
}

/**
 * CoinMarketCap API (requires API key)
 */
export async function getCryptoPriceFromCMC(symbol: string): Promise<CryptoPrice | null> {
  const apiKey = process.env.COINMARKETCAP_API_KEY
  if (!apiKey) {
    console.log('[CoinMarketCap] API key not configured')
    return null
  }

  try {
    console.log(`[CoinMarketCap] Fetching price for: ${symbol}`)

    const res = await fetch(
      `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbol.toUpperCase()}`,
      {
        headers: {
          'X-CMC_PRO_API_KEY': apiKey,
          'Accept': 'application/json'
        }
      }
    )

    if (!res.ok) {
      console.error(`[CoinMarketCap] API error: ${res.status}`)
      return null
    }

    const data = await res.json()
    const coinData = data.data?.[symbol.toUpperCase()]

    if (!coinData) {
      console.log(`[CoinMarketCap] No data for: ${symbol}`)
      return null
    }

    console.log(`[CoinMarketCap] Success: ${symbol.toUpperCase()} = $${coinData.quote.USD.price}`)

    return {
      symbol: symbol.toUpperCase(),
      price: coinData.quote.USD.price,
      change24h: coinData.quote.USD.percent_change_24h,
      source: 'CoinMarketCap'
    }
  } catch (e) {
    console.error('[CoinMarketCap] Error:', e)
    return null
  }
}

/**
 * Brave Search API
 */
export async function searchWithBrave(query: string): Promise<string | null> {
  const apiKey = process.env.BRAVE_API_KEY
  if (!apiKey) {
    console.log('[Brave Search] API key not configured')
    return null
  }

  try {
    console.log(`[Brave Search] Searching for: ${query}`)

    const res = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`,
      {
        headers: {
          'X-Subscription-Token': apiKey,
          'Accept': 'application/json'
        }
      }
    )

    if (!res.ok) {
      console.error(`[Brave Search] API error: ${res.status}`)
      return null
    }

    const data = await res.json()
    const results = data.web?.results || []

    if (results.length === 0) {
      console.log('[Brave Search] No results found')
      return null
    }

    console.log(`[Brave Search] Found ${results.length} results`)

    // Return top 3 results as context
    return results
      .slice(0, 3)
      .map((r: any) => `${r.title}: ${r.description}`)
      .join('\n\n')
  } catch (e) {
    console.error('[Brave Search] Error:', e)
    return null
  }
}

/**
 * Main function to get crypto price from any available source
 */
export async function getCryptoPrice(symbol: string): Promise<CryptoPrice | null> {
  // Try CoinGecko first (free, no key required)
  let price = await getCryptoPriceFromCoinGecko(symbol)
  if (price) return price

  // Fallback to CoinMarketCap if API key is configured
  price = await getCryptoPriceFromCMC(symbol)
  if (price) return price

  console.log(`[Crypto] No price data available for: ${symbol}`)
  return null
}

/**
 * Detect if query is about crypto prices
 */
export function isCryptoPriceQuery(query: string): { isCrypto: boolean; symbol?: string } {
  const q = query.toLowerCase()

  const cryptoPatterns = [
    { pattern: /\b(btc|bitcoin)\b.*\b(price|cost|worth|value)\b/i, symbol: 'btc' },
    { pattern: /\bprice\b.*\b(of\s+)?(btc|bitcoin)\b/i, symbol: 'btc' },
    { pattern: /\b(eth|ethereum)\b.*\b(price|cost|worth|value)\b/i, symbol: 'eth' },
    { pattern: /\bprice\b.*\b(of\s+)?(eth|ethereum)\b/i, symbol: 'eth' },
    { pattern: /\b(sol|solana)\b.*\b(price|cost|worth|value)\b/i, symbol: 'sol' },
    { pattern: /\bprice\b.*\b(of\s+)?(sol|solana)\b/i, symbol: 'sol' },
    { pattern: /\b(xrp|ripple)\b.*\b(price|cost|worth|value)\b/i, symbol: 'xrp' },
    { pattern: /\bprice\b.*\b(of\s+)?(xrp|ripple)\b/i, symbol: 'xrp' },
    { pattern: /\b(doge|dogecoin)\b.*\b(price|cost|worth|value)\b/i, symbol: 'doge' },
    { pattern: /\bprice\b.*\b(of\s+)?(doge|dogecoin)\b/i, symbol: 'doge' },
    { pattern: /\b(ada|cardano)\b.*\b(price|cost|worth|value)\b/i, symbol: 'ada' },
    { pattern: /\bprice\b.*\b(of\s+)?(ada|cardano)\b/i, symbol: 'ada' },
    { pattern: /\b(matic|polygon)\b.*\b(price|cost|worth|value)\b/i, symbol: 'matic' },
    { pattern: /\bprice\b.*\b(of\s+)?(matic|polygon)\b/i, symbol: 'matic' },
    { pattern: /\b(avax|avalanche)\b.*\b(price|cost|worth|value)\b/i, symbol: 'avax' },
    { pattern: /\bprice\b.*\b(of\s+)?(avax|avalanche)\b/i, symbol: 'avax' },
    { pattern: /\b(dot|polkadot)\b.*\b(price|cost|worth|value)\b/i, symbol: 'dot' },
    { pattern: /\bprice\b.*\b(of\s+)?(dot|polkadot)\b/i, symbol: 'dot' },
    { pattern: /\b(link|chainlink)\b.*\b(price|cost|worth|value)\b/i, symbol: 'link' },
    { pattern: /\bprice\b.*\b(of\s+)?(link|chainlink)\b/i, symbol: 'link' },
    { pattern: /\b(bnb|binance)\b.*\b(price|cost|worth|value)\b/i, symbol: 'bnb' },
    { pattern: /\bprice\b.*\b(of\s+)?(bnb|binance)\b/i, symbol: 'bnb' },
    // Shortened queries
    { pattern: /^(btc|bitcoin)\s+price\s*$/i, symbol: 'btc' },
    { pattern: /^(eth|ethereum)\s+price\s*$/i, symbol: 'eth' },
    { pattern: /^(sol|solana)\s+price\s*$/i, symbol: 'sol' },
    { pattern: /^price\s+(of\s+)?(btc|bitcoin)\s*$/i, symbol: 'btc' },
    { pattern: /^price\s+(of\s+)?(eth|ethereum)\s*$/i, symbol: 'eth' },
  ]

  for (const { pattern, symbol } of cryptoPatterns) {
    if (pattern.test(q)) {
      return { isCrypto: true, symbol }
    }
  }

  return { isCrypto: false }
}

/**
 * Detect if query needs web search
 */
export function needsWebSearch(query: string): boolean {
  const q = query.toLowerCase()
  const searchKeywords = [
    'current', 'today', 'latest', 'now', 'recent', 'news',
    'stock', 'market', 'weather', 'score', 'result', 'winner'
  ]

  return searchKeywords.some(keyword => q.includes(keyword))
}
