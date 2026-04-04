/**
 * Enhanced AI-Powered Link Discovery API
 * Uses conversation context to find highly relevant, authoritative links
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { calculateRelevance } from './relevance';

export const dynamic = 'force-dynamic';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface DiscoveredLink {
  id: string;
  url: string;
  title: string;
  snippet: string;
  relevance: number;
  source: string;
  type: 'insight' | 'minichat';
  searchQuery: string;
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    const parts = domain.split('.');
    if (parts.length >= 2) {
      return parts[parts.length - 2].charAt(0).toUpperCase() + parts[parts.length - 2].slice(1);
    }
    return domain;
  } catch {
    return 'Unknown';
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
  insightQueries: string[];
  minichatQueries: string[];
  confidence: number;
  reasoning: string;
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
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      // Extract JSON from response - handle potential control characters
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          // Clean the JSON string by removing control characters
          const cleanedJson = jsonMatch[0]
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ') // Remove control chars
            .replace(/\s+/g, ' '); // Normalize whitespace

          const result = JSON.parse(cleanedJson);

          console.log('[EnhancedLinks] AI analysis successful:', {
            confidence: result.confidence || 'unknown',
            reasoning: result.reasoning?.substring(0, 100) || 'none',
            insightCount: result.insightQueries?.length || 0,
            minichatCount: result.minichatQueries?.length || 0,
          });

          return {
            insightQueries: result.insightQueries || [],
            minichatQueries: result.minichatQueries || [],
            confidence: result.confidence || 0.5,
            reasoning: result.reasoning || 'No metacognitive reasoning provided',
          };
        } catch (parseError) {
          console.error('[EnhancedLinks] JSON parsing failed:', parseError);
          // Try to extract at least the queries manually
          const insightMatch = content.text.match(/"insightQueries"\s*:\s*\[([\s\S]*?)\]/);
          const minichatMatch = content.text.match(/"minichatQueries"\s*:\s*\[([\s\S]*?)\]/);

          if (insightMatch && minichatMatch) {
            const extractQueries = (match: string) => {
              return (
                match
                  .match(/"([^"]+)"/g)
                  ?.map((q) => q.replace(/"/g, ''))
                  .filter((q) => q.length > 5) || []
              );
            };

            return {
              insightQueries: extractQueries(insightMatch[1]),
              minichatQueries: extractQueries(minichatMatch[1]),
              confidence: 0.6,
              reasoning: 'Partial extraction from AI response (JSON parsing recovered)',
            };
          }
        }
      }
    }
  } catch (error) {
    console.error('[EnhancedLinks] AI extraction failed:', error);
  }

  // Fallback with honest acknowledgment of limitations
  console.warn('[EnhancedLinks] Using fallback queries - AI extraction unavailable');
  return {
    insightQueries: [
      `${query} research paper 2024`,
      `${query} comprehensive guide`,
      `${topics[0] || query} best practices`,
    ],
    minichatQueries: [
      `${query} practical tutorial`,
      `${query} implementation example`,
      `${topics[1] || query} step by step guide`,
    ],
    confidence: 0.4,
    reasoning:
      'Using template-based search queries as AI analysis is temporarily unavailable. Links will be from curated authoritative sources.',
  };
}

/**
 * Unwrap DDG redirect URLs to get the real destination URL.
 * GET requests wrap URLs as //duckduckgo.com/l/?uddg=ENCODED_URL&rut=...
 * POST requests usually return direct URLs but may still wrap them.
 */
function unwrapDDGUrl(rawUrl: string): string {
  // Handle HTML entity encoded ampersands
  const url = rawUrl.replace(/&amp;/g, '&');

  // DDG redirect format: //duckduckgo.com/l/?uddg=REAL_URL
  if (url.includes('duckduckgo.com/l/?uddg=')) {
    try {
      const queryString = url.split('?')[1];
      const params = new URLSearchParams(queryString);
      const realUrl = params.get('uddg');
      if (realUrl) return decodeURIComponent(realUrl);
    } catch {
      /* fall through */
    }
  }

  return rawUrl;
}

/**
 * Detect DDG CAPTCHA/bot-detection pages
 */
function isCaptchaResponse(html: string): boolean {
  return html.includes('anomaly-modal') || html.includes('bots use DuckDuckGo');
}

/**
 * Check if a URL is a valid search result (not DDG internal, not an ad)
 * Returns the cleaned URL if valid.
 */
function isValidResultUrl(
  rawUrl: string | undefined,
  title: string | undefined
): { valid: boolean; url: string } {
  if (!rawUrl || !title || title.length < 3) return { valid: false, url: '' };

  // Unwrap DDG redirect first
  const url = unwrapDDGUrl(rawUrl);

  // Reject DDG ad tracking links
  if (url.includes('duckduckgo.com/y.js')) return { valid: false, url: '' };
  // Reject DDG internal pages (but not unwrapped real URLs)
  if (url.includes('duckduckgo.com') && !url.startsWith('http')) return { valid: false, url: '' };
  // Reject ad URLs
  if (url.includes('//ad.') || url.includes('/ad/')) return { valid: false, url: '' };
  // Must be a proper http(s) URL
  if (!url.startsWith('http')) return { valid: false, url: '' };

  return { valid: true, url };
}

// Simple in-memory cache to avoid hitting DDG repeatedly for the same query
const ddgCache = new Map<
  string,
  { results: Array<{ url: string; title: string; snippet: string }>; ts: number }
>();
const DDG_CACHE_TTL = 10 * 60 * 1000; // 10 minutes — longer to reduce DDG hits

// Track CAPTCHA state to avoid hammering DDG when rate-limited
let ddgRateLimitedUntil = 0;
const DDG_RATE_LIMIT_BACKOFF = 3 * 60 * 1000; // 3 minutes backoff after CAPTCHA

/**
 * Search web using DuckDuckGo HTML with POST method.
 * POST is more reliable than GET (less aggressive bot detection).
 */
async function searchWeb(
  searchQuery: string
): Promise<Array<{ url: string; title: string; snippet: string }>> {
  console.log(`[DDG] Searching: "${searchQuery.substring(0, 80)}"`);

  // Check cache first
  const cached = ddgCache.get(searchQuery);
  if (cached && Date.now() - cached.ts < DDG_CACHE_TTL) {
    console.log(
      `[DDG] Cache hit: "${searchQuery.substring(0, 40)}" → ${cached.results.length} results`
    );
    return cached.results;
  }

  // Skip DDG if we were recently rate-limited (avoid wasting requests)
  if (Date.now() < ddgRateLimitedUntil) {
    const secsLeft = Math.round((ddgRateLimitedUntil - Date.now()) / 1000);
    console.warn(`[DDG] Skipping — rate-limited, ${secsLeft}s remaining`);
    return [];
  }

  try {
    const encodedQuery = encodeURIComponent(searchQuery);

    const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodedQuery}`, {
      method: 'POST',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Content-Type': 'application/x-www-form-urlencoded',
        Referer: 'https://html.duckduckgo.com/',
        Connection: 'close',
      },
      body: `q=${encodedQuery}&b=`,
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.warn(`[DDG] Failed: "${searchQuery.substring(0, 40)}" → status: ${response.status}`);
      return [];
    }

    const html = await response.text();

    // Detect CAPTCHA/bot-detection
    if (isCaptchaResponse(html)) {
      ddgRateLimitedUntil = Date.now() + DDG_RATE_LIMIT_BACKOFF;
      console.warn(
        `[DDG] CAPTCHA detected for: "${searchQuery.substring(0, 40)}" — backing off ${DDG_RATE_LIMIT_BACKOFF / 1000}s`
      );
      return [];
    }

    const results: Array<{ url: string; title: string; snippet: string }> = [];

    // Parse result__a links: <a rel="nofollow" class="result__a" href="URL">Title</a>
    const resultLinkPattern = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
    // Parse snippets: <a class="result__snippet" href="URL">text with <b>bold</b> words</a>
    const snippetPattern = /class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;

    const links: Array<{ url: string; title: string }> = [];
    let linkMatch;
    while ((linkMatch = resultLinkPattern.exec(html)) !== null && links.length < 10) {
      const rawUrl = linkMatch[1];
      const title = linkMatch[2]?.trim();
      const check = isValidResultUrl(rawUrl, title);
      if (check.valid) {
        links.push({ url: check.url, title });
      }
    }

    // Extract snippets (may contain <b> tags for highlighted terms)
    const snippets: string[] = [];
    let snippetMatch;
    while ((snippetMatch = snippetPattern.exec(html)) !== null && snippets.length < 10) {
      // Strip HTML tags from snippet, decode entities
      const raw = snippetMatch[1]
        ?.replace(/<[^>]*>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#x27;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
      // Skip ad snippets (they're typically long marketing copy)
      if (raw && raw.length > 10) snippets.push(raw);
    }

    // Filter out ad snippets (first N snippets may be ads)
    // Ad result__a links were already filtered by isValidResultUrl (duckduckgo.com/y.js check)

    // Match links with their corresponding snippets
    // Snippets include ads, so we need to offset: skip ad snippets
    const adCount = html.match(/result--ad/g)?.length || 0;
    const organicSnippets = snippets.slice(adCount);

    for (let i = 0; i < Math.min(links.length, 8); i++) {
      results.push({
        url: links[i].url,
        title: links[i].title,
        snippet: organicSnippets[i] || `Search result for: ${searchQuery.substring(0, 60)}`,
      });
    }

    console.log(`[DDG] Searching: "${searchQuery.substring(0, 40)}" → ${results.length} results`);

    // Cache successful results
    if (results.length > 0) {
      ddgCache.set(searchQuery, { results, ts: Date.now() });
    }

    return results;
  } catch (error) {
    console.error(
      `[DDG] Failed: "${searchQuery.substring(0, 40)}" → ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return [];
  }
}

// Small delay helper to avoid DDG rate-limiting between consecutive requests
function ddgDelay(ms: number = 1500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Main API handler
 */
export async function POST(request: NextRequest) {
  try {
    const { query, conversationContext = '', topics = [] } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    console.log('[EnhancedLinks] Analyzing:', {
      query: query.substring(0, 100),
      topics: topics.slice(0, 3),
      contextLength: conversationContext.length,
    });

    // Step 1: Use AI to extract targeted search queries with metacognitive awareness
    const { insightQueries, minichatQueries, confidence, reasoning } = await extractSearchQueries(
      query,
      conversationContext,
      topics
    );

    console.log('[EnhancedLinks] Search queries (with metacognition):', {
      insight: insightQueries,
      minichat: minichatQueries,
      confidence: `${(confidence * 100).toFixed(0)}%`,
      reasoning: reasoning.substring(0, 150),
    });

    // Step 2: Search DDG — limit to 1 query per type to avoid rate-limiting
    // DDG aggressively rate-limits: 6 requests triggers CAPTCHA
    const allLinks: DiscoveredLink[] = [];
    const seenUrls = new Set<string>();

    // Search for Insight links (use first query only)
    if (insightQueries.length > 0) {
      const results = await searchWeb(insightQueries[0]);
      for (const result of results) {
        if (seenUrls.has(result.url)) continue;
        seenUrls.add(result.url);
        const relevance = await calculateRelevance(result, query, conversationContext);
        allLinks.push({
          id: `insight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url: result.url,
          title: result.title,
          snippet: result.snippet,
          relevance,
          source: extractDomain(result.url),
          type: 'insight',
          searchQuery: insightQueries[0],
        });
      }
    }

    // Delay between DDG requests to avoid rate-limiting
    await ddgDelay(1500);

    // Search for MiniChat links (use first query only)
    if (minichatQueries.length > 0) {
      const results = await searchWeb(minichatQueries[0]);
      for (const result of results) {
        if (seenUrls.has(result.url)) continue;
        seenUrls.add(result.url);
        const relevance = await calculateRelevance(result, query, conversationContext);
        allLinks.push({
          id: `minichat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url: result.url,
          title: result.title,
          snippet: result.snippet,
          relevance,
          source: extractDomain(result.url),
          type: 'minichat',
          searchQuery: minichatQueries[0],
        });
      }
    }

    // Step 3: Sort by relevance and take top 3 for each type
    const insightLinks = allLinks
      .filter((l) => l.type === 'insight')
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 3);

    const minichatLinks = allLinks
      .filter((l) => l.type === 'minichat')
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 3);

    const searchUnavailable = insightLinks.length === 0 && minichatLinks.length === 0;
    if (searchUnavailable) {
      console.warn('[DDG] Search unavailable — 0 results for all queries (likely rate-limited)');
    }

    console.log('[EnhancedLinks] Results:', {
      insightCount: insightLinks.length,
      minichatCount: minichatLinks.length,
      searchUnavailable,
    });

    return NextResponse.json({
      success: true,
      insightLinks,
      minichatLinks,
      searchUnavailable,
      query,
      searchQueries: {
        insight: insightQueries.slice(0, 1),
        minichat: minichatQueries.slice(0, 1),
      },
      metacognition: {
        confidence,
        reasoning,
      },
    });
  } catch (error) {
    console.error('[EnhancedLinks] Error:', error);
    return NextResponse.json(
      {
        error: 'Link discovery failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
