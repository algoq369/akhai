/**
 * GTP (Generative Thoughts Process) Executor
 *
 * Main orchestrator for the bio-inspired parallel Flash architecture.
 * Coordinates all GTP components to achieve 3x speedup over sequential execution.
 *
 * Execution flow:
 * 1. Build Flash Context Frame (FlashContextBuilder)
 * 2. Initialize Living Database
 * 3. Start Quorum Manager
 * 4. Broadcast to all advisors (FlashBroadcaster) - PARALLEL
 * 5. Merge responses into Living Database - REAL-TIME
 * 6. Check quorum
 * 7. Mother Base synthesis
 * 8. Return GTPResult
 */

import type {
  GTPResult,
  GTPCallbacks,
  FlashContextFrame,
  QueryAnalysis,
  AdvisorResponse,
  GTPMetrics,
} from '../types.js';
import type { IModelProvider } from '../../models/ModelProviderFactory.js';
import type { ModelFamily } from '../../models/types.js';
import { FlashContextBuilder } from './FlashContextBuilder.js';
import { FlashBroadcaster } from './FlashBroadcaster.js';
import { LivingDatabase } from './LivingDatabase.js';
import { QuorumManager } from './QuorumManager.js';

/**
 * Advisor slot configuration
 */
interface AdvisorSlot {
  slot: number;
  family: ModelFamily;
  provider: IModelProvider;
}

/**
 * GTP Execution Options
 */
export interface GTPExecutionOptions {
  /** User query */
  query: string;

  /** Query analysis (complexity, type, etc.) */
  queryAnalysis: QueryAnalysis;

  /** Advisor providers (slots 1-4) */
  advisorSlots: AdvisorSlot[];

  /** Mother Base provider for synthesis */
  motherBaseProvider: IModelProvider;

  /** Progress callbacks */
  callbacks?: GTPCallbacks;

  /** Quorum configuration override */
  quorumConfig?: {
    minResponses?: number;
    earlyExitThreshold?: number;
    timeout?: number;
  };
}

export class GTPExecutor {
  private contextBuilder: FlashContextBuilder;
  private broadcaster: FlashBroadcaster;

  constructor() {
    this.contextBuilder = new FlashContextBuilder();
    this.broadcaster = new FlashBroadcaster();

    console.log(`[GTPExecutor] Initialized`);
  }

  /**
   * Execute GTP methodology end-to-end
   *
   * @param options - Execution options
   * @returns GTP result with synthesis and metrics
   */
  async execute(options: GTPExecutionOptions): Promise<GTPResult> {
    const { query, queryAnalysis, advisorSlots, motherBaseProvider, callbacks, quorumConfig } = options;

    console.log(`[GTPExecutor] 🚀 Starting GTP execution for: "${query.substring(0, 60)}..."`);
    console.log(`[GTPExecutor]    Complexity: ${(queryAnalysis.complexity * 100).toFixed(0)}%`);
    console.log(`[GTPExecutor]    Query Type: ${queryAnalysis.queryType}`);
    console.log(`[GTPExecutor]    Advisors: ${advisorSlots.length}`);

    const executionStartTime = Date.now();
    const metrics: Partial<GTPMetrics> = {
      advisorTimings: {},
    };

    // =======================
    // Phase 1: Build Flash Context Frame
    // =======================
    console.log(`[GTPExecutor] 📝 Phase 1: Building Flash Context Frame...`);
    const flashPrepStart = Date.now();

    const advisorSlotConfigs = advisorSlots.map(s => ({
      slot: s.slot,
      family: s.family,
    }));

    const flashContext: FlashContextFrame = this.contextBuilder.build(
      query,
      queryAnalysis,
      advisorSlotConfigs
    );

    metrics.flashPrepTime = Date.now() - flashPrepStart;
    console.log(`[GTPExecutor] ✅ Flash context built in ${metrics.flashPrepTime}ms`);

    callbacks?.onFlashPrepare?.(flashContext);

    // =======================
    // Phase 2: Initialize Living Database
    // =======================
    console.log(`[GTPExecutor] 🗄️  Phase 2: Initializing Living Database...`);
    const livingDatabase = new LivingDatabase(advisorSlots.length);

    // =======================
    // Phase 3: Start Quorum Manager
    // =======================
    console.log(`[GTPExecutor] 🎯 Phase 3: Starting Quorum Manager...`);
    const quorumManager = new QuorumManager(quorumConfig);
    quorumManager.start();

    // =======================
    // Phase 4: Broadcast to All Advisors (PARALLEL)
    // =======================
    console.log(`[GTPExecutor] ⚡ Phase 4: Broadcasting to all advisors in PARALLEL...`);
    const broadcastStart = Date.now();

    const advisorProviders = advisorSlots.map(s => ({
      slot: s.slot,
      family: s.family,
      provider: s.provider,
    }));

    // Wrap callbacks to merge responses in real-time
    const mergeCallbacks: GTPCallbacks = {
      onFlashBroadcast: callbacks?.onFlashBroadcast,
      onAdvisorStart: callbacks?.onAdvisorStart,
      onAdvisorComplete: (response: AdvisorResponse) => {
        // Merge into living database immediately
        const state = livingDatabase.merge(response);
        callbacks?.onAdvisorComplete?.(response);
        callbacks?.onMergeUpdate?.(state);

        // Check quorum after each response
        const quorumResult = quorumManager.check(state);
        callbacks?.onQuorumProgress?.(quorumResult);

        if (quorumResult.reached) {
          console.log(`[GTPExecutor] 🎯 Quorum reached: ${quorumResult.reason}`);
          callbacks?.onQuorumReached?.(quorumResult);
        }
      },
      onAdvisorFailed: callbacks?.onAdvisorFailed,
    };

    const broadcastResult = await this.broadcaster.broadcast(
      flashContext,
      advisorProviders,
      mergeCallbacks
    );

    metrics.broadcastTime = Date.now() - broadcastStart;
    console.log(`[GTPExecutor] ✅ Broadcast complete in ${(metrics.broadcastTime / 1000).toFixed(2)}s`);
    console.log(`[GTPExecutor]    Success: ${broadcastResult.successCount}/${advisorSlots.length}`);
    console.log(`[GTPExecutor]    Failed: ${broadcastResult.failureCount}/${advisorSlots.length}`);

    // Store advisor timings
    broadcastResult.responses.forEach(response => {
      if (response.timing.duration) {
        metrics.advisorTimings![response.slot] = response.timing.duration;
      }
    });

    // =======================
    // Phase 5: Final Quorum Check
    // =======================
    console.log(`[GTPExecutor] 🎯 Phase 5: Final quorum check...`);
    const quorumStart = Date.now();

    const finalState = livingDatabase.getState();
    const quorumResult = quorumManager.check(finalState);

    metrics.quorumWaitTime = Date.now() - quorumStart;

    if (!quorumResult.reached) {
      console.warn(`[GTPExecutor] ⚠️  Quorum not reached, proceeding anyway with ${finalState.metadata.responsesReceived} responses`);
    }

    // =======================
    // Phase 6: Generate Summary for Mother Base
    // =======================
    console.log(`[GTPExecutor] 📊 Phase 6: Generating summary for Mother Base...`);
    const mergeStart = Date.now();

    const summary = livingDatabase.generateSummary();

    metrics.mergeTime = Date.now() - mergeStart;
    console.log(`[GTPExecutor] ✅ Summary generated in ${metrics.mergeTime}ms`);

    // =======================
    // Phase 7: Mother Base Synthesis
    // =======================
    console.log(`[GTPExecutor] 🧠 Phase 7: Mother Base synthesis...`);
    callbacks?.onSynthesisStart?.();

    const synthesisStart = Date.now();

    const synthesisPrompt = this.buildSynthesisPrompt(query, summary, finalState);
    const synthesisSystemPrompt = `You are Mother Base, the master synthesizer in a multi-AI consensus system.

Your role:
- Synthesize insights from multiple AI advisors into a coherent, comprehensive response
- Balance diverse perspectives while highlighting areas of agreement and disagreement
- Provide a final recommendation or conclusion based on collective wisdom
- Be clear, concise, and actionable

The advisors have different roles:
- Technical: implementation details, feasibility
- Strategic: market analysis, competition
- Creative: unconventional ideas, edge cases
- Critical: risks, weaknesses, challenges

Synthesize their insights into a unified response that addresses the user's query.`;

    let synthesisContent: string;
    let synthesisUsage: { inputTokens: number; outputTokens: number } | undefined;

    try {
      const synthesisResponse = await motherBaseProvider.complete({
        messages: [{ role: 'user', content: synthesisPrompt }],
        systemPrompt: synthesisSystemPrompt,
      });

      synthesisContent = synthesisResponse.content;
      synthesisUsage = synthesisResponse.usage;

      console.log(`[GTPExecutor] ✅ Synthesis complete`);
      callbacks?.onSynthesisComplete?.(synthesisContent, motherBaseProvider.family);
    } catch (error: any) {
      console.error(`[GTPExecutor] ❌ Synthesis failed:`, error.message);
      // Fallback to summary
      synthesisContent = `# Synthesis Failed\n\nMother Base synthesis encountered an error. Here's the advisor summary:\n\n${summary}`;
      synthesisUsage = undefined;
    }

    metrics.synthesisTime = Date.now() - synthesisStart;

    // =======================
    // Phase 8: Calculate Final Metrics
    // =======================
    const totalDuration = Date.now() - executionStartTime;

    // Calculate token usage
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    broadcastResult.responses.forEach(response => {
      if (response.usage) {
        totalInputTokens += response.usage.inputTokens;
        totalOutputTokens += response.usage.outputTokens;
      }
    });

    if (synthesisUsage) {
      totalInputTokens += synthesisUsage.inputTokens;
      totalOutputTokens += synthesisUsage.outputTokens;
    }

    const totalTokens = totalInputTokens + totalOutputTokens;

    // Calculate success rate
    const successRate = broadcastResult.successCount / advisorSlots.length;

    // Estimate cost (rough approximation, adjust based on actual pricing)
    const inputCost = (totalInputTokens / 1_000_000) * 3.0; // $3/M tokens input
    const outputCost = (totalOutputTokens / 1_000_000) * 15.0; // $15/M tokens output
    const totalCost = inputCost + outputCost;

    const finalMetrics: GTPMetrics = {
      totalDuration,
      flashPrepTime: metrics.flashPrepTime!,
      broadcastTime: metrics.broadcastTime!,
      mergeTime: metrics.mergeTime!,
      quorumWaitTime: metrics.quorumWaitTime!,
      synthesisTime: metrics.synthesisTime!,
      advisorTimings: metrics.advisorTimings!,
      successRate,
      totalTokens: {
        input: totalInputTokens,
        output: totalOutputTokens,
        total: totalTokens,
      },
      totalCost,
    };

    // =======================
    // Phase 9: Build Final Result
    // =======================
    const result: GTPResult = {
      flashContext,
      livingDatabase: finalState,
      quorum: quorumResult,
      synthesis: {
        content: synthesisContent,
        family: motherBaseProvider.family,
        confidence: finalState.consensusState.confidence,
        timestamp: Date.now(),
      },
      metrics: finalMetrics,
      methodology: 'gtp',
    };

    // =======================
    // Final Summary
    // =======================
    console.log(`[GTPExecutor] ✅ GTP execution complete in ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`[GTPExecutor] 📊 Breakdown:`);
    console.log(`[GTPExecutor]    Flash prep: ${metrics.flashPrepTime}ms`);
    console.log(`[GTPExecutor]    Broadcast (parallel): ${(metrics.broadcastTime! / 1000).toFixed(2)}s`);
    console.log(`[GTPExecutor]    Merge: ${metrics.mergeTime}ms`);
    console.log(`[GTPExecutor]    Quorum: ${metrics.quorumWaitTime}ms`);
    console.log(`[GTPExecutor]    Synthesis: ${(metrics.synthesisTime! / 1000).toFixed(2)}s`);
    console.log(`[GTPExecutor] 💰 Tokens: ${totalTokens.toLocaleString()} (${totalInputTokens.toLocaleString()} in, ${totalOutputTokens.toLocaleString()} out)`);
    console.log(`[GTPExecutor] 💵 Estimated cost: $${totalCost.toFixed(4)}`);
    console.log(`[GTPExecutor] 🎯 Success rate: ${(successRate * 100).toFixed(0)}%`);
    console.log(`[GTPExecutor] 🤝 Consensus: ${(finalState.consensusState.agreementLevel * 100).toFixed(0)}% agreement`);

    return result;
  }

  /**
   * Build synthesis prompt for Mother Base
   *
   * @param query - Original query
   * @param summary - Living database summary
   * @param state - Final living database state
   * @returns Synthesis prompt
   */
  private buildSynthesisPrompt(
    query: string,
    summary: string,
    state: any
  ): string {
    return `# Query
${query}

# Advisor Insights

${summary}

# Your Task

Synthesize the above advisor insights into a comprehensive, unified response that:
1. Directly answers the user's query
2. Integrates perspectives from all advisors
3. Highlights key agreements and disagreements
4. Provides clear recommendations or conclusions
5. Maintains clarity and actionability

Focus on delivering value to the user, not just summarizing advisors.`;
  }

  /**
   * Set advisor timeout
   *
   * @param timeoutMs - Timeout in milliseconds
   */
  setAdvisorTimeout(timeoutMs: number): void {
    this.broadcaster.setAdvisorTimeout(timeoutMs);
  }
}

// Export all GTP components
export { FlashContextBuilder } from './FlashContextBuilder.js';
export { FlashBroadcaster } from './FlashBroadcaster.js';
export { LivingDatabase } from './LivingDatabase.js';
export { QuorumManager } from './QuorumManager.js';

// Export types
export type {
  GTPResult,
  GTPCallbacks,
  FlashContextFrame,
  QueryAnalysis,
  AdvisorResponse,
  GTPMetrics,
  LivingDatabaseState,
  QuorumResult,
  QuorumConfig,
  MergedInsight,
  ConsensusState,
} from '../types.js';
