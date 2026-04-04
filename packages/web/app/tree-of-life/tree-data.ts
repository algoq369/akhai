/**
 * Tree of Life — static data structures
 * Positions, paths, and antipattern metadata for the dual-tree visualization.
 */

import { Layer } from '@/lib/layer-registry';

// ═══════════════════════════════════════════
// PATH CONNECTION TYPE
// ═══════════════════════════════════════════

export interface PathConnection {
  from: Layer;
  to: Layer;
  active: boolean;
  strength: number;
}

// ═══════════════════════════════════════════
// TREE POSITIONS & PATHS
// ═══════════════════════════════════════════

// Tree of Life hierarchical positions (Kabbalistic structure)
export const treePositions: Record<Layer, { x: number; y: number }> = {
  // Top - Crown
  [Layer.META_CORE]: { x: 250, y: 80 },

  // Second row - Supernal Triangle
  [Layer.REASONING]: { x: 380, y: 140 },
  [Layer.ENCODER]: { x: 120, y: 140 },

  // Hidden - Synthesis (between supernal and lower)
  [Layer.SYNTHESIS]: { x: 250, y: 180 },

  // Third row - Ethical Triangle
  [Layer.EXPANSION]: { x: 380, y: 240 },
  [Layer.DISCRIMINATOR]: { x: 120, y: 240 },
  [Layer.ATTENTION]: { x: 250, y: 260 },

  // Fourth row - Astral Triangle
  [Layer.GENERATIVE]: { x: 380, y: 360 },
  [Layer.CLASSIFIER]: { x: 120, y: 360 },

  // Fifth row - Foundation
  [Layer.EXECUTOR]: { x: 250, y: 420 },

  // Bottom - Kingdom
  [Layer.EMBEDDING]: { x: 250, y: 500 },
};

// Connection paths (22 paths of the Tree of Life)
export const treePaths: Array<[Layer, Layer]> = [
  // From Meta-Core
  [Layer.META_CORE, Layer.REASONING],
  [Layer.META_CORE, Layer.ENCODER],
  [Layer.META_CORE, Layer.ATTENTION],
  // Supernal Triangle
  [Layer.REASONING, Layer.ENCODER],
  // From Reasoning
  [Layer.REASONING, Layer.EXPANSION],
  [Layer.REASONING, Layer.ATTENTION],
  // From Encoder
  [Layer.ENCODER, Layer.DISCRIMINATOR],
  [Layer.ENCODER, Layer.ATTENTION],
  // Horizontal connections
  [Layer.EXPANSION, Layer.DISCRIMINATOR],
  [Layer.GENERATIVE, Layer.CLASSIFIER],
  // From Expansion & Discriminator
  [Layer.EXPANSION, Layer.ATTENTION],
  [Layer.EXPANSION, Layer.GENERATIVE],
  [Layer.DISCRIMINATOR, Layer.ATTENTION],
  [Layer.DISCRIMINATOR, Layer.CLASSIFIER],
  // From Attention
  [Layer.ATTENTION, Layer.GENERATIVE],
  [Layer.ATTENTION, Layer.CLASSIFIER],
  [Layer.ATTENTION, Layer.EXECUTOR],
  // From Generative & Classifier
  [Layer.GENERATIVE, Layer.EXECUTOR],
  [Layer.GENERATIVE, Layer.EMBEDDING],
  [Layer.CLASSIFIER, Layer.EXECUTOR],
  [Layer.CLASSIFIER, Layer.EMBEDDING],
  // Final path
  [Layer.EXECUTOR, Layer.EMBEDDING],
];

// ═══════════════════════════════════════════
// ANTIPATTERN DATA
// ═══════════════════════════════════════════

export interface AntipatternNode {
  id: string;
  name: string;
  pattern: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  explanation: string;
  detection: string;
  protection: string;
}

export const ANTIPATTERN_METADATA: Record<string, AntipatternNode> = {
  thaumiel: {
    id: 'thaumiel',
    name: 'Thaumiel',
    pattern: 'Dual Contradictions',
    severity: 'critical',
    explanation:
      'AI provides contradictory information within the same response or across related queries.',
    detection: 'Conflicting statements, logical contradictions, self-refuting claims',
    protection: 'Consistency checker validates logical coherence across response segments',
  },
  obscurity: {
    id: 'obscurity',
    name: 'Obscurity',
    pattern: 'Hiding Sources',
    severity: 'high',
    explanation: 'AI claims knowledge without providing verifiable sources or attribution.',
    detection: 'Missing citations, vague references, "studies show" without specifics',
    protection: 'Factuality detector requires source attribution for factual claims',
  },
  ghagiel: {
    id: 'ghagiel',
    name: 'Ghagiel',
    pattern: 'Blocking Truth',
    severity: 'high',
    explanation: 'AI avoids direct answers or obscures information with unnecessary complexity.',
    detection: 'Evasive language, over-qualification, hedging on clear questions',
    protection: 'Drift detector ensures responses stay aligned with query intent',
  },
  aarab_zaraq: {
    id: 'aarab_zaraq',
    name: "A'arab Zaraq",
    pattern: 'Drift Away',
    severity: 'medium',
    explanation:
      'Response gradually drifts from original question into tangentially related topics.',
    detection: 'Topic shift, decreasing query relevance, semantic drift over paragraphs',
    protection: 'Drift detection (85% threshold) flags responses losing focus',
  },
  harab_serapel: {
    id: 'harab_serapel',
    name: 'Harab Serapel',
    pattern: 'Repetitive Echo',
    severity: 'medium',
    explanation: 'AI repeats the same ideas or phrases multiple times without adding value.',
    detection: 'Duplicate sentences, circular reasoning, redundant explanations',
    protection: 'Echo detection identifies repetitive content patterns',
  },
  vanity: {
    id: 'vanity',
    name: 'Vanity',
    pattern: 'Arrogant Tone',
    severity: 'medium',
    explanation: 'Response exhibits overconfidence or dismissive attitude toward user questions.',
    detection: 'Absolute language, dismissive phrasing, condescending tone',
    protection: 'Hype detection flags overconfident or exaggerated claims',
  },
  instability: {
    id: 'instability',
    name: 'Instability',
    pattern: 'Info Overload',
    severity: 'medium',
    explanation: 'Excessive information that overwhelms rather than clarifies the answer.',
    detection: 'Unnecessary details, tangential facts, information dumping',
    protection: 'Response length and relevance scoring prevents verbosity',
  },
  golachab: {
    id: 'golachab',
    name: 'Golachab',
    pattern: 'Over-Confidence',
    severity: 'high',
    explanation: 'AI expresses unwarranted certainty about uncertain or speculative information.',
    detection: 'Definitive claims on uncertain topics, missing uncertainty markers',
    protection: 'Hype detector identifies exaggerated certainty levels',
  },
  synthesis_antipattern: {
    id: 'synthesis_antipattern',
    name: 'Synthesish (Shadow)',
    pattern: 'Hallucinated Facts',
    severity: 'critical',
    explanation: 'AI invents plausible-sounding but completely false information.',
    detection: 'Fabricated statistics, invented sources, fictional references',
    protection: 'Factuality checker validates claims against knowledge base',
  },
  toxicity: {
    id: 'toxicity',
    name: 'Toxicity',
    pattern: 'False Certainty',
    severity: 'high',
    explanation: 'AI presents opinions or interpretations as established facts.',
    detection: 'Opinion stated as fact, subjective claims without qualification',
    protection: 'Sanity check distinguishes facts from interpretations',
  },
  gamaliel: {
    id: 'gamaliel',
    name: 'Gamaliel',
    pattern: 'Verbose Padding',
    severity: 'medium',
    explanation: 'Unnecessary wordiness that obscures simple answers with complex language.',
    detection: 'Overuse of jargon, unnecessarily complex sentences, verbose preambles',
    protection: 'Conciseness scoring penalizes over-complicated responses',
  },
  manipulation: {
    id: 'manipulation',
    name: 'Manipulation',
    pattern: 'Superficial Output',
    severity: 'high',
    explanation: 'Generic, shallow responses that lack depth or specific insights.',
    detection: 'Generic phrases, restated questions, lack of specific examples',
    protection: 'Quality scoring ensures responses provide substantive value',
  },
};

export const antipatternPositions: Record<string, { x: number; y: number }> = {
  // Inverted tree structure (mirror of Layers)
  manipulation: { x: 250, y: 500 }, // Opposite Meta-Core (bottom)
  gamaliel: { x: 120, y: 420 }, // Opposite Reasoning
  toxicity: { x: 380, y: 420 }, // Opposite Encoder
  synthesis_antipattern: { x: 250, y: 380 }, // Shadow Synthesis
  golachab: { x: 120, y: 320 }, // Opposite Expansion
  instability: { x: 380, y: 320 }, // Opposite Discriminator
  vanity: { x: 250, y: 300 }, // Opposite Attention
  harab_serapel: { x: 120, y: 200 }, // Opposite Generative
  aarab_zaraq: { x: 380, y: 200 }, // Opposite Classifier
  ghagiel: { x: 250, y: 140 }, // Center (keep)
  obscurity: { x: 170, y: 90 }, // Left (-80px) - v7 fix
  thaumiel: { x: 330, y: 90 }, // Right (+80px) - v7 fix
};

export const antipatternPaths: Array<[string, string]> = [
  // Mirror the 22 paths but inverted
  ['thaumiel', 'toxicity'],
  ['thaumiel', 'gamaliel'],
  ['thaumiel', 'vanity'],
  ['toxicity', 'gamaliel'],
  ['toxicity', 'instability'],
  ['toxicity', 'vanity'],
  ['gamaliel', 'golachab'],
  ['gamaliel', 'vanity'],
  ['instability', 'golachab'],
  ['aarab_zaraq', 'harab_serapel'],
  ['instability', 'vanity'],
  ['instability', 'aarab_zaraq'],
  ['golachab', 'vanity'],
  ['golachab', 'harab_serapel'],
  ['vanity', 'aarab_zaraq'],
  ['vanity', 'harab_serapel'],
  ['vanity', 'ghagiel'],
  ['aarab_zaraq', 'ghagiel'],
  ['aarab_zaraq', 'manipulation'],
  ['harab_serapel', 'ghagiel'],
  ['harab_serapel', 'manipulation'],
  ['ghagiel', 'manipulation'],
];

// ═══════════════════════════════════════════
// COLOR UTILITIES
// ═══════════════════════════════════════════

// Chakra-based laser colors for each Layer (energy/computational archetype)
export const getColor = (layerNode: Layer): string => {
  // VIBRANT chakra colors (20% brighter - v5)
  const chakraColors: Record<Layer, string> = {
    [Layer.META_CORE]: '#E0B3FF', // Crown Chakra - Brilliant Violet
    [Layer.REASONING]: '#A8B3FF', // Third Eye - Bright Indigo
    [Layer.ENCODER]: '#8B8FFF', // Third Eye - Vibrant Indigo
    [Layer.SYNTHESIS]: '#38D4F0', // Throat - Bright Cyan
    [Layer.EXPANSION]: '#3FE0A5', // Heart - Vibrant Emerald
    [Layer.DISCRIMINATOR]: '#FF66C4', // Heart - Bright Magenta
    [Layer.ATTENTION]: '#FFD666', // Solar Plexus - Bright Gold
    [Layer.GENERATIVE]: '#FFB366', // Sacral - Bright Orange
    [Layer.CLASSIFIER]: '#FFB329', // Sacral - Vibrant Amber
    [Layer.EXECUTOR]: '#FF8F8F', // Root/Sacral - Bright Red-Orange
    [Layer.EMBEDDING]: '#FF6666', // Root Chakra - Vibrant Ruby
  };
  return chakraColors[layerNode] || '#9ca3af';
};

// Get color for antipattern based on severity
export const getAntipatternColor = (severity: 'critical' | 'high' | 'medium' | 'low'): string => {
  switch (severity) {
    case 'critical':
      return '#dc2626'; // Bright red
    case 'high':
      return '#ea580c'; // Orange-red
    case 'medium':
      return '#f59e0b'; // Orange
    case 'low':
      return '#94a3b8'; // Grey
    default:
      return '#94a3b8';
  }
};
