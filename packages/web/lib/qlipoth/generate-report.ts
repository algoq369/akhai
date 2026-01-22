/**
 * Qlipoth Report Generator
 *
 * Analyzes Sefirot processing results and guard analysis to detect
 * shadow activations and generate recommendations.
 */

import { Sefirah, SEPHIROTH_METADATA } from '@/lib/ascent-tracker'
import { QLIPOTH_MAP, getQlipahBySephirah } from './mapping'
import type {
  QlipothReport,
  ShadowActivation,
  WeightRecommendation,
  ProcessingPath,
  GuardAnalysis,
} from './types'
import type { SefirotProcessingResult } from '@/lib/sefirot-processor'
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
 * Generate a Qlipoth report from Sefirot processing results
 */
export function generateQlipothReport(
  sefirotResult: SefirotProcessingResult | null,
  guardResult: { scores: { hype: number; drift: number; fact: number } } | null,
  config: TreeConfiguration | null,
  content?: string
): QlipothReport {
  const timestamp = Date.now()

  // Build processing path
  const processingPath: ProcessingPath = {
    inputComplexity: calculateComplexity(content || ''),
    dominantSephirah: sefirotResult
      ? SEPHIROTH_METADATA[sefirotResult.dominantSefirah]?.name || 'Unknown'
      : 'None',
    activeLenses: getActiveLenses(sefirotResult),
    methodologyUsed: sefirotResult?.methodologySuggestion || 'direct',
    weightInfluenceRatio: sefirotResult?.weightInfluenceRatio || 0.6,
  }

  // Build guard analysis
  const guardAnalysis: GuardAnalysis = {
    driftScore: guardResult?.scores?.drift || 0,
    hypeScore: guardResult?.scores?.hype || 0,
    hallucinationRisk: calculateHallucinationRisk(guardResult, sefirotResult),
  }

  // Detect shadow activations
  const shadowsActivated = detectShadowActivations(
    sefirotResult,
    guardResult,
    config,
    content
  )

  // Generate recommendations
  const recommendations = generateRecommendations(
    shadowsActivated,
    sefirotResult,
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
 * Get active lenses from Sefirot result
 */
function getActiveLenses(result: SefirotProcessingResult | null): string[] {
  if (!result?.perspectives) return []

  return result.perspectives
    .filter((p) => p.weight > 0.3)
    .map((p) => SEPHIROTH_METADATA[p.sefirah]?.name || 'Unknown')
}

/**
 * Calculate hallucination risk based on guard and sefirot results
 */
function calculateHallucinationRisk(
  guardResult: { scores: { hype: number; drift: number; fact: number } } | null,
  sefirotResult: SefirotProcessingResult | null
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

  // Gamaliel (Yesod shadow) activation indicates pattern hallucination
  if (sefirotResult?.activations[Sefirah.YESOD] &&
      sefirotResult.activations[Sefirah.YESOD] > 0.7) {
    risk += 0.15
  }

  return Math.min(risk, 1)
}

/**
 * Detect which shadows are activated based on analysis
 */
function detectShadowActivations(
  sefirotResult: SefirotProcessingResult | null,
  guardResult: { scores: { hype: number; drift: number; fact: number } } | null,
  config: TreeConfiguration | null,
  content?: string
): ShadowActivation[] {
  const activations: ShadowActivation[] = []

  // 1. Thaumiel (Kether shadow) - False certainty
  if (content && hasOverconfidence(content)) {
    const qlipah = QLIPOTH_MAP[1]
    activations.push({
      qlipah: qlipah.name,
      sephirah: qlipah.sephirahName,
      reason: 'Response shows false certainty or overconfidence',
      intensity: calculateIntensity(content, qlipah.triggers),
    })
  }

  // 2. Satariel (Binah shadow) - Concealment
  if (content && lacksSourceTransparency(content)) {
    const qlipah = QLIPOTH_MAP[3]
    activations.push({
      qlipah: qlipah.name,
      sephirah: qlipah.sephirahName,
      reason: 'Response lacks source transparency or reasoning chain',
      intensity: 0.4,
    })
  }

  // 3. Gamchicoth (Chesed shadow) - Information overload
  if (content && hasInformationOverload(content)) {
    const qlipah = QLIPOTH_MAP[4]
    activations.push({
      qlipah: qlipah.name,
      sephirah: qlipah.sephirahName,
      reason: 'Response contains excessive detail without synthesis',
      intensity: calculateOverloadIntensity(content),
    })
  }

  // 4. Thagirion (Tiferet shadow) - False harmony
  if (content && hasFalseHarmony(content)) {
    const qlipah = QLIPOTH_MAP[6]
    activations.push({
      qlipah: qlipah.name,
      sephirah: qlipah.sephirahName,
      reason: 'Response glosses over contradictions or forces consensus',
      intensity: 0.5,
    })
  }

  // 5. Gamaliel (Yesod shadow) - Hallucinated patterns
  if (guardResult && guardResult.scores.fact < 0.5) {
    const qlipah = QLIPOTH_MAP[9]
    activations.push({
      qlipah: qlipah.name,
      sephirah: qlipah.sephirahName,
      reason: 'Low factuality score indicates potential pattern hallucination',
      intensity: 1 - guardResult.scores.fact,
    })
  }

  // 6. Lilith (Malkuth shadow) - Detachment from reality
  if (content && isOverlyTheoretical(content)) {
    const qlipah = QLIPOTH_MAP[10]
    activations.push({
      qlipah: qlipah.name,
      sephirah: qlipah.sephirahName,
      reason: 'Response is overly theoretical without practical grounding',
      intensity: 0.4,
    })
  }

  // 7. Check for imbalanced weights triggering shadows
  if (config && sefirotResult) {
    const imbalanceShadows = detectWeightImbalanceShadows(config, sefirotResult)
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
  result: SefirotProcessingResult
): ShadowActivation[] {
  const shadows: ShadowActivation[] = []
  const weights = config.sephiroth_weights

  // Check for extreme weight imbalances
  Object.entries(weights).forEach(([sephirahStr, weight]) => {
    const sephirah = parseInt(sephirahStr) as Sefirah
    const qlipah = getQlipahBySephirah(sephirah)

    if (qlipah && weight > 0.9) {
      // Very high weight can trigger the shadow
      shadows.push({
        qlipah: qlipah.name,
        sephirah: qlipah.sephirahName,
        reason: `Excessive ${qlipah.sephirahName} weight (${Math.round(weight * 100)}%) risks ${qlipah.name} activation`,
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
  result: SefirotProcessingResult | null,
  config: TreeConfiguration | null
): WeightRecommendation[] {
  const recommendations: WeightRecommendation[] = []

  shadows.forEach((shadow) => {
    const qlipah = Object.values(QLIPOTH_MAP).find((q) => q.name === shadow.qlipah)
    if (!qlipah) return

    // Suggest reducing the weight of the affected Sephirah
    if (shadow.intensity > SHADOW_THRESHOLDS.moderate) {
      recommendations.push({
        suggestion: `Reduce ${qlipah.sephirahName} weight to suppress ${shadow.qlipah}`,
        adjustWeight: {
          sephirah: qlipah.sephirah,
          delta: -0.15,
        },
      })
    }

    // Suggest boosting the balancing Sephirah
    const balancer = getBalancingSephirah(qlipah.sephirah)
    if (balancer && shadow.intensity > SHADOW_THRESHOLDS.mild) {
      recommendations.push({
        suggestion: `Increase ${SEPHIROTH_METADATA[balancer]?.name} to balance ${qlipah.sephirahName}`,
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
 * Get the balancing Sephirah for a given Sephirah
 * Based on the Tree of Life pillar relationships
 */
function getBalancingSephirah(sephirah: Sefirah): Sefirah | null {
  const balanceMap: Partial<Record<Sefirah, Sefirah>> = {
    [Sefirah.CHESED]: Sefirah.GEVURAH, // Mercy <-> Severity
    [Sefirah.GEVURAH]: Sefirah.CHESED,
    [Sefirah.NETZACH]: Sefirah.HOD, // Victory <-> Glory
    [Sefirah.HOD]: Sefirah.NETZACH,
    [Sefirah.CHOKMAH]: Sefirah.BINAH, // Wisdom <-> Understanding
    [Sefirah.BINAH]: Sefirah.CHOKMAH,
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
