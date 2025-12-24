/**
 * Mind Map Data API
 * Returns topics with relationships for visualization
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
        t.created_at,
        COUNT(DISTINCT qt.query_id) as query_count
      FROM topics t
      LEFT JOIN query_topics qt ON t.id = qt.topic_id
      WHERE t.user_id = ?
      GROUP BY t.id
      ORDER BY t.pinned DESC, t.created_at DESC
    `).all(userId) as Array<{
      id: string
      name: string
      description: string | null
      category: string | null
      color: string | null
      pinned: number
      archived: number
      created_at: number
      query_count: number
    }>

    // Get all relationships
    const relationships = db.prepare(`
      SELECT 
        topic_from,
        topic_to,
        relationship_type,
        strength
      FROM topic_relationships
      WHERE user_id = ?
    `).all(userId) as Array<{
      topic_from: string
      topic_to: string
      relationship_type: string
      strength: number
    }>

    return NextResponse.json({
      nodes: topics.map(t => ({
        id: t.id,
        label: t.name,
        description: t.description,
        category: t.category || 'other',
        color: t.color,
        pinned: t.pinned === 1,
        archived: t.archived === 1,
        queryCount: t.query_count,
        createdAt: t.created_at,
      })),
      links: relationships.map(r => ({
        source: r.topic_from,
        target: r.topic_to,
        type: r.relationship_type,
        strength: r.strength,
      })),
    })
  } catch (error) {
    console.error('Mind map data error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch mind map data' },
      { status: 500 }
    )
  }
}

