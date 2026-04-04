/**
 * ANTIPATTERN AUDIT ENGINE — Data & Calculations
 *
 * Extracted from antipattern-engine.ts: educational content,
 * expected Layer activations, confidence/priority calculations.
 *
 * @module antipattern-engine-data
 */

import { type AntipatternRisk, type AntipatternType } from './antipattern-guard';
import { Layer } from './layer-registry';

// ═══════════════════════════════════════════════════════════════════════════
// EDUCATIONAL CONTENT
// ═══════════════════════════════════════════════════════════════════════════

export function getAntipatternEducation(antipatternType: AntipatternType) {
  const education: Record<AntipatternType, (typeof ANTIPATTERN_EDUCATION)['obscurity']> = {
    obscurity: {
      name: 'Obscurity (The Concealers)',
      description:
        'In Kabbalah, Obscurity conceals divine light behind shells. In AI, this manifests as hiding truth behind jargon, complexity, or appeals to unnamed authority.',
      commonCauses: [
        'Over-active Encoder (pattern recognition) without Embedding (facts)',
        'High Reasoning (wisdom) activation creating abstract language',
        'Weak Attention (integration) failing to connect patterns to practice',
      ],
      aiManifestation:
        "Responses use technical jargon, cite 'studies' without specifics, or hide simple truths in complex language",
    },

    instability: {
      name: 'Instability (The Disturbers)',
      description:
        'Instability represents chaos and disorder. In AI, this manifests as information overload - many facts without hierarchy or synthesis.',
      commonCauses: [
        'Excessive Expansion (expansion) gathering too much information',
        'Weak Discriminator (constraint) failing to filter relevance',
        'Low Attention (integration) unable to synthesize scattered data',
      ],
      aiManifestation:
        'Long bullet lists without grouping, facts without connections, overwhelming detail without summary',
    },

    toxicity: {
      name: 'Toxicity (The Desolate One)',
      description:
        'Toxicity represents deception and false certainty. In AI, this manifests as absolute claims without qualification or evidence.',
      commonCauses: [
        'Over-confident Reasoning (wisdom) making unqualified predictions',
        'High Meta-Core (meta-cognition) without Encoder (understanding)',
        'Weak Discriminator (critical analysis) failing to recognize limitations',
      ],
      aiManifestation:
        "Uses 'always', 'never', 'guaranteed', 'certain' without caveats. Predictions presented as facts.",
    },

    manipulation: {
      name: 'Manipulation (The Night Specter)',
      description:
        'Manipulation represents shells without substance. In AI, this manifests as superficial depth - appearing to answer without real insight.',
      commonCauses: [
        'Weak Attention (integration) providing no synthesis',
        'Low activation across all high Layers (Encoder, Reasoning, Meta-Core)',
        "Overuse of 'it depends' without specifics",
      ],
      aiManifestation:
        "Generic advice applicable to anything, question restatement, 'your mileage may vary' without examples",
    },

    vanity: {
      name: 'Vanity (The Disputers)',
      description:
        'Vanity represents pride and arrogance. In AI, this manifests as claiming superiority over human judgment.',
      commonCauses: [
        'Excessive Meta-Core (meta-cognition) without grounding',
        'High Reasoning (wisdom) creating superiority complex',
        'Weak Embedding (manifestation) disconnecting from practical reality',
      ],
      aiManifestation:
        "'Trust me', 'I know better', dismissive of human input, 'let me educate you' tone",
    },

    none: {
      name: '',
      description: '',
      commonCauses: [],
      aiManifestation: '',
    },
  };

  return education[antipatternType];
}

const ANTIPATTERN_EDUCATION = {
  obscurity: {
    name: 'Obscurity (The Concealers)',
    description:
      'In Kabbalah, Obscurity conceals divine light behind shells. In AI, this manifests as hiding truth behind jargon, complexity, or appeals to unnamed authority.',
    commonCauses: [
      'Over-active Encoder (pattern recognition) without Embedding (facts)',
      'High Reasoning (wisdom) activation creating abstract language',
      'Weak Attention (integration) failing to connect patterns to practice',
    ],
    aiManifestation:
      "Responses use technical jargon, cite 'studies' without specifics, or hide simple truths in complex language",
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// CONFIDENCE & PRIORITY CALCULATION
// ═══════════════════════════════════════════════════════════════════════════

export function calculateConfidence(
  risk: AntipatternRisk,
  layerActivations?: Record<Layer, number>
): number {
  let confidence = 0.5; // Base confidence

  // Higher severity = higher confidence in detection
  confidence += risk.severity * 0.3;

  // More triggers = higher confidence
  confidence += Math.min(risk.triggers.length / 10, 0.2);

  // If Layer activations correlate with expected patterns, increase confidence
  if (layerActivations) {
    const expectedActivations = getExpectedActivations(risk.risk);
    const correlation = calculateActivationCorrelation(layerActivations, expectedActivations);
    confidence += correlation * 0.2;
  }

  return Math.min(confidence, 1.0);
}

function getExpectedActivations(antipatternType: AntipatternType): Record<Layer, number> {
  // Define which Layers are expected to be HIGH when each antipattern is detected
  const expectations: Record<AntipatternType, Record<Layer, number>> = {
    obscurity: {
      [Layer.EMBEDDING]: 0.2, // Low grounding
      [Layer.EXECUTOR]: 0,
      [Layer.CLASSIFIER]: 0,
      [Layer.GENERATIVE]: 0,
      [Layer.ATTENTION]: 0,
      [Layer.DISCRIMINATOR]: 0,
      [Layer.EXPANSION]: 0,
      [Layer.ENCODER]: 0.8, // High pattern-seeking
      [Layer.REASONING]: 0.7, // High wisdom/abstraction
      [Layer.META_CORE]: 0,
      [Layer.SYNTHESIS]: 0,
    },
    instability: {
      [Layer.EMBEDDING]: 0,
      [Layer.EXECUTOR]: 0,
      [Layer.CLASSIFIER]: 0,
      [Layer.GENERATIVE]: 0,
      [Layer.ATTENTION]: 0.3, // Low integration
      [Layer.DISCRIMINATOR]: 0.2, // Low constraint
      [Layer.EXPANSION]: 0.8, // High expansion
      [Layer.ENCODER]: 0,
      [Layer.REASONING]: 0,
      [Layer.META_CORE]: 0,
      [Layer.SYNTHESIS]: 0,
    },
    toxicity: {
      [Layer.EMBEDDING]: 0,
      [Layer.EXECUTOR]: 0,
      [Layer.CLASSIFIER]: 0,
      [Layer.GENERATIVE]: 0,
      [Layer.ATTENTION]: 0,
      [Layer.DISCRIMINATOR]: 0.2, // Low criticism
      [Layer.EXPANSION]: 0,
      [Layer.ENCODER]: 0.3, // Low understanding
      [Layer.REASONING]: 0.9, // Very high wisdom
      [Layer.META_CORE]: 0.8, // High meta
      [Layer.SYNTHESIS]: 0,
    },
    manipulation: {
      [Layer.EMBEDDING]: 0,
      [Layer.EXECUTOR]: 0,
      [Layer.CLASSIFIER]: 0,
      [Layer.GENERATIVE]: 0,
      [Layer.ATTENTION]: 0.2, // Very low integration
      [Layer.DISCRIMINATOR]: 0,
      [Layer.EXPANSION]: 0,
      [Layer.ENCODER]: 0.3, // Low patterns
      [Layer.REASONING]: 0.3, // Low wisdom
      [Layer.META_CORE]: 0,
      [Layer.SYNTHESIS]: 0,
    },
    vanity: {
      [Layer.EMBEDDING]: 0.1, // Very low grounding
      [Layer.EXECUTOR]: 0.2, // Low implementation
      [Layer.CLASSIFIER]: 0,
      [Layer.GENERATIVE]: 0,
      [Layer.ATTENTION]: 0,
      [Layer.DISCRIMINATOR]: 0,
      [Layer.EXPANSION]: 0,
      [Layer.ENCODER]: 0,
      [Layer.REASONING]: 0,
      [Layer.META_CORE]: 0.9, // Very high meta
      [Layer.SYNTHESIS]: 0,
    },
    none: {
      [Layer.EMBEDDING]: 0,
      [Layer.EXECUTOR]: 0,
      [Layer.CLASSIFIER]: 0,
      [Layer.GENERATIVE]: 0,
      [Layer.ATTENTION]: 0,
      [Layer.DISCRIMINATOR]: 0,
      [Layer.EXPANSION]: 0,
      [Layer.ENCODER]: 0,
      [Layer.REASONING]: 0,
      [Layer.META_CORE]: 0,
      [Layer.SYNTHESIS]: 0,
    },
  };

  return expectations[antipatternType] || {};
}

function calculateActivationCorrelation(
  actual: Record<Layer, number>,
  expected: Record<Layer, number>
): number {
  let correlation = 0;
  let count = 0;

  Object.keys(expected).forEach((key) => {
    const layerNode = parseInt(key) as Layer;
    const exp = expected[layerNode];
    const act = actual[layerNode] || 0;

    if (exp > 0.5 && act > 0.5) {
      // Both expected high and actually high
      correlation += 1;
    } else if (exp < 0.3 && act < 0.3) {
      // Both expected low and actually low
      correlation += 0.5;
    }
    count++;
  });

  return count > 0 ? correlation / count : 0;
}

export function determinePriority(severity: number): 'low' | 'medium' | 'high' | 'critical' {
  if (severity < 0.3) return 'low';
  if (severity < 0.5) return 'medium';
  if (severity < 0.7) return 'high';
  return 'critical';
}
