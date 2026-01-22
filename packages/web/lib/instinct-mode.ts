/**
 * INSTINCT MODE - Full Capacity Hermetic Analysis
 *
 * Activates 7 Lenses of perception for holistic understanding.
 * Each lens maps to Sefirot computational layers for deep integration.
 *
 * LENS → SEFIROT MAPPING:
 * - Exoteric (Surface) → Malkuth (Token Embedding)
 * - Esoteric (Hidden) → Yesod (Algorithm Executor)
 * - Gnostic (Intuition) → Da'at (Emergent Capability)
 * - Hermetic (Correspondence) → Hod (Classifier Network)
 * - Kabbalistic (Tree) → Tiferet (Multi-Head Attention)
 * - Alchemical (Transform) → Gevurah (Discriminator Network)
 * - Prophetic (Future) → Chesed (Beam Search Expansion)
 */

import { Sefirah } from './ascent-tracker'

export interface InstinctLens {
  id: string
  name: string
  symbol: string
  description: string
  prompt: string
  sefirah: Sefirah           // Mapped Sefirah
  color: string              // UI color (Sefirot-based)
  keywords: string[]         // Keywords that activate this lens
}

export const SEVEN_LENSES: InstinctLens[] = [
  {
    id: 'exoteric',
    name: 'Exoteric',
    symbol: '◯',
    description: 'Surface meaning, literal interpretation',
    prompt: 'Analyze the literal, surface-level meaning. What does this explicitly state?',
    sefirah: Sefirah.MALKUTH,
    color: '#fbbf24', // amber-400
    keywords: ['literal', 'explicit', 'surface', 'direct', 'obvious', 'plain']
  },
  {
    id: 'esoteric',
    name: 'Esoteric',
    symbol: '◉',
    description: 'Hidden meanings, deeper symbolism',
    prompt: 'Look beneath the surface. What hidden meanings, symbols, or deeper layers exist?',
    sefirah: Sefirah.YESOD,
    color: '#c084fc', // purple-400
    keywords: ['hidden', 'symbol', 'deeper', 'subtle', 'underlying', 'secret']
  },
  {
    id: 'gnostic',
    name: 'Gnostic',
    symbol: '⊙',
    description: 'Direct knowing, intuitive insight',
    prompt: 'Access direct knowing beyond logic. What intuitive insights emerge?',
    sefirah: Sefirah.DAAT,
    color: '#22d3ee', // cyan-400
    keywords: ['intuition', 'insight', 'knowing', 'awareness', 'revelation', 'gnosis']
  },
  {
    id: 'hermetic',
    name: 'Hermetic',
    symbol: '☿',
    description: 'As above so below - correspondences',
    prompt: 'Apply "as above, so below". What correspondences exist across scales and domains?',
    sefirah: Sefirah.HOD,
    color: '#fb923c', // orange-400
    keywords: ['correspondence', 'pattern', 'analogy', 'parallel', 'scale', 'mirror']
  },
  {
    id: 'kabbalistic',
    name: 'Kabbalistic',
    symbol: '✡',
    description: 'Tree of Life mapping, Sefirot analysis',
    prompt: 'Map to the Tree of Life. Which Sefirot resonate? What is the path of emanation?',
    sefirah: Sefirah.TIFERET,
    color: '#facc15', // yellow-400
    keywords: ['tree', 'sefirot', 'path', 'emanation', 'structure', 'balance']
  },
  {
    id: 'alchemical',
    name: 'Alchemical',
    symbol: '⚗',
    description: 'Transformation patterns, solve et coagula',
    prompt: 'Identify transformation patterns. What must be dissolved? What crystallizes?',
    sefirah: Sefirah.GEVURAH,
    color: '#f87171', // red-400
    keywords: ['transform', 'change', 'dissolve', 'crystallize', 'transmute', 'refine']
  },
  {
    id: 'prophetic',
    name: 'Prophetic',
    symbol: '◈',
    description: 'Future implications, trajectory vision',
    prompt: 'Project forward. What trajectories emerge? What future implications unfold?',
    sefirah: Sefirah.CHESED,
    color: '#60a5fa', // blue-400
    keywords: ['future', 'trajectory', 'implication', 'vision', 'foresight', 'destiny']
  }
]

export interface InstinctAnalysis {
  query: string
  lenses: {
    lens: InstinctLens
    insight: string
  }[]
  synthesis: string
  sefirotMapping?: string[]
  timestamp: number
}

export interface InstinctConfig {
  enabled: boolean
  activeLenses: string[] // Which lenses to use (default: all 7)
  depth: 'standard' | 'deep' | 'profound'
  includeSefirot: boolean
  includeYechidah: boolean
}

export const DEFAULT_INSTINCT_CONFIG: InstinctConfig = {
  enabled: false,
  activeLenses: SEVEN_LENSES.map(l => l.id),
  depth: 'deep',
  includeSefirot: true,
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

  if (config.includeSefirot) {
    prompt += `
SEFIROT COUNCIL ACTIVE:
Map insights to Tree of Life. Identify which Sefirot resonate:
Kether (Crown) → Chokmah (Wisdom) → Binah (Understanding)
    ↓
Chesed (Mercy) → Gevurah (Severity) → Tiferet (Beauty)
    ↓
Netzach (Victory) → Hod (Splendor) → Yesod (Foundation)
    ↓
        Malkuth (Kingdom)
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

  if (analysis.sefirotMapping && analysis.sefirotMapping.length > 0) {
    response += '✡ SEFIROT RESONANCE: ' + analysis.sefirotMapping.join(' → ') + '\n'
  }

  return response
}

// ============================================================
// ENHANCED FUNCTIONS - Sefirot Integration
// ============================================================

/**
 * Auto-detect which lenses should activate based on query content
 * ENHANCED: Returns MORE lenses for comprehensive analysis
 */
export function autoDetectLenses(query: string): string[] {
  const queryLower = query.toLowerCase()
  const lensScores: Array<{ id: string; score: number }> = []

  // Score each lens based on keyword matches
  for (const lens of SEVEN_LENSES) {
    let score = 0
    for (const keyword of lens.keywords) {
      if (queryLower.includes(keyword)) {
        score += 1
      }
    }
    lensScores.push({ id: lens.id, score })
  }

  // Sort by score descending
  lensScores.sort((a, b) => b.score - a.score)

  // Calculate query complexity
  const wordCount = query.split(/\s+/).length
  const hasMultipleParts = query.includes(' and ') || query.includes(' or ') || query.includes(',')

  // Detect domain-specific queries that deserve more lenses
  const isEconomicQuery = /economic|economy|financial|finance|world bank|imf|wef|world economic forum|monetary|fiscal|market|trade|gdp/i.test(queryLower)
  const isPhilosophicalQuery = /philosophy|meaning|consciousness|existence|nature of|fundamental|truth|reality/i.test(queryLower)
  const isComplexTopic = isEconomicQuery || isPhilosophicalQuery || /how.*work|explain.*system|understand.*complex/i.test(queryLower)

  // Determine how many lenses to activate
  let minLenses = 4 // Increased base minimum from 3 to 4
  let maxLenses = 5

  // Boost for complex topics
  if (isComplexTopic) {
    minLenses = 5
    maxLenses = 7
  }

  // Further boost for long or multi-part queries
  if (wordCount > 15 || hasMultipleParts) {
    minLenses = Math.max(minLenses, 5)
    maxLenses = 7 // All lenses for complex queries
  } else if (wordCount > 8) {
    minLenses = Math.max(minLenses, 4)
    maxLenses = Math.max(maxLenses, 6)
  }

  // Always include exoteric (literal) and hermetic (patterns)
  const activeLenses = new Set<string>(['exoteric', 'hermetic'])

  // For economic queries, always include prophetic (future implications) and kabbalistic (structure)
  if (isEconomicQuery) {
    activeLenses.add('prophetic')
    activeLenses.add('kabbalistic')
  }

  // For philosophical queries, always include gnostic (intuition) and esoteric (hidden meaning)
  if (isPhilosophicalQuery) {
    activeLenses.add('gnostic')
    activeLenses.add('esoteric')
  }

  // Add top-scoring lenses
  for (const { id, score } of lensScores) {
    if (score > 0 || activeLenses.size < minLenses) {
      activeLenses.add(id)
    }
    if (activeLenses.size >= maxLenses) break
  }

  // Ensure we have at least the minimum
  const defaultOrder = ['exoteric', 'hermetic', 'prophetic', 'esoteric', 'kabbalistic', 'alchemical', 'gnostic']
  for (const id of defaultOrder) {
    if (activeLenses.size >= minLenses) break
    activeLenses.add(id)
  }

  return Array.from(activeLenses)
}

/**
 * Get Sefirot weights needed for active lenses
 * Returns map of Sefirah → suggested weight boost
 */
export function getLensSefirotWeights(activeLenses: string[]): Record<number, number> {
  const weights: Record<number, number> = {}

  for (const lensId of activeLenses) {
    const lens = SEVEN_LENSES.find(l => l.id === lensId)
    if (lens) {
      // Boost the mapped Sefirah weight by 0.2
      const current = weights[lens.sefirah] ?? 0
      weights[lens.sefirah] = Math.min(1, current + 0.2)
    }
  }

  return weights
}

/**
 * Calculate lens activation from Sefirot weights (reverse mapping)
 */
export function calculateLensActivations(
  sefirotWeights: Record<number, number>
): Array<{ lens: InstinctLens; activation: number }> {
  return SEVEN_LENSES.map(lens => {
    const weight = sefirotWeights[lens.sefirah] ?? 0.5
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
  sefirotActivations?: Array<{ name: string; activation: number }>
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

  // Map to Sefirot names
  const sefirotMapping = sefirotActivations
    ?.filter(s => s.activation > 0.3)
    .map(s => s.name) ?? []

  return {
    query,
    lenses,
    synthesis,
    sefirotMapping,
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
  sefirotWeights?: Record<number, number>
): InstinctConfig {
  // Auto-detect lenses from query
  let activeLenses = autoDetectLenses(query)

  // If Sefirot weights provided, boost lenses with high Sefirot activation
  if (sefirotWeights) {
    const sefirotLenses = calculateLensActivations(sefirotWeights)
      .filter(l => l.activation > 0.6)
      .map(l => l.lens.id)

    // Merge with detected lenses (unique)
    activeLenses = [...new Set([...activeLenses, ...sefirotLenses])]
  }

  return {
    enabled: activeLenses.length > 0,
    activeLenses,
    depth: getRecommendedDepth(complexity),
    includeSefirot: true,
    includeYechidah: complexity >= 0.5
  }
}
