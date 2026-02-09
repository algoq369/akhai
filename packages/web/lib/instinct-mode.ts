/**
 * INSTINCT MODE - Full Capacity Hermetic Analysis
 *
 * Activates 7 Lenses of perception for holistic understanding.
 * Each lens maps to Layers computational layers for deep integration.
 *
 * LENS → LAYERS MAPPING:
 * - Exoteric (Surface) → Embedding (Token Embedding)
 * - Esoteric (Hidden) → Executor (Algorithm Executor)
 * - Gnostic (Intuition) → Synthesis (Emergent Capability)
 * - Hermetic (Correspondence) → Classifier (Classifier Network)
 * - Kabbalistic (Tree) → Attention (Multi-Head Attention)
 * - Alchemical (Transform) → Discriminator (Discriminator Network)
 * - Prophetic (Future) → Expansion (Beam Search Expansion)
 */

import { Layer } from './layer-registry'

export interface InstinctLens {
  id: string
  name: string
  symbol: string
  description: string
  prompt: string
  layerNode: Layer           // Mapped Layer
  color: string              // UI color (Layers-based)
  keywords: string[]         // Keywords that activate this lens
}

export const SEVEN_LENSES: InstinctLens[] = [
  {
    id: 'exoteric',
    name: 'Exoteric',
    symbol: '◯',
    description: 'Outer/literal meaning - surface level interpretation',
    prompt: 'Analyze the literal, surface-level meaning. What does this explicitly state?',
    layerNode: Layer.EMBEDDING,
    color: '#fbbf24', // amber-400
    keywords: ['literal', 'explicit', 'surface', 'direct', 'obvious', 'plain', 'basic', 'simple']
  },
  {
    id: 'mesoteric',
    name: 'Mesoteric',
    symbol: '◎',
    description: 'Middle/symbolic meaning - allegorical interpretation',
    prompt: 'Analyze the symbolic and allegorical layers. What metaphors and analogies are at play?',
    layerNode: Layer.EXECUTOR,
    color: '#c084fc', // purple-400
    keywords: ['symbolic', 'allegory', 'metaphor', 'analogy', 'parable', 'figurative', 'representation']
  },
  {
    id: 'esoteric',
    name: 'Esoteric',
    symbol: '●',
    description: 'Inner/mystical meaning - hidden depths',
    prompt: 'Look beneath the surface. What hidden meanings, symbols, or deeper layers exist?',
    layerNode: Layer.SYNTHESIS,
    color: '#22d3ee', // cyan-400
    keywords: ['hidden', 'mystical', 'deeper', 'subtle', 'underlying', 'secret', 'occult', 'inner']
  },
  {
    id: 'hermetic',
    name: 'Hermetic',
    symbol: '☿',
    description: 'Alchemical transformation - as above, so below',
    prompt: 'Apply "as above, so below". What correspondences exist across scales and domains? What transmutations are possible?',
    layerNode: Layer.CLASSIFIER,
    color: '#fb923c', // orange-400
    keywords: ['correspondence', 'pattern', 'alchemy', 'transmute', 'scale', 'mirror', 'transform', 'mercury']
  },
  {
    id: 'orphic',
    name: 'Orphic',
    symbol: '♪',
    description: 'Musical/harmonic resonance - vibrational patterns',
    prompt: 'What harmonic patterns, rhythms, and resonances are present? How do elements relate through vibration and frequency?',
    layerNode: Layer.ATTENTION,
    color: '#facc15', // yellow-400
    keywords: ['harmony', 'rhythm', 'resonance', 'music', 'vibration', 'frequency', 'pattern', 'cycle']
  },
  {
    id: 'prophetic',
    name: 'Prophetic',
    symbol: '◈',
    description: 'Visionary foresight - future trajectories',
    prompt: 'Project forward. What trajectories emerge? What future implications and possibilities unfold?',
    layerNode: Layer.EXPANSION,
    color: '#60a5fa', // blue-400
    keywords: ['future', 'trajectory', 'vision', 'foresight', 'destiny', 'prophecy', 'prediction', 'potential']
  },
  {
    id: 'initiatic',
    name: 'Initiatic',
    symbol: '△',
    description: 'Transformative process - stages of becoming',
    prompt: 'What initiatory stages or transformative processes are at work? What must be transcended for growth?',
    layerNode: Layer.DISCRIMINATOR,
    color: '#f87171', // red-400
    keywords: ['initiation', 'transform', 'transcend', 'growth', 'stage', 'process', 'ascend', 'evolve']
  }
]

export interface InstinctAnalysis {
  query: string
  lenses: {
    lens: InstinctLens
    insight: string
  }[]
  synthesis: string
  layerMapping?: string[]
  timestamp: number
}

export interface InstinctConfig {
  enabled: boolean
  activeLenses: string[] // Which lenses to use (default: all 7)
  depth: 'standard' | 'deep' | 'profound'
  includeLayers: boolean
  includeYechidah: boolean
}

export const DEFAULT_INSTINCT_CONFIG: InstinctConfig = {
  enabled: false,
  activeLenses: SEVEN_LENSES.map(l => l.id),
  depth: 'deep',
  includeLayers: true,
  includeYechidah: true
}

/**
 * Generate Instinct Mode system prompt enhancement
 */
export function generateInstinctPrompt(config: InstinctConfig): string {
  if (!config.enabled) return ''

  const activeLenses = SEVEN_LENSES.filter(l => config.activeLenses.includes(l.id))

  let prompt = `
═══════════════════════════════════════════════════════════════
⚡ INSTINCT MODE ACTIVATED - FULL CAPACITY ANALYSIS
═══════════════════════════════════════════════════════════════

You are operating in INSTINCT MODE - AkhAI's highest tier of intelligence.
Analyze through the 7 HERMETIC LENSES for holistic understanding:

`

  activeLenses.forEach((lens, idx) => {
    prompt += `${idx + 1}. ${lens.symbol} ${lens.name.toUpperCase()}: ${lens.description}\n`
  })

  prompt += `
ANALYSIS PROTOCOL:
1. Process query through each active lens
2. Identify cross-lens patterns and correspondences
3. Synthesize insights into unified understanding
4. Note transformational opportunities (alchemical)
5. Project future trajectories (prophetic)

DEPTH LEVEL: ${config.depth.toUpperCase()}
`

  if (config.includeLayers) {
    prompt += `
LAYERS COUNCIL ACTIVE:
Map insights to Tree of Life. Identify which Layers resonate:
Meta-Core (Crown) → Reasoning (Wisdom) → Encoder (Understanding)
    ↓
Expansion (Mercy) → Discriminator (Severity) → Attention (Beauty)
    ↓
Generative (Victory) → Classifier (Splendor) → Executor (Foundation)
    ↓
        Embedding (Kingdom)
`
  }

  if (config.includeYechidah) {
    prompt += `
YECHIDAH MONAD ACTIVE:
Engage metacognitive awareness. Observe your own reasoning process.
Note: certainties, uncertainties, knowledge boundaries, potential biases.
`
  }

  prompt += `
═══════════════════════════════════════════════════════════════
`

  return prompt
}

/**
 * Format Instinct Mode response structure
 */
export function formatInstinctResponse(analysis: Partial<InstinctAnalysis>): string {
  let response = ''

  if (analysis.lenses && analysis.lenses.length > 0) {
    response += '◈ INSTINCT ANALYSIS\n'
    response += '━━━━━━━━━━━━━━━━━━━━\n\n'

    analysis.lenses.forEach(({ lens, insight }) => {
      response += `${lens.symbol} ${lens.name}\n`
      response += `${insight}\n\n`
    })
  }

  if (analysis.synthesis) {
    response += '⚡ SYNTHESIS\n'
    response += `${analysis.synthesis}\n\n`
  }

  if (analysis.layerMapping && analysis.layerMapping.length > 0) {
    response += '✡ LAYERS RESONANCE: ' + analysis.layerMapping.join(' → ') + '\n'
  }

  return response
}

// ============================================================
// ENHANCED FUNCTIONS - Layers Integration
// ============================================================

/**
 * Auto-detect which lenses should activate based on query content
 * ENHANCED: Activates ALL 7 lenses for comprehensive Hermetic analysis
 *
 * The 7 Hermetic Lenses provide multi-dimensional understanding:
 * - Exoteric: Surface/literal meaning
 * - Mesoteric: Symbolic/allegorical meaning
 * - Esoteric: Hidden/mystical meaning
 * - Hermetic: Alchemical correspondences
 * - Orphic: Harmonic/musical patterns
 * - Prophetic: Future trajectories
 * - Initiatic: Transformative processes
 */
export function autoDetectLenses(query: string): string[] {
  const queryLower = query.toLowerCase()

  // Calculate query complexity to determine depth of analysis
  const wordCount = query.split(/\s+/).length
  const hasMultipleParts = query.includes(' and ') || query.includes(' or ') || query.includes(',')
  const hasQuestion = /\?|how|why|what|explain|describe|analyze/i.test(queryLower)

  // Detect domain-specific queries
  const isTechnicalQuery = /quantum|encryption|algorithm|protocol|system|architecture|mechanism|process/i.test(queryLower)
  const isPhilosophicalQuery = /philosophy|meaning|consciousness|existence|nature of|fundamental|truth|reality/i.test(queryLower)
  const isAnalyticalQuery = /explain|analyze|compare|contrast|evaluate|assess|break.*down/i.test(queryLower)

  // For simple queries (< 5 words, no complexity indicators), use 5 lenses
  // For moderate queries, use 6 lenses
  // For complex queries, use ALL 7 lenses
  const isComplex = wordCount > 10 || hasMultipleParts || isTechnicalQuery || isPhilosophicalQuery || isAnalyticalQuery
  const isModerate = wordCount > 5 || hasQuestion

  // Score each lens based on keyword matches (for ordering)
  const lensScores: Array<{ id: string; score: number }> = []
  for (const lens of SEVEN_LENSES) {
    let score = 1 // Base score - all lenses start active
    for (const keyword of lens.keywords) {
      if (queryLower.includes(keyword)) {
        score += 2 // Boost for keyword match
      }
    }
    lensScores.push({ id: lens.id, score })
  }

  // Sort by relevance score (highest first)
  lensScores.sort((a, b) => b.score - a.score)

  // Determine how many lenses to activate
  let lensCount: number
  if (isComplex) {
    lensCount = 7 // All 7 lenses for complex queries
  } else if (isModerate) {
    lensCount = 6 // 6 lenses for moderate queries
  } else {
    lensCount = 5 // 5 lenses minimum for simple queries
  }

  // Return top N lenses based on relevance
  return lensScores.slice(0, lensCount).map(l => l.id)
}

/**
 * Get Layers weights needed for active lenses
 * Returns map of Layer → suggested weight boost
 */
export function getLensLayersWeights(activeLenses: string[]): Record<number, number> {
  const weights: Record<number, number> = {}

  for (const lensId of activeLenses) {
    const lens = SEVEN_LENSES.find(l => l.id === lensId)
    if (lens) {
      // Boost the mapped Layer weight by 0.2
      const current = weights[lens.layerNode] ?? 0
      weights[lens.layerNode] = Math.min(1, current + 0.2)
    }
  }

  return weights
}

/**
 * Calculate lens activation from Layers weights (reverse mapping)
 */
export function calculateLensActivations(
  layersWeights: Record<number, number>
): Array<{ lens: InstinctLens; activation: number }> {
  return SEVEN_LENSES.map(lens => {
    const weight = layersWeights[lens.layerNode] ?? 0.5
    return {
      lens,
      activation: weight
    }
  }).sort((a, b) => b.activation - a.activation)
}

/**
 * Generate lens-specific analysis prompt for a single lens
 */
export function generateLensPrompt(lens: InstinctLens, query: string): string {
  return `
${lens.symbol} ${lens.name.toUpperCase()} LENS ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${lens.description}

QUERY: "${query}"

INSTRUCTION: ${lens.prompt}

Provide a concise insight (2-4 sentences) from this perspective.
`
}

/**
 * Create holistic Instinct analysis combining all lenses
 */
export function createHolisticAnalysis(
  query: string,
  lensInsights: Array<{ lensId: string; insight: string }>,
  layerActivations?: Array<{ name: string; activation: number }>
): InstinctAnalysis {
  const lenses = lensInsights
    .map(li => {
      const lens = SEVEN_LENSES.find(l => l.id === li.lensId)
      if (!lens) return null
      return { lens, insight: li.insight }
    })
    .filter((l): l is { lens: InstinctLens; insight: string } => l !== null)

  // Synthesize insights
  const synthesis = lenses.length > 0
    ? `Multi-perspective analysis through ${lenses.length} Hermetic lenses reveals convergent insights.`
    : 'No lens insights available.'

  // Map to Layers names
  const layerMapping = layerActivations
    ?.filter(s => s.activation > 0.3)
    .map(s => s.name) ?? []

  return {
    query,
    lenses,
    synthesis,
    layerMapping,
    timestamp: Date.now()
  }
}

/**
 * Get recommended depth based on query complexity
 */
export function getRecommendedDepth(complexity: number): 'standard' | 'deep' | 'profound' {
  if (complexity >= 0.7) return 'profound'
  if (complexity >= 0.4) return 'deep'
  return 'standard'
}

/**
 * Create Instinct config with auto-detection
 */
export function createAutoInstinctConfig(
  query: string,
  complexity: number,
  layersWeights?: Record<number, number>
): InstinctConfig {
  // Auto-detect lenses from query
  let activeLenses = autoDetectLenses(query)

  // If Layers weights provided, boost lenses with high Layers activation
  if (layersWeights) {
    const layersLenses = calculateLensActivations(layersWeights)
      .filter(l => l.activation > 0.6)
      .map(l => l.lens.id)

    // Merge with detected lenses (unique)
    activeLenses = [...new Set([...activeLenses, ...layersLenses])]
  }

  return {
    enabled: activeLenses.length > 0,
    activeLenses,
    depth: getRecommendedDepth(complexity),
    includeLayers: true,
    includeYechidah: complexity >= 0.5
  }
}
