/**
 * AI LAYER PRESETS
 * Shared preset configurations for AI Processing Layer weights
 *
 * All presets use lowercase names for consistency across:
 * - lib/stores/layer-store.ts
 * - components/LayerConsole.tsx
 * - components/TreeConfigurationModal.tsx (Model Configuration)
 * - lib/tree-configuration.ts
 */

import { Layer } from './layer-registry'
import { AI_LAYER_NAMES } from './ai-layer-names'

// Re-export AI_LAYER_NAMES for convenience
export { AI_LAYER_NAMES }

/**
 * Calibrated AI Layer Preset Weights
 *
 * Weight ranges: 0.0 (inactive) to 1.0 (maximum)
 * Threshold: weights > 0.1 are considered active
 */
export const LAYER_PRESETS = {
  analytical: {
    [Layer.EMBEDDING]: 0.4,    // Embedding - moderate
    [Layer.EXECUTOR]: 0.5,      // Executor - moderate
    [Layer.CLASSIFIER]: 0.95,       // Classifier - HIGH
    [Layer.GENERATIVE]: 0.3,    // Generative - low
    [Layer.ATTENTION]: 0.9,    // Attention - HIGH
    [Layer.DISCRIMINATOR]: 0.6,    // Discriminator - moderate
    [Layer.EXPANSION]: 0.3,     // Expansion - low
    [Layer.ENCODER]: 0.85,     // Encoder - HIGH
    [Layer.REASONING]: 0.6,    // Reasoning - moderate
    [Layer.META_CORE]: 0.7,     // Meta-Core - moderate
    [Layer.SYNTHESIS]: 0.5,       // Synthesis - moderate
  },
  creative: {
    [Layer.EMBEDDING]: 0.7,    // Embedding - moderate
    [Layer.EXECUTOR]: 0.9,      // Executor - high
    [Layer.CLASSIFIER]: 0.4,        // Classifier - low (less rigid)
    [Layer.GENERATIVE]: 0.95,   // Generative - HIGH
    [Layer.ATTENTION]: 0.2,    // Attention - low (divergent)
    [Layer.DISCRIMINATOR]: 0.6,    // Discriminator - moderate
    [Layer.EXPANSION]: 0.95,    // Expansion - HIGH
    [Layer.ENCODER]: 0.5,      // Encoder - moderate
    [Layer.REASONING]: 0.7,    // Reasoning - moderate
    [Layer.META_CORE]: 0.4,     // Meta-Core - low
    [Layer.SYNTHESIS]: 0.85,      // Synthesis - HIGH
  },
  balanced: {
    [Layer.EMBEDDING]: 0.5,    // Embedding
    [Layer.EXECUTOR]: 0.5,      // Executor
    [Layer.CLASSIFIER]: 0.5,        // Classifier
    [Layer.GENERATIVE]: 0.5,    // Generative
    [Layer.ATTENTION]: 0.5,    // Attention
    [Layer.DISCRIMINATOR]: 0.7,    // Discriminator - higher for quality
    [Layer.EXPANSION]: 0.5,     // Expansion
    [Layer.ENCODER]: 0.5,      // Encoder
    [Layer.REASONING]: 0.5,    // Reasoning
    [Layer.META_CORE]: 0.5,     // Meta-Core
    [Layer.SYNTHESIS]: 0.5,       // Synthesis
  },
  deep: {
    [Layer.EMBEDDING]: 0.85,   // Embedding - HIGH (deep data)
    [Layer.EXECUTOR]: 0.8,      // Executor - high
    [Layer.CLASSIFIER]: 0.8,        // Classifier - high
    [Layer.GENERATIVE]: 0.6,    // Generative - moderate
    [Layer.ATTENTION]: 0.5,    // Attention - moderate
    [Layer.DISCRIMINATOR]: 0.75,   // Discriminator - high (quality)
    [Layer.EXPANSION]: 0.6,     // Expansion - moderate
    [Layer.ENCODER]: 0.7,      // Encoder - moderate
    [Layer.REASONING]: 0.85,   // Reasoning - HIGH
    [Layer.META_CORE]: 0.5,     // Meta-Core - moderate
    [Layer.SYNTHESIS]: 0.95,      // Synthesis - HIGH (breakthrough)
  },
} as const

export type PresetName = keyof typeof LAYER_PRESETS

export const PRESET_NAMES: PresetName[] = ['analytical', 'creative', 'balanced', 'deep']

/**
 * Get a copy of preset weights (safe to modify)
 */
export function getPresetWeights(name: PresetName): Record<number, number> {
  return { ...LAYER_PRESETS[name] }
}

/**
 * Get default balanced weights
 */
export function getDefaultWeights(): Record<number, number> {
  return getPresetWeights('balanced')
}
