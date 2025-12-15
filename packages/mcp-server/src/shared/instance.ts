/**
 * Shared AkhAI instance
 *
 * Global singleton instance that persists across tool calls for efficiency.
 * Both query and status tools can access this instance.
 */

import { createAkhAI, type ModelFamily } from '@akhai/core';

/**
 * Global AkhAI instance (singleton)
 */
let globalAkhaiInstance: ReturnType<typeof createAkhAI> | null = null;
let globalMotherBaseFamily: ModelFamily | null = null;

/**
 * Initialize or get AkhAI instance
 *
 * @param motherBaseFamily - Model family for Mother Base
 * @returns AkhAI instance
 */
export function getAkhaiInstance(motherBaseFamily: ModelFamily): ReturnType<typeof createAkhAI> {
  // Reuse instance if same family
  if (globalAkhaiInstance && globalMotherBaseFamily === motherBaseFamily) {
    return globalAkhaiInstance;
  }

  // Create new instance
  console.error(`[AkhAI] Creating new instance with Mother Base: ${motherBaseFamily}`);

  const akhai = createAkhAI(motherBaseFamily);

  // Set API keys from environment (4 providers)
  akhai.setApiKeys({
    anthropic: process.env.ANTHROPIC_API_KEY,
    deepseek: process.env.DEEPSEEK_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
    xai: process.env.XAI_API_KEY,
  });

  // Setup Mother Base
  akhai.setupMotherBase();

  // Setup Advisor Layer (defaults: deepseek for both slots 1 & 2)
  akhai.setupAdvisorLayer(
    (process.env.ADVISOR_SLOT_1 as ModelFamily) || 'deepseek',
    (process.env.ADVISOR_SLOT_2 as ModelFamily) || 'deepseek'
  );

  // Register default sub-agents
  akhai.registerSubAgent('CodingAgent');
  akhai.registerSubAgent('ResearchAgent');
  akhai.registerSubAgent('AnalysisAgent');

  globalAkhaiInstance = akhai;
  globalMotherBaseFamily = motherBaseFamily;

  return akhai;
}

/**
 * Get current AkhAI instance if it exists
 *
 * @returns AkhAI instance or null if not initialized
 */
export function getCurrentInstance(): ReturnType<typeof createAkhAI> | null {
  return globalAkhaiInstance;
}

/**
 * Reset the global instance (for testing)
 */
export function resetInstance(): void {
  globalAkhaiInstance = null;
  globalMotherBaseFamily = null;
}
