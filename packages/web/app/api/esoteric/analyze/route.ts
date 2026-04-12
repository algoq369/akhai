import { NextRequest, NextResponse } from 'next/server';
import {
  getCurrentPositions,
  getConvergence,
  getRelevantPatterns,
  getBarbaultChart,
  getPowerIndex,
  detectEsotericRelevance,
} from '@/lib/esoteric/cycle-engine';
import { getPatterns } from '@/lib/esoteric/cross-civilizational';
import { callProvider } from '@/lib/multi-provider-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query: string = body.query ?? '';
    const topics: string[] = body.topics ?? [];
    const mode: 'secular' | 'esoteric' = body.mode === 'esoteric' ? 'esoteric' : 'secular';

    if (!query) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }

    if (!detectEsotericRelevance(query)) {
      return NextResponse.json({ relevant: false });
    }

    const positions = getCurrentPositions();
    const convergenceData = getConvergence();
    const crossCivPatterns = getRelevantPatterns(topics);
    const civInsights = getPatterns(topics, mode);
    const chartData = getBarbaultChart();
    const powerIndex = getPowerIndex(5);

    // AI synthesis
    let synthesis: string;
    let cost = 0;

    const systemPrompt =
      mode === 'secular'
        ? "You are AkhAI's macro-cyclical analyst. Synthesize the following framework positions into a concise 3-4 sentence assessment. Be factual, cite specific framework values, acknowledge uncertainty. Avoid esoteric terminology — use secular, academic language only."
        : "You are AkhAI's macro-cyclical analyst. Synthesize the following framework positions into a concise 3-4 sentence assessment. Be factual, cite specific framework values, acknowledge uncertainty. Use traditional terminology from the frameworks freely — Hermetic, Khaldunian, Vedic, and Chinese cosmological language is appropriate.";

    const userPrompt = `Query: ${query}\n\nFramework Positions:\n${JSON.stringify(positions, null, 2)}\n\nConvergence Score: ${convergenceData.current.score}/${convergenceData.current.maxScore} (${convergenceData.current.label})\n\nCross-civilizational insights: ${civInsights.length > 0 ? civInsights.map((i) => i.formatted).join('\n') : 'None matched'}`;

    try {
      const response = await callProvider('anthropic', {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        model: 'claude-sonnet-4-20250514',
        maxTokens: 300,
        temperature: 0.7,
      });
      synthesis = response.content;
      cost = response.cost;
    } catch {
      synthesis = 'Synthesis unavailable — API credits exhausted';
    }

    return NextResponse.json({
      relevant: true,
      mode,
      positions,
      convergence: convergenceData,
      patterns: civInsights.length > 0 ? civInsights : crossCivPatterns,
      chart: chartData,
      powerIndex,
      synthesis,
      cost,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
