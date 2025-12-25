import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { getUserFromSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('session_token')?.value
    const user = token ? getUserFromSession(token) : null
    const userId = user?.id || null

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get recent topics (last 10) with their most recent query
    let recentTopics: Array<{
      id: string
      name: string
      category: string | null
      created_at: number
      query_id: string | null
    }> = []
    try {
      recentTopics = db.prepare(`
        SELECT 
          t.id, 
          t.name, 
          t.category, 
          t.created_at,
          (SELECT qt.query_id FROM query_topics qt WHERE qt.topic_id = t.id ORDER BY qt.query_id DESC LIMIT 1) as query_id
        FROM topics t
        WHERE t.user_id = ? AND t.archived = 0
        ORDER BY t.created_at DESC
        LIMIT 10
      `).all(userId) as Array<{
        id: string
        name: string
        category: string | null
        created_at: number
        query_id: string | null
      }>
    } catch (error) {
      console.error('Error fetching recent topics:', error)
      recentTopics = []
    }

    // Get total topic count
    let totalTopics = 0
    try {
      const result = db.prepare(`
        SELECT COUNT(*) as count FROM topics WHERE user_id = ? AND archived = 0
      `).get(userId) as { count: number } | undefined
      totalTopics = result?.count || 0
    } catch (error) {
      console.error('Error fetching topic count:', error)
    }

    // Get total connections count
    let totalConnections = 0
    try {
      const result = db.prepare(`
        SELECT COUNT(*) as count FROM topic_relationships WHERE user_id = ?
      `).get(userId) as { count: number } | undefined
      totalConnections = result?.count || 0
    } catch (error) {
      console.error('Error fetching connection count:', error)
    }

    const topics = recentTopics.map(t => ({
      id: t.id,
      name: t.name,
      category: t.category,
      created_at: t.created_at,
      queryId: t.query_id,
      status: 'extracted' as const
    }))

    return NextResponse.json({
      topics,
      totalTopics,
      totalConnections
    })
  } catch (error) {
    console.error('Dashboard live topics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch live topics' },
      { status: 500 }
    )
  }
}
