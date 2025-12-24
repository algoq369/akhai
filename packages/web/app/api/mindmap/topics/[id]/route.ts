/**
 * Update topic properties (color, pinned, archived, ai_instructions)
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { getUserFromSession } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const topicId = params.id
    const updates = await request.json()

    // Verify topic belongs to user
    const topic = db.prepare(`
      SELECT user_id FROM topics WHERE id = ?
    `).get(topicId) as { user_id: string | null } | undefined

    if (!topic || (topic.user_id !== userId && topic.user_id !== null)) {
      return NextResponse.json(
        { error: 'Topic not found or access denied' },
        { status: 404 }
      )
    }

    // Build update query dynamically
    const updateFields: string[] = []
    const updateValues: any[] = []

    if (updates.color !== undefined) {
      updateFields.push('color = ?')
      updateValues.push(updates.color)
    }
    if (updates.pinned !== undefined) {
      updateFields.push('pinned = ?')
      updateValues.push(updates.pinned)
    }
    if (updates.archived !== undefined) {
      updateFields.push('archived = ?')
      updateValues.push(updates.archived)
    }
    if (updates.ai_instructions !== undefined) {
      updateFields.push('ai_instructions = ?')
      updateValues.push(updates.ai_instructions)
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    updateFields.push('updated_at = ?')
    updateValues.push(Math.floor(Date.now() / 1000))
    updateValues.push(topicId)

    db.prepare(`
      UPDATE topics
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `).run(...updateValues)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update topic error:', error)
    return NextResponse.json(
      { error: 'Failed to update topic' },
      { status: 500 }
    )
  }
}

