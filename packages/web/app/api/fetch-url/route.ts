/**
 * URL Fetch API Endpoint
 * Fetches content from URLs for AI context injection
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  fetchURLContent,
  fetchMultipleURLs,
  buildURLContext,
  type FetchedContent,
} from '@/lib/url-content-fetcher'
import { detectURLs, hasURLs } from '@/lib/url-detector'

export async function POST(request: NextRequest) {
  try {
    const { urls, text, maxUrls = 3 } = await request.json()

    // If text provided, extract URLs from it
    let urlsToFetch: string[] = []

    if (text && typeof text === 'string') {
      if (!hasURLs(text)) {
        return NextResponse.json({
          success: true,
          urlsFound: 0,
          results: [],
          context: '',
        })
      }
      const detected = detectURLs(text)
      urlsToFetch = detected.map(d => d.url)
    } else if (urls && Array.isArray(urls)) {
      urlsToFetch = urls
    } else if (urls && typeof urls === 'string') {
      urlsToFetch = [urls]
    }

    if (urlsToFetch.length === 0) {
      return NextResponse.json({
        success: true,
        urlsFound: 0,
        results: [],
        context: '',
      })
    }

    console.log(`[URL_FETCH] API received ${urlsToFetch.length} URLs to fetch`)

    // Fetch content from URLs
    const results = await fetchMultipleURLs(urlsToFetch, maxUrls)

    // Build context string for AI
    const context = buildURLContext(results)

    // Return results
    return NextResponse.json({
      success: true,
      urlsFound: urlsToFetch.length,
      urlsFetched: results.filter(r => r.success).length,
      results: results.map(r => ({
        url: r.url,
        type: r.type,
        success: r.success,
        title: r.title,
        error: r.error,
      })),
      context,
    })
  } catch (error) {
    console.error('[URL_FETCH] API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch URLs',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json(
      { error: 'URL parameter required' },
      { status: 400 }
    )
  }

  try {
    console.log(`[URL_FETCH] GET request for: ${url}`)

    const result = await fetchURLContent(url)

    return NextResponse.json({
      ...result,
    })
  } catch (error) {
    console.error('[URL_FETCH] GET error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch URL',
      },
      { status: 500 }
    )
  }
}
