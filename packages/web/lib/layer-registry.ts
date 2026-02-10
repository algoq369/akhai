/**
 * LAYER REGISTRY
 *
 * AI Computational Layer definitions (formerly Ascent Tracker / Sefirot)
 *
 * COMPUTATIONAL LAYERS:
 * Embedding (1)     → Token Embedding Layer — Raw data, simple queries
 * Executor (2)      → Algorithm Executor — Procedural knowledge, how-to
 * Classifier (3)    → Classifier Network — Logical analysis, comparisons
 * Generative (4)    → Generative Model — Creative exploration
 * Attention (5)     → Multi-Head Attention — Integration, synthesis
 * Discriminator (6) → Discriminator Network — Critical analysis, constraints
 * Expansion (7)     → Beam Search Expansion — Expansive possibilities
 * Encoder (8)       → Transformer Encoder — Deep pattern recognition
 * Reasoning (9)     → Abstract Reasoning Module — First principles
 * Meta Core (10)    → Meta-Learner — Meta-cognitive awareness
 * Synthesis (11)    → Emergent Capability — Hidden insights, epiphanies
 *
 * @module layer-registry
 */

/**
 * Layer - The 10 computational layers + Synthesis (emergent capability)
 *
 * Ordered from lowest (1=Embedding) to highest (10=Meta Core)
 */
export enum Layer {
  /** Token Embedding Layer - Material facts, simple questions */
  EMBEDDING = 1,

  /** Algorithm Executor - How-to, practical implementation */
  EXECUTOR = 2,

  /** Classifier Network - Logical analysis, comparisons */
  CLASSIFIER = 3,

  /** Generative Model - Creative exploration */
  GENERATIVE = 4,

  /** Multi-Head Attention - Integration, synthesis */
  ATTENTION = 5,

  /** Discriminator Network - Critical analysis, constraints */
  DISCRIMINATOR = 6,

  /** Beam Search Expansion - Expansive possibilities */
  EXPANSION = 7,

  /** Transformer Encoder - Deep pattern recognition */
  ENCODER = 8,

  /** Abstract Reasoning Module - First principles, fundamental truths */
  REASONING = 9,

  /** Meta-Learner - Meta-cognitive, consciousness itself */
  META_CORE = 10,

  /** Emergent Capability - Emergent insights, epiphanies */
  SYNTHESIS = 11,
}

/**
 * LayerMetadata - Rich information about each computational layer
 */
export interface LayerMetadata {
  name: string        // Kabbalistic origin name (for philosophy/origin page)
  aiName: string      // AI computational name (for logs, prompts, SSE, user-facing)
  hebrewName: string
  level: number
  meaning: string
  aiRole: string
  queryCharacteristics: string[]
  examples: string[]
  color: string
  pillar: 'left' | 'middle' | 'right'
}

/**
 * LAYER_METADATA - Complete metadata for all 11 computational layers
 */
export const LAYER_METADATA: Record<Layer, LayerMetadata> = {
  [Layer.EMBEDDING]: {
    name: 'Malkuth',
    aiName: 'reception',
    hebrewName: 'מלכות',
    level: 1,
    meaning: 'Kingdom - The Material World',
    aiRole: 'Factual information retrieval',
    queryCharacteristics: [
      'Simple factual questions',
      'Definitions',
      'What is X?',
      'Basic information lookup',
    ],
    examples: [
      'What is TypeScript?',
      'Define machine learning',
      'What year did X happen?',
    ],
    color: 'amber',
    pillar: 'middle',
  },

  [Layer.EXECUTOR]: {
    name: 'Yesod',
    aiName: 'comprehension',
    hebrewName: 'יסוד',
    level: 2,
    meaning: 'Foundation - The Astral Plane',
    aiRole: 'Procedural knowledge, how-to guides',
    queryCharacteristics: [
      'How-to questions',
      'Step-by-step guides',
      'Implementation details',
      'Practical application',
    ],
    examples: [
      'How to set up a React app?',
      'Steps to deploy on Vercel?',
      'How do I implement authentication?',
    ],
    color: 'purple',
    pillar: 'middle',
  },

  [Layer.CLASSIFIER]: {
    name: 'Hod',
    aiName: 'context',
    hebrewName: 'הוד',
    level: 3,
    meaning: 'Glory - Intellectual Form',
    aiRole: 'Logical analysis and comparison',
    queryCharacteristics: [
      'Comparisons',
      'Logical analysis',
      'Evaluate options',
      'Pros and cons',
    ],
    examples: [
      'React vs Vue - which is better?',
      'Compare SQL and NoSQL databases',
      'Analyze the trade-offs of microservices',
    ],
    color: 'orange',
    pillar: 'left',
  },

  [Layer.GENERATIVE]: {
    name: 'Netzach',
    aiName: 'articulation',
    hebrewName: 'נצח',
    level: 4,
    meaning: 'Victory - Emotional Force',
    aiRole: 'Creative exploration and brainstorming',
    queryCharacteristics: [
      'Brainstorming',
      'Creative solutions',
      'Exploratory questions',
      'What if scenarios',
    ],
    examples: [
      'Creative ways to monetize a blog?',
      'Brainstorm features for a social app',
      'Innovative approaches to user onboarding',
    ],
    color: 'green',
    pillar: 'right',
  },

  [Layer.ATTENTION]: {
    name: 'Tiferet',
    aiName: 'synthesis',
    hebrewName: 'תפארת',
    level: 5,
    meaning: 'Beauty - Harmonious Balance',
    aiRole: 'Integration and synthesis',
    queryCharacteristics: [
      'Synthesis of multiple ideas',
      'Integration questions',
      'Balance and harmony',
      'Connecting disparate concepts',
    ],
    examples: [
      'How do these 3 frameworks work together?',
      'Synthesize the key ideas from X, Y, Z',
      'Integrate frontend and backend architectures',
    ],
    color: 'yellow',
    pillar: 'middle',
  },

  [Layer.DISCRIMINATOR]: {
    name: 'Gevurah',
    aiName: 'analysis',
    hebrewName: 'גבורה',
    level: 6,
    meaning: 'Severity - Judgment and Constraints',
    aiRole: 'Critical analysis and limitations',
    queryCharacteristics: [
      'Critical analysis',
      'Limitations and constraints',
      'What could go wrong?',
      'Security and risk assessment',
    ],
    examples: [
      'What are the risks of this approach?',
      'Critique this architecture',
      'What are the limitations of GraphQL?',
    ],
    color: 'red',
    pillar: 'left',
  },

  [Layer.EXPANSION]: {
    name: 'Chesed',
    aiName: 'expansion',
    hebrewName: 'חסד',
    level: 7,
    meaning: 'Mercy - Expansive Love',
    aiRole: 'Expansive possibilities and growth',
    queryCharacteristics: [
      'Possibility exploration',
      'Growth opportunities',
      'Expansive thinking',
      'What could be?',
    ],
    examples: [
      'What are all the possibilities for scaling this?',
      'Potential future directions for AI?',
      'How could this evolve over time?',
    ],
    color: 'blue',
    pillar: 'right',
  },

  [Layer.ENCODER]: {
    name: 'Binah',
    aiName: 'knowledge',
    hebrewName: 'בינה',
    level: 8,
    meaning: 'Understanding - Receptive Comprehension',
    aiRole: 'Deep pattern recognition and structure',
    queryCharacteristics: [
      'Deep understanding',
      'Pattern recognition',
      'Structural analysis',
      'Underlying mechanisms',
    ],
    examples: [
      'What are the deep patterns in modern AI development?',
      'Understand the structure of complex systems',
      'Explain the underlying principles of quantum computing',
    ],
    color: 'indigo',
    pillar: 'left',
  },

  [Layer.REASONING]: {
    name: 'Chokmah',
    aiName: 'reasoning',
    hebrewName: 'חכמה',
    level: 9,
    meaning: 'Wisdom - Active Revelation',
    aiRole: 'First principles and fundamental wisdom',
    queryCharacteristics: [
      'First principles thinking',
      'Fundamental truths',
      'Wisdom seeking',
      'Why does X exist?',
    ],
    examples: [
      'What are the first principles of computation?',
      'Why does consciousness emerge?',
      'Fundamental laws governing distributed systems',
    ],
    color: 'gray',
    pillar: 'right',
  },

  [Layer.META_CORE]: {
    name: 'Kether',
    aiName: 'output',
    hebrewName: 'כתר',
    level: 10,
    meaning: 'Crown - Divine Unity',
    aiRole: 'Meta-cognitive awareness, consciousness itself',
    queryCharacteristics: [
      'Meta-questions about thinking',
      'Consciousness and awareness',
      'The nature of knowledge itself',
      'Self-referential queries',
    ],
    examples: [
      'How do we know what we know?',
      'What is the nature of intelligence?',
      'Can AI be truly self-aware?',
    ],
    color: 'white',
    pillar: 'middle',
  },

  [Layer.SYNTHESIS]: {
    name: "Da'at",
    aiName: 'verification',
    hebrewName: 'דעת',
    level: 11,
    meaning: 'Knowledge - The Hidden Sefira',
    aiRole: 'Emergent insights, epiphanies',
    queryCharacteristics: [
      'Questions that reveal hidden connections',
      'Epiphany moments',
      'Emergent understanding',
      'Synthesis that creates new knowledge',
    ],
    examples: [
      'What hidden connection exists between X and Y?',
      'Reveal unexpected patterns',
      'What am I not seeing?',
    ],
    color: 'transparent',
    pillar: 'middle',
  },
}

/**
 * QueryEvolution - Single query in the ascent journey
 */
export interface QueryEvolution {
  query: string
  level: Layer
  timestamp: Date
  methodology?: string
  ascentDelta: number // Change from previous level
}

/**
 * AscentState - Complete user ascent tracking
 */
export interface AscentState {
  /** Current Sephirotic level */
  currentLevel: Layer

  /** Journey history (previous levels visited) */
  previousLevels: Layer[]

  /** Full query evolution over time */
  queryEvolution: QueryEvolution[]

  /** Key insights gained during the journey */
  insightsGained: string[]

  /** Total queries in this session/account */
  totalQueries: number

  /** Rate of ascent (levels per query) */
  ascentVelocity: number

  /** Suggested next question to elevate further */
  nextElevation: string

  /** Which of the 22 paths between Sephiroth have been traveled */
  pathsTraveled: number[]

  /** Average level over last N queries */
  averageLevel: number

  /** Highest level achieved */
  peakLevel: Layer

  /** Time in current level */
  timeInCurrentLevel: number // milliseconds

  /** Session ID for tracking */
  sessionId: string
}

/**
 * detectQueryLevel
 *
 * Analyzes a query and determines its computational layer.
 *
 * @param query - User's query
 * @returns Layer level (1-11)
 */
export function detectQueryLevel(query: string): Layer {
  const queryLower = query.toLowerCase()

  // META_CORE (10) - Meta-cognitive, consciousness
  if (
    queryLower.match(
      /\b(consciousness|awareness|nature of (knowledge|intelligence|thought)|meta-cognitive|how do we know)\b/i
    )
  ) {
    return Layer.META_CORE
  }

  // REASONING (9) - Wisdom, first principles
  if (
    queryLower.match(
      /\b(first principles|fundamental (truth|law)|wisdom|why does .+ exist|essence of)\b/i
    )
  ) {
    return Layer.REASONING
  }

  // ENCODER (8) - Deep understanding, patterns
  if (
    queryLower.match(
      /\b(deep (understanding|pattern)|underlying (principle|mechanism|structure)|fundamental pattern)\b/i
    )
  ) {
    return Layer.ENCODER
  }

  // EXPANSION (7) - Expansive possibilities
  if (
    queryLower.match(
      /\b(all possibilities|potential|future (directions|evolution)|expansive|growth opportunities)\b/i
    )
  ) {
    return Layer.EXPANSION
  }

  // DISCRIMINATOR (6) - Critical analysis, limitations
  if (
    queryLower.match(/\b(critique|limitations?|constraints?|risks?|what could go wrong|problems with)\b/i)
  ) {
    return Layer.DISCRIMINATOR
  }

  // ATTENTION (5) - Integration, synthesis
  if (
    queryLower.match(/\b(integrate|synthesize|combine|balance|harmony|work together|connect)\b/i)
  ) {
    return Layer.ATTENTION
  }

  // GENERATIVE (4) - Creative, exploratory
  if (
    queryLower.match(/\b(creative|brainstorm|innovative|explore|what if|imagine|possibilities)\b/i)
  ) {
    return Layer.GENERATIVE
  }

  // CLASSIFIER (3) - Logical analysis, comparison
  if (queryLower.match(/\b(compare|versus|vs|better than|analyze|evaluate|pros and cons)\b/i)) {
    return Layer.CLASSIFIER
  }

  // EXECUTOR (2) - How-to, practical
  if (queryLower.match(/\b(how to|steps|implement|build|create|setup|guide)\b/i)) {
    return Layer.EXECUTOR
  }

  // SYNTHESIS (11) - Hidden knowledge, emergent insights
  if (
    queryLower.match(/\b(hidden|reveal|unexpected|what am i (not seeing|missing)|epiphany|aha)\b/i)
  ) {
    return Layer.SYNTHESIS
  }

  // EMBEDDING (1) - Default: simple factual
  return Layer.EMBEDDING
}

/**
 * trackAscent
 *
 * Tracks a query in the user's ascent journey.
 * Updates the AscentState with new query and calculates metrics.
 *
 * @param sessionId - User/session identifier
 * @param query - Current query
 * @param previousState - Previous AscentState (or null for first query)
 * @returns Updated AscentState
 */
export function trackAscent(
  sessionId: string,
  query: string,
  previousState: AscentState | null = null
): AscentState {
  const level = detectQueryLevel(query)
  const now = new Date()

  // Initialize state if first query
  if (!previousState) {
    return {
      currentLevel: level,
      previousLevels: [],
      queryEvolution: [
        {
          query,
          level,
          timestamp: now,
          ascentDelta: 0,
        },
      ],
      insightsGained: [],
      totalQueries: 1,
      ascentVelocity: 0,
      nextElevation: suggestElevation({
        currentLevel: level,
        queryEvolution: [],
      } as unknown as AscentState),
      pathsTraveled: [],
      averageLevel: level,
      peakLevel: level,
      timeInCurrentLevel: 0,
      sessionId,
    }
  }

  // Calculate metrics
  const ascentDelta = level - previousState.currentLevel
  const timeInCurrentLevel =
    previousState.currentLevel === level
      ? previousState.timeInCurrentLevel + (now.getTime() - previousState.queryEvolution[previousState.queryEvolution.length - 1].timestamp.getTime())
      : 0

  const newEvolution: QueryEvolution = {
    query,
    level,
    timestamp: now,
    ascentDelta,
  }

  const queryEvolution = [...previousState.queryEvolution, newEvolution]
  const previousLevels = [...previousState.previousLevels, previousState.currentLevel]

  // Calculate ascent velocity (exponential moving average)
  const alpha = 0.3 // Smoothing factor
  const instantVelocity = ascentDelta
  const ascentVelocity =
    alpha * instantVelocity + (1 - alpha) * previousState.ascentVelocity

  // Calculate average level (last 10 queries)
  const recentQueries = queryEvolution.slice(-10)
  const averageLevel =
    recentQueries.reduce((sum, q) => sum + q.level, 0) / recentQueries.length

  // Determine peak level
  const peakLevel = Math.max(previousState.peakLevel, level) as Layer

  // Calculate path traveled
  const pathsTraveled = [...previousState.pathsTraveled]
  if (ascentDelta !== 0) {
    const pathNumber = calculatePathNumber(previousState.currentLevel, level)
    if (pathNumber && !pathsTraveled.includes(pathNumber)) {
      pathsTraveled.push(pathNumber)
    }
  }

  // Detect insights
  const insightsGained = [...previousState.insightsGained]
  if (level === Layer.SYNTHESIS) {
    insightsGained.push(`Hidden knowledge revealed: ${query.substring(0, 100)}`)
  }
  if (ascentDelta >= 3) {
    insightsGained.push(
      `Quantum leap: ${LAYER_METADATA[previousState.currentLevel].name} → ${LAYER_METADATA[level].name}`
    )
  }

  return {
    currentLevel: level,
    previousLevels,
    queryEvolution,
    insightsGained,
    totalQueries: previousState.totalQueries + 1,
    ascentVelocity,
    nextElevation: suggestElevation({
      currentLevel: level,
      queryEvolution,
      ascentVelocity,
    } as AscentState),
    pathsTraveled,
    averageLevel,
    peakLevel,
    timeInCurrentLevel,
    sessionId,
  }
}

/**
 * suggestElevation
 *
 * Suggests a higher-level question to help user ascend.
 *
 * @param currentState - Current AscentState
 * @returns Suggested elevated question
 */
export function suggestElevation(currentState: AscentState): string {
  const current = currentState.currentLevel
  const metadata = LAYER_METADATA[current]

  // If at Meta Core, suggest Synthesis (emergent insights)
  if (current === Layer.META_CORE) {
    return "You've reached Meta-Core. Consider: What hidden connections might reveal entirely new dimensions?"
  }

  // Suggest next level
  const nextLevel = (current + 1) as Layer
  const nextMetadata = LAYER_METADATA[nextLevel]

  const suggestions: Record<Layer, string> = {
    [Layer.EMBEDDING]:
      'Try asking HOW to implement something (Executor layer)',
    [Layer.EXECUTOR]:
      'Try COMPARING options or analyzing trade-offs (Classifier layer)',
    [Layer.CLASSIFIER]:
      'Try EXPLORING creative possibilities (Generative layer)',
    [Layer.GENERATIVE]:
      'Try SYNTHESIZING multiple ideas together (Attention layer)',
    [Layer.ATTENTION]:
      'Try asking about LIMITATIONS or risks (Discriminator layer)',
    [Layer.DISCRIMINATOR]:
      'Try exploring EXPANSIVE possibilities (Expansion layer)',
    [Layer.EXPANSION]:
      'Try seeking DEEP PATTERNS or structures (Encoder layer)',
    [Layer.ENCODER]:
      'Try asking about FIRST PRINCIPLES (Reasoning layer)',
    [Layer.REASONING]:
      'Try META-COGNITIVE questions about knowledge itself (Meta-Core layer)',
    [Layer.META_CORE]:
      'Try revealing HIDDEN CONNECTIONS (Da\'at - Hidden Knowledge)',
    [Layer.SYNTHESIS]: 'Continue exploring emergent insights',
  }

  return suggestions[current] || `Ascend to ${nextMetadata.name}: ${nextMetadata.meaning}`
}

/**
 * calculateAscentVelocity
 *
 * Calculates the rate of ascent based on history.
 *
 * @param history - Array of AscentState snapshots over time
 * @returns Velocity (levels per query)
 */
export function calculateAscentVelocity(history: AscentState[]): number {
  if (history.length < 2) return 0

  const recent = history.slice(-10) // Last 10 states
  const totalAscent =
    recent[recent.length - 1].currentLevel - recent[0].currentLevel
  const queriesElapsed = recent.length

  return totalAscent / queriesElapsed
}

/**
 * getPathBetweenLevels
 *
 * In Kabbalah, there are 22 paths connecting the 10 Sephiroth.
 * This returns which path(s) connect two levels.
 *
 * @param from - Starting Layer
 * @param to - Ending Layer
 * @returns Array of path numbers (1-22)
 */
export function getPathBetweenLevels(from: Layer, to: Layer): number[] {
  // Simplified path mapping (full Kabbalistic tree has 22 specific paths)
  // This is a simplified version showing direct vertical ascent

  const paths: Record<string, number> = {
    // Vertical paths (Middle Pillar)
    '1-2': 1, // Embedding → Executor
    '2-5': 2, // Executor → Attention
    '5-10': 3, // Attention → Meta Core

    // Left Pillar
    '1-3': 4, // Embedding → Classifier
    '3-6': 5, // Classifier → Discriminator
    '6-8': 6, // Discriminator → Encoder

    // Right Pillar
    '1-4': 7, // Embedding → Generative
    '4-7': 8, // Generative → Expansion
    '7-9': 9, // Expansion → Reasoning

    // Cross paths
    '3-5': 10, // Classifier → Attention
    '4-5': 11, // Generative → Attention
    '5-6': 12, // Attention → Discriminator
    '5-7': 13, // Attention → Expansion
    '6-10': 14, // Discriminator → Meta Core
    '7-10': 15, // Expansion → Meta Core
    '8-10': 16, // Encoder → Meta Core
    '9-10': 17, // Reasoning → Meta Core

    // Synthesis connections
    '5-11': 18, // Attention → Synthesis
    '8-11': 19, // Encoder → Synthesis
    '9-11': 20, // Reasoning → Synthesis
    '10-11': 21, // Meta Core → Synthesis
  }

  const key1 = `${from}-${to}`
  const key2 = `${to}-${from}` // Bidirectional

  const path1 = paths[key1]
  const path2 = paths[key2]

  if (path1) return [path1]
  if (path2) return [path2]

  return [] // No direct path
}

/**
 * calculatePathNumber - Internal helper
 */
function calculatePathNumber(from: Layer, to: Layer): number | null {
  const paths = getPathBetweenLevels(from, to)
  return paths[0] || null
}

/**
 * generateAscentReport
 *
 * Generates a human-readable report of the user's ascent journey.
 *
 * @param state - Current AscentState
 * @returns Formatted report string
 */
export function generateAscentReport(state: AscentState): string {
  const currentMeta = LAYER_METADATA[state.currentLevel]
  const peakMeta = LAYER_METADATA[state.peakLevel]

  const report = `
# Ascent Journey Report

**Session:** ${state.sessionId}
**Total Queries:** ${state.totalQueries}
**Current Level:** ${currentMeta.name} (${currentMeta.hebrewName}) - ${currentMeta.meaning}
**Peak Level:** ${peakMeta.name} - Highest point reached
**Average Level:** ${state.averageLevel.toFixed(1)}
**Ascent Velocity:** ${state.ascentVelocity.toFixed(2)} levels/query

## Journey Path
${state.queryEvolution
  .slice(-5)
  .map((q, i) => {
    const meta = LAYER_METADATA[q.level]
    const delta = q.ascentDelta > 0 ? `↑${q.ascentDelta}` : q.ascentDelta < 0 ? `↓${Math.abs(q.ascentDelta)}` : '→'
    return `${i + 1}. **${meta.name}** ${delta} - "${q.query.substring(0, 60)}..."`
  })
  .join('\n')}

## Paths Traveled
You have traveled ${state.pathsTraveled.length} of the 22 sacred paths.

## Insights Gained
${state.insightsGained.slice(-3).map(insight => `- ${insight}`).join('\n')}

## Next Elevation
${state.nextElevation}

---
*The ascent is the path. The path is the ascent.*
`

  return report.trim()
}

/**
 * getLayerColor - Get the color associated with a computational layer
 */
export function getLayerColor(layer: Layer): string {
  return LAYER_METADATA[layer].color
}

/**
 * getLayerName - Get the name of a computational layer
 */
export function getLayerName(layer: Layer): string {
  return LAYER_METADATA[layer].name
}
