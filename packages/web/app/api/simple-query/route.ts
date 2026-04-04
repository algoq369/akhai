/**
 * Multi-provider query endpoint with methodology-specific provider routing
 * Routes each methodology to its optimal AI provider for best performance
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger, log } from '@/lib/logger';
import { withRetry } from '@/lib/retry';
import { checkRateLimit } from '@/lib/rate-limit';
import { checkCryptoQuery, getMethodologyPrompt, runGroundingGuard } from '@/lib/query-pipeline';
import { createQuery, updateQuery, trackUsage, addEvent } from '@/lib/database';
import { getUserFromSession } from '@/lib/auth';
import {
  getProviderForMethodology,
  validateProviderApiKey,
  getFallbackProvider,
  type CoreMethodology,
} from '@/lib/provider-selector';
import { callProvider } from '@/lib/multi-provider-api';
import { emitThought, formatDuration } from '@/lib/thought-stream';

// Extracted pipeline stages
import { visitURLs } from '@/lib/query-url-visitor';
import { runFusionPipeline, emitFusionEvents, applyFusionToPrompt } from '@/lib/query-fusion';
import { activateGnosticProtocols, runGnosticPostProcessing } from '@/lib/query-postprocess';
import {
  extractSideCanalTopics,
  buildResponseData,
  trackPostHogEvents,
  emitCompleteEvent,
  type ResponseBuilderInput,
} from '@/lib/query-response-builder';

export const dynamic = 'force-dynamic';

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

    // ========== URL VISITOR ==========
    const { urlContext, urlsFetched } = await visitURLs(query);

    // Log query start
    logger.query.start(query, methodology);

    // ========== INTELLIGENCE FUSION ==========
    const { fusionResult, sideCanalContext, selectedMethod, weights } = await runFusionPipeline(
      {
        query,
        methodology,
        layersWeights,
        instinctConfig,
        liveRefinements,
        grimoireContext,
        userId,
      },
      emitAndPersist,
      queryId,
      startTime
    );

    // Emit routing + layers events
    emitFusionEvents(
      fusionResult,
      selectedMethod,
      weights,
      methodology,
      emitAndPersist,
      queryId,
      startTime
    );

    // ========== GNOSTIC PRE-PROCESSING ==========
    const { metaCoreState, progressState } = activateGnosticProtocols(query, request);

    // Save query to database (with user_id)
    try {
      createQuery(queryId, query, selectedMethod.id, userId);
    } catch (dbError) {}

    // Check for crypto price queries (real-time data)
    const cryptoResult = await checkCryptoQuery(query, queryId, startTime);
    if (cryptoResult) {
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

    // ========== TOT ROUTE ==========
    if (selectedMethod.id === 'tot') {
      log('INFO', 'TOT', 'Routing to Tree of Thoughts consensus endpoint');

      try {
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

    // ========== PROVIDER SELECTION ==========
    const providerSpec = getProviderForMethodology(
      selectedMethod.id as CoreMethodology,
      legendMode
    );
    let selectedProvider = providerSpec.provider;

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

    log(
      'INFO',
      'PROVIDER',
      `Methodology: ${selectedMethod.id} → Provider: ${selectedProvider} (${providerSpec.model})`
    );
    log('INFO', 'PROVIDER', `Reasoning: ${providerSpec.reasoning}`);

    // Emit: AI reasoning
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

    if (sideCanalContext) {
      log('INFO', 'SIDE_CANAL', `Context injected: ${sideCanalContext.substring(0, 100)}...`);
    }

    // ========== BUILD MESSAGES ==========
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

    // ========== BUILD SYSTEM PROMPT ==========
    let systemPrompt = getMethodologyPrompt(selectedMethod.id, pageContext, legendMode);

    systemPrompt = `Current date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. Always use up-to-date context when discussing current events, trends, or future projections.\n\n${systemPrompt}`;

    // Auto web search for every query
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

    if (urlContext) {
      systemPrompt = `${systemPrompt}\n\n${urlContext}`;
      log('INFO', 'URL_FETCH', `URL context injected into system prompt`);
    }

    if (fusionResult) {
      systemPrompt = applyFusionToPrompt(systemPrompt, fusionResult, weights);
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

    // ========== CALL AI PROVIDER ==========
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

    // ========== GROUNDING GUARD ==========
    const guardResult = await runGroundingGuard(content, query);

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

    // ========== GNOSTIC POST-PROCESSING ==========
    const { processedContent, analysisMetadata } = runGnosticPostProcessing(
      content,
      metaCoreState,
      progressState,
      emitAndPersist,
      queryId,
      startTime
    );

    // ========== DATABASE + USAGE ==========
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
    trackUsage(selectedProvider, providerSpec.model, inputTokens, outputTokens, cost);
    logger.query.complete(queryId, latency, cost);

    // ========== SIDE CANAL TOPICS ==========
    const suggestions = await extractSideCanalTopics(queryId, query, content, userId, legendMode);

    // ========== BUILD & RETURN RESPONSE ==========
    const builderInput: ResponseBuilderInput = {
      queryId,
      query,
      selectedMethod,
      processedContent,
      content,
      selectedProvider,
      providerSpec,
      tokens,
      inputTokens,
      outputTokens,
      latency,
      cost,
      guardResult,
      sideCanalContext,
      urlsFetched,
      urlContext,
      analysisMetadata,
      fusionResult,
      weights,
      userId,
      legendMode,
      methodology,
    };

    const responseData = buildResponseData(builderInput, suggestions);
    log('INFO', 'SIDE_CANAL', `Response includes ${suggestions.length} suggestions`);

    trackPostHogEvents(builderInput, request);
    emitCompleteEvent(builderInput, emitAndPersist, startTime);

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
