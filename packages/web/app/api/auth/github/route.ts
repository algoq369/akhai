import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/github
 * Initiate GitHub OAuth flow
 */
export async function GET(request: NextRequest) {
  try {
    const { getGitHubAuthUrl } = await import('@/lib/auth');
    const authUrl = getGitHubAuthUrl();
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('GitHub auth initiation error:', error);
    // Return JSON response, not 500 HTML
    return NextResponse.json({
      error: 'GitHub OAuth not configured',
      message: 'Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to .env.local',
      configured: false
    });
  }
}
