import { NextRequest, NextResponse } from 'next/server';
import { COUNCIL_AGENTS } from '@/lib/god-view/agents';

export const dynamic = 'force-dynamic';

/**
 * POST /api/god-view/council
 * Fan out a query + response to the 5-agent Perspective Council.
 *
 * Phase 1 (current): Returns 501 stub with agent roster.
 * Phase 2 (next):    Promise.all fan-out to each agent's provider,
 *                    collect perspectives, run synthesizer, return result.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, response, topics } = body;

    if (!query) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }

    // TODO Phase 2: Build per-agent prompts from COUNCIL_AGENTS
    // TODO Phase 2: Promise.all([
    //   callAgent('visionary', query, response),
    //   callAgent('analyst', query, response),
    //   callAgent('advocate', query, response),
    //   callAgent('skeptic', query, response),
    // ])
    // TODO Phase 2: Pass 4 perspectives + original to synthesizer
    // TODO Phase 2: Return { perspectives, synthesis, totalCost, latencies }

    return NextResponse.json(
      {
        message: 'Council coming soon',
        agents: COUNCIL_AGENTS.map((a) => ({
          id: a.id,
          name: a.name,
          sigil: a.sigil,
          role: a.role,
          provider: a.provider,
          model: a.model,
        })),
        query: query.slice(0, 100),
        topics: topics || [],
      },
      { status: 501 }
    );
  } catch (error) {
    console.error('Council route error:', error);
    return NextResponse.json({ error: 'Council failed' }, { status: 500 });
  }
}
