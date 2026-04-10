import { NextRequest, NextResponse } from 'next/server';
import { COUNCIL_AGENTS, type CouncilAgent } from '@/lib/god-view/agents';
import { callProvider, isProviderAvailable } from '@/lib/multi-provider-api';
import type { ProviderFamily } from '@/lib/provider-selector';

export const dynamic = 'force-dynamic';

function isCreditError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    msg.includes('credit') ||
    msg.includes('balance') ||
    msg.includes('insufficient') ||
    msg.includes('billing')
  );
}

/** Call a single council agent, falling back to anthropic if provider unavailable. */
async function callAgent(agent: CouncilAgent, context: string) {
  const available = isProviderAvailable(agent.provider as ProviderFamily);
  const provider: ProviderFamily = available ? (agent.provider as ProviderFamily) : 'anthropic';
  const model = available ? agent.model : 'claude-sonnet-4-6';

  const result = await callProvider(provider, {
    messages: [
      { role: 'system', content: agent.prompt },
      { role: 'user', content: context },
    ],
    model,
    maxTokens: agent.id === 'synthesizer' ? 300 : 200,
    temperature: 0.7,
  });

  return {
    agentId: agent.id,
    text: result.content,
    latencyMs: result.latencyMs,
    cost: result.cost,
  };
}

/** POST /api/god-view/council — Fan out to 4 perspective agents + synthesizer. */
export async function POST(request: NextRequest) {
  try {
    const { query, response } = await request.json();
    if (!query) return NextResponse.json({ error: 'query is required' }, { status: 400 });

    const context = `Original query: ${query}\n\nAI Response: ${(response || '').slice(0, 4000)}`;
    const perspectiveAgents = COUNCIL_AGENTS.filter((a) => a.id !== 'synthesizer');

    // Fan out 4 perspectives in parallel
    const settled = await Promise.allSettled(perspectiveAgents.map((a) => callAgent(a, context)));
    const perspectives = settled.map((s, i) =>
      s.status === 'fulfilled'
        ? s.value
        : {
            agentId: perspectiveAgents[i].id,
            text: isCreditError(s.reason)
              ? `${perspectiveAgents[i].name} perspective unavailable — API credits exhausted`
              : `${perspectiveAgents[i].name} perspective skipped — ${perspectiveAgents[i].provider} provider not configured`,
            latencyMs: 0,
            cost: 0,
          }
    );

    // Synthesize from all 4 perspectives
    const perspectiveSummary = perspectives
      .map((p) => `${COUNCIL_AGENTS.find((a) => a.id === p.agentId)?.name || p.agentId}: ${p.text}`)
      .join('\n\n');

    let synthesis = 'Synthesis unavailable.';
    let synthCost = 0;
    try {
      const synthResult = await callAgent(
        COUNCIL_AGENTS.find((a) => a.id === 'synthesizer')!,
        `${context}\n\n--- Perspectives ---\n\n${perspectiveSummary}`
      );
      synthesis = synthResult.text;
      synthCost = synthResult.cost;
    } catch (err) {
      console.error('Synthesizer failed:', err);
    }

    const totalCost = perspectives.reduce((sum, p) => sum + p.cost, 0) + synthCost;
    return NextResponse.json({ perspectives, synthesis, totalCost });
  } catch (error) {
    console.error('Council route error:', error);
    const msg = isCreditError(error)
      ? 'API credits exhausted. Please check your Anthropic billing at console.anthropic.com.'
      : 'Council failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
