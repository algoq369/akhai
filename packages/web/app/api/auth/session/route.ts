import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession, logout, isAdmin } from '@/lib/auth';

/**
 * GET /api/auth/session
 * Get current user session
 */
export async function GET(request: NextRequest) {
  console.log('[DEBUG] GET /api/auth/session entry');
  // #region agent log
  try { fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/auth/session/route.ts:8',message:'GET /api/auth/session entry',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{}); } catch(e) {}
  // #endregion
  try {
    const token = request.cookies.get('session_token')?.value;
    console.log('[DEBUG] Token extracted, hasToken:', !!token, 'tokenLength:', token?.length || 0);
    // #region agent log
    try { fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/auth/session/route.ts:11',message:'Token extracted',data:{hasToken:!!token,tokenLength:token?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{}); } catch(e) {}
    // #endregion

    if (!token) {
      return NextResponse.json({ user: null });
    }

    console.log('[DEBUG] Calling getUserFromSession with token:', token.substring(0, 10));
    // #region agent log
    try { fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/auth/session/route.ts:18',message:'Calling getUserFromSession',data:{token:token.substring(0,10)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{}); } catch(e) {}
    // #endregion
    const user = getUserFromSession(token);
    console.log('[DEBUG] getUserFromSession returned, hasUser:', !!user, 'userId:', user?.id || null);
    // #region agent log
    try { fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/auth/session/route.ts:20',message:'getUserFromSession returned',data:{hasUser:!!user,userId:user?.id||null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{}); } catch(e) {}
    // #endregion

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
    console.error('[DEBUG] Session check error:', errorInfo);
    // #region agent log
    try { fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/auth/session/route.ts:35',message:'Error caught',data:errorInfo,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{}); } catch(e) {}
    // #endregion
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

