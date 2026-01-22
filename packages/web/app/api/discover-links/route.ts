/**
 * Dynamic Link Discovery API
 * Server-side endpoint for web search and link discovery
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
 * Search using DuckDuckGo Instant Answer API
 */
async function searchDuckDuckGo(query: string): Promise<SearchResult[]> {
  try {
    const encodedQuery = encodeURIComponent(query)
    const url = `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AkhAI/1.0'
      }
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    const links: SearchResult[] = []

    // Extract from RelatedTopics
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics) {
        if (topic.FirstURL && topic.Text) {
          links.push({
            id: `ddg-${Date.now()}-${Math.random()}`,
            url: topic.FirstURL,
            title: topic.Text.substring(0, 150),
            snippet: topic.Text,
            relevance: calculateRelevance(query, topic.Text, topic.Text),
            source: extractDomain(topic.FirstURL),
            category: categorizeLink(topic.FirstURL, topic.Text, topic.Text)
          })
        }
      }
    }

    return links
  } catch (error) {
    console.error('[DiscoverLinks] DuckDuckGo error:', error)
    return []
  }
}

/**
 * Fallback search links
 */
function generateFallback(query: string): SearchResult[] {
  const encodedQuery = encodeURIComponent(query)

  return [
    {
      id: `fallback-scholar-${Date.now()}`,
      url: `https://scholar.google.com/scholar?q=${encodedQuery}`,
      title: `${query} - Academic Research`,
      snippet: 'Peer-reviewed academic papers and scholarly articles',
      relevance: 0.90,
      source: 'Google Scholar',
      category: 'research'
    },
    {
      id: `fallback-arxiv-${Date.now()}`,
      url: `https://arxiv.org/search/?query=${encodedQuery}&searchtype=all&order=-announced_date_first`,
      title: `${query} - Scientific Papers`,
      snippet: 'Open-access scientific research papers',
      relevance: 0.88,
      source: 'ArXiv',
      category: 'research'
    },
    {
      id: `fallback-github-${Date.now()}`,
      url: `https://github.com/search?q=${encodedQuery}&type=repositories&s=stars&o=desc`,
      title: `${query} - Code Repositories`,
      snippet: 'Top open source projects and implementations',
      relevance: 0.85,
      source: 'GitHub',
      category: 'code'
    },
    {
      id: `fallback-wiki-${Date.now()}`,
      url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodedQuery}`,
      title: `${query} - Encyclopedia`,
      snippet: 'Comprehensive background and overview',
      relevance: 0.82,
      source: 'Wikipedia',
      category: 'media'
    }
  ]
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

    // Build search queries
    const searchQueries = [query]
    if (topics && Array.isArray(topics)) {
      searchQueries.push(...topics.slice(0, 2))
    }

    // Search for each query
    const allLinks: SearchResult[] = []

    for (const searchQuery of searchQueries.slice(0, 3)) {
      const links = await searchDuckDuckGo(searchQuery)
      allLinks.push(...links)
    }

    // Deduplicate by URL
    const uniqueLinks = new Map<string, SearchResult>()
    for (const link of allLinks) {
      if (!uniqueLinks.has(link.url) || link.relevance > uniqueLinks.get(link.url)!.relevance) {
        uniqueLinks.set(link.url, link)
      }
    }

    // Sort by relevance
    let results = Array.from(uniqueLinks.values())
      .sort((a, b) => b.relevance - a.relevance)

    // If no results from DDG, use fallback
    if (results.length === 0) {
      console.log('[DiscoverLinks] No DDG results, using fallback')
      results = generateFallback(query)
    }

    // Ensure category diversity (max 2 per category)
    const finalResults: SearchResult[] = []
    const categoryCount: Record<string, number> = {}

    for (const link of results) {
      if (finalResults.length >= maxLinks) break

      const count = categoryCount[link.category] || 0
      if (count < 2) {
        finalResults.push(link)
        categoryCount[link.category] = count + 1
      }
    }

    console.log('[DiscoverLinks] Results:', {
      totalFound: allLinks.length,
      unique: uniqueLinks.size,
      returned: finalResults.length,
      categories: Object.keys(categoryCount)
    })

    return NextResponse.json({
      success: true,
      links: finalResults,
      query,
      searchedTopics: searchQueries.slice(0, 3)
    })
  } catch (error) {
    console.error('[DiscoverLinks] Error:', error)
    return NextResponse.json(
      { error: 'Link discovery failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
