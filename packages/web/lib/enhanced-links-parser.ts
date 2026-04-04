/**
 * HTML parsing utilities for DuckDuckGo search result extraction
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

/**
 * Parse DDG HTML response into structured search results.
 * Extracts links and snippets, skipping ads and internal DDG pages.
 */
export function parseDDGResults(
  html: string,
  searchQuery: string
): Array<{ url: string; title: string; snippet: string }> {
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

  return results;
}
