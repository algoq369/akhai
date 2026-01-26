import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { getUserFromSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('session_token')?.value
    const user = token ? getUserFromSession(token) : null
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch topic relationships
    const relationships = db.prepare(`
      SELECT
        tr.id,
        tr.topic_from as from_id,
        t1.name as from_name,
        tr.topic_to as to_id,
        t2.name as to_name,
        tr.relationship_type as type,
        tr.strength
      FROM topic_relationships tr
      JOIN topics t1 ON tr.topic_from = t1.id
      JOIN topics t2 ON tr.topic_to = t2.id
      WHERE (t1.user_id = ? OR t1.user_id IS NULL)
        AND (t2.user_id = ? OR t2.user_id IS NULL)
      ORDER BY tr.strength DESC
    `).all(user.id, user.id)

    return NextResponse.json({ relationships })
  } catch (error) {
    console.error('Failed to fetch relationships:', error)
    return NextResponse.json(
      { error: 'Failed to fetch relationships' },
      { status: 500 }
    )
  }
}
