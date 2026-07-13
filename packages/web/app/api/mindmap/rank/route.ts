/**
 * GET /api/mindmap/rank?topicId=<id>
 *
 * M4a hover ranking — returns the TOP-3 richest connected topics for the hovered node, scored by a
 * $0 graph/substance blend (see lib/mindmap-ranking.ts). Makes NO provider calls: instant, free.
 *
 * requireAuth is used for AUTH ONLY (it's per-user graph data, and an unauthenticated caller must
 * not be able to drive repeated neighborhood scans — compute-DoS). This path never touches a paid
 * provider, so there is no guardPaidRoute here; the paid surface is rank/deepen.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/api-guard';
import { rankConnectedTopics } from '@/lib/mindmap-ranking';

export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  topicId: z.string().min(1).max(64),
});

export async function GET(request: NextRequest) {
  const guard = requireAuth(request);
  if (guard.error) return guard.error;

  const parsed = QuerySchema.safeParse({
    topicId: request.nextUrl.searchParams.get('topicId'),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const ranked = rankConnectedTopics(parsed.data.topicId, guard.user.id);
    return NextResponse.json({ topicId: parsed.data.topicId, ranked });
  } catch (error) {
    console.error('mindmap rank error:', error);
    return NextResponse.json({ error: 'Failed to rank connected topics' }, { status: 500 });
  }
}
