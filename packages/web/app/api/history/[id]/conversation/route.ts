import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { getUserFromSession } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: queryId } = await params
    const token = request.cookies.get('session_token')?.value
    const user = token ? getUserFromSession(token) : null
    const userId = user?.id || null

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get the query
    const query = db.prepare(`
      SELECT id, query, flow, created_at, session_id
      FROM queries
      WHERE id = ? AND user_id = ?
    `).get(queryId, userId) as {
      id: string
      query: string
      flow: string
      created_at: number
      session_id: string | null
    } | undefined

    if (!query) {
      return NextResponse.json(
        { error: 'Query not found' },
        { status: 404 }
      )
    }

    // Get all queries in the same session (or within 1 hour if no session_id)
    const oneHourAgo = query.created_at - 3600
    const sessionQueries = db.prepare(`
      SELECT id, query, flow, result, created_at
      FROM queries
      WHERE user_id = ?
        AND (
          (session_id IS NOT NULL AND session_id = ?)
          OR (session_id IS NULL AND created_at >= ? AND created_at <= ? + 3600)
        )
      ORDER BY created_at ASC
    `).all(userId, query.session_id || '', oneHourAgo, query.created_at) as Array<{
      id: string
      query: string
      flow: string
      result: string | null
      created_at: number
    }>

    // Build conversation messages
    const messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: number; methodology?: string }> = []

    sessionQueries.forEach((q) => {
      // Add user query
      messages.push({
        role: 'user',
        content: q.query,
        timestamp: q.created_at,
        methodology: q.flow
      })

      // Add assistant response if available
      if (q.result) {
        try {
          const result = JSON.parse(q.result)
          const response = result.finalAnswer || result.response || ''
          if (response) {
            messages.push({
              role: 'assistant',
              content: response,
              timestamp: q.created_at,
              methodology: q.flow
            })
          }
        } catch (e) {
          // If result is not JSON, use as-is
          if (q.result) {
            messages.push({
              role: 'assistant',
              content: q.result,
              timestamp: q.created_at,
              methodology: q.flow
            })
          }
        }
      }
    })

    return NextResponse.json({
      queryId,
      messages,
      sessionId: query.session_id
    })
  } catch (error) {
    console.error('Conversation history error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversation history' },
      { status: 500 }
    )
  }
}

