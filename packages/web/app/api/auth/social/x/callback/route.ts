import { NextRequest, NextResponse } from 'next/server';
import { handleTwitterCallback } from '@/lib/auth';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/social/x/callback
 * Handle Twitter OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    // Handle OAuth errors
    if (error) {
      const errorDescription = searchParams.get('error_description') || 'Unknown error';
      return NextResponse.redirect(
        new URL(`/profile?error=${encodeURIComponent(errorDescription)}`, request.url)
      );
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/profile?error=Missing code or state parameter', request.url)
      );
    }

    // Handle OAuth callback
    const result = await handleTwitterCallback(code, state);

    if (!result.success) {
      log('WARN', 'X_AUTH', 'Twitter callback failed', result.error);
      return NextResponse.redirect(
        new URL(
          `/profile?error=${encodeURIComponent(result.error || 'Unknown error')}`,
          request.url
        )
      );
    }
    // Redirect back to profile with success message
    return NextResponse.redirect(
      new URL(
        `/profile?tab=settings&connected=x&username=${encodeURIComponent(result.username || '')}`,
        request.url
      )
    );
  } catch (error) {
    console.error('Twitter OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(
        `/profile?error=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`,
        request.url
      )
    );
  }
}
