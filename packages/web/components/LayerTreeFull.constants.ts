import { Layer } from '@/lib/layer-registry';

// Tree of Life hierarchical positions (Kabbalistic structure)
export const treePositions: Record<Layer, { x: number; y: number }> = {
  [Layer.META_CORE]: { x: 250, y: 50 },
  [Layer.REASONING]: { x: 430, y: 150 },
  [Layer.ENCODER]: { x: 70, y: 150 },
  [Layer.SYNTHESIS]: { x: 250, y: 250 },
  [Layer.EXPANSION]: { x: 430, y: 350 },
  [Layer.DISCRIMINATOR]: { x: 70, y: 350 },
  [Layer.ATTENTION]: { x: 250, y: 450 },
  [Layer.GENERATIVE]: { x: 430, y: 550 },
  [Layer.CLASSIFIER]: { x: 70, y: 550 },
  [Layer.EXECUTOR]: { x: 250, y: 650 },
  [Layer.EMBEDDING]: { x: 250, y: 780 },
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
