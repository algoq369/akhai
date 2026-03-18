import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/auth/x
 * Initiate X/Twitter OAuth as primary login (no session required)
 */
export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.TWITTER_CLIENT_ID
    if (!clientId) {
      return NextResponse.json({
        error: 'X auth not configured',
        message: 'X/Twitter login will be available soon. Use email or wallet for now.',
        configured: false,
      })
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://akhai.app'}/api/auth/x/callback`
    const state = Math.random().toString(36).substring(2, 15)
    const codeVerifier = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

    // Store state + verifier in cookie for callback
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'tweet.read users.read offline.access',
      state,
      code_challenge: codeVerifier,
      code_challenge_method: 'plain',
    })

    const authUrl = `https://x.com/i/oauth2/authorize?${params.toString()}`

    const response = NextResponse.json({ authUrl })
    response.cookies.set('x_oauth_state', state, { httpOnly: true, maxAge: 600, path: '/' })
    response.cookies.set('x_oauth_verifier', codeVerifier, { httpOnly: true, maxAge: 600, path: '/' })
    return response
  } catch (error) {
    console.error('X auth error:', error)
    return NextResponse.json({ error: 'X auth failed', message: String(error) }, { status: 500 })
  }
}
