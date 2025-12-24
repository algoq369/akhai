import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth';
import { getSuggestions } from '@/lib/side-canal';

/**
 * GET /api/side-canal/suggestions
 * Get suggestions for current conversation topics
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('session_token')?.value;
    const user = token ? getUserFromSession(token) : null;
    const userId = user?.id || null;

    const { searchParams } = new URL(request.url);
    const currentTopics = searchParams.get('topics')?.split(',') || [];

    const suggestions = getSuggestions(currentTopics, userId);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Suggestions GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get suggestions' },
      { status: 500 }
    );
  }
}

