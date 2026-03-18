import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'
import { generateUUID } from '@/lib/uuid'

/**
 * GET /api/auth/x/callback
 * Handle X/Twitter OAuth callback — create/find user, create session
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const authCode = searchParams.get('code')
    const state = searchParams.get('state')
    const savedState = request.cookies.get('x_oauth_state')?.value
    const codeVerifier = request.cookies.get('x_oauth_verifier')?.value
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://akhai.app'

    if (!authCode || !state || state !== savedState) {
      return NextResponse.redirect(new URL('/?auth_error=invalid_state', baseUrl))
    }

    const clientId = process.env.TWITTER_CLIENT_ID
    const clientSecret = process.env.TWITTER_CLIENT_SECRET
    const redirectUri = `${baseUrl}/api/auth/x/callback`

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL('/?auth_error=not_configured', baseUrl))
    }

    // Exchange code for token
    const tokenRes = await fetch('https://api.x.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        code: authCode,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code_verifier: codeVerifier || '',
      }),
    })

    if (!tokenRes.ok) {
      console.error('X token exchange failed:', await tokenRes.text())
      return NextResponse.redirect(new URL('/?auth_error=token_failed', baseUrl))
    }

    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token

    // Get user profile from X
    const userRes = await fetch('https://api.x.com/2/users/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    })

    if (!userRes.ok) {
      return NextResponse.redirect(new URL('/?auth_error=profile_failed', baseUrl))
    }

    const userData = await userRes.json()
    const xUsername = userData.data?.username
    const xId = userData.data?.id

    if (!xUsername || !xId) {
      return NextResponse.redirect(new URL('/?auth_error=no_profile', baseUrl))
    }

    // Find or create user
    const db = getDatabase()
    try { db.exec('ALTER TABLE users ADD COLUMN x_username TEXT') } catch {}
    try { db.exec('ALTER TABLE users ADD COLUMN x_id TEXT') } catch {}

    let user = db.prepare('SELECT * FROM users WHERE x_id = ?').get(xId) as any
    if (!user) {
      const userId = `x_${xUsername}`
      db.prepare('INSERT OR IGNORE INTO users (id, x_username, x_id, created_at) VALUES (?, ?, ?, ?)').run(userId, xUsername, xId, new Date().toISOString())
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
    }

    // Create session
    const sessionToken = generateUUID()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(sessionToken, user.id, expiresAt)

    const response = NextResponse.redirect(new URL('/', baseUrl))
    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    })
    // Clear OAuth cookies
    response.cookies.delete('x_oauth_state')
    response.cookies.delete('x_oauth_verifier')
    return response
  } catch (error) {
    console.error('X callback error:', error)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://akhai.app'
    return NextResponse.redirect(new URL('/?auth_error=callback_failed', baseUrl))
  }
}
