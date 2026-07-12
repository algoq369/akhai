import { NextRequest, NextResponse } from 'next/server';
import { COUNCIL_AGENTS } from '@/lib/god-view/agents';
import { callProvider, isProviderAvailable } from '@/lib/multi-provider-api';
import type { ProviderFamily } from '@/lib/provider-selector';
import { GodViewAgentChatSchema } from '@/lib/route-schemas';
import { MODELS } from '@/lib/models';
import { requireAuth } from '@/lib/api-guard';

export const dynamic = 'force-dynamic';

/** POST /api/god-view/agent-chat — Follow-up conversation with a specific council agent. */
export async function POST(request: NextRequest) {
    const guard = requireAuth(request);
    if (guard.error) return guard.error;
  try {
    const parsed = GodViewAgentChatSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { agentId, messages, originalQuery, originalResponse } = parsed.data;

    const agent = COUNCIL_AGENTS.find((a) => a.id === agentId);
    if (!agent) return NextResponse.json({ error: 'Unknown agent' }, { status: 404 });

    const available = isProviderAvailable(agent.provider as ProviderFamily);
    const provider: ProviderFamily = available ? (agent.provider as ProviderFamily) : 'anthropic';
    const model = available ? agent.model : MODELS.mid;

    const systemPrompt = `${agent.prompt}\n\nOriginal query: ${originalQuery || ''}\n\nOriginal response: ${(originalResponse || '').slice(0, 3000)}`;

    const result = await callProvider(provider, {
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
      model,
      maxTokens: 300,
      temperature: 0.7,
    });

    return NextResponse.json({ response: result.content, cost: result.cost, latencyMs: result.latencyMs });
  } catch (error) {
    console.error('Agent chat error:', error);
    return NextResponse.json({ error: 'Agent chat failed' }, { status: 500 });
  }
}
