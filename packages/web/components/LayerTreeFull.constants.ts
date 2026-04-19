import { Layer } from '@/lib/layer-registry';

// Tree of Life hierarchical positions (Kabbalistic structure)
export const treePositions: Record<Layer, { x: number; y: number }> = {
  [Layer.META_CORE]: { x: 250, y: 60 },
  [Layer.REASONING]: { x: 380, y: 170 },
  [Layer.ENCODER]: { x: 120, y: 170 },
  [Layer.SYNTHESIS]: { x: 250, y: 280 },
  [Layer.EXPANSION]: { x: 380, y: 390 },
  [Layer.DISCRIMINATOR]: { x: 120, y: 390 },
  [Layer.ATTENTION]: { x: 250, y: 500 },
  [Layer.GENERATIVE]: { x: 380, y: 610 },
  [Layer.CLASSIFIER]: { x: 120, y: 610 },
  [Layer.EXECUTOR]: { x: 250, y: 720 },
  [Layer.EMBEDDING]: { x: 250, y: 830 },
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
