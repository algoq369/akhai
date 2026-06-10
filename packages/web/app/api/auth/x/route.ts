import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'node:crypto';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/x
 * Initiate X/Twitter OAuth as primary login (no session required)
 */
export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.TWITTER_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({
        error: 'X auth not configured',
        message: 'X/Twitter login will be available soon. Use email or wallet for now.',
        configured: false,
      });
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://akhai.app'}/api/auth/x/callback`;
    const state = randomBytes(16).toString('base64url');
    // RFC 7636: 43-char CSPRNG verifier; challenge = BASE64URL(SHA256(verifier))
    const codeVerifier = randomBytes(32).toString('base64url');
    const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');

    // Store state + verifier in cookie for callback
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'tweet.read users.read offline.access',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    const authUrl = `https://x.com/i/oauth2/authorize?${params.toString()}`;

    const response = NextResponse.json({ authUrl });
    response.cookies.set('x_oauth_state', state, { httpOnly: true, maxAge: 600, path: '/' });
    response.cookies.set('x_oauth_verifier', codeVerifier, {
      httpOnly: true,
      maxAge: 600,
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('X auth error:', error);
    return NextResponse.json({ error: 'X auth failed', message: String(error) }, { status: 500 });
  }
}
