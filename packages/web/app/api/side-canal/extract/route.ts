import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromSession } from '@/lib/auth';
import {
  extractTopics,
  generateSynopsis,
  getSuggestions,
  linkQueryToTopics,
  updateTopicRelationships,
} from '@/lib/side-canal';

export const dynamic = 'force-dynamic';

const ExtractSchema = z.object({
  query: z.string().min(1).max(10000),
  response: z.string().min(1),
  queryId: z.string().min(1),
  legendMode: z.boolean().default(false),
});

/**
 * POST /api/side-canal/extract
 * Trigger topic extraction for a query
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('session_token')?.value;
    const user = token ? getUserFromSession(token) : null;
    const userId = user?.id || null;

    const parsed = ExtractSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.format() },
        { status: 400 }
      );
    }
    const { query, response, queryId, legendMode } = parsed.data;

    // Extract topics
    const topics = await extractTopics(query, response, userId);

    if (topics.length === 0) {
      return NextResponse.json({ topics: [], suggestions: [] });
    }

    // Link query to topics
    const topicIds = topics.map((t) => t.id);
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
    return NextResponse.json({ error: 'Failed to extract topics' }, { status: 500 });
  }
}
