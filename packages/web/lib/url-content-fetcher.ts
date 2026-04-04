/**
 * URL Content Fetcher
 * Fetches and extracts content from various URL types
 * Supports: YouTube (with transcripts), Twitter/X, GitHub, Webpages
 */

import { detectURLs, type DetectedURL, type URLType } from './url-detector';
import {
  fetchYouTubeContent,
  fetchTwitterContent,
  decodeHTMLEntities,
} from './url-content-parsers';

export { fetchYouTubeContent, fetchTwitterContent };

export interface FetchedContent {
  url: string;
  type: URLType;
  success: boolean;
  title?: string;
  description?: string;
  content?: string;
  author?: string;
  publishedAt?: string;
  metadata?: Record<string, any>;
  error?: string;
}

export interface YouTubeContent extends FetchedContent {
  type: 'youtube';
  videoId?: string;
  channelName?: string;
  viewCount?: string;
  duration?: string;
  transcript?: string;
  thumbnailUrl?: string;
}

export interface TwitterContent extends FetchedContent {
  type: 'twitter';
  tweetId?: string;
  username?: string;
  tweetText?: string;
  mediaUrls?: string[];
  retweets?: number;
  likes?: number;
  isThread?: boolean;
}

export interface GitHubContent extends FetchedContent {
  type: 'github';
  owner?: string;
  repo?: string;
  stars?: number;
  forks?: number;
  language?: string;
  readme?: string;
  topics?: string[];
}

// ============================================================================
// GITHUB FETCHER
// ============================================================================

/**
 * Fetch GitHub repository content
 */
export async function fetchGitHubContent(url: string, repoPath?: string): Promise<GitHubContent> {
  console.log(`[URL_FETCH] Fetching GitHub repo: ${repoPath || url}`);

  const result: GitHubContent = {
    url,
    type: 'github',
    success: false,
  };

  // Extract owner/repo from URL
  const match = url.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);
  if (match) {
    result.owner = match[1];
    result.repo = match[2].replace('.git', '');
  }

  if (!result.owner || !result.repo) {
    result.error = 'Invalid GitHub URL';
    return result;
  }

  try {
    // Fetch repo metadata from GitHub API
    const apiUrl = `https://api.github.com/repos/${result.owner}/${result.repo}`;
    const res = await fetch(apiUrl, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'AkhAI/1.0',
      },
    });

    if (res.ok) {
      const repo = await res.json();
      result.title = repo.full_name;
      result.description = repo.description;
      result.stars = repo.stargazers_count;
      result.forks = repo.forks_count;
      result.language = repo.language;
      result.topics = repo.topics || [];
      result.author = repo.owner?.login;
      result.publishedAt = repo.created_at;
      result.success = true;
    }

    // Fetch README content
    const readmeUrl = `https://api.github.com/repos/${result.owner}/${result.repo}/readme`;
    const readmeRes = await fetch(readmeUrl, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'AkhAI/1.0',
      },
    });

    if (readmeRes.ok) {
      const readmeData = await readmeRes.json();
      if (readmeData.content) {
        const decodedReadme = Buffer.from(readmeData.content, 'base64').toString('utf-8');
        // Truncate README to first 2000 chars for context
        result.readme = decodedReadme.substring(0, 2000);
        if (decodedReadme.length > 2000) {
          result.readme += '\n... [README truncated]';
        }
      }
    }

    // Build content summary
    result.content = buildGitHubContentSummary(result);
  } catch (error) {
    console.error(`[URL_FETCH] GitHub fetch error:`, error);
    result.error = error instanceof Error ? error.message : 'Failed to fetch GitHub content';
  }

  return result;
}

/**
 * Build GitHub content summary for AI
 */
function buildGitHubContentSummary(content: GitHubContent): string {
  const parts: string[] = [];

  parts.push(`=== GITHUB REPOSITORY ===`);
  if (content.title) parts.push(`Repository: ${content.title}`);
  if (content.description) parts.push(`Description: ${content.description}`);
  if (content.language) parts.push(`Primary Language: ${content.language}`);
  if (content.stars) parts.push(`Stars: ${content.stars.toLocaleString()}`);
  if (content.forks) parts.push(`Forks: ${content.forks.toLocaleString()}`);
  if (content.topics && content.topics.length > 0) {
    parts.push(`Topics: ${content.topics.join(', ')}`);
  }

  if (content.readme) {
    parts.push(`\n--- README PREVIEW ---`);
    parts.push(content.readme);
    parts.push(`--- END README ---`);
  }

  return parts.join('\n');
}

// ============================================================================
// GENERIC WEBPAGE FETCHER
// ============================================================================

/**
 * Fetch generic webpage content
 */
export async function fetchWebpageContent(url: string): Promise<FetchedContent> {
  console.log(`[URL_FETCH] Fetching webpage: ${url}`);

  const result: FetchedContent = {
    url,
    type: 'webpage',
    success: false,
  };

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AkhAI/1.0; +https://akhai.app)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!res.ok) {
      result.error = `HTTP ${res.status}`;
      return result;
    }

    const html = await res.text();

    // Extract metadata
    result.title =
      extractMetaContent(html, 'og:title') ||
      extractMetaContent(html, 'twitter:title') ||
      html.match(/<title>([^<]+)<\/title>/i)?.[1];

    result.description =
      extractMetaContent(html, 'og:description') ||
      extractMetaContent(html, 'description') ||
      extractMetaContent(html, 'twitter:description');

    result.author = extractMetaContent(html, 'author') || extractMetaContent(html, 'og:site_name');

    result.publishedAt =
      extractMetaContent(html, 'article:published_time') ||
      extractMetaContent(html, 'datePublished');

    // Extract main content
    const mainContent = extractMainContent(html);
    if (mainContent) {
      result.content = mainContent;
    }

    result.success = !!(result.title || result.content);

    // Build summary
    if (result.success) {
      result.content = buildWebpageContentSummary(result);
    }
  } catch (error) {
    console.error(`[URL_FETCH] Webpage fetch error:`, error);
    result.error = error instanceof Error ? error.message : 'Failed to fetch webpage';
  }

  return result;
}

/**
 * Extract meta tag content
 */
function extractMetaContent(html: string, name: string): string | undefined {
  // Try property attribute (Open Graph)
  const propMatch = html.match(
    new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i')
  );
  if (propMatch?.[1]) return decodeHTMLEntities(propMatch[1]);

  // Try name attribute
  const nameMatch = html.match(
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i')
  );
  if (nameMatch?.[1]) return decodeHTMLEntities(nameMatch[1]);

  // Try reverse order (content before name/property)
  const reverseMatch = html.match(
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`, 'i')
  );
  if (reverseMatch?.[1]) return decodeHTMLEntities(reverseMatch[1]);

  return undefined;
}

/**
 * Extract main content from HTML
 */
function extractMainContent(html: string): string | null {
  // Remove scripts, styles, and nav elements
  let cleaned = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '');

  // Try to find article or main content
  const articleMatch = cleaned.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const mainMatch = cleaned.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const contentMatch = cleaned.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

  let content = articleMatch?.[1] || mainMatch?.[1] || contentMatch?.[1] || cleaned;

  // Strip remaining HTML tags
  content = content.replace(/<[^>]+>/g, ' ');

  // Clean up whitespace
  content = content
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();

  // Truncate to reasonable length
  if (content.length > 3000) {
    content = content.substring(0, 3000) + '... [content truncated]';
  }

  return content.length > 100 ? content : null;
}

/**
 * Build webpage content summary for AI
 */
function buildWebpageContentSummary(content: FetchedContent): string {
  const parts: string[] = [];

  parts.push(`=== WEB PAGE CONTENT ===`);
  parts.push(`URL: ${content.url}`);
  if (content.title) parts.push(`Title: ${content.title}`);
  if (content.author) parts.push(`Source: ${content.author}`);
  if (content.publishedAt) parts.push(`Published: ${content.publishedAt}`);
  if (content.description) parts.push(`Summary: ${content.description}`);

  if (content.content && content.content !== content.description) {
    parts.push(`\n--- PAGE CONTENT ---`);
    parts.push(content.content);
    parts.push(`--- END CONTENT ---`);
  }

  return parts.join('\n');
}

// ============================================================================
// MAIN FETCH FUNCTION
// ============================================================================

/**
 * Fetch content from any URL (auto-detects type)
 */
export async function fetchURLContent(url: string): Promise<FetchedContent> {
  const detected = detectURLs(url)[0];

  if (!detected) {
    return {
      url,
      type: 'webpage',
      success: false,
      error: 'Invalid URL',
    };
  }

  switch (detected.type) {
    case 'youtube':
      return fetchYouTubeContent(url, detected.id || '');
    case 'twitter':
      return fetchTwitterContent(url, detected.id);
    case 'github':
      return fetchGitHubContent(url, detected.id);
    default:
      return fetchWebpageContent(url);
  }
}

/**
 * Fetch multiple URLs (with limit)
 */
export async function fetchMultipleURLs(
  urls: string[],
  maxUrls: number = 3
): Promise<FetchedContent[]> {
  const detected = urls.flatMap((url) => detectURLs(url));
  const uniqueUrls = [...new Set(detected.map((d) => d.url))].slice(0, maxUrls);

  console.log(`[URL_FETCH] Fetching ${uniqueUrls.length} URLs (max ${maxUrls})`);

  const results = await Promise.all(uniqueUrls.map((url) => fetchURLContent(url)));

  const successful = results.filter((r) => r.success);
  console.log(`[URL_FETCH] Successfully fetched ${successful.length}/${uniqueUrls.length} URLs`);

  return results;
}

/**
 * Build combined context from multiple fetched URLs
 */
export function buildURLContext(fetchedContents: FetchedContent[]): string {
  const successful = fetchedContents.filter((c) => c.success && c.content);

  if (successful.length === 0) {
    return '';
  }

  const parts: string[] = [
    `\n[URL CONTENT - The user shared ${successful.length} link(s). Here is the content:]\n`,
  ];

  for (const content of successful) {
    parts.push(content.content || '');
    parts.push('\n');
  }

  parts.push(`[END URL CONTENT]\n`);

  return parts.join('\n');
}
