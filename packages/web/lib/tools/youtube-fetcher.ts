/**
 * YouTube Video Fetcher
 * Fetches video metadata, transcripts, and captions from YouTube
 * Supports both YouTube API and direct transcript scraping
 */

import { Innertube } from 'youtubei.js/web'

export interface YouTubeVideo {
  videoId: string
  title?: string
  description?: string
  channel?: string
  viewCount?: string
  uploadDate?: string
  duration?: string
  transcript?: string
  thumbnailUrl?: string
}

/**
 * Extract video ID from YouTube URL
 */
export function extractVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url)

    // youtu.be format
    if (urlObj.hostname.includes('youtu.be')) {
      return urlObj.pathname.slice(1).split('?')[0]
    }

    // youtube.com format
    if (urlObj.hostname.includes('youtube.com')) {
      return urlObj.searchParams.get('v')
    }

    return null
  } catch {
    return null
  }
}

/**
 * Fetch video metadata from YouTube API
 * Requires YOUTUBE_API_KEY environment variable
 */
async function fetchVideoMetadataAPI(videoId: string): Promise<Partial<YouTubeVideo>> {
  const apiKey = process.env.YOUTUBE_API_KEY

  if (!apiKey) {
    console.log('[YouTube] No API key found, skipping metadata fetch')
    return {}
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet,statistics,contentDetails`
    const response = await fetch(url)

    if (!response.ok) {
      console.error('[YouTube] API error:', response.status, response.statusText)
      return {}
    }

    const data = await response.json()

    if (!data.items || data.items.length === 0) {
      return {}
    }

    const video = data.items[0]
    const snippet = video.snippet
    const statistics = video.statistics

    return {
      title: snippet?.title,
      description: snippet?.description,
      channel: snippet?.channelTitle,
      viewCount: statistics?.viewCount ? `${parseInt(statistics.viewCount).toLocaleString()} views` : undefined,
      uploadDate: snippet?.publishedAt ? new Date(snippet.publishedAt).toLocaleDateString() : undefined,
      duration: video.contentDetails?.duration,
      thumbnailUrl: snippet?.thumbnails?.high?.url || snippet?.thumbnails?.default?.url,
    }
  } catch (error) {
    console.error('[YouTube] Metadata fetch error:', error)
    return {}
  }
}

/**
 * Fetch video transcript using youtubei.js
 * No API key required - uses YouTube's internal API
 */
async function fetchTranscript(videoId: string): Promise<string | null> {
  try {
    console.log(`[YouTube] Fetching transcript for: ${videoId}`)

    const youtube = await Innertube.create({
      cache: new Proxy({}, {
        get: () => () => {},
        set: () => true,
      }) as any,
    })

    const info = await youtube.getInfo(videoId)

    const transcriptData = await info.getTranscript()

    if (!transcriptData || !transcriptData.transcript) {
      console.log('[YouTube] No transcript available for this video')
      return null
    }

    // Check for transcript content and body
    if (!transcriptData.transcript.content || !transcriptData.transcript.content.body) {
      console.log('[YouTube] Transcript content is incomplete')
      return null
    }

    // Combine all transcript segments
    const fullTranscript = transcriptData.transcript.content.body.initial_segments
      .map((segment: any) => segment.snippet.text)
      .join(' ')
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()

    console.log(`[YouTube] Transcript fetched: ${fullTranscript.length} characters`)
    return fullTranscript

  } catch (error: any) {
    console.error('[YouTube] Transcript fetch error:', error.message || error)
    return null
  }
}

/**
 * Fetch complete YouTube video data
 * Combines metadata and transcript
 */
export async function fetchYouTubeVideo(url: string): Promise<YouTubeVideo | null> {
  const videoId = extractVideoId(url)

  if (!videoId) {
    console.error('[YouTube] Invalid URL or could not extract video ID')
    return null
  }

  console.log(`[YouTube] Fetching video: ${videoId}`)

  // Fetch metadata and transcript in parallel
  const [metadata, transcript] = await Promise.all([
    fetchVideoMetadataAPI(videoId),
    fetchTranscript(videoId),
  ])

  const video: YouTubeVideo = {
    videoId,
    ...metadata,
    transcript: transcript || undefined,
  }

  // Log what we got
  console.log('[YouTube] Fetched:', {
    hasTitle: !!video.title,
    hasDescription: !!video.description,
    hasTranscript: !!video.transcript,
    transcriptLength: video.transcript?.length || 0,
  })

  return video
}

/**
 * Format YouTube video data for AI analysis
 */
export function formatYouTubeData(video: YouTubeVideo): string {
  const parts: string[] = []

  if (video.title) {
    parts.push(`Title: ${video.title}`)
  }

  if (video.channel) {
    parts.push(`Channel: ${video.channel}`)
  }

  if (video.uploadDate) {
    parts.push(`Upload Date: ${video.uploadDate}`)
  }

  if (video.viewCount) {
    parts.push(`Views: ${video.viewCount}`)
  }

  if (video.description) {
    // Truncate long descriptions
    const desc = video.description.length > 500
      ? video.description.slice(0, 500) + '...'
      : video.description
    parts.push(`\nDescription:\n${desc}`)
  }

  if (video.transcript) {
    // Truncate very long transcripts
    const transcript = video.transcript.length > 10000
      ? video.transcript.slice(0, 10000) + '... [transcript truncated]'
      : video.transcript
    parts.push(`\nTranscript:\n${transcript}`)
  }

  if (parts.length === 0) {
    return `YouTube Video ID: ${video.videoId}\nURL: https://www.youtube.com/watch?v=${video.videoId}\n\nNote: Could not fetch video details. The video may be private, age-restricted, or have transcripts disabled.`
  }

  return parts.join('\n')
}
