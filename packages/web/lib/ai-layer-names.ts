/**
 * AI Computational Layer Names
 *
 * Maps the Tree of Life concepts to pure AI/ML terminology.
 * Used throughout the UI for consistent naming.
 */

import { Layer } from './layer-registry'

/**
 * AI Processing Layers (formerly Layers)
 * Ordered by computational hierarchy from highest (meta) to lowest (input)
 */
export const AI_LAYER_NAMES: Record<number, {
  name: string
  short: string
  description: string
  symbol: string
}> = {
  [Layer.META_CORE]: {
    name: 'Meta-Learning Core',
    short: 'meta-core',
    description: 'Self-improvement and meta-cognition layer',
    symbol: '◈'
  },
  [Layer.REASONING]: {
    name: 'Abstract Reasoning Module',
    short: 'reasoning',
    description: 'High-level pattern recognition and intuition',
    symbol: '◇'
  },
  [Layer.ENCODER]: {
    name: 'Transformer Encoder',
    short: 'encoder',
    description: 'Logical analysis and language understanding',
    symbol: '▣'
  },
  [Layer.EXPANSION]: {
    name: 'Beam Search Expansion',
    short: 'expansion',
    description: 'Solution space exploration and creativity',
    symbol: '◐'
  },
  [Layer.DISCRIMINATOR]: {
    name: 'Discriminator Network',
    short: 'discriminator',
    description: 'Quality filtering and constraint enforcement',
    symbol: '◑'
  },
  [Layer.ATTENTION]: {
    name: 'Multi-Head Attention',
    short: 'attention',
    description: 'Context balancing and synthesis',
    symbol: '◉'
  },
  [Layer.GENERATIVE]: {
    name: 'Generative Model',
    short: 'generative',
    description: 'Content creation and creative output',
    symbol: '◔'
  },
  [Layer.CLASSIFIER]: {
    name: 'Classifier Network',
    short: 'classifier',
    description: 'Categorization and structured output',
    symbol: '◕'
  },
  [Layer.EXECUTOR]: {
    name: 'Algorithm Executor',
    short: 'executor',
    description: 'Process execution and memory integration',
    symbol: '○'
  },
  [Layer.EMBEDDING]: {
    name: 'Token Embedding Layer',
    short: 'embedding',
    description: 'Input processing and grounding',
    symbol: '●'
  },
  [Layer.SYNTHESIS]: {
    name: 'Emergent Synthesis Layer',
    short: 'synthesis',
    description: 'Hidden knowledge integration',
    symbol: '◎'
  },
}

/**
 * Anti-Pattern Detection Layers (formerly Antipatterns)
 * Shadow monitors that detect processing failures
 */
export const ANTI_PATTERN_NAMES: Record<number, {
  name: string
  short: string
  description: string
  aiManifestation: string
}> = {
  [Layer.META_CORE]: {
    name: 'Conflicting Self-References',
    short: 'self-conflict',
    description: 'Detected contradictory meta-cognition',
    aiManifestation: 'Model exhibits contradictory self-assessment or overconfident meta-reasoning'
  },
  [Layer.REASONING]: {
    name: 'Pattern Recognition Blocks',
    short: 'pattern-block',
    description: 'Creative intuition suppressed',
    aiManifestation: 'Over-reliance on existing patterns, failure to recognize novel solutions'
  },
  [Layer.ENCODER]: {
    name: 'Logic Gap Detection',
    short: 'logic-gaps',
    description: 'Hidden assumptions or reasoning holes',
    aiManifestation: 'Logical fallacies, unstated assumptions, incomplete reasoning chains'
  },
  [Layer.EXPANSION]: {
    name: 'Verbosity Overflow',
    short: 'verbosity',
    description: 'Excessive expansion filtered',
    aiManifestation: 'Unnecessary elaboration, scope creep, unfocused exploration'
  },
  [Layer.DISCRIMINATOR]: {
    name: 'Over-Restriction Filter',
    short: 'over-filter',
    description: 'Too much constraint applied',
    aiManifestation: 'Excessive filtering, overly conservative outputs, false negatives'
  },
  [Layer.ATTENTION]: {
    name: 'Bias Detection Module',
    short: 'bias-detect',
    description: 'Imbalance or bias flagged',
    aiManifestation: 'Systematic bias in outputs, unbalanced perspectives, echo chamber effects'
  },
  [Layer.GENERATIVE]: {
    name: 'Abandoned Pathway Tracker',
    short: 'abandoned',
    description: 'Creative paths not explored',
    aiManifestation: 'Premature termination of creative exploration, unexplored solution paths'
  },
  [Layer.CLASSIFIER]: {
    name: 'Ambiguity Detector',
    short: 'ambiguity',
    description: 'Unclear or confusing output',
    aiManifestation: 'Vague classifications, uncertain categorizations, unclear structure'
  },
  [Layer.EXECUTOR]: {
    name: 'Context Loss Monitor',
    short: 'context-loss',
    description: 'Memory or context degradation',
    aiManifestation: 'Lost context from earlier conversation, inconsistent memory recall'
  },
  [Layer.EMBEDDING]: {
    name: 'Ungrounded Speculation Flag',
    short: 'ungrounded',
    description: 'Claims without evidence',
    aiManifestation: 'Hallucinations, fabricated facts, unverified claims presented as truth'
  },
  [Layer.SYNTHESIS]: {
    name: 'Synthesis Failure',
    short: 'synth-fail',
    description: 'Failed to integrate knowledge',
    aiManifestation: 'Disconnected insights, failure to synthesize multiple knowledge sources'
  },
}

/**
 * Get AI layer name by Layer ID
 */
export function getLayerName(layerNode: Layer): string {
  return AI_LAYER_NAMES[layerNode]?.name || 'Unknown Layer'
}

/**
 * Get short AI layer name
 */
export function getLayerShort(layerNode: Layer): string {
  return AI_LAYER_NAMES[layerNode]?.short || 'unknown'
}

/**
 * Get anti-pattern name by Layer ID
 */
export function getAntiPatternName(layerNode: Layer): string {
  return ANTI_PATTERN_NAMES[layerNode]?.name || 'Unknown Anti-Pattern'
}

/**
 * Get short anti-pattern name
 */
export function getAntiPatternShort(layerNode: Layer): string {
  return ANTI_PATTERN_NAMES[layerNode]?.short || 'unknown'
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
  ANTIPATTERN_SHADOWS: 'Anti-Pattern Monitors',
  GUARD: 'Quality Filter',
  METHODOLOGY: 'Reasoning Mode',

  // Processing
  DOMINANT_LAYER: 'Primary Layer',
  ACTIVATION: 'Layer Activity',
  GNOSTIC_ANNOTATION: 'Processing Report',
  LAYERS_CONSOLE: 'Layer Console',

  // Actions
  TEST_QUERY: 'Test Query',
  RUN_TEST: 'Run Test',
  APPLY_CONFIG: 'Apply Configuration',
  RESET: 'Reset to Defaults',
}
