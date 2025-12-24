import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import {
  queries,
  addQueryEvent,
  createQueryRecord,
  updateQueryStatus,
} from '@/lib/query-store';
import { trackUsage, updateQuery } from '@/lib/database';
import { executeFlowAWithEvents, executeFlowBWithEvents, executeGTPWithEvents } from '@/lib/akhai-executor';
import type { ModelFamily } from '@akhai/core';
import { classifyQuery } from '@/lib/query-classifier';

export async function POST(request: NextRequest) {
  try {
    const { query, flow, methodology, conversationHistory = [] } = await request.json();

    console.log('=== QUERY RECEIVED ===', { query: query.substring(0, 50), methodology, flow, historyLength: conversationHistory.length });

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // SMART DETECTION: Classify query before processing
    const classification = classifyQuery(query);
    console.log('=== QUERY CLASSIFICATION ===', classification);

    const queryId = nanoid(10);

    // Auto-select methodology based on classification
    // If user explicitly set methodology, respect it (unless it's 'auto')
    let finalMethodology = methodology || flow || 'A';

    // If 'auto' OR no methodology specified, use smart detection
    if (finalMethodology === 'auto' || !methodology) {
      finalMethodology = classification.suggestedMethodology;
      console.log(`=== AUTO-ROUTING: ${query.substring(0, 30)} → ${finalMethodology} ===`);
      console.log(`=== REASON: ${classification.reason} ===`);
    }

    // Create query in database and memory
    createQueryRecord(queryId, query, finalMethodology);

    // Start processing in background with real AkhAI integration
    processQuery(queryId, finalMethodology, conversationHistory).catch((error) => {
      console.error('Query processing error:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      updateQueryStatus(queryId, 'error', undefined, errorMessage);
      addQueryEvent(queryId, 'error', { message: errorMessage });
    });

    return NextResponse.json({ queryId });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processQuery(queryId: string, flowType: string, conversationHistory: any[] = []) {
  console.log('=== PROCESS QUERY CALLED ===', { queryId, flowType, historyLength: conversationHistory.length });

  const queryData = queries.get(queryId);
  if (!queryData) return;

  // FAST PATH: Direct single AI call for simple queries (no consensus)
  if (flowType === 'direct') {
    console.log('=== FAST PATH: DIRECT MODE ===');
    console.log('=== Query:', queryData.query);

    // Emit fast-path event so UI knows this will be quick
    addQueryEvent(queryId, 'fast-path', {
      mode: 'direct',
      message: 'Simple query detected - using direct mode (no consensus)',
      estimatedTime: '5-10 seconds',
    });

    try {
      const startTime = Date.now();

      // CHECK FOR CRYPTO PRICE QUERIES - Fetch real-time data!
      const { isCryptoPriceQuery, getCryptoPrice } = await import('@/lib/realtime-data');
      const cryptoCheck = isCryptoPriceQuery(queryData.query);

      if (cryptoCheck.isCrypto && cryptoCheck.symbol) {
        console.log(`🪙 [Crypto] Detected crypto query for: ${cryptoCheck.symbol}`);

        addQueryEvent(queryId, 'fast-path', {
          mode: 'realtime-crypto',
          message: `Fetching live ${cryptoCheck.symbol.toUpperCase()} price from CoinGecko...`,
        });

        const priceData = await getCryptoPrice(cryptoCheck.symbol);

        if (priceData) {
          const duration = ((Date.now() - startTime) / 1000).toFixed(2);
          const changeEmoji = priceData.change24h >= 0 ? '📈' : '📉';
          const changeColor = priceData.change24h >= 0 ? '+' : '';

          const response = `**${priceData.symbol} Price: $${priceData.price.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}**

${changeEmoji} 24h Change: ${changeColor}${priceData.change24h.toFixed(2)}%

_Live data from ${priceData.source} • Updated just now_`;

          console.log(`💰 [Crypto] ${priceData.symbol} = $${priceData.price} (${changeColor}${priceData.change24h.toFixed(2)}%)`);

          // Update query with real-time crypto data
          updateQueryStatus(queryId, 'complete', {
            finalAnswer: response,
            methodology: 'direct',
            duration: parseFloat(duration),
          });

          // No tokens used, no cost (free CoinGecko API)
          updateQuery(queryId, {
            tokens_used: 0,
            cost: 0,
          });

          addQueryEvent(queryId, 'complete', {
            totalCost: 0,
            totalTokens: { input: 0, output: 0, total: 0 },
            duration: parseFloat(duration),
            mode: 'realtime-crypto',
            source: priceData.source,
          });

          return;
        } else {
          console.log(`⚠️ [Crypto] Failed to fetch price for ${cryptoCheck.symbol}, falling back to AI`);
          // Fall through to AI call if crypto fetch fails
        }
      }

      // NORMAL AI CALL (if not crypto or crypto fetch failed)
      const { createProviderFromFamily } = await import('@akhai/core');

      // Use Mother Base (Anthropic) for direct queries
      const provider = createProviderFromFamily('anthropic', {
        anthropic: process.env.ANTHROPIC_API_KEY!,
        deepseek: process.env.DEEPSEEK_API_KEY!,
        xai: process.env.XAI_API_KEY!,
        mistral: process.env.MISTRAL_API_KEY!,
      });

      console.log('=== CALLING MOTHER BASE DIRECTLY (no advisors) ===');

      // Build messages array with conversation history
      const messages = [
        ...conversationHistory.slice(-6).map((msg: any) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
        { role: 'user' as const, content: queryData.query },
      ];

      const response = await provider.complete({
        messages,
        systemPrompt: 'You are a helpful AI assistant. Provide clear, concise, and accurate answers. Use conversation context when relevant.',
      });

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`=== DIRECT SUCCESS in ${duration}s ===`, response.content.substring(0, 100));

      // Estimate tokens (rough approximation: 1 token ≈ 4 chars)
      const inputTokens = Math.ceil(queryData.query.length / 4);
      const outputTokens = Math.ceil(response.content.length / 4);
      const totalTokens = inputTokens + outputTokens;

      // Estimate cost for Claude Sonnet 4 (rough: $3/1M input, $15/1M output)
      const estimatedCost = (inputTokens * 0.000003) + (outputTokens * 0.000015);

      // Track usage for Mother Base
      trackUsage('anthropic', 'claude-sonnet-4-20250514', inputTokens, outputTokens, estimatedCost);

      // Update query with results
      updateQueryStatus(queryId, 'complete', {
        finalAnswer: response.content,
        methodology: 'direct',
        duration: parseFloat(duration),
      });

      // Update database
      updateQuery(queryId, {
        tokens_used: totalTokens,
        cost: estimatedCost,
      });

      addQueryEvent(queryId, 'complete', {
        totalCost: estimatedCost,
        totalTokens: { input: inputTokens, output: outputTokens, total: totalTokens },
        duration: parseFloat(duration),
        mode: 'direct',
      });

      return;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Direct mode failed';
      console.error('=== DIRECT MODE FAILED ===', errorMessage);
      throw err;
    }
  }

  // Validate API keys before starting
  const missingKeys: string[] = [];
  if (!process.env.ANTHROPIC_API_KEY) missingKeys.push('Anthropic (Mother Base)');
  if (!process.env.DEEPSEEK_API_KEY) missingKeys.push('DeepSeek');
  if (!process.env.XAI_API_KEY) missingKeys.push('xAI (Grok)');
  if (!process.env.MISTRAL_API_KEY) missingKeys.push('Mistral');

  if (missingKeys.length > 0) {
    const errorMessage = `Missing API keys: ${missingKeys.join(', ')}. Please configure them in Settings.`;
    updateQueryStatus(queryId, 'error', undefined, errorMessage);
    addQueryEvent(queryId, 'error', {
      message: errorMessage,
      hint: 'Add your API keys in the Settings page to enable query execution.'
    });
    return;
  }

  updateQueryStatus(queryId, 'processing');

  try {
    // Configuration (can be made dynamic later)
    const motherBaseFamily: ModelFamily = 'anthropic';
    const slot1Family: ModelFamily = 'deepseek';
    const slot2Family: ModelFamily = 'xai';

    // Execute the appropriate flow/methodology
    let result: any;

    console.log(`[Query Route] Executing methodology: ${flowType} for query: ${queryId}`);

    if (flowType === 'gtp') {
      // GTP (Generative Thoughts Process) - parallel Flash architecture
      console.log(`[Query Route] Using GTP executor`);
      const gtpResult = await executeGTPWithEvents(
        queryId,
        queryData.query,
        motherBaseFamily,
        slot1Family,
        slot2Family
      );

      // Format GTP result to match existing result structure
      result = {
        finalAnswer: gtpResult.result.synthesis.content,
        costReport: gtpResult.costReport,
        methodology: 'gtp',
      };
    } else if (flowType === 'direct') {
      // Direct: Single AI response for simple factual questions
      // Map to Flow A (Mother Base direct response)
      console.log(`[Query Route] Using Direct methodology (Flow A)`);
      result = await executeFlowAWithEvents(
        queryId,
        queryData.query,
        motherBaseFamily,
        slot1Family,
        slot2Family
      );
      result.methodology = 'direct';
    } else if (flowType === 'cot') {
      // Chain of Thought: Step-by-step reasoning
      // Map to Flow B with explicit CoT instructions
      console.log(`[Query Route] Using Chain of Thought methodology (Flow B)`);
      result = await executeFlowBWithEvents(
        queryId,
        queryData.query,
        'ResearchAgent',
        motherBaseFamily,
        slot1Family,
        slot2Family
      );
      result.methodology = 'cot';
    } else if (flowType === 'aot') {
      // Atom of Thoughts: Decompose → solve → contract
      // Map to Flow B with decomposition strategy
      console.log(`[Query Route] Using Atom of Thoughts methodology (Flow B)`);
      result = await executeFlowBWithEvents(
        queryId,
        queryData.query,
        'ResearchAgent',
        motherBaseFamily,
        slot1Family,
        slot2Family
      );
      result.methodology = 'aot';
    } else if (flowType === 'auto') {
      // Auto: Smart methodology selection based on query analysis
      // Default to Flow A for now
      console.log(`[Query Route] Using Auto methodology (Flow A)`);
      result = await executeFlowAWithEvents(
        queryId,
        queryData.query,
        motherBaseFamily,
        slot1Family,
        slot2Family
      );
      result.methodology = 'auto';
    } else if (queryData.flow === 'A' || flowType === 'A') {
      // Flow A: Mother Base Decision (backward compatibility)
      console.log(`[Query Route] Using Flow A`);
      result = await executeFlowAWithEvents(
        queryId,
        queryData.query,
        motherBaseFamily,
        slot1Family,
        slot2Family
      );
    } else {
      // Flow B: Sub-Agent Execution (backward compatibility)
      console.log(`[Query Route] Using Flow B`);
      result = await executeFlowBWithEvents(
        queryId,
        queryData.query,
        'ResearchAgent',
        motherBaseFamily,
        slot1Family,
        slot2Family
      );
    }

    // Save token usage to database
    if (result.costReport && result.costReport.providerUsage) {
      for (const usage of result.costReport.providerUsage) {
        // Get model name based on family
        let modelName = 'unknown';
        switch (usage.family) {
          case 'anthropic':
            modelName = 'claude-sonnet-4-20250514';
            break;
          case 'deepseek':
            modelName = 'deepseek-chat';
            break;
          case 'xai':
            modelName = 'grok-3';
            break;
          case 'mistral':
            modelName = 'mistral-small-latest';
            break;
        }

        trackUsage(
          usage.family,
          modelName,
          usage.totalInputTokens,
          usage.totalOutputTokens,
          usage.totalCost
        );
      }
    }

    // Update query status with token and cost data
    const totalTokens = result.costReport?.totalTokens?.total || 0;
    const totalCost = result.costReport?.totalCost || 0;

    updateQueryStatus(queryId, 'complete', result);

    // Also update tokens_used and cost in database
    updateQuery(queryId, {
      tokens_used: totalTokens,
      cost: totalCost,
    });

    // Emit completion event
    addQueryEvent(queryId, 'complete', {
      totalCost,
      totalTokens: result.costReport?.totalTokens || 0,
    });
  } catch (error) {
    console.error('AkhAI execution error:', error);
    let errorMessage = 'An unexpected error occurred';
    let hint = '';

    if (error instanceof Error) {
      errorMessage = error.message;

      // Provide helpful hints based on error type
      if (errorMessage.includes('API key')) {
        hint = 'Check that your API keys are correctly configured in Settings.';
      } else if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
        hint = 'The AI provider took too long to respond. Please try again.';
      } else if (errorMessage.includes('rate limit')) {
        hint = 'You have exceeded the API rate limit. Please wait a few minutes and try again.';
      } else if (errorMessage.includes('network') || errorMessage.includes('ENOTFOUND')) {
        hint = 'Network error. Please check your internet connection.';
      } else {
        hint = 'Please try again or contact support if the problem persists.';
      }
    }

    updateQueryStatus(queryId, 'error', undefined, errorMessage);
    addQueryEvent(queryId, 'error', {
      message: errorMessage,
      hint: hint || 'Please try again later.'
    });
  }
}
