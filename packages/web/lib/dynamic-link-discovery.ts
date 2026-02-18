/**
 * Dynamic Link Discovery System
 *
 * Uses DuckDuckGo HTML POST search to find relevant links for any query.
 * No hardcoded website lists - pure search-based discovery.
 * Integrates with Side Canal for topic extraction.
 */

import { extractTopics } from './side-canal'

export interface DiscoveredLink {
  id: string
  url: string
  title: string
  snippet: string
  relevance: number
  source: string
  category: 'research' | 'data' | 'news' | 'forum' | 'code' | 'media'
}

/**
 * Extract domain name from URL for source identification
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
function categorizeLink(url: string, title: string, snippet: string): DiscoveredLink['category'] {
  const combined = (url + ' ' + title + ' ' + snippet).toLowerCase()

  if (/arxiv|scholar|research|paper|journal|ieee|acm|pubmed|nature|science/i.test(combined)) {
    return 'research'
  }
  if (/data|analytics|metrics|statistics|dashboard|chart|graph|api/i.test(combined)) {
    return 'data'
  }
  if (/github|gitlab|code|repository|documentation|docs|api\s+reference/i.test(combined)) {
    return 'code'
  }
  if (/news|article|blog|medium|substack|report|press|announcement/i.test(combined)) {
    return 'news'
  }
  if (/forum|discussion|community|reddit|twitter|stack|hacker\s+news/i.test(combined)) {
    return 'forum'
  }
  return 'media'
}

/**
 * Calculate relevance score based on title/snippet match with query
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
 * Unwrap DDG redirect URLs to get real destination
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
 * Search DuckDuckGo HTML using POST method (reliable, handles bot detection better than GET)
 */
async function searchWeb(query: string, maxResults: number = 10): Promise<DiscoveredLink[]> {
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
      console.error(`[DDG] Failed: "${query.substring(0, 40)}" → status: ${response.status}`)
      return []
    }

    const html = await response.text()

    // Detect CAPTCHA
    if (html.includes('anomaly-modal') || html.includes('bots use DuckDuckGo')) {
      console.warn(`[DDG] CAPTCHA detected for: "${query.substring(0, 40)}"`)
      return []
    }

    const links: DiscoveredLink[] = []

    // Parse result__a links
    const linkPattern = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/gi
    const snippetPattern = /class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi

    const rawLinks: Array<{ url: string; title: string }> = []
    let match
    while ((match = linkPattern.exec(html)) !== null && rawLinks.length < maxResults + 5) {
      const url = unwrapDDGUrl(match[1])
      const title = match[2]?.trim()
      if (!title || title.length < 3) continue
      if (url.includes('duckduckgo.com/y.js')) continue
      if (!url.startsWith('http')) continue
      rawLinks.push({ url, title })
    }

    const snippets: string[] = []
    while ((match = snippetPattern.exec(html)) !== null && snippets.length < rawLinks.length + 5) {
      const raw = stripHtml(match[1])
      if (raw && raw.length > 10) snippets.push(raw)
    }

    const adCount = (html.match(/result--ad/g) || []).length
    const organicSnippets = snippets.slice(adCount)

    for (let i = 0; i < Math.min(rawLinks.length, maxResults); i++) {
      const snippet = organicSnippets[i] || ''
      links.push({
        id: `web-${Date.now()}-${Math.random()}`,
        url: rawLinks[i].url,
        title: rawLinks[i].title,
        snippet,
        relevance: calculateRelevance(query, rawLinks[i].title, snippet),
        source: extractDomain(rawLinks[i].url),
        category: categorizeLink(rawLinks[i].url, rawLinks[i].title, snippet)
      })
    }

    console.log(`[DDG] Searching: "${query.substring(0, 40)}" → ${links.length} results`)
    return links.sort((a, b) => b.relevance - a.relevance)
  } catch (error) {
    console.error(`[DDG] Failed: "${query.substring(0, 40)}" → ${error instanceof Error ? error.message : 'Unknown error'}`)
    return []
  }
}

/**
 * Main function: Discover pertinent links using Side Canal + Web Search
 */
export async function discoverPertinentLinks(
  query: string,
  aiResponse: string,
  userId?: string,
  maxLinks: number = 6
): Promise<DiscoveredLink[]> {
  try {
    let searchQueries: string[] = [query]

    if (userId) {
      try {
        const topics = await extractTopics(query, aiResponse, userId)
        if (topics && topics.length > 0) {
          const topTopics = topics.slice(0, 2).map(t => t.name)
          searchQueries = [query, ...topTopics]
          console.log('[DynamicLinks] Using Side Canal topics:', topTopics)
        }
      } catch (error) {
        console.error('[DynamicLinks] Side Canal extraction failed:', error)
      }
    }

    // Search with primary query only to avoid rate-limiting
    const links = await searchWeb(searchQueries[0], 10)

    // Deduplicate by URL
    const uniqueLinks = new Map<string, DiscoveredLink>()
    for (const link of links) {
      if (!uniqueLinks.has(link.url) || link.relevance > uniqueLinks.get(link.url)!.relevance) {
        uniqueLinks.set(link.url, link)
      }
    }

    // Select top N with diversity (max 2 per category)
    const sortedLinks = Array.from(uniqueLinks.values())
      .sort((a, b) => b.relevance - a.relevance)

    const result: DiscoveredLink[] = []
    const categoryCount: Record<string, number> = {}

    for (const link of sortedLinks) {
      if (result.length >= maxLinks) break
      const count = categoryCount[link.category] || 0
      if (count < 2) {
        result.push(link)
        categoryCount[link.category] = count + 1
      }
    }

    console.log('[DynamicLinks] Discovered links:', {
      query: searchQueries[0].substring(0, 40),
      totalFound: links.length,
      returned: result.length
    })

    return result
  } catch (error) {
    console.error('[DynamicLinks] Discovery failed:', error)
    return []
  }
}
