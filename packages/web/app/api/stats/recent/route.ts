import { NextResponse } from 'next/server';
import { getRecentQueries } from '@/lib/database';

export async function GET() {
  try {
    const dbQueries = getRecentQueries(10);

    // Transform to match frontend expectations
    const queries = dbQueries.map((q) => ({
      id: q.id,
      query: q.query,
      flow: q.flow,
      status: q.status,
      timestamp: q.created_at * 1000, // Convert to milliseconds
    }));

    return NextResponse.json({ queries });
  } catch (error) {
    console.error('Recent queries API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent queries' },
      { status: 500 }
    );
  }
}
