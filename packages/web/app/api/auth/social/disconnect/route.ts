import { NextRequest, NextResponse } from 'next/server';
import { validateSession, deleteSocialConnection, SocialConnection } from '@/lib/database';

/**
 * DELETE /api/auth/social/disconnect
 * Disconnect a social account
 */
export async function DELETE(request: NextRequest) {
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

    // Get platform from query params
    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get('platform') as SocialConnection['platform'] | null;

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform parameter required' },
        { status: 400 }
      );
    }

    // Validate platform
    const validPlatforms: SocialConnection['platform'][] = ['x', 'telegram', 'github', 'reddit', 'mastodon', 'youtube'];
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform' },
        { status: 400 }
      );
    }

    // Delete the connection
    deleteSocialConnection(user.id, platform);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Social disconnect error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
