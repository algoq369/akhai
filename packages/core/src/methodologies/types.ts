/**
 * AkhAI Methodologies - Type Definitions
 *
 * Research-Validated Top 7 Methodologies (December 2025):
 * - Direct: Simple factual queries (Tier 1)
 * - CoD: Chain of Draft - 92% cheaper than CoT (Tier 2)
 * - BoT: Buffer of Thoughts - 88% cheaper than ToT (Tier 2)
 * - ReAct: Tool-augmented reasoning (Tier 3)
 * - PoT: Program of Thought - Code-based computation (Tier 4)
 * - GTP: Multi-AI consensus with Self-Consistency (Tier 5)
 * - Auto: Smart methodology selector (Meta)
 *
 * Legacy/Optional:
 * - CoT: Standard Chain of Thought (for debugging)
 * - AoT: Atom of Thoughts (optional fallback)
 */

import type { ModelFamily } from '../models/types.js';

/**
 * Core 7 methodologies (research-validated, production-ready)
 */
export type CoreMethodology =
  | 'direct'    // Tier 1: Instant response
  | 'cod'       // Tier 2: Chain of Draft (cost-optimized)
  | 'bot'       // Tier 2: Buffer of Thoughts (template-based)
  | 'react'     // Tier 3: Tool-augmented reasoning
  | 'pot'       // Tier 4: Program of Thought (computational)
  | 'gtp'       // Tier 5: Consensus (includes Self-Consistency)
  | 'auto';     // Meta: Auto-selector

/**
 * Legacy/optional methodologies (kept for compatibility)
 */
export type LegacyMethodology =
  | 'cot'       // Standard CoT (for debugging)
  | 'aot';      // Atom of Thoughts (optional)

/**
 * All available reasoning methodologies
 */
export type MethodologyType = CoreMethodology | LegacyMethodology;

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
// Methodology Metadata
// =============================================================================

/**
 * Methodology information and characteristics
 */
export interface MethodologyInfo {
  /** Display name */
  name: string;

  /** Tier (0 = meta, 1-5 = core tiers) */
  tier: number;

  /** Icon for UI display */
  icon: string;

  /** Description */
  description: string;

  /** Token usage multiplier (relative to baseline) */
  tokenMultiplier: number;

  /** Average latency in milliseconds */
  avgLatencyMs: number;

  /** Cost per 1K tokens (USD) */
  costPer1K: number;

  /** Best use cases */
  bestFor: string[];
}

/**
 * Comprehensive metadata for all core methodologies
 */
export const METHODOLOGY_INFO: Record<CoreMethodology, MethodologyInfo> = {
  direct: {
    name: 'Direct',
    tier: 1,
    icon: '⚡',
    description: 'Instant response for simple queries',
    tokenMultiplier: 1.0,
    avgLatencyMs: 2000,
    costPer1K: 0.0001,
    bestFor: ['factual', 'definitions', 'lookups'],
  },
  cod: {
    name: 'Chain of Draft',
    tier: 2,
    icon: '📝',
    description: 'Token-efficient step-by-step reasoning (92% cheaper than CoT)',
    tokenMultiplier: 0.08,
    avgLatencyMs: 8000,
    costPer1K: 0.0008,
    bestFor: ['procedural', 'how-to', 'sequential'],
  },
  bot: {
    name: 'Buffer of Thoughts',
    tier: 2,
    icon: '🧠',
    description: 'Template-based analysis (88% cheaper than ToT)',
    tokenMultiplier: 0.12,
    avgLatencyMs: 18000,
    costPer1K: 0.006,
    bestFor: ['complex', 'analysis', 'comparison', 'planning'],
  },
  react: {
    name: 'ReAct',
    tier: 3,
    icon: '🔧',
    description: 'Tool-augmented reasoning with external actions',
    tokenMultiplier: 3.0,
    avgLatencyMs: 20000,
    costPer1K: 0.02,
    bestFor: ['search', 'calculate', 'external-data'],
  },
  pot: {
    name: 'Program of Thought',
    tier: 4,
    icon: '💻',
    description: 'Code-based computation (+24% on numerical tasks)',
    tokenMultiplier: 1.5,
    avgLatencyMs: 12000,
    costPer1K: 0.01,
    bestFor: ['math', 'finance', 'computation'],
  },
  gtp: {
    name: 'GTP + Self-Consistency',
    tier: 5,
    icon: '🤝',
    description: 'Multi-perspective consensus with Self-MoA',
    tokenMultiplier: 5.0,
    avgLatencyMs: 30000,
    costPer1K: 0.03,
    bestFor: ['debate', 'verification', 'critical-decisions'],
  },
  auto: {
    name: 'Auto Selector',
    tier: 0,
    icon: '🎯',
    description: 'Automatically selects optimal methodology',
    tokenMultiplier: 1.0,
    avgLatencyMs: 500,
    costPer1K: 0,
    bestFor: ['default'],
  },
};

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
// Buffer of Thoughts (BoT) Types
// =============================================================================

/**
 * Thought node representing a single reasoning step in the buffer
 */
export interface ThoughtNode {
  /** Unique ID for this thought */
  id: string;

  /** The actual thought content */
  content: string;

  /** Depth in reasoning tree (0 = root) */
  depth: number;

  /** Parent thought ID (null for root) */
  parentId: string | null;

  /** Child thought IDs */
  childIds: string[];

  /** Timestamp when created */
  timestamp: number;

  /** Confidence score (0-1) */
  confidence: number;

  /** Whether this thought is part of the solution path */
  isOnSolutionPath: boolean;

  /** Metadata for tracking */
  metadata?: {
    /** Which reasoning stage this came from */
    stage?: 'initial' | 'expansion' | 'refinement' | 'synthesis';

    /** Associated evidence or citations */
    evidence?: string[];

    /** Token cost of this thought */
    tokenCost?: number;
  };
}

/**
 * Distilled meta-buffer - compressed representation of thought buffer
 */
export interface MetaBuffer {
  /** Compressed summary of all thoughts */
  summary: string;

  /** Key insights extracted from thought buffer */
  keyInsights: string[];

  /** Solution template/pattern identified */
  template: string;

  /** Confidence in this distillation (0-1) */
  confidence: number;

  /** Original thought IDs included in this distillation */
  sourceThoughtIds: string[];

  /** Token count saved by distillation */
  tokensSaved: number;

  /** Timestamp of distillation */
  timestamp: number;
}

/**
 * Distillation strategy - how to compress thought buffers
 */
export type DistillationStrategy =
  | 'summarize'      // Summarize all thoughts into concise points
  | 'template'       // Extract solution template/pattern
  | 'prune'          // Remove low-confidence thoughts
  | 'cluster'        // Group similar thoughts and keep representatives
  | 'hierarchical';  // Create hierarchical summary (key points → details)

/**
 * BoT configuration options
 */
export interface BoTConfig {
  /** Maximum thoughts in buffer before distillation */
  maxBufferSize: number;

  /** Distillation strategy to use */
  distillationStrategy: DistillationStrategy;

  /** Maximum meta-buffers to maintain */
  maxMetaBuffers: number;

  /** Minimum confidence threshold for thoughts */
  minConfidence: number;

  /** Maximum tokens per response */
  maxTokens: number;

  /** Temperature for generation */
  temperature: number;

  /** Whether to use problem templates */
  useTemplates: boolean;
}

/**
 * BoT execution result
 */
export interface BoTResult {
  /** Final answer */
  answer: string;

  /** Methodology used */
  methodology: 'bot';

  /** Final thought buffer state */
  thoughtBuffer: ThoughtNode[];

  /** Meta-buffers created during execution */
  metaBuffers: MetaBuffer[];

  /** Provider used */
  provider: string;

  /** Token usage */
  tokens: {
    input: number;
    output: number;
    total: number;
    saved: number; // Tokens saved through distillation
  };

  /** Execution time in milliseconds */
  latencyMs: number;

  /** Estimated cost in USD */
  cost: number;

  /** Metadata about execution */
  metadata: {
    thoughtCount: number;
    distillationCount: number;
    avgConfidence: number;
    solutionDepth: number;
    tokenSavings: string;
    comparisonToToT: {
      estimatedToTTokens: number;
      actualBoTTokens: number;
      savingsPercent: number;
    };
  };
}

/**
 * Thought buffer state snapshot for streaming updates
 */
export interface ThoughtBufferSnapshot {
  /** Current thoughts */
  thoughts: ThoughtNode[];

  /** Current meta-buffers */
  metaBuffers: MetaBuffer[];

  /** Buffer statistics */
  stats: {
    totalThoughts: number;
    activeThoughts: number;
    avgConfidence: number;
    maxDepth: number;
  };

  /** Timestamp of snapshot */
  timestamp: number;
}

/**
 * BoT execution callbacks for real-time updates
 */
export interface BoTCallbacks {
  /** New thought added to buffer */
  onThoughtAdded?: (thought: ThoughtNode) => void;

  /** Distillation started */
  onDistillationStart?: (bufferSize: number, strategy: DistillationStrategy) => void;

  /** Distillation completed */
  onDistillationComplete?: (metaBuffer: MetaBuffer) => void;

  /** Buffer state updated */
  onBufferUpdate?: (snapshot: ThoughtBufferSnapshot) => void;

  /** Solution path identified */
  onSolutionPath?: (path: ThoughtNode[]) => void;

  /** Final synthesis started */
  onSynthesisStart?: () => void;

  /** Final synthesis completed */
  onSynthesisComplete?: (answer: string) => void;
}

// =============================================================================
// Export all types
// =============================================================================

export type {
  ModelFamily,
};
