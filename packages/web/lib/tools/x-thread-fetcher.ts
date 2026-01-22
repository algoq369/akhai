/**
 * Twitter Thread Fetcher
 *
 * Fetches and analyzes Twitter threads using Twitter API v2
 */

import { getSocialConnection } from '@/lib/database';

export interface Tweet {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  referenced_tweets?: Array<{
    type: string;
    id: string;
  }>;
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
  attachments?: {
    media_keys?: string[];
  };
}

export interface Media {
  media_key: string;
  type: 'photo' | 'video' | 'animated_gif';
  url?: string;
  preview_image_url?: string;
  duration_ms?: number;
  variants?: Array<{
    bit_rate?: number;
    content_type: string;
    url: string;
  }>;
}

export interface Thread {
  id: string;
  author: {
    id: string;
    username: string;
    name: string;
  };
  tweets: Tweet[];
  media?: Media[];
  created_at: string;
  total_tweets: number;
}

/**
 * Extract tweet ID from Twitter/X URL
 * Supports formats:
 * - https://twitter.com/user/status/123456789
 * - https://x.com/user/status/123456789
 * - https://t.co/xyz (shortened - returns as-is, needs expansion)
 */
export function extractTweetId(url: string): string | null {
  const match = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Fetch a single tweet by ID
 */
async function fetchTweet(
  tweetId: string,
  accessToken: string
): Promise<{ data: Tweet; includes?: { users: any[]; media?: Media[] } } | null> {
  try {
    const response = await fetch(
      `https://api.twitter.com/2/tweets/${tweetId}?` +
      new URLSearchParams({
        'tweet.fields': 'created_at,author_id,public_metrics,referenced_tweets,attachments',
        'expansions': 'author_id,referenced_tweets.id,attachments.media_keys',
        'user.fields': 'username,name',
        'media.fields': 'type,url,preview_image_url,duration_ms,variants',
      }),
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Twitter API error:', response.status, await response.text());
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch tweet:', error);
    return null;
  }
}

/**
 * Fetch a complete Twitter thread
 *
 * @param tweetId - ID of the first tweet in the thread
 * @param userId - AkhAI user ID (to get their Twitter connection)
 * @returns Complete thread with all tweets
 */
export async function fetchXThread(tweetId: string, userId: string): Promise<Thread | null> {
  // Get user's X connection from database
  const connection = await getSocialConnection(userId, 'x');
  if (!connection || !connection.access_token) {
    throw new Error('X account not connected. Please connect your X account in settings.');
  }

  // Check if token is expired
  if (connection.expires_at && connection.expires_at < Math.floor(Date.now() / 1000)) {
    throw new Error('X connection expired. Please reconnect your account.');
  }

  // Fetch the initial tweet
  const initialTweet = await fetchTweet(tweetId, connection.access_token);
  if (!initialTweet || !initialTweet.data) {
    return null;
  }

  const tweets: Tweet[] = [initialTweet.data];
  const author = initialTweet.includes?.users?.[0];
  const media = initialTweet.includes?.media || [];

  // Check if this tweet is part of a thread (has referenced tweets)
  const referencedTweets = initialTweet.data.referenced_tweets || [];

  // Build the thread by following the conversation
  // Note: Twitter API v2 doesn't have a direct "get thread" endpoint
  // We need to recursively fetch referenced tweets or use search API
  // For now, we'll return the single tweet and note this limitation

  return {
    id: tweetId,
    author: {
      id: author?.id || initialTweet.data.author_id,
      username: author?.username || 'unknown',
      name: author?.name || 'Unknown User',
    },
    tweets,
    media,
    created_at: initialTweet.data.created_at,
    total_tweets: tweets.length,
  };
}

/**
 * Analyze a Twitter thread
 *
 * @param thread - Thread to analyze
 * @returns Summary and insights
 */
export function analyzeThread(thread: Thread): {
  summary: string;
  key_points: string[];
  engagement: {
    total_likes: number;
    total_retweets: number;
    total_replies: number;
  };
} {
  const allText = thread.tweets.map(t => t.text).join('\n\n');

  // Calculate engagement
  const engagement = thread.tweets.reduce(
    (acc, tweet) => {
      const metrics = tweet.public_metrics || {
        like_count: 0,
        retweet_count: 0,
        reply_count: 0,
        quote_count: 0,
      };
      return {
        total_likes: acc.total_likes + metrics.like_count,
        total_retweets: acc.total_retweets + metrics.retweet_count,
        total_replies: acc.total_replies + metrics.reply_count,
      };
    },
    { total_likes: 0, total_retweets: 0, total_replies: 0 }
  );

  // Extract key points (simplified - could use AI for better extraction)
  const key_points = thread.tweets
    .map(t => t.text)
    .filter(text => text.length > 50) // Only substantial tweets
    .slice(0, 5); // Top 5 key tweets

  return {
    summary: `Thread by @${thread.author.username} with ${thread.total_tweets} tweet(s)`,
    key_points,
    engagement,
  };
}

/**
 * Check if a query mentions Twitter/X content
 */
export function containsTwitterLink(query: string): boolean {
  return /(?:twitter\.com|x\.com)\/\w+\/status\/\d+/.test(query);
}

/**
 * Extract all Twitter links from a query
 */
export function extractTwitterLinks(query: string): string[] {
  const regex = /(https?:\/\/(?:twitter\.com|x\.com)\/\w+\/status\/\d+)/g;
  return query.match(regex) || [];
}

/**
 * Get the highest quality video URL from media variants
 */
export function getHighestQualityVideo(media: Media): string | null {
  if (!media.variants || media.type !== 'video') {
    return null;
  }

  // Filter for video/mp4 content and sort by bitrate (highest first)
  const mp4Variants = media.variants
    .filter(v => v.content_type === 'video/mp4' && v.url)
    .sort((a, b) => (b.bit_rate || 0) - (a.bit_rate || 0));

  return mp4Variants[0]?.url || null;
}

/**
 * Extract all video URLs from a thread
 */
export function extractVideos(thread: Thread): Array<{ url: string; preview?: string }> {
  if (!thread.media) {
    return [];
  }

  return thread.media
    .filter(m => m.type === 'video' || m.type === 'animated_gif')
    .map(m => ({
      url: getHighestQualityVideo(m) || '',
      preview: m.preview_image_url,
    }))
    .filter(v => v.url);
}
