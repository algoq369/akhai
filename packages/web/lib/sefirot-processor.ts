/**
 * AI LAYER PROCESSOR
 * Core engine for multi-perspective AI processing through 11-layer computational system
 *
 * This module implements the Layer 1 processing architecture where queries are analyzed
 * through multiple AI computational lenses, each contributing unique perspectives
 * based on their aiComputation role (token embedding, transformer, attention, etc.).
 */

import { Sefirah, SEPHIROTH_METADATA } from './ascent-tracker'
import { TreeConfiguration } from './tree-configuration'
import { callProvider, type Message, type CompletionResponse } from './multi-provider-api'
import type { ProviderFamily } from './provider-selector'
import type { CoreMethodology } from './provider-selector'

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Weight Influence Ratio
 * Controls how much user-configured weights influence the dominant Sefirah selection
 * vs keyword activation from response content.
 *
 * 0.6 = 60% user weights, 40% content analysis
 * Higher values give more control to user configuration
 */
export const WEIGHT_INFLUENCE_RATIO = 0.6

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export interface SefirahPerspective {
  sefirah: Sefirah
  name: string
  aiComputation: string // "Token Embedding Layer"
  weight: number // User's configured weight (0-1)
  prompt: string // Perspective-specific prompt
  response: string // AI response from this lens
  activation: number // Calculated activation (0-1)
  confidence: number // How confident this perspective is
  processingTime: number // ms
  tokens: { input: number; output: number }
}

export interface SefirotProcessingResult {
  mode: 'weighted' | 'parallel' | 'adaptive'
  perspectives: SefirahPerspective[]
  synthesizedResponse: string
  activations: Record<Sefirah, number>
  blendedActivations: Record<Sefirah, number> // Activations blended with user weights
  dominantSefirah: Sefirah
  methodologySuggestion: CoreMethodology
  totalCost: number
  totalTokens: number
  totalLatency: number
  perspectiveCount: number
  weightInfluenceRatio: number // How much user weights influenced dominant selection
}

export type ProcessingMode = 'weighted' | 'parallel' | 'adaptive'

// ═══════════════════════════════════════════
// MAIN PROCESSOR
// ═══════════════════════════════════════════

export async function processQueryThroughSefirot(
  query: string,
  config: TreeConfiguration,
  provider: ProviderFamily,
  mode: ProcessingMode = 'adaptive',
  conversationHistory?: Message[]
): Promise<SefirotProcessingResult> {
  const startTime = Date.now()

  // Determine active layers (weight > threshold)
  const activeSephiroth = getActiveSephiroth(config)

  if (activeSephiroth.length === 0) {
    throw new Error('No active layers (all weights below 10% threshold)')
  }

  // Auto-select processing mode if adaptive
  const processingMode =
    mode === 'adaptive' ? selectAdaptiveMode(query, activeSephiroth.length) : mode

  let result: SefirotProcessingResult

  if (processingMode === 'weighted') {
    result = await processWeightedMode(query, config, provider, activeSephiroth, conversationHistory)
  } else {
    result = await processParallelMode(query, config, provider, activeSephiroth, conversationHistory)
  }

  result.totalLatency = Date.now() - startTime

  return result
}

// ═══════════════════════════════════════════
// WEIGHTED MODE (Single AI Call)
// ═══════════════════════════════════════════

async function processWeightedMode(
  query: string,
  config: TreeConfiguration,
  provider: ProviderFamily,
  activeSephiroth: Sefirah[],
  conversationHistory?: Message[]
): Promise<SefirotProcessingResult> {
  // Build unified prompt with all Sefirah perspectives
  const systemPrompt = buildWeightedSystemPrompt(activeSephiroth, config)

  const messages: Message[] = [
    { role: 'system' as const, content: systemPrompt },
    ...(conversationHistory || []),
    { role: 'user' as const, content: query },
  ]

  const startTime = Date.now()
  const response = await callProvider(provider, {
    messages,
    model: 'claude-opus-4-5-20251101',
    maxTokens: 4096,
    temperature: 0.7,
  })

  const processingTime = Date.now() - startTime

  // Parse response to extract perspective contributions
  const perspectives = parseWeightedResponse(
    response.content,
    activeSephiroth,
    config,
    processingTime,
    response.usage
  )

  // Calculate activations from content (keyword-based)
  const activations = calculateActivationsFromContent(response.content)

  // Blend keyword activations with user-configured weights
  const blendedActivations = blendActivationsWithWeights(activations, config)

  // Determine dominant Sefirah using BLENDED activations (respects user config)
  const dominantSefirah = findDominantSefirah(blendedActivations)

  // Suggest methodology based on blended activations
  const methodologySuggestion = suggestMethodology(blendedActivations, query)

  return {
    mode: 'weighted',
    perspectives,
    synthesizedResponse: response.content,
    activations,
    blendedActivations,
    dominantSefirah,
    methodologySuggestion,
    totalCost: response.cost || 0,
    totalTokens: response.usage.totalTokens,
    totalLatency: processingTime,
    perspectiveCount: activeSephiroth.length,
    weightInfluenceRatio: WEIGHT_INFLUENCE_RATIO,
  }
}

// ═══════════════════════════════════════════
// PARALLEL MODE (Multiple AI Calls)
// ═══════════════════════════════════════════

async function processParallelMode(
  query: string,
  config: TreeConfiguration,
  provider: ProviderFamily,
  activeSephiroth: Sefirah[],
  conversationHistory?: Message[]
): Promise<SefirotProcessingResult> {
  // Generate separate prompts for each Sefirah
  const perspectivePromises = activeSephiroth.map(async (sefirah) => {
    const meta = SEPHIROTH_METADATA[sefirah]
    const weight = config.sephiroth_weights[sefirah] || 0.5

    const prompt = buildPerspectivePrompt(sefirah, meta, query)

    const messages: Message[] = [
      { role: 'system' as const, content: prompt },
      ...(conversationHistory || []),
      { role: 'user' as const, content: query },
    ]

    const startTime = Date.now()
    const response = await callProvider(provider, {
      messages,
      model: 'claude-opus-4-5-20251101',
      maxTokens: 1024,
      temperature: 0.7,
    })

    const processingTime = Date.now() - startTime

    return {
      sefirah,
      name: meta.name,
      aiComputation: meta.aiComputation,
      weight,
      prompt,
      response: response.content,
      activation: calculateSefirahActivation(response.content, meta),
      confidence: 0.8,
      processingTime,
      tokens: {
        input: response.usage.inputTokens,
        output: response.usage.outputTokens,
      },
    } as SefirahPerspective
  })

  const perspectives = await Promise.all(perspectivePromises)

  // Synthesize all perspectives into unified response
  const synthesized = await synthesizePerspectives(perspectives, config, provider)

  // Calculate final activations from perspectives
  const activations = perspectives.reduce((acc, p) => {
    acc[p.sefirah] = p.activation
    return acc
  }, {} as Record<Sefirah, number>)

  // Blend keyword activations with user-configured weights
  const blendedActivations = blendActivationsWithWeights(activations, config)

  // Determine dominant Sefirah using BLENDED activations (respects user config)
  const dominantSefirah = findDominantSefirah(blendedActivations)
  const methodologySuggestion = suggestMethodology(blendedActivations, query)

  const totalCost = perspectives.reduce(
    (sum, p) => sum + (p.tokens.input + p.tokens.output) * 0.00001,
    0
  )
  const totalTokens = perspectives.reduce(
    (sum, p) => sum + p.tokens.input + p.tokens.output,
    0
  )

  return {
    mode: 'parallel',
    perspectives,
    synthesizedResponse: synthesized,
    activations,
    blendedActivations,
    dominantSefirah,
    methodologySuggestion,
    totalCost,
    totalTokens,
    totalLatency: Math.max(...perspectives.map((p) => p.processingTime)),
    perspectiveCount: perspectives.length,
    weightInfluenceRatio: WEIGHT_INFLUENCE_RATIO,
  }
}

// ═══════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════

function getActiveSephiroth(config: TreeConfiguration): Sefirah[] {
  const ACTIVATION_THRESHOLD = 0.1 // Only process Sefirot with weight > 10%

  return Object.entries(config.sephiroth_weights)
    .filter(([_, weight]) => weight > ACTIVATION_THRESHOLD)
    .map(([sefirah]) => parseInt(sefirah) as Sefirah)
    .sort((a, b) => {
      // Sort by weight descending
      return config.sephiroth_weights[b] - config.sephiroth_weights[a]
    })
}

function selectAdaptiveMode(query: string, activeCount: number): 'weighted' | 'parallel' {
  // Complex query detection
  const isComplex =
    query.length > 300 ||
    query.split(' ').length > 60 ||
    /\b(analyze|comprehensive|detailed|research|compare|evaluate)\b/i.test(query)

  // Use parallel mode for complex queries with many active Sephiroth
  if (isComplex && activeCount >= 5) {
    return 'parallel'
  }

  // Default to weighted (faster, cheaper)
  return 'weighted'
}

function buildWeightedSystemPrompt(
  activeSephiroth: Sefirah[],
  config: TreeConfiguration
): string {
  const perspectiveInstructions = activeSephiroth
    .map((sefirah) => {
      const meta = SEPHIROTH_METADATA[sefirah]
      const weight = Math.round(config.sephiroth_weights[sefirah] * 100)

      return `
${meta.name} (${meta.aiComputation}) - ${weight}% weight
Role: ${meta.aiRole}
Focus: ${meta.queryCharacteristics.join(', ')}
`
    })
    .join('\n')

  return `You are processing this query through a multi-layer AI reasoning system.

ACTIVE PROCESSING LAYERS:
${perspectiveInstructions}

INSTRUCTIONS:
- Analyze the query from ALL active layers listed above
- Weight each layer's contribution by its percentage
- Integrate insights from all computational lenses
- Show which layers influenced your response

Provide a unified response that synthesizes all layer perspectives, weighted appropriately.`
}

function buildPerspectivePrompt(
  sefirah: Sefirah,
  meta: (typeof SEPHIROTH_METADATA)[1],
  query: string
): string {
  return `You are ${meta.name} (${meta.hebrewName}) - the ${meta.meaning} AI Layer.

Your computational role: ${meta.aiComputation}
Your AI function: ${meta.aiRole}

Focus areas: ${meta.queryCharacteristics.join(', ')}

Example queries you excel at:
${meta.examples.slice(0, 2).map((ex) => `- ${ex}`).join('\n')}

Analyze the following query EXCLUSIVELY from your layer's perspective:

"${query}"

Provide analysis specific to your computational lens. Do not attempt to provide a complete answer - only your layer's contribution.`
}

async function synthesizePerspectives(
  perspectives: SefirahPerspective[],
  config: TreeConfiguration,
  provider: ProviderFamily
): Promise<string> {
  const perspectiveSummaries = perspectives
    .map(
      (p) =>
        `${p.name} (${Math.round(p.weight * 100)}%): ${p.response.slice(0, 300)}...`
    )
    .join('\n\n')

  const synthesisPrompt = `Synthesize these layer perspectives into a unified, coherent response:

${perspectiveSummaries}

Weight each perspective by its percentage. Resolve any conflicts by favoring higher-weighted perspectives. Create a seamless synthesis that preserves key insights from each lens.`

  const response = await callProvider(provider, {
    messages: [{ role: 'user' as const, content: synthesisPrompt }],
    model: 'claude-opus-4-5-20251101',
    maxTokens: 2048,
    temperature: 0.7,
  })

  return response.content
}

function parseWeightedResponse(
  content: string,
  activeSephiroth: Sefirah[],
  config: TreeConfiguration,
  processingTime: number,
  usage: { inputTokens: number; outputTokens: number; totalTokens: number }
): SefirahPerspective[] {
  // Since weighted mode uses single call, we create pseudo-perspectives
  // based on keyword detection in the response
  return activeSephiroth.map((sefirah) => {
    const meta = SEPHIROTH_METADATA[sefirah]
    const weight = config.sephiroth_weights[sefirah]

    return {
      sefirah,
      name: meta.name,
      aiComputation: meta.aiComputation,
      weight,
      prompt: '(Weighted mode - unified prompt)',
      response: content, // Full response (all perspectives combined)
      activation: calculateSefirahActivation(content, meta),
      confidence: 0.75, // Lower confidence since not isolated perspective
      processingTime,
      tokens: {
        input: usage.inputTokens,
        output: usage.outputTokens,
      },
    }
  })
}

function calculateSefirahActivation(
  content: string,
  meta: (typeof SEPHIROTH_METADATA)[1]
): number {
  const contentLower = content.toLowerCase()
  let activation = 0

  // Check for characteristic keywords
  meta.queryCharacteristics.forEach((characteristic) => {
    const keywords = characteristic.toLowerCase().split(/,|\s+/)
    keywords.forEach((keyword) => {
      if (keyword.length > 3 && contentLower.includes(keyword)) {
        activation += 0.15
      }
    })
  })

  // Check aiRole keywords
  const roleKeywords = meta.aiRole.toLowerCase().split(/\s+/)
  roleKeywords.forEach((keyword) => {
    if (keyword.length > 4 && contentLower.includes(keyword)) {
      activation += 0.2
    }
  })

  // Normalize to 0-1
  return Math.min(activation, 1.0)
}

function calculateActivationsFromContent(content: string): Record<Sefirah, number> {
  // Keyword-based activation detection
  const activations: Record<Sefirah, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0,
    9: 0,
    10: 0,
    11: 0,
  }

  const contentLower = content.toLowerCase()

  // Malkuth (Data/Facts)
  if (/\b(data|fact|information|statistic|number|evidence)\b/gi.test(contentLower)) {
    activations[Sefirah.MALKUTH] += 0.3
  }

  // Yesod (Implementation)
  if (/\b(implement|execute|apply|procedure|process|step)\b/gi.test(contentLower)) {
    activations[Sefirah.YESOD] += 0.3
  }

  // Hod (Logic/Classification)
  if (/\b(categor|classif|logic|reasoning|analysis|compare)\b/gi.test(contentLower)) {
    activations[Sefirah.HOD] += 0.3
  }

  // Netzach (Creativity)
  if (/\b(creat|innovat|generat|novel|original|imaginat)\b/gi.test(contentLower)) {
    activations[Sefirah.NETZACH] += 0.3
  }

  // Gevurah (Constraints/Criticism)
  if (/\b(limit|constraint|critiqu|evaluat|assess|validat)\b/gi.test(contentLower)) {
    activations[Sefirah.GEVURAH] += 0.3
  }

  // Chesed (Expansion)
  if (/\b(expand|elaborat|comprehensiv|broad|extensive)\b/gi.test(contentLower)) {
    activations[Sefirah.CHESED] += 0.3
  }

  // Binah (Patterns)
  if (/\b(pattern|structure|framework|model|system|relationship)\b/gi.test(contentLower)) {
    activations[Sefirah.BINAH] += 0.4
  }

  // Chokmah (Wisdom/Principles)
  if (/\b(principle|wisdom|fundamental|theory|concept|axiom)\b/gi.test(contentLower)) {
    activations[Sefirah.CHOKMAH] += 0.4
  }

  // Tiferet (Integration)
  if (/\b(integrate|synthesize|combine|balance|harmony|unify)\b/gi.test(contentLower)) {
    activations[Sefirah.TIFERET] += 0.4
  }

  // Kether (Meta-cognition)
  if (/\b(meta|reflect|overview|synthesis|big picture|holistic)\b/gi.test(contentLower)) {
    activations[Sefirah.KETHER] += 0.4
  }

  // Da'at (Emergent Knowledge)
  if (/\b(emerg|insight|breakthrough|revelation|connection|realize)\b/gi.test(contentLower)) {
    activations[Sefirah.DAAT] += 0.3
  }

  // Normalize activations to 0-1
  Object.keys(activations).forEach((key) => {
    const sefirah = parseInt(key) as Sefirah
    activations[sefirah] = Math.min(activations[sefirah], 1.0)
  })

  return activations
}

/**
 * Blend keyword activations with user-configured weights
 *
 * Formula: blended = (keywordActivation * (1 - ratio)) + (inputWeight * ratio)
 * With WEIGHT_INFLUENCE_RATIO = 0.6:
 *   - 60% comes from user's weight configuration
 *   - 40% comes from content keyword analysis
 *
 * This ensures user configuration has direct influence on which Sefirah dominates
 */
function blendActivationsWithWeights(
  keywordActivations: Record<Sefirah, number>,
  config: TreeConfiguration
): Record<Sefirah, number> {
  const blended: Record<Sefirah, number> = { ...keywordActivations }

  for (const key of Object.keys(blended)) {
    const sefirah = parseInt(key) as Sefirah
    const keywordActivation = keywordActivations[sefirah] || 0
    const inputWeight = config.sephiroth_weights[sefirah] || 0.5

    // Blend: 60% user weight, 40% content analysis
    blended[sefirah] = (keywordActivation * (1 - WEIGHT_INFLUENCE_RATIO)) + (inputWeight * WEIGHT_INFLUENCE_RATIO)
  }

  return blended
}

function findDominantSefirah(activations: Record<Sefirah, number>): Sefirah {
  let maxSefirah = Sefirah.MALKUTH
  let maxActivation = activations[Sefirah.MALKUTH] || 0

  for (const [sefirahStr, activation] of Object.entries(activations)) {
    const sefirah = parseInt(sefirahStr) as Sefirah
    if (activation > maxActivation) {
      maxActivation = activation
      maxSefirah = sefirah
    }
  }

  return maxSefirah
}

function suggestMethodology(
  activations: Record<Sefirah, number>,
  query: string
): CoreMethodology {
  // High Binah (pattern recognition) → BoT
  if (activations[Sefirah.BINAH] > 0.7) {
    return 'bot'
  }

  // High Gevurah (constraints/criticism) → ReAct
  if (activations[Sefirah.GEVURAH] > 0.6) {
    return 'react'
  }

  // High Yesod (implementation) + math → PoT
  if (activations[Sefirah.YESOD] > 0.7 && /\d+.*[+\-*/]/.test(query)) {
    return 'pot'
  }

  // High Chokmah + Kether (wisdom + meta) → CoD
  if (activations[Sefirah.CHOKMAH] > 0.6 && activations[Sefirah.KETHER] > 0.5) {
    return 'cod'
  }

  // High Netzach (creativity) → Direct with creative prompt
  if (activations[Sefirah.NETZACH] > 0.7) {
    return 'direct'
  }

  // High Tiferet (integration/synthesis) → BoT
  if (activations[Sefirah.TIFERET] > 0.7) {
    return 'bot'
  }

  // Default
  return 'direct'
}
