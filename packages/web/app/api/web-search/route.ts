import { NextRequest, NextResponse } from 'next/server'

/**
 * Live Web Search API
 *
 * Provides real-time search results using DuckDuckGo HTML scraping.
 * Uses POST method to DDG which is more reliable than GET (less bot detection).
 * No API key required - uses public search interface.
 *
 * Returns: Array of search results with title, snippet, URL
 */
export async function POST(request: NextRequest) {
  try {
    const { query, maxResults = 5 } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    console.log(`[DDG] Searching: "${query}"`)

    const encodedQuery = encodeURIComponent(query)

    // POST to DDG HTML — more reliable than GET (less aggressive bot detection)
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
        signal: AbortSignal.timeout(10000)
      }
    )

    if (!response.ok) {
      console.error(`[DDG] Failed: "${query}" → status: ${response.status}`)
      return NextResponse.json(
        { error: 'Search request failed', searchUnavailable: true },
        { status: 500 }
      )
    }

    const html = await response.text()

    // Detect CAPTCHA/bot-detection
    if (html.includes('anomaly-modal') || html.includes('bots use DuckDuckGo')) {
      console.warn(`[DDG] CAPTCHA detected for: "${query}" — DDG rate-limiting active`)
      return NextResponse.json({
        query,
        results: [],
        searchUnavailable: true,
        timestamp: new Date().toISOString(),
        source: 'DuckDuckGo',
      })
    }

    const results = parseSearchResults(html, maxResults)

    const searchUnavailable = results.length === 0
    console.log(`[DDG] Searching: "${query}" → ${results.length} results`)

    return NextResponse.json({
      query,
      results,
      searchUnavailable,
      timestamp: new Date().toISOString(),
      source: 'DuckDuckGo',
    })
  } catch (error) {
    console.error(`[DDG] Failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return NextResponse.json(
      {
        error: 'Search failed',
        searchUnavailable: true,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Unwrap DDG redirect URLs to get the real destination URL.
 * GET requests wrap as //duckduckgo.com/l/?uddg=ENCODED_URL&rut=...
 * POST requests usually return direct URLs.
 */
function unwrapDDGUrl(rawUrl: string): string {
  const url = rawUrl.replace(/&amp;/g, '&')
  if (url.includes('duckduckgo.com/l/?uddg=')) {
    try {
      const queryString = url.split('?')[1]
      const params = new URLSearchParams(queryString)
      const realUrl = params.get('uddg')
      if (realUrl) return decodeURIComponent(realUrl)
    } catch { /* fall through */ }
  }
  return rawUrl
}

/**
 * Parse search results from DuckDuckGo HTML
 */
function parseSearchResults(html: string, maxResults: number): SearchResult[] {
  const results: SearchResult[] = []

  try {
    // Extract result__a links directly (works regardless of nested div structure)
    // Pattern: <a rel="nofollow" class="result__a" href="URL">Title</a>
    const linkPattern = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/gi
    // Snippet: <a class="result__snippet" href="...">text with <b>bold</b> words</a>
    const snippetPattern = /class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi

    const links: Array<{ url: string; title: string }> = []
    let match

    while ((match = linkPattern.exec(html)) !== null && links.length < maxResults + 5) {
      const rawUrl = match[1]
      const title = match[2]?.trim()

      if (!title || title.length < 3) continue

      // Unwrap DDG redirect URL
      const url = unwrapDDGUrl(rawUrl)

      // Skip ads and DDG internal links
      if (url.includes('duckduckgo.com/y.js')) continue
      if (url.includes('duckduckgo.com') && !url.startsWith('http')) continue
      if (!url.startsWith('http')) continue

      links.push({ url, title })
    }

    // Extract snippets (may contain <b> tags for highlighted search terms)
    const snippets: string[] = []
    while ((match = snippetPattern.exec(html)) !== null && snippets.length < links.length + 5) {
      const raw = stripHtml(match[1])
      if (raw && raw.length > 10) snippets.push(raw)
    }

    // Skip ad snippets — ads appear first in both links and snippets
    const adCount = (html.match(/result--ad/g) || []).length
    const organicSnippets = snippets.slice(adCount)

    // Match organic links with organic snippets
    for (let i = 0; i < Math.min(links.length, maxResults); i++) {
      results.push({
        title: links[i].title,
        snippet: organicSnippets[i] || '',
        url: links[i].url,
      })
    }
  } catch (error) {
    console.error('[DDG] Parsing error:', error)
  }

  return results
}

/**
 * Strip HTML tags and decode entities
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

interface SearchResult {
  title: string
  snippet: string
  url: string
}
