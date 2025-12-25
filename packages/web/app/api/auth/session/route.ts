import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession, logout, isAdmin } from '@/lib/auth';

/**
 * GET /api/auth/session
 * Get current user session
 */
export async function GET(request: NextRequest) {
  try {
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
        isAdmin: isAdmin(user),
      },
    });
  } catch (error) {
    const errorInfo = {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Unknown',
      code: (error as any)?.code || 'no code',
      stack: error instanceof Error ? error.stack?.substring(0, 300) : 'no stack'
    };
    return NextResponse.json({ user: null });
  }
}

/**
 * POST /api/auth/logout
 * Destroy session and logout
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('session_token')?.value;

    if (token) {
      logout(token);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete('session_token');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}

