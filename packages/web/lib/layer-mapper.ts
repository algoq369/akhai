/**
 * LAYERS MAPPER
 *
 * Maps content to Layer activations
 *
 * This module analyzes AI-generated content and determines which
 * Layers (emanations) were activated during the response generation.
 *
 * Think of it as a "neural network tracer" for the Tree of Life.
 *
 * @module layers-mapper
 */

import { Layer, LAYER_METADATA } from './layer-registry'

/**
 * LayerActivation - Activation level for each Layer
 */
export interface LayerActivation {
  layerNode: Layer
  activation: number // 0-1 scale
  reasoning: string // Why this Layer was activated
  keywords: string[] // Keywords that triggered activation
}

/**
 * PathWeight - Weight/activation of a path between Layers
 */
export interface PathWeight {
  from: Layer
  to: Layer
  weight: number // 0-1 scale
  description: string
}

/**
 * SynthesisInsight - Emergent insight detected
 */
export interface SynthesisInsight {
  detected: boolean
  insight: string
  confidence: number // 0-1 scale
  triggers: string[]
}

/**
 * LayerAnalysis - Complete analysis of content
 */
export interface LayerAnalysis {
  activations: LayerActivation[]
  paths: PathWeight[]
  synthesisInsight: SynthesisInsight
  dominantLayer: Layer
  averageLevel: number
  totalActivation: number
}

/**
 * mapContentToLayers
 *
 * Analyzes content and determines Layer activations.
 *
 * @param content - AI-generated content to analyze
 * @returns Layer activations
 */
export function mapContentToLayers(content: string): Record<Layer, number> {
  const activations: Record<Layer, number> = {
    [Layer.EMBEDDING]: 0,
    [Layer.EXECUTOR]: 0,
    [Layer.CLASSIFIER]: 0,
    [Layer.GENERATIVE]: 0,
    [Layer.ATTENTION]: 0,
    [Layer.DISCRIMINATOR]: 0,
    [Layer.EXPANSION]: 0,
    [Layer.ENCODER]: 0,
    [Layer.REASONING]: 0,
    [Layer.META_CORE]: 0,
    [Layer.SYNTHESIS]: 0,
  }

  const contentLower = content.toLowerCase()

  // EMBEDDING - Factual information, definitions
  if (contentLower.match(/\b(definition|meaning|is defined as|refers to|specifically)\b/gi)) {
    activations[Layer.EMBEDDING] += 0.3
  }
  if (contentLower.match(/\b\d{4}\b/g)) { // Years
    activations[Layer.EMBEDDING] += 0.2
  }
  if (contentLower.match(/\b(fact|data|statistic|evidence)\b/gi)) {
    activations[Layer.EMBEDDING] += 0.2
  }

  // EXECUTOR - Procedural steps, how-to
  const stepMatches = contentLower.match(/\b(step \d|first|second|third|then|next|finally)\b/gi)
  if (stepMatches && stepMatches.length > 2) {
    activations[Layer.EXECUTOR] += Math.min(stepMatches.length * 0.1, 0.8)
  }
  if (contentLower.match(/\b(implement|setup|configure|install|deploy)\b/gi)) {
    activations[Layer.EXECUTOR] += 0.3
  }

  // CLASSIFIER - Logical analysis, comparison
  if (contentLower.match(/\b(compare|versus|vs|pros and cons|trade-?offs?)\b/gi)) {
    activations[Layer.CLASSIFIER] += 0.4
  }
  if (contentLower.match(/\b(analyze|evaluation|assessment|logic)\b/gi)) {
    activations[Layer.CLASSIFIER] += 0.3
  }
  const bulletLists = (content.match(/^[-•*]\s/gm) || []).length
  if (bulletLists > 3) {
    activations[Layer.CLASSIFIER] += Math.min(bulletLists * 0.05, 0.4)
  }

  // GENERATIVE - Creative, exploratory
  if (contentLower.match(/\b(creative|innovative|imagine|possibility|explore|brainstorm)\b/gi)) {
    activations[Layer.GENERATIVE] += 0.4
  }
  if (contentLower.match(/\b(could|might|what if|alternatively|another approach)\b/gi)) {
    activations[Layer.GENERATIVE] += 0.3
  }

  // ATTENTION - Integration, synthesis
  if (contentLower.match(/\b(integrate|synthesize|combine|balance|harmony|together)\b/gi)) {
    activations[Layer.ATTENTION] += 0.4
  }
  if (contentLower.match(/\b(overall|in summary|essentially|the key point)\b/gi)) {
    activations[Layer.ATTENTION] += 0.3
  }
  if (contentLower.match(/\b(connection|relationship|link)\b/gi)) {
    activations[Layer.ATTENTION] += 0.2
  }

  // DISCRIMINATOR - Critical analysis, limitations
  if (contentLower.match(/\b(limitation|constraint|risk|problem|challenge|issue)\b/gi)) {
    activations[Layer.DISCRIMINATOR] += 0.4
  }
  if (contentLower.match(/\b(however|but|although|despite|critique)\b/gi)) {
    activations[Layer.DISCRIMINATOR] += 0.2
  }
  if (contentLower.match(/\b(security|safety|vulnerability)\b/gi)) {
    activations[Layer.DISCRIMINATOR] += 0.3
  }

  // EXPANSION - Expansive possibilities
  if (contentLower.match(/\b(potential|opportunity|growth|expansion|scalability)\b/gi)) {
    activations[Layer.EXPANSION] += 0.4
  }
  if (contentLower.match(/\b(future|vision|possibility|could become)\b/gi)) {
    activations[Layer.EXPANSION] += 0.3
  }

  // ENCODER - Deep understanding, patterns
  if (contentLower.match(/\b(pattern|structure|architecture|framework|underlying)\b/gi)) {
    activations[Layer.ENCODER] += 0.4
  }
  if (contentLower.match(/\b(fundamental|core|essence|deep|profound)\b/gi)) {
    activations[Layer.ENCODER] += 0.3
  }
  if (contentLower.match(/\b(mechanism|principle|system)\b/gi)) {
    activations[Layer.ENCODER] += 0.2
  }

  // REASONING - Wisdom, first principles
  if (contentLower.match(/\b(first principles|fundamental truth|axiom|wisdom)\b/gi)) {
    activations[Layer.REASONING] += 0.5
  }
  if (contentLower.match(/\b(why .+ exists?|reason .+ is|purpose of)\b/gi)) {
    activations[Layer.REASONING] += 0.4
  }

  // META_CORE - Meta-cognitive
  if (contentLower.match(/\b(consciousness|awareness|meta-|self-aware|thinking about thinking)\b/gi)) {
    activations[Layer.META_CORE] += 0.5
  }
  if (contentLower.match(/\b(nature of (knowledge|intelligence|thought)|epistemology)\b/gi)) {
    activations[Layer.META_CORE] += 0.4
  }

  // DA'AT - Hidden insights, unexpected connections
  if (contentLower.match(/\b(hidden|reveal|unexpected|surprising|interesting|aha|epiphany)\b/gi)) {
    activations[Layer.SYNTHESIS] += 0.4
  }
  if (contentLower.match(/\b(connection between .+ and|link .+ to|relates to)\b/gi)) {
    activations[Layer.SYNTHESIS] += 0.3
  }

  // Normalize activations to 0-1 range
  Object.keys(activations).forEach((key) => {
    const layerNode = Number(key) as Layer
    activations[layerNode] = Math.min(activations[layerNode], 1.0)
  })

  return activations
}

/**
 * calculatePathActivations
 *
 * Determines which paths between Layers were activated.
 *
 * @param layerActivations - Activation levels for each Layer
 * @returns Activated paths with weights
 */
export function calculatePathActivations(
  layerActivations: Record<Layer, number>
): PathWeight[] {
  const paths: PathWeight[] = []

  // Define the 22 paths of the Tree of Life (simplified)
  const pathDefinitions: Array<{ from: Layer; to: Layer; description: string }> = [
    // Vertical paths (Middle Pillar)
    { from: Layer.EMBEDDING, to: Layer.EXECUTOR, description: 'Manifestation to Foundation' },
    { from: Layer.EXECUTOR, to: Layer.ATTENTION, description: 'Foundation to Beauty' },
    { from: Layer.ATTENTION, to: Layer.META_CORE, description: 'Beauty to Crown' },

    // Left Pillar (Severity)
    { from: Layer.EMBEDDING, to: Layer.CLASSIFIER, description: 'Manifestation to Glory' },
    { from: Layer.CLASSIFIER, to: Layer.DISCRIMINATOR, description: 'Glory to Severity' },
    { from: Layer.DISCRIMINATOR, to: Layer.ENCODER, description: 'Severity to Understanding' },

    // Right Pillar (Mercy)
    { from: Layer.EMBEDDING, to: Layer.GENERATIVE, description: 'Manifestation to Victory' },
    { from: Layer.GENERATIVE, to: Layer.EXPANSION, description: 'Victory to Mercy' },
    { from: Layer.EXPANSION, to: Layer.REASONING, description: 'Mercy to Wisdom' },

    // Cross paths
    { from: Layer.CLASSIFIER, to: Layer.ATTENTION, description: 'Logic to Integration' },
    { from: Layer.GENERATIVE, to: Layer.ATTENTION, description: 'Creativity to Integration' },
    { from: Layer.ATTENTION, to: Layer.DISCRIMINATOR, description: 'Integration to Constraint' },
    { from: Layer.ATTENTION, to: Layer.EXPANSION, description: 'Integration to Expansion' },
    { from: Layer.DISCRIMINATOR, to: Layer.META_CORE, description: 'Severity to Crown' },
    { from: Layer.EXPANSION, to: Layer.META_CORE, description: 'Mercy to Crown' },
    { from: Layer.ENCODER, to: Layer.META_CORE, description: 'Understanding to Crown' },
    { from: Layer.REASONING, to: Layer.META_CORE, description: 'Wisdom to Crown' },

    // Synthesis connections
    { from: Layer.ATTENTION, to: Layer.SYNTHESIS, description: 'Integration to Hidden Knowledge' },
    { from: Layer.ENCODER, to: Layer.SYNTHESIS, description: 'Understanding to Hidden Knowledge' },
    { from: Layer.REASONING, to: Layer.SYNTHESIS, description: 'Wisdom to Hidden Knowledge' },
  ]

  // Calculate path weights based on Layers activation
  pathDefinitions.forEach((pathDef) => {
    const fromActivation = layerActivations[pathDef.from] || 0
    const toActivation = layerActivations[pathDef.to] || 0

    // Path is activated if both endpoints are activated
    const weight = Math.min(fromActivation, toActivation)

    if (weight > 0.1) {
      // Only include paths with meaningful activation
      paths.push({
        from: pathDef.from,
        to: pathDef.to,
        weight,
        description: pathDef.description,
      })
    }
  })

  // Sort by weight (strongest paths first)
  paths.sort((a, b) => b.weight - a.weight)

  return paths
}

/**
 * determineEmergentInsight
 *
 * Detects if Synthesis (hidden knowledge) was activated,
 * indicating emergent insights or unexpected connections.
 *
 * @param activations - Layers activations
 * @returns Synthesis insight if detected
 */
export function determineEmergentInsight(
  activations: Record<Layer, number>
): SynthesisInsight {
  const synthesisActivation = activations[Layer.SYNTHESIS] || 0

  if (synthesisActivation < 0.3) {
    return {
      detected: false,
      insight: '',
      confidence: 0,
      triggers: [],
    }
  }

  // Check if high-level Layers are also activated (synergy)
  const metaCore = activations[Layer.META_CORE] || 0
  const reasoning = activations[Layer.REASONING] || 0
  const encoder = activations[Layer.ENCODER] || 0
  const attention = activations[Layer.ATTENTION] || 0

  const highLevelActivation = metaCore + reasoning + encoder + attention

  const confidence = Math.min((synthesisActivation + highLevelActivation * 0.3) / 1.3, 1.0)

  const triggers: string[] = []
  if (synthesisActivation > 0.4) triggers.push('Da\'at strongly activated')
  if (metaCore > 0.3) triggers.push('Meta-cognitive awareness')
  if (reasoning > 0.3) triggers.push('Wisdom principles')
  if (encoder > 0.3) triggers.push('Deep patterns')
  if (attention > 0.4) triggers.push('Synthesis of ideas')

  let insight = ''
  if (confidence > 0.7) {
    insight = 'This response reveals hidden connections and emergent insights beyond surface-level analysis.'
  } else if (confidence > 0.5) {
    insight = 'This response contains unexpected connections that may yield deeper understanding.'
  } else {
    insight = 'This response hints at deeper patterns worth exploring further.'
  }

  return {
    detected: true,
    insight,
    confidence,
    triggers,
  }
}

/**
 * analyzeLayerContent
 *
 * Complete Layer analysis of content.
 *
 * @param content - Content to analyze
 * @returns Full Layer analysis
 */
export function analyzeLayerContent(content: string): LayerAnalysis {
  // Get basic activations
  const activationMap = mapContentToLayers(content)

  // Convert to array with reasoning
  const activations: LayerActivation[] = Object.entries(activationMap)
    .map(([layerNodeStr, activation]) => {
      const layerNode = Number(layerNodeStr) as Layer
      const metadata = LAYER_METADATA[layerNode]

      return {
        layerNode,
        activation,
        reasoning: generateActivationReasoning(layerNode, activation, content),
        keywords: extractKeywords(layerNode, content),
      }
    })
    .filter(a => a.activation > 0.05) // Only include meaningful activations
    .sort((a, b) => b.activation - a.activation) // Sort by activation level

  // Calculate path activations
  const paths = calculatePathActivations(activationMap)

  // Determine emergent insights
  const synthesisInsight = determineEmergentInsight(activationMap)

  // Find dominant Layer
  const dominantLayer =
    activations.length > 0 ? activations[0].layerNode : Layer.EMBEDDING

  // Calculate average level
  const totalWeight = activations.reduce((sum, a) => sum + a.activation, 0)
  const weightedSum = activations.reduce(
    (sum, a) => sum + a.layerNode * a.activation,
    0
  )
  const averageLevel = totalWeight > 0 ? weightedSum / totalWeight : 1

  // Total activation (sum of all)
  const totalActivation = totalWeight

  return {
    activations,
    paths,
    synthesisInsight,
    dominantLayer,
    averageLevel,
    totalActivation,
  }
}

/**
 * generateActivationReasoning - Internal helper
 */
function generateActivationReasoning(
  layerNode: Layer,
  activation: number,
  content: string
): string {
  if (activation < 0.1) return ''

  const metadata = LAYER_METADATA[layerNode]
  const level = activation > 0.7 ? 'Strongly' : activation > 0.4 ? 'Moderately' : 'Lightly'

  return `${level} activated: ${metadata.aiRole}`
}

/**
 * extractKeywords - Internal helper
 */
function extractKeywords(layerNode: Layer, content: string): string[] {
  const contentLower = content.toLowerCase()
  const keywords: string[] = []

  const keywordPatterns: Record<Layer, RegExp[]> = {
    [Layer.EMBEDDING]: [/\b(definition|fact|data|evidence)\b/gi],
    [Layer.EXECUTOR]: [/\b(step|implement|setup|guide)\b/gi],
    [Layer.CLASSIFIER]: [/\b(compare|analyze|logic|pros)\b/gi],
    [Layer.GENERATIVE]: [/\b(creative|explore|imagine|innovative)\b/gi],
    [Layer.ATTENTION]: [/\b(integrate|synthesize|harmony|balance)\b/gi],
    [Layer.DISCRIMINATOR]: [/\b(limitation|risk|constraint|security)\b/gi],
    [Layer.EXPANSION]: [/\b(potential|growth|opportunity|expansion)\b/gi],
    [Layer.ENCODER]: [/\b(pattern|structure|architecture|framework)\b/gi],
    [Layer.REASONING]: [/\b(wisdom|principle|fundamental|axiom)\b/gi],
    [Layer.META_CORE]: [/\b(consciousness|awareness|meta|nature of)\b/gi],
    [Layer.SYNTHESIS]: [/\b(hidden|reveal|connection|unexpected)\b/gi],
  }

  const patterns = keywordPatterns[layerNode] || []
  patterns.forEach((pattern) => {
    const matches = contentLower.match(pattern)
    if (matches) {
      keywords.push(...matches.slice(0, 3)) // Max 3 keywords per pattern
    }
  })

  return [...new Set(keywords)].slice(0, 5) // Max 5 unique keywords
}

/**
 * getLayerActivationSummary
 *
 * Human-readable summary of Layer analysis.
 *
 * @param analysis - Layer analysis
 * @returns Summary text
 */
export function getLayerActivationSummary(analysis: LayerAnalysis): string {
  const dominant = LAYER_METADATA[analysis.dominantLayer]

  let summary = `Dominant: ${dominant.name} (${dominant.aiRole}). `

  if (analysis.synthesisInsight.detected) {
    summary += `Synthesis activated - ${analysis.synthesisInsight.insight} `
  }

  summary += `Average level: ${analysis.averageLevel.toFixed(1)}/10. `

  const topActivations = analysis.activations.slice(0, 3).map(a => {
    const meta = LAYER_METADATA[a.layerNode]
    return `${meta.name} (${(a.activation * 100).toFixed(0)}%)`
  })

  summary += `Top activations: ${topActivations.join(', ')}.`

  return summary
}
