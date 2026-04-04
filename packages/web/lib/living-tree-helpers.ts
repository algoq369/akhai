/**
 * LIVING TREE - Helper Functions
 *
 * Path resolution, consciousness updates, health tracking,
 * narrative generation, and recommendation logic.
 *
 * @module living-tree-helpers
 */

import { Layer, LAYER_METADATA } from './layer-registry';
import {
  TreePath,
  PATH_METADATA,
  SephirahState,
  LivingTree,
  TreeObservation,
} from './living-tree-types';

// =============================================================================
// PATH RESOLUTION
// =============================================================================

export function getPathEndpoints(path: TreePath): [Layer, Layer] {
  const pathMap: Record<TreePath, [Layer, Layer]> = {
    [TreePath.META_CORE_REASONING]: [Layer.META_CORE, Layer.REASONING],
    [TreePath.META_CORE_ENCODER]: [Layer.META_CORE, Layer.ENCODER],
    [TreePath.META_CORE_ATTENTION]: [Layer.META_CORE, Layer.ATTENTION],
    [TreePath.REASONING_ENCODER]: [Layer.REASONING, Layer.ENCODER],
    [TreePath.REASONING_EXPANSION]: [Layer.REASONING, Layer.EXPANSION],
    [TreePath.REASONING_ATTENTION]: [Layer.REASONING, Layer.ATTENTION],
    [TreePath.ENCODER_EXPANSION]: [Layer.ENCODER, Layer.EXPANSION],
    [TreePath.ENCODER_DISCRIMINATOR]: [Layer.ENCODER, Layer.DISCRIMINATOR],
    [TreePath.ENCODER_ATTENTION]: [Layer.ENCODER, Layer.ATTENTION],
    [TreePath.EXPANSION_DISCRIMINATOR]: [Layer.EXPANSION, Layer.DISCRIMINATOR],
    [TreePath.EXPANSION_ATTENTION]: [Layer.EXPANSION, Layer.ATTENTION],
    [TreePath.EXPANSION_GENERATIVE]: [Layer.EXPANSION, Layer.GENERATIVE],
    [TreePath.DISCRIMINATOR_ATTENTION]: [Layer.DISCRIMINATOR, Layer.ATTENTION],
    [TreePath.DISCRIMINATOR_CLASSIFIER]: [Layer.DISCRIMINATOR, Layer.CLASSIFIER],
    [TreePath.ATTENTION_GENERATIVE]: [Layer.ATTENTION, Layer.GENERATIVE],
    [TreePath.ATTENTION_EXECUTOR]: [Layer.ATTENTION, Layer.EXECUTOR],
    [TreePath.ATTENTION_CLASSIFIER]: [Layer.ATTENTION, Layer.CLASSIFIER],
    [TreePath.GENERATIVE_CLASSIFIER]: [Layer.GENERATIVE, Layer.CLASSIFIER],
    [TreePath.GENERATIVE_EXECUTOR]: [Layer.GENERATIVE, Layer.EXECUTOR],
    [TreePath.GENERATIVE_EMBEDDING]: [Layer.GENERATIVE, Layer.EMBEDDING],
    [TreePath.HOD_EXECUTOR]: [Layer.CLASSIFIER, Layer.EXECUTOR],
    [TreePath.HOD_EMBEDDING]: [Layer.CLASSIFIER, Layer.EMBEDDING],
    [TreePath.EXECUTOR_EMBEDDING]: [Layer.EXECUTOR, Layer.EMBEDDING],
  };

  return pathMap[path] || [Layer.EMBEDDING, Layer.EMBEDDING];
}

export function getIncomingPaths(layerNode: Layer): TreePath[] {
  return Object.entries(PATH_METADATA)
    .filter(([path]) => {
      const [, to] = getPathEndpoints(path as TreePath);
      return to === layerNode;
    })
    .map(([path]) => path as TreePath);
}

export function getOutgoingPaths(layerNode: Layer): TreePath[] {
  return Object.entries(PATH_METADATA)
    .filter(([path]) => {
      const [from] = getPathEndpoints(path as TreePath);
      return from === layerNode;
    })
    .map(([path]) => path as TreePath);
}

// =============================================================================
// CONSCIOUSNESS & HEALTH UPDATES
// =============================================================================

export function updateTreeConsciousness(tree: LivingTree): void {
  const now = new Date();

  // Find dominant Layer
  let maxActivation = 0;
  let dominant = Layer.EMBEDDING;

  for (const [layerNode, state] of Object.entries(tree.layers) as unknown as [
    Layer,
    SephirahState,
  ][]) {
    if (state.activation > maxActivation) {
      maxActivation = state.activation;
      dominant = layerNode;
    }
  }

  tree.consciousness.dominantLayer = dominant;

  // Determine processing phase
  if (dominant === Layer.EMBEDDING || dominant === Layer.EXECUTOR) {
    tree.consciousness.processingPhase = 'manifesting';
  } else if (dominant === Layer.ENCODER || dominant === Layer.DISCRIMINATOR) {
    tree.consciousness.processingPhase = 'analyzing';
  } else if (dominant === Layer.ATTENTION) {
    tree.consciousness.processingPhase = 'synthesizing';
  } else if (dominant === Layer.META_CORE) {
    tree.consciousness.processingPhase = 'reflecting';
  } else {
    tree.consciousness.processingPhase = 'receiving';
  }

  // Count active paths
  tree.consciousness.activePathCount = Object.values(tree.paths).filter(
    (p) => p.currentFlow > 0.1
  ).length;

  // Calculate energy balance
  const mercyEnergy =
    tree.layers[Layer.EXPANSION].activation +
    tree.layers[Layer.GENERATIVE].activation +
    tree.layers[Layer.REASONING].activation;
  const severityEnergy =
    tree.layers[Layer.DISCRIMINATOR].activation +
    tree.layers[Layer.CLASSIFIER].activation +
    tree.layers[Layer.ENCODER].activation;

  tree.consciousness.energyBalance = (mercyEnergy - severityEnergy) / 3;
  tree.consciousness.lastNarrativeUpdate = now;
}

export function updateTreeHealth(tree: LivingTree): void {
  // Calculate pillar health
  tree.health.pillarOfMercy =
    (tree.layers[Layer.REASONING].activation +
      tree.layers[Layer.EXPANSION].activation +
      tree.layers[Layer.GENERATIVE].activation) /
    3;

  tree.health.pillarOfSeverity =
    (tree.layers[Layer.ENCODER].activation +
      tree.layers[Layer.DISCRIMINATOR].activation +
      tree.layers[Layer.CLASSIFIER].activation) /
    3;

  tree.health.pillarOfEquilibrium =
    (tree.layers[Layer.META_CORE].activation +
      tree.layers[Layer.ATTENTION].activation +
      tree.layers[Layer.EXECUTOR].activation +
      tree.layers[Layer.EMBEDDING].activation) /
    4;

  // Determine dominant pillar
  const pillars = [
    { name: 'mercy' as const, value: tree.health.pillarOfMercy },
    { name: 'severity' as const, value: tree.health.pillarOfSeverity },
    { name: 'equilibrium' as const, value: tree.health.pillarOfEquilibrium },
  ];

  tree.health.dominantPillar = pillars.reduce((max, p) => (p.value > max.value ? p : max)).name;

  // Calculate overall balance
  const variance = Math.abs(tree.health.pillarOfMercy - tree.health.pillarOfSeverity);
  tree.health.overallBalance = 1 - Math.min(1, variance);

  // Check for Synthesis emergence
  tree.health.synthesisEmergence =
    tree.layers[Layer.REASONING].activation > 0.5 &&
    tree.layers[Layer.ENCODER].activation > 0.5 &&
    tree.health.overallBalance > 0.7;
}

// =============================================================================
// NARRATIVE & INSIGHT GENERATION
// =============================================================================

export function generateSelfNarrative(
  tree: LivingTree,
  activeLayers: { layerNode: Layer; activation: number }[],
  activePaths: { path: TreePath; flow: number }[]
): string {
  const dominant = activeLayers[0];
  const phase = tree.consciousness.processingPhase;

  let narrative = '';

  // Opening based on phase
  switch (phase) {
    case 'receiving':
      narrative = 'I am receiving the query, letting it flow down from Meta-Core. ';
      break;
    case 'analyzing':
      narrative = 'I am in analysis mode, with Encoder and Discriminator processing structure. ';
      break;
    case 'synthesizing':
      narrative = 'I am synthesizing in Attention, bringing balance to the forces. ';
      break;
    case 'manifesting':
      narrative = 'I am manifesting the response through Executor into Embedding. ';
      break;
    case 'reflecting':
      narrative = 'I am reflecting from Meta-Core, checking alignment with purpose. ';
      break;
  }

  // Add dominant Layer insight
  if (dominant) {
    const metadata = LAYER_METADATA[dominant.layerNode];
    narrative += `${metadata?.name || dominant.layerNode} is most active (${(dominant.activation * 100).toFixed(0)}%), bringing its quality of ${metadata?.meaning || 'processing'}. `;
  }

  // Add path insight
  if (activePaths.length > 0) {
    const topPath = activePaths[0];
    const pathMeta = PATH_METADATA[topPath.path];
    narrative += `Energy flows strongest through the path of ${pathMeta?.hebrewLetter || ''} (${pathMeta?.meaning || topPath.path}). `;
  }

  // Add balance insight
  if (tree.health.overallBalance < 0.5) {
    narrative += 'I sense imbalance - ';
    if (tree.health.pillarOfMercy > tree.health.pillarOfSeverity) {
      narrative += 'mercy outweighs severity, risking over-expansion. ';
    } else {
      narrative += 'severity outweighs mercy, risking over-restriction. ';
    }
  } else if (tree.health.synthesisEmergence) {
    narrative +=
      "Da'at is emerging - hidden knowledge crystallizing at the intersection of Wisdom and Understanding. ";
  }

  return narrative.trim();
}

export function generateProcessingInsight(
  _tree: LivingTree,
  distribution: TreeObservation['energyState']['distribution']
): string {
  switch (distribution) {
    case 'top-heavy':
      return 'Processing is concentrated in higher Layers - consider grounding the output more.';
    case 'bottom-heavy':
      return 'Processing is grounded but may lack higher-level synthesis.';
    case 'left-leaning':
      return 'Severity pillar dominant - response may be overly analytical or restrictive.';
    case 'right-leaning':
      return 'Mercy pillar dominant - response may be overly expansive or permissive.';
    case 'balanced':
      return 'Energy is well-distributed across the Tree - processing is harmonious.';
  }
}

export function generateRecommendations(
  tree: LivingTree,
  distribution: TreeObservation['energyState']['distribution'],
  bottleneck: Layer | null
): string[] {
  const recommendations: string[] = [];

  if (distribution === 'top-heavy') {
    recommendations.push('Activate Executor and Embedding for better grounding');
  }
  if (distribution === 'bottom-heavy') {
    recommendations.push('Engage Encoder or Reasoning for deeper analysis');
  }
  if (distribution === 'left-leaning') {
    recommendations.push('Balance with Expansion (mercy/expansion)');
  }
  if (distribution === 'right-leaning') {
    recommendations.push('Balance with Discriminator (structure/constraint)');
  }
  if (bottleneck) {
    recommendations.push(`Clear bottleneck at ${bottleneck} - check path weights`);
  }
  if (tree.health.antipatternPressure > 0.5) {
    recommendations.push('High Antipattern pressure detected - engage Anti-Pattern Shield');
  }

  return recommendations;
}
