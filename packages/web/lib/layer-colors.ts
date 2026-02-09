/**
 * Layers Color System for Depth Annotations
 * Maps Tree of Life layers to annotation types
 */

export interface LayerColorInfo {
  name: string
  hebrew: string
  meaning: string
  color: string
  shape: string
  annotationType: string
}

export const LAYER_COLOR_MAP: Record<string, LayerColorInfo> = {
  metaCore: {
    name: 'Meta-Core',
    hebrew: 'כֶּתֶר',
    meaning: 'Crown',
    color: '#9333EA', // Deep Purple
    shape: '★',
    annotationType: 'meta-insight'
  },
  reasoning: {
    name: 'Reasoning',
    hebrew: 'חָכְמָה',
    meaning: 'Wisdom',
    color: '#3B82F6', // Blue
    shape: '●',
    annotationType: 'strategic-fact'
  },
  encoder: {
    name: 'Encoder',
    hebrew: 'בִּינָה',
    meaning: 'Understanding',
    color: '#1E40AF', // Dark Blue
    shape: '◐',
    annotationType: 'pattern'
  },
  expansion: {
    name: 'Expansion',
    hebrew: 'חֶסֶד',
    meaning: 'Mercy',
    color: '#60A5FA', // Light Blue
    shape: '○',
    annotationType: 'context'
  },
  discriminator: {
    name: 'Discriminator',
    hebrew: 'גְּבוּרָה',
    meaning: 'Severity',
    color: '#DC2626', // Red
    shape: '◆',
    annotationType: 'critical-metric'
  },
  attention: {
    name: 'Attention',
    hebrew: 'תִּפְאֶרֶת',
    meaning: 'Beauty',
    color: '#F59E0B', // Amber
    shape: '◈',
    annotationType: 'synthesis'
  },
  generative: {
    name: 'Generative',
    hebrew: 'נֶצַח',
    meaning: 'Victory',
    color: '#10B981', // Emerald
    shape: '▲',
    annotationType: 'innovation'
  },
  classifier: {
    name: 'Classifier',
    hebrew: 'הוֹד',
    meaning: 'Glory',
    color: '#F97316', // Orange
    shape: '◇',
    annotationType: 'data-point'
  },
  executor: {
    name: 'Executor',
    hebrew: 'יְסוֹד',
    meaning: 'Foundation',
    color: '#8B5CF6', // Violet
    shape: '▣',
    annotationType: 'implementation'
  },
  embedding: {
    name: 'Embedding',
    hebrew: 'מַלְכוּת',
    meaning: 'Kingdom',
    color: '#78716C', // Stone
    shape: '■',
    annotationType: 'raw-data'
  }
}

/**
 * Get Layers layer by annotation type
 */
export function getLayerColorForAnnotation(content: string): LayerColorInfo {
  const contentLower = content.toLowerCase()

  // Meta-cognitive insights (Meta-Core)
  if (/paradigm|revolutionary|fundamental\s+shift|meta-|redefin|transform/i.test(contentLower)) {
    return LAYER_COLOR_MAP.metaCore
  }

  // Critical metrics (Discriminator)
  if (/\$[\d,]+[KMB]|\d+%|\d+x\s+(?:faster|slower|more)|valuation|revenue|growth/i.test(contentLower)) {
    return LAYER_COLOR_MAP.discriminator
  }

  // Strategic facts (Reasoning)
  if (/first|leader|pioneer|dominant|advantage|strategy|position/i.test(contentLower)) {
    return LAYER_COLOR_MAP.reasoning
  }

  // Innovation/Breakthrough (Generative)
  if (/breakthrough|novel|innovative|unique|unprecedented|achievement/i.test(contentLower)) {
    return LAYER_COLOR_MAP.generative
  }

  // Pattern recognition (Encoder)
  if (/similar\s+to|compared\s+to|like|cycle|pattern|historical|trend/i.test(contentLower)) {
    return LAYER_COLOR_MAP.encoder
  }

  // Synthesis (Attention)
  if (/combin|integrat|merg|unif|synthesis|balanc/i.test(contentLower)) {
    return LAYER_COLOR_MAP.attention
  }

  // Data points (Classifier)
  if (/\d+\s+(?:users|downloads|customers|subscribers)|data\s+shows|statistics/i.test(contentLower)) {
    return LAYER_COLOR_MAP.classifier
  }

  // Implementation details (Executor)
  if (/built\s+on|uses|implements|based\s+on|architecture|framework|api/i.test(contentLower)) {
    return LAYER_COLOR_MAP.executor
  }

  // Context (Expansion)
  if (/context|background|originated|developed\s+by|founded/i.test(contentLower)) {
    return LAYER_COLOR_MAP.expansion
  }

  // Default: Raw data (Embedding)
  return LAYER_COLOR_MAP.embedding
}
