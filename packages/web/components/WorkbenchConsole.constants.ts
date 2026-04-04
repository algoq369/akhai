import { Layer } from '@/lib/layer-registry';

export interface AILayer {
  id: number;
  name: string;
  description: string;
  phase: 'input' | 'understanding' | 'reasoning' | 'output';
  extremes: { low: string; high: string };
  critical: boolean;
  color: string;
}

export const AI_LAYERS: AILayer[] = [
  {
    id: Layer.EMBEDDING,
    name: 'reception',
    description: 'input parsing',
    phase: 'input',
    extremes: { low: 'basic', high: 'detailed' },
    critical: false,
    color: '#78716c',
  },
  {
    id: Layer.EXECUTOR,
    name: 'comprehension',
    description: 'semantic encoding',
    phase: 'input',
    extremes: { low: 'surface', high: 'deep' },
    critical: false,
    color: '#a3a3a3',
  },
  {
    id: Layer.CLASSIFIER,
    name: 'context',
    description: 'relationship mapping',
    phase: 'understanding',
    extremes: { low: 'narrow', high: 'wide' },
    critical: false,
    color: '#facc15',
  },
  {
    id: Layer.ENCODER,
    name: 'knowledge',
    description: 'retrieves facts and expertise',
    phase: 'understanding',
    extremes: { low: 'focused', high: 'broad' },
    critical: true,
    color: '#6366f1',
  },
  {
    id: Layer.REASONING,
    name: 'reasoning',
    description: 'breaks problems into steps',
    phase: 'reasoning',
    extremes: { low: 'shallow', high: 'deep' },
    critical: true,
    color: '#818cf8',
  },
  {
    id: Layer.EXPANSION,
    name: 'expansion',
    description: 'explores alternatives',
    phase: 'reasoning',
    extremes: { low: 'constrained', high: 'expansive' },
    critical: false,
    color: '#34d399',
  },
  {
    id: Layer.DISCRIMINATOR,
    name: 'analysis',
    description: 'evaluates and limits',
    phase: 'reasoning',
    extremes: { low: 'lenient', high: 'strict' },
    critical: false,
    color: '#f87171',
  },
  {
    id: Layer.ATTENTION,
    name: 'synthesis',
    description: 'combines insights',
    phase: 'reasoning',
    extremes: { low: 'simple', high: 'complex' },
    critical: false,
    color: '#fbbf24',
  },
  {
    id: Layer.SYNTHESIS,
    name: 'verification',
    description: 'checks for errors',
    phase: 'output',
    extremes: { low: 'minimal', high: 'thorough' },
    critical: true,
    color: '#22d3ee',
  },
  {
    id: Layer.GENERATIVE,
    name: 'articulation',
    description: 'crafts response',
    phase: 'output',
    extremes: { low: 'concise', high: 'verbose' },
    critical: false,
    color: '#fb923c',
  },
  {
    id: Layer.META_CORE,
    name: 'output',
    description: 'final delivery',
    phase: 'output',
    extremes: { low: 'minimal', high: 'complete' },
    critical: false,
    color: '#a78bfa',
  },
];

export const CRITICAL_LAYERS = AI_LAYERS.filter((l) => l.critical);

// Tree positions for visualization (top-to-bottom flow)
export const TREE_POSITIONS: Record<number, { x: number; y: number }> = {
  [Layer.EMBEDDING]: { x: 100, y: 30 }, // reception (top - input)
  [Layer.EXECUTOR]: { x: 100, y: 70 }, // comprehension
  [Layer.CLASSIFIER]: { x: 60, y: 110 }, // context (left)
  [Layer.ENCODER]: { x: 140, y: 110 }, // knowledge (right) ★
  [Layer.REASONING]: { x: 100, y: 155 }, // reasoning (center) ★
  [Layer.EXPANSION]: { x: 50, y: 195 }, // expansion (left)
  [Layer.DISCRIMINATOR]: { x: 150, y: 195 }, // analysis (right)
  [Layer.ATTENTION]: { x: 100, y: 235 }, // synthesis (center)
  [Layer.SYNTHESIS]: { x: 100, y: 280 }, // verification ★
  [Layer.GENERATIVE]: { x: 100, y: 320 }, // articulation
  [Layer.META_CORE]: { x: 100, y: 360 }, // output (bottom)
};

// Tree connections (processing flow)
export const TREE_PATHS: [number, number][] = [
  [Layer.EMBEDDING, Layer.EXECUTOR], // reception → comprehension
  [Layer.EXECUTOR, Layer.CLASSIFIER], // comprehension → context
  [Layer.EXECUTOR, Layer.ENCODER], // comprehension → knowledge
  [Layer.CLASSIFIER, Layer.REASONING], // context → reasoning
  [Layer.ENCODER, Layer.REASONING], // knowledge → reasoning
  [Layer.REASONING, Layer.EXPANSION], // reasoning → expansion
  [Layer.REASONING, Layer.DISCRIMINATOR], // reasoning → analysis
  [Layer.EXPANSION, Layer.ATTENTION], // expansion → synthesis
  [Layer.DISCRIMINATOR, Layer.ATTENTION], // analysis → synthesis
  [Layer.ATTENTION, Layer.SYNTHESIS], // synthesis → verification
  [Layer.SYNTHESIS, Layer.GENERATIVE], // verification → articulation
  [Layer.GENERATIVE, Layer.META_CORE], // articulation → output
];

export const PRESETS = [
  {
    id: 'fast',
    name: 'fast',
    weights: { [Layer.REASONING]: 0.4, [Layer.ENCODER]: 0.5, [Layer.SYNTHESIS]: 0.4 },
  },
  {
    id: 'balanced',
    name: 'balanced',
    weights: { [Layer.REASONING]: 0.7, [Layer.ENCODER]: 0.7, [Layer.SYNTHESIS]: 0.7 },
  },
  {
    id: 'thorough',
    name: 'thorough',
    weights: { [Layer.REASONING]: 0.9, [Layer.ENCODER]: 0.85, [Layer.SYNTHESIS]: 0.9 },
  },
  {
    id: 'creative',
    name: 'creative',
    weights: { [Layer.REASONING]: 0.7, [Layer.ENCODER]: 0.6, [Layer.SYNTHESIS]: 0.5 },
  },
];
