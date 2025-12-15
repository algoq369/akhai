import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    const queries = db.prepare(`
      SELECT id, query, flow, status, created_at, completed_at, tokens_used, cost
      FROM queries ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(limit, offset);

    const total = db.prepare('SELECT COUNT(*) as count FROM queries').get() as any;

    return NextResponse.json({ queries, total: total?.count || 0, limit, offset });
  } catch (error) {
    console.error('History API error:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
