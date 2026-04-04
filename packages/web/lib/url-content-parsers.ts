/**
 * URL Content Parsers — YouTube & Twitter/X
 * Extracted from url-content-fetcher.ts to keep files under 500 lines.
 */

import type { YouTubeContent, TwitterContent } from './url-content-fetcher';

// ============================================================================
// UTILITY FUNCTIONS (shared across parsers)
// ============================================================================

export function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ');
}

function cleanTranscript(text: string): string {
  return text
    .replace(/\[.*?\]/g, '') // Remove [Music], [Applause], etc.
    .replace(/\s+/g, ' ')
    .trim();
}

function formatViewCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return count.toString();
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// ============================================================================
// YOUTUBE FETCHER
// ============================================================================

/**
 * Fetch YouTube video content including transcript
 */
export async function fetchYouTubeContent(url: string, videoId: string): Promise<YouTubeContent> {
  console.log(`[URL_FETCH] Fetching YouTube video: ${videoId}`);

  const result: YouTubeContent = {
    url,
    type: 'youtube',
    success: false,
    videoId,
  };

  try {
    // Method 1: oEmbed API (always works, no API key needed)
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const oembedRes = await fetch(oembedUrl);

    if (oembedRes.ok) {
      const oembed = await oembedRes.json();
      result.title = oembed.title;
      result.author = oembed.author_name;
      result.channelName = oembed.author_name;
      result.thumbnailUrl = oembed.thumbnail_url;
      console.log(`[URL_FETCH] YouTube oEmbed success: "${result.title}"`);
    }

    // Method 2: Try to get transcript using youtube-transcript approach
    const transcript = await fetchYouTubeTranscript(videoId);
    if (transcript) {
      result.transcript = transcript;
      result.content = transcript;
      console.log(`[URL_FETCH] YouTube transcript fetched: ${transcript.length} chars`);
    }

    // Method 3: Scrape video page for more metadata
    const pageContent = await fetchYouTubePageMetadata(videoId);
    if (pageContent) {
      result.description = pageContent.description || result.description;
      result.viewCount = pageContent.viewCount;
      result.duration = pageContent.duration;
      result.publishedAt = pageContent.publishedAt;
    }

    result.success = !!(result.title || result.transcript);

    // Build comprehensive content summary
    if (result.success) {
      result.content = buildYouTubeContentSummary(result);
    }
  } catch (error) {
    console.error(`[URL_FETCH] YouTube fetch error:`, error);
    result.error = error instanceof Error ? error.message : 'Failed to fetch YouTube content';
  }

  return result;
}

/**
 * Fetch YouTube transcript using multiple methods
 */
async function fetchYouTubeTranscript(videoId: string): Promise<string | null> {
  try {
    // Method 1: Use youtubetranscript.com (free, no API key)
    const transcriptUrl = `https://youtubetranscript.com/?server_vid2=${videoId}`;
    const res = await fetch(transcriptUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AkhAI/1.0)',
      },
    });

    if (res.ok) {
      const text = await res.text();
      // Parse XML transcript response
      const matches = text.match(/<text[^>]*>([^<]+)<\/text>/g);
      if (matches && matches.length > 0) {
        const transcript = matches
          .map((m) => m.replace(/<[^>]+>/g, '').trim())
          .filter((t) => t.length > 0)
          .join(' ');

        if (transcript.length > 50) {
          return cleanTranscript(transcript);
        }
      }
    }

    // Method 2: Try alternative transcript service
    const altUrl = `https://yt-transcript-api.vercel.app/api/transcript?videoId=${videoId}`;
    const altRes = await fetch(altUrl);

    if (altRes.ok) {
      const data = await altRes.json();
      if (data.transcript) {
        return cleanTranscript(data.transcript);
      }
    }
  } catch (error) {
    console.log(`[URL_FETCH] Transcript fetch failed, continuing without transcript`);
  }

  return null;
}

/**
 * Fetch YouTube page metadata via scraping
 */
async function fetchYouTubePageMetadata(videoId: string): Promise<{
  description?: string;
  viewCount?: string;
  duration?: string;
  publishedAt?: string;
} | null> {
  try {
    const pageUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const res = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AkhAI/1.0)',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!res.ok) return null;

    const html = await res.text();

    // Extract from meta tags and JSON-LD
    const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
    const viewCount = html.match(/"viewCount":"(\d+)"/)?.[1];
    const duration = html.match(/"lengthSeconds":"(\d+)"/)?.[1];
    const publishedAt = html.match(/"publishDate":"([^"]+)"/)?.[1];

    return {
      description: description ? decodeHTMLEntities(description) : undefined,
      viewCount: viewCount ? formatViewCount(parseInt(viewCount)) : undefined,
      duration: duration ? formatDuration(parseInt(duration)) : undefined,
      publishedAt,
    };
  } catch {
    return null;
  }
}

/**
 * Build comprehensive YouTube content summary for AI
 */
function buildYouTubeContentSummary(content: YouTubeContent): string {
  const parts: string[] = [];

  parts.push(`=== YOUTUBE VIDEO CONTENT ===`);
  if (content.title) parts.push(`Title: ${content.title}`);
  if (content.channelName) parts.push(`Channel: ${content.channelName}`);
  if (content.viewCount) parts.push(`Views: ${content.viewCount}`);
  if (content.duration) parts.push(`Duration: ${content.duration}`);
  if (content.publishedAt) parts.push(`Published: ${content.publishedAt}`);
  if (content.description) parts.push(`\nDescription:\n${content.description}`);

  if (content.transcript) {
    parts.push(`\n--- VIDEO TRANSCRIPT ---`);
    parts.push(content.transcript);
    parts.push(`--- END TRANSCRIPT ---`);
  }

  return parts.join('\n');
}

// ============================================================================
// TWITTER/X FETCHER
// ============================================================================

/**
 * Fetch Twitter/X content using multiple fallback methods
 */
export async function fetchTwitterContent(url: string, tweetId?: string): Promise<TwitterContent> {
  console.log(`[URL_FETCH] Fetching Twitter/X content: ${url}`);

  const result: TwitterContent = {
    url,
    type: 'twitter',
    success: false,
    tweetId,
  };

  // Extract tweet ID if not provided
  if (!tweetId) {
    const match = url.match(/status\/(\d+)/);
    tweetId = match?.[1];
    result.tweetId = tweetId;
  }

  // Extract username
  const usernameMatch = url.match(/(?:twitter\.com|x\.com)\/(\w+)/);
  result.username = usernameMatch?.[1];

  try {
    // Method 1: FxTwitter API (most reliable)
    const fxContent = await fetchFromFxTwitter(url, tweetId);
    if (fxContent) {
      Object.assign(result, fxContent);
      result.success = true;
      console.log(`[URL_FETCH] FxTwitter success`);
      return result;
    }

    // Method 2: Nitter instances (fallback)
    const nitterContent = await fetchFromNitter(url, tweetId);
    if (nitterContent) {
      Object.assign(result, nitterContent);
      result.success = true;
      console.log(`[URL_FETCH] Nitter success`);
      return result;
    }

    // Method 3: VxTwitter (another fallback)
    const vxContent = await fetchFromVxTwitter(url, tweetId);
    if (vxContent) {
      Object.assign(result, vxContent);
      result.success = true;
      console.log(`[URL_FETCH] VxTwitter success`);
      return result;
    }
  } catch (error) {
    console.error(`[URL_FETCH] Twitter fetch error:`, error);
    result.error = error instanceof Error ? error.message : 'Failed to fetch Twitter content';
  }

  // Build content even if partial
  if (result.tweetText || result.username) {
    result.content = buildTwitterContentSummary(result);
  }

  return result;
}

/**
 * Fetch from FxTwitter API
 */
async function fetchFromFxTwitter(
  url: string,
  tweetId?: string
): Promise<Partial<TwitterContent> | null> {
  try {
    // Convert URL to FxTwitter API format
    const fxUrl = url
      .replace('twitter.com', 'api.fxtwitter.com')
      .replace('x.com', 'api.fxtwitter.com');

    const res = await fetch(fxUrl, {
      headers: { 'User-Agent': 'AkhAI/1.0' },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const tweet = data.tweet;

    if (!tweet) return null;

    return {
      title: `Tweet by @${tweet.author?.screen_name}`,
      tweetText: tweet.text,
      author: tweet.author?.name,
      username: tweet.author?.screen_name,
      likes: tweet.likes,
      retweets: tweet.retweets,
      publishedAt: tweet.created_at,
      mediaUrls: tweet.media?.photos?.map((p: any) => p.url) || [],
      content: buildTwitterContentSummary({
        tweetText: tweet.text,
        username: tweet.author?.screen_name,
        author: tweet.author?.name,
        likes: tweet.likes,
        retweets: tweet.retweets,
      } as TwitterContent),
    };
  } catch {
    return null;
  }
}

/**
 * Fetch from Nitter instances
 */
async function fetchFromNitter(
  url: string,
  tweetId?: string
): Promise<Partial<TwitterContent> | null> {
  const nitterInstances = ['nitter.privacydev.net', 'nitter.poast.org', 'nitter.cz'];

  for (const instance of nitterInstances) {
    try {
      const nitterUrl = url.replace('twitter.com', instance).replace('x.com', instance);

      const res = await fetch(nitterUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AkhAI/1.0)' },
      });

      if (!res.ok) continue;

      const html = await res.text();

      // Extract tweet content from Nitter HTML
      const tweetText = html.match(/<div class="tweet-content[^"]*">([^<]+)/)?.[1];
      const username = html.match(/<a class="username"[^>]*>@(\w+)</)?.[1];
      const fullname = html.match(/<a class="fullname"[^>]*>([^<]+)</)?.[1];

      if (tweetText) {
        return {
          tweetText: decodeHTMLEntities(tweetText.trim()),
          username,
          author: fullname,
          content: tweetText.trim(),
        };
      }
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Fetch from VxTwitter
 */
async function fetchFromVxTwitter(
  url: string,
  tweetId?: string
): Promise<Partial<TwitterContent> | null> {
  try {
    const vxUrl = url
      .replace('twitter.com', 'api.vxtwitter.com')
      .replace('x.com', 'api.vxtwitter.com');

    const res = await fetch(vxUrl);
    if (!res.ok) return null;

    const data = await res.json();

    return {
      tweetText: data.text,
      author: data.user_name,
      username: data.user_screen_name,
      likes: data.likes,
      retweets: data.retweets,
    };
  } catch {
    return null;
  }
}

/**
 * Build Twitter content summary for AI
 */
function buildTwitterContentSummary(content: Partial<TwitterContent>): string {
  const parts: string[] = [];

  parts.push(`=== X/TWITTER POST CONTENT ===`);
  if (content.author) parts.push(`Author: ${content.author} (@${content.username})`);
  if (content.publishedAt) parts.push(`Posted: ${content.publishedAt}`);
  if (content.likes) parts.push(`Likes: ${content.likes}`);
  if (content.retweets) parts.push(`Retweets: ${content.retweets}`);

  if (content.tweetText) {
    parts.push(`\n--- TWEET TEXT ---`);
    parts.push(content.tweetText);
    parts.push(`--- END TWEET ---`);
  }

  if (content.mediaUrls && content.mediaUrls.length > 0) {
    parts.push(`\nMedia attachments: ${content.mediaUrls.length} image(s)/video(s)`);
  }

  return parts.join('\n');
}
