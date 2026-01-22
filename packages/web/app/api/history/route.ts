import { NextRequest, NextResponse } from 'next/server';
import { getRecentQueries } from '@/lib/database';
import { getUserFromSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10000'); // Increased from 100 to 200
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    // Get user from session (optional - allows anonymous usage)
    const token = request.cookies.get('session_token')?.value
    const user = token ? getUserFromSession(token) : null
    const userId = user?.id || null

    // Get session ID for anonymous users
    const sessionId = request.cookies.get('akhai_session')?.value || null

    // Get queries scoped to user or session (with offset support)
    const queries = getRecentQueries(limit + offset, userId, sessionId).slice(offset);
    const total = queries.length + offset; // Approximate total

    return NextResponse.json({ queries, total, limit, offset });
  } catch (error) {
    console.error('History API error:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
