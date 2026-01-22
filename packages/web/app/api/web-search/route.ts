import { NextRequest, NextResponse } from 'next/server'

/**
 * Live Web Search API
 *
 * Provides real-time search results using DuckDuckGo HTML scraping.
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

    console.log(`[WebSearch] Searching for: "${query}"`)

    // Fetch DuckDuckGo HTML results
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    })

    if (!response.ok) {
      console.error(`[WebSearch] Search failed with status: ${response.status}`)
      return NextResponse.json(
        { error: 'Search request failed' },
        { status: 500 }
      )
    }

    const html = await response.text()

    // Parse search results from HTML
    const results = parseSearchResults(html, maxResults)

    console.log(`[WebSearch] Found ${results.length} results`)

    return NextResponse.json({
      query,
      results,
      timestamp: new Date().toISOString(),
      source: 'DuckDuckGo',
    })
  } catch (error) {
    console.error('[WebSearch] Error:', error)
    return NextResponse.json(
      {
        error: 'Search failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Parse search results from DuckDuckGo HTML
 */
function parseSearchResults(html: string, maxResults: number): SearchResult[] {
  const results: SearchResult[] = []

  try {
    // DuckDuckGo HTML structure: results are in divs with class "result"
    const resultMatches = html.matchAll(/<div class="result[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/g)

    for (const match of resultMatches) {
      if (results.length >= maxResults) break

      const resultHtml = match[1]

      // Extract title and URL from <a class="result__a" href="...">title</a>
      const titleMatch = resultHtml.match(/<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/)

      // Extract snippet from <a class="result__snippet">snippet</a>
      const snippetMatch = resultHtml.match(/<a[^>]*class="result__snippet"[^>]*>(.*?)<\/a>/)

      if (titleMatch) {
        const url = decodeURIComponent(titleMatch[1]).replace(/^\/\/duckduckgo\.com\/l\/\?uddg=/, '').split('&')[0]
        const title = stripHtml(titleMatch[2])
        const snippet = snippetMatch ? stripHtml(snippetMatch[1]) : ''

        // Only add if we have valid URL and title
        if (url.startsWith('http') && title) {
          results.push({
            title,
            snippet,
            url,
          })
        }
      }
    }

    // Fallback: Try alternative parsing if no results found
    if (results.length === 0) {
      const linkMatches = html.matchAll(/<a[^>]*class="result__url"[^>]*href="([^"]+)"[^>]*>.*?<\/a>/g)
      for (const match of linkMatches) {
        if (results.length >= maxResults) break

        const url = decodeURIComponent(match[1])
        if (url.startsWith('http')) {
          results.push({
            title: url,
            snippet: 'Search result',
            url,
          })
        }
      }
    }
  } catch (error) {
    console.error('[WebSearch] Parsing error:', error)
  }

  return results
}

/**
 * Strip HTML tags and decode entities
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '') // Remove tags
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

interface SearchResult {
  title: string
  snippet: string
  url: string
}
