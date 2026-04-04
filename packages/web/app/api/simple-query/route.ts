/**
 * Multi-provider query endpoint with methodology-specific provider routing
 * Routes each methodology to its optimal AI provider for best performance
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger, log } from '@/lib/logger';
import { withRetry } from '@/lib/retry';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  checkCryptoQuery,
  selectMethodology,
  getMethodologyPrompt,
  runGroundingGuard,
} from '@/lib/query-pipeline';
import { createQuery, updateQuery, trackUsage, addEvent } from '@/lib/database';
import { getUserFromSession } from '@/lib/auth';
import { getContextForQuery } from '@/lib/side-canal';
import {
  getProviderForMethodology,
  validateProviderApiKey,
  getFallbackProvider,
  type CoreMethodology,
} from '@/lib/provider-selector';
import { callProvider, isProviderAvailable } from '@/lib/multi-provider-api';
import {
  trackServerQuerySubmitted,
  trackServerGuardTriggered,
  getAnonymousDistinctId,
} from '@/lib/posthog-events';

export const dynamic = 'force-dynamic';

// ============================================================================
// INTELLIGENCE FUSION LAYER - Unified AI orchestration
// ============================================================================
import {
  fuseIntelligence,
  generateEnhancedSystemPrompt,
  type IntelligenceFusionResult,
} from '@/lib/intelligence-fusion';
import { createAutoInstinctConfig } from '@/lib/instinct-mode';

// ============================================================================
// URL VISITOR SYSTEM - Fetch content from links shared by user
// ============================================================================
import { hasURLs, detectURLs } from '@/lib/url-detector';
import { fetchMultipleURLs, buildURLContext } from '@/lib/url-content-fetcher';

// ============================================================================
// GNOSTIC SOVEREIGN INTELLIGENCE PROTOCOLS
// ============================================================================
import {
  activateMetaCore,
  checkSovereignty,
  addSovereigntyMarkers,
  generateSovereigntyFooter,
  getMetaCoreMetadata,
} from '@/lib/meta-core-protocol';
import { detectAntipattern, purifyResponse } from '@/lib/antipattern-guard';
import { trackAscent, suggestElevation, Layer, LAYER_METADATA } from '@/lib/layer-registry';
import { analyzeLayerContent, getLayerActivationSummary } from '@/lib/layer-mapper';
import { emitThought, formatDuration } from '@/lib/thought-stream';

// ============================================================================
// ZOD INPUT VALIDATION SCHEMA
// ============================================================================
const QuerySchema = z.object({
  query: z.string().min(1).max(10000),
  methodology: z.enum(['direct', 'cod', 'sc', 'react', 'pas', 'tot', 'auto']).default('auto'),
  conversationHistory: z.array(z.object({ role: z.string(), content: z.string() })).default([]),
  pageContext: z.any().optional(),
  legendMode: z.boolean().default(false),
  layersWeights: z
    .record(z.string(), z.number())
    .optional()
    .transform((w) =>
      w
        ? (Object.fromEntries(Object.entries(w).map(([k, v]) => [Number(k), v])) as Record<
            number,
            number
          >)
        : undefined
    ),
  instinctConfig: z.any().optional(),
  liveRefinements: z.array(z.object({ type: z.string(), text: z.string() })).optional(),
  grimoireContext: z.any().optional(),
  queryId: z.string().optional(),
});

/** Emit thought to SSE AND persist to DB for history replay */
function emitAndPersist(queryId: string, event: import('@/lib/thought-stream').ThoughtEvent) {
  emitThought(queryId, event);
  try {
    addEvent(queryId, `pipeline:${event.stage}`, {
      id: event.id,
      stage: event.stage,
      timestamp: event.timestamp,
      data: event.data,
      details: event.details || null,
    });
  } catch (e) {
    // DB write failure is non-critical — SSE already delivered
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let queryId: string = Math.random().toString(36).slice(2, 10);

  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { allowed, remaining } = checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Get user from session (optional - allows anonymous usage)
    const token = request.cookies.get('session_token')?.value;
    const user = token ? getUserFromSession(token) : null;
    const userId = user?.id || null;

    const parsed = QuerySchema.safeParse(await request.json());
    if (!parsed.success) {
      logger.query.apiError('VALIDATION', 'Invalid input');
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.format() },
        { status: 400 }
      );
    }
    const {
      query,
      methodology,
      conversationHistory,
      pageContext,
      legendMode,
      layersWeights,
      instinctConfig,
      liveRefinements,
      grimoireContext,
      queryId: clientQueryId,
    } = parsed.data;

    // Use client-provided queryId if available (enables live SSE), otherwise generate
    queryId = clientQueryId || Math.random().toString(36).slice(2, 10);

    // Emit: query received
    emitAndPersist(queryId, {
      id: `${queryId}-received`,
      queryId,
      stage: 'received',
      timestamp: Date.now() - startTime,
      data: `Analyzing your question about ${query.split(/\s+/).slice(0, 5).join(' ')}...`,
      details: {},
    });

    // ============================================================================
    // URL VISITOR SYSTEM - Detect and fetch content from shared links
    // ============================================================================
    let urlContext = '';
    let urlsFetched: { url: string; type: string; success: boolean; title?: string }[] = [];

    if (hasURLs(query)) {
      const detectedURLs = detectURLs(query);
      log('INFO', 'URL_FETCH', `Detected ${detectedURLs.length} URLs in query`);

      try {
        const fetchedContents = await fetchMultipleURLs(
          detectedURLs.map((d) => d.url),
          3 // Max 3 URLs per query
        );

        urlsFetched = fetchedContents.map((c) => ({
          url: c.url,
          type: c.type,
          success: c.success,
          title: c.title,
        }));

        const successCount = fetchedContents.filter((c) => c.success).length;
        log(
          'INFO',
          'URL_FETCH',
          `Successfully fetched ${successCount}/${detectedURLs.length} URLs`
        );

        // Build context from fetched content
        urlContext = buildURLContext(fetchedContents);

        if (urlContext) {
          log('INFO', 'URL_FETCH', `URL context built: ${urlContext.length} chars`);
        }
      } catch (urlError) {
        log('WARN', 'URL_FETCH', `URL fetching failed: ${urlError}`);
      }
    }

    // Log query start
    logger.query.start(query, methodology);

    // ============================================================================
    // INTELLIGENCE FUSION LAYER - Unified AI orchestration
    // ============================================================================
    let fusionResult: IntelligenceFusionResult | null = null;

    // Default Layers weights if not provided by client
    const defaultWeights: Record<number, number> = {
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
    };
    const weights = layersWeights || defaultWeights;

    // Get Side Canal context for fusion
    let sideCanalContext: string | null = null;
    try {
      sideCanalContext = getContextForQuery(query, userId);
    } catch (error) {
      log('WARN', 'SIDE_CANAL', `Context fetch failed: ${error}`);
    }

    // Emit: side canal context
    if (sideCanalContext) {
      emitAndPersist(queryId, {
        id: `${queryId}-sidecanal`,
        queryId,
        stage: 'side-canal',
        timestamp: Date.now() - startTime,
        data: `context injected (${sideCanalContext.length} chars)`,
        details: {
          sideCanal: { topics: [], contextChars: sideCanalContext.length },
        },
      });
    }

    // Merge live refinements into Side Canal context
    if (liveRefinements && Array.isArray(liveRefinements) && liveRefinements.length > 0) {
      const refinementText = liveRefinements
        .map((r: { type: string; text: string }) => `- [${r.type}] ${r.text}`)
        .join('\n');
      const refinementContext =
        '\n\n[User Live Refinements — adjust response accordingly]:\n' + refinementText;
      sideCanalContext = sideCanalContext
        ? sideCanalContext + refinementContext
        : refinementContext;
      log('INFO', 'SIDE_CANAL', `Injected ${liveRefinements.length} live refinements`);

      emitAndPersist(queryId, {
        id: `${queryId}-refinements`,
        queryId,
        stage: 'refinements',
        timestamp: Date.now() - startTime,
        data: `${liveRefinements.length} active`,
        details: {
          refinementCount: liveRefinements.length,
        },
      });
    }

    // Inject active Grimoire context (instructions + memories)
    if (grimoireContext && grimoireContext.id) {
      const parts: string[] = [];
      if (grimoireContext.instructions) {
        parts.push(`Instructions: ${grimoireContext.instructions}`);
      }
      if (grimoireContext.memories && grimoireContext.memories.length > 0) {
        parts.push(
          `Memories:\n${grimoireContext.memories.map((m: string) => `- ${m}`).join('\n')}`
        );
      }
      if (parts.length > 0) {
        const grimoireBlock = `\n\n[Active Grimoire: ${grimoireContext.name}]\n${parts.join('\n')}`;
        sideCanalContext = sideCanalContext ? sideCanalContext + grimoireBlock : grimoireBlock;
        log(
          'INFO',
          'GRIMOIRE',
          `Injected context from "${grimoireContext.name}" (${parts.length} sections)`
        );
      }
    }

    try {
      // Create instinct config (auto-detect lenses from query)
      const effectiveInstinctConfig =
        instinctConfig || createAutoInstinctConfig(query, 0.5, weights);

      // Run Intelligence Fusion
      fusionResult = await fuseIntelligence(query, weights, effectiveInstinctConfig, {
        contextInjection: sideCanalContext,
        relatedTopics: [],
      });

      log(
        'INFO',
        'FUSION',
        `Methodology: ${fusionResult.selectedMethodology} (${Math.round(fusionResult.confidence * 100)}% confidence)`
      );
      log(
        'INFO',
        'FUSION',
        `Dominant Layers: ${fusionResult.dominantLayers.map((s) => LAYER_METADATA[s]?.aiName).join(', ') || 'None'}`
      );
      log(
        'INFO',
        'FUSION',
        `Guard: ${fusionResult.guardRecommendation} | Thinking Budget: ${fusionResult.extendedThinkingBudget}`
      );
      log('INFO', 'FUSION', `Processing time: ${fusionResult.processingTimeMs}ms`);
    } catch (fusionError) {
      log('WARN', 'FUSION', `Intelligence fusion failed: ${fusionError}`);
      fusionResult = null;
    }

    // Methodology selection - use fusion result if available, fallback to legacy
    const selectedMethod =
      fusionResult && methodology === 'auto'
        ? {
            id: fusionResult.selectedMethodology,
            reason: `Fusion: ${fusionResult.methodologyScores[0]?.reasons.join(', ') || 'Auto-selected'}`,
          }
        : selectMethodology(query, methodology);

    // Emit: routing decision (with rich fusion data)
    emitAndPersist(queryId, {
      id: `${queryId}-routing`,
      queryId,
      stage: 'routing',
      timestamp: Date.now() - startTime,
      data: `Using ${selectedMethod.id}${selectedMethod.reason ? ` — ${selectedMethod.reason}` : ''}${fusionResult ? `. Confidence: ${Math.round(fusionResult.confidence * 100)}%` : ''}`,
      details: {
        methodology: {
          selected: selectedMethod.id,
          reason:
            selectedMethod.reason ||
            (methodology !== 'auto' ? `user selected ${selectedMethod.id}` : 'auto-detected'),
          candidates:
            fusionResult?.methodologyScores?.slice(0, 3).map((s: any) => s.methodology) || [],
        },
        confidence: fusionResult ? fusionResult.confidence : undefined,
        // Rich fusion reasoning
        queryAnalysis: fusionResult
          ? {
              complexity: fusionResult.analysis.complexity,
              queryType: fusionResult.analysis.queryType,
              keywords: fusionResult.analysis.keywords.slice(0, 8),
              requiresTools: fusionResult.analysis.requiresTools,
              requiresMultiPerspective: fusionResult.analysis.requiresMultiPerspective,
              isMathematical: fusionResult.analysis.isMathematical,
              isCreative: fusionResult.analysis.isCreative,
            }
          : undefined,
        methodologyScores:
          fusionResult?.methodologyScores?.slice(0, 4).map((s: any) => ({
            methodology: s.methodology,
            score: Math.round(s.score * 100),
            reasons: s.reasons,
          })) || [],
        guardReasons: fusionResult?.guardReasons || [],
        processingMode: fusionResult?.processingMode,
        activeLenses: fusionResult?.activeLenses || [],
      },
    });

    // Emit: layer activations (with keywords + path activations)
    if (fusionResult) {
      const dominant = fusionResult.dominantLayers[0];
      const dominantName = dominant ? LAYER_METADATA[dominant]?.aiName || 'unknown' : 'none';
      // Build structured layer map from weights + fusion activations
      const layerDetails: Record<
        number,
        { name: string; weight: number; activated: boolean; keywords: string[] }
      > = {};
      for (const [key, val] of Object.entries(weights)) {
        const num = Number(key) as Layer;
        const meta = LAYER_METADATA[num];
        if (meta) {
          const activation = fusionResult.layerActivations.find((a: any) => a.layerNode === num);
          layerDetails[num] = {
            name: meta.aiName,
            weight: activation
              ? Math.round(activation.effectiveWeight * 100)
              : Math.round((val as number) * 100),
            activated: fusionResult.dominantLayers.includes(num),
            keywords: activation?.keywords?.slice(0, 4) || [],
          };
        }
      }
      // Build path activations
      const pathActs =
        fusionResult.pathActivations?.slice(0, 5).map((p: any) => ({
          from: LAYER_METADATA[p.from as Layer]?.aiName || String(p.from),
          to: LAYER_METADATA[p.to as Layer]?.aiName || String(p.to),
          weight: Math.round(p.weight * 100),
          description: p.description,
        })) || [];

      emitAndPersist(queryId, {
        id: `${queryId}-layers`,
        queryId,
        stage: 'layers',
        timestamp: Date.now() - startTime,
        data: `Activating ${dominantName} · ${fusionResult.dominantLayers.length} layers engaged`,
        details: {
          layers: layerDetails,
          dominantLayer: dominantName,
          pathActivations: pathActs,
        },
      });
    }

    // ============================================================================
    // GNOSTIC PRE-PROCESSING: Activate Protocols Before AI Call
    // ============================================================================
    let metaCoreState, progressState, analysisSessionId;

    try {
      // Get session ID from headers or cookies
      analysisSessionId =
        request.headers.get('x-session-id') ||
        request.cookies.get('akhai_session_id')?.value ||
        'anonymous';

      // META_CORE PROTOCOL - Activate self-awareness
      metaCoreState = activateMetaCore(query);
      log('INFO', 'META_CORE', `Intent: ${metaCoreState.humanIntention}`);
      log('INFO', 'META_CORE', `Boundary: ${metaCoreState.sovereignBoundary}`);
      log('INFO', 'META_CORE', `Reflection Mode: ${metaCoreState.reflectionMode}`);
      log('INFO', 'META_CORE', `Ascent Level: ${metaCoreState.ascentLevel}/10`);

      // ASCENT TRACKER - Track user journey
      progressState = trackAscent(analysisSessionId, query);
      log(
        'INFO',
        'ASCENT',
        `Level: ${LAYER_METADATA[progressState.currentLevel].aiName} (${progressState.currentLevel}/10)`
      );
      log('INFO', 'ASCENT', `Velocity: ${progressState.ascentVelocity.toFixed(2)} levels/query`);

      if (progressState.ascentVelocity > 2.0) {
        log('INFO', 'ASCENT', `⚡ Quantum leap detected! User ascending rapidly`);
      }
    } catch (gnosticError) {
      // Don't fail the request if Gnostic protocols fail
      log('WARN', 'GNOSTIC', `Protocol initialization failed: ${gnosticError}`);
      metaCoreState = null;
      progressState = null;
    }

    // Save query to database (with user_id)
    try {
      createQuery(queryId, query, selectedMethod.id, userId);
    } catch (dbError) {}

    // Check for crypto price queries (real-time data)
    const cryptoResult = await checkCryptoQuery(query, queryId, startTime);
    if (cryptoResult) {
      // Update database for crypto query
      updateQuery(
        queryId,
        {
          status: 'complete',
          result: JSON.stringify({ finalAnswer: cryptoResult.response }),
          tokens_used: cryptoResult.metrics.tokens || 0,
          cost: cryptoResult.metrics.cost || 0,
        },
        userId
      );
      return NextResponse.json({ ...cryptoResult, queryId });
    }

    // ========================
    // TOT Tree of Thoughts Route
    // ========================
    if (selectedMethod.id === 'tot') {
      log('INFO', 'TOT', 'Routing to Tree of Thoughts consensus endpoint');

      try {
        // Call the TOT consensus endpoint internally
        const gtpResponse = await fetch(new URL('/api/tot-consensus', request.url).toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, conversationHistory }),
        });

        if (!gtpResponse.ok) {
          const errorData = await gtpResponse.json();
          throw new Error(errorData.error || 'TOT consensus failed');
        }

        const gtpResult = await gtpResponse.json();

        // Update database
        updateQuery(
          queryId,
          {
            status: 'complete',
            result: JSON.stringify({ finalAnswer: gtpResult.response }),
            tokens_used: gtpResult.metrics?.tokens || 0,
            cost: gtpResult.metrics?.cost || 0,
          },
          userId
        );

        // Run Grounding Guard on the final response
        const guardResult = await runGroundingGuard(gtpResult.response, query);

        return NextResponse.json({
          ...gtpResult,
          id: queryId,
          queryId,
          guardResult,
          sideCanal: { contextInjected: false, suggestions: [] },
        });
      } catch (gtpError: any) {
        log(
          'ERROR',
          'TOT',
          `Tree of Thoughts consensus failed: ${gtpError.message}, falling back to Claude`
        );
        // Fall through to standard Claude processing
      }
    }

    // Select provider based on methodology
    const providerSpec = getProviderForMethodology(
      selectedMethod.id as CoreMethodology,
      legendMode
    );
    let selectedProvider = providerSpec.provider;

    // Validate API key, fallback if needed
    if (!validateProviderApiKey(selectedProvider)) {
      log(
        'WARN',
        'PROVIDER',
        `Primary provider ${selectedProvider} not available, finding fallback...`
      );
      selectedProvider = getFallbackProvider(selectedProvider);

      if (!validateProviderApiKey(selectedProvider)) {
        logger.query.apiError('MULTI-PROVIDER', 'No provider API keys configured');
        return NextResponse.json(
          {
            error: 'No AI provider API keys configured. Please add provider API keys to .env.local',
          },
          { status: 500 }
        );
      }

      log('INFO', 'PROVIDER', `Using fallback provider: ${selectedProvider}`);
    }

    // Log provider selection
    log(
      'INFO',
      'PROVIDER',
      `Methodology: ${selectedMethod.id} → Provider: ${selectedProvider} (${providerSpec.model})`
    );
    log('INFO', 'PROVIDER', `Reasoning: ${providerSpec.reasoning}`);

    // Emit: AI reasoning — what the system is thinking
    emitAndPersist(queryId, {
      id: `${queryId}-reasoning`,
      queryId,
      stage: 'reasoning',
      timestamp: Date.now() - startTime,
      data: metaCoreState
        ? `${metaCoreState.humanIntention}. Approach: ${selectedMethod.reason || selectedMethod.id}`
        : `${selectedMethod.reason || 'Processing query'}. Approach: ${selectedMethod.id}`,
      details: {
        reasoning: {
          intent: metaCoreState?.humanIntention || 'Analyzing query',
          approach: selectedMethod.reason || `Using ${selectedMethod.id} methodology`,
          reflectionMode: metaCoreState?.reflectionMode ? 'active' : 'standard',
          ascentLevel: metaCoreState?.ascentLevel || 1,
          providerReason:
            providerSpec.reasoning || `${selectedProvider} selected for ${selectedMethod.id}`,
        },
      },
    });

    // Side Canal context already fetched above in fusion layer
    // Log if context was found
    if (sideCanalContext) {
      log('INFO', 'SIDE_CANAL', `Context injected: ${sideCanalContext.substring(0, 100)}...`);
    }

    // Build messages with conversation history and context
    const messages = [
      ...conversationHistory.slice(-6).map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      ...(sideCanalContext
        ? [
            {
              role: 'assistant' as const,
              content: `[Context from previous conversations]\n${sideCanalContext}\n\n[Current query]`,
            },
          ]
        : []),
      { role: 'user' as const, content: query },
    ];

    // Get methodology-specific system prompt
    let systemPrompt = getMethodologyPrompt(selectedMethod.id, pageContext, legendMode);

    // Inject current date so model knows what year it is
    systemPrompt = `Current date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. Always use up-to-date context when discussing current events, trends, or future projections.\n\n${systemPrompt}`;

    // Auto web search for every query — inject fresh context
    try {
      const searchRes = await fetch('http://localhost:3000/api/web-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query, maxResults: 3 }),
      });
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const results = searchData.results || searchData.organic || [];
        if (results.length > 0) {
          const webContext = results
            .slice(0, 3)
            .map((r: any) => '- ' + (r.title || '') + ': ' + (r.snippet || r.description || ''))
            .join('\n');
          systemPrompt =
            'Live web context (searched as of today):\n' + webContext + '\n\n' + systemPrompt;
          log('INFO', 'SEARCH', 'Auto-search: ' + results.length + ' results injected');
        }
      }
    } catch (e) {
      log('WARN', 'SEARCH', 'Auto-search failed: ' + (e as Error).message);
    }

    // Inject URL context if we fetched any content
    if (urlContext) {
      systemPrompt = `${systemPrompt}\n\n${urlContext}`;
      log('INFO', 'URL_FETCH', `URL context injected into system prompt`);
    }

    // Inject Intelligence Fusion enhancement if available
    if (fusionResult) {
      const fusionEnhancement = generateEnhancedSystemPrompt(fusionResult, weights);
      systemPrompt = `${systemPrompt}\n\n${fusionEnhancement}`;

      // Log the layer configuration being applied
      const layerSummary = Object.entries(weights)
        .map(([k, v]) => {
          const pct = Math.round((v as number) * 100);
          const name = LAYER_METADATA[Number(k) as Layer]?.aiName || k;
          return `${name}:${pct}%`;
        })
        .join(', ');
      log('INFO', 'FUSION', `Layer config: ${layerSummary}`);
      log(
        'INFO',
        'FUSION',
        `Enhanced system prompt with Layer behaviors (+${fusionEnhancement.length} chars)`
      );
    }

    // Emit: generating
    emitAndPersist(queryId, {
      id: `${queryId}-generating`,
      queryId,
      stage: 'generating',
      timestamp: Date.now() - startTime,
      data: `Generating with ${providerSpec.model} via ${selectedProvider}...`,
      details: {
        model: providerSpec.model,
        provider: selectedProvider,
        methodology: { selected: selectedMethod.id, reason: selectedMethod.reason || '' },
      },
    });

    // Call Multi-Provider API
    logger.query.apiCall(selectedProvider.toUpperCase(), providerSpec.model);
    log('INFO', 'API', `Calling ${selectedProvider} API with model: ${providerSpec.model}`);

    let apiResponse;
    try {
      apiResponse = await withRetry(
        () =>
          callProvider(selectedProvider, {
            messages: [{ role: 'system', content: systemPrompt }, ...messages],
            model: providerSpec.model,
            maxTokens: 4096,
            temperature: 0.7,
          }),
        {
          maxAttempts: 3,
          baseDelay: 1000,
          shouldRetry: (err) =>
            err.message?.includes('rate') ||
            err.message?.includes('timeout') ||
            err.message?.includes('503'),
        }
      );
    } catch (apiError: any) {
      logger.query.apiError(selectedProvider.toUpperCase(), apiError.message);
      log('ERROR', 'API', `Provider ${selectedProvider} failed: ${apiError.message}`);

      return NextResponse.json(
        { error: `AI provider request failed: ${apiError.message}` },
        { status: 500 }
      );
    }

    const content = apiResponse.content;
    const inputTokens = apiResponse.usage.inputTokens;
    const outputTokens = apiResponse.usage.outputTokens;
    const tokens = apiResponse.usage.totalTokens;
    const latency = Date.now() - startTime;
    const cost = apiResponse.cost;

    logger.query.apiResponse(selectedProvider.toUpperCase(), tokens, latency);
    log('INFO', 'API', `Response received: ${tokens} tokens, ${latency}ms, $${cost.toFixed(6)}`);

    // Run Grounding Guard
    const guardResult = await runGroundingGuard(content, query);

    // Emit: guard complete
    emitAndPersist(queryId, {
      id: `${queryId}-guard`,
      queryId,
      stage: 'guard',
      timestamp: Date.now() - startTime,
      data:
        guardResult && !guardResult.passed
          ? `Guard: warning. ${guardResult.issues?.length ? guardResult.issues.join(', ') : 'Issues detected'}`
          : `Guard: passed. No issues detected`,
      details: {
        guard: {
          verdict: guardResult && !guardResult.passed ? 'warn' : 'pass',
          risk: guardResult
            ? (guardResult.scores.hype + guardResult.scores.echo + guardResult.scores.drift) / 300
            : 0,
          checks: guardResult?.issues || [],
        },
      },
    });

    // ============================================================================
    // GNOSTIC POST-PROCESSING: Analyze and Purify Response
    // ============================================================================
    let processedContent = content;
    let antipatternRisk, layerAnalysis, sovereigntyFooter, analysisMetadata;

    try {
      // ANTI-ANTIPATTERN SHIELD - Detect and purify hollow knowledge
      antipatternRisk = detectAntipattern(processedContent);

      if (antipatternRisk.risk !== 'none' && antipatternRisk.severity >= 0.4) {
        // Only purify at 40%+ severity — below that, single keyword matches in long responses are normal
        log(
          'WARN',
          'ANTIPATTERN',
          `Detected: ${antipatternRisk.risk} (severity: ${(antipatternRisk.severity * 100).toFixed(0)}%) — purifying`
        );
        processedContent = purifyResponse(processedContent, antipatternRisk);
      } else if (antipatternRisk.risk !== 'none') {
        // Low severity — log but don't purify (avoids false positives on business/strategy content)
        log(
          'INFO',
          'ANTIPATTERN',
          `Low-severity ${antipatternRisk.risk} (${(antipatternRisk.severity * 100).toFixed(0)}%) — skipping purification`
        );
      } else {
        log('INFO', 'ANTIPATTERN', `✓ Response is aligned (no antipatterns detected)`);
      }

      // SOVEREIGNTY CHECK - Ensure boundaries respected
      if (metaCoreState && !checkSovereignty(processedContent, metaCoreState)) {
        log('WARN', 'SOVEREIGNTY', `Boundary violation detected - adding humility markers`);
        processedContent = addSovereigntyMarkers(processedContent);
      }

      // Add sovereignty footer if needed (high-ascent queries)
      if (metaCoreState) {
        sovereigntyFooter = generateSovereigntyFooter(metaCoreState);
        if (sovereigntyFooter) {
          log('INFO', 'SOVEREIGNTY', `Adding sovereignty reminder footer`);
        }
      }

      // LAYERS MAPPING - Analyze Layer activations
      layerAnalysis = analyzeLayerContent(processedContent);
      const activationSummary = getLayerActivationSummary(layerAnalysis);
      log('INFO', 'LAYERS', activationSummary);

      if (layerAnalysis.synthesisInsight.detected) {
        log('INFO', 'LAYERS', `✨ Synthesis activated: ${layerAnalysis.synthesisInsight.insight}`);
      }

      // ELEVATION SUGGESTION
      const nextElevation = progressState ? suggestElevation(progressState) : null;

      // Build Gnostic metadata
      analysisMetadata = {
        metaCoreState: metaCoreState
          ? {
              intent: metaCoreState.humanIntention,
              boundary: metaCoreState.sovereignBoundary,
              reflectionMode: metaCoreState.reflectionMode,
              ascentLevel: metaCoreState.ascentLevel,
            }
          : null,
        progressState: progressState
          ? {
              currentLevel: progressState.currentLevel,
              levelName: LAYER_METADATA[progressState.currentLevel].aiName,
              velocity: progressState.ascentVelocity,
              totalQueries: progressState.totalQueries,
              nextElevation,
            }
          : null,
        layerAnalysis: {
          activations: layerAnalysis.activations.reduce(
            (acc, a) => {
              acc[a.layerNode] = a.activation;
              return acc;
            },
            {} as Record<number, number>
          ),
          dominant: LAYER_METADATA[layerAnalysis.dominantLayer].aiName,
          averageLevel: layerAnalysis.averageLevel,
          synthesisInsight: layerAnalysis.synthesisInsight.detected
            ? {
                insight: layerAnalysis.synthesisInsight.insight,
                confidence: layerAnalysis.synthesisInsight.confidence,
              }
            : null,
        },
        antipatternPurified: antipatternRisk.risk !== 'none' && antipatternRisk.severity >= 0.4,
        antipatternType: antipatternRisk.risk,
        sovereigntyFooter,
      };

      log('INFO', 'GNOSTIC', `✓ All protocols completed successfully`);

      // Emit: analysis — post-processing reasoning
      emitAndPersist(queryId, {
        id: `${queryId}-analysis`,
        queryId,
        stage: 'analysis',
        timestamp: Date.now() - startTime,
        data:
          antipatternRisk.risk !== 'none' && antipatternRisk.severity >= 0.4
            ? `purified: ${antipatternRisk.risk} antipatterns`
            : antipatternRisk.risk !== 'none'
              ? `low ${antipatternRisk.risk} (${(antipatternRisk.severity * 100).toFixed(0)}%) · ${layerAnalysis ? LAYER_METADATA[layerAnalysis.dominantLayer]?.aiName || 'balanced' : 'standard'} dominant`
              : `clean · ${layerAnalysis ? LAYER_METADATA[layerAnalysis.dominantLayer]?.aiName || 'balanced' : 'standard'} dominant`,
        details: {
          analysis: {
            antipatternRisk: antipatternRisk.risk,
            sovereigntyCheck: metaCoreState
              ? checkSovereignty(processedContent, metaCoreState)
              : true,
            purified: antipatternRisk.risk !== 'none' && antipatternRisk.severity >= 0.4,
            synthesisInsight: layerAnalysis?.synthesisInsight?.detected
              ? layerAnalysis.synthesisInsight.insight
              : '',
            dominantLayer: layerAnalysis
              ? LAYER_METADATA[layerAnalysis.dominantLayer]?.aiName || 'unknown'
              : '',
            averageLevel: layerAnalysis?.averageLevel || 0,
          },
        },
      });
    } catch (gnosticError) {
      // Don't fail the request if post-processing fails
      log('WARN', 'GNOSTIC', `Post-processing failed: ${gnosticError}`);
      processedContent = content; // Fall back to original content
      analysisMetadata = null;
    }

    // Save to database
    updateQuery(
      queryId,
      {
        status: 'complete',
        result: JSON.stringify({ finalAnswer: content }),
        tokens_used: tokens,
        cost: cost,
      },
      userId
    );

    // Track API usage
    trackUsage(selectedProvider, providerSpec.model, inputTokens, outputTokens, cost);

    logger.query.complete(queryId, latency, cost);

    // Extract topics and get suggestions asynchronously (don't block response)
    // Works for both logged-in and anonymous users
    let suggestions: any[] = [];
    try {
      const { extractTopics, getSuggestions, linkQueryToTopics, updateTopicRelationships } =
        await import('@/lib/side-canal');

      log(
        'INFO',
        'SIDE_CANAL',
        `Starting topic extraction for queryId: ${queryId}, userId: ${userId || 'anonymous'}`
      );

      // Extract topics (works for anonymous users too - userId can be null)
      const topics = await extractTopics(query, content, userId, legendMode);

      log('INFO', 'SIDE_CANAL', `Extracted ${topics.length} topics`);

      if (topics.length > 0) {
        const topicIds = topics.map((t) => t.id);
        linkQueryToTopics(queryId, topicIds);
        updateTopicRelationships(topicIds, userId);
        suggestions = getSuggestions(topicIds, userId);

        log('INFO', 'SIDE_CANAL', `Got ${suggestions.length} suggestions from relationships`);

        // If no suggestions from relationships, show extracted topics as suggestions
        // This helps users see what topics were discovered
        if (suggestions.length === 0 && topics.length > 1) {
          suggestions = topics.slice(1).map((topic) => ({
            topicId: topic.id,
            topicName: topic.name,
            reason: 'Topic discovered in this conversation',
            relevance: 1.0,
          }));
          log('INFO', 'SIDE_CANAL', `Using ${suggestions.length} extracted topics as suggestions`);
        }

        // Generate synopsis asynchronously (don't wait)
        const { generateSynopsis } = await import('@/lib/side-canal');
        generateSynopsis(topicIds[0], [queryId], userId).catch((err) => {
          log('WARN', 'SIDE_CANAL', `Synopsis generation error: ${err}`);
        });

        log(
          'INFO',
          'SIDE_CANAL',
          `Success: ${topics.length} topics extracted, ${suggestions.length} suggestions to show`
        );
      } else {
        log(
          'INFO',
          'SIDE_CANAL',
          'No topics extracted - this might be due to API key or extraction failure'
        );
      }
    } catch (err) {
      log(
        'ERROR',
        'SIDE_CANAL',
        `Topic extraction error: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    const responseData = {
      id: queryId,
      queryId,
      query,
      methodology: selectedMethod.id,
      methodologyUsed: selectedMethod.id,
      selectionReason: selectedMethod.reason,
      response: processedContent, // GNOSTIC: Use purified content
      provider: {
        family: selectedProvider,
        model: providerSpec.model,
        reasoning: providerSpec.reasoning,
      },
      metrics: {
        tokens,
        latency,
        cost,
      },
      guardResult,
      sideCanal: {
        contextInjected: !!sideCanalContext,
        suggestions,
        topicsExtracted: suggestions.length > 0, // Indicates topics were found
      },
      // ============================================================================
      // URL VISITOR - Content fetched from shared links
      // ============================================================================
      urlVisitor: {
        urlsDetected: urlsFetched.length,
        urlsFetched: urlsFetched.filter((u) => u.success).length,
        urls: urlsFetched,
        contextInjected: !!urlContext,
      },
      // ============================================================================
      // GNOSTIC METADATA - Sovereignty, Progress, Layer Analysis
      // ============================================================================
      gnostic: analysisMetadata,
      // ============================================================================
      // INTELLIGENCE FUSION - Unified AI orchestration metadata
      // ============================================================================
      fusion: fusionResult
        ? {
            methodology: selectedMethod.id, // Always show the ACTUAL method used, not fusion's suggestion
            confidence: fusionResult.confidence,
            layerActivations: fusionResult.layerActivations.slice(0, 5).map((s) => ({
              name: s.name,
              effectiveWeight: s.effectiveWeight,
              keywords: s.keywords,
            })),
            dominantLayers: fusionResult.dominantLayers.map((s) => LAYER_METADATA[s]?.aiName),
            guardRecommendation: fusionResult.guardRecommendation,
            extendedThinkingBudget: fusionResult.extendedThinkingBudget,
            processingMode: fusionResult.processingMode,
            activeLenses: fusionResult.activeLenses,
            processingTimeMs: fusionResult.processingTimeMs,
          }
        : null,
    };

    log('INFO', 'SIDE_CANAL', `Response includes ${suggestions.length} suggestions`);

    // Track query submission in PostHog (server-side)
    try {
      const distinctId = userId || getAnonymousDistinctId(request);
      trackServerQuerySubmitted(distinctId, {
        query,
        methodology: selectedMethod.id,
        methodology_selected: methodology,
        methodology_used: selectedMethod.id,
        tokens,
        cost,
        latency_ms: latency,
        provider: selectedProvider,
        model: providerSpec.model,
        guard_active: !!guardResult,
        side_canal_enabled: !!sideCanalContext,
        legend_mode: legendMode || false,
      });

      // Track guard if triggered
      if (guardResult && !guardResult.passed) {
        // Find the main issue type
        const guardType = guardResult.issues[0]?.toLowerCase().includes('hype')
          ? 'hype'
          : guardResult.issues[0]?.toLowerCase().includes('echo')
            ? 'echo'
            : guardResult.issues[0]?.toLowerCase().includes('drift')
              ? 'drift'
              : 'factuality';

        trackServerGuardTriggered(distinctId, {
          guard_type: guardType,
          action: 'pending',
          query,
          methodology: selectedMethod.id,
          scores: guardResult.scores || { hype: 0, echo: 0, drift: 0, fact: 0 },
          issues: guardResult.issues || [],
        });
      }
    } catch (trackError) {
      // Don't fail the request if tracking fails
      log('WARN', 'POSTHOG', `Tracking failed: ${trackError}`);
    }

    // Emit: complete
    emitAndPersist(queryId, {
      id: `${queryId}-complete`,
      queryId,
      stage: 'complete',
      timestamp: Date.now() - startTime,
      data: `Complete · ${formatDuration(Date.now() - startTime)} · ${tokens} tokens · $${cost.toFixed(4)}`,
      details: {
        duration: Date.now() - startTime,
        tokens: { input: inputTokens, output: outputTokens, total: tokens },
        cost,
        model: providerSpec.model,
        provider: selectedProvider,
        methodology: { selected: selectedMethod.id, reason: selectedMethod.reason || '' },
      },
    });

    return NextResponse.json(responseData);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : 'no stack';
    const errorName = error instanceof Error ? error.name : typeof error;

    logger.system.error(errorMessage);
    log('ERROR', 'API', `Error details`, { errorName, errorMessage, errorStack, queryId });

    // Emit: error
    try {
      emitAndPersist(queryId, {
        id: `${queryId}-error`,
        queryId,
        stage: 'error',
        timestamp: Date.now() - startTime,
        data: errorMessage.slice(0, 100),
        details: { duration: Date.now() - startTime },
      });
    } catch {
      /* don't fail on emit error */
    }

    // Update query status to error
    try {
      const token = request.cookies.get('session_token')?.value;
      const user = token ? getUserFromSession(token) : null;
      const userId = user?.id || null;
      updateQuery(
        queryId,
        {
          status: 'error',
          result: JSON.stringify({ error: errorMessage }),
        },
        userId
      );
    } catch (dbError) {
      log(
        'ERROR',
        'DB',
        `Failed to update query status: ${dbError instanceof Error ? dbError.message : String(dbError)}`
      );
    }

    return NextResponse.json(
      { error: 'Query processing failed', details: errorMessage, queryId },
      { status: 500 }
    );
  }
}

// Helper functions extracted to @/lib/query-pipeline.ts:
// checkCryptoQuery, selectMethodology, getMethodologyPrompt, runGroundingGuard
