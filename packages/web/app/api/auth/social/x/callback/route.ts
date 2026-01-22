import { NextRequest, NextResponse } from 'next/server';
import { handleTwitterCallback } from '@/lib/auth';

/**
 * GET /api/auth/social/x/callback
 * Handle Twitter OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[X Callback] Received callback request');
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('[X Callback] Params:', {
      hasCode: !!code,
      hasState: !!state,
      hasError: !!error,
      error: error || 'none'
    });

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
    console.log('[X Callback] Calling handleTwitterCallback...');
    const result = await handleTwitterCallback(code, state);
    console.log('[X Callback] Result:', { success: result.success, username: result.username, error: result.error });

    if (!result.success) {
      console.log('[X Callback] Failed, redirecting with error:', result.error);
      return NextResponse.redirect(
        new URL(`/profile?error=${encodeURIComponent(result.error || 'Unknown error')}`, request.url)
      );
    }

    console.log('[X Callback] Success! Redirecting to profile');

    // Redirect back to profile with success message
    return NextResponse.redirect(
      new URL(`/profile?tab=settings&connected=x&username=${encodeURIComponent(result.username || '')}`, request.url)
    );
  } catch (error) {
    console.error('Twitter OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/profile?error=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`, request.url)
    );
  }
}
