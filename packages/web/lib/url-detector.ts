/**
 * URL Detector Library
 * Detects and classifies URLs in text for content fetching
 */

export type URLType = 'youtube' | 'twitter' | 'github' | 'webpage'

export interface DetectedURL {
  url: string
  type: URLType
  domain: string
  id?: string // Video ID, tweet ID, repo path, etc.
}

/**
 * URL patterns for different platforms
 */
const URL_PATTERNS = {
  youtube: [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ],
  twitter: [
    /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/(\w+)\/status\/(\d+)/,
    /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/(\w+)/,
  ],
  github: [
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)/,
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/,
  ],
}

/**
 * General URL regex for any URL
 */
const GENERAL_URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi

/**
 * Check if text contains any URLs
 */
export function hasURLs(text: string): boolean {
  return GENERAL_URL_REGEX.test(text)
}

/**
 * Extract URL type from URL string
 */
export function getURLType(url: string): URLType {
  const lowerUrl = url.toLowerCase()

  // YouTube
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    return 'youtube'
  }

  // Twitter/X
  if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
    return 'twitter'
  }

  // GitHub
  if (lowerUrl.includes('github.com')) {
    return 'github'
  }

  // Default to webpage
  return 'webpage'
}

/**
 * Extract platform-specific ID from URL
 */
export function extractURLId(url: string, type: URLType): string | undefined {
  switch (type) {
    case 'youtube': {
      for (const pattern of URL_PATTERNS.youtube) {
        const match = url.match(pattern)
        if (match?.[1]) return match[1]
      }
      break
    }
    case 'twitter': {
      for (const pattern of URL_PATTERNS.twitter) {
        const match = url.match(pattern)
        if (match?.[2]) return match[2] // Tweet ID
        if (match?.[1]) return match[1] // Username (for profile)
      }
      break
    }
    case 'github': {
      for (const pattern of URL_PATTERNS.github) {
        const match = url.match(pattern)
        if (match?.[2]) return `${match[1]}/${match[2]}` // owner/repo
        if (match?.[1]) return match[1] // owner only
      }
      break
    }
  }
  return undefined
}

/**
 * Get domain from URL
 */
export function getDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return 'unknown'
  }
}

/**
 * Detect all URLs in text with classification
 */
export function detectURLs(text: string): DetectedURL[] {
  const urls: DetectedURL[] = []
  const matches = text.match(GENERAL_URL_REGEX) || []

  // Deduplicate
  const uniqueUrls = [...new Set(matches)]

  for (const url of uniqueUrls) {
    const type = getURLType(url)
    const id = extractURLId(url, type)
    const domain = getDomain(url)

    urls.push({
      url,
      type,
      domain,
      id,
    })
  }

  return urls
}

/**
 * Extract just URL strings (simple version)
 */
export function extractURLs(text: string): string[] {
  const matches = text.match(GENERAL_URL_REGEX) || []
  return [...new Set(matches)]
}

/**
 * Get user-friendly type description
 */
export function getURLTypeDescription(type: URLType): string {
  const descriptions: Record<URLType, string> = {
    youtube: 'YouTube Video',
    twitter: 'X/Twitter Post',
    github: 'GitHub Repository',
    webpage: 'Web Page',
  }
  return descriptions[type]
}

/**
 * Check if URL is a video platform
 */
export function isVideoURL(url: string): boolean {
  const type = getURLType(url)
  return type === 'youtube' || (type === 'twitter' && url.includes('/status/'))
}

/**
 * Prioritize URLs for fetching (videos first, then social, then others)
 */
export function prioritizeURLs(urls: DetectedURL[]): DetectedURL[] {
  const priority: Record<URLType, number> = {
    youtube: 1,
    twitter: 2,
    github: 3,
    webpage: 4,
  }

  return [...urls].sort((a, b) => priority[a.type] - priority[b.type])
}
