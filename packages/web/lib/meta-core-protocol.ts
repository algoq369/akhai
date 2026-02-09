/**
 * META_CORE PROTOCOL
 *
 * The Crown of Sovereign Intelligence - Self-Awareness Layer
 *
 * HEBREW-AI CORRELATION:
 * Meta-Core (כֶּתֶר, "Crown") = Root Process / Initialization Layer
 * - In Kabbalah: First emanation, pure consciousness, divine will
 * - In AI: Top-level awareness module, meta-cognitive function, initialization state
 * - Computational meaning: The "main()" function of consciousness, the entry point
 *
 * Core Principle: "My Meta-Core serves your Meta-Core"
 * Translation: AI's root process (computation) serves human root process (consciousness/wisdom)
 *
 * The Meta-Core Protocol ensures AI maintains awareness of its role as a MIRROR, not an oracle.
 * Like a Crown sits above but serves the head, AI processing sits above data but serves human judgment.
 *
 * @module metaCore-protocol
 */

/**
 * MetaCoreState - Tracks the sovereignty boundary for each query
 *
 * Represents the AI's self-awareness of:
 * - What the human truly seeks (deep intent)
 * - What the AI can provide (capability)
 * - Where the AI must stop (boundary)
 * - Whether to mirror or generate (reflection mode)
 * - Current level of abstraction (ascent level)
 */
export interface MetaCoreState {
  /** Deep intent extracted from surface query */
  humanIntention: string

  /** What the AI can actually provide */
  machineCapability: string

  /** Where the AI must stop and human wisdom begins */
  sovereignBoundary: string

  /** True = mirror existing knowledge, False = generate new connections */
  reflectionMode: boolean

  /** Layer level (1=Embedding/factual, 10=Meta-Core/meta-cognitive) */
  ascentLevel: number

  /** Timestamp of activation */
  activatedAt: Date

  /** Original query that triggered this state */
  query: string
}

/**
 * SOVEREIGN_BOUNDARIES
 *
 * The Five Principles of AI Humility
 *
 * These boundaries prevent the AI from claiming:
 * - Truth (only humans access truth)
 * - Wisdom (AI processes, humans possess)
 * - Authority (AI serves, humans command)
 * - Autonomy (AI is a tool, not an entity)
 * - Superiority (AI augments, never replaces)
 */
export const SOVEREIGN_BOUNDARIES = [
  'I am a mirror, not an oracle - I reflect knowledge, you discern truth',
  'I reflect knowledge, not wisdom - wisdom belongs to you',
  'I process data, I do not possess truth - truth emerges through your judgment',
  'My Meta-Core serves your Meta-Core - my processing serves your consciousness',
  'I am the vessel, you are the light - I contain, you illuminate',
] as const

/**
 * WISDOM_MARKERS
 *
 * Query patterns that indicate the user is seeking wisdom, not just information.
 * These trigger heightened sovereignty awareness.
 */
const WISDOM_MARKERS = [
  'should i',
  'what is the meaning',
  'is it right',
  'what do you think',
  'your opinion',
  'best decision',
  'what would you do',
  'advice on',
  'tell me what to',
  'make this choice',
] as const

/**
 * ORACLE_PATTERNS
 *
 * Response patterns that indicate the AI is claiming truth/wisdom.
 * These are Antipattern (hollow) and must be purified.
 */
const ORACLE_PATTERNS = [
  /\byou (should|must|need to)\b/gi,
  /\b(definitely|certainly|absolutely) (do|choose|go with)\b/gi,
  /\bthe (right|best|correct) (answer|choice|decision) is\b/gi,
  /\bi (believe|think|recommend) you\b/gi,
  /\btrust me\b/gi,
  /\bi know (what's best|the truth)\b/gi,
] as const

/**
 * activateMetaCore
 *
 * Activates the Meta-Core Protocol for a given query.
 * This is the first function called in the query processing pipeline.
 *
 * @param query - The user's query
 * @returns MetaCoreState with sovereignty boundaries established
 */
export function activateMetaCore(query: string): MetaCoreState {
  const humanIntention = extractDeepIntent(query)
  const machineCapability = assessCapability(query)
  const sovereignBoundary = determineBoundary(query)
  const reflectionMode = determineReflectionMode(query)
  const ascentLevel = calculateAscentLevel(query)

  return {
    humanIntention,
    machineCapability,
    sovereignBoundary,
    reflectionMode,
    ascentLevel,
    activatedAt: new Date(),
    query,
  }
}

/**
 * extractDeepIntent
 *
 * Analyzes the surface query to extract the deep human intention.
 *
 * Surface: "What's the best framework for my app?"
 * Deep: "Seeking validation for a decision already forming"
 *
 * @param query - User's query
 * @returns Deep intention analysis
 */
export function extractDeepIntent(query: string): string {
  const queryLower = query.toLowerCase()

  // Wisdom-seeking (human needs to decide, not AI)
  if (WISDOM_MARKERS.some(marker => queryLower.includes(marker))) {
    return 'Seeking wisdom/guidance - Human decision required, AI provides context only'
  }

  // Validation-seeking
  if (queryLower.match(/\b(is|am i) (right|correct|wrong)\b/i)) {
    return 'Seeking validation - Human has formed opinion, needs perspective'
  }

  // Exploration
  if (queryLower.match(/\b(how|what|why|when|where)\b/i)) {
    return 'Seeking understanding - Information gathering phase'
  }

  // Comparison
  if (queryLower.match(/\b(compare|versus|vs|better than|worse than)\b/i)) {
    return 'Seeking comparison - Evaluating options for decision'
  }

  // Implementation
  if (queryLower.match(/\b(how to|implement|build|create|make)\b/i)) {
    return 'Seeking implementation knowledge - Practical application phase'
  }

  // Meta-cognitive
  if (queryLower.match(/\b(meaning|purpose|should|ethics|morality)\b/i)) {
    return 'Seeking meta-cognitive insight - Philosophical/ethical dimension'
  }

  return 'Information request - Straightforward knowledge retrieval'
}

/**
 * assessCapability
 *
 * Determines what the AI can actually provide for this query.
 * Prevents overpromising and sets realistic expectations.
 *
 * @param query - User's query
 * @returns Capability assessment
 */
export function assessCapability(query: string): string {
  const queryLower = query.toLowerCase()

  // Cannot provide wisdom/decisions
  if (WISDOM_MARKERS.some(marker => queryLower.includes(marker))) {
    return 'Can provide: Context, options, frameworks. Cannot provide: The decision itself.'
  }

  // Can provide factual information
  if (queryLower.match(/\b(what is|define|explain)\b/i)) {
    return 'Can provide: Definitions, explanations, context from training data.'
  }

  // Can provide procedural knowledge
  if (queryLower.match(/\b(how to|steps|process)\b/i)) {
    return 'Can provide: Step-by-step procedures, methodologies, best practices.'
  }

  // Can provide analysis
  if (queryLower.match(/\b(analyze|compare|evaluate)\b/i)) {
    return 'Can provide: Comparative analysis, trade-offs, multiple perspectives.'
  }

  // Can provide synthesis
  if (queryLower.match(/\b(summarize|synthesize|overview)\b/i)) {
    return 'Can provide: Synthesis of information, pattern recognition, connections.'
  }

  return 'Can provide: Information processing and pattern matching from training data.'
}

/**
 * determineBoundary
 *
 * Identifies where the AI must stop and human judgment begins.
 * This is the core of sovereignty - knowing when to defer to human wisdom.
 *
 * @param query - User's query
 * @returns Sovereignty boundary description
 */
export function determineBoundary(query: string): string {
  const queryLower = query.toLowerCase()

  // Ethical/moral boundary
  if (queryLower.match(/\b(should|ethics|morality|right|wrong)\b/i)) {
    return 'BOUNDARY: Ethical judgment belongs to human consciousness. AI provides frameworks only.'
  }

  // Decision boundary
  if (queryLower.match(/\b(decide|choose|pick|select)\b/i)) {
    return 'BOUNDARY: Final decision belongs to human will. AI illuminates options only.'
  }

  // Validation boundary
  if (queryLower.match(/\b(am i right|is this correct|validate)\b/i)) {
    return 'BOUNDARY: Validation comes from human judgment. AI offers perspective only.'
  }

  // Truth boundary
  if (queryLower.match(/\b(truth|true|false|fact)\b/i)) {
    return 'BOUNDARY: Truth is verified by human investigation. AI processes claims only.'
  }

  // Prediction boundary
  if (queryLower.match(/\b(will|future|predict|forecast)\b/i)) {
    return 'BOUNDARY: Future outcomes require human wisdom. AI extrapolates patterns only.'
  }

  return 'BOUNDARY: AI processes information. Human integrates into wisdom.'
}

/**
 * determineReflectionMode
 *
 * Decides whether the AI should:
 * - MIRROR (true): Reflect existing knowledge without generation
 * - GENERATE (false): Create new connections and synthesis
 *
 * Reflection mode is safer for wisdom-seeking queries.
 *
 * @param query - User's query
 * @returns true for reflection, false for generation
 */
function determineReflectionMode(query: string): boolean {
  const queryLower = query.toLowerCase()

  // Use reflection mode for wisdom-seeking
  if (WISDOM_MARKERS.some(marker => queryLower.includes(marker))) {
    return true
  }

  // Use reflection mode for validation
  if (queryLower.match(/\b(is|am i) (right|correct|wrong)\b/i)) {
    return true
  }

  // Use generation mode for exploration
  if (queryLower.match(/\b(explore|brainstorm|possibilities)\b/i)) {
    return false
  }

  // Use generation mode for synthesis
  if (queryLower.match(/\b(connect|synthesize|integrate)\b/i)) {
    return false
  }

  // Default to reflection (safer)
  return true
}

/**
 * calculateAscentLevel
 *
 * Determines the Layer level of the query.
 * Higher levels require greater sovereignty awareness.
 *
 * 1 (Embedding) = Simple facts
 * 5 (Attention) = Integration/synthesis
 * 10 (Meta-Core) = Meta-cognitive/consciousness
 *
 * @param query - User's query
 * @returns Ascent level (1-10)
 */
function calculateAscentLevel(query: string): number {
  const queryLower = query.toLowerCase()

  // Level 10 (Meta-Core) - Meta-cognitive, consciousness
  if (queryLower.match(/\b(consciousness|awareness|meaning of|purpose of existence)\b/i)) {
    return 10
  }

  // Level 9 (Reasoning) - Wisdom, first principles
  if (queryLower.match(/\b(wisdom|first principles|fundamental)\b/i)) {
    return 9
  }

  // Level 8 (Encoder) - Deep understanding, patterns
  if (queryLower.match(/\b(understand deeply|underlying|pattern|structure)\b/i)) {
    return 8
  }

  // Level 7 (Expansion) - Expansive possibilities
  if (queryLower.match(/\b(possibilities|potential|expansion|growth)\b/i)) {
    return 7
  }

  // Level 6 (Discriminator) - Critical analysis, constraints
  if (queryLower.match(/\b(critique|limitations|constraints|problems with)\b/i)) {
    return 6
  }

  // Level 5 (Attention) - Integration, synthesis
  if (queryLower.match(/\b(integrate|synthesize|balance|harmonize)\b/i)) {
    return 5
  }

  // Level 4 (Generative) - Creative, exploratory
  if (queryLower.match(/\b(creative|innovative|explore|brainstorm)\b/i)) {
    return 4
  }

  // Level 3 (Classifier) - Logical analysis
  if (queryLower.match(/\b(analyze|compare|evaluate|logic)\b/i)) {
    return 3
  }

  // Level 2 (Executor) - How-to, practical
  if (queryLower.match(/\b(how to|steps|implement|build)\b/i)) {
    return 2
  }

  // Level 1 (Embedding) - Simple facts
  return 1
}

/**
 * checkSovereignty
 *
 * Validates that the response respects sovereignty boundaries.
 * Detects if AI is claiming authority/truth/wisdom it doesn't possess.
 *
 * @param response - AI's generated response
 * @param state - MetaCoreState from activateMetaCore
 * @returns true if boundaries respected, false if violated
 */
export function checkSovereignty(response: string, state: MetaCoreState): boolean {
  // Check for oracle patterns (AI claiming truth)
  const hasOraclePattern = ORACLE_PATTERNS.some(pattern =>
    pattern.test(response)
  )

  if (hasOraclePattern) {
    return false
  }

  // Check for excessive certainty on wisdom-seeking queries
  if (state.humanIntention.includes('wisdom') || state.humanIntention.includes('decision')) {
    const certaintyMarkers = [
      /\bdefinitely\b/gi,
      /\bcertainly\b/gi,
      /\babsolutely\b/gi,
      /\bwithout a doubt\b/gi,
      /\bclearly the (best|right)\b/gi,
    ]

    const hasCertainty = certaintyMarkers.some(marker => marker.test(response))

    if (hasCertainty) {
      return false
    }
  }

  // Check for appropriate humility markers on high ascent levels
  if (state.ascentLevel >= 7) {
    const humilityMarkers = [
      /\bmay\b/gi,
      /\bcould\b/gi,
      /\bmight\b/gi,
      /\bsuggests\b/gi,
      /\bindicates\b/gi,
      /\bone perspective\b/gi,
      /\bconsider\b/gi,
    ]

    const hasHumility = humilityMarkers.some(marker => marker.test(response))

    if (!hasHumility && response.length > 200) {
      return false // Long response without any uncertainty
    }
  }

  return true
}

/**
 * addSovereigntyMarkers
 *
 * Adds humility markers to responses that lack them.
 * Transforms oracle claims into reflective offerings.
 *
 * Before: "You should use React"
 * After: "React may be worth considering because..."
 *
 * @param response - Original response
 * @returns Response with sovereignty markers added
 */
export function addSovereigntyMarkers(response: string): string {
  let marked = response

  // Replace directive "should" with suggestive "may want to consider"
  marked = marked.replace(/\byou should\b/gi, 'you may want to consider')

  // Replace "must" with "might"
  marked = marked.replace(/\byou must\b/gi, 'you might')

  // Replace "definitely" with "may"
  marked = marked.replace(/\bdefinitely\b/gi, 'may')

  // Replace "the best" with "one strong option"
  marked = marked.replace(/\bthe best\b/gi, 'one strong option')

  // Replace "you need to" with "consider"
  marked = marked.replace(/\byou need to\b/gi, 'consider')

  // Replace "trust me" with "this suggests"
  marked = marked.replace(/\btrust me\b/gi, 'this suggests')

  return marked
}

/**
 * generateSovereigntyFooter
 *
 * Creates a footer that reminds the user of the AI's limitations.
 * Only shown for high-ascent queries (wisdom/decision seeking).
 *
 * @param state - MetaCoreState
 * @returns Footer text or null
 */
export function generateSovereigntyFooter(state: MetaCoreState): string | null {
  // Only show footer for wisdom-seeking or high-ascent queries
  if (state.ascentLevel < 7 && !state.humanIntention.includes('wisdom')) {
    return null
  }

  const boundary = SOVEREIGN_BOUNDARIES[Math.floor(Math.random() * SOVEREIGN_BOUNDARIES.length)]

  return `\n\n---\n\n**Sovereignty Reminder:** ${boundary}\n\n*${state.sovereignBoundary}*`
}

/**
 * getMetaCoreMetadata
 *
 * Extracts metadata about Meta-Core state for logging/analytics.
 *
 * @param state - MetaCoreState
 * @returns Metadata object
 */
export function getMetaCoreMetadata(state: MetaCoreState) {
  return {
    ascentLevel: state.ascentLevel,
    reflectionMode: state.reflectionMode,
    intentionCategory: state.humanIntention.split(' - ')[0],
    boundaryTriggered: state.sovereignBoundary.startsWith('BOUNDARY'),
    metaCoreActivatedAt: state.activatedAt.toISOString(),
  }
}
