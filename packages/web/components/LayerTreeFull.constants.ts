import { Layer } from '@/lib/layer-registry'

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
}

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
]
