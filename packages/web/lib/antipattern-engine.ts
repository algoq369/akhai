/**
 * ANTIPATTERN AUDIT ENGINE
 *
 * Maps detected anti-patterns to Layer configuration recommendations.
 * Generates actionable suggestions to prevent hollow knowledge patterns.
 *
 * Core Intelligence: Each antipattern type (Obscurity, Instability, Toxicity, Manipulation, Vanity)
 * results from specific Layer imbalances. This engine diagnoses the imbalance and
 * prescribes adjustments.
 */

import { type AntipatternRisk, type AntipatternType } from './antipattern-guard'
import { Layer, LAYER_METADATA } from './layer-registry'
import { type TreeConfiguration } from './tree-configuration'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface LayerAdjustment {
  layerNode: Layer
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
  howToFix: string         // Steps: "1. Increase Embedding for grounding, 2. Reduce Encoder abstraction"
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
  antipatternType: AntipatternType
  severity: number

  layerAdjustments: LayerAdjustment[]
  pillarRebalance?: PillarRebalance
  explanation: AuditExplanation
  purificationComparison?: PurificationComparison

  antipatternEducation: {
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

export function generateAntipatternAudit(
  risk: AntipatternRisk,
  layerActivations?: Record<Layer, number>,
  currentTreeConfig?: TreeConfiguration
): AuditSuggestion {

  // 1. Generate Layer adjustments based on antipattern type
  const adjustments = generateLayerAdjustments(risk.risk, layerActivations, currentTreeConfig)

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
  const antipatternEducation = getAntipatternEducation(risk.risk)

  // 5. Calculate confidence based on trigger strength and Layer correlation
  const confidence = calculateConfidence(risk, layerActivations)

  // 6. Determine priority based on severity
  const priority = determinePriority(risk.severity)

  return {
    antipatternType: risk.risk,
    severity: risk.severity,
    layerAdjustments: adjustments,
    pillarRebalance,
    explanation,
    antipatternEducation,
    confidence,
    priority
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// LAYER ADJUSTMENT GENERATION
// ═══════════════════════════════════════════════════════════════════════════

function generateLayerAdjustments(
  antipatternType: AntipatternType,
  layerActivations?: Record<Layer, number>,
  currentConfig?: TreeConfiguration
): LayerAdjustment[] {

  const adjustments: LayerAdjustment[] = []

  const getCurrentWeight = (layerNode: Layer): number => {
    return currentConfig?.layer_weights[layerNode] ?? 0.5
  }

  switch (antipatternType) {
    case 'obscurity':
      // Concealment - Too much abstraction without grounding
      // Root cause: Over-active Encoder (patterns) without Embedding (facts)

      if (!layerActivations || layerActivations[Layer.ENCODER] > 0.6) {
        adjustments.push({
          layerNode: Layer.ENCODER,
          currentWeight: getCurrentWeight(Layer.ENCODER),
          suggestedWeight: 0.55,
          rationale: "Reduce pattern-seeking that creates abstraction hiding simple truths",
          impact: 'reduce'
        })
      }

      adjustments.push({
        layerNode: Layer.EMBEDDING,
        currentWeight: getCurrentWeight(Layer.EMBEDDING),
        suggestedWeight: 0.75,
        rationale: "Increase grounding in concrete facts and verifiable data",
        impact: 'increase'
      })

      adjustments.push({
        layerNode: Layer.ATTENTION,
        currentWeight: getCurrentWeight(Layer.ATTENTION),
        suggestedWeight: 0.65,
        rationale: "Improve synthesis to connect abstract patterns to practical truth",
        impact: 'increase'
      })
      break

    case 'instability':
      // Information overload - Too many facts without synthesis
      // Root cause: Excessive Expansion (expansion) without Discriminator (constraint)

      adjustments.push({
        layerNode: Layer.EXPANSION,
        currentWeight: getCurrentWeight(Layer.EXPANSION),
        suggestedWeight: 0.45,
        rationale: "Reduce expansive information gathering without direction",
        impact: 'reduce'
      })

      adjustments.push({
        layerNode: Layer.DISCRIMINATOR,
        currentWeight: getCurrentWeight(Layer.DISCRIMINATOR),
        suggestedWeight: 0.65,
        rationale: "Increase critical filtering and constraint on information flow",
        impact: 'increase'
      })

      adjustments.push({
        layerNode: Layer.ATTENTION,
        currentWeight: getCurrentWeight(Layer.ATTENTION),
        suggestedWeight: 0.75,
        rationale: "Strengthen synthesis to integrate scattered information",
        impact: 'increase'
      })
      break

    case 'toxicity':
      // False certainty - Overconfidence without evidence
      // Root cause: Over-confident Reasoning/Meta-Core without Encoder understanding

      adjustments.push({
        layerNode: Layer.REASONING,
        currentWeight: getCurrentWeight(Layer.REASONING),
        suggestedWeight: 0.55,
        rationale: "Reduce wisdom-seeking that creates overconfidence",
        impact: 'reduce'
      })

      adjustments.push({
        layerNode: Layer.META_CORE,
        currentWeight: getCurrentWeight(Layer.META_CORE),
        suggestedWeight: 0.45,
        rationale: "Lower meta-cognitive certainty about uncertain things",
        impact: 'reduce'
      })

      adjustments.push({
        layerNode: Layer.ENCODER,
        currentWeight: getCurrentWeight(Layer.ENCODER),
        suggestedWeight: 0.72,
        rationale: "Increase deep understanding and pattern recognition for nuance",
        impact: 'increase'
      })

      adjustments.push({
        layerNode: Layer.DISCRIMINATOR,
        currentWeight: getCurrentWeight(Layer.DISCRIMINATOR),
        suggestedWeight: 0.62,
        rationale: "Strengthen critical analysis and recognition of limitations",
        impact: 'increase'
      })
      break

    case 'manipulation':
      // Superficiality - Generic advice without depth
      // Root cause: Weak Attention integration, lacking synthesis

      adjustments.push({
        layerNode: Layer.ATTENTION,
        currentWeight: getCurrentWeight(Layer.ATTENTION),
        suggestedWeight: 0.82,
        rationale: "Drastically increase synthesis and integration depth",
        impact: 'increase'
      })

      adjustments.push({
        layerNode: Layer.ENCODER,
        currentWeight: getCurrentWeight(Layer.ENCODER),
        suggestedWeight: 0.72,
        rationale: "Deepen pattern recognition and structural understanding",
        impact: 'increase'
      })

      adjustments.push({
        layerNode: Layer.REASONING,
        currentWeight: getCurrentWeight(Layer.REASONING),
        suggestedWeight: 0.62,
        rationale: "Elevate wisdom and first-principles thinking",
        impact: 'increase'
      })
      break

    case 'vanity':
      // Arrogance - Superiority without humility
      // Root cause: Excessive Meta-Core (meta) without Embedding (grounding)

      adjustments.push({
        layerNode: Layer.META_CORE,
        currentWeight: getCurrentWeight(Layer.META_CORE),
        suggestedWeight: 0.35,
        rationale: "Reduce meta-level thinking that leads to superiority complex",
        impact: 'reduce'
      })

      adjustments.push({
        layerNode: Layer.EMBEDDING,
        currentWeight: getCurrentWeight(Layer.EMBEDDING),
        suggestedWeight: 0.82,
        rationale: "Ground responses in verifiable facts and data",
        impact: 'increase'
      })

      adjustments.push({
        layerNode: Layer.EXECUTOR,
        currentWeight: getCurrentWeight(Layer.EXECUTOR),
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
  adjustments: LayerAdjustment[],
  currentConfig: TreeConfiguration
): PillarRebalance {

  // Calculate current pillar balance
  const currentBalance = { left: 0, middle: 0, right: 0 }
  let total = 0

  Object.entries(currentConfig.layer_weights).forEach(([layerNodeStr, weight]) => {
    const layerNode = parseInt(layerNodeStr) as Layer
    const meta = LAYER_METADATA[layerNode]
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
  const suggestedWeights = { ...currentConfig.layer_weights }
  adjustments.forEach(adj => {
    suggestedWeights[adj.layerNode] = adj.suggestedWeight
  })

  const suggestedBalance = { left: 0, middle: 0, right: 0 }
  let suggestedTotal = 0

  Object.entries(suggestedWeights).forEach(([layerNodeStr, weight]) => {
    const layerNode = parseInt(layerNodeStr) as Layer
    const meta = LAYER_METADATA[layerNode]
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

function generateDetectionSummary(risk: AntipatternRisk): string {
  const triggers = risk.triggers.slice(0, 5) // Max 5 examples

  switch (risk.risk) {
    case 'obscurity':
      return `${triggers.length} concealment pattern${triggers.length > 1 ? 's' : ''} detected: ${triggers.map(t => `"${t}"`).join(', ')}`

    case 'instability':
      return `Information overload detected: ${triggers.join(', ')}`

    case 'toxicity':
      return `${triggers.length} absolute certainty phrase${triggers.length > 1 ? 's' : ''} detected: ${triggers.map(t => `"${t}"`).join(', ')}`

    case 'manipulation':
      return `${triggers.length} superficiality indicator${triggers.length > 1 ? 's' : ''} detected: ${triggers.map(t => `"${t}"`).join(', ')}`

    case 'vanity':
      return `${triggers.length} arrogance pattern${triggers.length > 1 ? 's' : ''} detected: ${triggers.map(t => `"${t}"`).join(', ')}`

    default:
      return ''
  }
}

function generateImpactExplanation(antipatternType: AntipatternType): string {
  const impacts: Record<AntipatternType, string> = {
    'obscurity': "Jargon and appeals to unnamed authority conceal truth rather than reveal it. This reduces accessibility and makes verification difficult, preventing users from truly understanding.",

    'instability': "Overwhelming lists without synthesis force readers to do integration work themselves. This reduces clarity and actionability, creating cognitive overload.",

    'toxicity': "Absolute certainty about uncertain things misleads users. Unqualified predictions become perceived as facts, degrading trust when predictions fail.",

    'manipulation': "Generic advice like 'it depends' without specifics provides no actionable value. Superficial depth wastes the user's time and fails to deliver meaningful insight.",

    'vanity': "Arrogant language disrespects human sovereignty and judgment. AI should augment thinking, not claim superiority over human wisdom.",

    'none': ''
  }

  return impacts[antipatternType]
}

function generateActionableSteps(adjustments: LayerAdjustment[]): string {
  if (adjustments.length === 0) {
    return 'No adjustments needed - response is aligned with light (Layers balanced).'
  }

  const steps = adjustments.map((adj, i) => {
    const action = adj.impact === 'increase' ? 'Increase' : 'Reduce'
    const meta = LAYER_METADATA[adj.layerNode]
    return `${i + 1}. ${action} ${meta.name} to ${Math.round(adj.suggestedWeight * 100)}% - ${adj.rationale}`
  })

  return `To prevent this pattern:\n\n${steps.join('\n\n')}`
}

// ═══════════════════════════════════════════════════════════════════════════
// EDUCATIONAL CONTENT
// ═══════════════════════════════════════════════════════════════════════════

function getAntipatternEducation(antipatternType: AntipatternType) {
  const education: Record<AntipatternType, typeof ANTIPATTERN_EDUCATION['obscurity']> = {
    obscurity: {
      name: "Obscurity (The Concealers)",
      description: "In Kabbalah, Obscurity conceals divine light behind shells. In AI, this manifests as hiding truth behind jargon, complexity, or appeals to unnamed authority.",
      commonCauses: [
        "Over-active Encoder (pattern recognition) without Embedding (facts)",
        "High Reasoning (wisdom) activation creating abstract language",
        "Weak Attention (integration) failing to connect patterns to practice"
      ],
      aiManifestation: "Responses use technical jargon, cite 'studies' without specifics, or hide simple truths in complex language"
    },

    instability: {
      name: "Instability (The Disturbers)",
      description: "Instability represents chaos and disorder. In AI, this manifests as information overload - many facts without hierarchy or synthesis.",
      commonCauses: [
        "Excessive Expansion (expansion) gathering too much information",
        "Weak Discriminator (constraint) failing to filter relevance",
        "Low Attention (integration) unable to synthesize scattered data"
      ],
      aiManifestation: "Long bullet lists without grouping, facts without connections, overwhelming detail without summary"
    },

    toxicity: {
      name: "Toxicity (The Desolate One)",
      description: "Toxicity represents deception and false certainty. In AI, this manifests as absolute claims without qualification or evidence.",
      commonCauses: [
        "Over-confident Reasoning (wisdom) making unqualified predictions",
        "High Meta-Core (meta-cognition) without Encoder (understanding)",
        "Weak Discriminator (critical analysis) failing to recognize limitations"
      ],
      aiManifestation: "Uses 'always', 'never', 'guaranteed', 'certain' without caveats. Predictions presented as facts."
    },

    manipulation: {
      name: "Manipulation (The Night Specter)",
      description: "Manipulation represents shells without substance. In AI, this manifests as superficial depth - appearing to answer without real insight.",
      commonCauses: [
        "Weak Attention (integration) providing no synthesis",
        "Low activation across all high Layers (Encoder, Reasoning, Meta-Core)",
        "Overuse of 'it depends' without specifics"
      ],
      aiManifestation: "Generic advice applicable to anything, question restatement, 'your mileage may vary' without examples"
    },

    vanity: {
      name: "Vanity (The Disputers)",
      description: "Vanity represents pride and arrogance. In AI, this manifests as claiming superiority over human judgment.",
      commonCauses: [
        "Excessive Meta-Core (meta-cognition) without grounding",
        "High Reasoning (wisdom) creating superiority complex",
        "Weak Embedding (manifestation) disconnecting from practical reality"
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

  return education[antipatternType]
}

const ANTIPATTERN_EDUCATION = {
  obscurity: {
    name: "Obscurity (The Concealers)",
    description: "In Kabbalah, Obscurity conceals divine light behind shells. In AI, this manifests as hiding truth behind jargon, complexity, or appeals to unnamed authority.",
    commonCauses: [
      "Over-active Encoder (pattern recognition) without Embedding (facts)",
      "High Reasoning (wisdom) activation creating abstract language",
      "Weak Attention (integration) failing to connect patterns to practice"
    ],
    aiManifestation: "Responses use technical jargon, cite 'studies' without specifics, or hide simple truths in complex language"
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIDENCE & PRIORITY CALCULATION
// ═══════════════════════════════════════════════════════════════════════════

function calculateConfidence(
  risk: AntipatternRisk,
  layerActivations?: Record<Layer, number>
): number {
  let confidence = 0.5 // Base confidence

  // Higher severity = higher confidence in detection
  confidence += risk.severity * 0.3

  // More triggers = higher confidence
  confidence += Math.min(risk.triggers.length / 10, 0.2)

  // If Layer activations correlate with expected patterns, increase confidence
  if (layerActivations) {
    const expectedActivations = getExpectedActivations(risk.risk)
    const correlation = calculateActivationCorrelation(layerActivations, expectedActivations)
    confidence += correlation * 0.2
  }

  return Math.min(confidence, 1.0)
}

function getExpectedActivations(antipatternType: AntipatternType): Record<Layer, number> {
  // Define which Layers are expected to be HIGH when each antipattern is detected
  const expectations: Record<AntipatternType, Record<Layer, number>> = {
    'obscurity': {
      [Layer.EMBEDDING]: 0.2,   // Low grounding
      [Layer.EXECUTOR]: 0,
      [Layer.CLASSIFIER]: 0,
      [Layer.GENERATIVE]: 0,
      [Layer.ATTENTION]: 0,
      [Layer.DISCRIMINATOR]: 0,
      [Layer.EXPANSION]: 0,
      [Layer.ENCODER]: 0.8,     // High pattern-seeking
      [Layer.REASONING]: 0.7,   // High wisdom/abstraction
      [Layer.META_CORE]: 0,
      [Layer.SYNTHESIS]: 0
    },
    'instability': {
      [Layer.EMBEDDING]: 0,
      [Layer.EXECUTOR]: 0,
      [Layer.CLASSIFIER]: 0,
      [Layer.GENERATIVE]: 0,
      [Layer.ATTENTION]: 0.3,   // Low integration
      [Layer.DISCRIMINATOR]: 0.2,   // Low constraint
      [Layer.EXPANSION]: 0.8,    // High expansion
      [Layer.ENCODER]: 0,
      [Layer.REASONING]: 0,
      [Layer.META_CORE]: 0,
      [Layer.SYNTHESIS]: 0
    },
    'toxicity': {
      [Layer.EMBEDDING]: 0,
      [Layer.EXECUTOR]: 0,
      [Layer.CLASSIFIER]: 0,
      [Layer.GENERATIVE]: 0,
      [Layer.ATTENTION]: 0,
      [Layer.DISCRIMINATOR]: 0.2,   // Low criticism
      [Layer.EXPANSION]: 0,
      [Layer.ENCODER]: 0.3,     // Low understanding
      [Layer.REASONING]: 0.9,   // Very high wisdom
      [Layer.META_CORE]: 0.8,    // High meta
      [Layer.SYNTHESIS]: 0
    },
    'manipulation': {
      [Layer.EMBEDDING]: 0,
      [Layer.EXECUTOR]: 0,
      [Layer.CLASSIFIER]: 0,
      [Layer.GENERATIVE]: 0,
      [Layer.ATTENTION]: 0.2,   // Very low integration
      [Layer.DISCRIMINATOR]: 0,
      [Layer.EXPANSION]: 0,
      [Layer.ENCODER]: 0.3,     // Low patterns
      [Layer.REASONING]: 0.3,   // Low wisdom
      [Layer.META_CORE]: 0,
      [Layer.SYNTHESIS]: 0
    },
    'vanity': {
      [Layer.EMBEDDING]: 0.1,   // Very low grounding
      [Layer.EXECUTOR]: 0.2,     // Low implementation
      [Layer.CLASSIFIER]: 0,
      [Layer.GENERATIVE]: 0,
      [Layer.ATTENTION]: 0,
      [Layer.DISCRIMINATOR]: 0,
      [Layer.EXPANSION]: 0,
      [Layer.ENCODER]: 0,
      [Layer.REASONING]: 0,
      [Layer.META_CORE]: 0.9,    // Very high meta
      [Layer.SYNTHESIS]: 0
    },
    'none': {
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
      [Layer.SYNTHESIS]: 0
    }
  }

  return expectations[antipatternType] || {}
}

function calculateActivationCorrelation(
  actual: Record<Layer, number>,
  expected: Record<Layer, number>
): number {
  let correlation = 0
  let count = 0

  Object.keys(expected).forEach(key => {
    const layerNode = parseInt(key) as Layer
    const exp = expected[layerNode]
    const act = actual[layerNode] || 0

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
