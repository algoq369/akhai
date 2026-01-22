/**
 * URL Detection Utilities
 *
 * Detects and extracts URLs from text messages
 */

export type URLType = 'youtube' | 'twitter' | 'github' | 'webpage';

export interface DetectedURL {
  url: string;
  type: URLType;
  position: number;
}

/**
 * Detect URL type from URL string
 */
export function detectURLType(url: string): URLType {
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
 * Check if text contains any URLs
 */
export function hasURLs(text: string): boolean {
  const urlPattern = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
  return urlPattern.test(text);
}

/**
 * Detect and extract all URLs from text
 */
export function detectURLs(text: string): DetectedURL[] {
  const urlPattern = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
  const matches = text.matchAll(urlPattern);
  const detected: DetectedURL[] = [];

  for (const match of matches) {
    if (match[0] && match.index !== undefined) {
      detected.push({
        url: match[0],
        type: detectURLType(match[0]),
        position: match.index,
      });
    }
  }

  return detected;
}

/**
 * Extract just the URLs (no metadata)
 */
export function extractURLs(text: string): string[] {
  const detected = detectURLs(text);
  return detected.map(d => d.url);
}

/**
 * Check if URL is a specific type
 */
export function isYouTubeURL(url: string): boolean {
  return detectURLType(url) === 'youtube';
}

export function isTwitterURL(url: string): boolean {
  return detectURLType(url) === 'twitter';
}

export function isGitHubURL(url: string): boolean {
  return detectURLType(url) === 'github';
}

/**
 * Get user-friendly description of URL type
 */
export function getURLTypeDescription(type: URLType): string {
  const descriptions: Record<URLType, string> = {
    youtube: 'YouTube video',
    twitter: 'X/Twitter post',
    github: 'GitHub repository',
    webpage: 'webpage',
  };
  return descriptions[type];
}

/**
 * Remove URLs from text (useful for cleaning)
 */
export function removeURLs(text: string): string {
  const urlPattern = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
  return text.replace(urlPattern, '').replace(/\s+/g, ' ').trim();
}
