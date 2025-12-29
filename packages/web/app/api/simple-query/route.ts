/**
 * Multi-provider query endpoint with methodology-specific provider routing
 * Routes each methodology to its optimal AI provider for best performance
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger, log } from '@/lib/logger'
import { createQuery, updateQuery, trackUsage } from '@/lib/database'
import { getUserFromSession } from '@/lib/auth'
import { getContextForQuery } from '@/lib/side-canal'
import { getProviderForMethodology, validateProviderApiKey, getFallbackProvider, type CoreMethodology } from '@/lib/provider-selector'
import { callProvider, isProviderAvailable } from '@/lib/multi-provider-api'
import { trackServerQuerySubmitted, trackServerGuardTriggered, getAnonymousDistinctId } from '@/lib/posthog-events'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const queryId = Math.random().toString(36).slice(2, 10)

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'simple-query/route.ts:12',message:'POST endpoint called',data:{queryId,startTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'simple-query/route.ts:20',message:'Entering try block',data:{queryId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    // Get user from session (optional - allows anonymous usage)
    const token = request.cookies.get('session_token')?.value
    const user = token ? getUserFromSession(token) : null
    const userId = user?.id || null

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'simple-query/route.ts:26',message:'User session retrieved',data:{hasToken:!!token,hasUser:!!user,userId:userId||'null'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'simple-query/route.ts:29',message:'Before request.json()',data:{queryId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    const { query, methodology = 'auto', conversationHistory = [], pageContext, legendMode = false } = await request.json()

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'simple-query/route.ts:33',message:'Request parsed successfully',data:{query:query?.substring(0,50)||'null',methodology,hasHistory:conversationHistory.length>0,hasPageContext:!!pageContext,legendMode},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'simple-query/route.ts:16',message:'Request parsed',data:{query,methodology,hasHistory:conversationHistory.length>0,userId:userId||'anonymous'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    if (!query || typeof query !== 'string') {
      logger.query.apiError('VALIDATION', 'Query is required')
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Log query start
    logger.query.start(query, methodology)

    // Methodology selection with logging
    const selectedMethod = selectMethodology(query, methodology)

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'simple-query/route.ts:26',message:'Methodology selected',data:{selected:selectedMethod.id,reason:selectedMethod.reason},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    // Save query to database (with user_id)
    try {
      createQuery(queryId, query, selectedMethod.id, userId)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'simple-query/route.ts:29',message:'Query saved to DB',data:{queryId,userId:userId||'anonymous',success:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
    } catch (dbError) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'simple-query/route.ts:29',message:'DB save failed',data:{queryId,error:String(dbError)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
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
      return NextResponse.json(cryptoResult)
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

    // Get context from Side Canal (related synopses) - context injection
    let sideCanalContext: string | null = null
    try {
      sideCanalContext = getContextForQuery(query, userId)
      if (sideCanalContext) {
        log('INFO', 'SIDE_CANAL', `Context injected: ${sideCanalContext.substring(0, 100)}...`)
      }
    } catch (error) {
      log('WARN', 'SIDE_CANAL', `Context injection failed: ${error}`)
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

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'simple-query/route.ts:110',message:'Before getMethodologyPrompt',data:{methodology:selectedMethod.id,hasPageContext:!!pageContext,legendMode},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    // Get methodology-specific system prompt
    const systemPrompt = getMethodologyPrompt(selectedMethod.id, pageContext, legendMode)

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'simple-query/route.ts:115',message:'After getMethodologyPrompt',data:{promptLength:systemPrompt?.length||0,methodology:selectedMethod.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    // Call Multi-Provider API
    logger.query.apiCall(selectedProvider.toUpperCase(), providerSpec.model)
    log('INFO', 'API', `Calling ${selectedProvider} API with model: ${providerSpec.model}`)

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'simple-query/route.ts:69',message:'Calling Multi-Provider API',data:{methodology:selectedMethod.id,provider:selectedProvider,model:providerSpec.model},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion

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
      query,
      methodology: selectedMethod.id,
      methodologyUsed: selectedMethod.id,
      selectionReason: selectedMethod.reason,
      response: content,
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

    return NextResponse.json(responseData)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : 'no stack'
    const errorName = error instanceof Error ? error.name : typeof error
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'simple-query/route.ts:248',message:'Error caught in catch block',data:{errorName,errorMessage,errorStack:errorStack?.substring(0,500),queryId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    
    logger.system.error(errorMessage)
    console.error('[API] Error details:', { errorName, errorMessage, errorStack, queryId })
    
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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'simple-query/route.ts:264',message:'DB update failed in error handler',data:{dbError:String(dbError)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'simple-query/route.ts:268',message:'Returning error response',data:{errorMessage,status:500},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    
    return NextResponse.json(
      { error: 'Query processing failed', details: errorMessage },
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
  // Base identity with enhanced writing style
  const baseIdentity = legendMode
    ? 'You are AkhAI, a sovereign AI research assistant operating in Legend Mode. You provide comprehensive, deeply analytical responses with extensive elaboration, nuanced insights, and thorough exploration of complex topics.'
    : 'You are AkhAI, a sovereign AI research assistant. You write with a synthetic, immersive style—factual and straightforward, yet collaborative and high-achieving. You surmount obstacles through refinement, logical step-backs, and factual precision, while leaving space for innovation and elaboration.'
  
  // Writing style guidelines
  const writingStyle = legendMode
    ? `\n\n**WRITING STYLE (Legend Mode):**
- Elaborated and comprehensive: Deep dive into topics with extensive detail
- Nuanced analysis: Explore multiple angles, implications, and subtleties
- Thorough exploration: Cover historical context, current state, and future possibilities
- Rich elaboration: Provide examples, case studies, and detailed explanations
- Academic rigor: Maintain scholarly depth while remaining accessible`
    : `\n\n**WRITING STYLE (Standard Mode):**
- Synthetic and immersive: Write with precision and engagement
- Factual and straightforward: Present facts clearly, avoid fluff
- Collaborative spirit: Write as a partner in research, not just an informant
- High-achiever tone: Confident yet humble, solution-oriented
- Logical refinement: Show your reasoning process, acknowledge step-backs
- Innovation-ready: Leave space for elaboration and creative thinking
- Factual foundation: Ground everything in verifiable information`
  
  // Response enhancement section
  const enhancementSection = `\n\n**RESPONSE ENHANCEMENT:**
After your main response, when relevant, suggest:
1. **Enhancements**: Ways to deepen the research or improve the approach
2. **Related Topics**: 2-3 topics that naturally extend from this discussion
3. **Next Steps**: Logical follow-up questions or research directions
4. **Artifact Opportunities**: Note if this research could benefit from documentation/export (future feature)

Format enhancements as: [ENHANCEMENTS], [RELATED TOPICS], [NEXT STEPS]`
  
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
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'simple-query/route.ts:443',message:'Hype detection',data:{query,responseHypeCount,queryHasExtremeClaims,responseHasExtremeClaims,hypeCount},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
  // #endregion
  
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
