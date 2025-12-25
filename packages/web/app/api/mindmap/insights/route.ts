/**
 * Mind Map Insights API
 * Computes insights (sentiment, bias, market correlation, manipulation, factuality) for topics
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { getUserFromSession } from '@/lib/auth'
import { computeInsightsBatch } from '@/lib/mindmap-insights'

export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const token = request.cookies.get('session_token')?.value
    const user = token ? getUserFromSession(token) : null
    const userId = user?.id || null

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get all topics for user
    const topics = db.prepare(`
      SELECT 
        t.id,
        t.name,
        t.description,
        t.category,
        t.color,
        t.pinned,
        t.archived,
        t.ai_instructions,
        COUNT(DISTINCT qt.query_id) as query_count
      FROM topics t
      LEFT JOIN query_topics qt ON t.id = qt.topic_id
      WHERE t.user_id = ? AND t.archived = 0
      GROUP BY t.id
    `).all(userId) as Array<{
      id: string
      name: string
      description: string | null
      category: string | null
      color: string | null
      pinned: number
      archived: number
      ai_instructions: string | null
      query_count: number
    }>

    // Convert to Node format
    const nodes = topics.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.category || 'other',
      color: t.color || '#A3A3A3',
      pinned: t.pinned === 1,
      archived: t.archived === 1,
      queryCount: t.query_count,
      ai_instructions: t.ai_instructions,
    }))

    // Compute insights
    const insights = computeInsightsBatch(nodes)

    return NextResponse.json({ insights })
  } catch (error) {
    console.error('Mind map insights error:', error)
    return NextResponse.json(
      { error: 'Failed to compute insights' },
      { status: 500 }
    )
  }
}

