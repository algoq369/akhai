import { NextRequest, NextResponse } from 'next/server';
import { getGitHubAuthUrl, handleGitHubCallback } from '@/lib/auth';

/**
 * GET /api/auth/github
 * Initiate GitHub OAuth flow
 */
export async function GET(request: NextRequest) {
  try {
    const authUrl = getGitHubAuthUrl();
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('GitHub auth initiation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to initiate GitHub authentication';
    // Return 200 with error info instead of 500, so frontend can handle gracefully
    return NextResponse.json(
      { 
        error: errorMessage,
        message: 'GitHub OAuth is not configured. Please add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to .env.local',
        configured: false
      },
      { status: 200 }
    );
  }
}

