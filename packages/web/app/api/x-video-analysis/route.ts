/**
 * X/Twitter Video Analysis API
 *
 * Analyzes videos from X/Twitter posts using Claude's vision capabilities
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractTweetId, fetchXThread, extractVideos } from '@/lib/tools/x-thread-fetcher';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Download video and extract frames for analysis
 * For now, we'll use the preview image (thumbnail) as a fallback
 * In production, you'd want to extract multiple frames from the video
 */
async function fetchVideoPreview(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return base64;
  } catch (error) {
    console.error('Failed to fetch video preview:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, userId, analysisPrompt } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'X/Twitter URL is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required. Please log in.' },
        { status: 401 }
      );
    }

    // Extract tweet ID
    const tweetId = extractTweetId(url);
    if (!tweetId) {
      return NextResponse.json(
        { error: 'Invalid X/Twitter URL. Please provide a valid tweet URL.' },
        { status: 400 }
      );
    }

    // Fetch thread with media
    let thread;
    try {
      thread = await fetchXThread(tweetId, userId);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Failed to fetch X content. Please connect your X account in settings.' },
        { status: 401 }
      );
    }

    if (!thread) {
      return NextResponse.json(
        { error: 'Tweet not found or inaccessible' },
        { status: 404 }
      );
    }

    // Extract videos
    const videos = extractVideos(thread);
    if (videos.length === 0) {
      return NextResponse.json(
        { error: 'No videos found in this tweet' },
        { status: 404 }
      );
    }

    // For now, analyze the first video's preview image
    // TODO: Implement actual video frame extraction
    const firstVideo = videos[0];
    const previewUrl = firstVideo.preview || firstVideo.url;

    // Fetch the preview image
    const imageData = await fetchVideoPreview(previewUrl);
    if (!imageData) {
      return NextResponse.json(
        { error: 'Failed to fetch video preview' },
        { status: 500 }
      );
    }

    // Analyze with Claude Vision
    const prompt = analysisPrompt || 'Analyze this video thumbnail. What can you see? What is the likely content of this video?';

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageData,
              },
            },
            {
              type: 'text',
              text: `${prompt}\n\nContext: This is from a tweet by @${thread.author.username}\nTweet text: ${thread.tweets[0].text}`,
            },
          ],
        },
      ],
    });

    const analysis = message.content[0].type === 'text' ? message.content[0].text : 'No analysis available';

    return NextResponse.json({
      success: true,
      tweet: {
        id: thread.id,
        author: thread.author,
        text: thread.tweets[0].text,
      },
      videos,
      analysis,
      note: 'Currently analyzing video preview/thumbnail. Full video frame extraction coming soon.',
    });

  } catch (error: any) {
    console.error('X video analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze video' },
      { status: 500 }
    );
  }
}
