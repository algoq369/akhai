import { NextRequest, NextResponse } from 'next/server';
import { MODELS } from '@/lib/models';
import { callProvider } from '@/lib/multi-provider-api';
import { NatalChatSchema } from '@/lib/route-schemas';

export async function POST(request: NextRequest) {
  try {
    // ⚠ PII (birth-data chart): the 400 below emits flatten() messages only — never echoes values
    const parsed = NatalChatSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { question, chart } = parsed.data;
    const mode: 'secular' | 'esoteric' = parsed.data.mode === 'esoteric' ? 'esoteric' : 'secular';
    const history = parsed.data.messages;

    const aspectList = (chart.aspects ?? [])
      .map(
        (a: { planet: string; type: string; orb: number }) =>
          `${a.planet} ${a.type} (${a.orb}\u00B0)`
      )
      .join(', ');

    const planetList = (chart.planets ?? [])
      .map(
        (p: { name: string; sign: string; signDegree: number; house: number }) =>
          `${p.name}: ${p.sign} ${Math.round(p.signDegree)}\u00B0, house ${p.house}`
      )
      .join('\n  ');

    const tone =
      mode === 'secular'
        ? 'Use developmental/psychological language (growth direction, potential, development). No esoteric terms.'
        : 'Use traditional astrological terminology (karma, dharma, past lives, soul purpose).';

    const systemPrompt = `You are AkhAI's natal chart analyst. The user has the following natal chart:
North Node: ${chart.northNode.sign} ${chart.northNode.formattedDegree} in house ${chart.northNode.house}
South Node: ${chart.southNode.sign} ${chart.southNode.formattedDegree} in house ${chart.southNode.house}
Aspects to North Node: ${aspectList || 'none'}
Planets:
  ${planetList}

Answer their question using their specific chart data. Be precise \u2014 reference their exact placements. Keep answers 2-3 paragraphs.
${tone}`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: question },
    ];

    let response: string;
    let cost = 0;

    try {
      const result = await callProvider('anthropic', {
        messages,
        model: MODELS.premium,
        maxTokens: 500,
        temperature: 0.7,
      });
      response = result.content;
      cost = result.cost;
    } catch {
      response = 'Interpretation unavailable \u2014 API credits exhausted';
    }

    return NextResponse.json({ response, cost });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
