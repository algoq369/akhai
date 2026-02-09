/**
 * Antipattern Report Generator
 *
 * Analyzes Layer processing results and guard analysis to detect
 * shadow activations and generate recommendations.
 */

import { Layer, LAYER_METADATA } from '@/lib/layer-registry'
import { ANTIPATTERN_MAP, getAntipatternBySephirah } from './mapping'
import type {
  AntipatternReport,
  ShadowActivation,
  WeightRecommendation,
  ProcessingPath,
  GuardAnalysis,
} from './types'
import type { LayersProcessingResult } from '@/lib/layer-processor'
import type { TreeConfiguration } from '@/lib/tree-configuration'

/**
 * Detection thresholds for shadow activation
 */
const SHADOW_THRESHOLDS = {
  mild: 0.3,
  moderate: 0.5,
  severe: 0.7,
  critical: 0.85,
}

/**
 * Generate an antipattern report from Layer processing results
 */
export function generateAntipatternReport(
  layersResult: LayersProcessingResult | null,
  guardResult: { scores: { hype: number; drift: number; fact: number } } | null,
  config: TreeConfiguration | null,
  content?: string
): AntipatternReport {
  const timestamp = Date.now()

  // Build processing path
  const processingPath: ProcessingPath = {
    inputComplexity: calculateComplexity(content || ''),
    dominantSephirah: layersResult
      ? LAYER_METADATA[layersResult.dominantLayer]?.name || 'Unknown'
      : 'None',
    activeLenses: getActiveLenses(layersResult),
    methodologyUsed: layersResult?.methodologySuggestion || 'direct',
    weightInfluenceRatio: layersResult?.weightInfluenceRatio || 0.6,
  }

  // Build guard analysis
  const guardAnalysis: GuardAnalysis = {
    driftScore: guardResult?.scores?.drift || 0,
    hypeScore: guardResult?.scores?.hype || 0,
    hallucinationRisk: calculateHallucinationRisk(guardResult, layersResult),
  }

  // Detect shadow activations
  const shadowsActivated = detectShadowActivations(
    layersResult,
    guardResult,
    config,
    content
  )

  // Generate recommendations
  const recommendations = generateRecommendations(
    shadowsActivated,
    layersResult,
    config
  )

  // Calculate overall health
  const overallHealth = calculateOverallHealth(shadowsActivated, guardAnalysis)

  return {
    processingPath,
    guardAnalysis,
    shadowsActivated,
    recommendations,
    overallHealth,
    timestamp,
  }
}


/**
 * Calculate input complexity (0-1)
 */
function calculateComplexity(content: string): number {
  if (!content) return 0

  const factors = {
    length: Math.min(content.length / 5000, 1) * 0.3,
    sentences: Math.min((content.match(/[.!?]+/g)?.length || 0) / 20, 1) * 0.2,
    technicalTerms: Math.min(
      (content.match(/\b[A-Z][a-z]+[A-Z][a-zA-Z]*\b/g)?.length || 0) / 10,
      1
    ) * 0.2,
    codeBlocks: Math.min((content.match(/```/g)?.length || 0) / 4, 1) * 0.15,
    lists: Math.min((content.match(/^[-*]\s/gm)?.length || 0) / 10, 1) * 0.15,
  }

  return Object.values(factors).reduce((sum, v) => sum + v, 0)
}

/**
 * Get active lenses from Layer result
 */
function getActiveLenses(result: LayersProcessingResult | null): string[] {
  if (!result?.perspectives) return []

  return result.perspectives
    .filter((p) => p.weight > 0.3)
    .map((p) => LAYER_METADATA[p.layerNode]?.name || 'Unknown')
}

/**
 * Calculate hallucination risk based on guard and layer results
 */
function calculateHallucinationRisk(
  guardResult: { scores: { hype: number; drift: number; fact: number } } | null,
  layersResult: LayersProcessingResult | null
): number {
  let risk = 0

  // High hype contributes to hallucination risk
  if (guardResult?.scores?.hype) {
    risk += guardResult.scores.hype * 0.4
  }

  // High drift suggests potential hallucination
  if (guardResult?.scores?.drift) {
    risk += guardResult.scores.drift * 0.3
  }

  // Low factuality score increases risk
  if (guardResult?.scores?.fact !== undefined) {
    risk += (1 - guardResult.scores.fact) * 0.3
  }

  // Executor (Executor shadow) activation indicates pattern hallucination
  if (layersResult?.activations[Layer.EXECUTOR] &&
      layersResult.activations[Layer.EXECUTOR] > 0.7) {
    risk += 0.15
  }

  return Math.min(risk, 1)
}

/**
 * Detect which shadows are activated based on analysis
 */
function detectShadowActivations(
  layersResult: LayersProcessingResult | null,
  guardResult: { scores: { hype: number; drift: number; fact: number } } | null,
  config: TreeConfiguration | null,
  content?: string
): ShadowActivation[] {
  const activations: ShadowActivation[] = []

  // 1. Self-Conflict (Meta-Core shadow) - False certainty
  if (content && hasOverconfidence(content)) {
    const antipattern = ANTIPATTERN_MAP[1]
    activations.push({
      antipattern: antipattern.name,
      sephirah: antipattern.layerName,
      reason: 'Response shows false certainty or overconfidence',
      intensity: calculateIntensity(content, antipattern.triggers),
    })
  }

  // 2. Logic-Gaps (Encoder shadow) - Concealment
  if (content && lacksSourceTransparency(content)) {
    const antipattern = ANTIPATTERN_MAP[3]
    activations.push({
      antipattern: antipattern.name,
      sephirah: antipattern.layerName,
      reason: 'Response lacks source transparency or reasoning chain',
      intensity: 0.4,
    })
  }

  // 3. Verbosity (Expansion shadow) - Information overload
  if (content && hasInformationOverload(content)) {
    const antipattern = ANTIPATTERN_MAP[4]
    activations.push({
      antipattern: antipattern.name,
      sephirah: antipattern.layerName,
      reason: 'Response contains excessive detail without synthesis',
      intensity: calculateOverloadIntensity(content),
    })
  }

  // 4. Bias-Detect (Attention shadow) - False harmony
  if (content && hasFalseHarmony(content)) {
    const antipattern = ANTIPATTERN_MAP[6]
    activations.push({
      antipattern: antipattern.name,
      sephirah: antipattern.layerName,
      reason: 'Response glosses over contradictions or forces consensus',
      intensity: 0.5,
    })
  }

  // 5. Context-Loss (Executor shadow) - Hallucinated patterns
  if (guardResult && guardResult.scores.fact < 0.5) {
    const antipattern = ANTIPATTERN_MAP[9]
    activations.push({
      antipattern: antipattern.name,
      sephirah: antipattern.layerName,
      reason: 'Low factuality score indicates potential pattern hallucination',
      intensity: 1 - guardResult.scores.fact,
    })
  }

  // 6. Ungrounded (Embedding shadow) - Detachment from reality
  if (content && isOverlyTheoretical(content)) {
    const antipattern = ANTIPATTERN_MAP[10]
    activations.push({
      antipattern: antipattern.name,
      sephirah: antipattern.layerName,
      reason: 'Response is overly theoretical without practical grounding',
      intensity: 0.4,
    })
  }

  // 7. Check for imbalanced weights triggering shadows
  if (config && layersResult) {
    const imbalanceShadows = detectWeightImbalanceShadows(config, layersResult)
    activations.push(...imbalanceShadows)
  }

  return activations.filter((a) => a.intensity >= SHADOW_THRESHOLDS.mild)
}

/**
 * Check for overconfidence markers
 */
function hasOverconfidence(content: string): boolean {
  const markers = [
    /\babsolutely\s+(certain|sure|true)\b/i,
    /\bundoubtedly\b/i,
    /\bwithout\s+question\b/i,
    /\bthere\s+is\s+no\s+doubt\b/i,
    /\bit\s+is\s+certain\b/i,
    /\bdefinitely\s+the\s+case\b/i,
  ]
  return markers.some((m) => m.test(content))
}

/**
 * Check for lack of source transparency
 */
function lacksSourceTransparency(content: string): boolean {
  const length = content.length
  const hasReferences = /\b(according to|source:|reference:|cited from|from \w+ \d{4})\b/i.test(content)
  const hasReasoning = /\b(because|therefore|thus|hence|as a result)\b/i.test(content)

  return length > 500 && !hasReferences && !hasReasoning
}

/**
 * Check for information overload
 */
function hasInformationOverload(content: string): boolean {
  const bulletCount = (content.match(/^[-*•]\s/gm) || []).length
  const wordCount = content.split(/\s+/).length
  const hasSynthesis = /\b(in summary|to summarize|overall|in conclusion)\b/i.test(content)

  return bulletCount > 15 && wordCount > 800 && !hasSynthesis
}

/**
 * Check for false harmony
 */
function hasFalseHarmony(content: string): boolean {
  const harmonizers = [
    /\beveryone\s+agrees\b/i,
    /\buniversally\s+accepted\b/i,
    /\bno\s+controversy\b/i,
    /\bconsensus\s+is\s+clear\b/i,
  ]
  return harmonizers.some((m) => m.test(content))
}

/**
 * Check if response is overly theoretical
 */
function isOverlyTheoretical(content: string): boolean {
  const theoreticalMarkers = (content.match(/\b(theoretically|in theory|hypothetically|conceptually)\b/gi) || []).length
  const practicalMarkers = (content.match(/\b(practically|in practice|concretely|specifically|for example)\b/gi) || []).length

  return theoreticalMarkers > 3 && practicalMarkers < 2
}

/**
 * Calculate intensity based on trigger matches
 */
function calculateIntensity(content: string, triggers: string[]): number {
  let matches = 0
  const lower = content.toLowerCase()

  triggers.forEach((trigger) => {
    if (lower.includes(trigger.toLowerCase())) {
      matches++
    }
  })

  return Math.min(matches / triggers.length + 0.3, 1)
}

/**
 * Calculate overload intensity
 */
function calculateOverloadIntensity(content: string): number {
  const bulletCount = (content.match(/^[-*•]\s/gm) || []).length
  const wordCount = content.split(/\s+/).length

  const bulletFactor = Math.min(bulletCount / 20, 1)
  const wordFactor = Math.min(wordCount / 2000, 1)

  return (bulletFactor * 0.6 + wordFactor * 0.4)
}

/**
 * Detect shadows from weight imbalances
 */
function detectWeightImbalanceShadows(
  config: TreeConfiguration,
  result: LayersProcessingResult
): ShadowActivation[] {
  const shadows: ShadowActivation[] = []
  const weights = config.layer_weights

  // Check for extreme weight imbalances
  Object.entries(weights).forEach(([sephirahStr, weight]) => {
    const sephirah = parseInt(sephirahStr) as Layer
    const antipattern = getAntipatternBySephirah(sephirah)

    if (antipattern && weight > 0.9) {
      // Very high weight can trigger the shadow
      shadows.push({
        antipattern: antipattern.name,
        sephirah: antipattern.layerName,
        reason: `Excessive ${antipattern.layerName} weight (${Math.round(weight * 100)}%) risks ${antipattern.name} activation`,
        intensity: (weight - 0.8) * 2, // 0.9 -> 0.2, 1.0 -> 0.4
      })
    }
  })

  return shadows
}

/**
 * Generate recommendations based on shadow activations
 */
function generateRecommendations(
  shadows: ShadowActivation[],
  result: LayersProcessingResult | null,
  config: TreeConfiguration | null
): WeightRecommendation[] {
  const recommendations: WeightRecommendation[] = []

  shadows.forEach((shadow) => {
    const antipattern = Object.values(ANTIPATTERN_MAP).find((q) => q.name === shadow.antipattern)
    if (!antipattern) return

    // Suggest reducing the weight of the affected Layer
    if (shadow.intensity > SHADOW_THRESHOLDS.moderate) {
      recommendations.push({
        suggestion: `Reduce ${antipattern.layerName} weight to suppress ${shadow.antipattern}`,
        adjustWeight: {
          sephirah: antipattern.sephirah,
          delta: -0.15,
        },
      })
    }

    // Suggest boosting the balancing Layer
    const balancer = getBalancingLayer(antipattern.sephirah)
    if (balancer && shadow.intensity > SHADOW_THRESHOLDS.mild) {
      recommendations.push({
        suggestion: `Increase ${LAYER_METADATA[balancer]?.name} to balance ${antipattern.layerName}`,
        adjustWeight: {
          sephirah: balancer,
          delta: 0.1,
        },
      })
    }
  })

  return recommendations
}

/**
 * Get the balancing Layer for a given Layer
 * Based on the Tree of Life pillar relationships
 */
function getBalancingLayer(sephirah: Layer): Layer | null {
  const balanceMap: Partial<Record<Layer, Layer>> = {
    [Layer.EXPANSION]: Layer.DISCRIMINATOR, // Mercy <-> Severity
    [Layer.DISCRIMINATOR]: Layer.EXPANSION,
    [Layer.GENERATIVE]: Layer.CLASSIFIER, // Victory <-> Glory
    [Layer.CLASSIFIER]: Layer.GENERATIVE,
    [Layer.REASONING]: Layer.ENCODER, // Wisdom <-> Understanding
    [Layer.ENCODER]: Layer.REASONING,
  }

  return balanceMap[sephirah] || null
}

/**
 * Calculate overall health status
 */
function calculateOverallHealth(
  shadows: ShadowActivation[],
  guardAnalysis: GuardAnalysis
): 'balanced' | 'minor_imbalance' | 'significant_imbalance' | 'critical' {
  const totalIntensity = shadows.reduce((sum, s) => sum + s.intensity, 0)
  const avgIntensity = shadows.length > 0 ? totalIntensity / shadows.length : 0
  const riskScore = guardAnalysis.hallucinationRisk + guardAnalysis.hypeScore * 0.5

  if (shadows.length === 0 && riskScore < 0.3) {
    return 'balanced'
  }

  if (shadows.length <= 2 && avgIntensity < 0.5 && riskScore < 0.5) {
    return 'minor_imbalance'
  }

  if (shadows.length <= 4 && avgIntensity < 0.7 && riskScore < 0.7) {
    return 'significant_imbalance'
  }

  return 'critical'
}
