import { NextRequest, NextResponse } from 'next/server';
import { getTwitterAuthUrl } from '@/lib/auth';
import { validateSession } from '@/lib/database';

/**
 * GET /api/auth/social/x/connect
 * Initiate Twitter OAuth flow
 */
export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const sessionToken = request.cookies.get('session_token')?.value;
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const user = validateSession(sessionToken);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Generate OAuth URL with PKCE
    const { authUrl, state } = getTwitterAuthUrl(user.id);

    return NextResponse.json({ authUrl, state });
  } catch (error) {
    console.error('Twitter OAuth initiation error:', error);
    return NextResponse.json({
      error: 'Twitter OAuth not configured',
      message: error instanceof Error ? error.message : 'Add TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET to .env.local',
      configured: false
    }, { status: 500 });
  }
}
