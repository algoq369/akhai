/**
 * URL Content Fetcher
 * Fetches and extracts content from various URL types
 * Supports: YouTube (with transcripts), Twitter/X, GitHub, Webpages
 */

import { detectURLs, type DetectedURL, type URLType } from './url-detector'

export interface FetchedContent {
  url: string
  type: URLType
  success: boolean
  title?: string
  description?: string
  content?: string
  author?: string
  publishedAt?: string
  metadata?: Record<string, any>
  error?: string
}

export interface YouTubeContent extends FetchedContent {
  type: 'youtube'
  videoId?: string
  channelName?: string
  viewCount?: string
  duration?: string
  transcript?: string
  thumbnailUrl?: string
}

export interface TwitterContent extends FetchedContent {
  type: 'twitter'
  tweetId?: string
  username?: string
  tweetText?: string
  mediaUrls?: string[]
  retweets?: number
  likes?: number
  isThread?: boolean
}

export interface GitHubContent extends FetchedContent {
  type: 'github'
  owner?: string
  repo?: string
  stars?: number
  forks?: number
  language?: string
  readme?: string
  topics?: string[]
}

// ============================================================================
// YOUTUBE FETCHER
// ============================================================================

/**
 * Fetch YouTube video content including transcript
 */
export async function fetchYouTubeContent(url: string, videoId: string): Promise<YouTubeContent> {
  console.log(`[URL_FETCH] Fetching YouTube video: ${videoId}`)

  const result: YouTubeContent = {
    url,
    type: 'youtube',
    success: false,
    videoId,
  }

  try {
    // Method 1: oEmbed API (always works, no API key needed)
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    const oembedRes = await fetch(oembedUrl)

    if (oembedRes.ok) {
      const oembed = await oembedRes.json()
      result.title = oembed.title
      result.author = oembed.author_name
      result.channelName = oembed.author_name
      result.thumbnailUrl = oembed.thumbnail_url
      console.log(`[URL_FETCH] YouTube oEmbed success: "${result.title}"`)
    }

    // Method 2: Try to get transcript using youtube-transcript approach
    const transcript = await fetchYouTubeTranscript(videoId)
    if (transcript) {
      result.transcript = transcript
      result.content = transcript
      console.log(`[URL_FETCH] YouTube transcript fetched: ${transcript.length} chars`)
    }

    // Method 3: Scrape video page for more metadata
    const pageContent = await fetchYouTubePageMetadata(videoId)
    if (pageContent) {
      result.description = pageContent.description || result.description
      result.viewCount = pageContent.viewCount
      result.duration = pageContent.duration
      result.publishedAt = pageContent.publishedAt
    }

    result.success = !!(result.title || result.transcript)

    // Build comprehensive content summary
    if (result.success) {
      result.content = buildYouTubeContentSummary(result)
    }

  } catch (error) {
    console.error(`[URL_FETCH] YouTube fetch error:`, error)
    result.error = error instanceof Error ? error.message : 'Failed to fetch YouTube content'
  }

  return result
}

/**
 * Fetch YouTube transcript using multiple methods
 */
async function fetchYouTubeTranscript(videoId: string): Promise<string | null> {
  try {
    // Method 1: Use youtubetranscript.com (free, no API key)
    const transcriptUrl = `https://youtubetranscript.com/?server_vid2=${videoId}`
    const res = await fetch(transcriptUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AkhAI/1.0)',
      },
    })

    if (res.ok) {
      const text = await res.text()
      // Parse XML transcript response
      const matches = text.match(/<text[^>]*>([^<]+)<\/text>/g)
      if (matches && matches.length > 0) {
        const transcript = matches
          .map(m => m.replace(/<[^>]+>/g, '').trim())
          .filter(t => t.length > 0)
          .join(' ')

        if (transcript.length > 50) {
          return cleanTranscript(transcript)
        }
      }
    }

    // Method 2: Try alternative transcript service
    const altUrl = `https://yt-transcript-api.vercel.app/api/transcript?videoId=${videoId}`
    const altRes = await fetch(altUrl)

    if (altRes.ok) {
      const data = await altRes.json()
      if (data.transcript) {
        return cleanTranscript(data.transcript)
      }
    }

  } catch (error) {
    console.log(`[URL_FETCH] Transcript fetch failed, continuing without transcript`)
  }

  return null
}

/**
 * Fetch YouTube page metadata via scraping
 */
async function fetchYouTubePageMetadata(videoId: string): Promise<{
  description?: string
  viewCount?: string
  duration?: string
  publishedAt?: string
} | null> {
  try {
    const pageUrl = `https://www.youtube.com/watch?v=${videoId}`
    const res = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AkhAI/1.0)',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })

    if (!res.ok) return null

    const html = await res.text()

    // Extract from meta tags and JSON-LD
    const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1]
    const viewCount = html.match(/"viewCount":"(\d+)"/)?.[1]
    const duration = html.match(/"lengthSeconds":"(\d+)"/)?.[1]
    const publishedAt = html.match(/"publishDate":"([^"]+)"/)?.[1]

    return {
      description: description ? decodeHTMLEntities(description) : undefined,
      viewCount: viewCount ? formatViewCount(parseInt(viewCount)) : undefined,
      duration: duration ? formatDuration(parseInt(duration)) : undefined,
      publishedAt,
    }
  } catch {
    return null
  }
}

/**
 * Build comprehensive YouTube content summary for AI
 */
function buildYouTubeContentSummary(content: YouTubeContent): string {
  const parts: string[] = []

  parts.push(`=== YOUTUBE VIDEO CONTENT ===`)
  if (content.title) parts.push(`Title: ${content.title}`)
  if (content.channelName) parts.push(`Channel: ${content.channelName}`)
  if (content.viewCount) parts.push(`Views: ${content.viewCount}`)
  if (content.duration) parts.push(`Duration: ${content.duration}`)
  if (content.publishedAt) parts.push(`Published: ${content.publishedAt}`)
  if (content.description) parts.push(`\nDescription:\n${content.description}`)

  if (content.transcript) {
    parts.push(`\n--- VIDEO TRANSCRIPT ---`)
    parts.push(content.transcript)
    parts.push(`--- END TRANSCRIPT ---`)
  }

  return parts.join('\n')
}

// ============================================================================
// TWITTER/X FETCHER
// ============================================================================

/**
 * Fetch Twitter/X content using multiple fallback methods
 */
export async function fetchTwitterContent(url: string, tweetId?: string): Promise<TwitterContent> {
  console.log(`[URL_FETCH] Fetching Twitter/X content: ${url}`)

  const result: TwitterContent = {
    url,
    type: 'twitter',
    success: false,
    tweetId,
  }

  // Extract tweet ID if not provided
  if (!tweetId) {
    const match = url.match(/status\/(\d+)/)
    tweetId = match?.[1]
    result.tweetId = tweetId
  }

  // Extract username
  const usernameMatch = url.match(/(?:twitter\.com|x\.com)\/(\w+)/)
  result.username = usernameMatch?.[1]

  try {
    // Method 1: FxTwitter API (most reliable)
    const fxContent = await fetchFromFxTwitter(url, tweetId)
    if (fxContent) {
      Object.assign(result, fxContent)
      result.success = true
      console.log(`[URL_FETCH] FxTwitter success`)
      return result
    }

    // Method 2: Nitter instances (fallback)
    const nitterContent = await fetchFromNitter(url, tweetId)
    if (nitterContent) {
      Object.assign(result, nitterContent)
      result.success = true
      console.log(`[URL_FETCH] Nitter success`)
      return result
    }

    // Method 3: VxTwitter (another fallback)
    const vxContent = await fetchFromVxTwitter(url, tweetId)
    if (vxContent) {
      Object.assign(result, vxContent)
      result.success = true
      console.log(`[URL_FETCH] VxTwitter success`)
      return result
    }

  } catch (error) {
    console.error(`[URL_FETCH] Twitter fetch error:`, error)
    result.error = error instanceof Error ? error.message : 'Failed to fetch Twitter content'
  }

  // Build content even if partial
  if (result.tweetText || result.username) {
    result.content = buildTwitterContentSummary(result)
  }

  return result
}

/**
 * Fetch from FxTwitter API
 */
async function fetchFromFxTwitter(url: string, tweetId?: string): Promise<Partial<TwitterContent> | null> {
  try {
    // Convert URL to FxTwitter API format
    const fxUrl = url
      .replace('twitter.com', 'api.fxtwitter.com')
      .replace('x.com', 'api.fxtwitter.com')

    const res = await fetch(fxUrl, {
      headers: { 'User-Agent': 'AkhAI/1.0' },
    })

    if (!res.ok) return null

    const data = await res.json()
    const tweet = data.tweet

    if (!tweet) return null

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
    }
  } catch {
    return null
  }
}

/**
 * Fetch from Nitter instances
 */
async function fetchFromNitter(url: string, tweetId?: string): Promise<Partial<TwitterContent> | null> {
  const nitterInstances = [
    'nitter.privacydev.net',
    'nitter.poast.org',
    'nitter.cz',
  ]

  for (const instance of nitterInstances) {
    try {
      const nitterUrl = url
        .replace('twitter.com', instance)
        .replace('x.com', instance)

      const res = await fetch(nitterUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AkhAI/1.0)' },
      })

      if (!res.ok) continue

      const html = await res.text()

      // Extract tweet content from Nitter HTML
      const tweetText = html.match(/<div class="tweet-content[^"]*">([^<]+)/)?.[1]
      const username = html.match(/<a class="username"[^>]*>@(\w+)</)?.[1]
      const fullname = html.match(/<a class="fullname"[^>]*>([^<]+)</)?.[1]

      if (tweetText) {
        return {
          tweetText: decodeHTMLEntities(tweetText.trim()),
          username,
          author: fullname,
          content: tweetText.trim(),
        }
      }
    } catch {
      continue
    }
  }

  return null
}

/**
 * Fetch from VxTwitter
 */
async function fetchFromVxTwitter(url: string, tweetId?: string): Promise<Partial<TwitterContent> | null> {
  try {
    const vxUrl = url
      .replace('twitter.com', 'api.vxtwitter.com')
      .replace('x.com', 'api.vxtwitter.com')

    const res = await fetch(vxUrl)
    if (!res.ok) return null

    const data = await res.json()

    return {
      tweetText: data.text,
      author: data.user_name,
      username: data.user_screen_name,
      likes: data.likes,
      retweets: data.retweets,
    }
  } catch {
    return null
  }
}

/**
 * Build Twitter content summary for AI
 */
function buildTwitterContentSummary(content: Partial<TwitterContent>): string {
  const parts: string[] = []

  parts.push(`=== X/TWITTER POST CONTENT ===`)
  if (content.author) parts.push(`Author: ${content.author} (@${content.username})`)
  if (content.publishedAt) parts.push(`Posted: ${content.publishedAt}`)
  if (content.likes) parts.push(`Likes: ${content.likes}`)
  if (content.retweets) parts.push(`Retweets: ${content.retweets}`)

  if (content.tweetText) {
    parts.push(`\n--- TWEET TEXT ---`)
    parts.push(content.tweetText)
    parts.push(`--- END TWEET ---`)
  }

  if (content.mediaUrls && content.mediaUrls.length > 0) {
    parts.push(`\nMedia attachments: ${content.mediaUrls.length} image(s)/video(s)`)
  }

  return parts.join('\n')
}

// ============================================================================
// GITHUB FETCHER
// ============================================================================

/**
 * Fetch GitHub repository content
 */
export async function fetchGitHubContent(url: string, repoPath?: string): Promise<GitHubContent> {
  console.log(`[URL_FETCH] Fetching GitHub repo: ${repoPath || url}`)

  const result: GitHubContent = {
    url,
    type: 'github',
    success: false,
  }

  // Extract owner/repo from URL
  const match = url.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/)
  if (match) {
    result.owner = match[1]
    result.repo = match[2].replace('.git', '')
  }

  if (!result.owner || !result.repo) {
    result.error = 'Invalid GitHub URL'
    return result
  }

  try {
    // Fetch repo metadata from GitHub API
    const apiUrl = `https://api.github.com/repos/${result.owner}/${result.repo}`
    const res = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'AkhAI/1.0',
      },
    })

    if (res.ok) {
      const repo = await res.json()
      result.title = repo.full_name
      result.description = repo.description
      result.stars = repo.stargazers_count
      result.forks = repo.forks_count
      result.language = repo.language
      result.topics = repo.topics || []
      result.author = repo.owner?.login
      result.publishedAt = repo.created_at
      result.success = true
    }

    // Fetch README content
    const readmeUrl = `https://api.github.com/repos/${result.owner}/${result.repo}/readme`
    const readmeRes = await fetch(readmeUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'AkhAI/1.0',
      },
    })

    if (readmeRes.ok) {
      const readmeData = await readmeRes.json()
      if (readmeData.content) {
        const decodedReadme = Buffer.from(readmeData.content, 'base64').toString('utf-8')
        // Truncate README to first 2000 chars for context
        result.readme = decodedReadme.substring(0, 2000)
        if (decodedReadme.length > 2000) {
          result.readme += '\n... [README truncated]'
        }
      }
    }

    // Build content summary
    result.content = buildGitHubContentSummary(result)

  } catch (error) {
    console.error(`[URL_FETCH] GitHub fetch error:`, error)
    result.error = error instanceof Error ? error.message : 'Failed to fetch GitHub content'
  }

  return result
}

/**
 * Build GitHub content summary for AI
 */
function buildGitHubContentSummary(content: GitHubContent): string {
  const parts: string[] = []

  parts.push(`=== GITHUB REPOSITORY ===`)
  if (content.title) parts.push(`Repository: ${content.title}`)
  if (content.description) parts.push(`Description: ${content.description}`)
  if (content.language) parts.push(`Primary Language: ${content.language}`)
  if (content.stars) parts.push(`Stars: ${content.stars.toLocaleString()}`)
  if (content.forks) parts.push(`Forks: ${content.forks.toLocaleString()}`)
  if (content.topics && content.topics.length > 0) {
    parts.push(`Topics: ${content.topics.join(', ')}`)
  }

  if (content.readme) {
    parts.push(`\n--- README PREVIEW ---`)
    parts.push(content.readme)
    parts.push(`--- END README ---`)
  }

  return parts.join('\n')
}

// ============================================================================
// GENERIC WEBPAGE FETCHER
// ============================================================================

/**
 * Fetch generic webpage content
 */
export async function fetchWebpageContent(url: string): Promise<FetchedContent> {
  console.log(`[URL_FETCH] Fetching webpage: ${url}`)

  const result: FetchedContent = {
    url,
    type: 'webpage',
    success: false,
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AkhAI/1.0; +https://akhai.app)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })

    if (!res.ok) {
      result.error = `HTTP ${res.status}`
      return result
    }

    const html = await res.text()

    // Extract metadata
    result.title = extractMetaContent(html, 'og:title') ||
                   extractMetaContent(html, 'twitter:title') ||
                   html.match(/<title>([^<]+)<\/title>/i)?.[1]

    result.description = extractMetaContent(html, 'og:description') ||
                         extractMetaContent(html, 'description') ||
                         extractMetaContent(html, 'twitter:description')

    result.author = extractMetaContent(html, 'author') ||
                    extractMetaContent(html, 'og:site_name')

    result.publishedAt = extractMetaContent(html, 'article:published_time') ||
                         extractMetaContent(html, 'datePublished')

    // Extract main content
    const mainContent = extractMainContent(html)
    if (mainContent) {
      result.content = mainContent
    }

    result.success = !!(result.title || result.content)

    // Build summary
    if (result.success) {
      result.content = buildWebpageContentSummary(result)
    }

  } catch (error) {
    console.error(`[URL_FETCH] Webpage fetch error:`, error)
    result.error = error instanceof Error ? error.message : 'Failed to fetch webpage'
  }

  return result
}

/**
 * Extract meta tag content
 */
function extractMetaContent(html: string, name: string): string | undefined {
  // Try property attribute (Open Graph)
  const propMatch = html.match(new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'))
  if (propMatch?.[1]) return decodeHTMLEntities(propMatch[1])

  // Try name attribute
  const nameMatch = html.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'))
  if (nameMatch?.[1]) return decodeHTMLEntities(nameMatch[1])

  // Try reverse order (content before name/property)
  const reverseMatch = html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`, 'i'))
  if (reverseMatch?.[1]) return decodeHTMLEntities(reverseMatch[1])

  return undefined
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
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')

  // Try to find article or main content
  const articleMatch = cleaned.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
  const mainMatch = cleaned.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
  const contentMatch = cleaned.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i)

  let content = articleMatch?.[1] || mainMatch?.[1] || contentMatch?.[1] || cleaned

  // Strip remaining HTML tags
  content = content.replace(/<[^>]+>/g, ' ')

  // Clean up whitespace
  content = content
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim()

  // Truncate to reasonable length
  if (content.length > 3000) {
    content = content.substring(0, 3000) + '... [content truncated]'
  }

  return content.length > 100 ? content : null
}

/**
 * Build webpage content summary for AI
 */
function buildWebpageContentSummary(content: FetchedContent): string {
  const parts: string[] = []

  parts.push(`=== WEB PAGE CONTENT ===`)
  parts.push(`URL: ${content.url}`)
  if (content.title) parts.push(`Title: ${content.title}`)
  if (content.author) parts.push(`Source: ${content.author}`)
  if (content.publishedAt) parts.push(`Published: ${content.publishedAt}`)
  if (content.description) parts.push(`Summary: ${content.description}`)

  if (content.content && content.content !== content.description) {
    parts.push(`\n--- PAGE CONTENT ---`)
    parts.push(content.content)
    parts.push(`--- END CONTENT ---`)
  }

  return parts.join('\n')
}

// ============================================================================
// MAIN FETCH FUNCTION
// ============================================================================

/**
 * Fetch content from any URL (auto-detects type)
 */
export async function fetchURLContent(url: string): Promise<FetchedContent> {
  const detected = detectURLs(url)[0]

  if (!detected) {
    return {
      url,
      type: 'webpage',
      success: false,
      error: 'Invalid URL',
    }
  }

  switch (detected.type) {
    case 'youtube':
      return fetchYouTubeContent(url, detected.id || '')
    case 'twitter':
      return fetchTwitterContent(url, detected.id)
    case 'github':
      return fetchGitHubContent(url, detected.id)
    default:
      return fetchWebpageContent(url)
  }
}

/**
 * Fetch multiple URLs (with limit)
 */
export async function fetchMultipleURLs(
  urls: string[],
  maxUrls: number = 3
): Promise<FetchedContent[]> {
  const detected = urls.flatMap(url => detectURLs(url))
  const uniqueUrls = [...new Set(detected.map(d => d.url))].slice(0, maxUrls)

  console.log(`[URL_FETCH] Fetching ${uniqueUrls.length} URLs (max ${maxUrls})`)

  const results = await Promise.all(
    uniqueUrls.map(url => fetchURLContent(url))
  )

  const successful = results.filter(r => r.success)
  console.log(`[URL_FETCH] Successfully fetched ${successful.length}/${uniqueUrls.length} URLs`)

  return results
}

/**
 * Build combined context from multiple fetched URLs
 */
export function buildURLContext(fetchedContents: FetchedContent[]): string {
  const successful = fetchedContents.filter(c => c.success && c.content)

  if (successful.length === 0) {
    return ''
  }

  const parts: string[] = [
    `\n[URL CONTENT - The user shared ${successful.length} link(s). Here is the content:]\n`,
  ]

  for (const content of successful) {
    parts.push(content.content || '')
    parts.push('\n')
  }

  parts.push(`[END URL CONTENT]\n`)

  return parts.join('\n')
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ')
}

function cleanTranscript(text: string): string {
  return text
    .replace(/\[.*?\]/g, '') // Remove [Music], [Applause], etc.
    .replace(/\s+/g, ' ')
    .trim()
}

function formatViewCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`
  }
  return count.toString()
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}
