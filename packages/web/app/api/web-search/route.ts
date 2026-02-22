import { NextRequest, NextResponse } from 'next/server'

/**
 * Live Web Search API
 *
 * Provider priority:
 * 1. Brave Search API (if BRAVE_SEARCH_API_KEY set) — reliable, 2000 free/month
 * 2. DuckDuckGo HTML scrape (throttled) — free but rate-limited
 * 3. Honest "unavailable" — no fake results ever
 *
 * Get free Brave key: https://brave.com/search/api/ → "Get Started Free"
 */

// ============ THROTTLE ============
let lastDDGTime = 0
const MIN_DDG_GAP_MS = 3000

export async function POST(request: NextRequest) {
  try {
    const { query, maxResults = 5 } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    console.log(`[Search] Query: "${query}"`)

    // 1. Try Brave Search API (if configured)
    const braveKey = process.env.BRAVE_SEARCH_API_KEY
    if (braveKey) {
      const braveResults = await searchBrave(query, maxResults, braveKey)
      if (braveResults.length > 0) {
        console.log(`[Search] Brave: "${query}" → ${braveResults.length} results`)
        return NextResponse.json({
          query, results: braveResults, searchUnavailable: false,
          timestamp: new Date().toISOString(), source: 'Brave',
        })
      }
    }

    // 2. Fallback to DDG (throttled)
    const ddgResults = await searchDDG(query, maxResults)
    if (ddgResults.length > 0) {
      console.log(`[Search] DDG: "${query}" → ${ddgResults.length} results`)
      return NextResponse.json({
        query, results: ddgResults, searchUnavailable: false,
        timestamp: new Date().toISOString(), source: 'DuckDuckGo',
      })
    }

    // 3. Both failed — honest unavailable
    console.warn(`[Search] All providers failed for: "${query}"`)
    return NextResponse.json({
      query, results: [], searchUnavailable: true,
      timestamp: new Date().toISOString(), source: 'none',
    })
  } catch (error) {
    console.error(`[Search] Error: ${error instanceof Error ? error.message : 'Unknown'}`)
    return NextResponse.json({
      query: '', results: [], searchUnavailable: true,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

// ============ BRAVE SEARCH API ============
async function searchBrave(query: string, maxResults: number, apiKey: string): Promise<SearchResult[]> {
  try {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${maxResults}`
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': apiKey,
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!response.ok) {
      console.error(`[Brave] HTTP ${response.status}`)
      return []
    }

    const data = await response.json()
    return (data.web?.results || []).slice(0, maxResults).map((r: any) => ({
      title: r.title || '',
      snippet: r.description || '',
      url: r.url || '',
    })).filter((r: SearchResult) => r.title && r.url)
  } catch (error) {
    console.error(`[Brave] Error: ${error instanceof Error ? error.message : 'Unknown'}`)
    return []
  }
}

// ============ DDG SEARCH (throttled fallback) ============
async function searchDDG(query: string, maxResults: number): Promise<SearchResult[]> {
  const now = Date.now()
  const elapsed = now - lastDDGTime
  if (elapsed < MIN_DDG_GAP_MS) {
    await new Promise(r => setTimeout(r, MIN_DDG_GAP_MS - elapsed))
  }
  lastDDGTime = Date.now()

  try {
    const encodedQuery = encodeURIComponent(query)
    const response = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodedQuery}`,
      {
        method: 'POST',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': 'https://html.duckduckgo.com/',
        },
        body: `q=${encodedQuery}&b=`,
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!response.ok) return []
    const html = await response.text()
    if (html.includes('anomaly-modal') || html.includes('bots use DuckDuckGo')) return []
    return parseDDGResults(html, maxResults)
  } catch {
    return []
  }
}

// ============ DDG PARSER ============
function parseDDGResults(html: string, maxResults: number): SearchResult[] {
  const results: SearchResult[] = []
  try {
    const linkPattern = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/gi
    const snippetPattern = /class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi

    const links: Array<{ url: string; title: string }> = []
    let match
    while ((match = linkPattern.exec(html)) !== null && links.length < maxResults + 5) {
      const rawUrl = match[1]
      const title = match[2]?.trim()
      if (!title || title.length < 3) continue
      const url = unwrapDDGUrl(rawUrl)
      if (url.includes('duckduckgo.com/y.js') || !url.startsWith('http')) continue
      links.push({ url, title })
    }

    const snippets: string[] = []
    while ((match = snippetPattern.exec(html)) !== null && snippets.length < links.length + 5) {
      const raw = stripHtml(match[1])
      if (raw && raw.length > 10) snippets.push(raw)
    }

    const adCount = (html.match(/result--ad/g) || []).length
    const organicSnippets = snippets.slice(adCount)

    for (let i = 0; i < Math.min(links.length, maxResults); i++) {
      results.push({ title: links[i].title, snippet: organicSnippets[i] || '', url: links[i].url })
    }
  } catch {}
  return results
}

function unwrapDDGUrl(rawUrl: string): string {
  const url = rawUrl.replace(/&amp;/g, '&')
  if (url.includes('duckduckgo.com/l/?uddg=')) {
    try {
      const params = new URLSearchParams(url.split('?')[1])
      const realUrl = params.get('uddg')
      if (realUrl) return decodeURIComponent(realUrl)
    } catch {}
  }
  return rawUrl
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

interface SearchResult { title: string; snippet: string; url: string }