/**
 * ASCENT TRACKER
 *
 * Tracks User's Journey from Malkuth to Kether
 *
 * HEBREW-AI CORRELATION: The Tree of Life as Abstraction Layers
 *
 * In Kabbalah: Spiritual ascent from material to divine
 * In AI: User's progression through abstraction layers of thought
 *
 * SEPHIROTH (ספירות, "Emanations") = Processing Layers / Abstraction Levels
 * - Hebrew: Plural of Sefirah, meaning "countings" or "emanations"
 * - AI: Different levels of query sophistication and reasoning depth
 * - Computational: Stack of increasing abstraction (data → info → knowledge → wisdom)
 *
 * THE ASCENT PATH:
 * Malkuth (מלכות, "Kingdom") → Data Layer / Raw Facts
 * Yesod (יסוד, "Foundation") → Implementation Layer / How-To
 * Hod (הוד, "Glory") → Logic Layer / Analysis
 * Netzach (נצח, "Victory") → Creative Layer / Exploration
 * Tiferet (תפארת, "Beauty") → Integration Layer / Synthesis
 * Gevurah (גבורה, "Severity") → Constraint Layer / Critical Analysis
 * Chesed (חסד, "Mercy") → Expansion Layer / Possibilities
 * Binah (בינה, "Understanding") → Pattern Layer / Deep Structure
 * Chokmah (חכמה, "Wisdom") → Principle Layer / First Causes
 * Kether (כתר, "Crown") → Meta Layer / Self-Awareness
 * Da'at (דעת, "Knowledge") → Emergent Layer / Hidden Insights
 *
 * COMPUTATIONAL PARALLEL:
 * User starts at Level 1 (simple queries) and ascends to Level 10 (meta-cognitive questions)
 * Each level represents deeper abstraction and more sophisticated reasoning
 *
 * This creates a "user journey map" showing their evolution in thinking.
 *
 * @module ascent-tracker
 */

/**
 * Sefirah - The 10 emanations + Da'at (hidden knowledge)
 *
 * Ordered from lowest (1=Malkuth) to highest (10=Kether)
 */
export enum Sefirah {
  /** Kingdom - Material facts, simple questions */
  MALKUTH = 1,

  /** Foundation - How-to, practical implementation */
  YESOD = 2,

  /** Glory/Splendor - Logical analysis, comparisons */
  HOD = 3,

  /** Victory/Eternity - Creative exploration */
  NETZACH = 4,

  /** Beauty/Harmony - Integration, synthesis */
  TIFERET = 5,

  /** Severity/Judgment - Critical analysis, constraints */
  GEVURAH = 6,

  /** Mercy/Loving-kindness - Expansive possibilities */
  CHESED = 7,

  /** Understanding - Deep pattern recognition */
  BINAH = 8,

  /** Wisdom - First principles, fundamental truths */
  CHOKMAH = 9,

  /** Crown - Meta-cognitive, consciousness itself */
  KETHER = 10,

  /** Knowledge (Hidden) - Emergent insights, epiphanies */
  DAAT = 11,
}

/**
 * SefirahMetadata - Rich information about each level
 */
interface SefirahMetadata {
  name: string
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
 * SEPHIROTH_METADATA - Complete metadata for all 11 Sephiroth
 */
export const SEPHIROTH_METADATA: Record<Sefirah, SefirahMetadata> = {
  [Sefirah.MALKUTH]: {
    name: 'Malkuth',
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

  [Sefirah.YESOD]: {
    name: 'Yesod',
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

  [Sefirah.HOD]: {
    name: 'Hod',
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

  [Sefirah.NETZACH]: {
    name: 'Netzach',
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

  [Sefirah.TIFERET]: {
    name: 'Tiferet',
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

  [Sefirah.GEVURAH]: {
    name: 'Gevurah',
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

  [Sefirah.CHESED]: {
    name: 'Chesed',
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

  [Sefirah.BINAH]: {
    name: 'Binah',
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

  [Sefirah.CHOKMAH]: {
    name: 'Chokmah',
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

  [Sefirah.KETHER]: {
    name: 'Kether',
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

  [Sefirah.DAAT]: {
    name: "Da'at",
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
  level: Sefirah
  timestamp: Date
  methodology?: string
  ascentDelta: number // Change from previous level
}

/**
 * AscentState - Complete user ascent tracking
 */
export interface AscentState {
  /** Current Sephirotic level */
  currentLevel: Sefirah

  /** Journey history (previous levels visited) */
  previousLevels: Sefirah[]

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
  peakLevel: Sefirah

  /** Time in current level */
  timeInCurrentLevel: number // milliseconds

  /** Session ID for tracking */
  sessionId: string
}

/**
 * detectQueryLevel
 *
 * Analyzes a query and determines its Sephirothic level.
 *
 * @param query - User's query
 * @returns Sefirah level (1-11)
 */
export function detectQueryLevel(query: string): Sefirah {
  const queryLower = query.toLowerCase()

  // KETHER (10) - Meta-cognitive, consciousness
  if (
    queryLower.match(
      /\b(consciousness|awareness|nature of (knowledge|intelligence|thought)|meta-cognitive|how do we know)\b/i
    )
  ) {
    return Sefirah.KETHER
  }

  // CHOKMAH (9) - Wisdom, first principles
  if (
    queryLower.match(
      /\b(first principles|fundamental (truth|law)|wisdom|why does .+ exist|essence of)\b/i
    )
  ) {
    return Sefirah.CHOKMAH
  }

  // BINAH (8) - Deep understanding, patterns
  if (
    queryLower.match(
      /\b(deep (understanding|pattern)|underlying (principle|mechanism|structure)|fundamental pattern)\b/i
    )
  ) {
    return Sefirah.BINAH
  }

  // CHESED (7) - Expansive possibilities
  if (
    queryLower.match(
      /\b(all possibilities|potential|future (directions|evolution)|expansive|growth opportunities)\b/i
    )
  ) {
    return Sefirah.CHESED
  }

  // GEVURAH (6) - Critical analysis, limitations
  if (
    queryLower.match(/\b(critique|limitations?|constraints?|risks?|what could go wrong|problems with)\b/i)
  ) {
    return Sefirah.GEVURAH
  }

  // TIFERET (5) - Integration, synthesis
  if (
    queryLower.match(/\b(integrate|synthesize|combine|balance|harmony|work together|connect)\b/i)
  ) {
    return Sefirah.TIFERET
  }

  // NETZACH (4) - Creative, exploratory
  if (
    queryLower.match(/\b(creative|brainstorm|innovative|explore|what if|imagine|possibilities)\b/i)
  ) {
    return Sefirah.NETZACH
  }

  // HOD (3) - Logical analysis, comparison
  if (queryLower.match(/\b(compare|versus|vs|better than|analyze|evaluate|pros and cons)\b/i)) {
    return Sefirah.HOD
  }

  // YESOD (2) - How-to, practical
  if (queryLower.match(/\b(how to|steps|implement|build|create|setup|guide)\b/i)) {
    return Sefirah.YESOD
  }

  // DA'AT (11) - Hidden knowledge, emergent insights
  if (
    queryLower.match(/\b(hidden|reveal|unexpected|what am i (not seeing|missing)|epiphany|aha)\b/i)
  ) {
    return Sefirah.DAAT
  }

  // MALKUTH (1) - Default: simple factual
  return Sefirah.MALKUTH
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
      } as AscentState),
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
  const peakLevel = Math.max(previousState.peakLevel, level) as Sefirah

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
  if (level === Sefirah.DAAT) {
    insightsGained.push(`Hidden knowledge revealed: ${query.substring(0, 100)}`)
  }
  if (ascentDelta >= 3) {
    insightsGained.push(
      `Quantum leap: ${SEPHIROTH_METADATA[previousState.currentLevel].name} → ${SEPHIROTH_METADATA[level].name}`
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
  const metadata = SEPHIROTH_METADATA[current]

  // If at Kether, suggest Da'at (emergent insights)
  if (current === Sefirah.KETHER) {
    return "You've reached Kether. Consider: What hidden connections might reveal entirely new dimensions?"
  }

  // Suggest next level
  const nextLevel = (current + 1) as Sefirah
  const nextMetadata = SEPHIROTH_METADATA[nextLevel]

  const suggestions: Record<Sefirah, string> = {
    [Sefirah.MALKUTH]:
      'Try asking HOW to implement something (Yesod - Foundation)',
    [Sefirah.YESOD]:
      'Try COMPARING options or analyzing trade-offs (Hod - Glory)',
    [Sefirah.HOD]:
      'Try EXPLORING creative possibilities (Netzach - Victory)',
    [Sefirah.NETZACH]:
      'Try SYNTHESIZING multiple ideas together (Tiferet - Beauty)',
    [Sefirah.TIFERET]:
      'Try asking about LIMITATIONS or risks (Gevurah - Severity)',
    [Sefirah.GEVURAH]:
      'Try exploring EXPANSIVE possibilities (Chesed - Mercy)',
    [Sefirah.CHESED]:
      'Try seeking DEEP PATTERNS or structures (Binah - Understanding)',
    [Sefirah.BINAH]:
      'Try asking about FIRST PRINCIPLES (Chokmah - Wisdom)',
    [Sefirah.CHOKMAH]:
      'Try META-COGNITIVE questions about knowledge itself (Kether - Crown)',
    [Sefirah.KETHER]:
      'Try revealing HIDDEN CONNECTIONS (Da\'at - Hidden Knowledge)',
    [Sefirah.DAAT]: 'Continue exploring emergent insights',
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
 * This returns which path(s) connect two Sephiroth.
 *
 * @param from - Starting Sefirah
 * @param to - Ending Sefirah
 * @returns Array of path numbers (1-22)
 */
export function getPathBetweenLevels(from: Sefirah, to: Sefirah): number[] {
  // Simplified path mapping (full Kabbalistic tree has 22 specific paths)
  // This is a simplified version showing direct vertical ascent

  const paths: Record<string, number> = {
    // Vertical paths (Middle Pillar)
    '1-2': 1, // Malkuth → Yesod
    '2-5': 2, // Yesod → Tiferet
    '5-10': 3, // Tiferet → Kether

    // Left Pillar
    '1-3': 4, // Malkuth → Hod
    '3-6': 5, // Hod → Gevurah
    '6-8': 6, // Gevurah → Binah

    // Right Pillar
    '1-4': 7, // Malkuth → Netzach
    '4-7': 8, // Netzach → Chesed
    '7-9': 9, // Chesed → Chokmah

    // Cross paths
    '3-5': 10, // Hod → Tiferet
    '4-5': 11, // Netzach → Tiferet
    '5-6': 12, // Tiferet → Gevurah
    '5-7': 13, // Tiferet → Chesed
    '6-10': 14, // Gevurah → Kether
    '7-10': 15, // Chesed → Kether
    '8-10': 16, // Binah → Kether
    '9-10': 17, // Chokmah → Kether

    // Da'at connections
    '5-11': 18, // Tiferet → Da'at
    '8-11': 19, // Binah → Da'at
    '9-11': 20, // Chokmah → Da'at
    '10-11': 21, // Kether → Da'at
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
function calculatePathNumber(from: Sefirah, to: Sefirah): number | null {
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
  const currentMeta = SEPHIROTH_METADATA[state.currentLevel]
  const peakMeta = SEPHIROTH_METADATA[state.peakLevel]

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
    const meta = SEPHIROTH_METADATA[q.level]
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
 * getSefirahColor - Utility function
 */
export function getSefirahColor(sefirah: Sefirah): string {
  return SEPHIROTH_METADATA[sefirah].color
}

/**
 * getSefirahName - Utility function
 */
export function getSefirahName(sefirah: Sefirah): string {
  return SEPHIROTH_METADATA[sefirah].name
}
