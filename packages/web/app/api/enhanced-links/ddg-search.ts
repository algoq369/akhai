/**
 * DuckDuckGo search utilities extracted from enhanced-links route.ts
 */

/**
 * Unwrap DDG redirect URLs to get the real destination URL.
 * GET requests wrap URLs as //duckduckgo.com/l/?uddg=ENCODED_URL&rut=...
 * POST requests usually return direct URLs but may still wrap them.
 */
export function unwrapDDGUrl(rawUrl: string): string {
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
export function isCaptchaResponse(html: string): boolean {
  return html.includes('anomaly-modal') || html.includes('bots use DuckDuckGo');
}

/**
 * Check if a URL is a valid search result (not DDG internal, not an ad)
 * Returns the cleaned URL if valid.
 */
export function isValidResultUrl(
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
export async function searchWeb(
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
export function ddgDelay(ms: number = 1500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate relevance score with authority boosting
 */
export async function calculateRelevance(
  link: { url: string; title: string; snippet: string },
  query: string,
  conversationContext: string
): Promise<number> {
  // Keyword matching
  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3);
  const combinedText = (link.title + ' ' + link.snippet).toLowerCase();

  let score = 0.4;

  // Keyword relevance
  queryWords.forEach((word) => {
    if (combinedText.includes(word)) {
      score += 0.12;
    }
  });

  // Boost for highly authoritative domains
  // Economic/Finance authorities
  if (link.url.includes('weforum.org')) {
    score += 0.28; // Highest boost for World Economic Forum
  } else if (link.url.includes('imf.org')) {
    score += 0.27; // Very high boost for IMF
  } else if (link.url.includes('worldbank.org')) {
    score += 0.26; // Very high boost for World Bank
  } else if (link.url.includes('federalreserve.gov')) {
    score += 0.25; // High boost for Federal Reserve
  } else if (link.url.includes('oecd.org')) {
    score += 0.24; // High boost for OECD
  } else if (link.url.includes('bis.org')) {
    score += 0.24; // High boost for BIS (Bank for International Settlements)
  }
  // AI/ML authorities
  else if (link.url.includes('paperswithcode.com')) {
    score += 0.25; // Highest boost for Papers with Code
  } else if (link.url.includes('huggingface.co')) {
    score += 0.23; // High boost for Hugging Face
  } else if (link.url.includes('arxiv.org')) {
    score += 0.2; // High boost for arXiv
  } else if (link.url.includes('github.com')) {
    score += 0.18; // Good boost for GitHub
  } else if (link.url.includes('stackoverflow.com')) {
    score += 0.16; // Good boost for Stack Overflow
  } else if (link.url.includes('pcpartpicker.com')) {
    score += 0.16; // Good boost for PC builds
  } else if (link.url.includes('scholar.google')) {
    score += 0.15; // Moderate boost for Google Scholar
  } else if (link.url.includes('.edu') || link.url.includes('.gov')) {
    score += 0.14; // Moderate boost for academic/government
  } else if (link.url.includes('medium.com') || link.url.includes('towardsdatascience.com')) {
    score += 0.1; // Small boost for tech blogs
  }
  // Penalize generic search engines appearing as links
  else if (
    link.url.includes('google.com/search') ||
    link.url.includes('bing.com/search') ||
    link.url.includes('duckduckgo.com/?q')
  ) {
    score -= 0.3; // Heavy penalty for generic search links
  }

  return Math.min(score, 1.0);
}
