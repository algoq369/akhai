import { NextRequest, NextResponse } from 'next/server';
import { handleGitHubCallback } from '@/lib/auth';

/**
 * GET /api/auth/github/callback
 * Handle GitHub OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error)}`, request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/?error=missing_code', request.url));
    }

    const { user, session } = await handleGitHubCallback(code);

    // Set session cookie and redirect to home
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.set('session_token', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('GitHub callback error:', error);
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(error instanceof Error ? error.message : 'authentication_failed')}`, request.url)
    );
  }
}

