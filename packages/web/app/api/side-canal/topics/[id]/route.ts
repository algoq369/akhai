import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth';
import { db } from '@/lib/database';
import { generateSynopsis } from '@/lib/side-canal';

/**
 * GET /api/side-canal/topics/[id]
 * Get topic details with synopsis and related queries
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: topicId } = await params;
    const token = request.cookies.get('session_token')?.value;
    const user = token ? getUserFromSession(token) : null;
    const userId = user?.id || null;

    // Get topic
    const topic = db.prepare(`
      SELECT * FROM topics
      WHERE id = ? AND (user_id = ? OR user_id IS NULL)
    `).get(topicId, userId) as {
      id: string;
      name: string;
      description: string | null;
      category: string | null;
      user_id: string | null;
      created_at: number;
      updated_at: number;
    } | undefined;

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Get synopsis
    const synopsis = db.prepare(`
      SELECT * FROM synopses
      WHERE topic_id = ? AND (user_id = ? OR user_id IS NULL)
      ORDER BY updated_at DESC
      LIMIT 1
    `).get(topicId, userId) as {
      id: string;
      topic_id: string;
      content: string;
      query_ids: string;
      user_id: string | null;
      created_at: number;
      updated_at: number;
    } | undefined;

    // Get related queries
    const queries = db.prepare(`
      SELECT q.id, q.query, q.created_at
      FROM queries q
      JOIN query_topics qt ON q.id = qt.query_id
      WHERE qt.topic_id = ? AND (q.user_id = ? OR q.user_id IS NULL)
      ORDER BY q.created_at DESC
      LIMIT 10
    `).all(topicId, userId) as Array<{
      id: string;
      query: string;
      created_at: number;
    }>;

    return NextResponse.json({
      topic,
      synopsis: synopsis?.content || null,
      relatedQueries: queries,
    });
  } catch (error) {
    console.error('Topic details GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get topic details' },
      { status: 500 }
    );
  }
}

