import { NextRequest, NextResponse } from 'next/server'
import { callProvider } from '@/lib/multi-provider-api'
import { fetchYouTubeVideo, formatYouTubeData } from '@/lib/tools/youtube-fetcher'

/**
 * Web Browsing API
 *
 * Fetches and analyzes web pages, GitHub repos, YouTube videos, images, etc.
 * Uses Anthropic's vision capabilities for images/videos.
 */
export async function POST(request: NextRequest) {
  try {
    const { url, query, type } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Validate URL
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Detect content type if not provided
    const detectedType = type || detectContentType(parsedUrl)

    // Fetch and analyze based on type
    let analysis: any

    switch (detectedType) {
      case 'github':
        analysis = await analyzeGitHub(parsedUrl, query)
        break
      case 'youtube':
        analysis = await analyzeYouTube(parsedUrl, query)
        break
      case 'image':
        analysis = await analyzeImage(parsedUrl, query)
        break
      case 'webpage':
      default:
        analysis = await analyzeWebpage(parsedUrl, query)
        break
    }

    return NextResponse.json({
      url,
      type: detectedType,
      analysis,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('[WebBrowse] Error:', error)
    return NextResponse.json(
      { error: 'Failed to browse URL', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Detect content type from URL
 */
function detectContentType(url: URL): string {
  const hostname = url.hostname.toLowerCase()
  const pathname = url.pathname.toLowerCase()

  // GitHub
  if (hostname.includes('github.com')) {
    return 'github'
  }

  // YouTube
  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    return 'youtube'
  }

  // Image extensions
  if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(pathname)) {
    return 'image'
  }

  return 'webpage'
}

/**
 * Analyze GitHub repository or file
 */
async function analyzeGitHub(url: URL, userQuery?: string) {
  const pathname = url.pathname
  const isRepo = pathname.split('/').length <= 3
  const isFile = pathname.includes('/blob/')
  const isIssue = pathname.includes('/issues/')
  const isPR = pathname.includes('/pull/')

  // Extract owner/repo
  const parts = pathname.split('/').filter(Boolean)
  const owner = parts[0]
  const repo = parts[1]

  let content = ''
  let metadata: any = {}

  try {
    if (isFile) {
      // Fetch file content via raw.githubusercontent.com
      const rawUrl = url.href
        .replace('github.com', 'raw.githubusercontent.com')
        .replace('/blob/', '/')

      const fileResponse = await fetch(rawUrl)
      content = await fileResponse.text()

      metadata = {
        type: 'file',
        owner,
        repo,
        path: pathname.replace(`/${owner}/${repo}/blob/`, ''),
      }
    } else if (isRepo) {
      // Fetch README via GitHub API
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/readme`
      const readmeResponse = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/vnd.github.v3.raw',
          'User-Agent': 'AkhAI-Browser',
        },
      })

      if (readmeResponse.ok) {
        content = await readmeResponse.text()
      }

      // Fetch repo metadata
      const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          'User-Agent': 'AkhAI-Browser',
        },
      })

      if (repoResponse.ok) {
        const repoData = await repoResponse.json()
        metadata = {
          type: 'repository',
          owner,
          repo,
          description: repoData.description,
          stars: repoData.stargazers_count,
          language: repoData.language,
          topics: repoData.topics,
        }
      }
    }

    // Analyze with Claude
    const prompt = userQuery
      ? `Analyze this GitHub ${metadata.type}: ${userQuery}\n\nContent:\n${content.slice(0, 10000)}`
      : `Provide a comprehensive analysis of this GitHub ${metadata.type}:\n\nContent:\n${content.slice(0, 10000)}`

    const response = await callProvider('anthropic', {
      messages: [{
        role: 'user',
        content: prompt,
      }],
      model: 'claude-3-5-haiku-20241022',
      maxTokens: 2000,
    })

    return {
      metadata,
      summary: response.content,
      rawContent: content.slice(0, 1000), // First 1000 chars
    }
  } catch (error) {
    console.error('[GitHub Analysis] Error:', error)
    return {
      metadata,
      error: 'Failed to analyze GitHub content',
    }
  }
}

/**
 * Analyze YouTube video
 */
async function analyzeYouTube(url: URL, userQuery?: string) {
  console.log('[WebBrowse] Analyzing YouTube:', url.href)

  // Fetch video data (metadata + transcript)
  const video = await fetchYouTubeVideo(url.href)

  if (!video) {
    return { error: 'Could not fetch YouTube video data. The video may be private, age-restricted, or unavailable.' }
  }

  // Format video data for AI
  const videoData = formatYouTubeData(video)

  // Analyze with AI
  const prompt = userQuery
    ? `Analyze this YouTube video and answer the user's question: "${userQuery}"\n\n${videoData}`
    : `Analyze this YouTube video. Provide a comprehensive summary of its content, main topics, and key insights.\n\n${videoData}`

  const response = await callProvider('anthropic', {
    messages: [{
      role: 'user',
      content: prompt,
    }],
    model: 'claude-3-5-haiku-20241022',
    maxTokens: 2000,
  })

  return {
    videoId: video.videoId,
    url: url.href,
    title: video.title,
    channel: video.channel,
    uploadDate: video.uploadDate,
    viewCount: video.viewCount,
    thumbnailUrl: video.thumbnailUrl,
    hasTranscript: !!video.transcript,
    transcriptLength: video.transcript?.length || 0,
    analysis: response.content,
  }
}

/**
 * Analyze image
 */
async function analyzeImage(url: URL, userQuery?: string) {
  try {
    // Note: Vision API requires special handling
    // For now, return basic info about the image
    const fetchResponse = await fetch(url.href, { method: 'HEAD' })
    const contentType = fetchResponse.headers.get('content-type') || 'image/jpeg'
    const contentLength = fetchResponse.headers.get('content-length') || 'unknown'

    return {
      url: url.href,
      mediaType: contentType,
      size: contentLength,
      note: 'Image vision analysis requires Claude Vision API integration (coming soon)',
      query: userQuery || 'general analysis',
    }
  } catch (error) {
    console.error('[Image Analysis] Error:', error)
    return {
      error: 'Failed to analyze image',
      details: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Analyze general webpage
 */
async function analyzeWebpage(url: URL, userQuery?: string) {
  try {
    // Fetch webpage
    const fetchResponse = await fetch(url.href, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AkhAI-Browser/1.0)',
      },
    })

    const html = await fetchResponse.text()

    // Extract text content (simple approach - remove scripts/styles)
    const textContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 15000) // Limit to 15k chars

    // Analyze with Claude
    const prompt = userQuery
      ? `Analyze this webpage and answer: ${userQuery}\n\nContent:\n${textContent}`
      : `Provide a comprehensive analysis of this webpage:\n\nContent:\n${textContent}`

    const response = await callProvider('anthropic', {
      messages: [{
        role: 'user',
        content: prompt,
      }],
      model: 'claude-3-5-haiku-20241022',
      maxTokens: 2000,
    })

    return {
      url: url.href,
      title: extractTitle(html),
      summary: response.content,
      contentPreview: textContent.slice(0, 500),
    }
  } catch (error) {
    console.error('[Webpage Analysis] Error:', error)
    return {
      error: 'Failed to analyze webpage',
      details: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Extract page title from HTML
 */
function extractTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return titleMatch ? titleMatch[1].trim() : 'Untitled'
}
