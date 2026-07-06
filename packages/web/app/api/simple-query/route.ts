/**
 * Multi-provider query endpoint with methodology-specific provider routing
 * Routes each methodology to its optimal AI provider for best performance
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger, log } from '@/lib/logger';
import { withRetry } from '@/lib/retry';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  checkCryptoQuery,
  getMethodologyPrompt,
  runGroundingGuard,
  isLivePriceQuery,
} from '@/lib/query-pipeline';
import { createQuery, updateQuery, trackUsage } from '@/lib/database';
import { getUserFromSession } from '@/lib/auth';
import {
  getProviderForMethodology,
  validateProviderApiKey,
  getFallbackProvider,
  getFallbackModelSpec,
  type CoreMethodology,
  type ProviderFamily,
} from '@/lib/provider-selector';
import { callProvider, type CompletionResponse } from '@/lib/multi-provider-api';
import { maxTokensFor } from '@/lib/output-budgets';
import { cacheKey, getCached, setCached, isCacheable } from '@/lib/query-cache';
import { recordCall } from '@/lib/cogs-scorecard';
import { getProviderPricing } from '@/lib/provider-selector';
import { MODELS } from '@/lib/models';
import { runReactAgent } from '@/lib/react-agent';
import { runScMultipath, extractConsensus, SC_SAMPLES } from '@/lib/sc-multipath';
import { formatDuration } from '@/lib/thought-stream';

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
import { classifyContent } from '@/lib/mini-canvas/content-classifier';
import { QuerySchema, emitAndPersist } from './schema';
import { scoreGroundingAsync } from '@/lib/grounding-client';
import { shouldGround } from '@/lib/grounding-policy';
import { buildSourcesSection, citationCoverage } from '@/lib/citation-check';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let queryId: string = crypto.randomUUID().replace(/-/g, '').slice(0, 8);

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
      instinctMode,
      instinctConfig: rawInstinctConfig,
      liveRefinements,
      grimoireContext,
      queryId: clientQueryId,
      extendedThinking,
    } = parsed.data;
    // Merge instinctMode flag into instinctConfig.enabled
    const instinctConfig = rawInstinctConfig
      ? { ...rawInstinctConfig, enabled: instinctMode === true }
      : undefined;

    // Use client-provided queryId if available (enables live SSE), otherwise generate
    queryId = clientQueryId || crypto.randomUUID().replace(/-/g, '').slice(0, 8);

    // Emit: query received
    emitAndPersist(queryId, {
      id: `${queryId}-received`,
      queryId,
      stage: 'received',
      timestamp: Date.now() - startTime,
      data: `Analyzing your question about ${query.split(/\s+/).slice(0, 5).join(' ')}...`,
      details: {},
    });

    // ========== RESPONSE CACHE CHECK (WEBNA B5) ==========
    // A hit short-circuits ALL downstream work (URL visitor, fusion, LLM) — $0, instant.
    // urlContext isn't computed yet, so detect a URL in the raw query text directly. We only
    // consult the cache for time-invariant methodologies with no contextual signals: a wrong
    // cache hit is worse than a miss. Live-price crypto queries are excluded outright — they
    // must stay fresh, and a transient CoinGecko failure must never pin a stale price.
    const cacheable =
      isCacheable({
        methodology,
        // /i matches the URL fetcher's case-insensitive detection — 'Https://…' (mobile
        // autocapitalize) must not slip past the gate and cache a URL-conditioned answer
        hasUrlContext: /https?:\/\//i.test(query),
        hasLiveRefinements: !!liveRefinements?.length,
        hasGrimoire: !!grimoireContext,
        instinctMode: instinctMode === true,
        hasHistory: (conversationHistory?.length ?? 0) > 0,
      }) && !isLivePriceQuery(query);
    const key = cacheable
      ? cacheKey({ query, methodology, legendMode, extendedThinking, layersWeights, pageContext })
      : '';
    const serveCacheHit = (hit: unknown, methodologyLabel: string) => {
      const hitObj = hit as Record<string, unknown>;
      recordCall({
        queryId,
        purpose: `${methodologyLabel} answer [CACHE HIT]`,
        model: 'cache',
        inTok: 0,
        cacheRead: 0,
        cacheCreation: 0,
        outTok: 0,
        durationMs: Date.now() - startTime,
        costUSD: 0,
        outcome: 'ok',
        objectiveMet: true,
      });
      emitAndPersist(queryId, {
        id: `${queryId}-complete`,
        queryId,
        stage: 'complete',
        timestamp: Date.now() - startTime,
        data: `Cached · ${methodologyLabel} · ${formatDuration(Date.now() - startTime)}`,
        details: {
          methodology: {
            selected: String(hitObj.methodology ?? methodologyLabel),
            reason: 'Served from response cache',
          },
          model: 'cache',
          provider: 'cache',
          tokens: { input: 0, output: 0, total: 0 },
          cost: 0,
          duration: Date.now() - startTime,
        },
      });
      log('INFO', 'CACHE', `Cache hit for ${methodologyLabel} query — served $0, instant`);
      return NextResponse.json({ ...(hit as object), cached: true });
    };
    if (cacheable) {
      const hit = getCached(key);
      if (hit) return serveCacheHit(hit, methodology);
    }
    // Populate key for the end of the request — the resolved-methodology check below may
    // upgrade this from '' when 'auto' resolves to a cacheable methodology.
    let effectiveCacheKey = cacheable ? key : '';

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

    // ========== RESPONSE CACHE — RESOLVED-METHODOLOGY CHECK (R2) ==========
    // 'auto' can't be cache-checked pre-fusion (final methodology unknown). Now that fusion has
    // resolved it deterministically, re-check under the RESOLVED methodology key — auto traffic
    // shares entries with explicit-methodology queries. History-driven resolution differences only
    // produce safe misses (different key), never wrong hits.
    if (!cacheable && methodology === 'auto') {
      const resolvedCacheable =
        // tot: now also excluded from CACHEABLE_METHODOLOGIES (only degraded consensus-failure
        // fallbacks could ever be stored under a '|tot|' key) — kept here as defense in depth.
        selectedMethod.id !== 'tot' &&
        isCacheable({
          // belt: a FAILED URL fetch (urlContext '') must not make a URL query cacheable
          hasUrlContext: !!urlContext || /https?:\/\//i.test(query),
          methodology: selectedMethod.id,
          hasLiveRefinements: !!liveRefinements?.length,
          hasGrimoire: !!grimoireContext,
          instinctMode: instinctMode === true,
          hasHistory: (conversationHistory?.length ?? 0) > 0,
        }) &&
        !isLivePriceQuery(query) &&
        // sideCanalContext is per-user topic steering injected into the messages — a user-free
        // key must never store or serve a steered answer. Post-fusion the real value is known.
        !sideCanalContext;
      if (resolvedCacheable) {
        effectiveCacheKey = cacheKey({
          query,
          methodology: selectedMethod.id,
          legendMode,
          extendedThinking,
          layersWeights,
          pageContext,
        });
        const hit = getCached(effectiveCacheKey);
        if (hit) return serveCacheHit(hit, selectedMethod.id);
      }
    }

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
    let usedModel = providerSpec.model;
    const originalProvider = selectedProvider;

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
      `Methodology: ${selectedMethod.id} → Provider: ${selectedProvider} (${usedModel})`
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
        narrative: `${metaCoreState?.humanIntention || 'Analyzing query intent'}. Approaching via ${selectedMethod.id} — ${providerSpec.reasoning || selectedProvider + ' selected for optimal response quality'}.`,
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
    // Gap-A: systemPrompt is the STABLE cached prefix (~9KB methodology block). Do NOT mutate it —
    // all per-query content goes into dynamicContext, which travels AFTER the cache breakpoint.
    // pageContext is volatile per-message content (last-5 messages / DOM scrape incl. live ticker):
    // baked into the prefix it defeats the prompt cache for ALL browser traffic — it rides the
    // dynamic block instead (step 6 below), same wording, position preserved at the prompt's end.
    let systemPrompt = getMethodologyPrompt(selectedMethod.id, undefined, legendMode);

    const dynamicParts: string[] = [];

    // 1. Current date
    dynamicParts.push(
      `Current date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. Always use up-to-date context when discussing current events, trends, or future projections.`
    );

    // 2. Auto web search for every query
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
          dynamicParts.push('Live web context (searched as of today):\n' + webContext);
          log('INFO', 'SEARCH', 'Auto-search: ' + results.length + ' results injected');
        }
      }
    } catch (e) {
      log('WARN', 'SEARCH', 'Auto-search failed: ' + (e as Error).message);
    }

    // 3. URL context
    if (urlContext) {
      dynamicParts.push(urlContext);
      log('INFO', 'URL_FETCH', `URL context injected into dynamic context`);
    }

    // 4. Fusion enhancement (preserves FUSION logging) — applied to the dynamic section, not the cached prefix.
    let dynamicContext = dynamicParts.filter(Boolean).join('\n\n');
    if (fusionResult) {
      dynamicContext = applyFusionToPrompt(dynamicContext, fusionResult, weights);
    }

    // 5. Extended-thinking directive — now AFTER the methodology block (in the dynamic section).
    if (extendedThinking) {
      dynamicContext = `${dynamicContext}\n\nWhen reasoning internally, think thoroughly — consider multiple angles, surface your genuine considerations, articulate doubts and trade-offs you are weighing, note what you are rejecting and why. Your internal reasoning should feel like authentic reflection, not summary. Take the time to examine the question from multiple lenses before answering.`;
    }

    // 6. Page context — LAST, mirroring its original position at the end of the prompt (E7/D2).
    // Same wording as getMethodologyPrompt's contextSection; only its POSITION moved from the
    // cached prefix to the dynamic block.
    if (pageContext) {
      dynamicContext = `${dynamicContext}\n\n**CURRENT PAGE CONTEXT:**\nThe user is currently viewing or working with the following content:\n${pageContext}\n\nWhen the user asks about "this", "it", "the subject", or refers to something without specifying, they are likely referring to the content above. Use this context to understand their queries and provide relevant responses.`;
    }

    // Emit: calling (pre-API — no model shown, just progress indicator)
    emitAndPersist(queryId, {
      id: `${queryId}-calling`,
      queryId,
      stage: 'calling',
      timestamp: Date.now() - startTime,
      data: `Connecting to AI provider...`,
      details: {
        methodology: { selected: selectedMethod.id, reason: selectedMethod.reason || '' },
      },
    });

    // ========== CALL AI PROVIDER ==========
    logger.query.apiCall(selectedProvider.toUpperCase(), usedModel);
    log('INFO', 'API', `Calling ${selectedProvider} API with model: ${usedModel}`);

    let apiResponse: CompletionResponse | undefined;
    let reactSources: string[] = [];
    const thinkingCb =
      extendedThinking && selectedProvider === 'anthropic'
        ? (chunk: string) => {
            emitAndPersist(queryId, {
              id: `${queryId}-td-${Date.now()}-${crypto.randomUUID().replace(/-/g, '').slice(0, 5)}`,
              queryId,
              stage: 'reasoning',
              timestamp: Date.now() - startTime,
              data: chunk,
              details: {
                narrative: chunk,
                reasoning: {
                  intent: 'extended_thinking',
                  approach: 'opus',
                  reflectionMode: 'thinking',
                  ascentLevel: 0,
                  providerReason: '',
                },
              },
            });
          }
        : undefined;

    try {
      // E5 FLIP (2026-07-05): the live agent is now the DEFAULT for react — proven over 5 weeks:
      // real searches with per-step streaming (D4, user-verified), citations + Sources (E1.3),
      // honest outage degradation (real Brave-429 test), full cost recording (COGS). Escape hatch:
      // REACT_AGENT_LIVE=0 restores the knowledge-recall prompt instantly (PM2 env + restart).
      // Search quota (Brave 2k/mo free) rides the Aug-8 hosting/SearXNG decision.
      if (selectedMethod.id === 'react' && process.env.REACT_AGENT_LIVE !== '0') {
        // Live ReAct agent (S2.2) — feature-gated, default OFF. Flag-off keeps prod byte-identical.
        emitAndPersist(queryId, {
          id: `${queryId}-react-agent`,
          queryId,
          stage: 'reasoning',
          timestamp: Date.now() - startTime,
          data: 'Running live web-search agent…',
          details: {
            methodology: { selected: selectedMethod.id, reason: selectedMethod.reason || '' },
          },
        });
        const agent = await runReactAgent(query, undefined, (e) => {
          // Model/web-controlled strings are truncated at display; the feed is a one-liner.
          const titles = (e.topTitles ?? []).map((t) => t.slice(0, 80)).join(' · ');
          const text =
            e.kind === 'search'
              ? `Step ${e.step} — searching: “${(e.query ?? '').slice(0, 120)}”`
              : e.kind === 'results'
                ? e.count === 0
                  ? e.unavailable
                    ? `Step ${e.step} — search unavailable`
                    : `Step ${e.step} — no results, refining…`
                  : `Step ${e.step} — found ${e.count} result${e.count === 1 ? '' : 's'}${titles ? `: ${titles}` : ''}`
                : `Step ${e.step} — composing grounded answer…`;
          emitAndPersist(queryId, {
            // random suffix like the thinking emitter — parallel same-kind events share a millisecond
            id: `${queryId}-react-step-${e.step}-${e.kind}-${Date.now()}-${crypto.randomUUID().replace(/-/g, '').slice(0, 5)}`,
            queryId,
            stage: 'reasoning',
            timestamp: Date.now() - startTime,
            data: text,
            details: {
              methodology: { selected: selectedMethod.id, reason: selectedMethod.reason || '' },
            },
          });
        });
        if (!agent.text?.trim()) throw new Error('REACT_AGENT_NO_CONTENT');
        reactSources = agent.sources.map((s) => `${s.title}. ${s.snippet}`.trim());
        // E1.3 citation enforcement: coverage on the RAW answer (before appending the Sources list),
        // then surface the real retrieved URLs in the answer itself.
        const coverage = citationCoverage(agent.text, agent.sources);
        const withSources = agent.text + buildSourcesSection(agent.sources);
        emitAndPersist(queryId, {
          id: `${queryId}-citations`,
          queryId,
          stage: 'reasoning',
          timestamp: Date.now() - startTime,
          data: `Citations: ${coverage.referenced}/${coverage.total} sources reflected`,
          details: {
            methodology: { selected: selectedMethod.id, reason: selectedMethod.reason || '' },
          },
        });
        // Real economics for the agent path: it bypasses callProvider, so price its usage here
        // (F1 model-aware rates) and record the COGS row — otherwise react runs show $0 (free)
        // for real Opus tokens and the scorecard is blind to the whole path.
        const reactPricing = getProviderPricing('anthropic', MODELS.premium);
        const reactCost =
          (agent.usage.inputTokens * reactPricing.input +
            agent.usage.outputTokens * reactPricing.output) /
          1000;
        recordCall({
          queryId,
          purpose: 'react agent answer',
          model: MODELS.premium,
          inTok: agent.usage.inputTokens,
          cacheRead: 0,
          cacheCreation: 0,
          outTok: agent.usage.outputTokens,
          durationMs: Date.now() - startTime,
          costUSD: reactCost,
          outcome: 'ok',
          objectiveMet: true,
        });
        apiResponse = {
          content: withSources,
          usage: { ...agent.usage, cacheRead: 0, cacheCreation: 0 },
          cost: reactCost,
          model: usedModel,
          provider: selectedProvider,
          latencyMs: Date.now() - startTime,
        };
      } else if (
        selectedMethod.id === 'sc' &&
        process.env.SC_MULTIPATH === '1' &&
        !extendedThinking // v1: thinking keeps the existing single-pass path (16k override)
      ) {
        // Genuine N-sample self-consistency (D3a) — feature-gated, default OFF. Flag-off keeps
        // prod byte-identical. Sample 1 runs alone (writes the shared prompt-cache prefix), the
        // rest run in parallel as cache reads. Consistency = measured cross-sample agreement,
        // NOT correctness; null when fewer than 2 paths survive.
        emitAndPersist(queryId, {
          id: `${queryId}-sc-multipath`,
          queryId,
          stage: 'reasoning',
          timestamp: Date.now() - startTime,
          data: `Sampling ${SC_SAMPLES} independent reasoning paths…`,
          details: {
            methodology: { selected: selectedMethod.id, reason: selectedMethod.reason || '' },
          },
        });
        const mp = await runScMultipath(
          // Each sample gets one transient-error re-roll (retry parity with the single-pass
          // path, scaled down since the samples are already 3-way redundant).
          (temperature) =>
            withRetry(
              async () => {
                const r = await callProvider(selectedProvider, {
                  messages: messages,
                  systemPrompt: systemPrompt,
                  dynamicContext: dynamicContext,
                  model: usedModel,
                  maxTokens: maxTokensFor('sc'),
                  temperature,
                  purpose: 'sc answer [multipath sample]',
                  queryId,
                });
                // Empty/whitespace content is retryable — same re-roll trick as single-pass.
                if (!r.content || !r.content.trim()) throw new Error('SC_EMPTY_SAMPLE 529');
                return {
                  fullText: r.content,
                  consensus: extractConsensus(r.content),
                  usage: r.usage,
                  cost: r.cost,
                };
              },
              {
                maxAttempts: 2,
                baseDelay: 1000,
                shouldRetry: (err) => {
                  const msg = err.message?.toLowerCase() || '';
                  if (
                    msg.includes('credit') ||
                    msg.includes('unauthorized') ||
                    msg.includes('invalid_api_key') ||
                    msg.includes('insufficient')
                  )
                    return false;
                  return (
                    msg.includes('rate') ||
                    msg.includes('timeout') ||
                    msg.includes('503') ||
                    msg.includes('529')
                  );
                },
              }
            ),
          (i, n) =>
            emitAndPersist(queryId, {
              id: `${queryId}-sc-path-${i}`,
              queryId,
              stage: 'reasoning',
              timestamp: Date.now() - startTime,
              data: `Path ${i}/${n}…`,
              details: {
                methodology: { selected: selectedMethod.id, reason: selectedMethod.reason || '' },
              },
            })
        );
        emitAndPersist(queryId, {
          id: `${queryId}-sc-consistency`,
          queryId,
          stage: 'reasoning',
          timestamp: Date.now() - startTime,
          data:
            mp.consistency === null
              ? 'Self-consistency: single path (consistency unavailable)'
              : `Self-consistency: ${(mp.consistency * 100).toFixed(0)}% agreement across ${mp.samplesUsed} independent paths`,
          details: {
            methodology: { selected: selectedMethod.id, reason: selectedMethod.reason || '' },
          },
        });
        apiResponse = {
          content: mp.content,
          usage: { ...mp.usage, cacheRead: 0, cacheCreation: 0 },
          cost: mp.cost,
          model: usedModel,
          provider: selectedProvider,
          latencyMs: Date.now() - startTime,
        };
      } else {
      apiResponse = await withRetry(
        async () => {
          const r = await callProvider(selectedProvider, {
            messages: messages,
            systemPrompt: systemPrompt,
            dynamicContext: dynamicContext,
            model: usedModel,
            maxTokens: maxTokensFor(selectedMethod.id),
            temperature: 0.7,
            extendedThinking:
              extendedThinking && selectedProvider === 'anthropic' ? true : undefined,
            onThinkingDelta: thinkingCb,
            purpose: `${selectedMethod.id} answer`,
            queryId,
          });
          // WEBNA R3: empty/whitespace content is retryable (re-roll same provider)
          if (!r.content || !r.content.trim()) throw new Error('PROVIDER_NO_CONTENT 529');
          return r;
        },
        {
          maxAttempts: 3,
          baseDelay: 1000,
          shouldRetry: (err) => {
            const msg = err.message?.toLowerCase() || '';
            // Don't retry on auth/credit errors — fall through to fallback
            if (
              msg.includes('credit') ||
              msg.includes('unauthorized') ||
              msg.includes('invalid_api_key') ||
              msg.includes('insufficient')
            )
              return false;
            // Retry on transient errors
            return (
              msg.includes('rate') ||
              msg.includes('timeout') ||
              msg.includes('503') ||
              msg.includes('529')
            );
          },
        }
      );
      }
    } catch (apiError: any) {
      logger.query.apiError(selectedProvider.toUpperCase(), apiError.message);
      log('ERROR', 'API', `Provider ${selectedProvider} failed: ${apiError.message}`);

      // Try ALL remaining providers in fallback chain
      const allProviders: ProviderFamily[] = [
        'anthropic',
        'openrouter',
        'groq',
        'google',
        'deepseek',
        'mistral',
        'xai',
      ];
      const triedProviders = new Set([selectedProvider]);
      let fallbackSucceeded = false;

      for (const fallbackProvider of allProviders) {
        if (triedProviders.has(fallbackProvider)) continue;
        if (!validateProviderApiKey(fallbackProvider)) continue;

        triedProviders.add(fallbackProvider);
        log('INFO', 'API', `Trying fallback provider: ${fallbackProvider}`);

        try {
          const fallbackModelSpec = getFallbackModelSpec(fallbackProvider);
          apiResponse = await withRetry(
            () =>
              callProvider(fallbackProvider, {
                messages: messages,
                systemPrompt: systemPrompt,
                dynamicContext: dynamicContext,
                model: fallbackModelSpec.model,
                maxTokens: maxTokensFor(selectedMethod.id),
                temperature: 0.7,
              }),
            { maxAttempts: 1, baseDelay: 500 }
          );
          selectedProvider = fallbackProvider;
          usedModel = fallbackModelSpec.model;
          log('INFO', 'API', `Fallback provider ${fallbackProvider} succeeded`);
          fallbackSucceeded = true;
          break;
        } catch (fbError: any) {
          log('WARN', 'API', `Fallback ${fallbackProvider} also failed: ${fbError.message}`);
          continue;
        }
      }

      if (!fallbackSucceeded) {
        const creditKeywords = ['credit', 'balance', 'insufficient', 'billing'];
        const isCredit = creditKeywords.some((k) => apiError.message?.toLowerCase().includes(k));
        return NextResponse.json(
          {
            error: isCredit
              ? 'API credits exhausted. Please check your provider billing.'
              : `All AI providers failed. Last error: ${apiError.message}`,
          },
          { status: 500 }
        );
      }
    }

    // Emit: generating — now with ACTUAL provider that succeeded
    emitAndPersist(queryId, {
      id: `${queryId}-generating`,
      queryId,
      stage: 'generating',
      timestamp: Date.now() - startTime,
      data: `Generating with ${usedModel} via ${selectedProvider}...`,
      details: {
        model: usedModel,
        provider: selectedProvider,
        methodology: { selected: selectedMethod.id, reason: selectedMethod.reason || '' },
      },
    });

    const content = apiResponse!.content;
    const rawThinking = apiResponse!.rawThinking || null;
    const inputTokens = apiResponse!.usage.inputTokens;
    const outputTokens = apiResponse!.usage.outputTokens;
    const tokens = apiResponse!.usage.totalTokens;
    const latency = Date.now() - startTime;
    const cost = apiResponse!.cost;

    logger.query.apiResponse(selectedProvider.toUpperCase(), tokens, latency);
    log('INFO', 'API', `Response received: ${tokens} tokens, ${latency}ms, $${cost.toFixed(6)}`);

    // ========== EXTENDED THINKING SSE ==========
    if (rawThinking) {
      log('INFO', 'THINKING', `Extended thinking: ${rawThinking.length} chars streamed`);
      // Thinking deltas already emitted live via onThinkingDelta callback — just emit completion marker
      emitAndPersist(queryId, {
        id: `${queryId}-thinking-complete`,
        queryId,
        stage: 'reasoning',
        timestamp: Date.now() - startTime,
        data: '__thinking_complete__',
        details: {
          reasoning: {
            intent: 'thinking_complete',
            approach: 'opus',
            reflectionMode: 'thinking',
            ascentLevel: 0,
            providerReason: '',
          },
        },
      });
    }

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
        narrative:
          guardResult && !guardResult.passed
            ? `Sovereign Guard flagged concerns: ${guardResult.issues?.join(', ') || 'minor issues detected'}. Proceeding with caution.`
            : `Sovereign Guard verified response integrity. All checks passed — response is grounded.`,
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
        raw_thinking: rawThinking,
      },
      userId
    );
    trackUsage(selectedProvider, usedModel, inputTokens, outputTokens, cost);
    logger.query.complete(queryId, latency, cost);

    // ========== EMIT COMPLETE STAGE (enables MetadataStrip summary phase) ==========
    emitAndPersist(queryId, {
      id: `${queryId}-complete`,
      queryId,
      stage: 'complete',
      timestamp: Date.now() - startTime,
      data: `Done · ${selectedMethod.id} · ${formatDuration(latency)}`,
      details: {
        methodology: {
          selected: selectedMethod.id,
          reason: selectedMethod.reason || 'Engine selection',
        },
        model: usedModel,
        provider: selectedProvider,
        tokens: { input: inputTokens, output: outputTokens, total: tokens },
        cost,
        duration: latency,
      },
    });

    // ========== ASYNC GROUNDING (V6 Block 3 — context arrives with Block 4 tools) ==========
    // Selective grounding (gap-D): the grounding lens only applies to fact-reporting query types.
    // For generative/subjective types (creative, planning) the answer is SUPPOSED to diverge from
    // sources, so a grounding score would be a misleading false alarm — skip it and emit no row.
    // Conservative default: with no classification, keep grounding (under-grounding is worse).
    if (!fusionResult || shouldGround(fusionResult.analysis.queryType)) {
      scoreGroundingAsync(queryId, emitAndPersist, content, reactSources, startTime);
    }

    // ========== MINI CANVAS CLASSIFICATION ==========
    const miniCanvas = classifyContent(content, query);

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
      providerSpec: {
        ...providerSpec,
        model: usedModel,
        reasoning:
          originalProvider === selectedProvider
            ? providerSpec.reasoning || 'Selected by engine'
            : `Fallback from ${originalProvider} to ${selectedProvider} (${usedModel})`,
      },
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
    responseData.miniCanvas = miniCanvas;
    if (instinctMode) responseData.instinctMode = true;
    log('INFO', 'SIDE_CANAL', `Response includes ${suggestions.length} suggestions`);

    trackPostHogEvents(builderInput, request);
    emitCompleteEvent(builderInput, emitAndPersist, startTime);

    // ========== RESPONSE CACHE POPULATE (WEBNA B5) ==========
    // Store the exact object we return so the next identical query replays it faithfully.
    // The hit path adds `cached: true`; the stored object itself stays clean. Steered answers
    // (per-user side-canal context in the messages) never enter the user-free cache.
    // sideCanal.suggestions come from getSuggestions(topicIds, userId) — per-user topic-graph
    // output must never enter a user-free cache entry. Matches the tot route's empty shape.
    // gnostic.progressState is per-session ascent telemetry (trackAscent via x-session-id) —
    // stripped for the same reason; layerAnalysis is a pure function of the query and stays.
    if (effectiveCacheKey && !sideCanalContext)
      setCached(effectiveCacheKey, {
        ...responseData,
        sideCanal: { contextInjected: false, suggestions: [] },
        gnostic: responseData.gnostic
          ? { ...responseData.gnostic, progressState: undefined }
          : responseData.gnostic,
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
