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

    // Initialize empty results in case tables don't exist yet
    let topTopics: Array<{
      id: string
      name: string
      connection_count: number
    }> = []
    let recentConnections: any[] = []
    let categoryDistribution: Array<{
      category: string
      count: number
    }> = []
    let totalTopics = { count: 0 }
    let totalRelationships = { count: 0 }

    try {
      // Get top 20 most connected topics
      topTopics = db.prepare(`
      SELECT 
        t.id,
        t.name,
        COUNT(DISTINCT tr1.id) + COUNT(DISTINCT tr2.id) as connection_count
      FROM topics t
      LEFT JOIN topic_relationships tr1 ON t.id = tr1.topic_from
      LEFT JOIN topic_relationships tr2 ON t.id = tr2.topic_to
      WHERE t.user_id = ? AND t.archived = 0
      GROUP BY t.id
      ORDER BY connection_count DESC
      LIMIT 20
    `).all(userId) as Array<{
      id: string
      name: string
      connection_count: number
    }>

    // Get recent connections (last 10 relationships)
    const recentConnections = db.prepare(`
      SELECT tr.id, tr.topic_from, tr.topic_to, tr.relationship_type, tr.created_at,
             t1.name as from_name, t2.name as to_name
      FROM topic_relationships tr
      JOIN topics t1 ON tr.topic_from = t1.id
      JOIN topics t2 ON tr.topic_to = t2.id
      WHERE tr.user_id = ?
      ORDER BY tr.created_at DESC
      LIMIT 10
    `).all(userId)

    // Get topic categories distribution
    const categoryDistribution = db.prepare(`
      SELECT category, COUNT(*) as count
      FROM topics
      WHERE user_id = ? AND archived = 0 AND category IS NOT NULL
      GROUP BY category
    `).all(userId) as Array<{
      category: string
      count: number
    }>

      // Get total stats
      totalTopics = db.prepare(`
        SELECT COUNT(*) as count FROM topics WHERE user_id = ? AND archived = 0
      `).get(userId) as { count: number } || { count: 0 }

      totalRelationships = db.prepare(`
        SELECT COUNT(*) as count FROM topic_relationships WHERE user_id = ?
      `).get(userId) as { count: number } || { count: 0 }
    } catch (error) {
      console.error('Error fetching mindmap preview data:', error)
      // Use empty defaults already set above
    }

    return NextResponse.json({
      topTopics,
      recentConnections,
      categoryDistribution,
      stats: {
        totalTopics: totalTopics.count,
        totalRelationships: totalRelationships.count,
        recentTopics: []
      }
    })
  } catch (error) {
    console.error('Dashboard mindmap preview error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch mindmap preview' },
      { status: 500 }
    )
  }
}

