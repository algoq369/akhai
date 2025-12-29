import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/session
 * Get current user session
 * Always returns JSON - never throws
 */
export async function GET(request: NextRequest) {
  try {
    // Dynamic import to avoid build issues
    const { getUserFromSession } = await import('@/lib/auth');
    
    const token = request.cookies.get('session_token')?.value;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const user = getUserFromSession(token);

    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
        auth_provider: user.auth_provider,
      },
    });
  } catch (error) {
    console.error('Session check error:', error);
    // Always return JSON, even on error
    return NextResponse.json({ user: null });
  }
}

/**
 * POST /api/auth/logout
 * Destroy session and logout
 */
export async function POST(request: NextRequest) {
  try {
    const { logout } = await import('@/lib/auth');
    const token = request.cookies.get('session_token')?.value;

    if (token) {
      logout(token);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete('session_token');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
