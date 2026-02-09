/**
 * Get queries/discussions linked to a specific topic
 * Returns the conversation history for a topic
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { getUserFromSession } from '@/lib/auth'

interface QueryRow {
  id: string
  content: string
  methodology: string | null
  created_at: number
  conversation_id: string | null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get user from session
    const token = request.cookies.get('session_token')?.value
    const user = token ? getUserFromSession(token) : null
    const userId = user?.id || null

    const effectiveUserId = userId || 'anonymous'

    const { id: topicId } = await params

    // Verify topic belongs to user
    const topic = db.prepare(`
      SELECT id, name, user_id FROM topics WHERE id = ?
    `).get(topicId) as { id: string; name: string; user_id: string | null } | undefined

    if (!topic || (topic.user_id !== effectiveUserId && topic.user_id !== null)) {
      return NextResponse.json(
        { error: 'Topic not found or access denied' },
        { status: 404 }
      )
    }

    // Get query limit from search params (default 20)
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get queries linked to this topic
    const queries = db.prepare(`
      SELECT
        q.id,
        q.content,
        q.methodology,
        q.created_at,
        q.conversation_id
      FROM queries q
      INNER JOIN query_topics qt ON q.id = qt.query_id
      WHERE qt.topic_id = ?
        AND q.user_id = ?
      ORDER BY q.created_at DESC
      LIMIT ? OFFSET ?
    `).all(topicId, effectiveUserId, limit, offset) as QueryRow[]

    // Get total count for pagination
    const countResult = db.prepare(`
      SELECT COUNT(*) as total
      FROM query_topics qt
      INNER JOIN queries q ON q.id = qt.query_id
      WHERE qt.topic_id = ?
        AND q.user_id = ?
    `).get(topicId, effectiveUserId) as { total: number }

    // Format response
    const discussions = queries.map(q => ({
      id: q.id,
      text: q.content.length > 100 ? q.content.slice(0, 97) + '...' : q.content,
      fullText: q.content,
      methodology: q.methodology,
      createdAt: q.created_at,
      conversationId: q.conversation_id,
    }))

    return NextResponse.json({
      topicId,
      topicName: topic.name,
      discussions,
      total: countResult.total,
      hasMore: offset + queries.length < countResult.total,
    })
  } catch (error) {
    console.error('Get topic queries error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch topic queries' },
      { status: 500 }
    )
  }
}
