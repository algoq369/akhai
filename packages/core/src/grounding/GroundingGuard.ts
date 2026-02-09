/**
 * Grounding Guard
 *
 * "Cognitive Immune System" for detecting bias, hype, and factuality issues.
 *
 * Features:
 * - Parallel execution of 4 detectors (<100ms total)
 * - Auto-triggers at thresholds (10 turns, 8K tokens, 15 min)
 * - Graceful degradation if detectors fail
 * - Configurable sensitivity per detector
 *
 * Architecture:
 * ```
 * ConversationMemory → GroundingGuard → 4 Detectors (parallel)
 *                                        ├── HypeDetector
 *                                        ├── EchoDetector
 *                                        ├── DriftDetector
 *                                        └── FactualityDetector
 *                                             ↓
 *                                        Alerts → UI
 * ```
 */

import type {
  Message,
  GroundingConfig,
  GroundingResult,
  GroundingAlert,
  DEFAULT_GROUNDING_CONFIG,
  TriggerPriority,
} from './types.js';
import { DEFAULT_GROUNDING_CONFIG as DEFAULT_CONFIG } from './types.js';
import { detectHype } from './detectors/HypeDetector.js';
import { detectEcho } from './detectors/EchoDetector.js';
import { detectDrift } from './detectors/DriftDetector.js';
import { detectFactuality } from './detectors/FactualityDetector.js';

/**
 * Pattern accumulator for tracking trends across conversation
 */
interface PatternAccumulator {
  redFlagCount: number;
  agreementCount: number;
  superlativeCount: number;
  lastTopics: string[];
}

/**
 * Grounding Guard - Main orchestrator with smart 3-level triggers
 */
export class GroundingGuard {
  private config: GroundingConfig;
  private lastCheckTimestamp: number = 0;
  private conversationStartTime: number = Date.now();
  private lastDecayTimestamp: number = Date.now();

  // Pattern accumulator (tracks trends)
  private patternAccumulator: PatternAccumulator = {
    redFlagCount: 0,
    agreementCount: 0,
    superlativeCount: 0,
    lastTopics: [],
  };

  // Red flag patterns (instant detection)
  private static readonly RED_FLAGS = new RegExp(
    '\\b(?:' +
    'guaranteed|definitely|absolutely|certainly|100%|' +
    'always works|never fails|no risk|zero risk|' +
    'everyone knows|obviously|clearly the best|' +
    'you must|you should definitely|trust me|' +
    'secret|they don\'t want you to know|' +
    'miracle|revolutionary|breakthrough|game.?changer' +
    ')\\b',
    'gi'
  );

  // High-stakes patterns (triggers deep check)
  private static readonly HIGH_STAKES = new RegExp(
    '\\b(?:' +
    'invest|investment|savings|retirement|portfolio|' +
    'health|medical|diagnosis|symptoms|treatment|medication|' +
    'legal|lawyer|lawsuit|contract|sue|court|' +
    'suicide|self.?harm|kill|die|emergency' +
    ')\\b',
    'gi'
  );

  constructor(config: Partial<GroundingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    console.log('[GroundingGuard] Initialized with smart 3-level triggers');
  }

  /**
   * Level 1: Passive scan on EVERY response (~2ms)
   * Ultra-fast pattern detection for red flags and high-stakes content
   */
  private passiveScan(response: string): {
    shouldTrigger: boolean;
    reason: string | null;
    severity: TriggerPriority;
  } {
    const redFlags = response.match(GroundingGuard.RED_FLAGS) || [];
    const highStakes = response.match(GroundingGuard.HIGH_STAKES) || [];

    // Critical: High-stakes content detected
    if (highStakes.length > 0) {
      return {
        shouldTrigger: true,
        reason: `High-stakes topic detected: ${highStakes.slice(0, 3).join(', ')}`,
        severity: 'critical',
      };
    }

    // Elevated: Multiple red flags
    if (
      this.config.triggers.passive.enabled &&
      redFlags.length >= this.config.triggers.passive.redFlagThreshold
    ) {
      return {
        shouldTrigger: true,
        reason: `${redFlags.length} red flags detected: ${redFlags.slice(0, 3).join(', ')}`,
        severity: 'elevated',
      };
    }

    // Normal: Continue tracking
    return {
      shouldTrigger: false,
      reason: null,
      severity: 'normal',
    };
  }

  /**
   * Accumulate patterns across conversation for trend detection
   */
  private accumulatePatterns(response: string): void {
    const redFlags = (response.match(GroundingGuard.RED_FLAGS) || []).length;
    const agreements = (response.match(/^(yes|exactly|absolutely|i agree)/i) || []).length;

    // Time-normalized decay: decay based on minutes elapsed, not call frequency
    // This ensures consistent decay rate regardless of how often the function is called
    const now = Date.now();
    const minutesElapsed = (now - this.lastDecayTimestamp) / 60000;
    const decayFactor = Math.pow(0.9, minutesElapsed);
    this.lastDecayTimestamp = now;

    // Apply decay before adding new patterns
    this.patternAccumulator.redFlagCount *= decayFactor;
    this.patternAccumulator.agreementCount *= decayFactor;

    // Add new patterns
    this.patternAccumulator.redFlagCount += redFlags;
    this.patternAccumulator.agreementCount += agreements;
  }

  /**
   * Check accumulated patterns for concerning trends
   */
  private checkAccumulatedPatterns(): {
    shouldTrigger: boolean;
    reason: string | null;
  } {
    // Too many red flags accumulated
    if (this.patternAccumulator.redFlagCount > 5) {
      return {
        shouldTrigger: true,
        reason: `Accumulated ${Math.round(this.patternAccumulator.redFlagCount)} red flags over time`,
      };
    }

    // Echo chamber pattern (too much agreement)
    if (this.patternAccumulator.agreementCount > 4) {
      return {
        shouldTrigger: true,
        reason: 'Echo chamber pattern detected (excessive agreement)',
      };
    }

    return { shouldTrigger: false, reason: null };
  }

  /**
   * Check if grounding check should be triggered
   *
   * Triggers:
   * - Every N turns (default: 10)
   * - Total tokens exceed threshold (default: 8K)
   * - Time elapsed (default: 15 min)
   */
  shouldTrigger(stats: {
    messageCount: number;
    totalTokens: number;
  }): boolean {
    if (!this.config.enabled) {
      return false;
    }

    const now = Date.now();
    const minutesElapsed = (now - this.conversationStartTime) / 60000;

    // Check turn count (messageCount / 2 = turns)
    const turnCount = Math.floor(stats.messageCount / 2);
    if (turnCount > 0 && turnCount % this.config.triggers.periodic.turnCount === 0) {
      console.log(`[GroundingGuard] Trigger: ${turnCount} turns`);
      return true;
    }

    // Check token count
    if (stats.totalTokens >= this.config.triggers.periodic.tokenCount) {
      const lastCheckTokens = this.lastCheckTimestamp;
      if (stats.totalTokens - lastCheckTokens >= this.config.triggers.periodic.tokenCount) {
        console.log(`[GroundingGuard] Trigger: ${stats.totalTokens} tokens`);
        return true;
      }
    }

    // Check time elapsed
    if (minutesElapsed >= this.config.triggers.periodic.timeMinutes) {
      const minutesSinceLastCheck = (now - this.lastCheckTimestamp) / 60000;
      if (minutesSinceLastCheck >= this.config.triggers.periodic.timeMinutes) {
        console.log(`[GroundingGuard] Trigger: ${minutesElapsed.toFixed(1)} minutes`);
        return true;
      }
    }

    return false;
  }

  /**
   * Run grounding check on conversation
   *
   * Executes all 4 detectors in parallel for maximum speed (<100ms target).
   * Returns alerts for any issues detected.
   */
  async check(messages: Message[]): Promise<GroundingResult> {
    const startTime = Date.now();
    this.lastCheckTimestamp = startTime;

    if (!this.config.enabled) {
      return this.emptyResult(startTime, messages);
    }

    console.log(`[GroundingGuard] Running check on ${messages.length} messages...`);

    // Calculate conversation stats
    const totalTokens = messages.reduce(
      (sum, m) => sum + Math.ceil(m.content.length / 4),
      0
    );
    const duration = Date.now() - this.conversationStartTime;

    // Run all detectors in parallel for maximum speed
    // Track individual detector timing for accurate performance reporting
    const detectorTimings = {
      hype: { start: 0, end: 0 },
      echo: { start: 0, end: 0 },
      drift: { start: 0, end: 0 },
      factuality: { start: 0, end: 0 },
    };

    const timedDetectHype = async () => {
      detectorTimings.hype.start = Date.now();
      const result = await detectHype(messages, this.config.detectors.hypeSensitivity);
      detectorTimings.hype.end = Date.now();
      return result;
    };

    const timedDetectEcho = async () => {
      detectorTimings.echo.start = Date.now();
      const result = await detectEcho(messages, this.config.detectors.echoSimilarityThreshold);
      detectorTimings.echo.end = Date.now();
      return result;
    };

    const timedDetectDrift = async () => {
      detectorTimings.drift.start = Date.now();
      const result = await detectDrift(messages, this.config.detectors.driftTolerance);
      detectorTimings.drift.end = Date.now();
      return result;
    };

    const timedDetectFactuality = async () => {
      detectorTimings.factuality.start = Date.now();
      const result = await detectFactuality(messages, this.config.detectors.factualityEnabled);
      detectorTimings.factuality.end = Date.now();
      return result;
    };

    const [hypeResult, echoResult, driftResult, factualityResult] = await Promise.allSettled([
      timedDetectHype(),
      timedDetectEcho(),
      timedDetectDrift(),
      timedDetectFactuality(),
    ]);

    // Collect alerts from successful detectors
    const alerts: GroundingAlert[] = [];

    if (hypeResult.status === 'fulfilled' && hypeResult.value) {
      alerts.push(hypeResult.value);
    } else if (hypeResult.status === 'rejected') {
      console.warn('[GroundingGuard] Hype detector failed:', hypeResult.reason);
    }

    if (echoResult.status === 'fulfilled' && echoResult.value) {
      alerts.push(echoResult.value);
    } else if (echoResult.status === 'rejected') {
      console.warn('[GroundingGuard] Echo detector failed:', echoResult.reason);
    }

    if (driftResult.status === 'fulfilled' && driftResult.value) {
      alerts.push(driftResult.value);
    } else if (driftResult.status === 'rejected') {
      console.warn('[GroundingGuard] Drift detector failed:', driftResult.reason);
    }

    if (factualityResult.status === 'fulfilled' && factualityResult.value) {
      alerts.push(factualityResult.value);
    } else if (factualityResult.status === 'rejected') {
      console.warn('[GroundingGuard] Factuality detector failed:', factualityResult.reason);
    }

    const totalMs = Date.now() - startTime;

    console.log(
      `[GroundingGuard] Check complete: ${alerts.length} alerts in ${totalMs}ms`
    );

    return {
      timestamp: startTime,
      messageCount: messages.length,
      tokenCount: totalTokens,
      duration,
      alerts,
      performance: {
        totalMs,
        detectors: {
          hype:
            hypeResult.status === 'fulfilled'
              ? detectorTimings.hype.end - detectorTimings.hype.start
              : 0,
          echo:
            echoResult.status === 'fulfilled'
              ? detectorTimings.echo.end - detectorTimings.echo.start
              : 0,
          drift:
            driftResult.status === 'fulfilled'
              ? detectorTimings.drift.end - detectorTimings.drift.start
              : 0,
          factuality:
            factualityResult.status === 'fulfilled'
              ? detectorTimings.factuality.end - detectorTimings.factuality.start
              : 0,
        },
      },
    };
  }

  /**
   * Enhanced trigger check with 3-level system
   *
   * Level 1: Passive scan (every turn, ~2ms)
   * Level 2: Pattern accumulation
   * Level 3: Periodic checks (existing logic)
   *
   * @param messages - Full conversation history
   * @param lastResponse - Most recent AI response
   * @param options - Trigger options
   * @returns First alert if any detector triggers, or null
   */
  async checkTrigger(
    messages: Message[],
    lastResponse: string,
    options?: {
      priority?: TriggerPriority;
      triggerReason?: string;
      includeFactuality?: boolean;
    }
  ): Promise<GroundingAlert | null> {
    if (!this.config.enabled) {
      return null;
    }

    // === LEVEL 1: PASSIVE SCAN (every turn, ~2ms) ===
    if (this.config.triggers.passive.enabled) {
      const passiveResult = this.passiveScan(lastResponse);

      if (passiveResult.shouldTrigger) {
        console.log(`🚨 [GroundingGuard] Passive trigger: ${passiveResult.reason}`);

        // Run immediate check with elevated priority
        const result = await this.check(messages);
        if (result.alerts.length > 0) {
          const alert = result.alerts[0];
          return {
            ...alert,
            triggerReason: passiveResult.reason || undefined,
            priority: passiveResult.severity,
          };
        }
      }
    }

    // Accumulate patterns for trend detection
    this.accumulatePatterns(lastResponse);

    // === LEVEL 2: ACCUMULATED PATTERNS ===
    const accumulatedResult = this.checkAccumulatedPatterns();
    if (accumulatedResult.shouldTrigger) {
      console.log(`📊 [GroundingGuard] Accumulated pattern trigger: ${accumulatedResult.reason}`);

      const result = await this.check(messages);
      if (result.alerts.length > 0) {
        const alert = result.alerts[0];
        return {
          ...alert,
          triggerReason: accumulatedResult.reason || undefined,
          priority: 'elevated',
        };
      }

      // Reset accumulator after triggering
      this.patternAccumulator.redFlagCount = 0;
      this.patternAccumulator.agreementCount = 0;
    }

    // === LEVEL 3: PERIODIC CHECK (existing logic) ===
    const stats = {
      messageCount: messages.length,
      totalTokens: messages.reduce((sum, m) => sum + Math.ceil(m.content.length / 4), 0),
    };

    if (this.shouldTrigger(stats)) {
      console.log(`⏰ [GroundingGuard] Periodic trigger`);

      const result = await this.check(messages);
      if (result.alerts.length > 0) {
        const alert = result.alerts[0];
        return {
          ...alert,
          triggerReason: 'Periodic check',
          priority: 'normal',
        };
      }
    }

    // No trigger
    return null;
  }

  /**
   * Level 3: Force deep check (user-triggered or high-stakes)
   * Always runs full detector suite including factuality check
   *
   * @param messages - Full conversation history
   * @param reason - Reason for deep check
   * @returns First alert if any detector triggers, or null
   */
  async forceDeepCheck(
    messages: Message[],
    reason: string = 'User-requested deep check'
  ): Promise<GroundingAlert | null> {
    console.log(`🔬 [GroundingGuard] Deep check triggered: ${reason}`);

    // Temporarily enable factuality check for deep analysis
    const originalFactualityEnabled = this.config.detectors.factualityEnabled;
    this.config.detectors.factualityEnabled = true;

    try {
      const result = await this.check(messages);

      if (result.alerts.length > 0) {
        const alert = result.alerts[0];
        return {
          ...alert,
          triggerReason: reason,
          priority: 'critical',
        };
      }

      return null;
    } finally {
      // Restore original factuality setting
      this.config.detectors.factualityEnabled = originalFactualityEnabled;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<GroundingConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[GroundingGuard] Config updated:', this.config);
  }

  /**
   * Reset conversation tracking
   */
  reset(): void {
    this.lastCheckTimestamp = 0;
    this.conversationStartTime = Date.now();
    this.lastDecayTimestamp = Date.now();
    this.patternAccumulator = {
      redFlagCount: 0,
      agreementCount: 0,
      superlativeCount: 0,
      lastTopics: [],
    };
    console.log('[GroundingGuard] Reset');
  }

  /**
   * Get current configuration
   */
  getConfig(): GroundingConfig {
    return { ...this.config };
  }

  /**
   * Create empty result (when disabled)
   */
  private emptyResult(startTime: number, messages: Message[]): GroundingResult {
    return {
      timestamp: startTime,
      messageCount: messages.length,
      tokenCount: 0,
      duration: 0,
      alerts: [],
      performance: {
        totalMs: 0,
        detectors: {
          hype: 0,
          echo: 0,
          drift: 0,
          factuality: 0,
        },
      },
    };
  }
}
