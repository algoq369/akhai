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

    // Get recent topics (last 10) - handle case where topics table might not exist yet
    let recentTopics: Array<{
      id: string
      name: string
      category: string | null
      created_at: number
    }> = []
    try {
      recentTopics = db.prepare(`
        SELECT id, name, category, created_at
        FROM topics
        WHERE user_id = ? AND archived = 0
        ORDER BY created_at DESC
        LIMIT 10
      `).all(userId) as Array<{
        id: string
        name: string
        category: string | null
        created_at: number
      }>
    } catch (error) {
      console.error('Error fetching recent topics:', error)
      // Return empty array if table doesn't exist yet
      recentTopics = []
    }

    // Get topic relationships created in last 5 minutes
    let recentRelationships = { count: 0 }
    try {
      const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 300
      recentRelationships = db.prepare(`
        SELECT COUNT(*) as count
        FROM topic_relationships
        WHERE user_id = ? AND created_at > ?
      `).get(userId, fiveMinutesAgo) as { count: number } || { count: 0 }
    } catch (error) {
      console.error('Error fetching recent relationships:', error)
      recentRelationships = { count: 0 }
    }

    // Get query-to-topic associations
    let queryTopicAssociations = { count: 0 }
    try {
      queryTopicAssociations = db.prepare(`
        SELECT COUNT(DISTINCT qt.query_id) as count
        FROM query_topics qt
        JOIN topics t ON qt.topic_id = t.id
        WHERE t.user_id = ?
      `).get(userId) as { count: number } || { count: 0 }
    } catch (error) {
      console.error('Error fetching query-topic associations:', error)
      queryTopicAssociations = { count: 0 }
    }

    const topics = recentTopics.map(t => ({
      id: t.id,
      name: t.name,
      category: t.category,
      created_at: t.created_at,
      status: 'extracted' as const
    }))

    return NextResponse.json({
      topics,
      relationshipsCount: recentRelationships.count,
      queryAssociations: queryTopicAssociations.count
    })
  } catch (error) {
    console.error('Dashboard live topics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch live topics' },
      { status: 500 }
    )
  }
}

