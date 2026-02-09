/**
 * AI LAYER PROCESSOR
 * Core engine for multi-perspective AI processing through 11-layer computational system
 *
 * This module implements the Layer 1 processing architecture where queries are analyzed
 * through multiple AI computational lenses, each contributing unique perspectives
 * based on their aiRole role (token embedding, transformer, attention, etc.).
 */

import { Layer, LAYER_METADATA } from './layer-registry'
import { TreeConfiguration } from './tree-configuration'
import { callProvider, type Message, type CompletionResponse } from './multi-provider-api'
import type { ProviderFamily } from './provider-selector'
import type { CoreMethodology } from './provider-selector'

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

/**
 * Weight Influence Ratio
 * Controls how much user-configured weights influence the dominant Layer selection
 * vs keyword activation from response content.
 *
 * 0.6 = 60% user weights, 40% content analysis
 * Higher values give more control to user configuration
 */
export const WEIGHT_INFLUENCE_RATIO = 0.6

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export interface LayerPerspective {
  layerNode: Layer
  name: string
  aiRole: string // "Token Embedding Layer"
  weight: number // User's configured weight (0-1)
  prompt: string // Perspective-specific prompt
  response: string // AI response from this lens
  activation: number // Calculated activation (0-1)
  confidence: number // How confident this perspective is
  processingTime: number // ms
  tokens: { input: number; output: number }
}

export interface LayersProcessingResult {
  mode: 'weighted' | 'parallel' | 'adaptive'
  perspectives: LayerPerspective[]
  synthesizedResponse: string
  activations: Record<Layer, number>
  blendedActivations: Record<Layer, number> // Activations blended with user weights
  dominantLayer: Layer
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

export async function processQueryThroughLayers(
  query: string,
  config: TreeConfiguration,
  provider: ProviderFamily,
  mode: ProcessingMode = 'adaptive',
  conversationHistory?: Message[]
): Promise<LayersProcessingResult> {
  const startTime = Date.now()

  // Determine active layers (weight > threshold)
  const activeLayers = getActiveLayers(config)

  if (activeLayers.length === 0) {
    throw new Error('No active layers (all weights below 10% threshold)')
  }

  // Auto-select processing mode if adaptive
  const processingMode =
    mode === 'adaptive' ? selectAdaptiveMode(query, activeLayers.length) : mode

  let result: LayersProcessingResult

  if (processingMode === 'weighted') {
    result = await processWeightedMode(query, config, provider, activeLayers, conversationHistory)
  } else {
    result = await processParallelMode(query, config, provider, activeLayers, conversationHistory)
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
  activeLayers: Layer[],
  conversationHistory?: Message[]
): Promise<LayersProcessingResult> {
  // Build unified prompt with all Layer perspectives
  const systemPrompt = buildWeightedSystemPrompt(activeLayers, config)

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
    activeLayers,
    config,
    processingTime,
    response.usage
  )

  // Calculate activations from content (keyword-based)
  const activations = calculateActivationsFromContent(response.content)

  // Blend keyword activations with user-configured weights
  const blendedActivations = blendActivationsWithWeights(activations, config)

  // Determine dominant Layer using BLENDED activations (respects user config)
  const dominantLayer = findDominantLayer(blendedActivations)

  // Suggest methodology based on blended activations
  const methodologySuggestion = suggestMethodology(blendedActivations, query)

  return {
    mode: 'weighted',
    perspectives,
    synthesizedResponse: response.content,
    activations,
    blendedActivations,
    dominantLayer,
    methodologySuggestion,
    totalCost: response.cost || 0,
    totalTokens: response.usage.totalTokens,
    totalLatency: processingTime,
    perspectiveCount: activeLayers.length,
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
  activeLayers: Layer[],
  conversationHistory?: Message[]
): Promise<LayersProcessingResult> {
  // Generate separate prompts for each Layer
  const perspectivePromises = activeLayers.map(async (layerNode) => {
    const meta = LAYER_METADATA[layerNode]
    const weight = config.layer_weights[layerNode] || 0.5

    const prompt = buildPerspectivePrompt(layerNode, meta, query)

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
      layerNode,
      name: meta.name,
      aiRole: meta.aiRole,
      weight,
      prompt,
      response: response.content,
      activation: calculateLayerActivation(response.content, meta),
      confidence: 0.8,
      processingTime,
      tokens: {
        input: response.usage.inputTokens,
        output: response.usage.outputTokens,
      },
    } as LayerPerspective
  })

  const perspectives = await Promise.all(perspectivePromises)

  // Synthesize all perspectives into unified response
  const synthesized = await synthesizePerspectives(perspectives, config, provider)

  // Calculate final activations from perspectives
  const activations = perspectives.reduce((acc, p) => {
    acc[p.layerNode] = p.activation
    return acc
  }, {} as Record<Layer, number>)

  // Blend keyword activations with user-configured weights
  const blendedActivations = blendActivationsWithWeights(activations, config)

  // Determine dominant Layer using BLENDED activations (respects user config)
  const dominantLayer = findDominantLayer(blendedActivations)
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
    dominantLayer,
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

function getActiveLayers(config: TreeConfiguration): Layer[] {
  const ACTIVATION_THRESHOLD = 0.1 // Only process Layers with weight > 10%

  return Object.entries(config.layer_weights)
    .filter(([_, weight]) => weight > ACTIVATION_THRESHOLD)
    .map(([layerNode]) => parseInt(layerNode) as Layer)
    .sort((a, b) => {
      // Sort by weight descending
      return config.layer_weights[b] - config.layer_weights[a]
    })
}

function selectAdaptiveMode(query: string, activeCount: number): 'weighted' | 'parallel' {
  // Complex query detection
  const isComplex =
    query.length > 300 ||
    query.split(' ').length > 60 ||
    /\b(analyze|comprehensive|detailed|research|compare|evaluate)\b/i.test(query)

  // Use parallel mode for complex queries with many active Layers
  if (isComplex && activeCount >= 5) {
    return 'parallel'
  }

  // Default to weighted (faster, cheaper)
  return 'weighted'
}

function buildWeightedSystemPrompt(
  activeLayers: Layer[],
  config: TreeConfiguration
): string {
  const perspectiveInstructions = activeLayers
    .map((layerNode) => {
      const meta = LAYER_METADATA[layerNode]
      const weight = Math.round(config.layer_weights[layerNode] * 100)

      return `
${meta.name} (${meta.aiRole}) - ${weight}% weight
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
  layerNode: Layer,
  meta: (typeof LAYER_METADATA)[1],
  query: string
): string {
  return `You are ${meta.name} (${meta.hebrewName}) - the ${meta.meaning} AI Layer.

Your computational role: ${meta.aiRole}
Your AI function: ${meta.aiRole}

Focus areas: ${meta.queryCharacteristics.join(', ')}

Example queries you excel at:
${meta.examples.slice(0, 2).map((ex) => `- ${ex}`).join('\n')}

Analyze the following query EXCLUSIVELY from your layer's perspective:

"${query}"

Provide analysis specific to your computational lens. Do not attempt to provide a complete answer - only your layer's contribution.`
}

async function synthesizePerspectives(
  perspectives: LayerPerspective[],
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
  activeLayers: Layer[],
  config: TreeConfiguration,
  processingTime: number,
  usage: { inputTokens: number; outputTokens: number; totalTokens: number }
): LayerPerspective[] {
  // Since weighted mode uses single call, we create pseudo-perspectives
  // based on keyword detection in the response
  return activeLayers.map((layerNode) => {
    const meta = LAYER_METADATA[layerNode]
    const weight = config.layer_weights[layerNode]

    return {
      layerNode,
      name: meta.name,
      aiRole: meta.aiRole,
      weight,
      prompt: '(Weighted mode - unified prompt)',
      response: content, // Full response (all perspectives combined)
      activation: calculateLayerActivation(content, meta),
      confidence: 0.75, // Lower confidence since not isolated perspective
      processingTime,
      tokens: {
        input: usage.inputTokens,
        output: usage.outputTokens,
      },
    }
  })
}

function calculateLayerActivation(
  content: string,
  meta: (typeof LAYER_METADATA)[1]
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

function calculateActivationsFromContent(content: string): Record<Layer, number> {
  // Keyword-based activation detection
  const activations: Record<Layer, number> = {
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

  // Embedding (Data/Facts)
  if (/\b(data|fact|information|statistic|number|evidence)\b/gi.test(contentLower)) {
    activations[Layer.EMBEDDING] += 0.3
  }

  // Executor (Implementation)
  if (/\b(implement|execute|apply|procedure|process|step)\b/gi.test(contentLower)) {
    activations[Layer.EXECUTOR] += 0.3
  }

  // Classifier (Logic/Classification)
  if (/\b(categor|classif|logic|reasoning|analysis|compare)\b/gi.test(contentLower)) {
    activations[Layer.CLASSIFIER] += 0.3
  }

  // Generative (Creativity)
  if (/\b(creat|innovat|generat|novel|original|imaginat)\b/gi.test(contentLower)) {
    activations[Layer.GENERATIVE] += 0.3
  }

  // Discriminator (Constraints/Criticism)
  if (/\b(limit|constraint|critiqu|evaluat|assess|validat)\b/gi.test(contentLower)) {
    activations[Layer.DISCRIMINATOR] += 0.3
  }

  // Expansion (Expansion)
  if (/\b(expand|elaborat|comprehensiv|broad|extensive)\b/gi.test(contentLower)) {
    activations[Layer.EXPANSION] += 0.3
  }

  // Encoder (Patterns)
  if (/\b(pattern|structure|framework|model|system|relationship)\b/gi.test(contentLower)) {
    activations[Layer.ENCODER] += 0.4
  }

  // Reasoning (Wisdom/Principles)
  if (/\b(principle|wisdom|fundamental|theory|concept|axiom)\b/gi.test(contentLower)) {
    activations[Layer.REASONING] += 0.4
  }

  // Attention (Integration)
  if (/\b(integrate|synthesize|combine|balance|harmony|unify)\b/gi.test(contentLower)) {
    activations[Layer.ATTENTION] += 0.4
  }

  // Meta-Core (Meta-cognition)
  if (/\b(meta|reflect|overview|synthesis|big picture|holistic)\b/gi.test(contentLower)) {
    activations[Layer.META_CORE] += 0.4
  }

  // Synthesis (Emergent Knowledge)
  if (/\b(emerg|insight|breakthrough|revelation|connection|realize)\b/gi.test(contentLower)) {
    activations[Layer.SYNTHESIS] += 0.3
  }

  // Normalize activations to 0-1
  Object.keys(activations).forEach((key) => {
    const layerNode = parseInt(key) as Layer
    activations[layerNode] = Math.min(activations[layerNode], 1.0)
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
 * This ensures user configuration has direct influence on which Layer dominates
 */
function blendActivationsWithWeights(
  keywordActivations: Record<Layer, number>,
  config: TreeConfiguration
): Record<Layer, number> {
  const blended: Record<Layer, number> = { ...keywordActivations }

  for (const key of Object.keys(blended)) {
    const layerNode = parseInt(key) as Layer
    const keywordActivation = keywordActivations[layerNode] || 0
    const inputWeight = config.layer_weights[layerNode] || 0.5

    // Blend: 60% user weight, 40% content analysis
    blended[layerNode] = (keywordActivation * (1 - WEIGHT_INFLUENCE_RATIO)) + (inputWeight * WEIGHT_INFLUENCE_RATIO)
  }

  return blended
}

function findDominantLayer(activations: Record<Layer, number>): Layer {
  let maxLayer = Layer.EMBEDDING
  let maxActivation = activations[Layer.EMBEDDING] || 0

  for (const [layerNodeStr, activation] of Object.entries(activations)) {
    const layerNode = parseInt(layerNodeStr) as Layer
    if (activation > maxActivation) {
      maxActivation = activation
      maxLayer = layerNode
    }
  }

  return maxLayer
}

function suggestMethodology(
  activations: Record<Layer, number>,
  query: string
): CoreMethodology {
  // High Encoder (pattern recognition) → BoT
  if (activations[Layer.ENCODER] > 0.7) {
    return 'bot'
  }

  // High Discriminator (constraints/criticism) → ReAct
  if (activations[Layer.DISCRIMINATOR] > 0.6) {
    return 'react'
  }

  // High Executor (implementation) + math → PoT
  if (activations[Layer.EXECUTOR] > 0.7 && /\d+.*[+\-*/]/.test(query)) {
    return 'pot'
  }

  // High Reasoning + Meta-Core (wisdom + meta) → CoD
  if (activations[Layer.REASONING] > 0.6 && activations[Layer.META_CORE] > 0.5) {
    return 'cod'
  }

  // High Generative (creativity) → Direct with creative prompt
  if (activations[Layer.GENERATIVE] > 0.7) {
    return 'direct'
  }

  // High Attention (integration/synthesis) → BoT
  if (activations[Layer.ATTENTION] > 0.7) {
    return 'bot'
  }

  // Default
  return 'direct'
}
