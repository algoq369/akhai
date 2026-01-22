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
    const sessionId = request.cookies.get('akhai_session')?.value || null

    // Get the query (allow authenticated user, session, or legacy queries)
    let query: {
      id: string
      query: string
      flow: string
      created_at: number
      session_id: string | null
      user_id: string | null
    } | undefined

    if (userId) {
      // Authenticated user: get their query or legacy queries
      query = db.prepare(`
        SELECT id, query, flow, created_at, session_id, user_id
        FROM queries
        WHERE id = ? AND (user_id = ? OR user_id IS NULL OR user_id = '')
      `).get(queryId, userId) as typeof query
    } else if (sessionId) {
      // Anonymous user: get their session query or legacy queries
      query = db.prepare(`
        SELECT id, query, flow, created_at, session_id, user_id
        FROM queries
        WHERE id = ? AND (session_id = ? OR session_id IS NULL OR session_id = '')
      `).get(queryId, sessionId) as typeof query
    } else {
      // No auth: only allow legacy queries (single-user dev mode)
      query = db.prepare(`
        SELECT id, query, flow, created_at, session_id, user_id
        FROM queries
        WHERE id = ?
      `).get(queryId) as typeof query
    }

    if (!query) {
      return NextResponse.json(
        { error: 'Query not found' },
        { status: 404 }
      )
    }

    // Get all queries in the same session (or within 1 hour if no session_id)
    const oneHourAgo = query.created_at - 3600
    let sessionQueries: Array<{
      id: string
      query: string
      flow: string
      result: string | null
      created_at: number
      gnostic_metadata: string | null
    }>

    if (userId) {
      // Authenticated user: get their session queries + legacy
      sessionQueries = db.prepare(`
        SELECT id, query, flow, result, created_at, gnostic_metadata
        FROM queries
        WHERE (user_id = ? OR user_id IS NULL OR user_id = '')
          AND (
            (session_id IS NOT NULL AND session_id = ?)
            OR (session_id IS NULL AND created_at >= ? AND created_at <= ? + 3600)
          )
        ORDER BY created_at ASC
      `).all(userId, query.session_id || '', oneHourAgo, query.created_at) as typeof sessionQueries
    } else if (sessionId) {
      // Anonymous user: get their session queries + legacy
      sessionQueries = db.prepare(`
        SELECT id, query, flow, result, created_at, gnostic_metadata
        FROM queries
        WHERE (session_id = ? OR session_id IS NULL OR session_id = '')
          AND (
            (session_id IS NOT NULL AND session_id = ?)
            OR (session_id IS NULL AND created_at >= ? AND created_at <= ? + 3600)
          )
        ORDER BY created_at ASC
      `).all(sessionId, query.session_id || '', oneHourAgo, query.created_at) as typeof sessionQueries
    } else {
      // No auth: get legacy queries only (single-user dev mode)
      sessionQueries = db.prepare(`
        SELECT id, query, flow, result, created_at, gnostic_metadata
        FROM queries
        WHERE (session_id IS NULL OR session_id = '')
          AND created_at >= ? AND created_at <= ? + 3600
        ORDER BY created_at ASC
      `).all(oneHourAgo, query.created_at) as typeof sessionQueries
    }

    // Build conversation messages
    const messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: number; methodology?: string; gnostic?: any }> = []

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
        // Parse gnostic metadata if available
        let gnosticData = null
        if (q.gnostic_metadata) {
          try {
            gnosticData = JSON.parse(q.gnostic_metadata)
          } catch (e) {
            console.warn('Failed to parse gnostic metadata:', e)
          }
        }

        try {
          const result = JSON.parse(q.result)
          const response = result.finalAnswer || result.response || ''
          if (response) {
            messages.push({
              role: 'assistant',
              content: response,
              timestamp: q.created_at,
              methodology: q.flow,
              gnostic: gnosticData
            })
          }
        } catch (e) {
          // If result is not JSON, use as-is
          if (q.result) {
            messages.push({
              role: 'assistant',
              content: q.result,
              timestamp: q.created_at,
              methodology: q.flow,
              gnostic: gnosticData
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

