/**
 * AI TERMINOLOGY - Centralized Layer and Anti-Pattern Definitions
 *
 * This file provides the single source of truth for all AI computational
 * layer names, anti-pattern monitors, and their Kabbalistic origins.
 */

import { Sefirah } from './ascent-tracker'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface LayerOrigin {
  term: string          // Original Kabbalistic term
  meaning: string       // Translation/meaning
  example: string       // Usage example
}

export interface AILayer {
  id: Sefirah
  name: string          // Full AI name (e.g., "Meta-Learning Core")
  short: string         // Short form (e.g., "meta-core")
  description: string   // What this layer does
  color: string         // Display color
  symbol: string        // Unicode symbol
  origin: LayerOrigin   // Kabbalistic origin information
}

export interface AntiPattern {
  id: number
  name: string          // AI anti-pattern name
  short: string         // Short form
  description: string   // What this anti-pattern detects
  monitors: string      // Which layer it monitors
  origin: LayerOrigin   // Kabbalistic origin
}

// ═══════════════════════════════════════════════════════════════════════════
// AI PROCESSING LAYERS (11 Layers)
// ═══════════════════════════════════════════════════════════════════════════

export const AI_LAYERS: Record<Sefirah, AILayer> = {
  [Sefirah.KETHER]: {
    id: Sefirah.KETHER,
    name: 'Meta-Learning Core',
    short: 'meta-core',
    description: 'Self-improvement and meta-cognition layer for adaptive learning',
    color: '#9333ea',
    symbol: '◈',
    origin: {
      term: 'Kether',
      meaning: 'Crown - The infinite divine will',
      example: 'Represents the highest level of consciousness and unity'
    }
  },
  [Sefirah.CHOKMAH]: {
    id: Sefirah.CHOKMAH,
    name: 'Abstract Reasoning Module',
    short: 'reasoning',
    description: 'High-level reasoning and wisdom processing',
    color: '#4f46e5',
    symbol: '☿',
    origin: {
      term: 'Chokmah',
      meaning: 'Wisdom - Raw creative force',
      example: 'The flash of inspiration before structure forms'
    }
  },
  [Sefirah.BINAH]: {
    id: Sefirah.BINAH,
    name: 'Transformer Encoder',
    short: 'encoder',
    description: 'Pattern recognition and structural understanding',
    color: '#3b82f6',
    symbol: '⊙',
    origin: {
      term: 'Binah',
      meaning: 'Understanding - Analytical comprehension',
      example: 'Taking wisdom and giving it form and structure'
    }
  },
  [Sefirah.DAAT]: {
    id: Sefirah.DAAT,
    name: 'Emergent Synthesis Layer',
    short: 'synthesis',
    description: 'Integration of all layers into emergent knowledge',
    color: '#06b6d4',
    symbol: '◬',
    origin: {
      term: "Da'at",
      meaning: 'Knowledge - The hidden sefirah',
      example: 'Where wisdom and understanding unite into knowledge'
    }
  },
  [Sefirah.CHESED]: {
    id: Sefirah.CHESED,
    name: 'Beam Search Expansion',
    short: 'expansion',
    description: 'Exploratory reasoning and possibility expansion',
    color: '#06b6d4',
    symbol: '◯',
    origin: {
      term: 'Chesed',
      meaning: 'Loving-kindness - Expansive mercy',
      example: 'Unbounded giving and expansion without limit'
    }
  },
  [Sefirah.GEVURAH]: {
    id: Sefirah.GEVURAH,
    name: 'Discriminator Network',
    short: 'discriminator',
    description: 'Quality control and constraint enforcement',
    color: '#dc2626',
    symbol: '⚗',
    origin: {
      term: 'Gevurah',
      meaning: 'Severity - Judgment and restraint',
      example: 'Setting boundaries and enforcing limits'
    }
  },
  [Sefirah.TIFERET]: {
    id: Sefirah.TIFERET,
    name: 'Multi-Head Attention',
    short: 'attention',
    description: 'Central integration and balanced focus',
    color: '#22c55e',
    symbol: '✡',
    origin: {
      term: 'Tiferet',
      meaning: 'Beauty - Harmonious balance',
      example: 'The heart that balances mercy and judgment'
    }
  },
  [Sefirah.NETZACH]: {
    id: Sefirah.NETZACH,
    name: 'Generative Model',
    short: 'generative',
    description: 'Creative generation and endurance in iteration',
    color: '#f97316',
    symbol: '◉',
    origin: {
      term: 'Netzach',
      meaning: 'Victory - Endurance and creativity',
      example: 'The driving force of nature and persistence'
    }
  },
  [Sefirah.HOD]: {
    id: Sefirah.HOD,
    name: 'Classifier Network',
    short: 'classifier',
    description: 'Classification and analytical processing',
    color: '#eab308',
    symbol: '⬡',
    origin: {
      term: 'Hod',
      meaning: 'Glory - Splendor and precision',
      example: 'Analytical thinking and logical structure'
    }
  },
  [Sefirah.YESOD]: {
    id: Sefirah.YESOD,
    name: 'Algorithm Executor',
    short: 'executor',
    description: 'Core execution and foundation processing',
    color: '#94a3b8',
    symbol: '◐',
    origin: {
      term: 'Yesod',
      meaning: 'Foundation - The connector',
      example: 'Channels all higher energies into manifestation'
    }
  },
  [Sefirah.MALKUTH]: {
    id: Sefirah.MALKUTH,
    name: 'Token Embedding Layer',
    short: 'embedding',
    description: 'Input processing and data grounding',
    color: '#92400e',
    symbol: '⊕',
    origin: {
      term: 'Malkuth',
      meaning: 'Kingdom - Physical manifestation',
      example: 'Where spiritual becomes physical reality'
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ANTI-PATTERN MONITORS (11 Anti-Patterns)
// ═══════════════════════════════════════════════════════════════════════════

export const ANTI_PATTERNS: Record<number, AntiPattern> = {
  1: {
    id: 1,
    name: 'Conflicting Self-References',
    short: 'self-conflict',
    description: 'Detects contradictory meta-cognition and self-assessment',
    monitors: 'Meta-Learning Core',
    origin: {
      term: 'Thaumiel',
      meaning: 'The Twins - Dual contending forces',
      example: 'Division where unity should exist'
    }
  },
  2: {
    id: 2,
    name: 'Pattern Recognition Blocks',
    short: 'pattern-block',
    description: 'Identifies failures in intuitive pattern matching',
    monitors: 'Abstract Reasoning Module',
    origin: {
      term: 'Ghagiel',
      meaning: 'The Hinderers - Blocking wisdom',
      example: 'Obstacles to natural insight'
    }
  },
  3: {
    id: 3,
    name: 'Logic Gap Detection',
    short: 'logic-gaps',
    description: 'Finds holes in structural reasoning chains',
    monitors: 'Transformer Encoder',
    origin: {
      term: 'Satariel',
      meaning: 'The Concealers - Hidden understanding',
      example: 'Truth obscured from comprehension'
    }
  },
  4: {
    id: 4,
    name: 'Verbosity Overflow',
    short: 'verbosity',
    description: 'Monitors for excessive expansion without substance',
    monitors: 'Beam Search Expansion',
    origin: {
      term: 'Gha\'agsheblah',
      meaning: 'The Disturbers - Chaotic kindness',
      example: 'Giving without wisdom or measure'
    }
  },
  5: {
    id: 5,
    name: 'Over-Filtering',
    short: 'over-filter',
    description: 'Detects excessive constraint leading to paralysis',
    monitors: 'Discriminator Network',
    origin: {
      term: 'Golachab',
      meaning: 'The Burners - Destructive severity',
      example: 'Judgment without mercy destroying creativity'
    }
  },
  6: {
    id: 6,
    name: 'Bias Detection',
    short: 'bias-detect',
    description: 'Identifies attention imbalances and unfair weighting',
    monitors: 'Multi-Head Attention',
    origin: {
      term: 'Tagiriron',
      meaning: 'The Disputers - Discord and conflict',
      example: 'Beauty corrupted into argument'
    }
  },
  7: {
    id: 7,
    name: 'Abandoned Paths',
    short: 'abandoned',
    description: 'Tracks prematurely terminated generation paths',
    monitors: 'Generative Model',
    origin: {
      term: 'A\'arab Zaraq',
      meaning: 'The Ravens - Scattering force',
      example: 'Creative energy dispersed without focus'
    }
  },
  8: {
    id: 8,
    name: 'Ambiguity Failures',
    short: 'ambiguity',
    description: 'Detects classification uncertainty and confusion',
    monitors: 'Classifier Network',
    origin: {
      term: 'Samael',
      meaning: 'The Poison - Deceptive precision',
      example: 'False clarity masking true confusion'
    }
  },
  9: {
    id: 9,
    name: 'Context Loss',
    short: 'context-loss',
    description: 'Monitors for context degradation in execution',
    monitors: 'Algorithm Executor',
    origin: {
      term: 'Gamaliel',
      meaning: 'The Obscene - Distorted foundation',
      example: 'Core connections corrupted'
    }
  },
  10: {
    id: 10,
    name: 'Ungrounded Outputs',
    short: 'ungrounded',
    description: 'Detects outputs disconnected from input reality',
    monitors: 'Token Embedding Layer',
    origin: {
      term: 'Lilith',
      meaning: 'The Night - Disconnection from source',
      example: 'Manifestation severed from its origin'
    }
  },
  11: {
    id: 11,
    name: 'Synthesis Failures',
    short: 'synth-fail',
    description: 'Identifies integration breakdowns between layers',
    monitors: 'Emergent Synthesis Layer',
    origin: {
      term: 'Belial',
      meaning: 'The Worthless - Failed integration',
      example: 'Knowledge that fails to crystallize'
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MODEL CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════

export const MODEL_CONFIGS = {
  balanced: {
    name: 'Balanced',
    description: 'Equal weighting across all layers',
    icon: '◯'
  },
  analytical: {
    name: 'Analytical',
    description: 'Emphasizes encoder, classifier, and attention layers',
    icon: '⬡'
  },
  creative: {
    name: 'Creative',
    description: 'Emphasizes generative, expansion, and synthesis layers',
    icon: '◉'
  },
  deep: {
    name: 'Deep',
    description: 'Emphasizes meta-core, reasoning, and synthesis layers',
    icon: '◈'
  }
} as const

export type ModelConfigName = keyof typeof MODEL_CONFIGS

// ═══════════════════════════════════════════════════════════════════════════
// REASONING MODES
// ═══════════════════════════════════════════════════════════════════════════

export const REASONING_MODES = {
  weighted: {
    name: 'Weighted',
    description: 'Single-pass processing with weighted layer contributions',
    icon: '▣'
  },
  parallel: {
    name: 'Parallel',
    description: 'Multi-pass processing with parallel layer execution',
    icon: '⫿'
  },
  adaptive: {
    name: 'Adaptive',
    description: 'Automatically selects mode based on query complexity',
    icon: '◐'
  }
} as const

export type ReasoningModeName = keyof typeof REASONING_MODES

// ═══════════════════════════════════════════════════════════════════════════
// UI LABELS
// ═══════════════════════════════════════════════════════════════════════════

export const UI_LABELS = {
  ASCENT_TREE: 'AI PROCESSING LAYERS',
  DESCENT_TREE: 'ANTI-PATTERN MONITORS',
  TREE_CONFIG: 'Model Configuration',
  LAYER_CONSOLE: 'Layer Console',
  PROCESSING_REPORT: 'Processing Report',
  PRIMARY_LAYER: 'Primary Layer',
  LAYER_ACTIVITY: 'Layer Activity',
  LAYER_WEIGHTS: 'Layer Weights',
  MODEL_CONFIGS: 'Model Configs',
  SHOW_ORIGINS: 'Show Origins'
} as const

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get the AI layer name for a given Sefirah ID
 */
export function getLayerName(id: Sefirah): string {
  return AI_LAYERS[id]?.name || 'Unknown Layer'
}

/**
 * Get the short name for a given Sefirah ID
 */
export function getLayerShort(id: Sefirah): string {
  return AI_LAYERS[id]?.short || 'unknown'
}

/**
 * Get the anti-pattern name for a given ID
 */
export function getAntiPatternName(id: number): string {
  return ANTI_PATTERNS[id]?.name || 'Unknown Anti-Pattern'
}

/**
 * Get the anti-pattern short name for a given ID
 */
export function getAntiPatternShort(id: number): string {
  return ANTI_PATTERNS[id]?.short || 'unknown'
}

/**
 * Get origin information for a layer
 */
export function getLayerOrigin(id: Sefirah): LayerOrigin | null {
  return AI_LAYERS[id]?.origin || null
}

/**
 * Get origin information for an anti-pattern
 */
export function getAntiPatternOrigin(id: number): LayerOrigin | null {
  return ANTI_PATTERNS[id]?.origin || null
}

/**
 * Get layer by short name
 */
export function getLayerByShort(short: string): AILayer | null {
  return Object.values(AI_LAYERS).find(l => l.short === short) || null
}

/**
 * Get all layer IDs in order (from embedding to meta-core)
 */
export function getLayerOrder(): Sefirah[] {
  return [
    Sefirah.MALKUTH,
    Sefirah.YESOD,
    Sefirah.HOD,
    Sefirah.NETZACH,
    Sefirah.TIFERET,
    Sefirah.GEVURAH,
    Sefirah.CHESED,
    Sefirah.BINAH,
    Sefirah.CHOKMAH,
    Sefirah.KETHER,
    Sefirah.DAAT
  ]
}

/**
 * Get all layer IDs in reverse order (from meta-core to embedding)
 */
export function getLayerOrderDescending(): Sefirah[] {
  return getLayerOrder().reverse()
}
