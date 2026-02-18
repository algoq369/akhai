/**
 * Dynamic Link Discovery API
 * Server-side endpoint for web search and link discovery
 * Uses DDG HTML POST method (not Instant Answer API) for reliable results.
 */

import { NextRequest, NextResponse } from 'next/server'

interface SearchResult {
  id: string
  url: string
  title: string
  snippet: string
  relevance: number
  source: string
  category: 'research' | 'data' | 'news' | 'forum' | 'code' | 'media'
}

/**
 * Extract domain name from URL
 */
function extractDomain(url: string): string {
  try {
    const domain = new URL(url).hostname.replace('www.', '')
    const parts = domain.split('.')
    if (parts.length >= 2) {
      const name = parts[parts.length - 2]
      return name.charAt(0).toUpperCase() + name.slice(1)
    }
    return domain
  } catch {
    return 'Unknown Source'
  }
}

/**
 * Categorize link based on domain and content
 */
function categorizeLink(url: string, title: string, snippet: string): SearchResult['category'] {
  const combined = (url + ' ' + title + ' ' + snippet).toLowerCase()

  if (/arxiv|scholar|research|paper|journal|ieee|pubmed|nature|science/i.test(combined)) {
    return 'research'
  }
  if (/data|analytics|metrics|statistics|dashboard|chart|api/i.test(combined)) {
    return 'data'
  }
  if (/github|gitlab|code|repository|documentation|docs/i.test(combined)) {
    return 'code'
  }
  if (/news|article|blog|medium|report|press/i.test(combined)) {
    return 'news'
  }
  if (/forum|discussion|community|reddit|twitter|stack/i.test(combined)) {
    return 'forum'
  }
  return 'media'
}

/**
 * Calculate relevance score
 */
function calculateRelevance(query: string, title: string, snippet: string): number {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  const combinedText = (title + ' ' + snippet).toLowerCase()

  let score = 0.5

  queryWords.forEach(word => {
    if (combinedText.includes(word)) score += 0.1
    if (title.toLowerCase().includes(word)) score += 0.05
  })

  if (combinedText.includes(query.toLowerCase())) {
    score += 0.15
  }

  return Math.min(score, 1.0)
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

/**
 * Unwrap DDG redirect URLs
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
 * Search using DuckDuckGo HTML POST (reliable, not Instant Answer API)
 */
async function searchDuckDuckGo(query: string): Promise<SearchResult[]> {
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
        signal: AbortSignal.timeout(10000)
      }
    )

    if (!response.ok) {
      console.warn(`[DDG] Failed: "${query.substring(0, 40)}" → status: ${response.status}`)
      return []
    }

    const html = await response.text()

    // Detect CAPTCHA
    if (html.includes('anomaly-modal') || html.includes('bots use DuckDuckGo')) {
      console.warn(`[DDG] CAPTCHA detected for: "${query.substring(0, 40)}"`)
      return []
    }

    const links: SearchResult[] = []
    const linkPattern = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/gi
    const snippetPattern = /class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi

    const rawLinks: Array<{ url: string; title: string }> = []
    let match
    while ((match = linkPattern.exec(html)) !== null && rawLinks.length < 10) {
      const url = unwrapDDGUrl(match[1])
      const title = match[2]?.trim()
      if (!title || title.length < 3) continue
      if (url.includes('duckduckgo.com/y.js')) continue
      if (!url.startsWith('http')) continue
      rawLinks.push({ url, title })
    }

    const snippets: string[] = []
    while ((match = snippetPattern.exec(html)) !== null && snippets.length < 10) {
      const raw = stripHtml(match[1])
      if (raw && raw.length > 10) snippets.push(raw)
    }

    const adCount = (html.match(/result--ad/g) || []).length
    const organicSnippets = snippets.slice(adCount)

    for (let i = 0; i < rawLinks.length; i++) {
      const snippet = organicSnippets[i] || ''
      links.push({
        id: `ddg-${Date.now()}-${Math.random()}`,
        url: rawLinks[i].url,
        title: rawLinks[i].title,
        snippet,
        relevance: calculateRelevance(query, rawLinks[i].title, snippet),
        source: extractDomain(rawLinks[i].url),
        category: categorizeLink(rawLinks[i].url, rawLinks[i].title, snippet)
      })
    }

    console.log(`[DDG] Searching: "${query.substring(0, 40)}" → ${links.length} results`)
    return links
  } catch (error) {
    console.error(`[DDG] Failed: "${query.substring(0, 40)}" → ${error instanceof Error ? error.message : 'Unknown error'}`)
    return []
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query, topics, maxLinks = 6 } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    console.log('[DiscoverLinks] Searching for:', {
      query: query.substring(0, 100),
      topics: topics?.slice(0, 3),
      maxLinks
    })

    // Search DDG with main query only (avoid rate-limiting)
    const results = await searchDuckDuckGo(query)

    // Deduplicate by URL
    const uniqueLinks = new Map<string, SearchResult>()
    for (const link of results) {
      if (!uniqueLinks.has(link.url) || link.relevance > uniqueLinks.get(link.url)!.relevance) {
        uniqueLinks.set(link.url, link)
      }
    }

    // Sort by relevance with category diversity (max 2 per category)
    const sorted = Array.from(uniqueLinks.values()).sort((a, b) => b.relevance - a.relevance)
    const finalResults: SearchResult[] = []
    const categoryCount: Record<string, number> = {}

    for (const link of sorted) {
      if (finalResults.length >= maxLinks) break
      const count = categoryCount[link.category] || 0
      if (count < 2) {
        finalResults.push(link)
        categoryCount[link.category] = count + 1
      }
    }

    const searchUnavailable = finalResults.length === 0
    if (searchUnavailable) {
      console.warn(`[DDG] Search unavailable for: "${query.substring(0, 40)}"`)
    }

    console.log('[DiscoverLinks] Results:', {
      totalFound: results.length,
      unique: uniqueLinks.size,
      returned: finalResults.length,
      searchUnavailable
    })

    return NextResponse.json({
      success: true,
      links: finalResults,
      searchUnavailable,
      query,
      searchedTopics: [query]
    })
  } catch (error) {
    console.error('[DiscoverLinks] Error:', error)
    return NextResponse.json(
      { error: 'Link discovery failed', searchUnavailable: true, details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
