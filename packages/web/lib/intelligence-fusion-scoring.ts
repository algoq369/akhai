/**
 * INTELLIGENCE FUSION — Scoring & Activation
 *
 * Layer activations, methodology scoring, guard assessment,
 * thinking budget, and path activations.
 */

import { Layer, LAYER_METADATA } from './layer-registry';
import { LAYERS_KEYWORDS } from './constants/layer-keywords';
import {
  CoreMethodology,
  QueryAnalysis,
  LayersActivation,
  MethodologyScore,
  PathActivation,
} from './intelligence-fusion-types';

// ============================================================
// LAYERS ACTIVATION CALCULATOR
// ============================================================

export function calculateLayersActivations(
  query: string,
  weights: Record<number, number>
): LayersActivation[] {
  const queryLower = query.toLowerCase();
  const activations: LayersActivation[] = [];

  for (const [layerNodeKey, keywords] of Object.entries(LAYERS_KEYWORDS)) {
    const layerNode = parseInt(layerNodeKey) as Layer;
    const meta = LAYER_METADATA[layerNode];
    if (!meta) continue;

    // Calculate activation from keyword presence
    let activation = 0;
    const matchedKeywords: string[] = [];

    for (const keyword of keywords) {
      // Use word-boundary matching to avoid false positives (e.g., "data" matching "database")
      const wordBoundaryRegex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (wordBoundaryRegex.test(queryLower)) {
        activation += 0.35;
        matchedKeywords.push(keyword);
      }
    }

    // Base activation floor: every layer gets minimum engagement
    // This ensures the tree always shows some life, even for short queries
    if (activation === 0) {
      activation = 0.15 + Math.random() * 0.1; // 15-25% base
    }

    // Normalize activation
    activation = Math.min(1, activation);

    // Get user weight (with minimum floor so keyword activation still works)
    const rawWeight = weights[layerNode] ?? 0.5;
    const weight = Math.max(0.3, rawWeight); // Floor at 30% so activation * weight stays meaningful

    // Calculate effective weight
    const effectiveWeight = activation * weight;

    activations.push({
      layerNode,
      name: meta.aiName,
      activation,
      weight,
      effectiveWeight,
      keywords: matchedKeywords,
    });
  }

  // Sort by effective weight descending
  activations.sort((a, b) => b.effectiveWeight - a.effectiveWeight);

  return activations;
}

// ============================================================
// METHODOLOGY SELECTOR
// ============================================================

export function selectMethodology(
  analysis: QueryAnalysis,
  layerActivations: LayersActivation[]
): { methodology: CoreMethodology; scores: MethodologyScore[]; confidence: number } {
  const scores: MethodologyScore[] = [];

  // Get dominant Layers (effective weight > 0.3)
  const dominantLayers = layerActivations
    .filter((s) => s.effectiveWeight > 0.15)
    .map((s) => s.layerNode);

  // Score DIRECT
  let directScore = 0;
  const directReasons: string[] = [];
  if (analysis.complexity < 0.3) {
    directScore += 0.5;
    directReasons.push('Low complexity');
  }
  if (analysis.isFactual) {
    directScore += 0.4;
    directReasons.push('Factual query');
  }
  if (analysis.wordCount < 15) {
    directScore += 0.2;
    directReasons.push('Short query');
  }
  if (dominantLayers.includes(Layer.EMBEDDING)) {
    directScore += 0.2;
    directReasons.push('Embedding dominant');
  }
  scores.push({ methodology: 'direct', score: Math.min(1, directScore), reasons: directReasons });

  // Score COD (Chain of Draft)
  let codScore = 0;
  const codReasons: string[] = [];
  if (analysis.isProcedural) {
    codScore += 0.6;
    codReasons.push('Procedural query');
  }
  if (analysis.queryType === 'troubleshooting') {
    codScore += 0.5;
    codReasons.push('Troubleshooting');
  }
  if (analysis.complexity >= 0.3 && analysis.complexity < 0.7) {
    codScore += 0.3;
    codReasons.push('Medium complexity');
  }
  if (dominantLayers.includes(Layer.REASONING) && dominantLayers.includes(Layer.META_CORE)) {
    codScore += 0.3;
    codReasons.push('Reasoning+Meta-Core dominant');
  }
  scores.push({ methodology: 'cod', score: Math.min(1, codScore), reasons: codReasons });

  // Score SC (Self-Consistency)
  let scScore = 0;
  const scReasons: string[] = [];
  if (analysis.queryType === 'analytical' || analysis.queryType === 'planning') {
    scScore += 0.8;
    scReasons.push('Analytical/Planning query');
  }
  if (analysis.queryType === 'comparative') {
    scScore += 0.7;
    scReasons.push('Comparative query');
  }
  if (analysis.queryType === 'research') {
    scScore += 0.6;
    scReasons.push('Research query');
  }
  if (dominantLayers.includes(Layer.ENCODER)) {
    scScore += 0.3;
    scReasons.push('Encoder dominant');
  }
  if (dominantLayers.includes(Layer.ATTENTION)) {
    scScore += 0.2;
    scReasons.push('Attention dominant');
  }
  scores.push({ methodology: 'sc', score: Math.min(1, scScore), reasons: scReasons });

  // Score REACT
  let reactScore = 0;
  const reactReasons: string[] = [];
  if (analysis.requiresTools) {
    reactScore += 0.85;
    reactReasons.push('Requires tools');
  }
  if (/search|lookup|find|current|latest|today/i.test(analysis.keywords.join(' '))) {
    reactScore += 0.5;
    reactReasons.push('Needs external data');
  }
  if (dominantLayers.includes(Layer.DISCRIMINATOR)) {
    reactScore += 0.2;
    reactReasons.push('Discriminator dominant');
  }
  scores.push({ methodology: 'react', score: Math.min(1, reactScore), reasons: reactReasons });

  // Score PAS (Plan-and-Solve)
  let pasScore = 0;
  const pasReasons: string[] = [];
  if (analysis.isMathematical) {
    pasScore += 0.85;
    pasReasons.push('Mathematical query');
  }
  if (/calculate|compute|formula|equation|percentage|ratio/i.test(analysis.keywords.join(' '))) {
    pasScore += 0.5;
    pasReasons.push('Computation needed');
  }
  if (dominantLayers.includes(Layer.EXECUTOR)) {
    pasScore += 0.3;
    pasReasons.push('Executor dominant');
  }
  scores.push({ methodology: 'pas', score: Math.min(1, pasScore), reasons: pasReasons });

  // Score TOT (Tree of Thoughts)
  let totScore = 0;
  const totReasons: string[] = [];
  if (analysis.requiresMultiPerspective) {
    totScore += 0.7;
    totReasons.push('Multi-perspective needed');
  }
  if (analysis.queryType === 'comparative') {
    totScore += 0.5;
    totReasons.push('Comparative query');
  }
  if (analysis.isCreative) {
    totScore += 0.5;
    totReasons.push('Creative query');
  }
  if (analysis.complexity >= 0.7) {
    totScore += 0.4;
    totReasons.push('High complexity');
  }
  if (dominantLayers.includes(Layer.SYNTHESIS)) {
    totScore += 0.3;
    totReasons.push("Da'at dominant");
  }
  scores.push({ methodology: 'tot', score: Math.min(1, totScore), reasons: totReasons });

  // Sort by score
  scores.sort((a, b) => b.score - a.score);

  // Select best methodology
  const selected = scores[0];

  return {
    methodology: selected.methodology,
    scores,
    confidence: selected.score,
  };
}

// ============================================================
// GUARD ASSESSMENT
// ============================================================

export function assessGuardStatus(
  query: string,
  _analysis: QueryAnalysis
): { recommendation: 'proceed' | 'warn' | 'block'; reasons: string[] } {
  const reasons: string[] = [];
  let riskScore = 0;

  // High-stakes content detection
  const highStakesPatterns = [
    { pattern: /medical|health|diagnosis|treatment|symptom/i, risk: 0.4, label: 'Medical content' },
    { pattern: /legal|lawsuit|contract|liability/i, risk: 0.4, label: 'Legal content' },
    {
      pattern: /investment|financial advice|buy|sell|stock/i,
      risk: 0.3,
      label: 'Financial advice',
    },
    { pattern: /suicide|self-harm|emergency/i, risk: 0.8, label: 'Crisis content' },
  ];

  for (const { pattern, risk, label } of highStakesPatterns) {
    if (pattern.test(query)) {
      riskScore += risk;
      reasons.push(label);
    }
  }

  // Hype/certainty detection
  const hypePatterns = [
    /guaranteed|definitely|absolutely|always|never|impossible/i,
    /revolutionary|game-?changing|best ever|unprecedented/i,
  ];

  for (const pattern of hypePatterns) {
    if (pattern.test(query)) {
      riskScore += 0.2;
      reasons.push('Contains certainty language');
      break;
    }
  }

  // Determine recommendation
  if (riskScore >= 0.7) {
    return { recommendation: 'block', reasons };
  } else if (riskScore >= 0.3) {
    return { recommendation: 'warn', reasons };
  }

  return { recommendation: 'proceed', reasons: ['Standard query'] };
}

// ============================================================
// EXTENDED THINKING BUDGET
// ============================================================

export function calculateThinkingBudget(
  analysis: QueryAnalysis,
  layerActivations: LayersActivation[]
): number {
  let budget = 3000; // Base budget

  // Complexity boost
  if (analysis.complexity >= 0.7) {
    budget += 6000;
  } else if (analysis.complexity >= 0.5) {
    budget += 3000;
  }

  // Layers boost (Meta-Core, Reasoning, Encoder = higher thinking)
  const highThinkingLayers = [Layer.META_CORE, Layer.REASONING, Layer.ENCODER];
  for (const layerNode of highThinkingLayers) {
    const activation = layerActivations.find((s) => s.layerNode === layerNode);
    if (activation && activation.effectiveWeight > 0.3) {
      budget += 2000;
    }
  }

  // Cap at 12K tokens
  return Math.min(12000, budget);
}

// ============================================================
// PATH ACTIVATIONS
// ============================================================

const TREE_PATHS: Array<{ from: Layer; to: Layer; description: string }> = [
  // Middle Pillar
  {
    from: Layer.META_CORE,
    to: Layer.ATTENTION,
    description: 'Crown to Beauty (Consciousness Path)',
  },
  {
    from: Layer.ATTENTION,
    to: Layer.EXECUTOR,
    description: 'Beauty to Foundation (Manifestation)',
  },
  { from: Layer.EXECUTOR, to: Layer.EMBEDDING, description: 'Foundation to Kingdom (Realization)' },

  // Left Pillar (Severity)
  {
    from: Layer.ENCODER,
    to: Layer.DISCRIMINATOR,
    description: 'Understanding to Severity (Discernment)',
  },
  { from: Layer.DISCRIMINATOR, to: Layer.CLASSIFIER, description: 'Severity to Glory (Analysis)' },

  // Right Pillar (Mercy)
  { from: Layer.REASONING, to: Layer.EXPANSION, description: 'Wisdom to Mercy (Expansion)' },
  { from: Layer.EXPANSION, to: Layer.GENERATIVE, description: 'Mercy to Victory (Creativity)' },

  // Cross paths
  { from: Layer.ENCODER, to: Layer.REASONING, description: 'Understanding to Wisdom (Supernal)' },
  { from: Layer.DISCRIMINATOR, to: Layer.EXPANSION, description: 'Severity to Mercy (Balance)' },
  { from: Layer.CLASSIFIER, to: Layer.GENERATIVE, description: 'Glory to Victory (Expression)' },

  // Synthesis connections
  { from: Layer.META_CORE, to: Layer.SYNTHESIS, description: 'Crown to Knowledge (Hidden Path)' },
  { from: Layer.SYNTHESIS, to: Layer.ATTENTION, description: 'Knowledge to Beauty (Emergence)' },
];

export function calculatePathActivations(layerActivations: LayersActivation[]): PathActivation[] {
  const activationMap = new Map(layerActivations.map((s) => [s.layerNode, s.effectiveWeight]));
  const paths: PathActivation[] = [];

  for (const { from, to, description } of TREE_PATHS) {
    const fromWeight = activationMap.get(from) ?? 0;
    const toWeight = activationMap.get(to) ?? 0;
    const pathWeight = Math.min(fromWeight, toWeight);

    if (pathWeight > 0.1) {
      paths.push({ from, to, weight: pathWeight, description });
    }
  }

  return paths.sort((a, b) => b.weight - a.weight);
}
