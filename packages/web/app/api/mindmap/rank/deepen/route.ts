/**
 * POST /api/mindmap/rank/deepen  { topicId }
 *
 * RESERVED click-to-deepen surface. Today it returns the same $0 compute ranking as GET /rank, but
 * with a `transformative: null` field per candidate — a placeholder for the Opus "transformative
 * potential" judgment (RICHNESS_WEIGHTS.transformative, 0.10) that will run here on a deliberate
 * click and in the M4c daily curator pass. Opus is NOT called yet: this route spends nothing.
 *
 * guardPaidRoute is wired now (in addition to requireAuth) because this route WILL make paid calls
 * once M4c lands — the budget gate belongs here from the start so it can't be forgotten later.
 *
 * TODO(M4c): call MODELS.premium (Opus) on the top-3 candidates for a 0-1 transformative score,
 * fold it in at RICHNESS_WEIGHTS.transformative (0.10), and re-blend across all 5 signals. Cache the
 * result (per topic, per day) so a click doesn't re-spend, and reuse the curator pass's scores.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, guardPaidRoute } from '@/lib/api-guard';
import { rankConnectedTopics, type TopicRank } from '@/lib/mindmap-ranking';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  topicId: z.string().min(1).max(64),
});

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;
  // Budget gate reserved for the future Opus call — no-op today (compute path spends nothing).
  const paid = guardPaidRoute(request);
  if (paid.error) return paid.error;

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error?.flatten() },
      { status: 400 }
    );
  }

  try {
    const compute = rankConnectedTopics(parsed.data.topicId, auth.user.id);
    // transformative is RESERVED — null until M4c wires Opus. Shape stays stable for the UI.
    const ranked = compute.map((r: TopicRank) => ({ ...r, transformative: null as number | null }));
    return NextResponse.json({ topicId: parsed.data.topicId, ranked, deepened: false });
  } catch (error) {
    console.error('mindmap rank/deepen error:', error);
    return NextResponse.json({ error: 'Failed to rank connected topics' }, { status: 500 });
  }
}
