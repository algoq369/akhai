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

export async function POST(request: NextRequest) {
  try {
    const { query, flow, methodology } = await request.json();

    console.log('=== QUERY RECEIVED ===', { query: query.substring(0, 50), methodology, flow });

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const queryId = nanoid(10);

    // Create query in database and memory
    // For backward compatibility, flow can still be 'A' or 'B', or use methodology
    const flowType = methodology || flow || 'A';
    createQueryRecord(queryId, query, flowType);

    // Start processing in background with real AkhAI integration
    processQuery(queryId, flowType).catch((error) => {
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

async function processQuery(queryId: string, flowType: string) {
  console.log('=== PROCESS QUERY CALLED ===', { queryId, flowType });

  const queryData = queries.get(queryId);
  if (!queryData) return;

  // BYPASS TEST: Direct provider call for 'direct' methodology
  if (flowType === 'direct') {
    console.log('=== DIRECT TEST BYPASS ===');
    try {
      const { createProviderFromFamily } = await import('@akhai/core');
      const provider = createProviderFromFamily('anthropic', {
        anthropic: process.env.ANTHROPIC_API_KEY!,
        deepseek: process.env.DEEPSEEK_API_KEY!,
        xai: process.env.XAI_API_KEY!,
        mistral: process.env.MISTRAL_API_KEY!,
      });

      console.log('=== PROVIDER CREATED, CALLING COMPLETE ===');
      const response = await provider.complete({
        messages: [{ role: 'user', content: queryData.query }],
        systemPrompt: 'Be helpful and concise.',
      });

      console.log('=== DIRECT SUCCESS ===', response.content.substring(0, 100));
      updateQueryStatus(queryId, 'complete', { finalAnswer: response.content });
      addQueryEvent(queryId, 'complete', { totalCost: 0.001, totalTokens: { input: 0, output: 0, total: 0 } });
      return;
    } catch (err) {
      console.error('=== DIRECT FAILED ===', err);
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
