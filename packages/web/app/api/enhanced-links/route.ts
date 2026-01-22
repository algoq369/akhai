/**
 * Enhanced AI-Powered Link Discovery API
 * Uses conversation context to find highly relevant, authoritative links
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface DiscoveredLink {
  id: string
  url: string
  title: string
  snippet: string
  relevance: number
  source: string
  type: 'insight' | 'minichat'
  searchQuery: string
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const domain = new URL(url).hostname.replace('www.', '')
    const parts = domain.split('.')
    if (parts.length >= 2) {
      return parts[parts.length - 2].charAt(0).toUpperCase() + parts[parts.length - 2].slice(1)
    }
    return domain
  } catch {
    return 'Unknown'
  }
}

/**
 * Use AI to extract search queries from conversation (with metacognitive awareness)
 */
async function extractSearchQueries(
  query: string,
  conversationContext: string,
  topics: string[]
): Promise<{
  insightQueries: string[]
  minichatQueries: string[]
  confidence: number
  reasoning: string
}> {
  const prompt = `You are a metacognitive research assistant. Analyze this conversation and suggest search queries while being aware of your limitations and uncertainties.

USER'S LATEST QUERY:
"${query}"

CONVERSATION TOPICS:
${topics.join(', ')}

CONVERSATION CONTEXT:
${conversationContext.slice(0, 1000)}

METACOGNITIVE TASK:
1. Analyze what you DO understand about the user's intent
2. Identify what might be UNCLEAR or AMBIGUOUS
3. Generate search queries that address both understanding and uncertainty
4. Rate your confidence in interpreting the user's research direction (0-1)

Extract:
- 3 search queries for IN-DEPTH RESEARCH (academic, authoritative)
- 3 search queries for PRACTICAL/APPLIED content (tutorials, examples)

IMPORTANT - Apply these metacognitive principles:
- Be specific where you're confident
- Be broader where you're uncertain
- Acknowledge multiple possible interpretations
- Don't assume unstated requirements

Return ONLY valid JSON:
{
  "insightQueries": ["query1", "query2", "query3"],
  "minichatQueries": ["query1", "query2", "query3"],
  "confidence": 0.85,
  "reasoning": "I'm confident about X, but uncertain about Y, so I included Z"
}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    const content = response.content[0]
    if (content.type === 'text') {
      // Extract JSON from response - handle potential control characters
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          // Clean the JSON string by removing control characters
          const cleanedJson = jsonMatch[0]
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ') // Remove control chars
            .replace(/\s+/g, ' ') // Normalize whitespace

          const result = JSON.parse(cleanedJson)

          console.log('[EnhancedLinks] AI analysis successful:', {
            confidence: result.confidence || 'unknown',
            reasoning: result.reasoning?.substring(0, 100) || 'none',
            insightCount: result.insightQueries?.length || 0,
            minichatCount: result.minichatQueries?.length || 0
          })

          return {
            insightQueries: result.insightQueries || [],
            minichatQueries: result.minichatQueries || [],
            confidence: result.confidence || 0.5,
            reasoning: result.reasoning || 'No metacognitive reasoning provided'
          }
        } catch (parseError) {
          console.error('[EnhancedLinks] JSON parsing failed:', parseError)
          // Try to extract at least the queries manually
          const insightMatch = content.text.match(/"insightQueries"\s*:\s*\[([\s\S]*?)\]/)
          const minichatMatch = content.text.match(/"minichatQueries"\s*:\s*\[([\s\S]*?)\]/)

          if (insightMatch && minichatMatch) {
            const extractQueries = (match: string) => {
              return match
                .match(/"([^"]+)"/g)
                ?.map(q => q.replace(/"/g, ''))
                .filter(q => q.length > 5) || []
            }

            return {
              insightQueries: extractQueries(insightMatch[1]),
              minichatQueries: extractQueries(minichatMatch[1]),
              confidence: 0.6,
              reasoning: 'Partial extraction from AI response (JSON parsing recovered)'
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('[EnhancedLinks] AI extraction failed:', error)
  }

  // Fallback with honest acknowledgment of limitations
  console.warn('[EnhancedLinks] Using fallback queries - AI extraction unavailable')
  return {
    insightQueries: [
      `${query} research paper 2024`,
      `${query} comprehensive guide`,
      `${topics[0] || query} best practices`
    ],
    minichatQueries: [
      `${query} practical tutorial`,
      `${query} implementation example`,
      `${topics[1] || query} step by step guide`
    ],
    confidence: 0.4,
    reasoning: 'Using template-based search queries as AI analysis is temporarily unavailable. Links will be from curated authoritative sources.'
  }
}

/**
 * Search web using multiple approaches for best results
 */
async function searchWeb(searchQuery: string): Promise<Array<{ url: string; title: string; snippet: string }>> {
  console.log(`[EnhancedLinks] Searching for: "${searchQuery.substring(0, 60)}..."`)

  try {
    const encodedQuery = encodeURIComponent(searchQuery)

    // Try DuckDuckGo lite (more reliable than HTML version)
    const response = await fetch(
      `https://lite.duckduckgo.com/lite/?q=${encodedQuery}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        signal: AbortSignal.timeout(8000) // 8 second timeout
      }
    )

    if (!response.ok) {
      console.warn(`[EnhancedLinks] DDG returned status ${response.status}, trying fallback`)
      return buildSmartFallback(searchQuery)
    }

    const html = await response.text()
    const results: Array<{ url: string; title: string; snippet: string }> = []

    // Parse DuckDuckGo Lite format - much simpler structure
    // Pattern: <a href="URL">TITLE</a> followed by <td class="result-snippet">SNIPPET</td>
    const linkPattern = /<a\s+rel="nofollow"\s+href="([^"]+)">([^<]+)<\/a>/gi
    const snippetPattern = /<td\s+class="result-snippet">([^<]+)</gi

    const links: Array<{ url: string; title: string }> = []
    let linkMatch
    while ((linkMatch = linkPattern.exec(html)) !== null && links.length < 8) {
      const url = linkMatch[1]
      const title = linkMatch[2]?.trim()

      // Filter out DDG internal links and ads
      if (url && title &&
          !url.includes('duckduckgo.com') &&
          !url.includes('//ad.') &&
          !url.startsWith('//') &&
          url.startsWith('http')) {
        links.push({ url, title })
      }
    }

    const snippets: string[] = []
    let snippetMatch
    while ((snippetMatch = snippetPattern.exec(html)) !== null && snippets.length < 8) {
      const snippet = snippetMatch[1]?.trim()
      if (snippet) {
        snippets.push(snippet)
      }
    }

    // Match links with snippets
    for (let i = 0; i < Math.min(links.length, snippets.length, 5); i++) {
      results.push({
        url: links[i].url,
        title: links[i].title,
        snippet: snippets[i]
      })
    }

    console.log(`[EnhancedLinks] Found ${results.length} real search results`)

    if (results.length > 0) {
      return results
    }

    console.warn('[EnhancedLinks] No results parsed from DDG, using smart fallback')
    return buildSmartFallback(searchQuery)
  } catch (error) {
    console.error('[EnhancedLinks] Web search error:', error)
    return buildSmartFallback(searchQuery)
  }
}

/**
 * Build smart fallback with curated authoritative sources
 */
function buildSmartFallback(query: string): Array<{ url: string; title: string; snippet: string }> {
  const encodedQuery = encodeURIComponent(query)
  const queryLower = query.toLowerCase()

  const results: Array<{ url: string; title: string; snippet: string }> = []

  // Detect query type and provide relevant sources
  const isAI = queryLower.includes('ai') || queryLower.includes('machine learning') || queryLower.includes('deep learning')
  const isCode = queryLower.includes('code') || queryLower.includes('programming') || queryLower.includes('development')
  const isHardware = queryLower.includes('computer') || queryLower.includes('gpu') || queryLower.includes('hardware') || queryLower.includes('workstation')
  const isResearch = queryLower.includes('research') || queryLower.includes('paper') || queryLower.includes('academic')

  // Economic/Finance query detection
  const isEconomic = queryLower.includes('economic') || queryLower.includes('economy') ||
    queryLower.includes('financial') || queryLower.includes('finance') ||
    queryLower.includes('world bank') || queryLower.includes('imf') ||
    queryLower.includes('world economic forum') || queryLower.includes('wef') ||
    queryLower.includes('gdp') || queryLower.includes('trillion') ||
    queryLower.includes('market') || queryLower.includes('trade') ||
    queryLower.includes('currency') || queryLower.includes('monetary') ||
    queryLower.includes('fiscal') || queryLower.includes('banking')

  // Add World Economic Forum for economic queries
  if (isEconomic) {
    results.push({
      url: `https://www.weforum.org/search?query=${encodedQuery}`,
      title: `${query.substring(0, 50)} - World Economic Forum`,
      snippet: 'Global economic insights, reports, and analysis from world leaders and experts'
    })
    results.push({
      url: `https://www.imf.org/en/Search#q=${encodedQuery}&sort=relevancy`,
      title: `${query.substring(0, 50)} - IMF Research`,
      snippet: 'International Monetary Fund data, research papers, and economic forecasts'
    })
    results.push({
      url: `https://data.worldbank.org/indicator?q=${encodedQuery}`,
      title: `${query.substring(0, 50)} - World Bank Data`,
      snippet: 'Open data and indicators on global development and economic metrics'
    })
    results.push({
      url: `https://www.federalreserve.gov/searchResults.htm?q=${encodedQuery}`,
      title: `${query.substring(0, 50)} - Federal Reserve`,
      snippet: 'US central bank research, monetary policy analysis, and economic data'
    })
    results.push({
      url: `https://www.oecd.org/en/search.html?q=${encodedQuery}`,
      title: `${query.substring(0, 50)} - OECD Reports`,
      snippet: 'Economic analysis and policy recommendations from OECD member countries'
    })
  }

  // Add GitHub for code-related queries
  if (isCode || isAI) {
    results.push({
      url: `https://github.com/search?q=${encodedQuery}&type=repositories&s=stars&o=desc`,
      title: `${query.substring(0, 60)} - Top GitHub Repositories`,
      snippet: 'Most starred and actively maintained open-source projects related to your query'
    })
  }

  // Add Papers with Code for AI research
  if (isAI || isResearch) {
    results.push({
      url: `https://paperswithcode.com/search?q=${encodedQuery}`,
      title: `${query.substring(0, 60)} - Papers with Code`,
      snippet: 'Latest ML research papers with reproducible code implementations and benchmarks'
    })
  }

  // Add Hugging Face for AI models
  if (isAI) {
    results.push({
      url: `https://huggingface.co/search/full-text?q=${encodedQuery}`,
      title: `${query.substring(0, 60)} - Hugging Face Models`,
      snippet: 'Pre-trained AI models, datasets, and practical implementations'
    })
  }

  // Add PCPartPicker for hardware queries
  if (isHardware) {
    results.push({
      url: `https://pcpartpicker.com/search/?q=${encodedQuery}`,
      title: `${query.substring(0, 60)} - Hardware & Build Guides`,
      snippet: 'Complete workstation builds with compatibility checks and price comparisons'
    })
  }

  // Add Stack Overflow for technical questions
  if (isCode || isAI) {
    results.push({
      url: `https://stackoverflow.com/search?q=${encodedQuery}`,
      title: `${query.substring(0, 60)} - Stack Overflow Discussions`,
      snippet: 'Community solutions and technical discussions from experienced developers'
    })
  }

  // Add arXiv for research papers
  if (isResearch || isAI) {
    results.push({
      url: `https://arxiv.org/search/?query=${encodedQuery}&searchtype=all&source=header`,
      title: `${query.substring(0, 60)} - arXiv Research Papers`,
      snippet: 'Open-access research papers and pre-prints in computer science and AI'
    })
  }

  // Always add Google Scholar as final fallback
  if (results.length < 3) {
    results.push({
      url: `https://scholar.google.com/scholar?q=${encodedQuery}&hl=en&as_sdt=0,5`,
      title: `${query.substring(0, 60)} - Academic Research`,
      snippet: 'Peer-reviewed academic papers and scholarly articles'
    })
  }

  // GUARANTEE: Always return at least 3 results with general sources
  if (results.length < 3) {
    // Wikipedia for general knowledge
    results.push({
      url: `https://en.wikipedia.org/w/index.php?search=${encodedQuery}`,
      title: `${query.substring(0, 60)} - Wikipedia`,
      snippet: 'Encyclopedia article with comprehensive background information'
    })
  }

  if (results.length < 3) {
    // Add a curated news source
    results.push({
      url: `https://news.google.com/search?q=${encodedQuery}`,
      title: `${query.substring(0, 60)} - Latest News`,
      snippet: 'Recent news and developments from verified sources'
    })
  }

  if (results.length < 3) {
    // Add general research
    results.push({
      url: `https://www.britannica.com/search?query=${encodedQuery}`,
      title: `${query.substring(0, 60)} - Britannica`,
      snippet: 'Expert-reviewed encyclopedia articles and educational content'
    })
  }

  console.log(`[EnhancedLinks] Built ${results.length} smart fallback links (Economic:${isEconomic}, AI:${isAI}, Code:${isCode}, Hardware:${isHardware})`)

  return results.slice(0, 5) // Return max 5
}

/**
 * Calculate relevance score with authority boosting
 */
async function calculateRelevance(
  link: { url: string; title: string; snippet: string },
  query: string,
  conversationContext: string
): Promise<number> {
  // Keyword matching
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  const combinedText = (link.title + ' ' + link.snippet).toLowerCase()

  let score = 0.4

  // Keyword relevance
  queryWords.forEach(word => {
    if (combinedText.includes(word)) {
      score += 0.12
    }
  })

  // Boost for highly authoritative domains
  // Economic/Finance authorities
  if (link.url.includes('weforum.org')) {
    score += 0.28 // Highest boost for World Economic Forum
  } else if (link.url.includes('imf.org')) {
    score += 0.27 // Very high boost for IMF
  } else if (link.url.includes('worldbank.org')) {
    score += 0.26 // Very high boost for World Bank
  } else if (link.url.includes('federalreserve.gov')) {
    score += 0.25 // High boost for Federal Reserve
  } else if (link.url.includes('oecd.org')) {
    score += 0.24 // High boost for OECD
  } else if (link.url.includes('bis.org')) {
    score += 0.24 // High boost for BIS (Bank for International Settlements)
  }
  // AI/ML authorities
  else if (link.url.includes('paperswithcode.com')) {
    score += 0.25 // Highest boost for Papers with Code
  } else if (link.url.includes('huggingface.co')) {
    score += 0.23 // High boost for Hugging Face
  } else if (link.url.includes('arxiv.org')) {
    score += 0.20 // High boost for arXiv
  } else if (link.url.includes('github.com')) {
    score += 0.18 // Good boost for GitHub
  } else if (link.url.includes('stackoverflow.com')) {
    score += 0.16 // Good boost for Stack Overflow
  } else if (link.url.includes('pcpartpicker.com')) {
    score += 0.16 // Good boost for PC builds
  } else if (link.url.includes('scholar.google')) {
    score += 0.15 // Moderate boost for Google Scholar
  } else if (link.url.includes('.edu') || link.url.includes('.gov')) {
    score += 0.14 // Moderate boost for academic/government
  } else if (link.url.includes('medium.com') || link.url.includes('towardsdatascience.com')) {
    score += 0.10 // Small boost for tech blogs
  }
  // Penalize generic search engines appearing as links
  else if (link.url.includes('google.com/search') || link.url.includes('bing.com/search') || link.url.includes('duckduckgo.com/?q')) {
    score -= 0.30 // Heavy penalty for generic search links
  }

  return Math.min(score, 1.0)
}

/**
 * Main API handler
 */
export async function POST(request: NextRequest) {
  try {
    const { query, conversationContext = '', topics = [] } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    console.log('[EnhancedLinks] Analyzing:', {
      query: query.substring(0, 100),
      topics: topics.slice(0, 3),
      contextLength: conversationContext.length
    })

    // Step 1: Use AI to extract targeted search queries with metacognitive awareness
    const { insightQueries, minichatQueries, confidence, reasoning } = await extractSearchQueries(
      query,
      conversationContext,
      topics
    )

    console.log('[EnhancedLinks] Search queries (with metacognition):', {
      insight: insightQueries,
      minichat: minichatQueries,
      confidence: `${(confidence * 100).toFixed(0)}%`,
      reasoning: reasoning.substring(0, 150)
    })

    // Step 2: Search for each query
    const allLinks: DiscoveredLink[] = []
    const seenUrls = new Set<string>()

    // Search for Insight links
    for (const searchQuery of insightQueries) {
      const results = await searchWeb(searchQuery)

      for (const result of results) {
        if (seenUrls.has(result.url)) continue
        seenUrls.add(result.url)

        const relevance = await calculateRelevance(result, query, conversationContext)

        allLinks.push({
          id: `insight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url: result.url,
          title: result.title,
          snippet: result.snippet,
          relevance,
          source: extractDomain(result.url),
          type: 'insight',
          searchQuery
        })
      }
    }

    // Search for MiniChat links
    for (const searchQuery of minichatQueries) {
      const results = await searchWeb(searchQuery)

      for (const result of results) {
        if (seenUrls.has(result.url)) continue
        seenUrls.add(result.url)

        const relevance = await calculateRelevance(result, query, conversationContext)

        allLinks.push({
          id: `minichat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url: result.url,
          title: result.title,
          snippet: result.snippet,
          relevance,
          source: extractDomain(result.url),
          type: 'minichat',
          searchQuery
        })
      }
    }

    // Step 3: Sort by relevance and take top 3 for each type
    let insightLinks = allLinks
      .filter(l => l.type === 'insight')
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 3)

    let minichatLinks = allLinks
      .filter(l => l.type === 'minichat')
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 3)

    // SAFETY NET: If we have no links, generate fallback directly from original query
    if (insightLinks.length === 0 && minichatLinks.length === 0) {
      console.warn('[EnhancedLinks] No links found through search, using direct fallback')
      const fallbackResults = buildSmartFallback(query)

      // Split fallback results between insight and minichat
      for (let i = 0; i < fallbackResults.length; i++) {
        const result = fallbackResults[i]
        const type = i % 2 === 0 ? 'insight' : 'minichat'
        const relevance = await calculateRelevance(result, query, conversationContext)

        const link: DiscoveredLink = {
          id: `${type}-fallback-${Date.now()}-${i}`,
          url: result.url,
          title: result.title,
          snippet: result.snippet,
          relevance: Math.max(relevance, 0.75), // Ensure minimum relevance for fallback
          source: extractDomain(result.url),
          type: type as 'insight' | 'minichat',
          searchQuery: query
        }

        if (type === 'insight') {
          insightLinks.push(link)
        } else {
          minichatLinks.push(link)
        }
      }

      // Ensure both have at least some links
      insightLinks = insightLinks.slice(0, 3)
      minichatLinks = minichatLinks.slice(0, 3)
    }

    console.log('[EnhancedLinks] Results:', {
      insightCount: insightLinks.length,
      minichatCount: minichatLinks.length,
      avgRelevance: {
        insight: insightLinks.length > 0 ? insightLinks.reduce((a, b) => a + b.relevance, 0) / insightLinks.length : 0,
        minichat: minichatLinks.length > 0 ? minichatLinks.reduce((a, b) => a + b.relevance, 0) / minichatLinks.length : 0
      }
    })

    return NextResponse.json({
      success: true,
      insightLinks,
      minichatLinks,
      query,
      searchQueries: {
        insight: insightQueries,
        minichat: minichatQueries
      },
      metacognition: {
        confidence,
        reasoning
      }
    })
  } catch (error) {
    console.error('[EnhancedLinks] Error:', error)
    return NextResponse.json(
      {
        error: 'Link discovery failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
