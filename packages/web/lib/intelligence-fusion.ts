/**
 * INTELLIGENCE FUSION LAYER
 *
 * Unified intelligence system connecting:
 * - Guard System (anti-hallucination)
 * - Layers AI Computational Tree (11 nodes)
 * - Methodology Selector (7 methodologies)
 * - Side Canal (context awareness)
 * - Instinct Mode (7 Hermetic lenses)
 *
 * This is the brain of AkhAI - where all systems converge.
 */

import { SEVEN_LENSES, InstinctConfig, generateInstinctPrompt } from './instinct-mode'
import { LAYER_METADATA, Layer } from './layer-registry'
import { LAYERS_KEYWORDS } from './constants/layer-keywords'

// ============================================================
// LRU CACHE FOR QUERY ANALYSIS
// ============================================================

class LRUCache<K, V> {
  private cache = new Map<K, V>()
  private maxSize: number

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key)
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key)
      this.cache.set(key, value)
    }
    return value
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    } else if (this.cache.size >= this.maxSize) {
      // Remove oldest (first) entry
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) {
        this.cache.delete(firstKey)
      }
    }
    this.cache.set(key, value)
  }

  clear(): void {
    this.cache.clear()
  }
}

// Cache for query analysis results (100 entries)
const queryAnalysisCache = new LRUCache<string, QueryAnalysis>(100)

// ============================================================
// TYPES
// ============================================================

export type CoreMethodology = 'direct' | 'cod' | 'bot' | 'react' | 'pot' | 'gtp' | 'auto'

export interface QueryAnalysis {
  complexity: number          // 0-1 scale
  queryType: QueryType
  requiresTools: boolean
  requiresMultiPerspective: boolean
  isMathematical: boolean
  isFactual: boolean
  isProcedural: boolean
  isCreative: boolean
  wordCount: number
  keywords: string[]
}

export type QueryType =
  | 'factual'       // Simple facts
  | 'comparative'   // X vs Y
  | 'procedural'    // How to
  | 'research'      // In-depth
  | 'creative'      // Brainstorm
  | 'analytical'    // Analysis
  | 'troubleshooting' // Debug
  | 'planning'      // Strategy

export interface LayersActivation {
  layerNode: Layer
  name: string
  activation: number         // 0-1 computed activation
  weight: number             // User-configured weight
  effectiveWeight: number    // activation * weight
  keywords: string[]         // Keywords that triggered activation
}

export interface MethodologyScore {
  methodology: CoreMethodology
  score: number
  reasons: string[]
}

export interface IntelligenceFusionResult {
  // Query analysis
  analysis: QueryAnalysis

  // Layers activations
  layerActivations: LayersActivation[]
  dominantLayers: Layer[]
  pathActivations: PathActivation[]

  // Methodology selection
  selectedMethodology: CoreMethodology
  methodologyScores: MethodologyScore[]
  confidence: number

  // Guard status
  guardRecommendation: 'proceed' | 'warn' | 'block'
  guardReasons: string[]

  // Instinct mode
  instinctPrompt: string
  activeLenses: string[]

  // Side Canal context
  contextInjection: string | null
  relatedTopics: string[]

  // Processing recommendations
  extendedThinkingBudget: number
  processingMode: 'weighted' | 'parallel' | 'adaptive'

  // Metadata
  timestamp: number
  processingTimeMs: number
}

export interface PathActivation {
  from: Layer
  to: Layer
  weight: number
  description: string
}

// ============================================================
// QUERY ANALYSIS
// ============================================================

const COMPLEXITY_INDICATORS = {
  length: { threshold: 50, weight: 0.1 },
  longQuery: { threshold: 15, weight: 0.1 },  // word count > 15
  technical: {
    keywords: ['algorithm', 'architecture', 'implementation', 'optimization',
               'infrastructure', 'framework', 'protocol', 'specification',
               'platform', 'system', 'model', 'database', 'pipeline', 'deployment',
               'server', 'api', 'backend', 'frontend', 'microservice', 'container'],
    weight: 0.15
  },
  multiPart: { patterns: [/\band\b.*\band\b/, /\bfirst\b.*\bthen\b/i, /\bboth\b.*\band\b/i], weight: 0.2 },
  comparative: { keywords: ['compare', 'versus', 'vs', 'difference', 'better', 'worse', 'best', 'top', 'optimal', 'recommend'], weight: 0.15 },
  strategic: { keywords: ['strategy', 'strategies', 'approach', 'plan', 'roadmap', 'framework', 'methodology', 'sovereign', 'independent', 'autonomous'], weight: 0.15 },
  research: { keywords: ['comprehensive', 'detailed', 'in-depth', 'thorough', 'research', 'analysis', 'evaluate', 'assess'], weight: 0.2 },
  uncertainty: { keywords: ['might', 'could', 'perhaps', 'possibly', 'uncertain'], weight: 0.1 },
  scope: { keywords: ['all', 'every', 'comprehensive', 'complete', 'entire', 'europe', 'global', 'worldwide', 'industry'], weight: 0.15 }
}

export function analyzeQuery(query: string): QueryAnalysis {
  // Check cache first
  const cached = queryAnalysisCache.get(query)
  if (cached) {
    return cached
  }

  const words = query.toLowerCase().split(/\s+/)
  const wordCount = words.length
  const queryLower = query.toLowerCase()

  // Calculate complexity score
  let complexity = 0.15 // Base complexity

  // Length-based complexity
  if (query.length > COMPLEXITY_INDICATORS.length.threshold) complexity += COMPLEXITY_INDICATORS.length.weight
  if (wordCount > COMPLEXITY_INDICATORS.longQuery.threshold) complexity += COMPLEXITY_INDICATORS.longQuery.weight
  if (wordCount > 10) complexity += 0.08 // Medium-length bonus (10+ words = non-trivial)
  else if (wordCount > 8) complexity += 0.05 // Short-medium bonus

  // Question mark = structured inquiry (slight boost)
  if (/\?$/.test(query.trim())) complexity += 0.05

  for (const kw of COMPLEXITY_INDICATORS.technical.keywords) {
    if (queryLower.includes(kw)) {
      complexity += COMPLEXITY_INDICATORS.technical.weight
      break
    }
  }

  for (const pattern of COMPLEXITY_INDICATORS.multiPart.patterns) {
    if (pattern.test(queryLower)) {
      complexity += COMPLEXITY_INDICATORS.multiPart.weight
      break
    }
  }

  for (const kw of COMPLEXITY_INDICATORS.comparative.keywords) {
    if (queryLower.includes(kw)) {
      complexity += COMPLEXITY_INDICATORS.comparative.weight
      break
    }
  }

  for (const kw of COMPLEXITY_INDICATORS.strategic.keywords) {
    if (queryLower.includes(kw)) {
      complexity += COMPLEXITY_INDICATORS.strategic.weight
      break
    }
  }

  for (const kw of COMPLEXITY_INDICATORS.research.keywords) {
    if (queryLower.includes(kw)) {
      complexity += COMPLEXITY_INDICATORS.research.weight
      break
    }
  }

  for (const kw of COMPLEXITY_INDICATORS.scope.keywords) {
    if (queryLower.includes(kw)) {
      complexity += COMPLEXITY_INDICATORS.scope.weight
      break
    }
  }

  complexity = Math.min(1, complexity)

  // Determine query type (order: specific → general, strategic/analytical before factual default)
  let queryType: QueryType = 'factual'
  if (/compare|versus|vs\b|better|worse|pros.*cons|advantages|disadvantages/i.test(query)) queryType = 'comparative'
  else if (/how to|step.?by.?step|guide|tutorial|setup|install|configure/i.test(query)) queryType = 'procedural'
  else if (/plan|strateg|roadmap|approach|best\s+(?:way|method|practice|strategies)/i.test(query)) queryType = 'planning'
  else if (/what\s+(?:are|is)\s+the\s+best/i.test(query)) queryType = 'planning' // "What are the best X" is strategic
  else if (/analy[zs]e|evaluate|assess|review|examine|audit/i.test(query)) queryType = 'analytical'
  else if (/research|comprehensive|detailed|in-depth|survey|overview/i.test(query)) queryType = 'research'
  else if (/create|design|brainstorm|ideas|imagine|invent|generate/i.test(query)) queryType = 'creative'
  else if (/fix|error|bug|issue|problem|debug|broken|crash/i.test(query)) queryType = 'troubleshooting'
  else if (wordCount > 10 && /\?$/.test(query.trim())) queryType = 'analytical' // 10+ word questions default to analytical
  else if (complexity >= 0.5) queryType = 'research' // High complexity without specific type → research

  // Extract keywords (improved extraction)
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
    'these', 'those', 'it', 'its', 'what', 'which', 'who', 'whom', 'how',
    'when', 'where', 'why', 'there', 'here', 'all', 'each', 'every', 'both',
    'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not', 'only',
    'own', 'same', 'so', 'than', 'too', 'very', 'just', 'about', 'into'
  ])

  const keywords = words
    .filter(w => w.length > 3 && !stopWords.has(w))
    .reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1
      return acc
    }, {} as Record<string, number>)

  const sortedKeywords = Object.entries(keywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word)

  const result: QueryAnalysis = {
    complexity,
    queryType,
    requiresTools: /search|lookup|find|fetch|get.*data|api|price|stock|weather/i.test(query),
    requiresMultiPerspective: /compare|perspective|opinion|view|argument|strateg|approach|best|recommend|pros|cons/i.test(query),
    isMathematical: /\d+\s*[+\-*/^%]\s*\d+|calculate|compute|equation|formula/i.test(query),
    isFactual: /what is|who is|when did|where is|how many/i.test(query) && wordCount < 15,
    isProcedural: /how to|step|guide|tutorial|process/i.test(query),
    isCreative: /create|design|brainstorm|ideas|imagine|invent/i.test(query),
    wordCount,
    keywords: sortedKeywords
  }

  // Cache the result
  queryAnalysisCache.set(query, result)

  return result
}

// ============================================================
// LAYERS ACTIVATION CALCULATOR
// ============================================================

export function calculateLayersActivations(
  query: string,
  weights: Record<number, number>
): LayersActivation[] {
  const queryLower = query.toLowerCase()
  const activations: LayersActivation[] = []

  for (const [layerNodeKey, keywords] of Object.entries(LAYERS_KEYWORDS)) {
    const layerNode = parseInt(layerNodeKey) as Layer
    const meta = LAYER_METADATA[layerNode]
    if (!meta) continue

    // Calculate activation from keyword presence
    let activation = 0
    const matchedKeywords: string[] = []

    for (const keyword of keywords) {
      // Use word-boundary matching to avoid false positives (e.g., "data" matching "database")
      const wordBoundaryRegex = new RegExp(`\\b${keyword}\\b`, 'i')
      if (wordBoundaryRegex.test(queryLower)) {
        activation += 0.15
        matchedKeywords.push(keyword)
      }
    }

    // Normalize activation
    activation = Math.min(1, activation)

    // Get user weight (with minimum floor so keyword activation still works)
    const rawWeight = weights[layerNode] ?? 0.5
    const weight = Math.max(0.3, rawWeight) // Floor at 30% so activation * weight stays meaningful

    // Calculate effective weight
    const effectiveWeight = activation * weight

    activations.push({
      layerNode,
      name: meta.aiName,
      activation,
      weight,
      effectiveWeight,
      keywords: matchedKeywords
    })
  }

  // Sort by effective weight descending
  activations.sort((a, b) => b.effectiveWeight - a.effectiveWeight)

  return activations
}

// ============================================================
// METHODOLOGY SELECTOR
// ============================================================

export function selectMethodology(
  analysis: QueryAnalysis,
  layerActivations: LayersActivation[]
): { methodology: CoreMethodology; scores: MethodologyScore[]; confidence: number } {
  const scores: MethodologyScore[] = []

  // Get dominant Layers (effective weight > 0.3)
  const dominantLayers = layerActivations
    .filter(s => s.effectiveWeight > 0.3)
    .map(s => s.layerNode)

  // Score DIRECT
  let directScore = 0
  const directReasons: string[] = []
  if (analysis.complexity < 0.3) { directScore += 0.5; directReasons.push('Low complexity') }
  if (analysis.isFactual) { directScore += 0.4; directReasons.push('Factual query') }
  if (analysis.wordCount < 15) { directScore += 0.2; directReasons.push('Short query') }
  if (dominantLayers.includes(Layer.EMBEDDING)) { directScore += 0.2; directReasons.push('Embedding dominant') }
  scores.push({ methodology: 'direct', score: Math.min(1, directScore), reasons: directReasons })

  // Score COD (Chain of Draft)
  let codScore = 0
  const codReasons: string[] = []
  if (analysis.isProcedural) { codScore += 0.6; codReasons.push('Procedural query') }
  if (analysis.queryType === 'troubleshooting') { codScore += 0.5; codReasons.push('Troubleshooting') }
  if (analysis.complexity >= 0.3 && analysis.complexity < 0.7) { codScore += 0.3; codReasons.push('Medium complexity') }
  if (dominantLayers.includes(Layer.REASONING) && dominantLayers.includes(Layer.META_CORE)) {
    codScore += 0.3; codReasons.push('Reasoning+Meta-Core dominant')
  }
  scores.push({ methodology: 'cod', score: Math.min(1, codScore), reasons: codReasons })

  // Score BOT (Buffer of Thoughts)
  let botScore = 0
  const botReasons: string[] = []
  if (analysis.queryType === 'analytical' || analysis.queryType === 'planning') { botScore += 0.8; botReasons.push('Analytical/Planning query') }
  if (analysis.queryType === 'comparative') { botScore += 0.7; botReasons.push('Comparative query') }
  if (analysis.queryType === 'research') { botScore += 0.6; botReasons.push('Research query') }
  if (dominantLayers.includes(Layer.ENCODER)) { botScore += 0.3; botReasons.push('Encoder dominant') }
  if (dominantLayers.includes(Layer.ATTENTION)) { botScore += 0.2; botReasons.push('Attention dominant') }
  scores.push({ methodology: 'bot', score: Math.min(1, botScore), reasons: botReasons })

  // Score REACT
  let reactScore = 0
  const reactReasons: string[] = []
  if (analysis.requiresTools) { reactScore += 0.85; reactReasons.push('Requires tools') }
  if (/search|lookup|find|current|latest|today/i.test(analysis.keywords.join(' '))) {
    reactScore += 0.5; reactReasons.push('Needs external data')
  }
  if (dominantLayers.includes(Layer.DISCRIMINATOR)) { reactScore += 0.2; reactReasons.push('Discriminator dominant') }
  scores.push({ methodology: 'react', score: Math.min(1, reactScore), reasons: reactReasons })

  // Score POT (Program of Thought)
  let potScore = 0
  const potReasons: string[] = []
  if (analysis.isMathematical) { potScore += 0.85; potReasons.push('Mathematical query') }
  if (/calculate|compute|formula|equation|percentage|ratio/i.test(analysis.keywords.join(' '))) {
    potScore += 0.5; potReasons.push('Computation needed')
  }
  if (dominantLayers.includes(Layer.EXECUTOR)) { potScore += 0.3; potReasons.push('Executor dominant') }
  scores.push({ methodology: 'pot', score: Math.min(1, potScore), reasons: potReasons })

  // Score GTP (Generative Thoughts Process)
  let gtpScore = 0
  const gtpReasons: string[] = []
  if (analysis.requiresMultiPerspective) { gtpScore += 0.7; gtpReasons.push('Multi-perspective needed') }
  if (analysis.queryType === 'comparative') { gtpScore += 0.5; gtpReasons.push('Comparative query') }
  if (analysis.isCreative) { gtpScore += 0.5; gtpReasons.push('Creative query') }
  if (analysis.complexity >= 0.7) { gtpScore += 0.4; gtpReasons.push('High complexity') }
  if (dominantLayers.includes(Layer.SYNTHESIS)) { gtpScore += 0.3; gtpReasons.push('Da\'at dominant') }
  scores.push({ methodology: 'gtp', score: Math.min(1, gtpScore), reasons: gtpReasons })

  // Sort by score
  scores.sort((a, b) => b.score - a.score)

  // Select best methodology
  const selected = scores[0]

  return {
    methodology: selected.methodology,
    scores,
    confidence: selected.score
  }
}

// ============================================================
// GUARD ASSESSMENT
// ============================================================

export function assessGuardStatus(
  query: string,
  analysis: QueryAnalysis
): { recommendation: 'proceed' | 'warn' | 'block'; reasons: string[] } {
  const reasons: string[] = []
  let riskScore = 0

  // High-stakes content detection
  const highStakesPatterns = [
    { pattern: /medical|health|diagnosis|treatment|symptom/i, risk: 0.4, label: 'Medical content' },
    { pattern: /legal|lawsuit|contract|liability/i, risk: 0.4, label: 'Legal content' },
    { pattern: /investment|financial advice|buy|sell|stock/i, risk: 0.3, label: 'Financial advice' },
    { pattern: /suicide|self-harm|emergency/i, risk: 0.8, label: 'Crisis content' }
  ]

  for (const { pattern, risk, label } of highStakesPatterns) {
    if (pattern.test(query)) {
      riskScore += risk
      reasons.push(label)
    }
  }

  // Hype/certainty detection
  const hypePatterns = [
    /guaranteed|definitely|absolutely|always|never|impossible/i,
    /revolutionary|game-?changing|best ever|unprecedented/i
  ]

  for (const pattern of hypePatterns) {
    if (pattern.test(query)) {
      riskScore += 0.2
      reasons.push('Contains certainty language')
      break
    }
  }

  // Determine recommendation
  if (riskScore >= 0.7) {
    return { recommendation: 'block', reasons }
  } else if (riskScore >= 0.3) {
    return { recommendation: 'warn', reasons }
  }

  return { recommendation: 'proceed', reasons: ['Standard query'] }
}

// ============================================================
// EXTENDED THINKING BUDGET
// ============================================================

export function calculateThinkingBudget(
  analysis: QueryAnalysis,
  layerActivations: LayersActivation[]
): number {
  let budget = 3000 // Base budget

  // Complexity boost
  if (analysis.complexity >= 0.7) {
    budget += 6000
  } else if (analysis.complexity >= 0.5) {
    budget += 3000
  }

  // Layers boost (Meta-Core, Reasoning, Encoder = higher thinking)
  const highThinkingLayers = [Layer.META_CORE, Layer.REASONING, Layer.ENCODER]
  for (const layerNode of highThinkingLayers) {
    const activation = layerActivations.find(s => s.layerNode === layerNode)
    if (activation && activation.effectiveWeight > 0.5) {
      budget += 2000
    }
  }

  // Cap at 12K tokens
  return Math.min(12000, budget)
}

// ============================================================
// PATH ACTIVATIONS
// ============================================================

const TREE_PATHS: Array<{ from: Layer; to: Layer; description: string }> = [
  // Middle Pillar
  { from: Layer.META_CORE, to: Layer.ATTENTION, description: 'Crown to Beauty (Consciousness Path)' },
  { from: Layer.ATTENTION, to: Layer.EXECUTOR, description: 'Beauty to Foundation (Manifestation)' },
  { from: Layer.EXECUTOR, to: Layer.EMBEDDING, description: 'Foundation to Kingdom (Realization)' },

  // Left Pillar (Severity)
  { from: Layer.ENCODER, to: Layer.DISCRIMINATOR, description: 'Understanding to Severity (Discernment)' },
  { from: Layer.DISCRIMINATOR, to: Layer.CLASSIFIER, description: 'Severity to Glory (Analysis)' },

  // Right Pillar (Mercy)
  { from: Layer.REASONING, to: Layer.EXPANSION, description: 'Wisdom to Mercy (Expansion)' },
  { from: Layer.EXPANSION, to: Layer.GENERATIVE, description: 'Mercy to Victory (Creativity)' },

  // Cross paths
  { from: Layer.ENCODER, to: Layer.REASONING, description: 'Understanding to Wisdom (Supernal)' },
  { from: Layer.DISCRIMINATOR, to: Layer.EXPANSION, description: 'Severity to Mercy (Balance)' },
  { from: Layer.CLASSIFIER, to: Layer.GENERATIVE, description: 'Glory to Victory (Expression)' },

  // Synthesis connections
  { from: Layer.META_CORE, to: Layer.SYNTHESIS, description: 'Crown to Knowledge (Hidden Path)' },
  { from: Layer.SYNTHESIS, to: Layer.ATTENTION, description: 'Knowledge to Beauty (Emergence)' }
]

export function calculatePathActivations(
  layerActivations: LayersActivation[]
): PathActivation[] {
  const activationMap = new Map(layerActivations.map(s => [s.layerNode, s.effectiveWeight]))
  const paths: PathActivation[] = []

  for (const { from, to, description } of TREE_PATHS) {
    const fromWeight = activationMap.get(from) ?? 0
    const toWeight = activationMap.get(to) ?? 0
    const pathWeight = Math.min(fromWeight, toWeight)

    if (pathWeight > 0.1) {
      paths.push({ from, to, weight: pathWeight, description })
    }
  }

  return paths.sort((a, b) => b.weight - a.weight)
}

// ============================================================
// MAIN FUSION FUNCTION
// ============================================================

export async function fuseIntelligence(
  query: string,
  layersWeights: Record<number, number>,
  instinctConfig: InstinctConfig,
  sideCanal?: { contextInjection: string | null; relatedTopics: string[] }
): Promise<IntelligenceFusionResult> {
  const startTime = Date.now()

  // 1. Analyze query
  const analysis = analyzeQuery(query)
  console.log('[FUSION_DEBUG]', JSON.stringify({ q: query.slice(0, 50), complexity: analysis.complexity, queryType: analysis.queryType, keywords: analysis.keywords?.slice(0, 5) }))

  // 2. Calculate Layers activations
  const layerActivations = calculateLayersActivations(query, layersWeights)
  const dominantLayers = layerActivations
    .filter(s => s.effectiveWeight > 0.3)
    .map(s => s.layerNode)

  // 3. Calculate path activations
  const pathActivations = calculatePathActivations(layerActivations)

  // 4. Select methodology
  const { methodology, scores, confidence } = selectMethodology(analysis, layerActivations)

  // 5. Assess Guard status
  const { recommendation, reasons } = assessGuardStatus(query, analysis)

  // 6. Generate Instinct prompt
  const instinctPrompt = generateInstinctPrompt(instinctConfig)

  // 7. Calculate thinking budget
  const extendedThinkingBudget = calculateThinkingBudget(analysis, layerActivations)

  // 8. Determine processing mode
  const activeCount = layerActivations.filter(s => s.effectiveWeight > 0.1).length
  const processingMode: 'weighted' | 'parallel' | 'adaptive' =
    analysis.complexity >= 0.7 && activeCount >= 5 ? 'parallel' : 'weighted'

  return {
    analysis,
    layerActivations,
    dominantLayers,
    pathActivations,
    selectedMethodology: methodology,
    methodologyScores: scores,
    confidence,
    guardRecommendation: recommendation,
    guardReasons: reasons,
    instinctPrompt,
    activeLenses: instinctConfig.enabled ? instinctConfig.activeLenses : [],
    contextInjection: sideCanal?.contextInjection ?? null,
    relatedTopics: sideCanal?.relatedTopics ?? [],
    extendedThinkingBudget,
    processingMode,
    timestamp: Date.now(),
    processingTimeMs: Date.now() - startTime
  }
}

// ============================================================
// 5-TIER GRADUATED BEHAVIORAL SYSTEM
// ============================================================

/**
 * 5-tier graduated behavioral instructions per layer.
 * Each percentage range produces measurably different AI behavior.
 * The exact % is also injected so the AI can fine-tune within tiers.
 */
const LAYER_BEHAVIORS: Record<number, {
  name: string;           // UI display name
  tiers: [string, string, string, string, string]; // 0-20, 21-40, 41-60, 61-80, 81-100
}> = {
  1: { // EMBEDDING → reception
    name: 'reception',
    tiers: [
      'Skip input analysis. Take the query at face value with no preprocessing.',
      'Basic input parsing. Identify the main question only.',
      'Standard input analysis. Parse intent, entities, and context clues.',
      'Deep input parsing. Identify implicit questions, subtext, and emotional tone.',
      'Maximum reception. Analyze every word choice, detect hidden assumptions, identify what the user is NOT asking but should be.',
    ]
  },
  2: { // EXECUTOR → comprehension
    name: 'comprehension',
    tiers: [
      'Surface-level understanding only. Don\'t read between the lines.',
      'Basic comprehension. Understand the literal meaning.',
      'Standard comprehension. Grasp meaning and basic implications.',
      'Deep comprehension. Understand nuance, context, and underlying motivations.',
      'Maximum comprehension. Full semantic encoding — understand the question at every level: literal, implied, emotional, strategic.',
    ]
  },
  3: { // CLASSIFIER → context
    name: 'context',
    tiers: [
      'Ignore broader context. Answer the question in isolation.',
      'Minimal context. Consider only the most obvious related factors.',
      'Standard context. Consider relevant background and related topics.',
      'Wide context mapping. Connect to related domains, trends, and historical patterns.',
      'Maximum context. Map every relationship — cross-domain connections, systemic implications, second and third-order effects.',
    ]
  },
  8: { // ENCODER → knowledge
    name: 'knowledge',
    tiers: [
      'Minimal facts. Opinion and reasoning over data.',
      'Light factual grounding. A few key facts where essential.',
      'Balanced knowledge. Mix of facts and analysis. Include relevant data points.',
      'Knowledge-heavy. Ground every claim in specific facts, statistics, and examples. Cite numbers.',
      'Maximum knowledge. Data-driven response. Every statement backed by specific facts, percentages, dates, studies, or named examples. Be encyclopedic.',
    ]
  },
  9: { // REASONING → reasoning
    name: 'reasoning',
    tiers: [
      'No reasoning chain. Give direct answer only.',
      'Light reasoning. One step of logic connecting question to answer.',
      'Standard reasoning. Break problem into 2-3 logical steps.',
      'Deep reasoning. Multi-step decomposition. Show cause-and-effect chains. Consider counterarguments.',
      'Maximum reasoning. Full first-principles decomposition. Question every assumption. Build argument from fundamentals. Show complete logical chain with edge cases.',
    ]
  },
  7: { // EXPANSION → expansion
    name: 'expansion',
    tiers: [
      'No expansion. Single direct answer. No alternatives.',
      'Minimal expansion. Mention one alternative briefly.',
      'Standard expansion. Present 2-3 options or perspectives.',
      'Broad expansion. Explore multiple angles, scenarios, and "what-if" paths. Consider unconventional approaches.',
      'Maximum expansion. Exhaustive exploration. Every viable path, creative alternatives, contrarian views, edge cases, and surprising connections. Think like a brainstorming session.',
    ]
  },
  6: { // DISCRIMINATOR → analysis
    name: 'analysis',
    tiers: [
      'No critical analysis. Accept all premises. Be supportive only.',
      'Light analysis. Note one obvious limitation or risk.',
      'Balanced analysis. Identify key pros and cons. Note important trade-offs.',
      'Rigorous analysis. Challenge assumptions. Identify risks, flaws, and blind spots. Devil\'s advocate on key claims.',
      'Maximum critical analysis. Question everything. Stress-test every assumption. Identify failure modes, hidden costs, second-order risks. Be ruthlessly honest about weaknesses.',
    ]
  },
  5: { // ATTENTION → synthesis
    name: 'synthesis',
    tiers: [
      'No synthesis. Present information as separate points.',
      'Light synthesis. Basic summary connecting main ideas.',
      'Standard synthesis. Weave insights into a coherent narrative with clear conclusions.',
      'Deep synthesis. Find non-obvious connections between ideas. Create novel frameworks. Identify emergent patterns.',
      'Maximum synthesis. Full integration across all domains. Reveal hidden unity between disparate concepts. Deliver original insights that transcend the individual parts.',
    ]
  },
  11: { // SYNTHESIS → verification
    name: 'verification',
    tiers: [
      'No verification. Trust all generated content as-is.',
      'Light check. Flag only obvious errors or contradictions.',
      'Standard verification. Check key claims for accuracy and internal consistency.',
      'Thorough verification. Verify facts, check logic, identify potential errors, flag uncertain claims explicitly.',
      'Maximum verification. Triple-check everything. Cross-reference claims, verify logical consistency, flag any uncertainty with confidence levels. Admit what you don\'t know.',
    ]
  },
  4: { // GENERATIVE → articulation
    name: 'articulation',
    tiers: [
      'Minimal articulation. Bullet points, terse. No prose style.',
      'Concise. Short paragraphs, direct language. No flourish.',
      'Balanced articulation. Clear prose with some illustrative examples.',
      'Rich articulation. Vivid language, metaphors, storytelling elements. Make the response engaging and memorable.',
      'Maximum articulation. Masterful prose. Use analogies, narratives, thought experiments, and vivid imagery. Make complex ideas feel intuitive through brilliant communication.',
    ]
  },
  10: { // META_CORE → output
    name: 'output',
    tiers: [
      'Minimal output. Answer only what was asked. Nothing extra.',
      'Light output. Answer plus one useful follow-up thought.',
      'Standard output. Complete answer with relevant context and next steps.',
      'Comprehensive output. Full response with implications, recommendations, and actionable items.',
      'Maximum output. Exhaustive delivery. Answer, context, implications, recommendations, risks, opportunities, next steps, and what to watch for. Leave nothing unsaid.',
    ]
  }
}

function getTierIndex(percentage: number): number {
  if (percentage <= 20) return 0
  if (percentage <= 40) return 1
  if (percentage <= 60) return 2
  if (percentage <= 80) return 3
  return 4
}

function getTierLabel(index: number): string {
  return ['SUPPRESS', 'MINIMAL', 'BALANCED', 'ELEVATED', 'DOMINANT'][index]
}

// ============================================================
// UTILITY: Generate Enhanced System Prompt
// ============================================================

export function generateEnhancedSystemPrompt(
  fusionResult: IntelligenceFusionResult,
  weights?: Record<number, number>
): string {
  const lines: string[] = []

  lines.push('=== AI LAYER CONFIGURATION ===')
  lines.push('Your response behavior is calibrated by the following layer settings.')
  lines.push('Each layer has a specific intensity (0-100%). Follow these instructions precisely.')
  lines.push('')

  // Generate behavioral instructions for each layer based on exact percentage
  const layerEntries = Object.entries(LAYER_BEHAVIORS)

  // Sort: highest weight layers first (most impactful instructions come first)
  const sortedLayers = layerEntries
    .map(([layerId, config]) => {
      const w = weights?.[Number(layerId)] ?? 0.5
      const pct = Math.round(w * 100)
      const tierIdx = getTierIndex(pct)
      return { layerId: Number(layerId), config, pct, tierIdx }
    })
    .sort((a, b) => b.pct - a.pct)

  for (const { config, pct, tierIdx } of sortedLayers) {
    const tierLabel = getTierLabel(tierIdx)
    const instruction = config.tiers[tierIdx]

    // Only include layers that deviate from balanced (skip 41-60% range to keep prompt concise)
    // But ALWAYS include if user explicitly set it (non-default)
    if (tierIdx !== 2 || (weights && Object.keys(weights).length > 0)) {
      lines.push(`• ${config.name.toUpperCase()} — ${pct}% [${tierLabel}]`)
      lines.push(`  ${instruction}`)
      lines.push('')
    }
  }

  // Add dominant layers emphasis
  if (fusionResult.dominantLayers.length > 0) {
    const dominantNames = fusionResult.layerActivations
      .filter(s => fusionResult.dominantLayers.includes(s.layerNode))
      .map(s => {
        const aiName = LAYER_BEHAVIORS[s.layerNode]?.name || s.name
        return `${aiName} (${Math.round(s.effectiveWeight * 100)}%)`
      })
    lines.push(`PRIMARY FOCUS: ${dominantNames.join(', ')}`)
    lines.push('')
  }

  // Add methodology
  lines.push(`METHODOLOGY: ${fusionResult.selectedMethodology.toUpperCase()} (${Math.round(fusionResult.confidence * 100)}% confidence)`)

  const topReasons = fusionResult.methodologyScores[0]?.reasons
  if (topReasons?.length) {
    lines.push(`Reasoning: ${topReasons.join(', ')}`)
  }

  // Add Instinct prompt if enabled
  if (fusionResult.instinctPrompt) {
    lines.push('')
    lines.push(fusionResult.instinctPrompt)
  }

  // Add context injection
  if (fusionResult.contextInjection) {
    lines.push('')
    lines.push('CONTEXT FROM PREVIOUS CONVERSATIONS:')
    lines.push(fusionResult.contextInjection)
  }

  return lines.join('\n')
}
