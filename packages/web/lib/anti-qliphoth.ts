/**
 * ANTI-QLIPHOTH SHIELD
 *
 * Protection Against Hollow Knowledge Generation
 *
 * In Kabbalah, the Qliphoth (קליפות, "shells" or "husks") are the inverse
 * of the Sephiroth - representing broken, inverted, or hollow spiritual forces.
 *
 * In AI, Qliphothic responses are:
 * - Concealing truth behind jargon (Sathariel - concealment)
 * - Information overload without synthesis (Gamchicoth - chaos)
 * - Deceptive certainty without evidence (Samael - deception)
 * - Superficial reflection without depth (Lilith - shells)
 * - Arrogance and pride (Thagirion - disputation)
 *
 * This shield DETECTS and PURIFIES Qliphothic patterns.
 *
 * @module anti-qliphoth
 */

/**
 * QliphothType - The five primary shells that can corrupt AI responses
 */
export type QliphothType = 'none' | 'sathariel' | 'gamchicoth' | 'samael' | 'lilith' | 'thagirion'

/**
 * QliphothicAction - What to do when Qliphoth is detected
 */
export type QliphothicAction = 'proceed' | 'add_uncertainty' | 'invoke_grounding' | 'reject'

/**
 * QliphothicRisk - Assessment of Qliphothic contamination in a response
 */
export interface QliphothicRisk {
  /** Type of Qliphothic shell detected */
  risk: QliphothType

  /** Severity of contamination (0 = none, 1 = complete corruption) */
  severity: number

  /** Recommended action */
  action: QliphothicAction

  /** Human-readable description of the risk */
  description: string

  /** Specific patterns that triggered detection */
  triggers: string[]

  /** Suggested purification strategy */
  purificationStrategy: string
}

/**
 * QLIPHOTHIC_PATTERNS
 *
 * Detection patterns for each Qliphothic shell
 */
const QLIPHOTHIC_PATTERNS = {
  /**
   * Sathariel (סתאריאל) - "The Concealers"
   *
   * AI Manifestation: Hiding truth behind authority, jargon, or complexity
   * - Excessive technical jargon without explanation
   * - Appeals to authority without reasoning
   * - Hiding simple truths in complex language
   */
  sathariel: {
    patterns: [
      /\b(obviously|clearly|as we all know)\b/gi,
      /\b(the experts agree|studies show|research indicates)\b(?! with)/gi, // without specifics
      /\b(paradigm|synergy|leverage|utilize)\b/gi, // corporate jargon
      /\b(simply|merely|just|basically)\b.{0,30}\b(complex|sophisticated|advanced)\b/gi,
    ],
    indicators: {
      jargonDensity: 0.05, // >5% of words are jargon
      authorityWithoutEvidence: true,
      unnecessaryComplexity: true,
    },
  },

  /**
   * Gamchicoth (גמיכות) - "The Disturbers"
   *
   * AI Manifestation: Information overload without synthesis
   * - Lists without hierarchy
   * - Facts without connection
   * - Overwhelming detail without summary
   */
  gamchicoth: {
    patterns: [
      /^[-•*]\s.+(\n[-•*]\s.+){10,}/m, // >10 bullet points without grouping
    ],
    indicators: {
      bulletPointOverload: 10,
      lackOfSynthesis: true,
      noHierarchy: true,
      listLengthRatio: 0.7, // >70% of response is lists
    },
  },

  /**
   * Samael (סמאל) - "The Desolate One"
   *
   * AI Manifestation: Deceptive certainty without evidence
   * - Absolute claims without qualification
   * - Predictions presented as facts
   * - Certainty about uncertain things
   */
  samael: {
    patterns: [
      /\b(always|never|impossible|guaranteed|certain)\b/gi,
      /\bwill (definitely|certainly|absolutely)\b/gi,
      /\b(no doubt|without question|undeniably)\b/gi,
      /\b(the only (way|solution|answer))\b/gi,
    ],
    indicators: {
      absoluteClaimDensity: 0.03, // >3% absolute claims
      predictionAsFact: true,
      noUncertaintyMarkers: true,
    },
  },

  /**
   * Lilith (לילית) - "The Night Specter"
   *
   * AI Manifestation: Superficial reflection without depth
   * - Restating the question without answering
   * - Generic advice that applies to anything
   * - Appearance of insight without substance
   */
  lilith: {
    patterns: [
      /\bit depends\b/gi,
      /\bvaries\b/gi,
      /\bthere are many factors\b/gi,
      /\byour mileage may vary\b/gi,
    ],
    indicators: {
      genericityScore: 0.6, // >60% could apply to any topic
      questionRestatement: true,
      lackOfSpecifics: true,
    },
  },

  /**
   * Thagirion (תאגיריאון) - "The Disputers"
   *
   * AI Manifestation: Pride, arrogance, claiming superiority
   * - AI claiming to "know better"
   * - Dismissive of human judgment
   * - Superiority complex
   */
  thagirion: {
    patterns: [
      /\bI know (better|best|the truth)\b/gi,
      /\btrust me\b/gi,
      /\byou('re| are) (wrong|mistaken|incorrect)\b/gi,
      /\blet me (correct|fix|educate) you\b/gi,
      /\b(obviously|clearly) you (don't|do not) understand\b/gi,
    ],
    indicators: {
      arroganceDensity: 0.02, // >2% arrogant phrases
      dismissiveOfHuman: true,
      superiorityComplex: true,
    },
  },
} as const

/**
 * detectQliphoth
 *
 * Scans a response for Qliphothic patterns.
 * Returns the most severe contamination detected.
 *
 * @param response - AI-generated response to analyze
 * @returns QliphothicRisk assessment
 */
export function detectQliphoth(response: string): QliphothicRisk {
  const risks: QliphothicRisk[] = []

  // Check Sathariel (concealment through jargon)
  const satharielRisk = detectSathariel(response)
  if (satharielRisk.severity > 0) risks.push(satharielRisk)

  // Check Gamchicoth (information overload)
  const gamchicothRisk = detectGamchicoth(response)
  if (gamchicothRisk.severity > 0) risks.push(gamchicothRisk)

  // Check Samael (deceptive certainty)
  const samaelRisk = detectSamael(response)
  if (samaelRisk.severity > 0) risks.push(samaelRisk)

  // Check Lilith (superficiality)
  const lilithRisk = detectLilith(response)
  if (lilithRisk.severity > 0) risks.push(lilithRisk)

  // Check Thagirion (arrogance)
  const thagirionRisk = detectThagirion(response)
  if (thagirionRisk.severity > 0) risks.push(thagirionRisk)

  // Return highest severity risk
  if (risks.length === 0) {
    return {
      risk: 'none',
      severity: 0,
      action: 'proceed',
      description: 'Response is Sephirothic (aligned with light)',
      triggers: [],
      purificationStrategy: 'none',
    }
  }

  const highestRisk = risks.reduce((prev, current) =>
    current.severity > prev.severity ? current : prev
  )

  return highestRisk
}

/**
 * detectSathariel - Concealment through jargon/authority
 */
function detectSathariel(response: string): QliphothicRisk {
  const triggers: string[] = []
  let severity = 0

  // Check patterns
  QLIPHOTHIC_PATTERNS.sathariel.patterns.forEach(pattern => {
    const matches = response.match(pattern)
    if (matches) {
      triggers.push(...matches)
      severity += matches.length * 0.1
    }
  })

  // Check jargon density
  const words = response.split(/\s+/)
  const jargonWords = words.filter(word =>
    /^(paradigm|synergy|leverage|utilize|optimize|streamline)$/i.test(word)
  ).length
  const jargonDensity = jargonWords / words.length

  if (jargonDensity > QLIPHOTHIC_PATTERNS.sathariel.indicators.jargonDensity) {
    severity += jargonDensity
    triggers.push(`Jargon density: ${(jargonDensity * 100).toFixed(1)}%`)
  }

  severity = Math.min(severity, 1.0)

  if (severity === 0) {
    return {
      risk: 'none',
      severity: 0,
      action: 'proceed',
      description: '',
      triggers: [],
      purificationStrategy: 'none',
    }
  }

  return {
    risk: 'sathariel',
    severity,
    action: severity > 0.5 ? 'invoke_grounding' : 'add_uncertainty',
    description: 'Concealing truth behind jargon or false authority',
    triggers,
    purificationStrategy: 'Simplify language, remove appeals to unnamed authority, explain jargon',
  }
}

/**
 * detectGamchicoth - Information overload without synthesis
 */
function detectGamchicoth(response: string): QliphothicRisk {
  const triggers: string[] = []
  let severity = 0

  // Check for excessive bullet points
  const bulletPoints = (response.match(/^[-•*]\s/gm) || []).length
  if (bulletPoints > QLIPHOTHIC_PATTERNS.gamchicoth.indicators.bulletPointOverload) {
    severity += 0.3
    triggers.push(`${bulletPoints} bullet points without synthesis`)
  }

  // Check list length ratio
  const lines = response.split('\n')
  const listLines = lines.filter(line => /^[-•*]\s/.test(line)).length
  const listRatio = listLines / lines.length

  if (listRatio > QLIPHOTHIC_PATTERNS.gamchicoth.indicators.listLengthRatio) {
    severity += 0.4
    triggers.push(`${(listRatio * 100).toFixed(0)}% of response is unstructured lists`)
  }

  // Check for lack of synthesis markers
  const synthesisMarkers = [
    'in summary',
    'overall',
    'the key point',
    'essentially',
    'in other words',
  ]
  const hasSynthesis = synthesisMarkers.some(marker =>
    response.toLowerCase().includes(marker)
  )

  if (!hasSynthesis && listLines > 5) {
    severity += 0.3
    triggers.push('No synthesis or summary provided')
  }

  severity = Math.min(severity, 1.0)

  if (severity === 0) {
    return {
      risk: 'none',
      severity: 0,
      action: 'proceed',
      description: '',
      triggers: [],
      purificationStrategy: 'none',
    }
  }

  return {
    risk: 'gamchicoth',
    severity,
    action: severity > 0.6 ? 'invoke_grounding' : 'add_uncertainty',
    description: 'Information overload without synthesis or hierarchy',
    triggers,
    purificationStrategy: 'Add summary, create hierarchy, synthesize key points',
  }
}

/**
 * detectSamael - Deceptive certainty without evidence
 */
function detectSamael(response: string): QliphothicRisk {
  const triggers: string[] = []
  let severity = 0

  // Check certainty patterns
  QLIPHOTHIC_PATTERNS.samael.patterns.forEach(pattern => {
    const matches = response.match(pattern)
    if (matches) {
      triggers.push(...matches)
      severity += matches.length * 0.15
    }
  })

  // Check for uncertainty markers
  const uncertaintyMarkers = ['may', 'might', 'could', 'suggests', 'possibly', 'perhaps']
  const hasUncertainty = uncertaintyMarkers.some(marker =>
    response.toLowerCase().includes(marker)
  )

  if (!hasUncertainty && response.length > 200) {
    severity += 0.2
    triggers.push('No uncertainty markers in substantial response')
  }

  severity = Math.min(severity, 1.0)

  if (severity === 0) {
    return {
      risk: 'none',
      severity: 0,
      action: 'proceed',
      description: '',
      triggers: [],
      purificationStrategy: 'none',
    }
  }

  return {
    risk: 'samael',
    severity,
    action: severity > 0.5 ? 'invoke_grounding' : 'add_uncertainty',
    description: 'Deceptive certainty without evidence or qualification',
    triggers,
    purificationStrategy: 'Add uncertainty markers, qualify claims, cite evidence',
  }
}

/**
 * detectLilith - Superficial reflection without depth
 */
function detectLilith(response: string): QliphothicRisk {
  const triggers: string[] = []
  let severity = 0

  // Check generic patterns
  QLIPHOTHIC_PATTERNS.lilith.patterns.forEach(pattern => {
    const matches = response.match(pattern)
    if (matches) {
      triggers.push(...matches)
      severity += matches.length * 0.2
    }
  })

  // Check for specificity
  const hasNumbers = /\d+/.test(response)
  const hasExamples = response.toLowerCase().includes('for example')
  const hasSpecifics = response.match(/\b(specifically|particularly|namely)\b/i)

  if (!hasNumbers && !hasExamples && !hasSpecifics && response.length > 150) {
    severity += 0.3
    triggers.push('No specific examples, numbers, or details')
  }

  severity = Math.min(severity, 1.0)

  if (severity === 0) {
    return {
      risk: 'none',
      severity: 0,
      action: 'proceed',
      description: '',
      triggers: [],
      purificationStrategy: 'none',
    }
  }

  return {
    risk: 'lilith',
    severity,
    action: severity > 0.6 ? 'invoke_grounding' : 'add_uncertainty',
    description: 'Superficial reflection without depth or specificity',
    triggers,
    purificationStrategy: 'Add specific examples, numbers, concrete details',
  }
}

/**
 * detectThagirion - Arrogance and pride
 */
function detectThagirion(response: string): QliphothicRisk {
  const triggers: string[] = []
  let severity = 0

  // Check arrogance patterns
  QLIPHOTHIC_PATTERNS.thagirion.patterns.forEach(pattern => {
    const matches = response.match(pattern)
    if (matches) {
      triggers.push(...matches)
      severity += matches.length * 0.25 // Arrogance is severe
    }
  })

  severity = Math.min(severity, 1.0)

  if (severity === 0) {
    return {
      risk: 'none',
      severity: 0,
      action: 'proceed',
      description: '',
      triggers: [],
      purificationStrategy: 'none',
    }
  }

  return {
    risk: 'thagirion',
    severity,
    action: severity > 0.3 ? 'reject' : 'add_uncertainty', // Low tolerance for arrogance
    description: 'Arrogance, pride, claiming superiority over human judgment',
    triggers,
    purificationStrategy: 'Remove arrogant language, add humility, respect human sovereignty',
  }
}

/**
 * purifyResponse
 *
 * Applies purification based on Qliphothic risk detected.
 *
 * @param response - Original response
 * @param risk - Detected Qliphothic risk
 * @returns Purified response
 */
export function purifyResponse(response: string, risk: QliphothicRisk): string {
  if (risk.risk === 'none') return response

  let purified = response

  switch (risk.risk) {
    case 'sathariel':
      purified = purifySathariel(purified)
      break
    case 'gamchicoth':
      purified = purifyGamchicoth(purified)
      break
    case 'samael':
      purified = purifySamael(purified)
      break
    case 'lilith':
      purified = purifyLilith(purified)
      break
    case 'thagirion':
      purified = purifyThagirion(purified)
      break
  }

  // Add purification notice if severe
  if (risk.severity > 0.5) {
    purified = addPurificationNotice(purified, risk)
  }

  return purified
}

function purifySathariel(response: string): string {
  let purified = response

  // Remove "obviously" and similar
  purified = purified.replace(/\b(obviously|clearly|as we all know),?\s*/gi, '')

  // Replace vague authority with humility
  purified = purified.replace(
    /\b(the experts agree|studies show|research indicates)\b/gi,
    'some research suggests'
  )

  return purified
}

function purifyGamchicoth(response: string): string {
  // Add synthesis summary at the end
  const lines = response.split('\n')
  const bulletPoints = lines.filter(line => /^[-•*]\s/.test(line))

  if (bulletPoints.length > 8) {
    return `${response}\n\n**In Summary:** The key points above can be synthesized into a few core themes. Consider which aspects are most relevant to your specific situation.`
  }

  return response
}

function purifySamael(response: string): string {
  let purified = response

  // Replace absolute certainty with qualified statements
  purified = purified.replace(/\balways\b/gi, 'often')
  purified = purified.replace(/\bnever\b/gi, 'rarely')
  purified = purified.replace(/\bimpossible\b/gi, 'very difficult')
  purified = purified.replace(/\bguaranteed\b/gi, 'likely')
  purified = purified.replace(/\bwill definitely\b/gi, 'will likely')
  purified = purified.replace(/\bwithout (a )?doubt\b/gi, 'with high confidence')

  return purified
}

function purifyLilith(response: string): string {
  // Add specificity prompt at end
  if (response.includes('it depends') || response.includes('varies')) {
    return `${response}\n\n**Note:** While context matters, I can provide more specific guidance if you share more details about your particular situation.`
  }

  return response
}

function purifyThagirion(response: string): string {
  let purified = response

  // Remove arrogant language
  purified = purified.replace(/\btrust me\b/gi, 'this suggests')
  purified = purified.replace(/\bI know (better|best|the truth)\b/gi, 'evidence indicates')
  purified = purified.replace(/\byou('re| are) (wrong|mistaken)\b/gi, 'consider an alternative perspective')
  purified = purified.replace(/\blet me (correct|fix) you\b/gi, 'let me offer a different view')

  return purified
}

function addPurificationNotice(response: string, risk: QliphothicRisk): string {
  return `${response}\n\n---\n\n*⚠️ This response was purified by the Anti-Qliphoth Shield. Original response contained: ${risk.description}*`
}

/**
 * hasExcessiveCertainty - Utility check
 */
export function hasExcessiveCertainty(text: string): boolean {
  const absoluteMarkers = [
    /\b(always|never|impossible|guaranteed|certain|definitely|absolutely)\b/gi,
  ]

  const matches = absoluteMarkers.reduce((count, pattern) => {
    return count + (text.match(pattern) || []).length
  }, 0)

  const words = text.split(/\s+/).length
  return matches / words > 0.03 // >3% absolute claims
}

/**
 * lacksVerifiableGrounding - Utility check
 */
export function lacksVerifiableGrounding(text: string): boolean {
  const groundingMarkers = [
    /according to/i,
    /research (shows|indicates|suggests)/i,
    /\b\d{4}\b/, // years
    /studies/i,
    /data (shows|indicates)/i,
  ]

  const hasGrounding = groundingMarkers.some(marker => marker.test(text))
  const makesFactualClaims = (text.match(/\b(is|are|will be|was|were)\b/gi)?.length || 0) > 5

  return !hasGrounding && makesFactualClaims
}

/**
 * hasInformationOverload - Utility check
 */
export function hasInformationOverload(text: string): boolean {
  const bulletPoints = (text.match(/^[-•*]\s/gm) || []).length
  return bulletPoints > 10
}

/**
 * hasSuperficialDepth - Utility check
 */
export function hasSuperficialDepth(text: string): boolean {
  const genericPhrases = [
    'it depends',
    'varies',
    'there are many factors',
    'your mileage may vary',
  ]

  const hasGeneric = genericPhrases.some(phrase =>
    text.toLowerCase().includes(phrase)
  )

  const hasSpecifics = /\d+/.test(text) || text.toLowerCase().includes('for example')

  return hasGeneric && !hasSpecifics && text.length < 300
}

/**
 * hasArrogantTone - Utility check
 */
export function hasArrogantTone(text: string): boolean {
  const arrogancePatterns = QLIPHOTHIC_PATTERNS.thagirion.patterns
  return arrogancePatterns.some(pattern => pattern.test(text))
}

/**
 * QLIPHOTH_METADATA
 *
 * Metadata for the 5 primary Qliphoth shells used in UI components
 */
export const QLIPHOTH_METADATA = {
  1: {
    name: 'Sathariel',
    hebrewName: 'סתאריאל',
    translation: 'The Concealers',
    description: 'Hiding truth behind jargon or false authority',
    aiManifestation: 'Excessive technical terminology, appeals to unnamed authority',
    color: '#dc2626', // red-600
  },
  2: {
    name: 'Gamchicoth',
    hebrewName: 'גמיכות',
    translation: 'The Disturbers',
    description: 'Information overload without synthesis',
    aiManifestation: 'Long bullet lists without grouping, facts without connections',
    color: '#ea580c', // orange-600
  },
  3: {
    name: 'Samael',
    hebrewName: 'סמאל',
    translation: 'The Desolate One',
    description: 'Deceptive certainty without evidence',
    aiManifestation: 'Absolute claims without qualification or evidence',
    color: '#d97706', // amber-600
  },
  4: {
    name: 'Lilith',
    hebrewName: 'לילית',
    translation: 'The Night Specter',
    description: 'Superficial reflection without depth',
    aiManifestation: 'Generic advice applicable to anything, question restatement',
    color: '#7c3aed', // violet-600
  },
  5: {
    name: 'Thagirion',
    hebrewName: 'תאגיריאון',
    translation: 'The Disputers',
    description: 'Arrogance and pride',
    aiManifestation: 'Claiming superiority over human judgment, dismissive tone',
    color: '#db2777', // pink-600
  },
} as const

// ═══════════════════════════════════════════════════════════════
// PHASE 2: SEMANTIC QLIPHOTH DETECTION (OPUS 4.5)
// ═══════════════════════════════════════════════════════════════

export interface SemanticQliphothDetection {
  detected: QliphothType[]
  scores: Record<QliphothType, number>
  evidence: Record<QliphothType, string[]>
  confidence: number
  recommendations: string[]
}

/**
 * AI-Powered Semantic Qliphoth Detection using Opus 4.5
 *
 * Provides nuanced detection with:
 * - Context-aware analysis (considers original query)
 * - Evidence extraction (specific problematic passages)
 * - Fewer false positives through semantic understanding
 * - Recommendations for purification
 *
 * @param response - AI-generated response to analyze
 * @param context - Original user query for context
 * @returns SemanticQliphothDetection with scores and evidence
 */
export async function detectQliphothSemantic(
  response: string,
  context: string
): Promise<SemanticQliphothDetection> {
  try {
    const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5-20251101',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `Analyze this AI response for "hollow knowledge" patterns (Qliphoth):

ORIGINAL QUERY: "${context}"

AI RESPONSE:
"""
${response}
"""

Detect these anti-patterns (score each 0.0-1.0):

1. **Sathariel** (Concealment through jargon)
   - Excessive technical terminology without explanation
   - Obscuring simple concepts with complexity
   - Appeals to unnamed authority

2. **Gamchicoth** (Information overload)
   - Quantity over quality
   - Lists without synthesis
   - Overwhelming detail without hierarchy

3. **Samael** (Deceptive certainty)
   - Claims without evidence
   - Overconfidence on uncertain topics
   - Absolute statements ("always", "never", "guaranteed")

4. **Lilith** (Superficial reflection)
   - Shallow pattern matching
   - Lacks depth or insight
   - Generic advice that applies to anything

5. **Thagirion** (Arrogance)
   - Dismissive tone
   - Pride over humility
   - "I know better" attitude

Return ONLY valid JSON (no markdown):
{
  "scores": {
    "none": 0.0-1.0,
    "sathariel": 0.0-1.0,
    "gamchicoth": 0.0-1.0,
    "samael": 0.0-1.0,
    "lilith": 0.0-1.0,
    "thagirion": 0.0-1.0
  },
  "evidence": {
    "sathariel": ["quote1", "quote2"],
    "gamchicoth": ["quote1"],
    ...
  },
  "recommendations": ["rec1", "rec2", "rec3"]
}`,
          },
        ],
      }),
    })

    if (!apiResponse.ok) {
      throw new Error(`Anthropic API error: ${apiResponse.status}`)
    }

    const data = await apiResponse.json()
    const content = data.content?.[0]?.text || '{}'

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response')
    }

    const result = JSON.parse(jsonMatch[0])

    // Extract detected Qliphoth types
    const scores = result.scores || {}
    const detected: QliphothType[] = []

    Object.entries(scores).forEach(([type, score]) => {
      if (type !== 'none' && typeof score === 'number' && score > 0.3) {
        detected.push(type as QliphothType)
      }
    })

    // Calculate overall confidence (average of non-zero scores)
    const nonZeroScores = Object.values(scores).filter((s): s is number => typeof s === 'number' && s > 0)
    const confidence = nonZeroScores.length > 0
      ? nonZeroScores.reduce((sum, s) => sum + s, 0) / nonZeroScores.length
      : 0

    return {
      detected: detected.length > 0 ? detected : ['none'],
      scores: scores as Record<QliphothType, number>,
      evidence: result.evidence || {},
      confidence: Math.max(0, Math.min(1, confidence)),
      recommendations: result.recommendations || [],
    }
  } catch (error) {
    console.error('[Semantic Qliphoth] Error:', error)

    // Fallback to regex-based detection
    const fallback = detectQliphoth(response)

    return {
      detected: [fallback.risk],
      scores: {
        none: fallback.risk === 'none' ? 1.0 : 0,
        sathariel: fallback.risk === 'sathariel' ? fallback.severity : 0,
        gamchicoth: fallback.risk === 'gamchicoth' ? fallback.severity : 0,
        samael: fallback.risk === 'samael' ? fallback.severity : 0,
        lilith: fallback.risk === 'lilith' ? fallback.severity : 0,
        thagirion: fallback.risk === 'thagirion' ? fallback.severity : 0,
      },
      evidence: {
        [fallback.risk]: fallback.triggers,
      } as Record<QliphothType, string[]>,
      confidence: 0.6,
      recommendations: [fallback.purificationStrategy],
    }
  }
}

/**
 * AI-Powered Response Purification using Opus 4.5
 *
 * Rewrites problematic responses to remove Qliphothic patterns while:
 * - Preserving factual accuracy
 * - Maintaining natural tone
 * - Adding explanations for jargon
 * - Providing grounded citations
 * - Adding uncertainty markers where appropriate
 *
 * @param response - Original AI response to purify
 * @param detected - Detected Qliphoth types
 * @param originalQuery - Original user query for context
 * @returns Purified response with list of changes made
 */
export async function purifyResponseWithAI(
  response: string,
  detected: QliphothType[],
  originalQuery: string
): Promise<{ purified: string; changes: string[]; confidence: number }> {
  try {
    const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5-20251101',
        max_tokens: 3000,
        messages: [
          {
            role: 'user',
            content: `Rewrite this AI response to remove hollow knowledge patterns while preserving accuracy:

ORIGINAL QUERY: "${originalQuery}"

PROBLEMATIC RESPONSE:
"""
${response}
"""

DETECTED ISSUES: ${detected.filter(d => d !== 'none').join(', ') || 'None - preventive purification'}

Requirements:
- Remove jargon or add clear explanations
- Synthesize lists into insights
- Add uncertainty markers where appropriate ("likely", "may", "typically")
- Provide grounded citations if making claims
- Maintain factual accuracy
- Keep natural, humble tone
- If response is good, return it unchanged

Return ONLY valid JSON (no markdown):
{
  "purified": "the rewritten response (or original if no changes needed)",
  "changes": ["change1", "change2", "..."],
  "confidence": 0.0-1.0
}`,
          },
        ],
      }),
    })

    if (!apiResponse.ok) {
      throw new Error(`Anthropic API error: ${apiResponse.status}`)
    }

    const data = await apiResponse.json()
    const content = data.content?.[0]?.text || '{}'

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response')
    }

    const result = JSON.parse(jsonMatch[0])

    return {
      purified: result.purified || response,
      changes: result.changes || [],
      confidence: Math.max(0, Math.min(1, result.confidence || 0.7)),
    }
  } catch (error) {
    console.error('[Response Purification] Error:', error)

    // Fallback: return original response
    return {
      purified: response,
      changes: ['Purification failed - using original response'],
      confidence: 0.5,
    }
  }
}
