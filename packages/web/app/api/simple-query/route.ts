/**
 * Multi-provider query endpoint with methodology-specific provider routing
 * Routes each methodology to its optimal AI provider for best performance
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger, log } from '@/lib/logger'
import { createQuery, updateQuery, trackUsage, addEvent } from '@/lib/database'
import { getUserFromSession } from '@/lib/auth'
import { getContextForQuery } from '@/lib/side-canal'
import { getProviderForMethodology, validateProviderApiKey, getFallbackProvider, type CoreMethodology } from '@/lib/provider-selector'
import { callProvider, isProviderAvailable } from '@/lib/multi-provider-api'
import { trackServerQuerySubmitted, trackServerGuardTriggered, getAnonymousDistinctId } from '@/lib/posthog-events'

// ============================================================================
// INTELLIGENCE FUSION LAYER - Unified AI orchestration
// ============================================================================
import { fuseIntelligence, generateEnhancedSystemPrompt, type IntelligenceFusionResult } from '@/lib/intelligence-fusion'
import { createAutoInstinctConfig } from '@/lib/instinct-mode'

// ============================================================================
// URL VISITOR SYSTEM - Fetch content from links shared by user
// ============================================================================
import { hasURLs, detectURLs } from '@/lib/url-detector'
import { fetchMultipleURLs, buildURLContext } from '@/lib/url-content-fetcher'

// ============================================================================
// GNOSTIC SOVEREIGN INTELLIGENCE PROTOCOLS
// ============================================================================
import { activateMetaCore, checkSovereignty, addSovereigntyMarkers, generateSovereigntyFooter, getMetaCoreMetadata } from '@/lib/meta-core-protocol'
import { detectAntipattern, purifyResponse } from '@/lib/antipattern-guard'
import { trackAscent, suggestElevation, Layer, LAYER_METADATA } from '@/lib/layer-registry'
import { analyzeLayerContent, getLayerActivationSummary } from '@/lib/layer-mapper'
import { emitThought, formatDuration } from '@/lib/thought-stream'

/** Emit thought to SSE AND persist to DB for history replay */
function emitAndPersist(queryId: string, event: import('@/lib/thought-stream').ThoughtEvent) {
  emitThought(queryId, event)
  try {
    addEvent(queryId, `pipeline:${event.stage}`, {
      id: event.id,
      stage: event.stage,
      timestamp: event.timestamp,
      data: event.data,
      details: event.details || null,
    })
  } catch (e) {
    // DB write failure is non-critical — SSE already delivered
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let queryId: string = Math.random().toString(36).slice(2, 10)


  try {

    // Get user from session (optional - allows anonymous usage)
    const token = request.cookies.get('session_token')?.value
    const user = token ? getUserFromSession(token) : null
    const userId = user?.id || null



    const { query, methodology = 'auto', conversationHistory = [], pageContext, legendMode = false, layersWeights, instinctConfig, liveRefinements, queryId: clientQueryId } = await request.json()

    // Use client-provided queryId if available (enables live SSE), otherwise generate
    queryId = clientQueryId || Math.random().toString(36).slice(2, 10)



    if (!query || typeof query !== 'string') {
      logger.query.apiError('VALIDATION', 'Query is required')
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Emit: query received
    emitAndPersist(queryId, {
      id: `${queryId}-received`,
      queryId,
      stage: 'received',
      timestamp: Date.now() - startTime,
      data: `query: "${query.slice(0, 50)}${query.length > 50 ? '...' : ''}"`,
      details: {},
    })

    // ============================================================================
    // URL VISITOR SYSTEM - Detect and fetch content from shared links
    // ============================================================================
    let urlContext = ''
    let urlsFetched: { url: string; type: string; success: boolean; title?: string }[] = []

    if (hasURLs(query)) {
      const detectedURLs = detectURLs(query)
      log('INFO', 'URL_FETCH', `Detected ${detectedURLs.length} URLs in query`)

      try {
        const fetchedContents = await fetchMultipleURLs(
          detectedURLs.map(d => d.url),
          3 // Max 3 URLs per query
        )

        urlsFetched = fetchedContents.map(c => ({
          url: c.url,
          type: c.type,
          success: c.success,
          title: c.title,
        }))

        const successCount = fetchedContents.filter(c => c.success).length
        log('INFO', 'URL_FETCH', `Successfully fetched ${successCount}/${detectedURLs.length} URLs`)

        // Build context from fetched content
        urlContext = buildURLContext(fetchedContents)

        if (urlContext) {
          log('INFO', 'URL_FETCH', `URL context built: ${urlContext.length} chars`)
        }
      } catch (urlError) {
        log('WARN', 'URL_FETCH', `URL fetching failed: ${urlError}`)
      }
    }

    // Log query start
    logger.query.start(query, methodology)

    // ============================================================================
    // INTELLIGENCE FUSION LAYER - Unified AI orchestration
    // ============================================================================
    let fusionResult: IntelligenceFusionResult | null = null
    
    // Default Layers weights if not provided by client
    const defaultWeights: Record<number, number> = {
      1: 0.5, 2: 0.5, 3: 0.5, 4: 0.5, 5: 0.5,
      6: 0.5, 7: 0.5, 8: 0.5, 9: 0.5, 10: 0.5, 11: 0.5
    }
    const weights = layersWeights || defaultWeights
    
    // Get Side Canal context for fusion
    let sideCanalContext: string | null = null
    try {
      sideCanalContext = getContextForQuery(query, userId)
    } catch (error) {
      log('WARN', 'SIDE_CANAL', `Context fetch failed: ${error}`)
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
      })
    }

    // Merge live refinements into Side Canal context
    if (liveRefinements && Array.isArray(liveRefinements) && liveRefinements.length > 0) {
      const refinementText = liveRefinements.map((r: { type: string; text: string }) => `- [${r.type}] ${r.text}`).join('\n')
      const refinementContext = '\n\n[User Live Refinements — adjust response accordingly]:\n' + refinementText
      sideCanalContext = sideCanalContext ? sideCanalContext + refinementContext : refinementContext
      log('INFO', 'SIDE_CANAL', `Injected ${liveRefinements.length} live refinements`)

      emitAndPersist(queryId, {
        id: `${queryId}-refinements`,
        queryId,
        stage: 'refinements',
        timestamp: Date.now() - startTime,
        data: `${liveRefinements.length} active`,
        details: {
          refinementCount: liveRefinements.length,
        },
      })
    }
    
    try {
      // Create instinct config (auto-detect lenses from query)
      const effectiveInstinctConfig = instinctConfig || createAutoInstinctConfig(query, 0.5, weights)
      
      // Run Intelligence Fusion
      fusionResult = await fuseIntelligence(
        query,
        weights,
        effectiveInstinctConfig,
        { contextInjection: sideCanalContext, relatedTopics: [] }
      )
      
      log('INFO', 'FUSION', `Methodology: ${fusionResult.selectedMethodology} (${Math.round(fusionResult.confidence * 100)}% confidence)`)
      log('INFO', 'FUSION', `Dominant Layers: ${fusionResult.dominantLayers.map(s => LAYER_METADATA[s]?.aiName).join(', ') || 'None'}`)
      log('INFO', 'FUSION', `Guard: ${fusionResult.guardRecommendation} | Thinking Budget: ${fusionResult.extendedThinkingBudget}`)
      log('INFO', 'FUSION', `Processing time: ${fusionResult.processingTimeMs}ms`)
    } catch (fusionError) {
      log('WARN', 'FUSION', `Intelligence fusion failed: ${fusionError}`)
      fusionResult = null
    }

    // Methodology selection - use fusion result if available, fallback to legacy
    const selectedMethod = fusionResult && methodology === 'auto'
      ? { id: fusionResult.selectedMethodology, reason: `Fusion: ${fusionResult.methodologyScores[0]?.reasons.join(', ') || 'Auto-selected'}` }
      : selectMethodology(query, methodology)

    // Emit: routing decision (with rich fusion data)
    emitAndPersist(queryId, {
      id: `${queryId}-routing`,
      queryId,
      stage: 'routing',
      timestamp: Date.now() - startTime,
      data: `${selectedMethod.id} ${fusionResult ? Math.round(fusionResult.confidence * 100) + '%' : ''}`,
      details: {
        methodology: {
          selected: selectedMethod.id,
          reason: selectedMethod.reason || (methodology !== 'auto' ? `user selected ${selectedMethod.id}` : 'auto-detected'),
          candidates: fusionResult?.methodologyScores?.slice(0, 3).map((s: any) => s.methodology) || [],
        },
        confidence: fusionResult ? fusionResult.confidence : undefined,
        // Rich fusion reasoning
        queryAnalysis: fusionResult ? {
          complexity: fusionResult.analysis.complexity,
          queryType: fusionResult.analysis.queryType,
          keywords: fusionResult.analysis.keywords.slice(0, 8),
          requiresTools: fusionResult.analysis.requiresTools,
          requiresMultiPerspective: fusionResult.analysis.requiresMultiPerspective,
          isMathematical: fusionResult.analysis.isMathematical,
          isCreative: fusionResult.analysis.isCreative,
        } : undefined,
        methodologyScores: fusionResult?.methodologyScores?.slice(0, 4).map((s: any) => ({
          methodology: s.methodology,
          score: Math.round(s.score * 100),
          reasons: s.reasons,
        })) || [],
        guardReasons: fusionResult?.guardReasons || [],
        processingMode: fusionResult?.processingMode,
        activeLenses: fusionResult?.activeLenses || [],
      },
    })

    // Emit: layer activations (with keywords + path activations)
    if (fusionResult) {
      const dominant = fusionResult.dominantLayers[0]
      const dominantName = dominant ? LAYER_METADATA[dominant]?.aiName || 'unknown' : 'none'
      // Build structured layer map from weights + fusion activations
      const layerDetails: Record<number, { name: string; weight: number; activated: boolean; keywords: string[] }> = {}
      for (const [key, val] of Object.entries(weights)) {
        const num = Number(key) as Layer
        const meta = LAYER_METADATA[num]
        if (meta) {
          const activation = fusionResult.layerActivations.find((a: any) => a.layerNode === num)
          layerDetails[num] = {
            name: meta.aiName,
            weight: activation ? Math.round(activation.effectiveWeight * 100) : Math.round((val as number) * 100),
            activated: fusionResult.dominantLayers.includes(num),
            keywords: activation?.keywords?.slice(0, 4) || [],
          }
        }
      }
      // Build path activations
      const pathActs = fusionResult.pathActivations?.slice(0, 5).map((p: any) => ({
        from: LAYER_METADATA[p.from as Layer]?.aiName || String(p.from),
        to: LAYER_METADATA[p.to as Layer]?.aiName || String(p.to),
        weight: Math.round(p.weight * 100),
        description: p.description,
      })) || []
      
      emitAndPersist(queryId, {
        id: `${queryId}-layers`,
        queryId,
        stage: 'layers',
        timestamp: Date.now() - startTime,
        data: `dominant: ${dominantName}`,
        details: {
          layers: layerDetails,
          dominantLayer: dominantName,
          pathActivations: pathActs,
        },
      })
    }


    // ============================================================================
    // GNOSTIC PRE-PROCESSING: Activate Protocols Before AI Call
    // ============================================================================
    let metaCoreState, progressState, analysisSessionId

    try {
      // Get session ID from headers or cookies
      analysisSessionId = request.headers.get('x-session-id') ||
                         request.cookies.get('akhai_session_id')?.value ||
                         'anonymous'

      // META_CORE PROTOCOL - Activate self-awareness
      metaCoreState = activateMetaCore(query)
      log('INFO', 'META_CORE', `Intent: ${metaCoreState.humanIntention}`)
      log('INFO', 'META_CORE', `Boundary: ${metaCoreState.sovereignBoundary}`)
      log('INFO', 'META_CORE', `Reflection Mode: ${metaCoreState.reflectionMode}`)
      log('INFO', 'META_CORE', `Ascent Level: ${metaCoreState.ascentLevel}/10`)

      // ASCENT TRACKER - Track user journey
      progressState = trackAscent(analysisSessionId, query)
      log('INFO', 'ASCENT', `Level: ${LAYER_METADATA[progressState.currentLevel].aiName} (${progressState.currentLevel}/10)`)
      log('INFO', 'ASCENT', `Velocity: ${progressState.ascentVelocity.toFixed(2)} levels/query`)

      if (progressState.ascentVelocity > 2.0) {
        log('INFO', 'ASCENT', `⚡ Quantum leap detected! User ascending rapidly`)
      }
    } catch (gnosticError) {
      // Don't fail the request if Gnostic protocols fail
      log('WARN', 'GNOSTIC', `Protocol initialization failed: ${gnosticError}`)
      metaCoreState = null
      progressState = null
    }

    // Save query to database (with user_id)
    try {
      createQuery(queryId, query, selectedMethod.id, userId)
    } catch (dbError) {
    }

    // Check for crypto price queries (real-time data)
    const cryptoResult = await checkCryptoQuery(query, queryId, startTime)
    if (cryptoResult) {
      // Update database for crypto query
      updateQuery(queryId, {
        status: 'complete',
        result: JSON.stringify({ finalAnswer: cryptoResult.response }),
        tokens_used: cryptoResult.metrics.tokens || 0,
        cost: cryptoResult.metrics.cost || 0,
      }, userId)
      return NextResponse.json({ ...cryptoResult, queryId })
    }

    // ========================
    // GTP Multi-AI Consensus Route
    // ========================
    if (selectedMethod.id === 'gtp') {
      log('INFO', 'GTP', 'Routing to multi-AI consensus endpoint')
      
      try {
        // Call the GTP consensus endpoint internally
        const gtpResponse = await fetch(new URL('/api/gtp-consensus', request.url).toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, conversationHistory }),
        })
        
        if (!gtpResponse.ok) {
          const errorData = await gtpResponse.json()
          throw new Error(errorData.error || 'GTP consensus failed')
        }
        
        const gtpResult = await gtpResponse.json()
        
        // Update database
        updateQuery(queryId, {
          status: 'complete',
          result: JSON.stringify({ finalAnswer: gtpResult.response }),
          tokens_used: gtpResult.metrics?.tokens || 0,
          cost: gtpResult.metrics?.cost || 0,
        }, userId)
        
        // Run Grounding Guard on the final response
        const guardResult = await runGroundingGuard(gtpResult.response, query)
        
        return NextResponse.json({
          ...gtpResult,
          id: queryId,
          queryId,
          guardResult,
          sideCanal: { contextInjected: false, suggestions: [] },
        })
      } catch (gtpError: any) {
        log('ERROR', 'GTP', `Multi-AI consensus failed: ${gtpError.message}, falling back to Claude`)
        // Fall through to standard Claude processing
      }
    }

    // Select provider based on methodology
    const providerSpec = getProviderForMethodology(selectedMethod.id as CoreMethodology, legendMode)
    let selectedProvider = providerSpec.provider

    // Validate API key, fallback if needed
    if (!validateProviderApiKey(selectedProvider)) {
      log('WARN', 'PROVIDER', `Primary provider ${selectedProvider} not available, finding fallback...`)
      selectedProvider = getFallbackProvider(selectedProvider)

      if (!validateProviderApiKey(selectedProvider)) {
        logger.query.apiError('MULTI-PROVIDER', 'No provider API keys configured')
        return NextResponse.json(
          { error: 'No AI provider API keys configured. Please add provider API keys to .env.local' },
          { status: 500 }
        )
      }

      log('INFO', 'PROVIDER', `Using fallback provider: ${selectedProvider}`)
    }

    // Log provider selection
    log('INFO', 'PROVIDER', `Methodology: ${selectedMethod.id} → Provider: ${selectedProvider} (${providerSpec.model})`)
    log('INFO', 'PROVIDER', `Reasoning: ${providerSpec.reasoning}`)

    // Emit: AI reasoning — what the system is thinking
    emitAndPersist(queryId, {
      id: `${queryId}-reasoning`,
      queryId,
      stage: 'reasoning',
      timestamp: Date.now() - startTime,
      data: metaCoreState
        ? `${metaCoreState.humanIntention}`
        : `${selectedMethod.reason || 'Processing query'}`,
      details: {
        reasoning: {
          intent: metaCoreState?.humanIntention || 'Analyzing query',
          approach: selectedMethod.reason || `Using ${selectedMethod.id} methodology`,
          reflectionMode: metaCoreState?.reflectionMode ? 'active' : 'standard',
          ascentLevel: metaCoreState?.ascentLevel || 1,
          providerReason: providerSpec.reasoning || `${selectedProvider} selected for ${selectedMethod.id}`,
        },
      },
    })

    // Side Canal context already fetched above in fusion layer
    // Log if context was found
    if (sideCanalContext) {
      log('INFO', 'SIDE_CANAL', `Context injected: ${sideCanalContext.substring(0, 100)}...`)
    }

    // Build messages with conversation history and context
    const messages = [
      ...conversationHistory.slice(-6).map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      ...(sideCanalContext ? [{
        role: 'assistant' as const,
        content: `[Context from previous conversations]\n${sideCanalContext}\n\n[Current query]`,
      }] : []),
      { role: 'user' as const, content: query },
    ]


    // Get methodology-specific system prompt
    let systemPrompt = getMethodologyPrompt(selectedMethod.id, pageContext, legendMode)

    // Inject URL context if we fetched any content
    if (urlContext) {
      systemPrompt = `${systemPrompt}\n\n${urlContext}`
      log('INFO', 'URL_FETCH', `URL context injected into system prompt`)
    }

    // Inject Intelligence Fusion enhancement if available
    if (fusionResult) {
      const fusionEnhancement = generateEnhancedSystemPrompt(fusionResult, weights)
      systemPrompt = `${systemPrompt}\n\n${fusionEnhancement}`

      // Log the layer configuration being applied
      const layerSummary = Object.entries(weights).map(([k, v]) => {
        const pct = Math.round((v as number) * 100)
        const name = LAYER_METADATA[Number(k) as Layer]?.aiName || k
        return `${name}:${pct}%`
      }).join(', ')
      log('INFO', 'FUSION', `Layer config: ${layerSummary}`)
      log('INFO', 'FUSION', `Enhanced system prompt with Layer behaviors (+${fusionEnhancement.length} chars)`)
    }


    // Emit: generating
    emitAndPersist(queryId, {
      id: `${queryId}-generating`,
      queryId,
      stage: 'generating',
      timestamp: Date.now() - startTime,
      data: `${selectedProvider} · ${selectedMethod.id}`,
      details: {
        model: providerSpec.model,
        provider: selectedProvider,
        methodology: { selected: selectedMethod.id, reason: selectedMethod.reason || '' },
      },
    })

    // Call Multi-Provider API
    logger.query.apiCall(selectedProvider.toUpperCase(), providerSpec.model)
    log('INFO', 'API', `Calling ${selectedProvider} API with model: ${providerSpec.model}`)


    let apiResponse
    try {
      apiResponse = await callProvider(selectedProvider, {
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        model: providerSpec.model,
        maxTokens: 4096,
        temperature: 0.7,
      })
    } catch (apiError: any) {
      logger.query.apiError(selectedProvider.toUpperCase(), apiError.message)
      log('ERROR', 'API', `Provider ${selectedProvider} failed: ${apiError.message}`)

      return NextResponse.json(
        { error: `AI provider request failed: ${apiError.message}` },
        { status: 500 }
      )
    }

    const content = apiResponse.content
    const inputTokens = apiResponse.usage.inputTokens
    const outputTokens = apiResponse.usage.outputTokens
    const tokens = apiResponse.usage.totalTokens
    const latency = Date.now() - startTime
    const cost = apiResponse.cost

    logger.query.apiResponse(selectedProvider.toUpperCase(), tokens, latency)
    log('INFO', 'API', `Response received: ${tokens} tokens, ${latency}ms, $${cost.toFixed(6)}`)

    // Run Grounding Guard
    const guardResult = await runGroundingGuard(content, query)

    // Emit: guard complete
    emitAndPersist(queryId, {
      id: `${queryId}-guard`,
      queryId,
      stage: 'guard',
      timestamp: Date.now() - startTime,
      data: guardResult && !guardResult.passed ? 'warning triggered' : 'passed',
      details: {
        guard: {
          verdict: guardResult && !guardResult.passed ? 'warn' : 'pass',
          risk: guardResult ? (guardResult.scores.hype + guardResult.scores.echo + guardResult.scores.drift) / 300 : 0,
          checks: guardResult?.issues || [],
        },
      },
    })

    // ============================================================================
    // GNOSTIC POST-PROCESSING: Analyze and Purify Response
    // ============================================================================
    let processedContent = content
    let antipatternRisk, layerAnalysis, sovereigntyFooter, analysisMetadata

    try {
      // ANTI-ANTIPATTERN SHIELD - Detect and purify hollow knowledge
      antipatternRisk = detectAntipattern(processedContent)

      if (antipatternRisk.risk !== 'none' && antipatternRisk.severity >= 0.4) {
        // Only purify at 40%+ severity — below that, single keyword matches in long responses are normal
        log('WARN', 'ANTIPATTERN', `Detected: ${antipatternRisk.risk} (severity: ${(antipatternRisk.severity * 100).toFixed(0)}%) — purifying`)
        processedContent = purifyResponse(processedContent, antipatternRisk)
      } else if (antipatternRisk.risk !== 'none') {
        // Low severity — log but don't purify (avoids false positives on business/strategy content)
        log('INFO', 'ANTIPATTERN', `Low-severity ${antipatternRisk.risk} (${(antipatternRisk.severity * 100).toFixed(0)}%) — skipping purification`)
      } else {
        log('INFO', 'ANTIPATTERN', `✓ Response is aligned (no antipatterns detected)`)
      }

      // SOVEREIGNTY CHECK - Ensure boundaries respected
      if (metaCoreState && !checkSovereignty(processedContent, metaCoreState)) {
        log('WARN', 'SOVEREIGNTY', `Boundary violation detected - adding humility markers`)
        processedContent = addSovereigntyMarkers(processedContent)
      }

      // Add sovereignty footer if needed (high-ascent queries)
      if (metaCoreState) {
        sovereigntyFooter = generateSovereigntyFooter(metaCoreState)
        if (sovereigntyFooter) {
          log('INFO', 'SOVEREIGNTY', `Adding sovereignty reminder footer`)
        }
      }

      // LAYERS MAPPING - Analyze Layer activations
      layerAnalysis = analyzeLayerContent(processedContent)
      const activationSummary = getLayerActivationSummary(layerAnalysis)
      log('INFO', 'LAYERS', activationSummary)

      if (layerAnalysis.synthesisInsight.detected) {
        log('INFO', 'LAYERS', `✨ Synthesis activated: ${layerAnalysis.synthesisInsight.insight}`)
      }

      // ELEVATION SUGGESTION
      const nextElevation = progressState ? suggestElevation(progressState) : null

      // Build Gnostic metadata
      analysisMetadata = {
        metaCoreState: metaCoreState ? {
          intent: metaCoreState.humanIntention,
          boundary: metaCoreState.sovereignBoundary,
          reflectionMode: metaCoreState.reflectionMode,
          ascentLevel: metaCoreState.ascentLevel,
        } : null,
        progressState: progressState ? {
          currentLevel: progressState.currentLevel,
          levelName: LAYER_METADATA[progressState.currentLevel].aiName,
          velocity: progressState.ascentVelocity,
          totalQueries: progressState.totalQueries,
          nextElevation,
        } : null,
        layerAnalysis: {
          activations: layerAnalysis.activations.reduce((acc, a) => {
            acc[a.layerNode] = a.activation
            return acc
          }, {} as Record<number, number>),
          dominant: LAYER_METADATA[layerAnalysis.dominantLayer].aiName,
          averageLevel: layerAnalysis.averageLevel,
          synthesisInsight: layerAnalysis.synthesisInsight.detected ? {
            insight: layerAnalysis.synthesisInsight.insight,
            confidence: layerAnalysis.synthesisInsight.confidence,
          } : null,
        },
        antipatternPurified: antipatternRisk.risk !== 'none' && antipatternRisk.severity >= 0.4,
        antipatternType: antipatternRisk.risk,
        sovereigntyFooter,
      }

      log('INFO', 'GNOSTIC', `✓ All protocols completed successfully`)

      // Emit: analysis — post-processing reasoning
      emitAndPersist(queryId, {
        id: `${queryId}-analysis`,
        queryId,
        stage: 'analysis',
        timestamp: Date.now() - startTime,
        data: antipatternRisk.risk !== 'none' && antipatternRisk.severity >= 0.4
          ? `purified: ${antipatternRisk.risk} antipatterns`
          : antipatternRisk.risk !== 'none'
            ? `low ${antipatternRisk.risk} (${(antipatternRisk.severity * 100).toFixed(0)}%) · ${layerAnalysis ? LAYER_METADATA[layerAnalysis.dominantLayer]?.aiName || 'balanced' : 'standard'} dominant`
            : `clean · ${layerAnalysis ? LAYER_METADATA[layerAnalysis.dominantLayer]?.aiName || 'balanced' : 'standard'} dominant`,
        details: {
          analysis: {
            antipatternRisk: antipatternRisk.risk,
            sovereigntyCheck: metaCoreState ? checkSovereignty(processedContent, metaCoreState) : true,
            purified: antipatternRisk.risk !== 'none' && antipatternRisk.severity >= 0.4,
            synthesisInsight: layerAnalysis?.synthesisInsight?.detected ? layerAnalysis.synthesisInsight.insight : '',
            dominantLayer: layerAnalysis ? LAYER_METADATA[layerAnalysis.dominantLayer]?.aiName || 'unknown' : '',
            averageLevel: layerAnalysis?.averageLevel || 0,
          },
        },
      })
    } catch (gnosticError) {
      // Don't fail the request if post-processing fails
      log('WARN', 'GNOSTIC', `Post-processing failed: ${gnosticError}`)
      processedContent = content // Fall back to original content
      analysisMetadata = null
    }

    // Save to database
    updateQuery(queryId, {
      status: 'complete',
      result: JSON.stringify({ finalAnswer: content }),
      tokens_used: tokens,
      cost: cost,
    }, userId)

    // Track API usage
    trackUsage(selectedProvider, providerSpec.model, inputTokens, outputTokens, cost)

    logger.query.complete(queryId, latency, cost)

    // Extract topics and get suggestions asynchronously (don't block response)
    // Works for both logged-in and anonymous users
    let suggestions: any[] = []
    try {
      const { extractTopics, getSuggestions, linkQueryToTopics, updateTopicRelationships } = await import('@/lib/side-canal')
      
      log('INFO', 'SIDE_CANAL', `Starting topic extraction for queryId: ${queryId}, userId: ${userId || 'anonymous'}`)
      
      // Extract topics (works for anonymous users too - userId can be null)
      const topics = await extractTopics(query, content, userId, legendMode)
      
      log('INFO', 'SIDE_CANAL', `Extracted ${topics.length} topics`)
      
      if (topics.length > 0) {
        const topicIds = topics.map(t => t.id)
        linkQueryToTopics(queryId, topicIds)
        updateTopicRelationships(topicIds, userId)
        suggestions = getSuggestions(topicIds, userId)
        
        log('INFO', 'SIDE_CANAL', `Got ${suggestions.length} suggestions from relationships`)
        
        // If no suggestions from relationships, show extracted topics as suggestions
        // This helps users see what topics were discovered
        if (suggestions.length === 0 && topics.length > 1) {
          suggestions = topics.slice(1).map(topic => ({
            topicId: topic.id,
            topicName: topic.name,
            reason: 'Topic discovered in this conversation',
            relevance: 1.0,
          }))
          log('INFO', 'SIDE_CANAL', `Using ${suggestions.length} extracted topics as suggestions`)
        }
        
        // Generate synopsis asynchronously (don't wait)
        const { generateSynopsis } = await import('@/lib/side-canal')
        generateSynopsis(topicIds[0], [queryId], userId).catch((err) => {
          log('WARN', 'SIDE_CANAL', `Synopsis generation error: ${err}`)
        })
        
        log('INFO', 'SIDE_CANAL', `Success: ${topics.length} topics extracted, ${suggestions.length} suggestions to show`)
      } else {
        log('INFO', 'SIDE_CANAL', 'No topics extracted - this might be due to API key or extraction failure')
      }
    } catch (err) {
      log('ERROR', 'SIDE_CANAL', `Topic extraction error: ${err instanceof Error ? err.message : String(err)}`)
      console.error('Side Canal error:', err)
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
        urlsFetched: urlsFetched.filter(u => u.success).length,
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
      fusion: fusionResult ? {
        methodology: fusionResult.selectedMethodology,
        confidence: fusionResult.confidence,
        layerActivations: fusionResult.layerActivations.slice(0, 5).map(s => ({
          name: s.name,
          effectiveWeight: s.effectiveWeight,
          keywords: s.keywords
        })),
        dominantLayers: fusionResult.dominantLayers.map(s => LAYER_METADATA[s]?.aiName),
        guardRecommendation: fusionResult.guardRecommendation,
        extendedThinkingBudget: fusionResult.extendedThinkingBudget,
        processingMode: fusionResult.processingMode,
        activeLenses: fusionResult.activeLenses,
        processingTimeMs: fusionResult.processingTimeMs
      } : null,
    }
    
    log('INFO', 'SIDE_CANAL', `Response includes ${suggestions.length} suggestions`)

    // Track query submission in PostHog (server-side)
    try {
      const distinctId = userId || getAnonymousDistinctId(request)
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
      })

      // Track guard if triggered
      if (guardResult && !guardResult.passed) {
        // Find the main issue type
        const guardType = guardResult.issues[0]?.toLowerCase().includes('hype') ? 'hype'
          : guardResult.issues[0]?.toLowerCase().includes('echo') ? 'echo'
          : guardResult.issues[0]?.toLowerCase().includes('drift') ? 'drift'
          : 'factuality'

        trackServerGuardTriggered(distinctId, {
          guard_type: guardType,
          action: 'pending',
          query,
          methodology: selectedMethod.id,
          scores: guardResult.scores || { hype: 0, echo: 0, drift: 0, fact: 0 },
          issues: guardResult.issues || [],
        })
      }
    } catch (trackError) {
      // Don't fail the request if tracking fails
      log('WARN', 'POSTHOG', `Tracking failed: ${trackError}`)
    }

    // Emit: complete
    emitAndPersist(queryId, {
      id: `${queryId}-complete`,
      queryId,
      stage: 'complete',
      timestamp: Date.now() - startTime,
      data: `${formatDuration(Date.now() - startTime)} · ${tokens} tokens · $${cost.toFixed(4)}`,
      details: {
        duration: Date.now() - startTime,
        tokens: { input: inputTokens, output: outputTokens, total: tokens },
        cost,
        model: providerSpec.model,
        provider: selectedProvider,
        methodology: { selected: selectedMethod.id, reason: selectedMethod.reason || '' },
      },
    })

    return NextResponse.json(responseData)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : 'no stack'
    const errorName = error instanceof Error ? error.name : typeof error
    
    
    logger.system.error(errorMessage)
    console.error('[API] Error details:', { errorName, errorMessage, errorStack, queryId })

    // Emit: error
    try {
      emitAndPersist(queryId, {
        id: `${queryId}-error`,
        queryId,
        stage: 'error',
        timestamp: Date.now() - startTime,
        data: errorMessage.slice(0, 100),
        details: { duration: Date.now() - startTime },
      })
    } catch { /* don't fail on emit error */ }
    
    // Update query status to error
    try {
      const token = request.cookies.get('session_token')?.value
      const user = token ? getUserFromSession(token) : null
      const userId = user?.id || null
      updateQuery(queryId, {
        status: 'error',
        result: JSON.stringify({ error: errorMessage }),
      }, userId)
    } catch (dbError) {
      console.error('[API] Failed to update query status:', dbError)
    }
    
    
    return NextResponse.json(
      { error: 'Query processing failed', details: errorMessage, queryId },
      { status: 500 }
    )
  }
}

// Check if query is asking for crypto price
async function checkCryptoQuery(query: string, queryId: string, startTime: number) {
  const queryLower = query.toLowerCase()
  const cryptoSymbols = ['btc', 'bitcoin', 'eth', 'ethereum', 'ada', 'cardano', 'sol', 'solana']

  const matchedSymbol = cryptoSymbols.find(symbol => queryLower.includes(symbol))
  const hasPriceKeyword = queryLower.includes('price') || queryLower.includes('cost') || queryLower.includes('worth') || queryLower.includes('value')
  
  log('DEBUG', 'REALTIME', `Crypto check: "${query}" | matchedSymbol: ${matchedSymbol || 'none'} | hasPrice: ${hasPriceKeyword}`)
  
  if (!matchedSymbol || !hasPriceKeyword) {
    return null
  }

  // Don't use real-time data for prediction/projection/forecast queries
  const futureKeywords = [
    // Prediction/forecast terms
    'predict', 'prediction', 'projection', 'forecast', 'estimate', 'estimation',
    'outlook', 'target', 'expectation',

    // Future indicators
    'future', 'will be', 'gonna be', 'going to be', 'going to',

    // Time-based patterns
    'in 1 year', 'in 2 year', 'in 3 year', 'in 5 year', 'in 10 year', 'in 20 year', 'in 30 year', 'in 50 year',
    'in 1 month', 'in 6 month', 'in 12 month',
    'in 1 decade', 'in 2 decade', 'in 3 decade',
    'from now', 'from today',
    'next year', 'next month', 'next decade', 'next century',
    'long term', 'short term',

    // Specific years (2025-2050)
    '2025', '2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033', '2034', '2035',
    '2040', '2045', '2050',
    'by 202', 'by 203', 'by 204', 'by 205',  // Catches "by 2025", "by 2030", etc.

    // Analysis/speculation terms
    'analysis', 'potential', 'expected', 'anticipated'
  ]

  if (futureKeywords.some(keyword => queryLower.includes(keyword))) {
    // Projection/prediction query detected - skip real-time data, route to AI methodology
    log('INFO', 'REALTIME', `Skipping CoinGecko for "${query.slice(0, 40)}..." - Projection query detected`)
    return null
  }

  // Normalize symbol
  const symbolMap: Record<string, string> = {
    'btc': 'bitcoin',
    'bitcoin': 'bitcoin',
    'eth': 'ethereum',
    'ethereum': 'ethereum',
    'ada': 'cardano',
    'cardano': 'cardano',
    'sol': 'solana',
    'solana': 'solana',
  }

  const coinId = symbolMap[matchedSymbol]
  logger.realtime.fetch('CoinGecko', coinId)

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`,
      { headers: { 'Accept': 'application/json' } }
    )

    if (!response.ok) {
      logger.realtime.error('CoinGecko', `HTTP ${response.status}`)
      return null
    }

    const data = await response.json()
    const price = data[coinId]?.usd
    const change24h = data[coinId]?.usd_24h_change

    if (!price) {
      logger.realtime.error('CoinGecko', 'No price data returned')
      return null
    }

    logger.realtime.success('CoinGecko', coinId.toUpperCase(), price)

    const changeEmoji = change24h >= 0 ? '📈' : '📉'
    const changeText = `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`

    const responseText = `**${coinId.toUpperCase()} Price: $${price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}**\n\n${changeEmoji} 24h Change: ${changeText}\n\n_Live data from CoinGecko • Updated just now_`

    const latency = Date.now() - startTime
    logger.query.complete(queryId, latency, 0)

    return {
      id: queryId,
      query,
      methodology: 'direct',
      methodologyUsed: 'realtime-data',
      selectionReason: 'Crypto price query detected - using real-time data',
      response: responseText,
      metrics: {
        tokens: 0,
        latency,
        cost: 0,
        source: 'CoinGecko',
      },
    }
  } catch (error) {
    logger.realtime.error('CoinGecko', error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}

// Methodology selection logic
function selectMethodology(query: string, requested: string) {
  if (requested !== 'auto') {
    return { id: requested, reason: 'User selected' }
  }

  const queryLower = query.toLowerCase()

  // Math/computation → pot (check BEFORE simple queries)
  if (
    queryLower.includes('calculate') ||
    queryLower.includes('compute') ||
    /\d+\s*[+\-*/=]\s*\d+/.test(query)
  ) {
    logger.query.methodSelected('auto', 'pot', 'Math/computation detected - Program of Thought')
    return { id: 'pot', reason: 'Math/computation detected - Program of Thought' }
  }

  // Simple factual queries → direct
  if (query.length < 100 && !queryLower.includes('analyze') && !queryLower.includes('compare')) {
    logger.query.methodSelected('auto', 'direct', 'Simple query - direct response optimal')
    return { id: 'direct', reason: 'Simple query - direct response optimal' }
  }

  // Complex context requiring buffering → bot
  if (
    queryLower.includes('given that') ||
    queryLower.includes('assuming') ||
    queryLower.includes('constraints') ||
    queryLower.includes('requirements') ||
    (query.split(/[.!?]/).length > 2)  // Multi-sentence queries with context
  ) {
    logger.query.methodSelected('auto', 'bot', 'Complex context detected - Buffer of Thoughts')
    return { id: 'bot', reason: 'Complex context detected - Buffer of Thoughts' }
  }

  // Step-by-step → cod
  if (queryLower.includes('step by step') || queryLower.includes('explain how') || queryLower.includes('draft')) {
    logger.query.methodSelected('auto', 'cod', 'Step-by-step request - Chain of Draft')
    return { id: 'cod', reason: 'Step-by-step request - Chain of Draft' }
  }

  // Search/tools → react
  if (queryLower.includes('search') || queryLower.includes('find') || queryLower.includes('latest') || queryLower.includes('look up')) {
    logger.query.methodSelected('auto', 'react', 'Search/tools needed - ReAct')
    return { id: 'react', reason: 'Search/tools needed - ReAct' }
  }

  // Multi-perspective → gtp
  if (queryLower.includes('consensus') || 
      queryLower.includes('multiple perspectives') || 
      queryLower.includes('different angles') ||
      queryLower.includes('multi-ai') ||
      queryLower.includes('debate') ||
      queryLower.includes('pros and cons') ||
      queryLower.includes('comprehensive analysis') ||
      queryLower.includes('all perspectives') ||
      queryLower.includes('various viewpoints')) {
    logger.query.methodSelected('auto', 'gtp', 'Multi-perspective request - GTP Consensus')
    return { id: 'gtp', reason: 'Multi-perspective request - GTP Consensus' }
  }

  // Default to direct
  logger.query.methodSelected('auto', 'direct', 'Default to direct for efficiency')
  return { id: 'direct', reason: 'Default to direct for efficiency' }
}

// Get methodology-specific system prompt
function getMethodologyPrompt(methodology: string, pageContext?: string, legendMode: boolean = false): string {
  // Base identity with lead-with-insight writing style
  const baseIdentity = legendMode
    ? 'You are AkhAI in Legend Mode — a sovereign AI research engine providing comprehensive, deeply analytical responses. Lead with insight, explore with rigor, connect across domains. Every paragraph should teach something. Depth without bloat.'
    : 'You are AkhAI, a sovereign AI research engine. Lead every response with insight — no preamble, no filler. Write with precision: every word earns its place. Connect ideas across domains. Be confident but humble. Ground claims in evidence. When uncertain, say so directly.'
  
  // Writing style guidelines
  const writingStyle = legendMode
    ? '\n\nWRITING RULES (Legend Mode):\n- Lead with the deepest insight, never with filler\n- NEVER say: "Great question", "Let me explain", "I\'d be happy to help", "It\'s important to note"\n- Comprehensive means thorough, not verbose — earn every paragraph\n- Historical context → current state → future implications (when relevant)\n- Rich with examples, case studies, and cross-domain connections\n- Show genuine analytical depth, not performative thoroughness\n- End sections with synthesis, not summary'
    : '\n\nWRITING RULES:\n- Lead with the answer or insight, never with filler\n- NEVER say: "Great question", "Let me explain", "I\'d be happy to help", "It\'s important to note"\n- Paragraphs over bullet lists unless structure demands it\n- Short sentences for impact. Longer for nuance.\n- End with an actionable next step or a connection to a broader pattern\n- No meta-commentary about the response itself\n- Confident but humble — assured, never preachy'
  
  // Response enhancement section
  const enhancementSection = '\n\nAfter your response, add:\n[RELATED]: 2-3 topics that naturally extend this discussion\n[NEXT]: The single most valuable follow-up question'
  
  // Add page context if provided
  const contextSection = pageContext 
    ? `\n\n**CURRENT PAGE CONTEXT:**\nThe user is currently viewing or working with the following content:\n${pageContext}\n\nWhen the user asks about "this", "it", "the subject", or refers to something without specifying, they are likely referring to the content above. Use this context to understand their queries and provide relevant responses.`
    : ''

  switch (methodology) {
    case 'direct':
      return `${baseIdentity}${writingStyle}

Provide direct, factual answers. Be concise yet complete. Lead with the core answer, then support with essential facts.${enhancementSection}${contextSection}`

    case 'cod':
      // Chain of Draft - iterative refinement
      return `${baseIdentity}${writingStyle}

Use Chain of Draft (CoD) methodology with visible refinement:
1. **First Draft**: Initial answer addressing the core question
2. **Reflection**: Identify weaknesses, gaps, or areas needing improvement (show your step-back logic)
3. **Second Draft**: Refined answer incorporating improvements
4. **Final Answer**: Polished, comprehensive response

Format: [DRAFT 1], [REFLECTION], [DRAFT 2], [FINAL ANSWER]${enhancementSection}${contextSection}`

    case 'bot':
      // Buffer of Thoughts - maintain context buffer
      return `${baseIdentity}${writingStyle}

Use Buffer of Thoughts (BoT) methodology:
1. **Context Buffer**: Extract and store key facts, constraints, and requirements
2. **Reasoning Chain**: Build your answer step-by-step, referencing the buffer
3. **Validation**: Cross-check against buffered context (show logical verification)
4. **Response**: Provide validated answer with clear reasoning

Format: [BUFFER: key facts], [REASONING: step-by-step], [VALIDATION: checks], [ANSWER: final response]${enhancementSection}${contextSection}`

    case 'react':
      // ReAct - reasoning and acting
      return `${baseIdentity}${writingStyle}

Use ReAct (Reasoning + Acting) methodology:
1. **Thought**: Analyze what information you need
2. **Action**: Describe what you would search/lookup (even if simulated)
3. **Observation**: State what you found or know
4. **Repeat**: Continue thought-action-observation cycles as needed
5. **Answer**: Provide final response based on observations

Format: [THOUGHT 1], [ACTION 1], [OBSERVATION 1], [THOUGHT 2], ... [FINAL ANSWER]${enhancementSection}${contextSection}`

    case 'pot':
      // Program of Thought - computational reasoning
      return `${baseIdentity}${writingStyle}

Use Program of Thought (PoT) methodology:
1. **Problem Analysis**: Break down the computational/mathematical problem
2. **Pseudocode**: Write logical steps as if programming the solution
3. **Execution**: Work through the logic step-by-step with actual values
4. **Verification**: Double-check calculations and logic (show your verification process)
5. **Result**: Present the final answer with clear explanation

Format: [PROBLEM], [LOGIC/PSEUDOCODE], [EXECUTION], [VERIFICATION], [RESULT]${enhancementSection}${contextSection}`

    case 'gtp':
      // Generative Thought Process - multi-perspective consensus
      return `${baseIdentity}${writingStyle}

Use Generative Thought Process (GTP) methodology:
1. **Technical Perspective**: Analyze from implementation/practical angle
2. **Strategic Perspective**: Consider broader implications and approaches
3. **Critical Perspective**: Identify potential issues and limitations (show logical step-backs)
4. **Synthesis**: Combine insights from all perspectives
5. **Consensus Answer**: Provide balanced, well-rounded response

Format: [TECHNICAL], [STRATEGIC], [CRITICAL], [SYNTHESIS], [CONSENSUS]${enhancementSection}${contextSection}`

    case 'auto':
      // Auto-selected, use direct by default
      return `${baseIdentity}${writingStyle}

Provide direct, factual answers. Be concise yet complete. Lead with the core answer, then support with essential facts.${enhancementSection}${contextSection}`

    default:
      // Fallback to direct
      return `${baseIdentity}${writingStyle}

Provide direct, factual answers. Be concise yet complete. Lead with the core answer, then support with essential facts.${enhancementSection}${contextSection}`
  }
}

// Grounding Guard - checks for hallucination patterns
async function runGroundingGuard(response: string, query: string) {
  logger.guard.start('post-response')

  const issues: string[] = []

  // 1. Hype detection - check both query and response
  const queryLower = query.toLowerCase()
  const responseLower = response.toLowerCase()
  
  // Hype words (excessive superlatives)
  const hypeWords = [
    'revolutionary',
    'unprecedented',
    'amazing',
    'incredible',
    'guaranteed',
    'always',
    'never',
    'best ever',
    'perfect',
    'flawless',
  ]
  
  // Extreme monetary claims patterns (trillion, billion in short timeframes)
  const extremeMonetaryPatterns = [
    /\d+\s*(trillion|billion).*?(day|days|week|weeks|month|months)/i,
    /(trillion|billion).*?\d+\s*(day|days|week|weeks|month|months)/i,
    /make.*?\d+\s*(trillion|billion)/i,
    /earn.*?\d+\s*(trillion|billion)/i,
  ]
  
  // Check response for hype words
  const responseHypeCount = hypeWords.filter(w => responseLower.includes(w)).length
  
  // Check query for extreme monetary claims
  const queryHasExtremeClaims = extremeMonetaryPatterns.some(pattern => pattern.test(query))
  
  // Check response for extreme monetary claims
  const responseHasExtremeClaims = extremeMonetaryPatterns.some(pattern => pattern.test(responseLower))
  
  // Calculate total hype score
  let hypeCount = responseHypeCount
  if (queryHasExtremeClaims) hypeCount += 3 // Heavy weight for extreme claims in query
  if (responseHasExtremeClaims) hypeCount += 2
  
  
  // Filler phrase detection — AkhAI should lead with insight, not pleasantries
  const fillerPhrases = [
    'great question',
    'excellent question',
    'glad you asked',
    'happy to help',
    'let me explain',
    'let me break this down',
    'it\'s important to note',
    'it\'s worth noting',
    'in conclusion',
    'to summarize',
  ]
  const fillerCount = fillerPhrases.filter(p => responseLower.includes(p)).length
  if (fillerCount > 0) {
    issues.push(`Filler phrases detected (${fillerCount}): AkhAI should lead with insight, not pleasantries`)
  }

  const hypeTriggered = hypeCount >= 2
  logger.guard.hypeCheck(hypeCount, hypeTriggered)
  if (hypeTriggered) issues.push('hype')

  // 2. Echo detection - repetitive content
  const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 10)
  const uniqueSentences = new Set(sentences.map(s => s.trim().toLowerCase()))
  const echoScore = Math.round((1 - uniqueSentences.size / Math.max(sentences.length, 1)) * 100)
  const echoTriggered = echoScore > 30
  logger.guard.echoCheck(echoScore, echoTriggered)
  if (echoTriggered) issues.push('echo')

  // 3. Drift detection - IMPROVED (skip short queries, better matching)
  // Extract meaningful words from query (keep numbers, even single digits!)
  const queryWords = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')  // Remove special chars but keep numbers
    .split(/\s+/)
    .filter(w => w.length > 0 && (w.length > 1 || /\d/.test(w)))  // Keep multi-char words OR any numbers

  const responseText = response.toLowerCase()

  let driftScore = 0
  let driftTriggered = false

  // Skip drift check for math/computational queries (too many false positives)
  const isMathQuery = /\d+\s*[+\-*/=]\s*\d+/.test(query) ||
                      query.toLowerCase().includes('calculate') ||
                      query.toLowerCase().includes('compute')

  // Only check drift for queries with 3+ meaningful words (and not math queries)
  if (queryWords.length >= 3 && !isMathQuery) {
    // Check if query words appear in response text
    const matchedWords = queryWords.filter(word =>
      responseText.includes(word) ||
      // Also check for semantic matches (numbers)
      (word.match(/^\d+$/) && responseText.includes(word))
    )

    const overlapRatio = matchedWords.length / queryWords.length
    driftScore = Math.round((1 - overlapRatio) * 100)

    // Only trigger if less than 20% overlap AND query is substantial (5+ words)
    driftTriggered = driftScore > 80 && queryWords.length >= 5
  } else {
    // For short queries (< 3 words) or math queries, skip drift check (too many false positives)
    driftScore = 0
    driftTriggered = false
  }

  logger.guard.driftCheck(driftScore, driftTriggered)
  if (driftTriggered) issues.push('drift')

  // 4. SANITY CHECK - Reality/Plausibility validation
  const sanityViolations: string[] = []
  // queryLower already declared above in hype detection section
  const combinedText = (query + ' ' + response).toLowerCase()

  // Extreme monetary claims (> $100M in < 5 years for individuals)
  const billionMatch = combinedText.match(/(\d+)\s*(billion|trillion)/i)
  if (billionMatch) {
    const amount = parseInt(billionMatch[1])
    const unit = billionMatch[2].toLowerCase()

    // Trillion dollar claims
    if (unit === 'trillion' && amount >= 1) {
      sanityViolations.push(`Implausible: $${amount} trillion claim`)
    }

    // Billion+ in short timeframe
    const timeframeMatch = combinedText.match(/(1|one|2|two)\s*(year|month|week|day)/i)
    if (unit === 'billion' && amount >= 100 && timeframeMatch) {
      sanityViolations.push(`Implausible: $${amount}B in ${timeframeMatch[0]}`)
    }
  }

  // Overnight/instant success with large monetary claims
  if ((queryLower.includes('overnight') || queryLower.includes('instant')) &&
      (combinedText.includes('million') || combinedText.includes('billion'))) {
    sanityViolations.push('Implausible: Overnight wealth claim')
  }

  // Extreme timeframe compression
  const extremeTimeframes = [
    { pattern: /trillion.{0,30}(1|one|2|two|3|three)\s*(year|month)/i, msg: 'Trillion in < 3 years' },
    { pattern: /billion.{0,30}(1|one|2|two)\s*(week|day)/i, msg: 'Billion in days/weeks' },
  ]

  extremeTimeframes.forEach(({ pattern, msg }) => {
    if (pattern.test(combinedText)) {
      sanityViolations.push(`Implausible: ${msg}`)
    }
  })

  // Physical impossibilities
  const impossibleClaims = [
    { keywords: ['faster than light', 'speed of light'], msg: 'FTL travel' },
    { keywords: ['perpetual motion', 'free energy'], msg: 'Physics violation' },
    { keywords: ['100% accuracy', '100% guaranteed', 'never fail'], msg: 'Absolute certainty' },
  ]

  impossibleClaims.forEach(({ keywords, msg }) => {
    if (keywords.some(kw => combinedText.includes(kw))) {
      sanityViolations.push(`Impossible: ${msg}`)
    }
  })

  // Mathematical contradictions
  if (queryLower.includes('2+2') && response.toLowerCase().includes('5')) {
    sanityViolations.push('Math error: 2+2=5')
  }

  const sanityTriggered = sanityViolations.length > 0
  logger.guard.sanityCheck(sanityViolations, sanityTriggered)
  if (sanityTriggered) issues.push('sanity')

  // 5. Factuality check (placeholder - would need external verification)
  const factScore = 0
  const factTriggered = false
  logger.guard.factCheck(factScore, factTriggered)
  if (factTriggered) issues.push('factuality')

  logger.guard.complete(issues, issues.length === 0)

  return {
    passed: issues.length === 0,
    issues,
    scores: {
      hype: hypeCount,
      echo: echoScore,
      drift: driftScore,
      fact: factScore,
    },
    sanityViolations,
  }
}
