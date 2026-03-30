/**
 * Quorum Manager
 *
 * Manages quorum detection for GTP methodology - determines when we have
 * "enough" consensus to proceed without waiting for all advisors.
 *
 * Quorum triggers:
 * 1. Minimum responses received (default: 2)
 * 2. Early exit on high agreement (85%+)
 * 3. Timeout (default: 60s)
 * 4. All advisors complete
 *
 * Philosophy: Don't wait for stragglers - proceed when consensus is clear.
 */

import type { LivingDatabaseState, QuorumConfig, QuorumResult } from '../types.js';

export class QuorumManager {
  private config: QuorumConfig;
  private startTime: number = 0;
  private checkCount: number = 0;

  constructor(config?: Partial<QuorumConfig>) {
    this.config = {
      minResponses: config?.minResponses ?? 2, // At least 2 responses
      earlyExitThreshold: config?.earlyExitThreshold ?? 0.85, // 85% agreement
      timeout: config?.timeout ?? 60000, // 60 seconds
      pollInterval: config?.pollInterval ?? 1000, // Check every 1 second
    };

    console.log(`[QuorumManager] Initialized with config:`, {
      minResponses: this.config.minResponses,
      earlyExitThreshold: `${(this.config.earlyExitThreshold * 100).toFixed(0)}%`,
      timeout: `${this.config.timeout / 1000}s`,
      pollInterval: `${this.config.pollInterval}ms`,
    });
  }

  /**
   * Start timing (call this when broadcast begins)
   */
  start(): void {
    this.startTime = Date.now();
    this.checkCount = 0;
    console.log(`[QuorumManager] ⏱️  Timer started`);
  }

  /**
   * Check if quorum has been reached
   *
   * @param state - Current living database state
   * @returns Quorum result
   */
  check(state: LivingDatabaseState): QuorumResult {
    this.checkCount++;

    const timeElapsed = Date.now() - this.startTime;
    const { responsesReceived, responsesExpected } = state.metadata;
    const { agreementLevel, consensusReached } = state.consensusState;

    // Determine if quorum reached and why
    let reached = false;
    let reason: QuorumResult['reason'] = 'pending';

    // Check 1: All responses complete
    if (responsesReceived >= responsesExpected) {
      reached = true;
      reason = 'all_complete';
    }
    // Check 2: Timeout exceeded
    else if (timeElapsed >= this.config.timeout) {
      reached = true;
      reason = 'timeout';
    }
    // Check 3: Minimum responses + high agreement (early exit)
    else if (
      responsesReceived >= this.config.minResponses &&
      agreementLevel >= this.config.earlyExitThreshold
    ) {
      reached = true;
      reason = 'high_agreement';
    }
    // Check 4: Minimum responses received (without high agreement)
    else if (responsesReceived >= this.config.minResponses && consensusReached) {
      reached = true;
      reason = 'min_responses';
    }

    const result: QuorumResult = {
      reached,
      reason,
      responsesReceived,
      responsesExpected,
      agreementLevel,
      timeElapsed,
      timestamp: Date.now(),
    };

    // Log quorum check
    if (this.checkCount % 5 === 0 || reached) {
      // Log every 5 checks or when reached
      const status = reached ? '✅' : '⏳';
      console.log(
        `[QuorumManager] ${status} Check ${this.checkCount}: ${responsesReceived}/${responsesExpected} responses, ${(agreementLevel * 100).toFixed(0)}% agreement, ${(timeElapsed / 1000).toFixed(1)}s elapsed`
      );

      if (reached) {
        console.log(`[QuorumManager] 🎯 Quorum reached: ${reason}`);
      }
    }

    return result;
  }

  /**
   * Wait for quorum to be reached
   *
   * Polls the living database state at regular intervals until quorum is reached.
   *
   * @param getState - Function to get current state
   * @param onProgress - Optional callback for progress updates
   * @returns Final quorum result
   */
  async waitForQuorum(
    getState: () => LivingDatabaseState,
    onProgress?: (result: QuorumResult) => void
  ): Promise<QuorumResult> {
    console.log(`[QuorumManager] 🔄 Waiting for quorum...`);

    return new Promise((resolve) => {
      const interval = setInterval(() => {
        const state = getState();
        const result = this.check(state);

        // Notify progress
        if (onProgress) {
          onProgress(result);
        }

        // Check if quorum reached
        if (result.reached) {
          clearInterval(interval);

          // Log final result
          const duration = (result.timeElapsed / 1000).toFixed(2);
          console.log(`[QuorumManager] ✅ Quorum reached after ${duration}s (${result.reason})`);
          console.log(`[QuorumManager]    Responses: ${result.responsesReceived}/${result.responsesExpected}`);
          console.log(`[QuorumManager]    Agreement: ${(result.agreementLevel * 100).toFixed(1)}%`);

          resolve(result);
        }
      }, this.config.pollInterval);
    });
  }

  /**
   * Check quorum once (synchronous)
   *
   * Use this for non-blocking checks in parallel workflows.
   *
   * @param state - Current state
   * @returns Quorum result
   */
  checkOnce(state: LivingDatabaseState): QuorumResult {
    return this.check(state);
  }

  /**
   * Get elapsed time since start
   *
   * @returns Elapsed time in milliseconds
   */
  getElapsedTime(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Get current configuration
   *
   * @returns Quorum config
   */
  getConfig(): QuorumConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   *
   * @param config - Partial config to update
   */
  updateConfig(config: Partial<QuorumConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };

    console.log(`[QuorumManager] Configuration updated:`, this.config);
  }

  /**
   * Reset the quorum manager for a new query
   */
  reset(): void {
    this.startTime = 0;
    this.checkCount = 0;
    console.log(`[QuorumManager] 🔄 Reset`);
  }

  /**
   * Estimate time remaining until timeout
   *
   * @returns Estimated time remaining in milliseconds
   */
  getTimeRemaining(): number {
    const elapsed = this.getElapsedTime();
    const remaining = Math.max(0, this.config.timeout - elapsed);
    return remaining;
  }

  /**
   * Calculate quorum progress (0-1)
   *
   * Progress is based on responses received OR time elapsed, whichever is greater.
   *
   * @param state - Current state
   * @returns Progress (0-1)
   */
  calculateProgress(state: LivingDatabaseState): number {
    const { responsesReceived, responsesExpected } = state.metadata;

    // Response progress
    const responseProgress = responsesReceived / responsesExpected;

    // Time progress
    const elapsed = this.getElapsedTime();
    const timeProgress = Math.min(1, elapsed / this.config.timeout);

    // Return max (either responses or time)
    return Math.max(responseProgress, timeProgress);
  }

  /**
   * Get detailed status string for logging/debugging
   *
   * @param state - Current state
   * @returns Status string
   */
  getStatusString(state: LivingDatabaseState): string {
    const { responsesReceived, responsesExpected } = state.metadata;
    const { agreementLevel } = state.consensusState;
    const elapsed = this.getElapsedTime();
    const progress = this.calculateProgress(state);

    return `[${(progress * 100).toFixed(0)}%] ${responsesReceived}/${responsesExpected} responses, ${(agreementLevel * 100).toFixed(0)}% agreement, ${(elapsed / 1000).toFixed(1)}s`;
  }

  /**
   * Check if early exit is possible (high agreement)
   *
   * @param state - Current state
   * @returns True if early exit conditions met
   */
  canEarlyExit(state: LivingDatabaseState): boolean {
    const { responsesReceived } = state.metadata;
    const { agreementLevel } = state.consensusState;

    return (
      responsesReceived >= this.config.minResponses &&
      agreementLevel >= this.config.earlyExitThreshold
    );
  }

  /**
   * Check if minimum quorum is satisfied (without high agreement)
   *
   * @param state - Current state
   * @returns True if minimum quorum met
   */
  hasMinimumQuorum(state: LivingDatabaseState): boolean {
    const { responsesReceived } = state.metadata;
    const { consensusReached } = state.consensusState;

    return responsesReceived >= this.config.minResponses && consensusReached;
  }

  /**
   * Check if timeout has been reached
   *
   * @returns True if timeout exceeded
   */
  isTimeout(): boolean {
    return this.getElapsedTime() >= this.config.timeout;
  }

  /**
   * Check if all responses have been received
   *
   * @param state - Current state
   * @returns True if all complete
   */
  isAllComplete(state: LivingDatabaseState): boolean {
    const { responsesReceived, responsesExpected } = state.metadata;
    return responsesReceived >= responsesExpected;
  }
}
