/**
 * @akhai/core
 *
 * Super Research Engine with Multi-AI Consensus
 *
 * Features:
 * - Multi-AI consensus with 4 advisors + Mother Base
 * - Automated verification loops (max 3 rounds, 2 min each)
 * - Flow A: Mother Base Decision
 * - Flow B: Sub-Agent Execution (Direct)
 *
 * Usage:
 * ```typescript
 * import { createAkhAI, ModelFamily } from '@akhai/core';
 *
 * const akhai = createAkhAI('anthropic');
 *
 * akhai.setApiKeys({
 *   anthropic: 'sk-ant-...',
 *   deepseek: 'sk-...',
 *   openrouter: 'sk-or-...'
 * });
 *
 * akhai.setupMotherBase('claude-sonnet-4-20250514');
 * akhai.setupAdvisorLayer('deepseek', 'qwen');
 * akhai.registerSubAgent('CodingAgent');
 *
 * // Flow A: Mother Base Decision
 * const result = await akhai.executeMotherBaseFlow('Analyze architecture');
 *
 * // Flow B: Sub-Agent Execution
 * const agentResult = await akhai.executeSubAgentFlow('Build feature', 'CodingAgent');
 * ```
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
  type IModelProvider,
} from './models/ModelProviderFactory.js';

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
 * import { createAkhAI } from '@akhai/core';
 *
 * const akhai = createAkhAI('anthropic');
 * ```
 */
export function createAkhAI(motherBaseFamily: ModelFamily): AkhAISystem {
  return new AkhAISystem(motherBaseFamily);
}

/**
 * Default export: createAkhAI factory function
 *
 * @example
 * ```typescript
 * import createAkhAI from '@akhai/core';
 *
 * const akhai = createAkhAI('anthropic');
 * ```
 */
export default createAkhAI;
