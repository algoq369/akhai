/**
 * Constants for AIConfigUnified
 * Extracted from AIConfigUnified.tsx to keep files under 500 lines.
 */

import { Layer } from '@/lib/layer-registry';

export const NODE_COLORS: Record<number, string> = {
  [Layer.META_CORE]: '#a78bfa',
  [Layer.REASONING]: '#818cf8',
  [Layer.ENCODER]: '#6366f1',
  [Layer.SYNTHESIS]: '#22d3ee',
  [Layer.EXPANSION]: '#34d399',
  [Layer.DISCRIMINATOR]: '#f87171',
  [Layer.ATTENTION]: '#fbbf24',
  [Layer.GENERATIVE]: '#fb923c',
  [Layer.CLASSIFIER]: '#facc15',
  [Layer.EXECUTOR]: '#a3a3a3',
  [Layer.EMBEDDING]: '#78716c',
};

export const AI_LABELS: Record<number, { name: string; concept: string }> = {
  [Layer.META_CORE]: { name: 'meta-cognition', concept: 'unified awareness' },
  [Layer.REASONING]: { name: 'reasoning', concept: 'problem decomposition' },
  [Layer.ENCODER]: { name: 'knowledge', concept: 'fact retrieval' },
  [Layer.SYNTHESIS]: { name: 'verification', concept: 'self-checking' },
  [Layer.EXPANSION]: { name: 'expansion', concept: 'creative exploration' },
  [Layer.DISCRIMINATOR]: { name: 'critical-analysis', concept: 'rigorous evaluation' },
  [Layer.ATTENTION]: { name: 'synthesis', concept: 'balanced integration' },
  [Layer.GENERATIVE]: { name: 'persistence', concept: 'iterative refinement' },
  [Layer.CLASSIFIER]: { name: 'communication', concept: 'clear articulation' },
  [Layer.EXECUTOR]: { name: 'foundation', concept: 'grounded knowledge' },
  [Layer.EMBEDDING]: { name: 'manifestation', concept: 'concrete output' },
};

export const CRITICAL_LAYERS = [Layer.REASONING, Layer.ENCODER, Layer.SYNTHESIS];

export const ALL_LAYERS = [
  Layer.META_CORE,
  Layer.REASONING,
  Layer.ENCODER,
  Layer.SYNTHESIS,
  Layer.EXPANSION,
  Layer.DISCRIMINATOR,
  Layer.ATTENTION,
  Layer.GENERATIVE,
  Layer.CLASSIFIER,
  Layer.EXECUTOR,
  Layer.EMBEDDING,
];

export const PRESETS = [
  {
    id: 'fast',
    name: 'fast',
    weights: {
      [Layer.REASONING]: 0.4,
      [Layer.ENCODER]: 0.5,
      [Layer.SYNTHESIS]: 0.3,
      [Layer.META_CORE]: 0.4,
      [Layer.EXPANSION]: 0.3,
      [Layer.DISCRIMINATOR]: 0.5,
      [Layer.ATTENTION]: 0.5,
      [Layer.GENERATIVE]: 0.4,
      [Layer.CLASSIFIER]: 0.6,
      [Layer.EXECUTOR]: 0.5,
      [Layer.EMBEDDING]: 0.7,
    },
  },
  {
    id: 'balanced',
    name: 'balanced',
    weights: {
      [Layer.REASONING]: 0.6,
      [Layer.ENCODER]: 0.6,
      [Layer.SYNTHESIS]: 0.6,
      [Layer.META_CORE]: 0.5,
      [Layer.EXPANSION]: 0.6,
      [Layer.DISCRIMINATOR]: 0.6,
      [Layer.ATTENTION]: 0.7,
      [Layer.GENERATIVE]: 0.6,
      [Layer.CLASSIFIER]: 0.6,
      [Layer.EXECUTOR]: 0.6,
      [Layer.EMBEDDING]: 0.6,
    },
  },
  {
    id: 'thorough',
    name: 'thorough',
    weights: {
      [Layer.REASONING]: 0.85,
      [Layer.ENCODER]: 0.8,
      [Layer.SYNTHESIS]: 0.9,
      [Layer.META_CORE]: 0.6,
      [Layer.EXPANSION]: 0.5,
      [Layer.DISCRIMINATOR]: 0.85,
      [Layer.ATTENTION]: 0.7,
      [Layer.GENERATIVE]: 0.7,
      [Layer.CLASSIFIER]: 0.75,
      [Layer.EXECUTOR]: 0.8,
      [Layer.EMBEDDING]: 0.75,
    },
  },
  {
    id: 'creative',
    name: 'creative',
    weights: {
      [Layer.REASONING]: 0.6,
      [Layer.ENCODER]: 0.5,
      [Layer.SYNTHESIS]: 0.4,
      [Layer.META_CORE]: 0.7,
      [Layer.EXPANSION]: 0.9,
      [Layer.DISCRIMINATOR]: 0.3,
      [Layer.ATTENTION]: 0.8,
      [Layer.GENERATIVE]: 0.85,
      [Layer.CLASSIFIER]: 0.5,
      [Layer.EXECUTOR]: 0.55,
      [Layer.EMBEDDING]: 0.65,
    },
  },
];

// Tree positions for full tree
export const TREE_POSITIONS: Record<number, { x: number; y: number }> = {
  [Layer.META_CORE]: { x: 250, y: 40 },
  [Layer.REASONING]: { x: 380, y: 110 },
  [Layer.ENCODER]: { x: 120, y: 110 },
  [Layer.SYNTHESIS]: { x: 250, y: 170 },
  [Layer.EXPANSION]: { x: 380, y: 240 },
  [Layer.DISCRIMINATOR]: { x: 120, y: 240 },
  [Layer.ATTENTION]: { x: 250, y: 310 },
  [Layer.GENERATIVE]: { x: 380, y: 380 },
  [Layer.CLASSIFIER]: { x: 120, y: 380 },
  [Layer.EXECUTOR]: { x: 250, y: 450 },
  [Layer.EMBEDDING]: { x: 250, y: 530 },
};

export const TREE_PATHS: [Layer, Layer][] = [
  [Layer.META_CORE, Layer.REASONING],
  [Layer.META_CORE, Layer.ENCODER],
  [Layer.META_CORE, Layer.ATTENTION],
  [Layer.REASONING, Layer.ENCODER],
  [Layer.REASONING, Layer.EXPANSION],
  [Layer.REASONING, Layer.ATTENTION],
  [Layer.ENCODER, Layer.DISCRIMINATOR],
  [Layer.ENCODER, Layer.ATTENTION],
  [Layer.EXPANSION, Layer.DISCRIMINATOR],
  [Layer.EXPANSION, Layer.ATTENTION],
  [Layer.DISCRIMINATOR, Layer.ATTENTION],
  [Layer.ATTENTION, Layer.GENERATIVE],
  [Layer.ATTENTION, Layer.CLASSIFIER],
  [Layer.ATTENTION, Layer.EXECUTOR],
  [Layer.GENERATIVE, Layer.CLASSIFIER],
  [Layer.GENERATIVE, Layer.EXECUTOR],
  [Layer.CLASSIFIER, Layer.EXECUTOR],
  [Layer.EXECUTOR, Layer.EMBEDDING],
];

// Antipatterns data
export const ANTIPATTERN_DATA = [
  { id: 1, name: 'dual contradictions', severity: 'critical', x: 380, y: 40 },
  { id: 2, name: 'hiding sources', severity: 'high', x: 120, y: 40 },
  { id: 3, name: 'blocking truth', severity: 'critical', x: 250, y: 110 },
  { id: 4, name: 'drift away', severity: 'high', x: 380, y: 170 },
  { id: 5, name: 'repetitive echo', severity: 'medium', x: 120, y: 170 },
  { id: 6, name: 'arrogant tone', severity: 'medium', x: 250, y: 240 },
  { id: 7, name: 'info overload', severity: 'medium', x: 380, y: 310 },
  { id: 8, name: 'over-confidence', severity: 'high', x: 120, y: 310 },
  { id: 9, name: 'hallucinated facts', severity: 'critical', x: 250, y: 380 },
  { id: 10, name: 'false certainty', severity: 'high', x: 380, y: 450 },
  { id: 11, name: 'verbose padding', severity: 'medium', x: 120, y: 450 },
  { id: 12, name: 'superficial output', severity: 'high', x: 250, y: 520 },
];
