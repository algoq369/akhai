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

    // Check if topics table exists
    const tablesCheck = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='topics'
    `).all() as Array<{ name: string }>

    if (tablesCheck.length === 0) {
      // Topics table doesn't exist yet - return empty data
      return NextResponse.json({
        nodes: [],
        links: [],
      })
    }

    // Migrate NULL user_id topics to current user (one-time migration)
    try {
      db.prepare(`
        UPDATE topics 
        SET user_id = ?, updated_at = ?
        WHERE user_id IS NULL
      `).run(userId, Math.floor(Date.now() / 1000))
    } catch (migrationError) {
      console.error('Migration error (non-fatal):', migrationError)
    }

    // Get all topics for user
    let topics: Array<{
      id: string
      name: string
      description: string | null
      category: string | null
      color: string | null
      pinned: number
      archived: number
      ai_instructions: string | null
      created_at: number
      query_count: number
    }> = []

    try {
      topics = db.prepare(`
        SELECT 
          t.id,
          t.name,
          t.description,
          t.category,
          t.color,
          t.pinned,
          t.archived,
          t.ai_instructions,
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
        ai_instructions: string | null
        created_at: number
        query_count: number
      }>
    } catch (topicsError) {
      console.error('Error fetching topics:', topicsError)
      topics = []
    }

    // Get all relationships
    let relationships: Array<{
      topic_from: string
      topic_to: string
      relationship_type: string
      strength: number
    }> = []

    try {
      relationships = db.prepare(`
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
    } catch (relError) {
      console.error('Error fetching relationships:', relError)
      relationships = []
    }

    const responseData = {
      nodes: topics.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category || 'other',
        color: t.color || '#94a3b8',
        pinned: t.pinned === 1,
        archived: t.archived === 1,
        queryCount: t.query_count,
        ai_instructions: t.ai_instructions,
      })),
      links: relationships.map(r => ({
        source: r.topic_from,
        target: r.topic_to,
        type: r.relationship_type,
        strength: r.strength,
      })),
    }
    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Mind map data error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch mind map data' },
      { status: 500 }
    )
  }
}
