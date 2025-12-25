import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { getUserFromSession } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: topicId } = await params
    const token = request.cookies.get('session_token')?.value
    const user = token ? getUserFromSession(token) : null
    const userId = user?.id || null

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get topic details
    const topic = db.prepare(`
      SELECT id, name, description, category, color, pinned, archived, ai_instructions, created_at
      FROM topics
      WHERE id = ? AND user_id = ?
    `).get(topicId, userId) as {
      id: string
      name: string
      description: string | null
      category: string | null
      color: string | null
      pinned: number
      archived: number
      ai_instructions: string | null
      created_at: number
    } | undefined

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      )
    }

    // Get related queries
    const queries = db.prepare(`
      SELECT q.id, q.query, q.flow, q.created_at
      FROM queries q
      JOIN query_topics qt ON q.id = qt.query_id
      WHERE qt.topic_id = ? AND q.user_id = ?
      ORDER BY q.created_at DESC
      LIMIT 50
    `).all(topicId, userId) as Array<{
      id: string
      query: string
      flow: string
      created_at: number
    }>

    // Get related topics
    const relatedTopics = db.prepare(`
      SELECT t.id, t.name, t.category, tr.relationship_type, tr.strength
      FROM topic_relationships tr
      JOIN topics t ON (
        (tr.topic_from = ? AND tr.topic_to = t.id) OR
        (tr.topic_to = ? AND tr.topic_from = t.id)
      )
      WHERE tr.user_id = ?
      ORDER BY tr.strength DESC
      LIMIT 10
    `).all(topicId, topicId, userId) as Array<{
      id: string
      name: string
      category: string | null
      relationship_type: string
      strength: number
    }>

    return NextResponse.json({
      topic: {
        ...topic,
        pinned: topic.pinned === 1,
        archived: topic.archived === 1,
      },
      queries,
      relatedTopics,
    })
  } catch (error) {
    console.error('Topic detail error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch topic details' },
      { status: 500 }
    )
  }
}

// Update topic
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: topicId } = await params
    const token = request.cookies.get('session_token')?.value
    const user = token ? getUserFromSession(token) : null
    const userId = user?.id || null

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, category, color, pinned, archived, ai_instructions } = body

    // Build update query dynamically
    const updates: string[] = []
    const values: any[] = []

    if (name !== undefined) {
      updates.push('name = ?')
      values.push(name)
    }
    if (description !== undefined) {
      updates.push('description = ?')
      values.push(description)
    }
    if (category !== undefined) {
      updates.push('category = ?')
      values.push(category)
    }
    if (color !== undefined) {
      updates.push('color = ?')
      values.push(color)
    }
    if (pinned !== undefined) {
      updates.push('pinned = ?')
      values.push(pinned ? 1 : 0)
    }
    if (archived !== undefined) {
      updates.push('archived = ?')
      values.push(archived ? 1 : 0)
    }
    if (ai_instructions !== undefined) {
      updates.push('ai_instructions = ?')
      values.push(ai_instructions)
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      )
    }

    updates.push('updated_at = ?')
    values.push(Math.floor(Date.now() / 1000))

    values.push(topicId, userId)

    db.prepare(`
      UPDATE topics
      SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ?
    `).run(...values)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Topic update error:', error)
    return NextResponse.json(
      { error: 'Failed to update topic' },
      { status: 500 }
    )
  }
}
