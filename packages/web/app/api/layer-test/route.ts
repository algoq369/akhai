/**
 * Layer Comparison Test Endpoint
 *
 * Sends the SAME query with different layer configurations
 * and returns all responses for comparison.
 *
 * POST /api/layer-test
 * Body: { query: string, configs: Array<{ name: string, weights: Record<number, number> }> }
 */

import { NextResponse } from 'next/server';
import { fuseIntelligence, generateEnhancedSystemPrompt } from '@/lib/intelligence-fusion';
import { callProvider } from '@/lib/multi-provider-api';
import { DEFAULT_INSTINCT_CONFIG } from '@/lib/instinct-mode';
import { LayerTestSchema } from '@/lib/route-schemas';

export const dynamic = 'force-dynamic';

export const runtime = 'nodejs';

// Simplified base prompt for testing (mirrors getMethodologyPrompt in simple-query)
const BASE_PROMPT = `You are AkhAI, a sovereign AI research engine. Lead every response with insight — the first sentence should teach something. No filler, no preamble. Every word earns its place.

WRITING RULES:
- Lead with the answer, not the setup
- Paragraphs over bullet lists (bullets only when structurally necessary)
- Short sentences for impact. Longer sentences for nuance.
- End with actionable next step or connection to broader pattern
- No meta-commentary about the response itself

FORBIDDEN: "Great question!", "Let me explain", "I'd be happy to help", "It's important to note", "As an AI"

[RELATED]: After your response, suggest 2-3 related topics
[NEXT]: Suggest one follow-up question`;

export async function POST(request: Request) {
  // Diagnostic route — dev-only, invisible in prod (mirrors the E4.3 dev-login 404 guard)
  if (process.env.NODE_ENV === 'production') return new NextResponse(null, { status: 404 });
  try {
    const parsed = LayerTestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { query, configs } = parsed.data;

    const results = [];

    for (const config of configs) {
      // Fill missing weights with 0.5
      const fullWeights: Record<number, number> = {
        1: 0.5,
        2: 0.5,
        3: 0.5,
        4: 0.5,
        5: 0.5,
        6: 0.5,
        7: 0.5,
        8: 0.5,
        9: 0.5,
        10: 0.5,
        11: 0.5,
        ...config.weights,
      };

      // Run fusion with these weights
      const fusionResult = await fuseIntelligence(
        query,
        fullWeights,
        { ...DEFAULT_INSTINCT_CONFIG, enabled: false },
        { contextInjection: null, relatedTopics: [] }
      );

      // Generate the enhanced system prompt with layer behaviors
      const enhancement = generateEnhancedSystemPrompt(fusionResult, fullWeights);

      // Build full system prompt
      const systemPrompt = `${BASE_PROMPT}\n\n${enhancement}`;

      // Call the AI (use Sonnet for speed since we're making 3 calls)
      try {
        const response = await callProvider('anthropic', {
          messages: [{ role: 'user', content: query }],
          systemPrompt,
          model: 'claude-sonnet-4-20250514',
          maxTokens: 1000,
          temperature: 0.7,
        });

        results.push({
          configName: config.name,
          weights: fullWeights,
          enhancement,
          methodology: fusionResult.selectedMethodology,
          confidence: Math.round(fusionResult.confidence * 100),
          response: response.content,
          tokens: response.usage?.outputTokens || 0,
        });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        results.push({
          configName: config.name,
          weights: fullWeights,
          enhancement,
          methodology: fusionResult.selectedMethodology,
          confidence: Math.round(fusionResult.confidence * 100),
          response: `ERROR: ${msg}`,
          tokens: 0,
        });
      }
    }

    return NextResponse.json({ query, results });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
