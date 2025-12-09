import { ModelFamily, AdvisorSlotInfo, ResolvedAdvisorLayer } from './types.js';

/**
 * Fixed brainstormer slot 3 always uses OpenRouter
 * This ensures diversity in the advisor layer
 */
export const FIXED_BRAINSTORMER_SLOT_3: ModelFamily = 'openrouter';

/**
 * All 10 supported model families
 */
export const ALL_MODEL_FAMILIES: ModelFamily[] = [
  'anthropic',
  'openai',
  'deepseek',
  'qwen',
  'google',
  'mistral',
  'openrouter',
  'ollama',
  'groq',
  'xai'
];

/**
 * ModelAlignmentManager
 *
 * Manages the alignment between Mother Base and Advisor Layer.
 *
 * Rules:
 * 1. Mother Base can be any of the 10 families
 * 2. Advisor Layer Slot 3 is ALWAYS OpenRouter (fixed)
 * 3. Advisor Layer Slots 1-2 must be DIFFERENT from Mother Base
 * 4. Advisor Layer Slot 4 (Redactor) uses SAME family as Mother Base
 * 5. Sub-Agents use SAME family as Mother Base
 *
 * Example:
 * - Mother Base: Anthropic
 * - Advisor Layer:
 *   - Slot 1: DeepSeek (brainstormer, different from Mother Base)
 *   - Slot 2: Qwen (brainstormer, different from Mother Base)
 *   - Slot 3: OpenRouter (brainstormer, FIXED)
 *   - Slot 4: Anthropic (redactor, SAME as Mother Base)
 * - Sub-Agents: Anthropic (SAME as Mother Base)
 */
export class ModelAlignmentManager {
  private primaryFamily: ModelFamily;

  constructor(motherBaseFamily: ModelFamily) {
    if (!ALL_MODEL_FAMILIES.includes(motherBaseFamily)) {
      throw new Error(`Invalid model family: ${motherBaseFamily}. Must be one of: ${ALL_MODEL_FAMILIES.join(', ')}`);
    }
    this.primaryFamily = motherBaseFamily;
  }

  /**
   * Get the Mother Base model family
   */
  getMotherBaseFamily(): ModelFamily {
    return this.primaryFamily;
  }

  /**
   * Get available model families for brainstormer slots 1-2
   * Excludes Mother Base family and OpenRouter (reserved for slot 3)
   */
  getAvailableBrainstormerFamilies(): ModelFamily[] {
    return ALL_MODEL_FAMILIES.filter(
      f => f !== this.primaryFamily && f !== FIXED_BRAINSTORMER_SLOT_3
    );
  }

  /**
   * Validate that a slot assignment is valid
   *
   * @param slot - Slot number (1-4)
   * @param family - Model family to assign
   * @returns true if valid, false otherwise
   */
  validateSlotAssignment(slot: 1 | 2 | 3 | 4, family: ModelFamily): boolean {
    switch (slot) {
      case 1:
      case 2:
        // Slots 1-2: Must be different from Mother Base
        return family !== this.primaryFamily;

      case 3:
        // Slot 3: Must be OpenRouter (fixed)
        return family === FIXED_BRAINSTORMER_SLOT_3;

      case 4:
        // Slot 4 (Redactor): Must be same as Mother Base
        return family === this.primaryFamily;

      default:
        return false;
    }
  }

  /**
   * Get the complete Advisor Layer configuration
   *
   * @param slot1Family - Model family for slot 1 (brainstormer)
   * @param slot2Family - Model family for slot 2 (brainstormer)
   * @returns Resolved advisor layer with all 4 slots configured
   * @throws Error if slot assignments are invalid
   */
  getAdvisorLayerConfig(
    slot1Family: ModelFamily,
    slot2Family: ModelFamily
  ): ResolvedAdvisorLayer {
    // Validate slot 1
    if (slot1Family === this.primaryFamily) {
      throw new Error(
        `Brainstormer slot 1 cannot use Mother Base family (${this.primaryFamily}). ` +
        `Available: ${this.getAvailableBrainstormerFamilies().join(', ')}`
      );
    }

    // Validate slot 2
    if (slot2Family === this.primaryFamily) {
      throw new Error(
        `Brainstormer slot 2 cannot use Mother Base family (${this.primaryFamily}). ` +
        `Available: ${this.getAvailableBrainstormerFamilies().join(', ')}`
      );
    }

    // Validate that slots 1 and 2 are not OpenRouter (reserved for slot 3)
    if (slot1Family === FIXED_BRAINSTORMER_SLOT_3) {
      throw new Error(`Slot 1 cannot use ${FIXED_BRAINSTORMER_SLOT_3} (reserved for slot 3)`);
    }
    if (slot2Family === FIXED_BRAINSTORMER_SLOT_3) {
      throw new Error(`Slot 2 cannot use ${FIXED_BRAINSTORMER_SLOT_3} (reserved for slot 3)`);
    }

    // Validate that slots 1 and 2 are different (for diversity)
    if (slot1Family === slot2Family) {
      throw new Error(
        `Slots 1 and 2 should use different model families for maximum diversity. ` +
        `Both are currently: ${slot1Family}`
      );
    }

    // Return resolved configuration
    return {
      slot1: {
        slot: 1,
        family: slot1Family,
        role: 'brainstormer',
        isAlignedWithMotherBase: false
      },
      slot2: {
        slot: 2,
        family: slot2Family,
        role: 'brainstormer',
        isAlignedWithMotherBase: false
      },
      slot3: {
        slot: 3,
        family: FIXED_BRAINSTORMER_SLOT_3,
        role: 'brainstormer',
        isAlignedWithMotherBase: false
      },
      slot4: {
        slot: 4,
        family: this.primaryFamily,
        role: 'redactor',
        isAlignedWithMotherBase: true
      }
    };
  }

  /**
   * Get the model family for sub-agents
   * Sub-agents always use the same family as Mother Base
   */
  getSubAgentFamily(): ModelFamily {
    return this.primaryFamily;
  }

  /**
   * Get a summary of the current alignment configuration
   */
  getSummary(): string {
    const available = this.getAvailableBrainstormerFamilies();
    return [
      `Mother Base: ${this.primaryFamily}`,
      `Advisor Layer:`,
      `  - Slot 1: User choice (from: ${available.join(', ')})`,
      `  - Slot 2: User choice (from: ${available.join(', ')})`,
      `  - Slot 3: ${FIXED_BRAINSTORMER_SLOT_3} (fixed)`,
      `  - Slot 4: ${this.primaryFamily} (redactor, aligned with Mother Base)`,
      `Sub-Agents: ${this.primaryFamily} (aligned with Mother Base)`
    ].join('\n');
  }
}
