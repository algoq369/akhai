/**
 * AI Computational Layer Names
 *
 * Maps the Tree of Life concepts to pure AI/ML terminology.
 * Used throughout the UI for consistent naming.
 */

import { Sefirah } from './ascent-tracker'

/**
 * AI Processing Layers (formerly Sephiroth)
 * Ordered by computational hierarchy from highest (meta) to lowest (input)
 */
export const AI_LAYER_NAMES: Record<number, {
  name: string
  short: string
  description: string
  symbol: string
}> = {
  [Sefirah.KETHER]: {
    name: 'Meta-Learning Core',
    short: 'meta-core',
    description: 'Self-improvement and meta-cognition layer',
    symbol: '◈'
  },
  [Sefirah.CHOKMAH]: {
    name: 'Abstract Reasoning Module',
    short: 'reasoning',
    description: 'High-level pattern recognition and intuition',
    symbol: '◇'
  },
  [Sefirah.BINAH]: {
    name: 'Transformer Encoder',
    short: 'encoder',
    description: 'Logical analysis and language understanding',
    symbol: '▣'
  },
  [Sefirah.CHESED]: {
    name: 'Beam Search Expansion',
    short: 'expansion',
    description: 'Solution space exploration and creativity',
    symbol: '◐'
  },
  [Sefirah.GEVURAH]: {
    name: 'Discriminator Network',
    short: 'discriminator',
    description: 'Quality filtering and constraint enforcement',
    symbol: '◑'
  },
  [Sefirah.TIFERET]: {
    name: 'Multi-Head Attention',
    short: 'attention',
    description: 'Context balancing and synthesis',
    symbol: '◉'
  },
  [Sefirah.NETZACH]: {
    name: 'Generative Model',
    short: 'generative',
    description: 'Content creation and creative output',
    symbol: '◔'
  },
  [Sefirah.HOD]: {
    name: 'Classifier Network',
    short: 'classifier',
    description: 'Categorization and structured output',
    symbol: '◕'
  },
  [Sefirah.YESOD]: {
    name: 'Algorithm Executor',
    short: 'executor',
    description: 'Process execution and memory integration',
    symbol: '○'
  },
  [Sefirah.MALKUTH]: {
    name: 'Token Embedding Layer',
    short: 'embedding',
    description: 'Input processing and grounding',
    symbol: '●'
  },
  [Sefirah.DAAT]: {
    name: 'Emergent Synthesis Layer',
    short: 'synthesis',
    description: 'Hidden knowledge integration',
    symbol: '◎'
  },
}

/**
 * Anti-Pattern Detection Layers (formerly Qlipoth)
 * Shadow monitors that detect processing failures
 */
export const ANTI_PATTERN_NAMES: Record<number, {
  name: string
  short: string
  description: string
  aiManifestation: string
}> = {
  [Sefirah.KETHER]: {
    name: 'Conflicting Self-References',
    short: 'self-conflict',
    description: 'Detected contradictory meta-cognition',
    aiManifestation: 'Model exhibits contradictory self-assessment or overconfident meta-reasoning'
  },
  [Sefirah.CHOKMAH]: {
    name: 'Pattern Recognition Blocks',
    short: 'pattern-block',
    description: 'Creative intuition suppressed',
    aiManifestation: 'Over-reliance on existing patterns, failure to recognize novel solutions'
  },
  [Sefirah.BINAH]: {
    name: 'Logic Gap Detection',
    short: 'logic-gaps',
    description: 'Hidden assumptions or reasoning holes',
    aiManifestation: 'Logical fallacies, unstated assumptions, incomplete reasoning chains'
  },
  [Sefirah.CHESED]: {
    name: 'Verbosity Overflow',
    short: 'verbosity',
    description: 'Excessive expansion filtered',
    aiManifestation: 'Unnecessary elaboration, scope creep, unfocused exploration'
  },
  [Sefirah.GEVURAH]: {
    name: 'Over-Restriction Filter',
    short: 'over-filter',
    description: 'Too much constraint applied',
    aiManifestation: 'Excessive filtering, overly conservative outputs, false negatives'
  },
  [Sefirah.TIFERET]: {
    name: 'Bias Detection Module',
    short: 'bias-detect',
    description: 'Imbalance or bias flagged',
    aiManifestation: 'Systematic bias in outputs, unbalanced perspectives, echo chamber effects'
  },
  [Sefirah.NETZACH]: {
    name: 'Abandoned Pathway Tracker',
    short: 'abandoned',
    description: 'Creative paths not explored',
    aiManifestation: 'Premature termination of creative exploration, unexplored solution paths'
  },
  [Sefirah.HOD]: {
    name: 'Ambiguity Detector',
    short: 'ambiguity',
    description: 'Unclear or confusing output',
    aiManifestation: 'Vague classifications, uncertain categorizations, unclear structure'
  },
  [Sefirah.YESOD]: {
    name: 'Context Loss Monitor',
    short: 'context-loss',
    description: 'Memory or context degradation',
    aiManifestation: 'Lost context from earlier conversation, inconsistent memory recall'
  },
  [Sefirah.MALKUTH]: {
    name: 'Ungrounded Speculation Flag',
    short: 'ungrounded',
    description: 'Claims without evidence',
    aiManifestation: 'Hallucinations, fabricated facts, unverified claims presented as truth'
  },
  [Sefirah.DAAT]: {
    name: 'Synthesis Failure',
    short: 'synth-fail',
    description: 'Failed to integrate knowledge',
    aiManifestation: 'Disconnected insights, failure to synthesize multiple knowledge sources'
  },
}

/**
 * Get AI layer name by Sefirah ID
 */
export function getLayerName(sefirah: Sefirah): string {
  return AI_LAYER_NAMES[sefirah]?.name || 'Unknown Layer'
}

/**
 * Get short AI layer name
 */
export function getLayerShort(sefirah: Sefirah): string {
  return AI_LAYER_NAMES[sefirah]?.short || 'unknown'
}

/**
 * Get anti-pattern name by Sefirah ID
 */
export function getAntiPatternName(sefirah: Sefirah): string {
  return ANTI_PATTERN_NAMES[sefirah]?.name || 'Unknown Anti-Pattern'
}

/**
 * Get short anti-pattern name
 */
export function getAntiPatternShort(sefirah: Sefirah): string {
  return ANTI_PATTERN_NAMES[sefirah]?.short || 'unknown'
}

/**
 * UI Label mappings for consistent terminology
 */
export const UI_LABELS = {
  // Section titles
  ASCENT_TREE: 'AI PROCESSING LAYERS',
  DESCENT_TREE: 'ANTI-PATTERN DETECTION',

  // Configuration
  TREE_CONFIG: 'Model Configuration',
  PRESETS: 'Model Configurations',
  WEIGHTS: 'Layer Weights',
  QLIPOTH_SHADOWS: 'Anti-Pattern Monitors',
  GUARD: 'Quality Filter',
  METHODOLOGY: 'Reasoning Mode',

  // Processing
  DOMINANT_SEFIRAH: 'Primary Layer',
  ACTIVATION: 'Layer Activity',
  GNOSTIC_ANNOTATION: 'Processing Report',
  SEFIROT_CONSOLE: 'Layer Console',

  // Actions
  TEST_QUERY: 'Test Query',
  RUN_TEST: 'Run Test',
  APPLY_CONFIG: 'Apply Configuration',
  RESET: 'Reset to Defaults',
}
