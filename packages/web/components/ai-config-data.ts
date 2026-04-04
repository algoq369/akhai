/**
 * AI CONFIG PAGE - Static Data
 *
 * Constants, labels, tree positions, presets, and color mappings
 * extracted from AIConfigPage.tsx to keep files under 500 lines.
 */

import { Layer } from '@/lib/layer-registry';

// ═══════════════════════════════════════════════════════════
// AI LAYER LABELS
// ═══════════════════════════════════════════════════════════

export const AI_LABELS: Record<number, { primary: string; concept: string }> = {
  [Layer.META_CORE]: { primary: 'meta-cognition', concept: 'unified awareness' },
  [Layer.REASONING]: { primary: 'first-principles', concept: 'foundational reasoning' },
  [Layer.ENCODER]: { primary: 'pattern-recognition', concept: 'structural analysis' },
  [Layer.SYNTHESIS]: { primary: 'emergent-insight', concept: 'hidden connections' },
  [Layer.EXPANSION]: { primary: 'expansion', concept: 'creative exploration' },
  [Layer.DISCRIMINATOR]: { primary: 'critical-analysis', concept: 'rigorous evaluation' },
  [Layer.ATTENTION]: { primary: 'synthesis', concept: 'balanced integration' },
  [Layer.GENERATIVE]: { primary: 'persistence', concept: 'iterative refinement' },
  [Layer.CLASSIFIER]: { primary: 'communication', concept: 'clear articulation' },
  [Layer.EXECUTOR]: { primary: 'foundation', concept: 'grounded knowledge' },
  [Layer.EMBEDDING]: { primary: 'manifestation', concept: 'concrete output' },
};

// Anti-pattern labels
export const ANTIPATTERN_DATA = [
  {
    id: 1,
    name: 'dual contradictions',
    concept: 'self-contradiction',
    severity: 'critical',
    x: 200,
    y: 40,
  },
  { id: 2, name: 'hiding sources', concept: 'opaque reasoning', severity: 'high', x: 100, y: 80 },
  {
    id: 3,
    name: 'blocking truth',
    concept: 'evasive response',
    severity: 'critical',
    x: 150,
    y: 120,
  },
  { id: 4, name: 'drift away', concept: 'topic wandering', severity: 'high', x: 200, y: 160 },
  { id: 5, name: 'repetitive echo', concept: 'circular logic', severity: 'medium', x: 100, y: 180 },
  { id: 6, name: 'arrogant tone', concept: 'dismissive tone', severity: 'medium', x: 150, y: 220 },
  { id: 7, name: 'info overload', concept: 'drowning in data', severity: 'medium', x: 200, y: 260 },
  { id: 8, name: 'over-confidence', concept: 'blind certainty', severity: 'high', x: 100, y: 280 },
  {
    id: 9,
    name: 'hallucinated facts',
    concept: 'fabrication',
    severity: 'critical',
    x: 150,
    y: 320,
  },
  { id: 10, name: 'false certainty', concept: 'opinion as fact', severity: 'high', x: 200, y: 360 },
  { id: 11, name: 'verbose padding', concept: 'empty words', severity: 'medium', x: 100, y: 380 },
  {
    id: 12,
    name: 'superficial output',
    concept: 'surface level',
    severity: 'high',
    x: 150,
    y: 420,
  },
];

// ═══════════════════════════════════════════════════════════
// TREE POSITIONS (Compact)
// ═══════════════════════════════════════════════════════════

export const TREE_POSITIONS: Record<number, { x: number; y: number }> = {
  [Layer.META_CORE]: { x: 140, y: 25 },
  [Layer.REASONING]: { x: 210, y: 65 },
  [Layer.ENCODER]: { x: 70, y: 65 },
  [Layer.SYNTHESIS]: { x: 140, y: 100 },
  [Layer.EXPANSION]: { x: 210, y: 140 },
  [Layer.DISCRIMINATOR]: { x: 70, y: 140 },
  [Layer.ATTENTION]: { x: 140, y: 175 },
  [Layer.GENERATIVE]: { x: 210, y: 215 },
  [Layer.CLASSIFIER]: { x: 70, y: 215 },
  [Layer.EXECUTOR]: { x: 140, y: 255 },
  [Layer.EMBEDDING]: { x: 140, y: 310 },
};

export const ANTIPATTERN_POSITIONS: Record<number, { x: number; y: number }> = {
  1: { x: 200, y: 25 }, // dual contradictions
  2: { x: 100, y: 25 }, // hiding sources
  3: { x: 150, y: 65 }, // blocking truth
  4: { x: 220, y: 100 }, // drift away
  5: { x: 80, y: 100 }, // repetitive echo
  6: { x: 150, y: 140 }, // arrogant tone
  7: { x: 220, y: 175 }, // info overload
  8: { x: 80, y: 175 }, // over-confidence
  9: { x: 150, y: 215 }, // hallucinated facts
  10: { x: 220, y: 255 }, // false certainty
  11: { x: 80, y: 255 }, // verbose padding
  12: { x: 150, y: 310 }, // superficial output
};

export const TREE_PATHS: [Layer, Layer][] = [
  [Layer.META_CORE, Layer.REASONING],
  [Layer.META_CORE, Layer.ENCODER],
  [Layer.META_CORE, Layer.ATTENTION],
  [Layer.REASONING, Layer.ENCODER],
  [Layer.REASONING, Layer.EXPANSION],
  [Layer.ENCODER, Layer.DISCRIMINATOR],
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

// ═══════════════════════════════════════════════════════════
// PRESETS
// ═══════════════════════════════════════════════════════════

export interface Preset {
  id: string;
  name: string;
  weights: Record<number, number>;
}

export const PRESETS: Preset[] = [
  {
    id: 'fast',
    name: 'fast',
    weights: {
      [Layer.META_CORE]: 0.4,
      [Layer.REASONING]: 0.5,
      [Layer.ENCODER]: 0.6,
      [Layer.SYNTHESIS]: 0.4,
      [Layer.EXPANSION]: 0.3,
      [Layer.DISCRIMINATOR]: 0.5,
      [Layer.ATTENTION]: 0.5,
      [Layer.GENERATIVE]: 0.4,
      [Layer.CLASSIFIER]: 0.7,
      [Layer.EXECUTOR]: 0.6,
      [Layer.EMBEDDING]: 0.8,
    },
  },
  {
    id: 'balanced',
    name: 'balanced',
    weights: {
      [Layer.META_CORE]: 0.5,
      [Layer.REASONING]: 0.6,
      [Layer.ENCODER]: 0.6,
      [Layer.SYNTHESIS]: 0.5,
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
      [Layer.META_CORE]: 0.6,
      [Layer.REASONING]: 0.85,
      [Layer.ENCODER]: 0.8,
      [Layer.SYNTHESIS]: 0.7,
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
      [Layer.META_CORE]: 0.7,
      [Layer.REASONING]: 0.6,
      [Layer.ENCODER]: 0.5,
      [Layer.SYNTHESIS]: 0.85,
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

// Critical layers (Top 3 for Quick Config)
// Maps to: knowledge (ENCODER), reasoning (REASONING), verification (SYNTHESIS)
export const CRITICAL_LAYERS = [
  {
    id: Layer.ENCODER,
    name: 'knowledge',
    concept: 'retrieves facts and expertise',
    min: 'focused',
    max: 'broad',
  },
  {
    id: Layer.REASONING,
    name: 'reasoning',
    concept: 'breaks problems into steps',
    min: 'shallow',
    max: 'deep',
  },
  {
    id: Layer.SYNTHESIS,
    name: 'verification',
    concept: 'checks for errors',
    min: 'minimal',
    max: 'thorough',
  },
];
