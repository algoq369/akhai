import { NextRequest, NextResponse } from 'next/server'
import { getUserFromSession } from '@/lib/auth'
import { db, getUserSocialConnections } from '@/lib/database'

export async function GET(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = getUserFromSession(token)

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user from database
  const dbUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id) as any

  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Get social connections (excluding sensitive tokens)
  const socialConnections = getUserSocialConnections(user.id).map(conn => ({
    platform: conn.platform,
    username: conn.username,
    connected_at: conn.connected_at,
    last_synced: conn.last_synced,
    // Don't expose access_token or refresh_token to frontend
  }))

  return NextResponse.json({
    user: {
      ...dbUser,
      social_connections: socialConnections,
    }
  })
}
