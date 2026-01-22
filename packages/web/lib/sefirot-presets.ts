/**
 * AI LAYER PRESETS
 * Shared preset configurations for AI Processing Layer weights
 *
 * All presets use lowercase names for consistency across:
 * - lib/stores/sefirot-store.ts
 * - components/SefirotConsole.tsx (Layer Console)
 * - components/TreeConfigurationModal.tsx (Model Configuration)
 * - lib/tree-configuration.ts
 */

import { Sefirah } from './ascent-tracker'
import { AI_LAYER_NAMES } from './ai-layer-names'

// Re-export AI_LAYER_NAMES for convenience
export { AI_LAYER_NAMES }

/**
 * Calibrated AI Layer Preset Weights
 *
 * Weight ranges: 0.0 (inactive) to 1.0 (maximum)
 * Threshold: weights > 0.1 are considered active
 */
export const SEFIROT_PRESETS = {
  analytical: {
    [Sefirah.MALKUTH]: 0.4,    // Embedding - moderate
    [Sefirah.YESOD]: 0.5,      // Executor - moderate
    [Sefirah.HOD]: 0.95,       // Classifier - HIGH
    [Sefirah.NETZACH]: 0.3,    // Generative - low
    [Sefirah.TIFERET]: 0.9,    // Attention - HIGH
    [Sefirah.GEVURAH]: 0.6,    // Discriminator - moderate
    [Sefirah.CHESED]: 0.3,     // Expansion - low
    [Sefirah.BINAH]: 0.85,     // Encoder - HIGH
    [Sefirah.CHOKMAH]: 0.6,    // Reasoning - moderate
    [Sefirah.KETHER]: 0.7,     // Meta-Core - moderate
    [Sefirah.DAAT]: 0.5,       // Synthesis - moderate
  },
  creative: {
    [Sefirah.MALKUTH]: 0.7,    // Embedding - moderate
    [Sefirah.YESOD]: 0.9,      // Executor - high
    [Sefirah.HOD]: 0.4,        // Classifier - low (less rigid)
    [Sefirah.NETZACH]: 0.95,   // Generative - HIGH
    [Sefirah.TIFERET]: 0.2,    // Attention - low (divergent)
    [Sefirah.GEVURAH]: 0.6,    // Discriminator - moderate
    [Sefirah.CHESED]: 0.95,    // Expansion - HIGH
    [Sefirah.BINAH]: 0.5,      // Encoder - moderate
    [Sefirah.CHOKMAH]: 0.7,    // Reasoning - moderate
    [Sefirah.KETHER]: 0.4,     // Meta-Core - low
    [Sefirah.DAAT]: 0.85,      // Synthesis - HIGH
  },
  balanced: {
    [Sefirah.MALKUTH]: 0.5,    // Embedding
    [Sefirah.YESOD]: 0.5,      // Executor
    [Sefirah.HOD]: 0.5,        // Classifier
    [Sefirah.NETZACH]: 0.5,    // Generative
    [Sefirah.TIFERET]: 0.5,    // Attention
    [Sefirah.GEVURAH]: 0.7,    // Discriminator - higher for quality
    [Sefirah.CHESED]: 0.5,     // Expansion
    [Sefirah.BINAH]: 0.5,      // Encoder
    [Sefirah.CHOKMAH]: 0.5,    // Reasoning
    [Sefirah.KETHER]: 0.5,     // Meta-Core
    [Sefirah.DAAT]: 0.5,       // Synthesis
  },
  deep: {
    [Sefirah.MALKUTH]: 0.85,   // Embedding - HIGH (deep data)
    [Sefirah.YESOD]: 0.8,      // Executor - high
    [Sefirah.HOD]: 0.8,        // Classifier - high
    [Sefirah.NETZACH]: 0.6,    // Generative - moderate
    [Sefirah.TIFERET]: 0.5,    // Attention - moderate
    [Sefirah.GEVURAH]: 0.75,   // Discriminator - high (quality)
    [Sefirah.CHESED]: 0.6,     // Expansion - moderate
    [Sefirah.BINAH]: 0.7,      // Encoder - moderate
    [Sefirah.CHOKMAH]: 0.85,   // Reasoning - HIGH
    [Sefirah.KETHER]: 0.5,     // Meta-Core - moderate
    [Sefirah.DAAT]: 0.95,      // Synthesis - HIGH (breakthrough)
  },
} as const

export type PresetName = keyof typeof SEFIROT_PRESETS

export const PRESET_NAMES: PresetName[] = ['analytical', 'creative', 'balanced', 'deep']

/**
 * Get a copy of preset weights (safe to modify)
 */
export function getPresetWeights(name: PresetName): Record<number, number> {
  return { ...SEFIROT_PRESETS[name] }
}

/**
 * Get default balanced weights
 */
export function getDefaultWeights(): Record<number, number> {
  return getPresetWeights('balanced')
}
