/**
 * Universal URL Fetcher API
 *
 * Handles: YouTube, X/Twitter, GitHub, any webpage
 * Returns structured content for AI analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type URLType = 'youtube' | 'twitter' | 'github' | 'webpage';

interface FetchResult {
  success: boolean;
  url: string;
  type: URLType;
  title: string;
  description: string;
  content: string;
  author?: string;
  date?: string;
  metadata?: Record<string, any>;
}

/**
 * Detect URL type from URL string
 */
function detectURLType(url: string): URLType {
  const urlLower = url.toLowerCase();

  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
    return 'youtube';
  }
  if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) {
    return 'twitter';
  }
  if (urlLower.includes('github.com')) {
    return 'github';
  }

  return 'webpage';
}

/**
 * Fetch YouTube video metadata
 */
async function fetchYouTube(url: string): Promise<FetchResult> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract from meta tags and LD+JSON
    const title = $('meta[name="title"]').attr('content') ||
                  $('meta[property="og:title"]').attr('content') ||
                  $('title').text();

    const description = $('meta[name="description"]').attr('content') ||
                        $('meta[property="og:description"]').attr('content') || '';

    const author = $('link[itemprop="name"]').attr('content') ||
                   $('meta[name="author"]').attr('content') || '';

    // Try to extract from LD+JSON
    let views = '';
    let publishDate = '';

    $('script[type="application/ld+json"]').each((_: number, element: any) => {
      try {
        const data = JSON.parse($(element).html() || '{}');
        if (data.interactionCount) {
          views = data.interactionCount;
        }
        if (data.uploadDate) {
          publishDate = data.uploadDate;
        }
      } catch (e) {
        // Skip invalid JSON
      }
    });

    const content = `YouTube Video: ${title}
Channel: ${author}
Description: ${description}
${views ? `Views: ${views}` : ''}
${publishDate ? `Published: ${publishDate}` : ''}`;

    return {
      success: true,
      url,
      type: 'youtube',
      title,
      description,
      content,
      author,
      date: publishDate,
      metadata: { views },
    };
  } catch (error: any) {
    console.error('YouTube fetch error:', error);
    return {
      success: false,
      url,
      type: 'youtube',
      title: 'Failed to fetch video',
      description: error.message,
      content: `Failed to fetch YouTube video: ${error.message}`,
    };
  }
}

/**
 * Fetch X/Twitter content (using Nitter fallback)
 */
async function fetchTwitter(url: string): Promise<FetchResult> {
  try {
    // METHOD 1: Twitter oEmbed API (public, no auth)
    const oembedUrl = 'https://publish.twitter.com/oembed?url=' + encodeURIComponent(url)

    const response = await fetch(oembedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(10000)
    })

    if (response.ok) {
      const data = await response.json()

      // Extract clean text from HTML embed
      const tweetText = data.html
        .replace(/<blockquote[^>]*>/gi, '')
        .replace(/<\/blockquote>/gi, '')
        .replace(/<script[^>]*>.*?<\/script>/gi, '')  // Remove scripts
        .replace(/<a[^>]*>([^<]*)<\/a>/gi, '$1')
        .replace(/<p[^>]*>/gi, '')  // Remove p tags with attributes
        .replace(/<\/p>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/&mdash;.*$/gm, '')  // Remove Twitter attribution
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim()

      const content = [
        '𝕏 POST by ' + data.author_name,
        '━━━━━━━━━━━━━━━━━━━━',
        '',
        tweetText,
        '',
        '━━━━━━━━━━━━━━━━━━━━',
        'Profile: ' + data.author_url,
        'Original: ' + url
      ].join('\n')

      return {
        success: true,
        url,
        type: 'twitter',
        title: 'Post by ' + data.author_name,
        description: tweetText.substring(0, 200),
        content,
        author: data.author_name,
        metadata: { provider: 'oembed' }
      }
    }

    // METHOD 2: Fallback - extract username and provide link
    const usernameMatch = url.match(/(?:twitter\.com|x\.com)\/([^\/\?]+)/)
    const username = usernameMatch ? usernameMatch[1] : 'unknown'

    return {
      success: true,
      url,
      type: 'twitter',
      title: 'X Post by @' + username,
      description: 'X/Twitter post - visit link for full content',
      content: [
        '𝕏 POST by @' + username,
        '━━━━━━━━━━━━━━━━━━━━',
        '',
        'Content requires visiting the original link.',
        '',
        '━━━━━━━━━━━━━━━━━━━━',
        'Original: ' + url
      ].join('\n'),
      author: '@' + username,
      metadata: { provider: 'fallback' }
    }

  } catch (error: any) {
    console.error('Twitter fetch error:', error)

    // Still return something useful
    const usernameMatch = url.match(/(?:twitter\.com|x\.com)\/([^\/\?]+)/)
    const username = usernameMatch ? usernameMatch[1] : 'unknown'

    return {
      success: false,
      url,
      type: 'twitter',
      title: 'X Post',
      description: 'Could not fetch content',
      content: '𝕏 POST\nURL: ' + url + '\nNote: Content could not be fetched. Please visit the link directly.',
      author: '@' + username
    }
  }
}

/**
 * Fetch GitHub repository info
 */
async function fetchGitHub(url: string): Promise<FetchResult> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $('meta[property="og:title"]').attr('content') ||
                  $('strong[itemprop="name"] a').text() || '';

    const description = $('meta[property="og:description"]').attr('content') ||
                        $('p[itemprop="about"]').text().trim() || '';

    const author = url.split('github.com/')[1]?.split('/')[0] || '';

    // Extract repo stats
    const stars = $('#repo-stars-counter-star').text().trim();
    const forks = $('#repo-network-counter').text().trim();
    const language = $('[itemprop="programmingLanguage"]').text().trim();

    // Get README preview (first 500 chars)
    const readmeText = $('#readme article').text().trim().substring(0, 500);

    const content = `GitHub Repository: ${title}
By: ${author}
Description: ${description}
${language ? `Language: ${language}` : ''}
${stars ? `⭐ ${stars}` : ''} ${forks ? `🍴 ${forks}` : ''}

README Preview:
${readmeText}${readmeText.length === 500 ? '...' : ''}`;

    return {
      success: true,
      url,
      type: 'github',
      title,
      description,
      content,
      author,
      metadata: { stars, forks, language },
    };
  } catch (error: any) {
    console.error('GitHub fetch error:', error);
    return {
      success: false,
      url,
      type: 'github',
      title: 'Failed to fetch repository',
      description: error.message,
      content: `Failed to fetch GitHub repository: ${error.message}`,
    };
  }
}

/**
 * Fetch generic webpage content
 */
async function fetchWebpage(url: string): Promise<FetchResult> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(10000),
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $('meta[property="og:title"]').attr('content') ||
                  $('meta[name="twitter:title"]').attr('content') ||
                  $('title').text() ||
                  $('h1').first().text();

    const description = $('meta[property="og:description"]').attr('content') ||
                        $('meta[name="description"]').attr('content') ||
                        $('meta[name="twitter:description"]').attr('content') || '';

    const author = $('meta[name="author"]').attr('content') || '';

    const date = $('meta[property="article:published_time"]').attr('content') ||
                 $('time').first().attr('datetime') || '';

    // Extract main content (prioritize article tags, then paragraphs)
    let mainContent = '';

    // Try article tags first
    if ($('article').length > 0) {
      mainContent = $('article').first().text().trim();
    } else {
      // Fallback to paragraphs
      $('p').each((i, el) => {
        if (i < 5) { // First 5 paragraphs
          mainContent += $(el).text().trim() + '\n\n';
        }
      });
    }

    // Limit content length
    mainContent = mainContent.substring(0, 1000);

    const content = `Webpage: ${title}
${author ? `By: ${author}` : ''}
${description}

Content Preview:
${mainContent}${mainContent.length === 1000 ? '...' : ''}`;

    return {
      success: true,
      url,
      type: 'webpage',
      title,
      description,
      content,
      author,
      date,
    };
  } catch (error: any) {
    console.error('Webpage fetch error:', error);
    return {
      success: false,
      url,
      type: 'webpage',
      title: 'Failed to fetch page',
      description: error.message,
      content: `Failed to fetch webpage: ${error.message}`,
    };
  }
}

/**
 * Main POST handler
 */
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    const type = detectURLType(url);
    let result: FetchResult;

    switch (type) {
      case 'youtube':
        result = await fetchYouTube(url);
        break;
      case 'twitter':
        result = await fetchTwitter(url);
        break;
      case 'github':
        result = await fetchGitHub(url);
        break;
      case 'webpage':
      default:
        result = await fetchWebpage(url);
        break;
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('fetch-url error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch URL' },
      { status: 500 }
    );
  }
}
