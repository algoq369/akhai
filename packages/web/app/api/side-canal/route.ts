import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth';
import {
  extractTopics,
  generateSynopsis,
  getSuggestions,
  getContextForQuery,
  linkQueryToTopics,
  updateTopicRelationships,
} from '@/lib/side-canal';
import { db } from '@/lib/database';

/**
 * GET /api/side-canal/topics
 * Get all topics for current user
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('session_token')?.value;
    const user = token ? getUserFromSession(token) : null;
    const userId = user?.id || null;

    const topics = db.prepare(`
      SELECT * FROM topics
      WHERE user_id = ? OR user_id IS NULL
      ORDER BY created_at DESC
      LIMIT 50
    `).all(userId) as Array<{
      id: string;
      name: string;
      description: string | null;
      category: string | null;
      user_id: string | null;
      created_at: number;
      updated_at: number;
    }>;

    return NextResponse.json({ topics });
  } catch (error) {
    console.error('Side Canal GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/side-canal/extract
 * Trigger topic extraction for a query
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('session_token')?.value;
    const user = token ? getUserFromSession(token) : null;
    const userId = user?.id || null;

    const { query, response, queryId } = await request.json();

    if (!query || !response || !queryId) {
      return NextResponse.json(
        { error: 'query, response, and queryId are required' },
        { status: 400 }
      );
    }

    // Extract topics
    const topics = await extractTopics(query, response, userId);

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
    console.error('Side Canal POST error:', error);
    return NextResponse.json(
      { error: 'Failed to extract topics' },
      { status: 500 }
    );
  }
}

