import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth';
import {
  extractTopics,
  generateSynopsis,
  getSuggestions,
  linkQueryToTopics,
  updateTopicRelationships,
} from '@/lib/side-canal';

/**
 * POST /api/side-canal/extract
 * Trigger topic extraction for a query
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('session_token')?.value;
    const user = token ? getUserFromSession(token) : null;
    const userId = user?.id || null;

    const { query, response, queryId, legendMode = false } = await request.json();

    if (!query || !response || !queryId) {
      return NextResponse.json(
        { error: 'query, response, and queryId are required' },
        { status: 400 }
      );
    }

    // Extract topics (with legend mode support)
    const topics = await extractTopics(query, response, userId, legendMode);

    if (topics.length === 0) {
      return NextResponse.json({ topics: [], suggestions: [] });
    }

    // Link query to topics
    const topicIds = topics.map(t => t.id);
    linkQueryToTopics(queryId, topicIds);

    // Update topic relationships
    updateTopicRelationships(topicIds, userId);

    // Generate synopsis for topics (async, don't wait)
    generateSynopsis(topicIds[0], [queryId], userId).catch(console.error);

    // Get suggestions
    const suggestions = getSuggestions(topicIds, userId);

    return NextResponse.json({
      topics,
      suggestions,
    });
  } catch (error) {
    console.error('Side Canal extract error:', error);
    return NextResponse.json(
      { error: 'Failed to extract topics' },
      { status: 500 }
    );
  }
}

