/**
 * @akhai/core
 *
 * AKHAI Super Intelligence - Multi-AI Consensus Engine
 * Version: 0.4.0
 *
 * Features:
 * - Multi-AI consensus with 4 advisors + Mother Base
 * - GTP Flash parallel architecture (~25s)
 * - 7 research-validated methodologies (Direct, CoD, BoT, ReAct, PoT, GTP, Auto)
 * - Cost-optimized reasoning (60-92% savings)
 * - Conversation memory
 * - Quality scoring
 * - Specialized agents
 * - Grounding Guard (bias/hype detection)
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

// ============================================================================
// CHAIN OF DRAFT (COD) - Cost-Optimized Methodology
// ============================================================================

export {
  executeChainOfDraft,
  type CoDConfig,
  type CoDResult,
} from './methodologies/cod.js';

// ============================================================================
// BUFFER OF THOUGHTS (BOT) - Template-Based Reasoning
// ============================================================================

export {
  executeBufferOfThoughts,
  ThoughtBuffer,
} from './methodologies/bot.js';

// ============================================================================
// REACT - Reasoning + Acting (Tool-Augmented)
// ============================================================================

export {
  executeReAct,
  createToolRegistry,
  searchTool,
  calculateTool,
  lookupTool,
  finishTool,
  type ReActConfig,
  type ReActResult,
  type ReActStep,
  type ReActStepType,
  type Tool,
  type ToolParameter,
  type ToolRegistry,
} from './methodologies/react.js';

// ============================================================================
// PROGRAM OF THOUGHT (POT) - Code-Based Reasoning
// ============================================================================

export {
  executeProgramOfThought,
  type PoTConfig,
  type PoTResult,
  type PoTStep,
  type PoTStepType,
} from './methodologies/pot.js';

// ============================================================================
// METHODOLOGY TYPES & REGISTRY
// ============================================================================

export type {
  CoreMethodology,
  LegacyMethodology,
  MethodologyType,
  QueryType,
  QueryAnalysis,
  MethodologySelection,
  MethodologyInfo,
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
  // BoT types
  BoTConfig,
  BoTResult,
  ThoughtNode,
  MetaBuffer,
  DistillationStrategy,
  ThoughtBufferSnapshot,
  BoTCallbacks,
} from './methodologies/types.js';

export { METHODOLOGY_INFO } from './methodologies/types.js';

export {
  METHODOLOGY_REGISTRY,
  getMethodology,
  getImplementedMethodologies,
  getPlannedMethodologies,
  getMethodologyStats,
  getMethodologiesByTier,
  isImplemented,
  getMethodologiesByUseCase,
  type MethodologyEntry,
} from './methodologies/registry.js';

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
// GROUNDING GUARD (NEW in v0.4.0)
// ============================================================================

export {
  GroundingGuard,
  DEFAULT_GROUNDING_CONFIG,
  DEFAULT_TRIGGER_CONFIG,
  detectHype,
  detectEcho,
  detectDrift,
  detectFactuality,
  clearEmbeddingCache,
  checkFactualityServiceHealth,
  configureFactualityService,
  type GroundingConfig,
  type GroundingAlert,
  type GroundingResult,
  type AlertType,
  type AlertSeverity,
  type TriggerConfig,
  type TriggerPriority,
} from './grounding/index.js';

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
