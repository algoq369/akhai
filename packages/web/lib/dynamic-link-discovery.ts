/**
 * Dynamic Link Discovery System
 *
 * Uses DuckDuckGo search to find the BEST links for any query
 * No hardcoded website lists - pure search-based discovery
 * Integrates with Side Canal for topic extraction
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
    // Convert domain to readable name
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

  // Research sources
  if (/arxiv|scholar|research|paper|journal|ieee|acm|pubmed|nature|science/i.test(combined)) {
    return 'research'
  }

  // Data sources
  if (/data|analytics|metrics|statistics|dashboard|chart|graph|api/i.test(combined)) {
    return 'data'
  }

  // Code sources
  if (/github|gitlab|code|repository|documentation|docs|api\s+reference/i.test(combined)) {
    return 'code'
  }

  // News sources
  if (/news|article|blog|medium|substack|report|press|announcement/i.test(combined)) {
    return 'news'
  }

  // Forum/Discussion
  if (/forum|discussion|community|reddit|twitter|stack|hacker\s+news/i.test(combined)) {
    return 'forum'
  }

  // Default to media
  return 'media'
}

/**
 * Calculate relevance score based on title/snippet match with query
 */
function calculateRelevance(query: string, title: string, snippet: string): number {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  const combinedText = (title + ' ' + snippet).toLowerCase()

  let score = 0.5 // Base score

  // Count matching query words
  queryWords.forEach(word => {
    if (combinedText.includes(word)) {
      score += 0.1
    }
  })

  // Bonus for title matches (more important)
  queryWords.forEach(word => {
    if (title.toLowerCase().includes(word)) {
      score += 0.05
    }
  })

  // Bonus for exact phrase match
  if (combinedText.includes(query.toLowerCase())) {
    score += 0.15
  }

  return Math.min(score, 1.0)
}

/**
 * Search DuckDuckGo for relevant links
 */
async function searchDuckDuckGo(query: string, maxResults: number = 10): Promise<DiscoveredLink[]> {
  try {
    // Use DuckDuckGo Instant Answer API (free, no key required)
    const encodedQuery = encodeURIComponent(query)
    const url = `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`

    const response = await fetch(url)
    if (!response.ok) {
      console.error('[DynamicLinks] DuckDuckGo search failed:', response.status)
      return []
    }

    const data = await response.json()
    const links: DiscoveredLink[] = []

    // Extract from RelatedTopics
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics.slice(0, maxResults)) {
        if (topic.FirstURL && topic.Text) {
          const link: DiscoveredLink = {
            id: `ddg-${Date.now()}-${Math.random()}`,
            url: topic.FirstURL,
            title: topic.Text.split(' - ')[0] || topic.Text.substring(0, 100),
            snippet: topic.Text,
            relevance: calculateRelevance(query, topic.Text, topic.Text),
            source: extractDomain(topic.FirstURL),
            category: categorizeLink(topic.FirstURL, topic.Text, topic.Text)
          }
          links.push(link)
        }
      }
    }

    // Extract from Results
    if (data.Results && Array.isArray(data.Results)) {
      for (const result of data.Results.slice(0, maxResults)) {
        if (result.FirstURL && result.Text) {
          const link: DiscoveredLink = {
            id: `ddg-res-${Date.now()}-${Math.random()}`,
            url: result.FirstURL,
            title: result.Text.split(' - ')[0] || result.Text.substring(0, 100),
            snippet: result.Text,
            relevance: calculateRelevance(query, result.Text, result.Text),
            source: extractDomain(result.FirstURL),
            category: categorizeLink(result.FirstURL, result.Text, result.Text)
          }
          links.push(link)
        }
      }
    }

    return links.sort((a, b) => b.relevance - a.relevance)
  } catch (error) {
    console.error('[DynamicLinks] DuckDuckGo search error:', error)
    return []
  }
}

/**
 * Alternative: Use our own web search via DuckDuckGo HTML scraping
 * More reliable for general queries
 */
async function searchWeb(query: string, maxResults: number = 10): Promise<DiscoveredLink[]> {
  try {
    // Use DuckDuckGo HTML search (scraping approach)
    const encodedQuery = encodeURIComponent(query)
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodedQuery}`

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      console.error('[DynamicLinks] Web search failed:', response.status)
      return []
    }

    const html = await response.text()

    // Parse HTML to extract results (basic regex-based extraction)
    const links: DiscoveredLink[] = []

    // Extract result divs (this is a simplified version - ideally use a proper HTML parser)
    const resultPattern = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([^<]+)<\/a>/g
    let match

    while ((match = resultPattern.exec(html)) !== null && links.length < maxResults) {
      const [, url, title, snippet] = match

      // Decode URL (DuckDuckGo wraps URLs)
      let cleanUrl = url
      if (url.startsWith('//duckduckgo.com/l/?')) {
        const urlParams = new URLSearchParams(url.split('?')[1])
        cleanUrl = urlParams.get('uddg') || url
      }

      links.push({
        id: `web-${Date.now()}-${Math.random()}`,
        url: cleanUrl,
        title: title.trim(),
        snippet: snippet.trim(),
        relevance: calculateRelevance(query, title, snippet),
        source: extractDomain(cleanUrl),
        category: categorizeLink(cleanUrl, title, snippet)
      })
    }

    return links.sort((a, b) => b.relevance - a.relevance)
  } catch (error) {
    console.error('[DynamicLinks] Web search error:', error)
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
    // Step 1: Extract topics from query using Side Canal
    let searchQueries: string[] = [query]

    if (userId) {
      try {
        const topics = await extractTopics(query, aiResponse, userId)

        // Use extracted topics as additional search queries
        if (topics && topics.length > 0) {
          // Get top 2 most relevant topics
          const topTopics = topics.slice(0, 2).map(t => t.name)
          searchQueries = [query, ...topTopics]

          console.log('[DynamicLinks] Using Side Canal topics:', topTopics)
        }
      } catch (error) {
        console.error('[DynamicLinks] Side Canal extraction failed:', error)
        // Continue with just the query
      }
    }

    // Step 2: Search for each query
    const allLinks: DiscoveredLink[] = []

    for (const searchQuery of searchQueries.slice(0, 3)) { // Max 3 searches
      // Try DuckDuckGo API first
      let links = await searchDuckDuckGo(searchQuery, 5)

      // If no results, try web scraping approach
      if (links.length === 0) {
        links = await searchWeb(searchQuery, 5)
      }

      allLinks.push(...links)
    }

    // Step 3: Deduplicate by URL
    const uniqueLinks = new Map<string, DiscoveredLink>()
    for (const link of allLinks) {
      if (!uniqueLinks.has(link.url) || link.relevance > uniqueLinks.get(link.url)!.relevance) {
        uniqueLinks.set(link.url, link)
      }
    }

    // Step 4: Sort by relevance and ensure category diversity
    const sortedLinks = Array.from(uniqueLinks.values())
      .sort((a, b) => b.relevance - a.relevance)

    // Step 5: Select top N with diversity (max 2 per category)
    const result: DiscoveredLink[] = []
    const categoryCount: Record<string, number> = {}

    for (const link of sortedLinks) {
      if (result.length >= maxLinks) break

      const count = categoryCount[link.category] || 0
      if (count < 2) { // Max 2 links per category for diversity
        result.push(link)
        categoryCount[link.category] = count + 1
      }
    }

    console.log('[DynamicLinks] Discovered links:', {
      searchQueries: searchQueries.slice(0, 3),
      totalFound: allLinks.length,
      uniqueLinks: uniqueLinks.size,
      returned: result.length,
      categories: Object.keys(categoryCount)
    })

    return result
  } catch (error) {
    console.error('[DynamicLinks] Discovery failed:', error)
    return []
  }
}

/**
 * Fallback: Generate search engine links if dynamic discovery fails
 */
export function generateSearchFallback(query: string): DiscoveredLink[] {
  const encodedQuery = encodeURIComponent(query)

  return [
    {
      id: `fallback-scholar-${Date.now()}`,
      url: `https://scholar.google.com/scholar?q=${encodedQuery}`,
      title: `${query} - Academic Research`,
      snippet: 'Peer-reviewed academic papers and citations',
      relevance: 0.85,
      source: 'Google Scholar',
      category: 'research'
    },
    {
      id: `fallback-github-${Date.now()}`,
      url: `https://github.com/search?q=${encodedQuery}&type=repositories&s=stars&o=desc`,
      title: `${query} - Code Repositories`,
      snippet: 'Top-starred repositories and open source projects',
      relevance: 0.80,
      source: 'GitHub',
      category: 'code'
    },
    {
      id: `fallback-ddg-${Date.now()}`,
      url: `https://duckduckgo.com/?q=${encodedQuery}`,
      title: `${query} - Web Search`,
      snippet: 'General web search results',
      relevance: 0.75,
      source: 'DuckDuckGo',
      category: 'media'
    }
  ]
}
