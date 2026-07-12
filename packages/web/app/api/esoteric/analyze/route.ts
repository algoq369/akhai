import { NextRequest, NextResponse } from 'next/server';
import { MODELS } from '@/lib/models';
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
import { EsotericAnalyzeSchema } from '@/lib/route-schemas';
import { requireAuth } from '@/lib/api-guard';

export async function POST(request: NextRequest) {
    const guard = requireAuth(request);
    if (guard.error) return guard.error;
  try {
    const parsed = EsotericAnalyzeSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { query, topics } = parsed.data;
    const mode: 'secular' | 'esoteric' = parsed.data.mode === 'esoteric' ? 'esoteric' : 'secular';

    // Relevance is now a HINT, not a gate.
    // User explicitly clicked ◇ MACRO — always attempt the analysis.
    // The synthesis prompt includes the relevance signal so the AI can
    // acknowledge if a query has weak macro-cyclical correlation.
    const passedRelevanceCheck = detectEsotericRelevance(query);

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
        ? `You are AkhAI's macro-cyclical analyst. Synthesize the following framework positions into a concise 3-4 sentence assessment specifically relevant to the user's query. Be factual, cite specific framework values, acknowledge uncertainty. Avoid esoteric terminology — use secular, academic language only. If the query has weak macro-cyclical relevance, briefly note that the frameworks offer limited direct insight, then describe any indirect connections (e.g., broader context of the current cycle phase) in 1-2 sentences.`
        : `You are AkhAI's macro-cyclical analyst. Synthesize the following framework positions into a concise 3-4 sentence assessment specifically relevant to the user's query. Be factual, cite specific framework values, acknowledge uncertainty. Use traditional terminology from the frameworks freely — Hermetic, Khaldunian, Vedic, and Chinese cosmological language is appropriate. If the query has weak macro-cyclical relevance, briefly note limited framework applicability, then describe any indirect connections in 1-2 sentences.`;

    const userPrompt = `Query: ${query}\n\nRelevance signal: ${passedRelevanceCheck ? 'Strong macro-cyclical keywords detected' : 'No strong keywords — user explicitly requested macro analysis anyway'}\n\nFramework Positions:\n${JSON.stringify(positions, null, 2)}\n\nConvergence Score: ${convergenceData.current.score}/${convergenceData.current.maxScore} (${convergenceData.current.label})\n\nCross-civilizational insights: ${civInsights.length > 0 ? civInsights.map((i) => i.formatted).join('\n') : 'None matched'}`;

    try {
      const response = await callProvider('anthropic', {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        model: MODELS.premium,
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
      strongRelevance: passedRelevanceCheck,
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
