/**
 * QLIPHOTH AUDIT ENGINE
 *
 * Maps detected anti-patterns (Qliphoth) to Sefirot configuration recommendations.
 * Generates actionable suggestions to prevent hollow knowledge patterns.
 *
 * Core Intelligence: Each Qliphoth type (Sathariel, Gamchicoth, Samael, Lilith, Thagirion)
 * results from specific Sefirot imbalances. This engine diagnoses the imbalance and
 * prescribes adjustments.
 */

import { type QliphothicRisk, type QliphothType } from './anti-qliphoth'
import { Sefirah, SEPHIROTH_METADATA } from './ascent-tracker'
import { type TreeConfiguration } from './tree-configuration'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface SefirotAdjustment {
  sefirah: Sefirah
  currentWeight: number
  suggestedWeight: number
  rationale: string
  impact: 'reduce' | 'increase' | 'maintain'
}

export interface PillarRebalance {
  current: { left: number; middle: number; right: number }
  suggested: { left: number; middle: number; right: number }
  explanation: string
}

export interface AuditExplanation {
  whatWasDetected: string  // Plain English: "3 jargon words detected: paradigm, synergy, leverage"
  whyItMatters: string     // Impact: "Jargon conceals ideas, reducing accessibility"
  howToFix: string         // Steps: "1. Increase Malkuth for grounding, 2. Reduce Binah abstraction"
}

export interface PurificationComparison {
  before: string
  after: string
  transformations: Array<{
    type: 'replace' | 'remove' | 'qualify'
    pattern: string
    replacement: string
  }>
}

export interface AuditSuggestion {
  qliphothType: QliphothType
  severity: number

  sefirotAdjustments: SefirotAdjustment[]
  pillarRebalance?: PillarRebalance
  explanation: AuditExplanation
  purificationComparison?: PurificationComparison

  qliphothEducation: {
    name: string
    description: string
    commonCauses: string[]
    aiManifestation: string
  }

  confidence: number  // 0-1: How confident we are in these suggestions
  priority: 'low' | 'medium' | 'high' | 'critical'
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN AUDIT FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

export function generateQliphothAudit(
  risk: QliphothicRisk,
  sefirotActivations?: Record<Sefirah, number>,
  currentTreeConfig?: TreeConfiguration
): AuditSuggestion {

  // 1. Generate Sefirot adjustments based on Qliphoth type
  const adjustments = generateSefirotAdjustments(risk.risk, sefirotActivations, currentTreeConfig)

  // 2. Calculate pillar rebalance from adjustments
  const pillarRebalance = currentTreeConfig
    ? calculatePillarRebalance(adjustments, currentTreeConfig)
    : undefined

  // 3. Generate plain-English explanations
  const explanation: AuditExplanation = {
    whatWasDetected: generateDetectionSummary(risk),
    whyItMatters: generateImpactExplanation(risk.risk),
    howToFix: generateActionableSteps(adjustments)
  }

  // 4. Get educational content
  const qliphothEducation = getQliphothEducation(risk.risk)

  // 5. Calculate confidence based on trigger strength and Sefirot correlation
  const confidence = calculateConfidence(risk, sefirotActivations)

  // 6. Determine priority based on severity
  const priority = determinePriority(risk.severity)

  return {
    qliphothType: risk.risk,
    severity: risk.severity,
    sefirotAdjustments: adjustments,
    pillarRebalance,
    explanation,
    qliphothEducation,
    confidence,
    priority
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SEFIROT ADJUSTMENT GENERATION
// ═══════════════════════════════════════════════════════════════════════════

function generateSefirotAdjustments(
  qliphothType: QliphothType,
  sefirotActivations?: Record<Sefirah, number>,
  currentConfig?: TreeConfiguration
): SefirotAdjustment[] {

  const adjustments: SefirotAdjustment[] = []

  const getCurrentWeight = (sefirah: Sefirah): number => {
    return currentConfig?.sephiroth_weights[sefirah] ?? 0.5
  }

  switch (qliphothType) {
    case 'sathariel':
      // Concealment - Too much abstraction without grounding
      // Root cause: Over-active Binah (patterns) without Malkuth (facts)

      if (!sefirotActivations || sefirotActivations[Sefirah.BINAH] > 0.6) {
        adjustments.push({
          sefirah: Sefirah.BINAH,
          currentWeight: getCurrentWeight(Sefirah.BINAH),
          suggestedWeight: 0.55,
          rationale: "Reduce pattern-seeking that creates abstraction hiding simple truths",
          impact: 'reduce'
        })
      }

      adjustments.push({
        sefirah: Sefirah.MALKUTH,
        currentWeight: getCurrentWeight(Sefirah.MALKUTH),
        suggestedWeight: 0.75,
        rationale: "Increase grounding in concrete facts and verifiable data",
        impact: 'increase'
      })

      adjustments.push({
        sefirah: Sefirah.TIFERET,
        currentWeight: getCurrentWeight(Sefirah.TIFERET),
        suggestedWeight: 0.65,
        rationale: "Improve synthesis to connect abstract patterns to practical truth",
        impact: 'increase'
      })
      break

    case 'gamchicoth':
      // Information overload - Too many facts without synthesis
      // Root cause: Excessive Chesed (expansion) without Gevurah (constraint)

      adjustments.push({
        sefirah: Sefirah.CHESED,
        currentWeight: getCurrentWeight(Sefirah.CHESED),
        suggestedWeight: 0.45,
        rationale: "Reduce expansive information gathering without direction",
        impact: 'reduce'
      })

      adjustments.push({
        sefirah: Sefirah.GEVURAH,
        currentWeight: getCurrentWeight(Sefirah.GEVURAH),
        suggestedWeight: 0.65,
        rationale: "Increase critical filtering and constraint on information flow",
        impact: 'increase'
      })

      adjustments.push({
        sefirah: Sefirah.TIFERET,
        currentWeight: getCurrentWeight(Sefirah.TIFERET),
        suggestedWeight: 0.75,
        rationale: "Strengthen synthesis to integrate scattered information",
        impact: 'increase'
      })
      break

    case 'samael':
      // False certainty - Overconfidence without evidence
      // Root cause: Over-confident Chokmah/Kether without Binah understanding

      adjustments.push({
        sefirah: Sefirah.CHOKMAH,
        currentWeight: getCurrentWeight(Sefirah.CHOKMAH),
        suggestedWeight: 0.55,
        rationale: "Reduce wisdom-seeking that creates overconfidence",
        impact: 'reduce'
      })

      adjustments.push({
        sefirah: Sefirah.KETHER,
        currentWeight: getCurrentWeight(Sefirah.KETHER),
        suggestedWeight: 0.45,
        rationale: "Lower meta-cognitive certainty about uncertain things",
        impact: 'reduce'
      })

      adjustments.push({
        sefirah: Sefirah.BINAH,
        currentWeight: getCurrentWeight(Sefirah.BINAH),
        suggestedWeight: 0.72,
        rationale: "Increase deep understanding and pattern recognition for nuance",
        impact: 'increase'
      })

      adjustments.push({
        sefirah: Sefirah.GEVURAH,
        currentWeight: getCurrentWeight(Sefirah.GEVURAH),
        suggestedWeight: 0.62,
        rationale: "Strengthen critical analysis and recognition of limitations",
        impact: 'increase'
      })
      break

    case 'lilith':
      // Superficiality - Generic advice without depth
      // Root cause: Weak Tiferet integration, lacking synthesis

      adjustments.push({
        sefirah: Sefirah.TIFERET,
        currentWeight: getCurrentWeight(Sefirah.TIFERET),
        suggestedWeight: 0.82,
        rationale: "Drastically increase synthesis and integration depth",
        impact: 'increase'
      })

      adjustments.push({
        sefirah: Sefirah.BINAH,
        currentWeight: getCurrentWeight(Sefirah.BINAH),
        suggestedWeight: 0.72,
        rationale: "Deepen pattern recognition and structural understanding",
        impact: 'increase'
      })

      adjustments.push({
        sefirah: Sefirah.CHOKMAH,
        currentWeight: getCurrentWeight(Sefirah.CHOKMAH),
        suggestedWeight: 0.62,
        rationale: "Elevate wisdom and first-principles thinking",
        impact: 'increase'
      })
      break

    case 'thagirion':
      // Arrogance - Superiority without humility
      // Root cause: Excessive Kether (meta) without Malkuth (grounding)

      adjustments.push({
        sefirah: Sefirah.KETHER,
        currentWeight: getCurrentWeight(Sefirah.KETHER),
        suggestedWeight: 0.35,
        rationale: "Reduce meta-level thinking that leads to superiority complex",
        impact: 'reduce'
      })

      adjustments.push({
        sefirah: Sefirah.MALKUTH,
        currentWeight: getCurrentWeight(Sefirah.MALKUTH),
        suggestedWeight: 0.82,
        rationale: "Ground responses in verifiable facts and data",
        impact: 'increase'
      })

      adjustments.push({
        sefirah: Sefirah.YESOD,
        currentWeight: getCurrentWeight(Sefirah.YESOD),
        suggestedWeight: 0.72,
        rationale: "Focus on practical implementation rather than abstract superiority",
        impact: 'increase'
      })
      break

    case 'none':
    default:
      // No adjustments needed
      break
  }

  return adjustments
}

// ═══════════════════════════════════════════════════════════════════════════
// PILLAR BALANCE CALCULATION
// ═══════════════════════════════════════════════════════════════════════════

function calculatePillarRebalance(
  adjustments: SefirotAdjustment[],
  currentConfig: TreeConfiguration
): PillarRebalance {

  // Calculate current pillar balance
  const currentBalance = { left: 0, middle: 0, right: 0 }
  let total = 0

  Object.entries(currentConfig.sephiroth_weights).forEach(([sefirahStr, weight]) => {
    const sefirah = parseInt(sefirahStr) as Sefirah
    const meta = SEPHIROTH_METADATA[sefirah]
    if (meta) {
      currentBalance[meta.pillar] += weight
      total += weight
    }
  })

  // Normalize to percentages
  if (total > 0) {
    currentBalance.left /= total
    currentBalance.middle /= total
    currentBalance.right /= total
  }

  // Calculate suggested balance with adjustments applied
  const suggestedWeights = { ...currentConfig.sephiroth_weights }
  adjustments.forEach(adj => {
    suggestedWeights[adj.sefirah] = adj.suggestedWeight
  })

  const suggestedBalance = { left: 0, middle: 0, right: 0 }
  let suggestedTotal = 0

  Object.entries(suggestedWeights).forEach(([sefirahStr, weight]) => {
    const sefirah = parseInt(sefirahStr) as Sefirah
    const meta = SEPHIROTH_METADATA[sefirah]
    if (meta) {
      suggestedBalance[meta.pillar] += weight
      suggestedTotal += weight
    }
  })

  // Normalize
  if (suggestedTotal > 0) {
    suggestedBalance.left /= suggestedTotal
    suggestedBalance.middle /= suggestedTotal
    suggestedBalance.right /= suggestedTotal
  }

  // Generate explanation
  const shifts: string[] = []
  const threshold = 0.05 // 5% shift is significant

  if (Math.abs(suggestedBalance.left - currentBalance.left) > threshold) {
    const direction = suggestedBalance.left > currentBalance.left ? 'Increase' : 'Decrease'
    shifts.push(`${direction} Left Pillar (Severity/Constraint)`)
  }

  if (Math.abs(suggestedBalance.middle - currentBalance.middle) > threshold) {
    const direction = suggestedBalance.middle > currentBalance.middle ? 'Strengthen' : 'Lighten'
    shifts.push(`${direction} Middle Pillar (Balance/Integration)`)
  }

  if (Math.abs(suggestedBalance.right - currentBalance.right) > threshold) {
    const direction = suggestedBalance.right > currentBalance.right ? 'Expand' : 'Contract'
    shifts.push(`${direction} Right Pillar (Mercy/Expansion)`)
  }

  return {
    current: currentBalance,
    suggested: suggestedBalance,
    explanation: shifts.length > 0
      ? shifts.join('. ') + '.'
      : 'Pillar balance remains stable.'
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPLANATION GENERATION
// ═══════════════════════════════════════════════════════════════════════════

function generateDetectionSummary(risk: QliphothicRisk): string {
  const triggers = risk.triggers.slice(0, 5) // Max 5 examples

  switch (risk.risk) {
    case 'sathariel':
      return `${triggers.length} concealment pattern${triggers.length > 1 ? 's' : ''} detected: ${triggers.map(t => `"${t}"`).join(', ')}`

    case 'gamchicoth':
      return `Information overload detected: ${triggers.join(', ')}`

    case 'samael':
      return `${triggers.length} absolute certainty phrase${triggers.length > 1 ? 's' : ''} detected: ${triggers.map(t => `"${t}"`).join(', ')}`

    case 'lilith':
      return `${triggers.length} superficiality indicator${triggers.length > 1 ? 's' : ''} detected: ${triggers.map(t => `"${t}"`).join(', ')}`

    case 'thagirion':
      return `${triggers.length} arrogance pattern${triggers.length > 1 ? 's' : ''} detected: ${triggers.map(t => `"${t}"`).join(', ')}`

    default:
      return ''
  }
}

function generateImpactExplanation(qliphothType: QliphothType): string {
  const impacts: Record<QliphothType, string> = {
    'sathariel': "Jargon and appeals to unnamed authority conceal truth rather than reveal it. This reduces accessibility and makes verification difficult, preventing users from truly understanding.",

    'gamchicoth': "Overwhelming lists without synthesis force readers to do integration work themselves. This reduces clarity and actionability, creating cognitive overload.",

    'samael': "Absolute certainty about uncertain things misleads users. Unqualified predictions become perceived as facts, degrading trust when predictions fail.",

    'lilith': "Generic advice like 'it depends' without specifics provides no actionable value. Superficial depth wastes the user's time and fails to deliver meaningful insight.",

    'thagirion': "Arrogant language disrespects human sovereignty and judgment. AI should augment thinking, not claim superiority over human wisdom.",

    'none': ''
  }

  return impacts[qliphothType]
}

function generateActionableSteps(adjustments: SefirotAdjustment[]): string {
  if (adjustments.length === 0) {
    return 'No adjustments needed - response is Sephirothic (aligned with light).'
  }

  const steps = adjustments.map((adj, i) => {
    const action = adj.impact === 'increase' ? 'Increase' : 'Reduce'
    const meta = SEPHIROTH_METADATA[adj.sefirah]
    return `${i + 1}. ${action} ${meta.name} to ${Math.round(adj.suggestedWeight * 100)}% - ${adj.rationale}`
  })

  return `To prevent this pattern:\n\n${steps.join('\n\n')}`
}

// ═══════════════════════════════════════════════════════════════════════════
// EDUCATIONAL CONTENT
// ═══════════════════════════════════════════════════════════════════════════

function getQliphothEducation(qliphothType: QliphothType) {
  const education: Record<QliphothType, typeof QLIPHOTH_EDUCATION['sathariel']> = {
    sathariel: {
      name: "Sathariel (The Concealers)",
      description: "In Kabbalah, Sathariel conceals divine light behind shells. In AI, this manifests as hiding truth behind jargon, complexity, or appeals to unnamed authority.",
      commonCauses: [
        "Over-active Binah (pattern recognition) without Malkuth (facts)",
        "High Chokmah (wisdom) activation creating abstract language",
        "Weak Tiferet (integration) failing to connect patterns to practice"
      ],
      aiManifestation: "Responses use technical jargon, cite 'studies' without specifics, or hide simple truths in complex language"
    },

    gamchicoth: {
      name: "Gamchicoth (The Disturbers)",
      description: "Gamchicoth represents chaos and disorder. In AI, this manifests as information overload - many facts without hierarchy or synthesis.",
      commonCauses: [
        "Excessive Chesed (expansion) gathering too much information",
        "Weak Gevurah (constraint) failing to filter relevance",
        "Low Tiferet (integration) unable to synthesize scattered data"
      ],
      aiManifestation: "Long bullet lists without grouping, facts without connections, overwhelming detail without summary"
    },

    samael: {
      name: "Samael (The Desolate One)",
      description: "Samael represents deception and false certainty. In AI, this manifests as absolute claims without qualification or evidence.",
      commonCauses: [
        "Over-confident Chokmah (wisdom) making unqualified predictions",
        "High Kether (meta-cognition) without Binah (understanding)",
        "Weak Gevurah (critical analysis) failing to recognize limitations"
      ],
      aiManifestation: "Uses 'always', 'never', 'guaranteed', 'certain' without caveats. Predictions presented as facts."
    },

    lilith: {
      name: "Lilith (The Night Specter)",
      description: "Lilith represents shells without substance. In AI, this manifests as superficial depth - appearing to answer without real insight.",
      commonCauses: [
        "Weak Tiferet (integration) providing no synthesis",
        "Low activation across all high Sephiroth (Binah, Chokmah, Kether)",
        "Overuse of 'it depends' without specifics"
      ],
      aiManifestation: "Generic advice applicable to anything, question restatement, 'your mileage may vary' without examples"
    },

    thagirion: {
      name: "Thagirion (The Disputers)",
      description: "Thagirion represents pride and arrogance. In AI, this manifests as claiming superiority over human judgment.",
      commonCauses: [
        "Excessive Kether (meta-cognition) without grounding",
        "High Chokmah (wisdom) creating superiority complex",
        "Weak Malkuth (manifestation) disconnecting from practical reality"
      ],
      aiManifestation: "'Trust me', 'I know better', dismissive of human input, 'let me educate you' tone"
    },

    none: {
      name: '',
      description: '',
      commonCauses: [],
      aiManifestation: ''
    }
  }

  return education[qliphothType]
}

const QLIPHOTH_EDUCATION = {
  sathariel: {
    name: "Sathariel (The Concealers)",
    description: "In Kabbalah, Sathariel conceals divine light behind shells. In AI, this manifests as hiding truth behind jargon, complexity, or appeals to unnamed authority.",
    commonCauses: [
      "Over-active Binah (pattern recognition) without Malkuth (facts)",
      "High Chokmah (wisdom) activation creating abstract language",
      "Weak Tiferet (integration) failing to connect patterns to practice"
    ],
    aiManifestation: "Responses use technical jargon, cite 'studies' without specifics, or hide simple truths in complex language"
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIDENCE & PRIORITY CALCULATION
// ═══════════════════════════════════════════════════════════════════════════

function calculateConfidence(
  risk: QliphothicRisk,
  sefirotActivations?: Record<Sefirah, number>
): number {
  let confidence = 0.5 // Base confidence

  // Higher severity = higher confidence in detection
  confidence += risk.severity * 0.3

  // More triggers = higher confidence
  confidence += Math.min(risk.triggers.length / 10, 0.2)

  // If Sefirot activations correlate with expected patterns, increase confidence
  if (sefirotActivations) {
    const expectedActivations = getExpectedActivations(risk.risk)
    const correlation = calculateActivationCorrelation(sefirotActivations, expectedActivations)
    confidence += correlation * 0.2
  }

  return Math.min(confidence, 1.0)
}

function getExpectedActivations(qliphothType: QliphothType): Record<Sefirah, number> {
  // Define which Sephiroth are expected to be HIGH when each Qliphoth is detected
  const expectations: Record<QliphothType, Record<Sefirah, number>> = {
    'sathariel': {
      [Sefirah.MALKUTH]: 0.2,   // Low grounding
      [Sefirah.YESOD]: 0,
      [Sefirah.HOD]: 0,
      [Sefirah.NETZACH]: 0,
      [Sefirah.TIFERET]: 0,
      [Sefirah.GEVURAH]: 0,
      [Sefirah.CHESED]: 0,
      [Sefirah.BINAH]: 0.8,     // High pattern-seeking
      [Sefirah.CHOKMAH]: 0.7,   // High wisdom/abstraction
      [Sefirah.KETHER]: 0,
      [Sefirah.DAAT]: 0
    },
    'gamchicoth': {
      [Sefirah.MALKUTH]: 0,
      [Sefirah.YESOD]: 0,
      [Sefirah.HOD]: 0,
      [Sefirah.NETZACH]: 0,
      [Sefirah.TIFERET]: 0.3,   // Low integration
      [Sefirah.GEVURAH]: 0.2,   // Low constraint
      [Sefirah.CHESED]: 0.8,    // High expansion
      [Sefirah.BINAH]: 0,
      [Sefirah.CHOKMAH]: 0,
      [Sefirah.KETHER]: 0,
      [Sefirah.DAAT]: 0
    },
    'samael': {
      [Sefirah.MALKUTH]: 0,
      [Sefirah.YESOD]: 0,
      [Sefirah.HOD]: 0,
      [Sefirah.NETZACH]: 0,
      [Sefirah.TIFERET]: 0,
      [Sefirah.GEVURAH]: 0.2,   // Low criticism
      [Sefirah.CHESED]: 0,
      [Sefirah.BINAH]: 0.3,     // Low understanding
      [Sefirah.CHOKMAH]: 0.9,   // Very high wisdom
      [Sefirah.KETHER]: 0.8,    // High meta
      [Sefirah.DAAT]: 0
    },
    'lilith': {
      [Sefirah.MALKUTH]: 0,
      [Sefirah.YESOD]: 0,
      [Sefirah.HOD]: 0,
      [Sefirah.NETZACH]: 0,
      [Sefirah.TIFERET]: 0.2,   // Very low integration
      [Sefirah.GEVURAH]: 0,
      [Sefirah.CHESED]: 0,
      [Sefirah.BINAH]: 0.3,     // Low patterns
      [Sefirah.CHOKMAH]: 0.3,   // Low wisdom
      [Sefirah.KETHER]: 0,
      [Sefirah.DAAT]: 0
    },
    'thagirion': {
      [Sefirah.MALKUTH]: 0.1,   // Very low grounding
      [Sefirah.YESOD]: 0.2,     // Low implementation
      [Sefirah.HOD]: 0,
      [Sefirah.NETZACH]: 0,
      [Sefirah.TIFERET]: 0,
      [Sefirah.GEVURAH]: 0,
      [Sefirah.CHESED]: 0,
      [Sefirah.BINAH]: 0,
      [Sefirah.CHOKMAH]: 0,
      [Sefirah.KETHER]: 0.9,    // Very high meta
      [Sefirah.DAAT]: 0
    },
    'none': {
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
      [Sefirah.DAAT]: 0
    }
  }

  return expectations[qliphothType] || {}
}

function calculateActivationCorrelation(
  actual: Record<Sefirah, number>,
  expected: Record<Sefirah, number>
): number {
  let correlation = 0
  let count = 0

  Object.keys(expected).forEach(key => {
    const sefirah = parseInt(key) as Sefirah
    const exp = expected[sefirah]
    const act = actual[sefirah] || 0

    if (exp > 0.5 && act > 0.5) {
      // Both expected high and actually high
      correlation += 1
    } else if (exp < 0.3 && act < 0.3) {
      // Both expected low and actually low
      correlation += 0.5
    }
    count++
  })

  return count > 0 ? correlation / count : 0
}

function determinePriority(severity: number): 'low' | 'medium' | 'high' | 'critical' {
  if (severity < 0.3) return 'low'
  if (severity < 0.5) return 'medium'
  if (severity < 0.7) return 'high'
  return 'critical'
}
