/**
 * AkhAI Execution Wrapper with Event Streaming
 *
 * This module wraps @akhai/core execution and emits events for real-time UI updates.
 */

import { createAkhAI } from '@akhai/core';
import type { ModelFamily, FlowAResult, FlowBResult } from '@akhai/core';
import { GTPExecutor, analyzeQuery, type GTPResult } from '@akhai/core';
import { createProviderFromFamily } from '@akhai/core';
import { addQueryEvent, type QueryEvent } from './query-store';
import { emitQueryEvent } from './event-emitter';

/**
 * Timeout wrapper for execution - prevents queries from hanging indefinitely
 */
async function withExecutionTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  queryId: string
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => {
      console.error(`[AkhAI] ⏱️  Query ${queryId} timed out after ${timeoutMs/1000}s`);
      reject(new Error(`Query execution timed out after ${timeoutMs/1000} seconds. The AI providers may be experiencing delays.`));
    }, timeoutMs);
  });
  return Promise.race([promise, timeout]);
}

/**
 * Cost report from CostTracker
 */
interface ProviderUsage {
  family: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  requestCount: number;
}

interface CostReport {
  totalCost: number;
  totalTokens: {
    input: number;
    output: number;
    total: number;
  };
  providerUsage: ProviderUsage[];
  formattedReport: string;
}

export interface FlowAResultWithCost extends FlowAResult {
  costReport: CostReport;
}

export interface FlowBResultWithCost extends FlowBResult {
  costReport: CostReport;
}

export interface GTPResultWithCost {
  result: GTPResult;
  costReport: CostReport;
}

/**
 * Helper to emit events to both query-store and event-emitter (SSE)
 */
function emitEvent(queryId: string, type: QueryEvent['type'], data: any) {
  const event = { type, data, timestamp: Date.now() };

  // Store in query-store for persistence
  addQueryEvent(queryId, type, data);

  // Emit to SSE subscribers for real-time updates
  emitQueryEvent(queryId, event);
}

/**
 * Execute Flow A (Mother Base Decision) with event streaming
 *
 * @param queryId - Query ID for event streaming
 * @param query - The query to process
 * @param motherBaseFamily - Mother Base model family
 * @param slot1Family - Advisor Slot 1 family
 * @param slot2Family - Advisor Slot 2 family
 * @returns Flow A result with cost report
 */
export async function executeFlowAWithEvents(
  queryId: string,
  query: string,
  motherBaseFamily: ModelFamily = 'anthropic',
  slot1Family: ModelFamily = 'deepseek',
  slot2Family: ModelFamily = 'xai'
): Promise<FlowAResultWithCost> {
  console.log(`[AkhAI] 🚀 Starting Flow A for query: ${queryId}`);
  console.log(`[AkhAI] 📝 Query text: ${query.substring(0, 100)}${query.length > 100 ? '...' : ''}`);
  console.log(`[AkhAI] 🏢 Mother Base: ${motherBaseFamily}`);
  console.log(`[AkhAI] 👥 Advisors: Slot1=${slot1Family}, Slot2=${slot2Family}, Slot3=mistral (fixed)`);

  const akhai = createAkhAI(motherBaseFamily);

  // Set API keys from environment
  akhai.setApiKeys({
    anthropic: process.env.ANTHROPIC_API_KEY,
    deepseek: process.env.DEEPSEEK_API_KEY,
    xai: process.env.XAI_API_KEY,
    mistral: process.env.MISTRAL_API_KEY,
  });

  // Set web search key if available
  if (process.env.BRAVE_SEARCH_API_KEY) {
    akhai.setWebSearchKey(process.env.BRAVE_SEARCH_API_KEY);
    console.log(`[AkhAI] 🔍 Web search enabled (Brave API)`);
  }

  // Setup Mother Base and Advisor Layer
  console.log(`[AkhAI] ⚙️  Setting up Mother Base...`);
  akhai.setupMotherBase();
  console.log(`[AkhAI] ⚙️  Setting up Advisor Layer...`);
  akhai.setupAdvisorLayer(slot1Family, slot2Family);

  // Create real-time callbacks that emit events as execution happens
  const callbacks = {
    onAdvisorStart: (slot: number, family: string, round: number) => {
      emitEvent(queryId, 'advisor-start', {
        round,
        slot,
        family,
        status: 'thinking',
        response: `${family} is analyzing...`,
      });
    },
    onAdvisorComplete: (slot: number, family: string, round: number, output: string) => {
      emitEvent(queryId, 'advisor-complete', {
        round,
        slot,
        family,
        status: 'complete',
        response: output,
      });
    },
    onConsensusCheck: (round: number, reached: boolean) => {
      if (reached) {
        emitEvent(queryId, 'consensus-reached', {
          round,
        });
      }
    },
    onRoundComplete: (round: number, totalRounds: number) => {
      emitEvent(queryId, 'round-complete', {
        round,
        totalRounds,
      });
    },
    onRedactorStart: () => {
      emitEvent(queryId, 'redactor-start', {
        status: 'analyzing',
        output: 'Redactor is synthesizing advisor outputs...',
      });
    },
    onRedactorComplete: (synthesis: string, family: string) => {
      emitEvent(queryId, 'redactor-complete', {
        status: 'complete',
        output: synthesis,
        family,
      });
    },
    onMotherBaseReview: (exchange: number, approved: boolean, response: string) => {
      emitEvent(queryId, 'mother-base-review', {
        exchange,
        approved,
        decision: response,
      });
    },
  };

  // Execute Flow A with callbacks - wrapped in timeout (3 minutes)
  console.log(`[AkhAI] 🔥 Executing Mother Base Flow (timeout: 180s)...`);
  const startTime = Date.now();

  try {
    const result = await withExecutionTimeout(
      akhai.executeMotherBaseFlow(query, callbacks),
      180000, // 3 minutes
      queryId
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[AkhAI] ✅ Flow A completed successfully in ${duration}s`);

    // Get cost tracking data
    const costReport = akhai.getCostReport();
    console.log(`[AkhAI] 💰 Total cost: $${costReport.totalCost.toFixed(4)}`);
    console.log(`[AkhAI] 🔢 Total tokens: ${costReport.totalTokens.total}`);

    // Execution complete - all events were already emitted in real-time via callbacks
    return { ...result, costReport };
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`[AkhAI] ❌ Flow A failed after ${duration}s:`, error);
    throw error; // Re-throw so the query route can handle it
  }
}

/**
 * Execute Flow B (Sub-Agent Execution) with event streaming
 *
 * @param queryId - Query ID for event streaming
 * @param query - The query to process
 * @param agentName - Sub-Agent name to use
 * @param motherBaseFamily - Mother Base model family
 * @param slot1Family - Advisor Slot 1 family
 * @param slot2Family - Advisor Slot 2 family
 * @returns Flow B result with cost report
 */
export async function executeFlowBWithEvents(
  queryId: string,
  query: string,
  agentName: string = 'ResearchAgent',
  motherBaseFamily: ModelFamily = 'anthropic',
  slot1Family: ModelFamily = 'deepseek',
  slot2Family: ModelFamily = 'xai'
): Promise<FlowBResultWithCost> {
  console.log(`[AkhAI] 🚀 Starting Flow B for query: ${queryId}`);
  console.log(`[AkhAI] 📝 Query text: ${query.substring(0, 100)}${query.length > 100 ? '...' : ''}`);
  console.log(`[AkhAI] 🤖 Sub-Agent: ${agentName}`);
  console.log(`[AkhAI] 🏢 Mother Base: ${motherBaseFamily}`);

  const akhai = createAkhAI(motherBaseFamily);

  // Set API keys from environment
  akhai.setApiKeys({
    anthropic: process.env.ANTHROPIC_API_KEY,
    deepseek: process.env.DEEPSEEK_API_KEY,
    xai: process.env.XAI_API_KEY,
    mistral: process.env.MISTRAL_API_KEY,
  });

  // Set web search key if available
  if (process.env.BRAVE_SEARCH_API_KEY) {
    akhai.setWebSearchKey(process.env.BRAVE_SEARCH_API_KEY);
    console.log(`[AkhAI] 🔍 Web search enabled (Brave API)`);
  }

  // Setup Mother Base and Advisor Layer
  console.log(`[AkhAI] ⚙️  Setting up Mother Base...`);
  akhai.setupMotherBase();
  console.log(`[AkhAI] ⚙️  Setting up Advisor Layer...`);
  akhai.setupAdvisorLayer(slot1Family, slot2Family);

  // Register sub-agent
  console.log(`[AkhAI] ⚙️  Registering sub-agent: ${agentName}...`);
  akhai.registerSubAgent(agentName);

  // Create real-time callbacks for Flow B
  const callbacks = {
    onAdvisorStart: (slot: number, family: string, round: number) => {
      emitEvent(queryId, 'advisor-start', {
        round,
        slot,
        family,
        status: 'thinking',
        response: `${family} is analyzing...`,
      });
    },
    onAdvisorComplete: (slot: number, family: string, round: number, output: string) => {
      emitEvent(queryId, 'advisor-complete', {
        round,
        slot,
        family,
        status: 'complete',
        response: output,
      });
    },
    onConsensusCheck: (round: number, reached: boolean) => {
      if (reached) {
        emitEvent(queryId, 'consensus-reached', {
          round,
        });
      }
    },
    onRoundComplete: (round: number, totalRounds: number) => {
      emitEvent(queryId, 'round-complete', {
        round,
        totalRounds,
      });
    },
    onRedactorStart: () => {
      emitEvent(queryId, 'redactor-start', {
        status: 'analyzing',
        output: 'Redactor is synthesizing advisor outputs...',
      });
    },
    onRedactorComplete: (synthesis: string, family: string) => {
      emitEvent(queryId, 'redactor-complete', {
        status: 'complete',
        output: synthesis,
        family,
      });
    },
    onSubAgentStart: (agentName: string, exchange: number) => {
      emitEvent(queryId, 'sub-agent-start', {
        agent: agentName,
        exchange,
        status: 'working',
      });
    },
    onSubAgentComplete: (agentName: string, exchange: number, output: string, complete: boolean) => {
      emitEvent(queryId, 'sub-agent-complete', {
        agent: agentName,
        exchange,
        response: output,
        complete,
      });
    },
    onMotherBaseReview: (exchange: number, approved: boolean, response: string) => {
      emitEvent(queryId, 'mother-base-review', {
        exchange,
        approved,
        decision: response,
      });
    },
  };

  // Execute Flow B with callbacks - wrapped in timeout (5 minutes for sub-agent work)
  console.log(`[AkhAI] 🔥 Executing Sub-Agent Flow (timeout: 300s)...`);
  const startTime = Date.now();

  try {
    const result = await withExecutionTimeout(
      akhai.executeSubAgentFlow(query, agentName, callbacks),
      300000, // 5 minutes (sub-agents may need more time)
      queryId
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[AkhAI] ✅ Flow B completed successfully in ${duration}s`);

    // Get cost tracking data
    const costReport = akhai.getCostReport();
    console.log(`[AkhAI] 💰 Total cost: $${costReport.totalCost.toFixed(4)}`);
    console.log(`[AkhAI] 🔢 Total tokens: ${costReport.totalTokens.total}`);

    // Execution complete - all events were already emitted in real-time via callbacks
    return { ...result, costReport };
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`[AkhAI] ❌ Flow B failed after ${duration}s:`, error);
    throw error; // Re-throw so the query route can handle it
  }
}

/**
 * Execute GTP (Generative Thoughts Process) with event streaming
 *
 * @param queryId - Query ID for event streaming
 * @param query - The query to process
 * @param motherBaseFamily - Mother Base model family
 * @param slot1Family - Advisor Slot 1 family
 * @param slot2Family - Advisor Slot 2 family
 * @returns GTP result with cost report
 */
export async function executeGTPWithEvents(
  queryId: string,
  query: string,
  motherBaseFamily: ModelFamily = 'anthropic',
  slot1Family: ModelFamily = 'deepseek',
  slot2Family: ModelFamily = 'xai'
): Promise<GTPResultWithCost> {
  console.log('[GTP] Starting GTP execution for query: ' + queryId);
  console.log('[GTP] Query text: ' + query.substring(0, 100) + (query.length > 100 ? '...' : ''));
  console.log('[GTP] Mother Base: ' + motherBaseFamily);
  console.log('[GTP] Advisors: Slot1=' + slot1Family + ', Slot2=' + slot2Family + ', Slot3=mistral (fixed)');

  // Analyze query to get complexity and characteristics
  console.log('[GTP] Analyzing query...');
  const queryAnalysis = analyzeQuery(query);
  console.log('[GTP]    Complexity: ' + (queryAnalysis.complexity * 100).toFixed(0) + '%');
  console.log('[GTP]    Type: ' + queryAnalysis.queryType);

  emitEvent(queryId, 'gtp-analysis', {
    complexity: queryAnalysis.complexity,
    queryType: queryAnalysis.queryType,
    requiresMultiplePerspectives: queryAnalysis.requiresMultiplePerspectives,
  });

  // Create providers for each advisor slot
  console.log('[GTP] Creating model providers...');

  const apiKeys = {
    anthropic: process.env.ANTHROPIC_API_KEY!,
    deepseek: process.env.DEEPSEEK_API_KEY!,
    xai: process.env.XAI_API_KEY!,
    mistral: process.env.MISTRAL_API_KEY!,
  };

  const motherBaseProvider = createProviderFromFamily(motherBaseFamily, apiKeys);
  const slot1Provider = createProviderFromFamily(slot1Family, apiKeys);
  const slot2Provider = createProviderFromFamily(slot2Family, apiKeys);
  const slot3Provider = createProviderFromFamily('mistral', apiKeys);

  const advisorSlots = [
    { slot: 1, family: slot1Family, provider: slot1Provider },
    { slot: 2, family: slot2Family, provider: slot2Provider },
    { slot: 3, family: 'mistral' as ModelFamily, provider: slot3Provider },
  ];

  // Create GTP executor
  const gtpExecutor = new GTPExecutor();

  // Setup real-time callbacks that emit events
  const callbacks = {
    onFlashPrepare: (frame: any) => {
      emitEvent(queryId, 'flash-prepare', {
        advisorCount: frame.advisorTasks.length,
        roles: frame.advisorTasks.map((t: any) => t.role),
      });
    },
    onFlashBroadcast: (advisorCount: number) => {
      emitEvent(queryId, 'flash-broadcast', {
        advisorCount,
        status: 'Broadcasting to all advisors in parallel...',
      });
    },
    onAdvisorStart: (slot: number, family: ModelFamily, role: string) => {
      emitEvent(queryId, 'advisor-start', {
        slot,
        family,
        role,
        status: 'thinking',
        response: family + ' (' + role + ') is analyzing...',
      });
    },
    onAdvisorComplete: (response: any) => {
      emitEvent(queryId, 'advisor-complete', {
        slot: response.slot,
        family: response.family,
        role: response.role,
        status: 'complete',
        confidence: response.confidence,
        keyPoints: response.keyPoints,
        response: response.content.substring(0, 200) + '...',
      });
    },
    onAdvisorFailed: (slot: number, family: ModelFamily, error: string) => {
      emitEvent(queryId, 'advisor-failed', {
        slot,
        family,
        error,
      });
    },
    onMergeUpdate: (state: any) => {
      emitEvent(queryId, 'merge-update', {
        responsesReceived: state.metadata.responsesReceived,
        responsesExpected: state.metadata.responsesExpected,
        insightsCount: state.mergedInsights.length,
        agreementLevel: state.consensusState.agreementLevel,
      });
    },
    onQuorumProgress: (result: any) => {
      emitEvent(queryId, 'quorum-progress', {
        responsesReceived: result.responsesReceived,
        responsesExpected: result.responsesExpected,
        agreementLevel: result.agreementLevel,
        timeElapsed: result.timeElapsed,
        reached: result.reached,
        reason: result.reason,
      });
    },
    onQuorumReached: (result: any) => {
      emitEvent(queryId, 'quorum-reached', {
        reason: result.reason,
        responsesReceived: result.responsesReceived,
        agreementLevel: result.agreementLevel,
        timeElapsed: result.timeElapsed,
      });
    },
    onSynthesisStart: () => {
      emitEvent(queryId, 'synthesis-start', {
        status: 'Mother Base is synthesizing advisor insights...',
      });
    },
    onSynthesisComplete: (synthesis: string, family: ModelFamily) => {
      emitEvent(queryId, 'synthesis-complete', {
        status: 'complete',
        output: synthesis,
        family,
      });
    },
  };

  // Execute GTP with callbacks - wrapped in timeout (2 minutes for parallel execution)
  console.log('[GTP] Executing GTP methodology (timeout: 120s)...');
  const startTime = Date.now();

  try {
    const result = await withExecutionTimeout(
      gtpExecutor.execute({
        query,
        queryAnalysis,
        advisorSlots,
        motherBaseProvider,
        callbacks,
      }),
      120000, // 2 minutes (GTP is faster than sequential flows)
      queryId
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('[GTP] GTP completed successfully in ' + duration + 's');
    console.log('[GTP] Total cost: $' + result.metrics.totalCost.toFixed(4));
    console.log('[GTP] Total tokens: ' + result.metrics.totalTokens.total);
    console.log('[GTP] Success rate: ' + (result.metrics.successRate * 100).toFixed(0) + '%');
    console.log('[GTP] Agreement: ' + (result.livingDatabase.consensusState.agreementLevel * 100).toFixed(0) + '%');

    // Format cost report to match existing interface
    const costReport: CostReport = {
      totalCost: result.metrics.totalCost,
      totalTokens: result.metrics.totalTokens,
      providerUsage: [], // TODO: Extract from GTP metrics if needed
      formattedReport: 'GTP Execution Complete\nTotal: $' + result.metrics.totalCost.toFixed(4) + '\nTokens: ' + result.metrics.totalTokens.total,
    };

    return { result, costReport };
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error('[GTP] GTP failed after ' + duration + 's:', error);
    throw error;
  }
}
