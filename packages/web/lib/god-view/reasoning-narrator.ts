/**
 * Reasoning Narrator
 *
 * Transforms dry metadata into human-readable narrative that explains
 * WHY the AI made each decision, not just WHAT it decided.
 * Runs client-side — no extra API calls.
 */

export interface NarrativeEntry {
  sigil: string
  category: string
  text: string
}

interface ResponseMetadata {
  fusion?: {
    methodology?: string
    confidence?: number
    layerActivations?: Array<{ name: string; effectiveWeight: number; keywords?: string[] }>
    dominantLayers?: string[]
    guardRecommendation?: string
    processingMode?: string
    activeLenses?: string[]
    processingTimeMs?: number
  } | null
  guardResult?: {
    passed?: boolean
    scores?: Record<string, number>
    issues?: string[]
  } | null
  provider?: {
    model?: string
    family?: string
    reasoning?: string
  } | null
  metrics?: {
    totalTokens?: number
    inputTokens?: number
    outputTokens?: number
    latencyMs?: number
    cost?: number
  } | null
  sideCanal?: {
    topicsExtracted?: boolean
    suggestions?: Array<{ topicName?: string }>
    topics?: Array<{ name?: string }>
  } | null
  gnostic?: {
    progressState?: { currentLevel?: number }
    intent?: string
    boundary?: string
  } | null
  query?: string
}

const METHODOLOGY_EXPLANATIONS: Record<string, string> = {
  direct: 'a straightforward factual answer',
  cod: 'step-by-step reasoning to walk through the logic',
  bot: 'structured analysis to break down the components',
  react: 'a multi-step agent approach with tool integration',
  pot: 'mathematical computation to solve this precisely',
  gtp: 'multi-AI consensus to cross-reference viewpoints',
  auto: 'automatic classification to pick the best approach',
}

const LAYER_INSIGHTS: Record<string, string> = {
  reception: 'parsing your input for structure and intent',
  comprehension: 'understanding the deeper semantic meaning',
  context: 'retrieving relevant knowledge and facts',
  articulation: 'crafting a clear, well-structured response',
  synthesis: 'integrating multiple perspectives into a coherent view',
  analysis: 'applying critical thinking and evaluation',
  expansion: 'exploring creative possibilities and novel angles',
  knowledge: 'accessing factual knowledge and verified data',
  reasoning: 'decomposing the problem into logical steps',
  output: 'orchestrating the final response assembly',
  verification: 'self-checking for accuracy and consistency',
}

export function generateReasoningNarrative(meta: ResponseMetadata): NarrativeEntry[] {
  const entries: NarrativeEntry[] = []
  const query = meta.query || ''
  const querySnippet = query.length > 40 ? query.slice(0, 40) + '...' : query

  // 1. QUERY UNDERSTANDING
  if (meta.fusion) {
    const method = meta.fusion.methodology || 'direct'
    const conf = meta.fusion.confidence ? Math.round(meta.fusion.confidence * 100) : 0
    const why = METHODOLOGY_EXPLANATIONS[method] || method
    const keywords = meta.fusion.layerActivations?.[0]?.keywords?.slice(0, 3)
    const keywordNote = keywords?.length ? ` The signals "${keywords.join('", "')}" shaped my routing.` : ''

    entries.push({
      sigil: '◊',
      category: 'QUERY',
      text: `Analyzing "${querySnippet}". Routing through ${method.toUpperCase()} (${conf}% confidence) for ${why}.${keywordNote}`,
    })
  }

  // 2. LAYER ACTIVATION
  if (meta.fusion?.layerActivations && meta.fusion.layerActivations.length > 0) {
    const top = meta.fusion.layerActivations[0]
    const topName = top.name || 'unknown'
    const topWeight = Math.round((top.effectiveWeight || 0) * 100)
    const topInsight = LAYER_INSIGHTS[topName] || 'processing your request'

    let secondLine = ''
    if (meta.fusion.layerActivations.length > 1) {
      const sec = meta.fusion.layerActivations[1]
      const secName = sec.name || 'unknown'
      const secWeight = Math.round((sec.effectiveWeight || 0) * 100)
      const secInsight = LAYER_INSIGHTS[secName] || 'secondary processing'
      secondLine = ` ${secName} (${secWeight}%) provides ${secInsight}.`
    }

    entries.push({
      sigil: '→',
      category: 'LAYERS',
      text: `${topName} is most active (${topWeight}%) — ${topInsight}.${secondLine}`,
    })
  }

  // 3. GUARD ANALYSIS
  if (meta.guardResult) {
    const passed = meta.guardResult.passed !== false
    const scores = meta.guardResult.scores || {}
    const issues = meta.guardResult.issues || []

    const scoreParts: string[] = []
    if (scores.hype != null) scoreParts.push(`hype ${Math.round(scores.hype * 100)}%`)
    if (scores.echo != null) scoreParts.push(`echo ${Math.round(scores.echo * 100)}%`)
    if (scores.drift != null) scoreParts.push(`drift ${Math.round(scores.drift * 100)}%`)
    if (scores.fact != null) scoreParts.push(`fact ${Math.round(scores.fact * 100)}%`)

    const scoreText = scoreParts.length > 0 ? scoreParts.join(', ') : 'all clear'

    if (passed && issues.length === 0) {
      entries.push({
        sigil: '△',
        category: 'GUARD',
        text: `Guard passed cleanly (${scoreText}). The response is grounded in verifiable reasoning.`,
      })
    } else if (passed && issues.length > 0) {
      entries.push({
        sigil: '△',
        category: 'GUARD',
        text: `Guard passed with notes: ${issues.join('; ')}. Scores: ${scoreText}.`,
      })
    } else {
      entries.push({
        sigil: '△',
        category: 'GUARD',
        text: `Guard flagged concerns: ${issues.join('; ')}. Scores: ${scoreText}. Response was refined.`,
      })
    }
  }

  // 4. CONTEXT
  const topicNames = meta.sideCanal?.topics?.map(t => t.name).filter(Boolean) || []
  const suggestionCount = meta.sideCanal?.suggestions?.length || 0

  if (topicNames.length > 0 || meta.sideCanal?.topicsExtracted) {
    const topicText = topicNames.length > 0
      ? `Extracted topics: "${topicNames.slice(0, 3).join('", "')}".`
      : 'Topics extracted from conversation context.'
    const suggestionText = suggestionCount > 0
      ? ` Found ${suggestionCount} related suggestions for deeper exploration.`
      : ''

    entries.push({
      sigil: '◇',
      category: 'CONTEXT',
      text: `${topicText}${suggestionText}`,
    })
  }

  // 5. PERFORMANCE
  if (meta.metrics || meta.provider) {
    const tokens = meta.metrics?.totalTokens || 0
    const latency = meta.metrics?.latencyMs ? (meta.metrics.latencyMs / 1000).toFixed(1) : null
    const cost = meta.metrics?.cost
    const model = meta.provider?.model || meta.fusion?.processingMode || 'unknown'
    const modelShort = model.replace(/^meta-llama\//, '').replace(/:free$/, '')

    const costText = cost && cost > 0 ? `$${cost.toFixed(4)}` : '$0.00 (free tier)'
    const latencyText = latency ? ` in ${latency}s` : ''

    entries.push({
      sigil: '○',
      category: 'PERFORMANCE',
      text: `${tokens.toLocaleString()} tokens${latencyText} at ${costText} via ${modelShort}.`,
    })
  }

  return entries
}
