/**
 * GTP (Generative Thought Process) - Multi-AI Consensus API Route
 *
 * This is ONE of AkhAI's 7 methodologies, specifically for multi-perspective analysis.
 * Uses three FREE OpenRouter models from different labs (OpenAI / Cohere / Meta) in
 * parallel rounds to achieve consensus — free-only by decision, no paid advisor APIs.
 *
 * AkhAI School of Thoughts:
 * - Direct: Fast single-pass
 * - CoD: Iterative drafts
 * - BoT: Template reasoning
 * - ReAct: Tool-augmented
 * - PoT: Code computation
 * - GTP: Multi-AI consensus (THIS FILE)
 * - Auto: Smart routing
 *
 * Flow:
 * 1. Round 1: All 3 AIs respond independently
 * 2. Round 2: Each AI sees others' responses and refines
 * 3. Synthesis: Claude synthesizes the consensus
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
// TotConsensusSchema encodes the simple-query→tot-consensus INTERNAL contract — see route-schemas.ts
import { TotConsensusSchema } from '@/lib/route-schemas';
import { MODELS, ADVISORS } from '@/lib/models';
import {
  emitTotAdvisor,
  emitTotAdvisorFallback,
  emitTotAdvisorMiss,
  emitTotRound2Skip,
  emitTotSynthesis,
} from '@/lib/tot-stream';
import { OPENROUTER_ENDPOINT, callFreeChatWithFallback, recordAdvisorCogs } from '@/lib/openrouter';
import { buildSynthesisPrompt, streamSynthesis } from '@/lib/synthesis-stream';
import { extractKeyPoints, calculateConfidence, calculateConsensus } from '@/lib/consensus-scoring';

export const dynamic = 'force-dynamic';

// Provider configurations — all advisors on FREE OpenRouter models, 3 different labs for
// perspective diversity. Free tier ≈ 20 req/min shared: one consensus = 3 advisor calls
// (+3 if round 2 runs, + at most 1 fallback retry each); no throttling code needed yet.
const PROVIDERS = {
  technical: {
    name: 'GPT-OSS',
    endpoint: OPENROUTER_ENDPOINT,
    model: ADVISORS.technical,
    role: 'Technical Analyst',
    icon: '🔬',
    color: '#4F46E5',
  },
  strategic: {
    name: 'North',
    endpoint: OPENROUTER_ENDPOINT,
    model: ADVISORS.strategic,
    role: 'Strategic Advisor',
    icon: '🎯',
    color: '#F97316',
  },
  creative: {
    name: 'Llama',
    endpoint: OPENROUTER_ENDPOINT,
    model: ADVISORS.creative,
    role: 'Creative Challenger',
    icon: '⚡',
    color: '#10B981',
  },
} as const;

type ProviderKey = keyof typeof PROVIDERS;

interface AdvisorResponse {
  provider: ProviderKey;
  name: string;
  role: string;
  content: string;
  keyPoints: string[];
  confidence: number;
  tokens: { input: number; output: number };
  latency: number;
  status: 'complete' | 'failed' | 'timeout';
  error?: string;
}

interface RoundResult {
  round: number;
  responses: AdvisorResponse[];
  consensusLevel: number;
  timestamp: number;
}

// Helper to call a provider
async function callProvider(
  provider: ProviderKey,
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  timeout: number = 60000,
  streamQueryId?: string,
  queryStartTime?: number
): Promise<AdvisorResponse> {
  const config = PROVIDERS[provider];
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Pinned :free slug first; on 404/400-model/429 retry once via OpenRouter's free auto-router,
    // announcing the reroute honestly on the live panel.
    const { response, modelUsed } = await callFreeChatWithFallback(
      apiKey,
      config.model,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      controller.signal,
      // ThoughtEvent.timestamp is ms since QUERY start — use the route-level base, not this call's
      () => emitTotAdvisorFallback(streamQueryId, config.name, queryStartTime ?? startTime)
    );

    if (!response.ok) {
      const errorText = await response.text();
      clearTimeout(timeoutId);
      throw new Error(`${config.name} API error (${response.status}): ${errorText.slice(0, 100)}`);
    }

    // Body read stays under the abort budget: congested free upstreams return headers fast then
    // trickle tokens for minutes — clearing the timeout on headers made json() unbounded (observed
    // live 2026-07-10: 9+ min advisor calls). Abort mid-body rejects json() → honest 'timeout'.
    const data = await response.json();
    clearTimeout(timeoutId);
    const content = data.choices?.[0]?.message?.content || '';
    const latency = Date.now() - startTime;
    recordAdvisorCogs(streamQueryId, provider, modelUsed, data.usage, latency, content ? 'ok' : 'empty');

    return {
      provider,
      name: config.name,
      role: config.role,
      content,
      keyPoints: extractKeyPoints(content),
      confidence: calculateConfidence(content),
      tokens: {
        input: data.usage?.prompt_tokens || 0,
        output: data.usage?.completion_tokens || 0,
      },
      latency,
      status: 'complete',
    };
  } catch (error: any) {
    const latency = Date.now() - startTime;
    const isTimeout = error.name === 'AbortError';
    // Failed calls still get a reconciling COGS row (matches multi-provider-api discipline)
    recordAdvisorCogs(streamQueryId, provider, config.model, undefined, latency, 'error');

    return {
      provider,
      name: config.name,
      role: config.role,
      content: '',
      keyPoints: [],
      confidence: 0,
      tokens: { input: 0, output: 0 },
      latency,
      status: isTimeout ? 'timeout' : 'failed',
      error: error.message,
    };
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const queryId = crypto.randomUUID().replace(/-/g, '').slice(0, 8);

  log('INFO', 'GTP_CONSENSUS', `Starting multi-AI consensus: ${queryId}`);

  try {
    const parsed = TotConsensusSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { query, conversationHistory, queryId: streamQueryId } = parsed.data;

    // Get API keys — all three advisors go through OpenRouter (free models only, by decision)
    const apiKeys = {
      technical: process.env.OPENROUTER_API_KEY,
      strategic: process.env.OPENROUTER_API_KEY,
      creative: process.env.OPENROUTER_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
    };

    // Check which providers are available
    const availableProviders = (Object.keys(PROVIDERS) as ProviderKey[]).filter((p) => apiKeys[p]);

    if (availableProviders.length === 0) {
      return NextResponse.json(
        {
          error: 'No AI providers configured. Add OPENROUTER_API_KEY (free-model advisors).',
        },
        { status: 500 }
      );
    }

    log(
      'INFO',
      'GTP_CONSENSUS',
      `Using ${availableProviders.length} providers: ${availableProviders.join(', ')}`
    );

    const rounds: RoundResult[] = [];

    // ========================
    // ROUND 1: Independent Analysis
    // ========================
    log('INFO', 'GTP_CONSENSUS', 'Starting Round 1: Independent Analysis');

    const round1SystemPrompt = `You are a {ROLE} in AkhAI's multi-AI consensus system.

Your task: Analyze the query from your unique perspective.
- Provide independent analysis
- List 3-5 key points using bullet points
- Be concise but thorough
- End with your confidence level (high/medium/low)

Format with clear markdown structure.`;

    const round1Promises = availableProviders.map((provider) => {
      const config = PROVIDERS[provider];
      return callProvider(
        provider,
        apiKeys[provider]!,
        round1SystemPrompt.replace('{ROLE}', config.role),
        query,
        35000, // advisor budget: fail-fast under free-tier congestion (was 60s; 9-min hangs observed)
        streamQueryId,
        startTime
      ).then((r) => {
        emitTotAdvisor(streamQueryId, r, provider, startTime); // live-words: real excerpt as it lands
        emitTotAdvisorMiss(streamQueryId, r, provider, 1, startTime); // narrate timeouts/failures honestly
        return r;
      });
    });

    const round1Responses = await Promise.all(round1Promises);
    const round1Consensus = calculateConsensus(round1Responses);

    rounds.push({
      round: 1,
      responses: round1Responses,
      consensusLevel: round1Consensus,
      timestamp: Date.now(),
    });

    log(
      'INFO',
      'GTP_CONSENSUS',
      `Round 1 complete. Consensus: ${(round1Consensus * 100).toFixed(0)}%`
    );

    // ========================
    // ROUND 2: Cross-Pollination (if needed)
    // ========================
    const successfulRound1 = round1Responses.filter((r) => r.status === 'complete');

    if (successfulRound1.length === 0) {
      // All advisors failed (free-tier rate limit/outage hits every advisor at once now that they
      // share one key): error out instead of synthesizing from nothing, so the caller's honest
      // single-model fallback fires rather than a fake "consensus".
      const reasons = round1Responses.map((r) => `${r.name}: ${r.error || r.status}`).join('; ');
      log('ERROR', 'GTP_CONSENSUS', `All advisors failed — ${reasons}`);
      return NextResponse.json(
        { error: 'All consensus advisors failed', details: reasons },
        { status: 502 }
      );
    }

    // Only cross-pollinate from a FULL round 1: degraded round 1 → round 2 re-times-out on the
    // congested free tier (observed 2×: 0% consensus, 2 calls + 35s wasted); synthesis from
    // round 1 is strictly better.
    if (successfulRound1.length < availableProviders.length) {
      log(
        'INFO',
        'GTP_CONSENSUS',
        `Round 2 skipped — only ${successfulRound1.length}/${availableProviders.length} advisors answered`
      );
      emitTotRound2Skip(streamQueryId, successfulRound1.length, availableProviders.length, startTime);
    }

    if (successfulRound1.length === availableProviders.length && round1Consensus < 0.85) {
      log('INFO', 'GTP_CONSENSUS', 'Starting Round 2: Cross-Pollination');

      const round1Context = successfulRound1
        .map((r) => `### ${r.name} (${r.role}):\n${r.content.slice(0, 500)}...`)
        .join('\n\n');

      const round2SystemPrompt = `You are a {ROLE} in AkhAI's multi-AI consensus system.

Round 2: You've seen other advisors' perspectives. Refine your analysis.

Other advisors said:
${round1Context}

Your task:
1. Consider other perspectives
2. Identify areas of agreement
3. Note disagreements and why
4. Provide refined analysis

Be collaborative, not combative.`;

      const round2Promises = availableProviders
        .filter((p) => round1Responses.find((r) => r.provider === p)?.status === 'complete')
        .map((provider) => {
          const config = PROVIDERS[provider];
          return callProvider(
            provider,
            apiKeys[provider]!,
            round2SystemPrompt.replace('{ROLE}', config.role),
            `Original query: ${query}\n\nProvide your refined perspective.`,
            35000, // advisor budget: fail-fast under free-tier congestion (was 60s; 9-min hangs observed)
            streamQueryId,
            startTime
          ).then((r) => {
            emitTotAdvisorMiss(streamQueryId, r, provider, 2, startTime); // narrate timeouts/failures honestly
            return r;
          });
        });

      const round2Responses = await Promise.all(round2Promises);
      const round2Consensus = calculateConsensus(round2Responses);

      rounds.push({
        round: 2,
        responses: round2Responses,
        consensusLevel: round2Consensus,
        timestamp: Date.now(),
      });

      log(
        'INFO',
        'GTP_CONSENSUS',
        `Round 2 complete. Consensus: ${(round2Consensus * 100).toFixed(0)}%`
      );
    }

    // ========================
    // SYNTHESIS: Final Merge
    // ========================
    log('INFO', 'GTP_CONSENSUS', 'Starting Synthesis phase');

    // Synthesize from the strongest round (later rounds win ties): a round 2 degraded by free-tier
    // timeouts must not drop a full round 1's answers (observed live: 3/3 round 1 → 1/3 round 2).
    let lastRound = rounds[0];
    for (const r of rounds) {
      const wins = (rr: RoundResult) => rr.responses.filter((x) => x.status === 'complete').length;
      if (wins(r) >= wins(lastRound)) lastRound = r;
    }
    const successfulResponses = lastRound.responses.filter((r) => r.status === 'complete');

    const synthesisContext = successfulResponses
      .map((r) => `### ${r.name} (${r.role}):\n${r.content}`)
      .join('\n\n---\n\n');

    let finalSynthesis: string;
    let synthesisTokens = { input: 0, output: 0 };

    // tot-live-words: when a live panel is attached, stream the Mother Base synthesis so the
    // answer flows word-by-word (real token chunks); null → the non-streamed fetch below runs.
    const synthesisPrompt = buildSynthesisPrompt(query, synthesisContext, successfulResponses.length);
    const streamed =
      apiKeys.anthropic && streamQueryId
        ? await streamSynthesis({ apiKey: apiKeys.anthropic, model: MODELS.premium, ...synthesisPrompt, maxTokens: 4096, streamQueryId, startTime })
        : null;

    if (streamed) {
      finalSynthesis = streamed.text;
      synthesisTokens = streamed.usage;
    } else if (apiKeys.anthropic) {
      const synthesisResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKeys.anthropic,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: MODELS.premium,
          max_tokens: 4096,
          system: synthesisPrompt.system,
          messages: [{ role: 'user', content: synthesisPrompt.userContent }],
        }),
      });

      if (synthesisResponse.ok) {
        const data = await synthesisResponse.json();
        finalSynthesis = data.content?.[0]?.text || 'Synthesis failed';
        synthesisTokens = {
          input: data.usage?.input_tokens || 0,
          output: data.usage?.output_tokens || 0,
        };
      } else {
        finalSynthesis = `# Multi-AI Consensus Response\n\n${synthesisContext}`;
      }
    } else {
      const best = successfulResponses.sort((a, b) => b.confidence - a.confidence)[0];
      finalSynthesis = best?.content || 'No successful responses';
    }

    // live-words excerpt ONLY when not token-streamed (the chunks already carried the content).
    if (!streamed) emitTotSynthesis(streamQueryId, finalSynthesis, startTime);

    // ========================
    // Calculate Final Metrics
    // ========================
    const totalLatency = Date.now() - startTime;

    let totalInputTokens = synthesisTokens.input;
    let totalOutputTokens = synthesisTokens.output;

    rounds.forEach((round) => {
      round.responses.forEach((r) => {
        totalInputTokens += r.tokens.input;
        totalOutputTokens += r.tokens.output;
      });
    });

    const costs: Record<string, { input: number; output: number }> = {
      technical: { input: 0, output: 0 }, // :free OpenRouter models — zero-priced
      strategic: { input: 0, output: 0 },
      creative: { input: 0, output: 0 },
      anthropic: { input: 0.003, output: 0.015 },
    };

    let totalCost =
      (synthesisTokens.input / 1000) * costs.anthropic.input +
      (synthesisTokens.output / 1000) * costs.anthropic.output;

    rounds.forEach((round) => {
      round.responses.forEach((r) => {
        const providerCosts = costs[r.provider];
        totalCost +=
          (r.tokens.input / 1000) * providerCosts.input +
          (r.tokens.output / 1000) * providerCosts.output;
      });
    });

    log('INFO', 'GTP_CONSENSUS', `Complete in ${totalLatency}ms. Cost: $${totalCost.toFixed(4)}`);

    // ========================
    // Build Response
    // ========================
    return NextResponse.json({
      id: queryId,
      query,
      methodology: 'tot',
      methodologyUsed: 'tot-consensus',
      selectionReason: 'Multi-AI consensus for comprehensive analysis',
      response: finalSynthesis,

      totData: {
        providers: availableProviders.map((p) => ({
          id: p,
          ...PROVIDERS[p],
        })),
        rounds,
        finalConsensus: lastRound.consensusLevel,
        synthesizer: apiKeys.anthropic ? 'anthropic' : 'best-response',
      },

      metrics: {
        tokens: totalInputTokens + totalOutputTokens,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        latency: totalLatency,
        cost: totalCost,
        roundCount: rounds.length,
        providersUsed: availableProviders.length,
        successRate: successfulResponses.length / availableProviders.length,
      },
    });
  } catch (error: any) {
    log('ERROR', 'GTP_CONSENSUS', `Error: ${error.message}`);
    return NextResponse.json(
      { error: 'GTP consensus failed', details: error.message },
      { status: 500 }
    );
  }
}
