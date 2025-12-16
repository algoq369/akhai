/**
 * @akhai/core
 *
 * AKHAI Super Intelligence - Multi-AI Consensus Engine
 * Version: 0.4.0
 *
 * Features:
 * - Multi-AI consensus with 4 advisors + Mother Base
 * - GTP Flash parallel architecture (~25s)
 * - 5 methodologies (Direct, CoT, AoT, Flash, Auto)
 * - Conversation memory
 * - Quality scoring
 * - Specialized agents
 *
 * @packageDocumentation
 */

// ============================================================================
// TYPES
// ============================================================================

export type {
  // Model Provider Types
  ModelFamily,
  ModelConfig,
  ProviderConfig,
  CompletionRequest,
  CompletionResponse,

  // Advisor Layer Types
  AdvisorRole,
  AdvisorSlotInfo,
  ResolvedAdvisorLayer,

  // Consensus Types
  ConsensusRound,
  ConsensusResult,

  // Flow Types
  FlowAResult,
  FlowBResult,
} from './models/types.js';

// ============================================================================
// MODEL ALIGNMENT
// ============================================================================

export {
  ModelAlignmentManager,
  FIXED_BRAINSTORMER_SLOT_3,
  ALL_MODEL_FAMILIES,
} from './models/ModelAlignment.js';

// ============================================================================
// MODEL PROVIDER FACTORY
// ============================================================================

export {
  ModelProviderFactory,
  createProviderFromFamily,
  type IModelProvider,
} from './models/ModelProviderFactory.js';

// ============================================================================
// GTP (GENERATIVE THOUGHTS PROCESS)
// ============================================================================

export {
  GTPExecutor,
  FlashContextBuilder,
  FlashBroadcaster,
  LivingDatabase,
  QuorumManager,
} from './methodologies/gtp/index.js';

export {
  MethodologySelector,
  selectMethodology,
  analyzeQuery,
} from './methodologies/selector.js';

export type {
  MethodologyType,
  QueryType,
  QueryAnalysis,
  MethodologySelection,
  GTPResult,
  GTPCallbacks,
  FlashContextFrame,
  AdvisorResponse,
  GTPMetrics,
  LivingDatabaseState,
  QuorumResult,
  QuorumConfig,
  MergedInsight,
  ConsensusState,
} from './methodologies/types.js';

// ============================================================================
// MEMORY (NEW in v0.4.0)
// ============================================================================

export {
  ConversationMemory,
  type Message,
  type MemoryConfig,
  type ConversationSummary,
} from './memory/ConversationMemory.js';

// ============================================================================
// QUALITY SCORING (NEW in v0.4.0)
// ============================================================================

export {
  QualityScorer,
  type QualityScore,
  type QualityConfig,
} from './quality/QualityScorer.js';

// ============================================================================
// SPECIALIZED AGENTS (NEW in v0.4.0)
// ============================================================================

export {
  SPECIALIZED_AGENTS,
  RESEARCH_AGENT,
  CODING_AGENT,
  ANALYSIS_AGENT,
  WRITING_AGENT,
  STRATEGY_AGENT,
  DEBUG_AGENT,
  getAgentForTask,
  listAgents,
  type AgentConfig,
} from './agents/SpecializedAgents.js';

// ============================================================================
// MAIN SYSTEM
// ============================================================================

export { AkhAISystem } from './AkhAISystem.js';

// ============================================================================
// FACTORY FUNCTION (DEFAULT EXPORT)
// ============================================================================

import { AkhAISystem } from './AkhAISystem.js';
import type { ModelFamily } from './models/types.js';

/**
 * Create a new AkhAI system instance
 *
 * This is the recommended way to create an AkhAI system.
 *
 * @param motherBaseFamily - Model family for Mother Base (any of 10 families)
 * @returns AkhAI system instance
 *
 * @example
 * ```typescript
 * import { createAkhAI, ConversationMemory, QualityScorer } from '@akhai/core';
 *
 * const akhai = createAkhAI('anthropic');
 * const memory = new ConversationMemory();
 * const scorer = new QualityScorer();
 *
 * // Setup
 * akhai.setApiKeys({ anthropic, deepseek, xai, mistral });
 * akhai.setupMotherBase();
 * akhai.setupAdvisorLayer('deepseek', 'xai');
 *
 * // Execute query
 * const result = await akhai.executeMotherBaseFlow('Analyze this...');
 *
 * // Track in memory
 * memory.addMessage('user', 'Analyze this...');
 * memory.addMessage('assistant', result.finalDecision);
 *
 * // Score quality
 * const score = scorer.scoreConsensus(result.layerConsensus, result.finalDecision);
 * console.log(scorer.formatScore(score));
 * ```
 */
export function createAkhAI(motherBaseFamily: ModelFamily): AkhAISystem {
  return new AkhAISystem(motherBaseFamily);
}

/**
 * Default export: createAkhAI factory function
 */
export default createAkhAI;

// ============================================================================
// VERSION
// ============================================================================

export const VERSION = '0.4.0';
