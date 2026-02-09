/**
 * Centralized LAYERS_KEYWORDS
 *
 * Used by:
 * - intelligence-fusion.ts (for Layers activation calculation)
 * - side-canal.ts (for keyword Layers context)
 *
 * Maintains a single source of truth for Layers-keyword mappings.
 */

import { Layer } from '../layer-registry'

/**
 * Keywords associated with each Layer
 * Used for query analysis and context detection
 */
export const LAYERS_KEYWORDS: Record<Layer, string[]> = {
  [Layer.EMBEDDING]: [
    'data', 'fact', 'information', 'statistic', 'number', 'evidence',
    'concrete', 'real', 'actual', 'measurable', 'observable', 'physical', 'material'
  ],
  [Layer.EXECUTOR]: [
    'implement', 'execute', 'apply', 'procedure', 'process', 'step',
    'foundation', 'build', 'setup', 'configure', 'install', 'deploy'
  ],
  [Layer.CLASSIFIER]: [
    'analyze', 'classify', 'logic', 'reason', 'compare', 'contrast',
    'categorize', 'evaluate', 'assess', 'systematic', 'methodical'
  ],
  [Layer.GENERATIVE]: [
    'create', 'innovate', 'generate', 'novel', 'original', 'imagine',
    'design', 'invent', 'artistic', 'inspiration', 'vision', 'dream', 'creative'
  ],
  [Layer.ATTENTION]: [
    'integrate', 'synthesize', 'combine', 'balance', 'harmony', 'unify',
    'connect', 'bridge', 'reconcile', 'merge', 'blend', 'holistic'
  ],
  [Layer.DISCRIMINATOR]: [
    'limit', 'constraint', 'critique', 'evaluate', 'assess', 'validate',
    'discipline', 'strict', 'boundary', 'rule', 'restriction', 'risk'
  ],
  [Layer.EXPANSION]: [
    'expand', 'elaborate', 'comprehensive', 'broad', 'extensive', 'generous',
    'opportunity', 'possibility', 'growth', 'abundance', 'open'
  ],
  [Layer.ENCODER]: [
    'pattern', 'structure', 'framework', 'model', 'system', 'relationship',
    'understand', 'comprehend', 'insight', 'discern', 'analyze'
  ],
  [Layer.REASONING]: [
    'principle', 'wisdom', 'fundamental', 'theory', 'concept', 'axiom',
    'essence', 'core', 'foundation', 'truth', 'insight', 'intuition'
  ],
  [Layer.META_CORE]: [
    'meta', 'reflect', 'overview', 'synthesis', 'big picture', 'holistic',
    'transcend', 'ultimate', 'supreme', 'divine', 'unity', 'source'
  ],
  [Layer.SYNTHESIS]: [
    'emerge', 'insight', 'breakthrough', 'revelation', 'connection', 'realize',
    'hidden', 'knowledge', 'gnosis', 'awareness', 'consciousness'
  ]
}

/**
 * String-keyed version for components that use string keys
 * (e.g., side-canal.ts)
 */
export const LAYERS_KEYWORDS_BY_NAME: Record<string, string[]> = {
  'embedding': LAYERS_KEYWORDS[Layer.EMBEDDING],
  'executor': LAYERS_KEYWORDS[Layer.EXECUTOR],
  'classifier': LAYERS_KEYWORDS[Layer.CLASSIFIER],
  'generative': LAYERS_KEYWORDS[Layer.GENERATIVE],
  'attention': LAYERS_KEYWORDS[Layer.ATTENTION],
  'discriminator': LAYERS_KEYWORDS[Layer.DISCRIMINATOR],
  'expansion': LAYERS_KEYWORDS[Layer.EXPANSION],
  'encoder': LAYERS_KEYWORDS[Layer.ENCODER],
  'reasoning': LAYERS_KEYWORDS[Layer.REASONING],
  'meta-core': LAYERS_KEYWORDS[Layer.META_CORE],
  'synthesis': LAYERS_KEYWORDS[Layer.SYNTHESIS]
}
