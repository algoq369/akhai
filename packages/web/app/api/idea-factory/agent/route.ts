import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { getUserFromSession } from '@/lib/auth'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
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

    const config = await request.json()
    const agentId = randomBytes(8).toString('hex')

    db.prepare(`
      INSERT INTO agent_configs (id, user_id, name, type, config_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, strftime('%s', 'now'), strftime('%s', 'now'))
    `).run(
      agentId,
      userId,
      config.name || 'Unnamed Agent',
      config.type || 'handball',
      JSON.stringify(config)
    )

    return NextResponse.json({ id: agentId })
  } catch (error) {
    console.error('Agent save error:', error)
    return NextResponse.json(
      { error: 'Failed to save agent' },
      { status: 500 }
    )
  }
}

