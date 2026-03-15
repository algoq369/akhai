import { NextResponse } from 'next/server'

/**
 * DEV ONLY — Sets session cookie for the first user in the database.
 * Remove before production deployment.
 */
export async function GET() {
  try {
    const { default: Database } = await import('better-sqlite3')
    const path = await import('path')
    const dbPath = path.join(process.cwd(), 'data', 'akhai.db')
    const db = new Database(dbPath)

    // Get GitHub user (algoq369)
    const user = db.prepare("SELECT id, username, email FROM users WHERE auth_provider = 'github' LIMIT 1").get() as any
    if (!user) return NextResponse.json({ error: 'No GitHub users found' }, { status: 404 })

    // Check for existing session
    let session = db.prepare('SELECT token FROM sessions WHERE user_id = ? AND expires_at > ?').get(user.id, Math.floor(Date.now() / 1000)) as any

    if (!session) {
      // Create new session
      const crypto = await import('crypto')
      const token = 'dev_' + crypto.randomBytes(24).toString('hex')
      const expiresAt = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
      db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, user.id, expiresAt)
      session = { token }
    }

    const response = NextResponse.redirect(new URL('/', 'http://localhost:3000'))
    response.cookies.set('session_token', session.token, {
      httpOnly: true,
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
      sameSite: 'lax',
    })

    return response
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
