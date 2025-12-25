/**
 * List user's topics
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { getUserFromSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const token = request.cookies.get('session_token')?.value
    const user = token ? getUserFromSession(token) : null
    const userId = user?.id || null

    // Get topics for user (or public topics if not logged in)
    const topics = db.prepare(`
      SELECT 
        t.id,
        t.name,
        t.description,
        t.category,
        t.created_at,
        COUNT(qt.query_id) as query_count
      FROM topics t
      LEFT JOIN query_topics qt ON t.id = qt.topic_id
      WHERE t.user_id = ? OR t.user_id IS NULL
      GROUP BY t.id
      ORDER BY t.created_at DESC
      LIMIT 50
    `).all(userId) as Array<{
      id: string
      name: string
      description: string | null
      category: string | null
      created_at: number
      query_count: number
    }>

    return NextResponse.json({
      topics,
      count: topics.length,
    })
  } catch (error) {
    console.error('Topics list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    )
  }
}


