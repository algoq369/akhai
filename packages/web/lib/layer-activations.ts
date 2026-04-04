/**
 * LAYER ACTIVATION ANALYSIS
 * Keyword-based activation detection, weight blending, dominant layer selection,
 * and methodology suggestion — extracted from layer-processor.ts
 */

import { Layer, LAYER_METADATA } from './layer-registry';
import { TreeConfiguration } from './tree-configuration';
import type { CoreMethodology } from './provider-selector';
import { WEIGHT_INFLUENCE_RATIO } from './layer-processor';

// ═══════════════════════════════════════════
// ACTIVATION CALCULATION
// ═══════════════════════════════════════════

export function calculateLayerActivation(
  content: string,
  meta: (typeof LAYER_METADATA)[1]
): number {
  const contentLower = content.toLowerCase();
  let activation = 0;

  // Check for characteristic keywords
  meta.queryCharacteristics.forEach((characteristic) => {
    const keywords = characteristic.toLowerCase().split(/,|\s+/);
    keywords.forEach((keyword) => {
      if (keyword.length > 3 && contentLower.includes(keyword)) {
        activation += 0.15;
      }
    });
  });

  // Check aiRole keywords
  const roleKeywords = meta.aiRole.toLowerCase().split(/\s+/);
  roleKeywords.forEach((keyword) => {
    if (keyword.length > 4 && contentLower.includes(keyword)) {
      activation += 0.2;
    }
  });

  // Normalize to 0-1
  return Math.min(activation, 1.0);
}

export function calculateActivationsFromContent(content: string): Record<Layer, number> {
  // Keyword-based activation detection
  const activations: Record<Layer, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0,
    9: 0,
    10: 0,
    11: 0,
  };

  const contentLower = content.toLowerCase();

  // Embedding (Data/Facts)
  if (/\b(data|fact|information|statistic|number|evidence)\b/gi.test(contentLower)) {
    activations[Layer.EMBEDDING] += 0.3;
  }

  // Executor (Implementation)
  if (/\b(implement|execute|apply|procedure|process|step)\b/gi.test(contentLower)) {
    activations[Layer.EXECUTOR] += 0.3;
  }

  // Classifier (Logic/Classification)
  if (/\b(categor|classif|logic|reasoning|analysis|compare)\b/gi.test(contentLower)) {
    activations[Layer.CLASSIFIER] += 0.3;
  }

  // Generative (Creativity)
  if (/\b(creat|innovat|generat|novel|original|imaginat)\b/gi.test(contentLower)) {
    activations[Layer.GENERATIVE] += 0.3;
  }

  // Discriminator (Constraints/Criticism)
  if (/\b(limit|constraint|critiqu|evaluat|assess|validat)\b/gi.test(contentLower)) {
    activations[Layer.DISCRIMINATOR] += 0.3;
  }

  // Expansion (Expansion)
  if (/\b(expand|elaborat|comprehensiv|broad|extensive)\b/gi.test(contentLower)) {
    activations[Layer.EXPANSION] += 0.3;
  }

  // Encoder (Patterns)
  if (/\b(pattern|structure|framework|model|system|relationship)\b/gi.test(contentLower)) {
    activations[Layer.ENCODER] += 0.4;
  }

  // Reasoning (Wisdom/Principles)
  if (/\b(principle|wisdom|fundamental|theory|concept|axiom)\b/gi.test(contentLower)) {
    activations[Layer.REASONING] += 0.4;
  }

  // Attention (Integration)
  if (/\b(integrate|synthesize|combine|balance|harmony|unify)\b/gi.test(contentLower)) {
    activations[Layer.ATTENTION] += 0.4;
  }

  // Meta-Core (Meta-cognition)
  if (/\b(meta|reflect|overview|synthesis|big picture|holistic)\b/gi.test(contentLower)) {
    activations[Layer.META_CORE] += 0.4;
  }

  // Synthesis (Emergent Knowledge)
  if (/\b(emerg|insight|breakthrough|revelation|connection|realize)\b/gi.test(contentLower)) {
    activations[Layer.SYNTHESIS] += 0.3;
  }

  // Normalize activations to 0-1
  Object.keys(activations).forEach((key) => {
    const layerNode = parseInt(key) as Layer;
    activations[layerNode] = Math.min(activations[layerNode], 1.0);
  });

  return activations;
}

// ═══════════════════════════════════════════
// WEIGHT BLENDING & DOMINANT LAYER
// ═══════════════════════════════════════════

/**
 * Blend keyword activations with user-configured weights
 *
 * Formula: blended = (keywordActivation * (1 - ratio)) + (inputWeight * ratio)
 * With WEIGHT_INFLUENCE_RATIO = 0.6:
 *   - 60% comes from user's weight configuration
 *   - 40% comes from content keyword analysis
 *
 * This ensures user configuration has direct influence on which Layer dominates
 */
export function blendActivationsWithWeights(
  keywordActivations: Record<Layer, number>,
  config: TreeConfiguration
): Record<Layer, number> {
  const blended: Record<Layer, number> = { ...keywordActivations };

  for (const key of Object.keys(blended)) {
    const layerNode = parseInt(key) as Layer;
    const keywordActivation = keywordActivations[layerNode] || 0;
    const inputWeight = config.layer_weights[layerNode] || 0.5;

    // Blend: 60% user weight, 40% content analysis
    blended[layerNode] =
      keywordActivation * (1 - WEIGHT_INFLUENCE_RATIO) + inputWeight * WEIGHT_INFLUENCE_RATIO;
  }

  return blended;
}

export function findDominantLayer(activations: Record<Layer, number>): Layer {
  let maxLayer = Layer.EMBEDDING;
  let maxActivation = activations[Layer.EMBEDDING] || 0;

  for (const [layerNodeStr, activation] of Object.entries(activations)) {
    const layerNode = parseInt(layerNodeStr) as Layer;
    if (activation > maxActivation) {
      maxActivation = activation;
      maxLayer = layerNode;
    }
  }

  return maxLayer;
}

// ═══════════════════════════════════════════
// METHODOLOGY SUGGESTION
// ═══════════════════════════════════════════

export function suggestMethodology(
  activations: Record<Layer, number>,
  query: string
): CoreMethodology {
  // High Encoder (pattern recognition) → SC
  if (activations[Layer.ENCODER] > 0.7) {
    return 'sc';
  }

  // High Discriminator (constraints/criticism) → ReAct
  if (activations[Layer.DISCRIMINATOR] > 0.6) {
    return 'react';
  }

  // High Executor (implementation) + math → PaS
  if (activations[Layer.EXECUTOR] > 0.7 && /\d+.*[+\-*/]/.test(query)) {
    return 'pas';
  }

  // High Reasoning + Meta-Core (wisdom + meta) → CoD
  if (activations[Layer.REASONING] > 0.6 && activations[Layer.META_CORE] > 0.5) {
    return 'cod';
  }

  // High Generative (creativity) → Direct with creative prompt
  if (activations[Layer.GENERATIVE] > 0.7) {
    return 'direct';
  }

  // High Attention (integration/synthesis) → SC
  if (activations[Layer.ATTENTION] > 0.7) {
    return 'sc';
  }

  // Default
  return 'direct';
}
