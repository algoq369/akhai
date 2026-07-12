import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { requireAuth } from '@/lib/api-guard';

export const dynamic = 'force-dynamic';

// budget-guard (audit B6): this admin maintenance endpoint was unauthenticated and callable in
// prod — a bulk queries mutation exposed to anyone. No admin-role concept exists yet, so it is
// hard-gated to 404 in production (the cleanup scheduler already handles stale rows automatically)
// AND requires a session in dev. A real admin-auth mechanism is a tracked follow-up.
function adminGate(request: NextRequest): NextResponse | null {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  const { error } = requireAuth(request);
  return error ?? null;
}

/**
 * POST /api/admin/reset-stuck
 *
 * Reset queries that are stuck in 'processing' status for more than 5 minutes.
 * This is useful for cleaning up queries that timed out or failed silently.
 */
export async function POST(request: NextRequest) {
  const gate = adminGate(request);
  if (gate) return gate;
  try {
    // Calculate timestamp for 5 minutes ago
    const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 300;

    // Find and update stuck queries
    const result = db
      .prepare(
        `
      UPDATE queries
      SET
        status = 'error',
        result = 'Query timed out and was reset by admin. Please try again with a simpler query or check the provider status.'
      WHERE status = 'processing'
        AND created_at < ?
    `
      )
      .run(fiveMinutesAgo);

    console.log(`[Admin] Reset ${result.changes} stuck queries`);

    return NextResponse.json({
      success: true,
      reset: result.changes,
      message: `Reset ${result.changes} stuck ${result.changes === 1 ? 'query' : 'queries'}`,
      details: {
        threshold: '5 minutes',
        timestampThreshold: new Date(fiveMinutesAgo * 1000).toISOString(),
      },
    });
  } catch (error) {
    console.error('[Admin] Failed to reset stuck queries:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reset stuck queries',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/reset-stuck
 *
 * Get count of currently stuck queries without resetting them
 */
export async function GET(request: NextRequest) {
  const gate = adminGate(request);
  if (gate) return gate;
  try {
    const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 300;

    const result = db
      .prepare(
        `
      SELECT COUNT(*) as count
      FROM queries
      WHERE status = 'processing'
        AND created_at < ?
    `
      )
      .get(fiveMinutesAgo) as { count: number };

    return NextResponse.json({
      stuck: result.count,
      threshold: '5 minutes',
      timestampThreshold: new Date(fiveMinutesAgo * 1000).toISOString(),
    });
  } catch (error) {
    console.error('[Admin] Failed to check stuck queries:', error);
    return NextResponse.json({ error: 'Failed to check stuck queries' }, { status: 500 });
  }
}
