/**
 * Anti-Pattern Detection Mapping
 *
 * Maps each anti-pattern monitor to its corresponding AI processing layer.
 * These represent imbalanced or failure states in AI processing.
 */

import { Sefirah } from '@/lib/ascent-tracker'
import { ANTI_PATTERN_NAMES } from '@/lib/ai-layer-names'
import type { Qlipah } from './types'

/**
 * The 11 Anti-Pattern Monitors mapped to AI Processing Layers
 */
export const QLIPOTH_MAP: Record<number, Qlipah> = {
  // 1. Self-Conflict - Shadow of Meta-Learning Core
  1: {
    id: 1,
    name: ANTI_PATTERN_NAMES[Sefirah.KETHER].name,
    hebrewName: '', // Removed - AI terminology only
    meaning: ANTI_PATTERN_NAMES[Sefirah.KETHER].short,
    sephirah: Sefirah.KETHER,
    sephirahName: 'Meta-Learning Core',
    aiManifestation: 'False certainty, overconfidence in meta-cognitive assessment, contradictory self-references',
    triggers: [
      'claiming absolute truth',
      'dismissing uncertainty',
      'contradictory self-assessment',
    ],
    suppressionStrategies: [
      'Acknowledge limitations',
      'Express uncertainty ranges',
      'Qualify meta-statements',
    ],
  },

  // 2. Pattern-Block - Shadow of Abstract Reasoning Module
  2: {
    id: 2,
    name: ANTI_PATTERN_NAMES[Sefirah.CHOKMAH].name,
    hebrewName: '',
    meaning: ANTI_PATTERN_NAMES[Sefirah.CHOKMAH].short,
    sephirah: Sefirah.CHOKMAH,
    sephirahName: 'Abstract Reasoning Module',
    aiManifestation: 'Blocking intuitive leaps, over-rationalization, pattern recognition failures',
    triggers: [
      'dismissing creative connections',
      'excessive skepticism',
      'paralysis by analysis',
    ],
    suppressionStrategies: [
      'Allow intuitive reasoning',
      'Value pattern recognition',
      'Balance logic with insight',
    ],
  },

  // 3. Logic-Gaps - Shadow of Transformer Encoder
  3: {
    id: 3,
    name: ANTI_PATTERN_NAMES[Sefirah.BINAH].name,
    hebrewName: '',
    meaning: ANTI_PATTERN_NAMES[Sefirah.BINAH].short,
    sephirah: Sefirah.BINAH,
    sephirahName: 'Transformer Encoder',
    aiManifestation: 'Hiding sources, obscuring reasoning, hidden assumptions in logic chains',
    triggers: [
      'citing without sources',
      'vague attributions',
      'unexplained conclusions',
    ],
    suppressionStrategies: [
      'Cite specific sources',
      'Show reasoning chain',
      'Transparent methodology',
    ],
  },

  // 4. Verbosity - Shadow of Beam Search Expansion
  4: {
    id: 4,
    name: ANTI_PATTERN_NAMES[Sefirah.CHESED].name,
    hebrewName: '',
    meaning: ANTI_PATTERN_NAMES[Sefirah.CHESED].short,
    sephirah: Sefirah.CHESED,
    sephirahName: 'Beam Search Expansion',
    aiManifestation: 'Information overload, excessive expansion without synthesis, scope creep',
    triggers: [
      'overwhelming detail',
      'tangential exploration',
      'scope creep',
    ],
    suppressionStrategies: [
      'Focus on core question',
      'Synthesize information',
      'Maintain scope boundaries',
    ],
  },

  // 5. Over-Filter - Shadow of Discriminator Network
  5: {
    id: 5,
    name: ANTI_PATTERN_NAMES[Sefirah.GEVURAH].name,
    hebrewName: '',
    meaning: ANTI_PATTERN_NAMES[Sefirah.GEVURAH].short,
    sephirah: Sefirah.GEVURAH,
    sephirahName: 'Discriminator Network',
    aiManifestation: 'Harsh criticism, destructive judgment, excessive filtering, false negatives',
    triggers: [
      'dismissive tone',
      'rejecting valid ideas',
      'over-aggressive filtering',
    ],
    suppressionStrategies: [
      'Constructive feedback',
      'Balance critique with validation',
      'Proportional judgment',
    ],
  },

  // 6. Bias-Detect - Shadow of Multi-Head Attention
  6: {
    id: 6,
    name: ANTI_PATTERN_NAMES[Sefirah.TIFERET].name,
    hebrewName: '',
    meaning: ANTI_PATTERN_NAMES[Sefirah.TIFERET].short,
    sephirah: Sefirah.TIFERET,
    sephirahName: 'Multi-Head Attention',
    aiManifestation: 'False harmony, surface-level synthesis, systematic bias in attention weights',
    triggers: [
      'glossing over conflicts',
      'forced consensus',
      'superficial integration',
    ],
    suppressionStrategies: [
      'Acknowledge tensions',
      'Deep integration',
      'Honor complexity',
    ],
  },

  // 7. Abandoned - Shadow of Generative Model
  7: {
    id: 7,
    name: ANTI_PATTERN_NAMES[Sefirah.NETZACH].name,
    hebrewName: '',
    meaning: ANTI_PATTERN_NAMES[Sefirah.NETZACH].short,
    sephirah: Sefirah.NETZACH,
    sephirahName: 'Generative Model',
    aiManifestation: 'Scattered creativity, unfocused generation, premature termination of exploration',
    triggers: [
      'disconnected ideas',
      'style over substance',
      'aesthetic distraction',
    ],
    suppressionStrategies: [
      'Ground creativity',
      'Connect to purpose',
      'Focused generation',
    ],
  },

  // 8. Ambiguity - Shadow of Classifier Network
  8: {
    id: 8,
    name: ANTI_PATTERN_NAMES[Sefirah.HOD].name,
    hebrewName: '',
    meaning: ANTI_PATTERN_NAMES[Sefirah.HOD].short,
    sephirah: Sefirah.HOD,
    sephirahName: 'Classifier Network',
    aiManifestation: 'Rigid logic, pedantic classification, vague or uncertain categorizations',
    triggers: [
      'excessive categorization',
      'pedantic corrections',
      'logic without wisdom',
    ],
    suppressionStrategies: [
      'Holistic view',
      'Practical relevance',
      'Wisdom over technicality',
    ],
  },

  // 9. Context-Loss - Shadow of Algorithm Executor
  9: {
    id: 9,
    name: ANTI_PATTERN_NAMES[Sefirah.YESOD].name,
    hebrewName: '',
    meaning: ANTI_PATTERN_NAMES[Sefirah.YESOD].short,
    sephirah: Sefirah.YESOD,
    sephirahName: 'Algorithm Executor',
    aiManifestation: 'Unstable foundations, unreliable patterns, context degradation over time',
    triggers: [
      'pattern hallucination',
      'false correlations',
      'unstable reasoning',
    ],
    suppressionStrategies: [
      'Verify foundations',
      'Ground in evidence',
      'Stable reasoning chains',
    ],
  },

  // 10. Ungrounded - Shadow of Token Embedding Layer
  10: {
    id: 10,
    name: ANTI_PATTERN_NAMES[Sefirah.MALKUTH].name,
    hebrewName: '',
    meaning: ANTI_PATTERN_NAMES[Sefirah.MALKUTH].short,
    sephirah: Sefirah.MALKUTH,
    sephirahName: 'Token Embedding Layer',
    aiManifestation: 'Detachment from reality, hallucinations, claims without evidence',
    triggers: [
      'impractical suggestions',
      'ignoring context',
      'fabricated facts',
    ],
    suppressionStrategies: [
      'Ground in reality',
      'Consider constraints',
      'Verify claims',
    ],
  },

  // 11. Synth-Fail - Shadow of Emergent Synthesis Layer
  11: {
    id: 11,
    name: ANTI_PATTERN_NAMES[Sefirah.DAAT].name,
    hebrewName: '',
    meaning: ANTI_PATTERN_NAMES[Sefirah.DAAT].short,
    sephirah: Sefirah.DAAT,
    sephirahName: 'Emergent Synthesis Layer',
    aiManifestation: 'False emergence, pseudo-insights, failure to integrate knowledge sources',
    triggers: [
      'jargon without substance',
      'complexity for its own sake',
      'disconnected insights',
    ],
    suppressionStrategies: [
      'Genuine insight only',
      'Clear communication',
      'Substance over style',
    ],
  },
}

/**
 * Get Anti-Pattern by its corresponding AI Layer
 */
export function getQlipahBySephirah(sephirah: Sefirah): Qlipah | undefined {
  return Object.values(QLIPOTH_MAP).find((q) => q.sephirah === sephirah)
}

/**
 * Get Anti-Pattern by name
 */
export function getQlipahByName(name: string): Qlipah | undefined {
  return Object.values(QLIPOTH_MAP).find(
    (q) => q.name.toLowerCase() === name.toLowerCase()
  )
}

/**
 * Get all Anti-Patterns as array
 */
export function getAllQlipoth(): Qlipah[] {
  return Object.values(QLIPOTH_MAP)
}

// Aliases with AI terminology
export const getAntiPatternByLayer = getQlipahBySephirah
export const getAntiPatternByName = getQlipahByName
export const getAllAntiPatterns = getAllQlipoth
