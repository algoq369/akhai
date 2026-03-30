/**
 * Flash Broadcaster
 *
 * Broadcasts Flash Context Frame to ALL advisors SIMULTANEOUSLY using Promise.allSettled().
 * This is the core of GTP's parallel architecture - achieving 3x speedup over sequential execution.
 *
 * Critical: Uses Promise.allSettled() for TRUE parallelism, not sequential awaits!
 */

import type {
  FlashContextFrame,
  AdvisorResponse,
  AdvisorResponseStatus,
  BroadcastResult,
  GTPCallbacks,
  ModelFamily,
} from '../types.js';
import type { IModelProvider } from '../../models/ModelProviderFactory.js';
import { FlashContextBuilder } from './FlashContextBuilder.js';

/**
 * Advisor provider with metadata
 */
interface AdvisorProvider {
  slot: number;
  family: ModelFamily;
  provider: IModelProvider;
}

/**
 * Result from individual advisor call
 */
interface AdvisorCallResult {
  slot: number;
  response: AdvisorResponse;
}

export class FlashBroadcaster {
  private contextBuilder: FlashContextBuilder;
  private advisorTimeout: number = 90000; // 90 seconds per advisor

  constructor() {
    this.contextBuilder = new FlashContextBuilder();
  }

  /**
   * Broadcast Flash Context Frame to all advisors in parallel
   *
   * @param frame - Flash context frame to broadcast
   * @param advisorProviders - All advisor providers
   * @param callbacks - Progress callbacks
   * @returns Broadcast result with all responses
   */
  async broadcast(
    frame: FlashContextFrame,
    advisorProviders: AdvisorProvider[],
    callbacks?: GTPCallbacks
  ): Promise<BroadcastResult> {
    console.log(`[FlashBroadcaster] 🚀 Broadcasting to ${advisorProviders.length} advisors simultaneously`);

    const startTime = Date.now();

    // Notify broadcast start
    callbacks?.onFlashBroadcast?.(advisorProviders.length);

    // Create promises for all advisors (TRUE PARALLELISM)
    const advisorPromises = advisorProviders.map(({ slot, family, provider }) => {
      // Notify individual advisor start
      const task = frame.advisorTasks.find(t => t.slot === slot);
      if (task) {
        callbacks?.onAdvisorStart?.(slot, family, task.role);
      }

      return this.callAdvisorWithTimeout(slot, family, provider, frame, callbacks);
    });

    // Execute ALL advisors in parallel using Promise.allSettled
    // This is CRITICAL - allSettled ensures failed advisors don't block others
    console.log(`[FlashBroadcaster] ⚡ Executing ${advisorPromises.length} advisors in PARALLEL...`);

    const results = await Promise.allSettled(advisorPromises);

    const duration = Date.now() - startTime;
    console.log(`[FlashBroadcaster] ✅ Broadcast complete in ${(duration / 1000).toFixed(2)}s`);

    // Process results
    const responses: AdvisorResponse[] = [];
    let successCount = 0;
    let failureCount = 0;

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const advisorResult = result.value;
        responses.push(advisorResult.response);

        if (advisorResult.response.status === 'complete') {
          successCount++;
          console.log(`[FlashBroadcaster]   ✓ Slot ${advisorResult.slot} succeeded`);
        } else {
          failureCount++;
          console.log(`[FlashBroadcaster]   ✗ Slot ${advisorResult.slot} failed: ${advisorResult.response.error}`);
        }

        // Notify callback based on status
        if (advisorResult.response.status === 'complete') {
          callbacks?.onAdvisorComplete?.(advisorResult.response);
        } else {
          callbacks?.onAdvisorFailed?.(
            advisorResult.response.slot,
            advisorResult.response.family,
            advisorResult.response.error || 'Unknown error'
          );
        }
      } else {
        // Promise itself was rejected (shouldn't happen with our error handling, but just in case)
        const advisor = advisorProviders[index];
        const errorResponse: AdvisorResponse = {
          slot: advisor.slot,
          family: advisor.family,
          role: frame.advisorTasks.find(t => t.slot === advisor.slot)?.role || 'technical',
          content: '',
          confidence: 0,
          keyPoints: [],
          status: 'failed',
          error: result.reason?.message || 'Promise rejection',
          timing: {
            startTime,
            endTime: Date.now(),
            duration: Date.now() - startTime,
          },
        };

        responses.push(errorResponse);
        failureCount++;

        console.log(`[FlashBroadcaster]   ✗ Slot ${advisor.slot} rejected: ${errorResponse.error}`);

        callbacks?.onAdvisorFailed?.(
          advisor.slot,
          advisor.family,
          errorResponse.error || 'Unknown error'
        );
      }
    });

    console.log(`[FlashBroadcaster] 📊 Results: ${successCount} succeeded, ${failureCount} failed`);

    return {
      responses,
      successCount,
      failureCount,
      duration,
    };
  }

  /**
   * Call individual advisor with timeout protection
   *
   * @param slot - Advisor slot number
   * @param family - Model family
   * @param provider - Model provider
   * @param frame - Flash context frame
   * @param callbacks - Progress callbacks
   * @returns Advisor call result
   */
  private async callAdvisorWithTimeout(
    slot: number,
    family: ModelFamily,
    provider: IModelProvider,
    frame: FlashContextFrame,
    callbacks?: GTPCallbacks
  ): Promise<AdvisorCallResult> {
    const startTime = Date.now();

    const task = frame.advisorTasks.find(t => t.slot === slot);
    if (!task) {
      throw new Error(`No task found for slot ${slot}`);
    }

    // Create advisor-specific prompt
    const prompt = this.contextBuilder.toPrompt(frame, slot);

    console.log(`[FlashBroadcaster] 🎯 Slot ${slot} (${family}/${task.role}) starting...`);

    try {
      // Race between advisor call and timeout
      const response = await Promise.race([
        this.callAdvisor(provider, prompt, task.role),
        this.createTimeoutPromise(this.advisorTimeout, slot, family),
      ]);

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`[FlashBroadcaster] ✓ Slot ${slot} completed in ${(duration / 1000).toFixed(2)}s`);

      // Extract key points from response
      const keyPoints = this.extractKeyPoints(response.content);

      const advisorResponse: AdvisorResponse = {
        slot,
        family,
        role: task.role,
        content: response.content,
        confidence: this.extractConfidence(response.content),
        keyPoints,
        status: 'complete',
        usage: response.usage,
        timing: {
          startTime,
          endTime,
          duration,
        },
      };

      return { slot, response: advisorResponse };
    } catch (error: any) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      const isTimeout = error.message?.includes('timeout');
      const status: AdvisorResponseStatus = isTimeout ? 'timeout' : 'failed';

      console.error(`[FlashBroadcaster] ✗ Slot ${slot} ${status}: ${error.message}`);

      const advisorResponse: AdvisorResponse = {
        slot,
        family,
        role: task.role,
        content: '',
        confidence: 0,
        keyPoints: [],
        status,
        error: error.message || 'Unknown error',
        timing: {
          startTime,
          endTime,
          duration,
        },
      };

      return { slot, response: advisorResponse };
    }
  }

  /**
   * Call advisor provider
   */
  private async callAdvisor(
    provider: IModelProvider,
    prompt: string,
    role: string
  ): Promise<{ content: string; usage?: { inputTokens: number; outputTokens: number } }> {
    const systemPrompt = role
      ? `You are a ${role} analyst in a multi-AI consensus system. Provide focused, insightful analysis from your unique perspective.`
      : 'You are an analyst in a multi-AI consensus system. Provide focused, insightful analysis.';

    const response = await provider.complete({
      messages: [{ role: 'user', content: prompt }],
      systemPrompt,
    });

    return {
      content: response.content,
      usage: response.usage,
    };
  }

  /**
   * Create timeout promise
   */
  private createTimeoutPromise(
    timeoutMs: number,
    slot: number,
    family: ModelFamily
  ): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Advisor timeout after ${timeoutMs}ms (Slot ${slot}, ${family})`));
      }, timeoutMs);
    });
  }

  /**
   * Extract key points from response content
   */
  private extractKeyPoints(content: string): string[] {
    const points: string[] = [];

    // Look for bullet points
    const bulletMatches = content.match(/^[•\-\*]\s+(.+)$/gm);
    if (bulletMatches) {
      points.push(...bulletMatches.map(m => m.replace(/^[•\-\*]\s+/, '').trim()));
    }

    // Look for numbered points
    const numberedMatches = content.match(/^\d+\.\s+(.+)$/gm);
    if (numberedMatches) {
      points.push(...numberedMatches.map(m => m.replace(/^\d+\.\s+/, '').trim()));
    }

    // Look for bold statements (markdown)
    const boldMatches = content.match(/\*\*([^*]+)\*\*/g);
    if (boldMatches) {
      points.push(...boldMatches.map(m => m.replace(/\*\*/g, '').trim()));
    }

    // Deduplicate and limit
    const uniquePoints = Array.from(new Set(points));

    // Return top 5 most substantial points (by length)
    return uniquePoints
      .filter(p => p.length > 10) // Filter out very short points
      .sort((a, b) => b.length - a.length)
      .slice(0, 5);
  }

  /**
   * Extract confidence level from response
   */
  private extractConfidence(content: string): number {
    // Look for confidence markers
    const confidenceMatch = content.match(/confidence:\s*(high|medium|low)/i);

    if (confidenceMatch) {
      const level = confidenceMatch[1].toLowerCase();
      switch (level) {
        case 'high': return 0.9;
        case 'medium': return 0.6;
        case 'low': return 0.3;
      }
    }

    // Default to medium confidence
    return 0.6;
  }

  /**
   * Set advisor timeout
   *
   * @param timeoutMs - Timeout in milliseconds
   */
  setAdvisorTimeout(timeoutMs: number): void {
    this.advisorTimeout = timeoutMs;
    console.log(`[FlashBroadcaster] Advisor timeout set to ${timeoutMs}ms`);
  }
}
