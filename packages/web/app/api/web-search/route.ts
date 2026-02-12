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

    // Fetch DuckDuckGo HTML results with proper browser headers
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
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
    // DDG HTML format parsing - multiple patterns for robustness
    // Pattern 1: result__a links with href containing uddg redirect
    const resultPattern = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
    const snippetPattern = /<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/gi

    const links: Array<{ url: string; title: string }> = []
    let linkMatch

    // Extract links
    while ((linkMatch = resultPattern.exec(html)) !== null && links.length < maxResults + 5) {
      let url = linkMatch[1]
      const title = stripHtml(linkMatch[2])?.trim()

      // Decode DDG redirect URL
      if (url.includes('uddg=')) {
        const uddgMatch = url.match(/uddg=([^&]+)/)
        if (uddgMatch) {
          url = decodeURIComponent(uddgMatch[1])
        }
      }

      // Filter out DDG internal links and ads
      if (url && title && title.length > 3 &&
          !url.includes('duckduckgo.com') &&
          !url.includes('//ad.') &&
          url.startsWith('http')) {
        links.push({ url, title })
      }
    }

    // Extract snippets
    const snippets: string[] = []
    let snippetMatch
    while ((snippetMatch = snippetPattern.exec(html)) !== null && snippets.length < maxResults + 5) {
      const snippet = stripHtml(snippetMatch[1])?.trim()
      if (snippet && snippet.length > 10) {
        snippets.push(snippet)
      }
    }

    // Match links with snippets
    for (let i = 0; i < Math.min(links.length, maxResults); i++) {
      results.push({
        title: links[i].title,
        snippet: snippets[i] || 'Search result',
        url: links[i].url,
      })
    }

    // Fallback: Try alternative parsing if no results found
    if (results.length === 0) {
      const altPattern = /<a[^>]*href="(\/l\/\?uddg=[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
      while ((linkMatch = altPattern.exec(html)) !== null && results.length < maxResults) {
        let url = linkMatch[1]
        const title = stripHtml(linkMatch[2])?.trim()

        if (url.startsWith('/l/?uddg=')) {
          const uddgMatch = url.match(/uddg=([^&]+)/)
          if (uddgMatch) {
            url = decodeURIComponent(uddgMatch[1])
          }
        }

        if (url && title && url.startsWith('http') && title.length > 3 &&
            !url.includes('duckduckgo.com')) {
          results.push({
            title,
            snippet: 'Search result',
            url,
          })
        }
      }
    }

    console.log(`[WebSearch] Parsed ${results.length} results from ${links.length} links`)
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
