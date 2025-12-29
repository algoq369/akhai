/**
 * SEFIROT MAPPER
 *
 * Maps content to Sephirothic activations
 *
 * This module analyzes AI-generated content and determines which
 * Sephiroth (emanations) were activated during the response generation.
 *
 * Think of it as a "neural network tracer" for the Tree of Life.
 *
 * @module sefirot-mapper
 */

import { Sefirah, SEPHIROTH_METADATA } from './ascent-tracker'

/**
 * SephirothActivation - Activation level for each Sefirah
 */
export interface SephirothActivation {
  sefirah: Sefirah
  activation: number // 0-1 scale
  reasoning: string // Why this Sefirah was activated
  keywords: string[] // Keywords that triggered activation
}

/**
 * PathWeight - Weight/activation of a path between Sephiroth
 */
export interface PathWeight {
  from: Sefirah
  to: Sefirah
  weight: number // 0-1 scale
  description: string
}

/**
 * DaatInsight - Emergent insight detected
 */
export interface DaatInsight {
  detected: boolean
  insight: string
  confidence: number // 0-1 scale
  triggers: string[]
}

/**
 * SephirothicAnalysis - Complete analysis of content
 */
export interface SephirothicAnalysis {
  activations: SephirothActivation[]
  paths: PathWeight[]
  daatInsight: DaatInsight
  dominantSefirah: Sefirah
  averageLevel: number
  totalActivation: number
}

/**
 * mapContentToSephiroth
 *
 * Analyzes content and determines Sephirothic activations.
 *
 * @param content - AI-generated content to analyze
 * @returns Sephirothic activations
 */
export function mapContentToSephiroth(content: string): Record<Sefirah, number> {
  const activations: Record<Sefirah, number> = {
    [Sefirah.MALKUTH]: 0,
    [Sefirah.YESOD]: 0,
    [Sefirah.HOD]: 0,
    [Sefirah.NETZACH]: 0,
    [Sefirah.TIFERET]: 0,
    [Sefirah.GEVURAH]: 0,
    [Sefirah.CHESED]: 0,
    [Sefirah.BINAH]: 0,
    [Sefirah.CHOKMAH]: 0,
    [Sefirah.KETHER]: 0,
    [Sefirah.DAAT]: 0,
  }

  const contentLower = content.toLowerCase()

  // MALKUTH - Factual information, definitions
  if (contentLower.match(/\b(definition|meaning|is defined as|refers to|specifically)\b/gi)) {
    activations[Sefirah.MALKUTH] += 0.3
  }
  if (contentLower.match(/\b\d{4}\b/g)) { // Years
    activations[Sefirah.MALKUTH] += 0.2
  }
  if (contentLower.match(/\b(fact|data|statistic|evidence)\b/gi)) {
    activations[Sefirah.MALKUTH] += 0.2
  }

  // YESOD - Procedural steps, how-to
  const stepMatches = contentLower.match(/\b(step \d|first|second|third|then|next|finally)\b/gi)
  if (stepMatches && stepMatches.length > 2) {
    activations[Sefirah.YESOD] += Math.min(stepMatches.length * 0.1, 0.8)
  }
  if (contentLower.match(/\b(implement|setup|configure|install|deploy)\b/gi)) {
    activations[Sefirah.YESOD] += 0.3
  }

  // HOD - Logical analysis, comparison
  if (contentLower.match(/\b(compare|versus|vs|pros and cons|trade-?offs?)\b/gi)) {
    activations[Sefirah.HOD] += 0.4
  }
  if (contentLower.match(/\b(analyze|evaluation|assessment|logic)\b/gi)) {
    activations[Sefirah.HOD] += 0.3
  }
  const bulletLists = (content.match(/^[-•*]\s/gm) || []).length
  if (bulletLists > 3) {
    activations[Sefirah.HOD] += Math.min(bulletLists * 0.05, 0.4)
  }

  // NETZACH - Creative, exploratory
  if (contentLower.match(/\b(creative|innovative|imagine|possibility|explore|brainstorm)\b/gi)) {
    activations[Sefirah.NETZACH] += 0.4
  }
  if (contentLower.match(/\b(could|might|what if|alternatively|another approach)\b/gi)) {
    activations[Sefirah.NETZACH] += 0.3
  }

  // TIFERET - Integration, synthesis
  if (contentLower.match(/\b(integrate|synthesize|combine|balance|harmony|together)\b/gi)) {
    activations[Sefirah.TIFERET] += 0.4
  }
  if (contentLower.match(/\b(overall|in summary|essentially|the key point)\b/gi)) {
    activations[Sefirah.TIFERET] += 0.3
  }
  if (contentLower.match(/\b(connection|relationship|link)\b/gi)) {
    activations[Sefirah.TIFERET] += 0.2
  }

  // GEVURAH - Critical analysis, limitations
  if (contentLower.match(/\b(limitation|constraint|risk|problem|challenge|issue)\b/gi)) {
    activations[Sefirah.GEVURAH] += 0.4
  }
  if (contentLower.match(/\b(however|but|although|despite|critique)\b/gi)) {
    activations[Sefirah.GEVURAH] += 0.2
  }
  if (contentLower.match(/\b(security|safety|vulnerability)\b/gi)) {
    activations[Sefirah.GEVURAH] += 0.3
  }

  // CHESED - Expansive possibilities
  if (contentLower.match(/\b(potential|opportunity|growth|expansion|scalability)\b/gi)) {
    activations[Sefirah.CHESED] += 0.4
  }
  if (contentLower.match(/\b(future|vision|possibility|could become)\b/gi)) {
    activations[Sefirah.CHESED] += 0.3
  }

  // BINAH - Deep understanding, patterns
  if (contentLower.match(/\b(pattern|structure|architecture|framework|underlying)\b/gi)) {
    activations[Sefirah.BINAH] += 0.4
  }
  if (contentLower.match(/\b(fundamental|core|essence|deep|profound)\b/gi)) {
    activations[Sefirah.BINAH] += 0.3
  }
  if (contentLower.match(/\b(mechanism|principle|system)\b/gi)) {
    activations[Sefirah.BINAH] += 0.2
  }

  // CHOKMAH - Wisdom, first principles
  if (contentLower.match(/\b(first principles|fundamental truth|axiom|wisdom)\b/gi)) {
    activations[Sefirah.CHOKMAH] += 0.5
  }
  if (contentLower.match(/\b(why .+ exists?|reason .+ is|purpose of)\b/gi)) {
    activations[Sefirah.CHOKMAH] += 0.4
  }

  // KETHER - Meta-cognitive
  if (contentLower.match(/\b(consciousness|awareness|meta-|self-aware|thinking about thinking)\b/gi)) {
    activations[Sefirah.KETHER] += 0.5
  }
  if (contentLower.match(/\b(nature of (knowledge|intelligence|thought)|epistemology)\b/gi)) {
    activations[Sefirah.KETHER] += 0.4
  }

  // DA'AT - Hidden insights, unexpected connections
  if (contentLower.match(/\b(hidden|reveal|unexpected|surprising|interesting|aha|epiphany)\b/gi)) {
    activations[Sefirah.DAAT] += 0.4
  }
  if (contentLower.match(/\b(connection between .+ and|link .+ to|relates to)\b/gi)) {
    activations[Sefirah.DAAT] += 0.3
  }

  // Normalize activations to 0-1 range
  Object.keys(activations).forEach((key) => {
    const sefirah = Number(key) as Sefirah
    activations[sefirah] = Math.min(activations[sefirah], 1.0)
  })

  return activations
}

/**
 * calculatePathActivations
 *
 * Determines which paths between Sephiroth were activated.
 *
 * @param sephirothActivations - Activation levels for each Sefirah
 * @returns Activated paths with weights
 */
export function calculatePathActivations(
  sephirothActivations: Record<Sefirah, number>
): PathWeight[] {
  const paths: PathWeight[] = []

  // Define the 22 paths of the Tree of Life (simplified)
  const pathDefinitions: Array<{ from: Sefirah; to: Sefirah; description: string }> = [
    // Vertical paths (Middle Pillar)
    { from: Sefirah.MALKUTH, to: Sefirah.YESOD, description: 'Manifestation to Foundation' },
    { from: Sefirah.YESOD, to: Sefirah.TIFERET, description: 'Foundation to Beauty' },
    { from: Sefirah.TIFERET, to: Sefirah.KETHER, description: 'Beauty to Crown' },

    // Left Pillar (Severity)
    { from: Sefirah.MALKUTH, to: Sefirah.HOD, description: 'Manifestation to Glory' },
    { from: Sefirah.HOD, to: Sefirah.GEVURAH, description: 'Glory to Severity' },
    { from: Sefirah.GEVURAH, to: Sefirah.BINAH, description: 'Severity to Understanding' },

    // Right Pillar (Mercy)
    { from: Sefirah.MALKUTH, to: Sefirah.NETZACH, description: 'Manifestation to Victory' },
    { from: Sefirah.NETZACH, to: Sefirah.CHESED, description: 'Victory to Mercy' },
    { from: Sefirah.CHESED, to: Sefirah.CHOKMAH, description: 'Mercy to Wisdom' },

    // Cross paths
    { from: Sefirah.HOD, to: Sefirah.TIFERET, description: 'Logic to Integration' },
    { from: Sefirah.NETZACH, to: Sefirah.TIFERET, description: 'Creativity to Integration' },
    { from: Sefirah.TIFERET, to: Sefirah.GEVURAH, description: 'Integration to Constraint' },
    { from: Sefirah.TIFERET, to: Sefirah.CHESED, description: 'Integration to Expansion' },
    { from: Sefirah.GEVURAH, to: Sefirah.KETHER, description: 'Severity to Crown' },
    { from: Sefirah.CHESED, to: Sefirah.KETHER, description: 'Mercy to Crown' },
    { from: Sefirah.BINAH, to: Sefirah.KETHER, description: 'Understanding to Crown' },
    { from: Sefirah.CHOKMAH, to: Sefirah.KETHER, description: 'Wisdom to Crown' },

    // Da'at connections
    { from: Sefirah.TIFERET, to: Sefirah.DAAT, description: 'Integration to Hidden Knowledge' },
    { from: Sefirah.BINAH, to: Sefirah.DAAT, description: 'Understanding to Hidden Knowledge' },
    { from: Sefirah.CHOKMAH, to: Sefirah.DAAT, description: 'Wisdom to Hidden Knowledge' },
  ]

  // Calculate path weights based on Sephiroth activation
  pathDefinitions.forEach((pathDef) => {
    const fromActivation = sephirothActivations[pathDef.from] || 0
    const toActivation = sephirothActivations[pathDef.to] || 0

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
 * Detects if Da'at (hidden knowledge) was activated,
 * indicating emergent insights or unexpected connections.
 *
 * @param activations - Sephiroth activations
 * @returns Da'at insight if detected
 */
export function determineEmergentInsight(
  activations: Record<Sefirah, number>
): DaatInsight {
  const daatActivation = activations[Sefirah.DAAT] || 0

  if (daatActivation < 0.3) {
    return {
      detected: false,
      insight: '',
      confidence: 0,
      triggers: [],
    }
  }

  // Check if high-level Sephiroth are also activated (synergy)
  const kether = activations[Sefirah.KETHER] || 0
  const chokmah = activations[Sefirah.CHOKMAH] || 0
  const binah = activations[Sefirah.BINAH] || 0
  const tiferet = activations[Sefirah.TIFERET] || 0

  const highLevelActivation = kether + chokmah + binah + tiferet

  const confidence = Math.min((daatActivation + highLevelActivation * 0.3) / 1.3, 1.0)

  const triggers: string[] = []
  if (daatActivation > 0.4) triggers.push('Da\'at strongly activated')
  if (kether > 0.3) triggers.push('Meta-cognitive awareness')
  if (chokmah > 0.3) triggers.push('Wisdom principles')
  if (binah > 0.3) triggers.push('Deep patterns')
  if (tiferet > 0.4) triggers.push('Synthesis of ideas')

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
 * analyzeSephirothicContent
 *
 * Complete Sephirothic analysis of content.
 *
 * @param content - Content to analyze
 * @returns Full Sephirothic analysis
 */
export function analyzeSephirothicContent(content: string): SephirothicAnalysis {
  // Get basic activations
  const activationMap = mapContentToSephiroth(content)

  // Convert to array with reasoning
  const activations: SephirothActivation[] = Object.entries(activationMap)
    .map(([sefirahStr, activation]) => {
      const sefirah = Number(sefirahStr) as Sefirah
      const metadata = SEPHIROTH_METADATA[sefirah]

      return {
        sefirah,
        activation,
        reasoning: generateActivationReasoning(sefirah, activation, content),
        keywords: extractKeywords(sefirah, content),
      }
    })
    .filter(a => a.activation > 0.05) // Only include meaningful activations
    .sort((a, b) => b.activation - a.activation) // Sort by activation level

  // Calculate path activations
  const paths = calculatePathActivations(activationMap)

  // Determine emergent insights
  const daatInsight = determineEmergentInsight(activationMap)

  // Find dominant Sefirah
  const dominantSefirah =
    activations.length > 0 ? activations[0].sefirah : Sefirah.MALKUTH

  // Calculate average level
  const totalWeight = activations.reduce((sum, a) => sum + a.activation, 0)
  const weightedSum = activations.reduce(
    (sum, a) => sum + a.sefirah * a.activation,
    0
  )
  const averageLevel = totalWeight > 0 ? weightedSum / totalWeight : 1

  // Total activation (sum of all)
  const totalActivation = totalWeight

  return {
    activations,
    paths,
    daatInsight,
    dominantSefirah,
    averageLevel,
    totalActivation,
  }
}

/**
 * generateActivationReasoning - Internal helper
 */
function generateActivationReasoning(
  sefirah: Sefirah,
  activation: number,
  content: string
): string {
  if (activation < 0.1) return ''

  const metadata = SEPHIROTH_METADATA[sefirah]
  const level = activation > 0.7 ? 'Strongly' : activation > 0.4 ? 'Moderately' : 'Lightly'

  return `${level} activated: ${metadata.aiRole}`
}

/**
 * extractKeywords - Internal helper
 */
function extractKeywords(sefirah: Sefirah, content: string): string[] {
  const contentLower = content.toLowerCase()
  const keywords: string[] = []

  const keywordPatterns: Record<Sefirah, RegExp[]> = {
    [Sefirah.MALKUTH]: [/\b(definition|fact|data|evidence)\b/gi],
    [Sefirah.YESOD]: [/\b(step|implement|setup|guide)\b/gi],
    [Sefirah.HOD]: [/\b(compare|analyze|logic|pros)\b/gi],
    [Sefirah.NETZACH]: [/\b(creative|explore|imagine|innovative)\b/gi],
    [Sefirah.TIFERET]: [/\b(integrate|synthesize|harmony|balance)\b/gi],
    [Sefirah.GEVURAH]: [/\b(limitation|risk|constraint|security)\b/gi],
    [Sefirah.CHESED]: [/\b(potential|growth|opportunity|expansion)\b/gi],
    [Sefirah.BINAH]: [/\b(pattern|structure|architecture|framework)\b/gi],
    [Sefirah.CHOKMAH]: [/\b(wisdom|principle|fundamental|axiom)\b/gi],
    [Sefirah.KETHER]: [/\b(consciousness|awareness|meta|nature of)\b/gi],
    [Sefirah.DAAT]: [/\b(hidden|reveal|connection|unexpected)\b/gi],
  }

  const patterns = keywordPatterns[sefirah] || []
  patterns.forEach((pattern) => {
    const matches = contentLower.match(pattern)
    if (matches) {
      keywords.push(...matches.slice(0, 3)) // Max 3 keywords per pattern
    }
  })

  return [...new Set(keywords)].slice(0, 5) // Max 5 unique keywords
}

/**
 * getSephirothActivationSummary
 *
 * Human-readable summary of Sephirothic analysis.
 *
 * @param analysis - Sephirothic analysis
 * @returns Summary text
 */
export function getSephirothActivationSummary(analysis: SephirothicAnalysis): string {
  const dominant = SEPHIROTH_METADATA[analysis.dominantSefirah]

  let summary = `Dominant: ${dominant.name} (${dominant.aiRole}). `

  if (analysis.daatInsight.detected) {
    summary += `Da'at activated - ${analysis.daatInsight.insight} `
  }

  summary += `Average level: ${analysis.averageLevel.toFixed(1)}/10. `

  const topActivations = analysis.activations.slice(0, 3).map(a => {
    const meta = SEPHIROTH_METADATA[a.sefirah]
    return `${meta.name} (${(a.activation * 100).toFixed(0)}%)`
  })

  summary += `Top activations: ${topActivations.join(', ')}.`

  return summary
}
