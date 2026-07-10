import { NextRequest, NextResponse } from 'next/server';
import { queries } from '@/lib/query-store';
import { log } from '@/lib/logger';
import { getQuery } from '@/lib/database';
import { getUserFromSession } from '@/lib/auth';
import { classifyContent } from '@/lib/mini-canvas/content-classifier';

export const dynamic = 'force-dynamic';

interface QueryResult {
  id: string;
  query: string;
  flow: string;
  status: string;
  result: string | null;
  tokens_used: number | null;
  cost: number | null;
  created_at: number | null;
  completed_at: number | null;
  user_id: string | null;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: queryId } = await params;

  try {
    // Get user from session (optional - allows anonymous usage)
    const token = request.cookies.get('session_token')?.value;
    const user = token ? getUserFromSession(token) : null;
    const userId = user?.id || null;

    // LOCK policy — owner-only; share-by-link is a future feature (add a shareToken column +
    // explicit opt-in then). An owned row (user_id set) is readable ONLY by its owner — anyone
    // else (including no-session) gets 404, never 403, so existence isn't leaked. Legacy rows
    // (user_id NULL) remain readable. Ownership lives in the DB row, so both the in-memory and
    // DB paths fetch the row unscoped and apply the same check.
    const isForbidden = (rowUserId: string | null | undefined): boolean =>
      !!rowUserId && rowUserId !== userId;

    // First check in-memory store
    const memoryQuery = queries.get(queryId);

    if (memoryQuery) {
      // Tokens/cost/ownership live in the database row
      const dbQuery = getQuery(queryId, null) as QueryResult | undefined;

      if (isForbidden(dbQuery?.user_id)) {
        log('WARN', 'QUERY_API', `Ownership denied (memory path): ${queryId}`);
        return NextResponse.json({ error: 'Query not found', id: queryId }, { status: 404 });
      }

      const responseText = memoryQuery.result?.finalAnswer || '';
      const miniCanvas = responseText
        ? classifyContent(responseText, memoryQuery.query || '')
        : null;

      return NextResponse.json({
        id: queryId,
        query: memoryQuery.query,
        methodology: memoryQuery.flow,
        status: memoryQuery.status,
        response: responseText || null,
        finalDecision: responseText || null,
        events: memoryQuery.events || [],
        metrics: {
          tokens: dbQuery?.tokens_used || 0,
          latency: memoryQuery.result?.duration ? memoryQuery.result.duration * 1000 : 0,
          cost: dbQuery?.cost || 0,
        },
        createdAt: dbQuery?.created_at || null,
        error: memoryQuery.error,
        miniCanvas,
      });
    }

    // Fallback to database — fetch by id, then apply the same ownership check (LOCK)
    const dbQuery = getQuery(queryId, null) as QueryResult | undefined;

    if (dbQuery && isForbidden(dbQuery.user_id)) {
      log('WARN', 'QUERY_API', `Ownership denied (db path): ${queryId}`);
      return NextResponse.json({ error: 'Query not found', id: queryId }, { status: 404 });
    }

    if (dbQuery) {

      // Parse the result JSON string
      let parsedResult = null;
      try {
        if (dbQuery.result) {
          parsedResult = JSON.parse(dbQuery.result);
        }
      } catch (e) {
        console.error('[API GET] Failed to parse result JSON:', e);
      }


      const dbResponseText = parsedResult?.finalAnswer || '';
      const dbMiniCanvas = dbResponseText
        ? classifyContent(dbResponseText, dbQuery.query || '')
        : null;

      return NextResponse.json({
        id: dbQuery.id,
        query: dbQuery.query,
        methodology: dbQuery.flow,
        status: dbQuery.status,
        response: dbResponseText || null,
        finalDecision: dbResponseText || null,
        metrics: {
          tokens: dbQuery.tokens_used || 0,
          latency: parsedResult?.duration ? parsedResult.duration * 1000 : 0,
          cost: dbQuery.cost || 0,
        },
        createdAt: dbQuery.created_at || null,
        miniCanvas: dbMiniCanvas,
      });
    }

    log('WARN', 'QUERY_API', `Query not found: ${queryId}`);
    return NextResponse.json({ error: 'Query not found', id: queryId }, { status: 404 });
  } catch (error) {
    console.error('[API GET] Error fetching query:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch query',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
