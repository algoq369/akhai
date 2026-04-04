/**
 * URL Visitor System — Detect and fetch content from shared links in queries
 *
 * Extracted from app/api/simple-query/route.ts
 */

import { log } from '@/lib/logger';
import { hasURLs, detectURLs } from '@/lib/url-detector';
import { fetchMultipleURLs, buildURLContext } from '@/lib/url-content-fetcher';

export interface URLVisitorResult {
  urlContext: string;
  urlsFetched: { url: string; type: string; success: boolean; title?: string }[];
}

/**
 * Detect URLs in a query, fetch their content, and build context for injection.
 */
export async function visitURLs(query: string): Promise<URLVisitorResult> {
  let urlContext = '';
  let urlsFetched: URLVisitorResult['urlsFetched'] = [];

  if (!hasURLs(query)) {
    return { urlContext, urlsFetched };
  }

  const detectedURLs = detectURLs(query);
  log('INFO', 'URL_FETCH', `Detected ${detectedURLs.length} URLs in query`);

  try {
    const fetchedContents = await fetchMultipleURLs(
      detectedURLs.map((d) => d.url),
      3 // Max 3 URLs per query
    );

    urlsFetched = fetchedContents.map((c) => ({
      url: c.url,
      type: c.type,
      success: c.success,
      title: c.title,
    }));

    const successCount = fetchedContents.filter((c) => c.success).length;
    log('INFO', 'URL_FETCH', `Successfully fetched ${successCount}/${detectedURLs.length} URLs`);

    // Build context from fetched content
    urlContext = buildURLContext(fetchedContents);

    if (urlContext) {
      log('INFO', 'URL_FETCH', `URL context built: ${urlContext.length} chars`);
    }
  } catch (urlError) {
    log('WARN', 'URL_FETCH', `URL fetching failed: ${urlError}`);
  }

  return { urlContext, urlsFetched };
}
