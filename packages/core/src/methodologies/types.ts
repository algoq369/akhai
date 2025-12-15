/**
 * AkhAI Methodologies - Type Definitions
 *
 * Defines types for multiple reasoning methodologies:
 * - Direct: Simple factual queries
 * - CoT: Chain of Thought (sequential reasoning)
 * - AoT: Atom of Thoughts (decompose→solve→contract)
 * - GTP: Generative Thoughts Process (parallel Flash architecture)
 */

import type { ModelFamily } from '../models/types.js';

/**
 * Available reasoning methodologies
 */
export type MethodologyType = 'direct' | 'cot' | 'aot' | 'gtp' | 'auto';

/**
 * Query type classification
 */
export type QueryType =
  | 'factual'           // Simple facts: "What is X?"
  | 'comparative'       // Comparisons: "X vs Y"
  | 'procedural'        // How-to: "How to do X"
  | 'research'          // In-depth: "Research X trends"
  | 'creative'          // Brainstorming: "Ideas for X"
  | 'analytical'        // Analysis: "Analyze X"
  | 'troubleshooting'   // Debugging: "Fix X error"
  | 'planning';         // Strategy: "Plan for X"

/**
 * Query analysis result for methodology selection
 */
export interface QueryAnalysis {
  /** Original query text */
  query: string;

  /** Complexity score (0-1) */
  complexity: number;

  /** Detected query type */
  queryType: QueryType;

  /** Requires multiple perspectives? */
  requiresMultiplePerspectives: boolean;

  /** Requires sequential reasoning? */
  requiresSequentialReasoning: boolean;

  /** Requires decomposition into sub-tasks? */
  requiresDecomposition: boolean;

  /** Estimated tokens (for optimization) */
  estimatedTokens: number;

  /** Detected keywords */
  keywords: string[];

  /** Time sensitivity (higher = faster method preferred) */
  timeSensitivity: 'low' | 'medium' | 'high';
}

/**
 * Methodology selection result
 */
export interface MethodologySelection {
  /** Selected methodology */
  methodology: MethodologyType;

  /** Confidence in selection (0-1) */
  confidence: number;

  /** Reasoning for selection */
  reasoning: string;

  /** Alternative methodologies */
  alternatives: Array<{
    methodology: MethodologyType;
    score: number;
    reason: string;
  }>;
}

// =============================================================================
// GTP (Generative Thoughts Process) Types
// =============================================================================

/**
 * Advisor role in GTP Flash
 */
export type AdvisorRole =
  | 'technical'    // Implementation details, feasibility
  | 'strategic'    // Market analysis, competition
  | 'creative'     // Unconventional ideas, edge cases
  | 'critical';    // Risks, weaknesses, challenges

/**
 * Task assigned to a specific advisor slot
 */
export interface AdvisorTask {
  /** Advisor slot number (1-4) */
  slot: number;

  /** Model family for this slot */
  family: ModelFamily;

  /** Role assignment */
  role: AdvisorRole;

  /** Specific focus areas */
  specificFocus: string[];

  /** Topics to avoid (prevent redundancy) */
  avoidTopics: string[];

  /** Additional instructions */
  instructions?: string;
}

/**
 * Flash Context Frame - the "snapshot" flashed to all advisors
 */
export interface FlashContextFrame {
  /** Frame version for future compatibility */
  version: string;

  /** Original query */
  query: string;

  /** Project state / bigger picture */
  projectState: {
    /** Current focus */
    currentFocus: string;

    /** Previous decisions/context */
    priorKnowledge: string[];

    /** Constraints */
    constraints: string[];
  };

  /** Tasks assigned to each advisor */
  advisorTasks: AdvisorTask[];

  /** Global constraints */
  constraints: {
    /** Max response length */
    maxTokens: number;

    /** Response time goal */
    timeGoal: number;

    /** Required elements */
    requiredElements: string[];
  };

  /** Timestamp of frame creation */
  timestamp: number;
}

/**
 * Advisor response status
 */
export type AdvisorResponseStatus =
  | 'pending'      // Not started yet
  | 'thinking'     // In progress
  | 'complete'     // Success
  | 'failed'       // Error
  | 'timeout';     // Timed out

/**
 * Individual advisor response in GTP
 */
export interface AdvisorResponse {
  /** Advisor slot number */
  slot: number;

  /** Model family used */
  family: ModelFamily;

  /** Role fulfilled */
  role: AdvisorRole;

  /** Response content */
  content: string;

  /** Confidence level (0-1) */
  confidence: number;

  /** Key points extracted */
  keyPoints: string[];

  /** Response status */
  status: AdvisorResponseStatus;

  /** Error message if failed */
  error?: string;

  /** Token usage */
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };

  /** Response timing */
  timing: {
    startTime: number;
    endTime?: number;
    duration?: number;
  };
}

/**
 * Insight category for organization
 */
export type InsightCategory =
  | 'advantage'      // Pros, benefits
  | 'disadvantage'   // Cons, drawbacks
  | 'risk'           // Potential risks
  | 'opportunity'    // Opportunities
  | 'requirement'    // Requirements
  | 'recommendation' // Recommendations
  | 'finding'        // Key findings
  | 'question';      // Open questions

/**
 * Merged insight from multiple advisors
 */
export interface MergedInsight {
  /** Insight content */
  content: string;

  /** Advisor slots supporting this insight */
  supportingSlots: number[];

  /** Confidence (based on agreement) */
  confidence: number;

  /** Category */
  category: InsightCategory;

  /** Related insights (IDs) */
  relatedInsights: string[];

  /** Unique ID */
  id: string;
}

/**
 * Consensus state
 */
export interface ConsensusState {
  /** Agreement level (0-1) */
  agreementLevel: number;

  /** Consensus reached? */
  consensusReached: boolean;

  /** Points of agreement */
  agreements: string[];

  /** Points of disagreement */
  disagreements: Array<{
    point: string;
    positions: Array<{
      slot: number;
      stance: string;
    }>;
  }>;

  /** Confidence in consensus */
  confidence: number;
}

/**
 * Living Database state - evolves as responses arrive
 */
export interface LivingDatabaseState {
  /** Vector clock for causal ordering */
  vectorClock: Record<number, number>;

  /** All advisor responses */
  responses: Map<number, AdvisorResponse>;

  /** Merged insights */
  mergedInsights: MergedInsight[];

  /** Current consensus state */
  consensusState: ConsensusState;

  /** Metadata */
  metadata: {
    /** Total responses received */
    responsesReceived: number;

    /** Total responses expected */
    responsesExpected: number;

    /** Start time */
    startTime: number;

    /** Last update time */
    lastUpdate: number;
  };
}

/**
 * Quorum configuration
 */
export interface QuorumConfig {
  /** Minimum responses required */
  minResponses: number;

  /** Agreement threshold for early exit (0-1) */
  earlyExitThreshold: number;

  /** Max wait time (ms) */
  timeout: number;

  /** Poll interval (ms) */
  pollInterval: number;
}

/**
 * Quorum check result
 */
export interface QuorumResult {
  /** Quorum reached? */
  reached: boolean;

  /** Reason */
  reason: 'min_responses' | 'high_agreement' | 'timeout' | 'all_complete' | 'pending';

  /** Responses received */
  responsesReceived: number;

  /** Responses expected */
  responsesExpected: number;

  /** Agreement level */
  agreementLevel: number;

  /** Time elapsed (ms) */
  timeElapsed: number;

  /** Timestamp */
  timestamp: number;
}

/**
 * GTP execution metrics
 */
export interface GTPMetrics {
  /** Total execution time */
  totalDuration: number;

  /** Flash preparation time */
  flashPrepTime: number;

  /** Broadcast time (parallel) */
  broadcastTime: number;

  /** Merge/processing time */
  mergeTime: number;

  /** Quorum wait time */
  quorumWaitTime: number;

  /** Synthesis time */
  synthesisTime: number;

  /** Individual advisor timings */
  advisorTimings: Record<number, number>;

  /** Success rate */
  successRate: number;

  /** Token usage */
  totalTokens: {
    input: number;
    output: number;
    total: number;
  };

  /** Cost */
  totalCost: number;
}

/**
 * GTP execution result
 */
export interface GTPResult {
  /** Flash context frame used */
  flashContext: FlashContextFrame;

  /** Final living database state */
  livingDatabase: LivingDatabaseState;

  /** Quorum result */
  quorum: QuorumResult;

  /** Mother Base synthesis */
  synthesis: {
    /** Synthesized content */
    content: string;

    /** Family used for synthesis */
    family: ModelFamily;

    /** Confidence */
    confidence: number;

    /** Timestamp */
    timestamp: number;
  };

  /** Execution metrics */
  metrics: GTPMetrics;

  /** Methodology used */
  methodology: 'gtp';
}

/**
 * GTP execution callbacks for real-time updates
 */
export interface GTPCallbacks {
  /** Flash context prepared */
  onFlashPrepare?: (frame: FlashContextFrame) => void;

  /** Flash broadcast started */
  onFlashBroadcast?: (advisorCount: number) => void;

  /** Individual advisor started */
  onAdvisorStart?: (slot: number, family: ModelFamily, role: AdvisorRole) => void;

  /** Individual advisor completed */
  onAdvisorComplete?: (response: AdvisorResponse) => void;

  /** Individual advisor failed */
  onAdvisorFailed?: (slot: number, family: ModelFamily, error: string) => void;

  /** Living database updated */
  onMergeUpdate?: (state: LivingDatabaseState) => void;

  /** Quorum progress update */
  onQuorumProgress?: (result: QuorumResult) => void;

  /** Quorum reached */
  onQuorumReached?: (result: QuorumResult) => void;

  /** Mother Base synthesis started */
  onSynthesisStart?: () => void;

  /** Mother Base synthesis completed */
  onSynthesisComplete?: (synthesis: string, family: ModelFamily) => void;
}

/**
 * Broadcast result from FlashBroadcaster
 */
export interface BroadcastResult {
  /** All responses (including failed) */
  responses: AdvisorResponse[];

  /** Success count */
  successCount: number;

  /** Failure count */
  failureCount: number;

  /** Total time */
  duration: number;
}

// =============================================================================
// Export all types
// =============================================================================

export type {
  ModelFamily,
};
