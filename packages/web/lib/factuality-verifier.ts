/**
 * FACTUALITY VERIFIER
 *
 * Phase 2: AI-Powered Factuality Verification with Opus 4.5
 *
 * Provides cross-referencing and claim verification to detect:
 * - Unsupported claims without evidence
 * - Potential factual errors
 * - Hallucinations
 * - Contradictions
 *
 * @module factuality-verifier
 */

export interface FactualityVerification {
  score: number // 0.0-1.0 (1.0 = fully supported)
  triggered: boolean // true if score < threshold
  unsupportedClaims: string[]
  recommendations: string[]
  confidence: number
}

// Domain detection for context-aware verification
export type QueryDomain = 'economic' | 'scientific' | 'technical' | 'historical' | 'general'

/**
 * Detect query domain for context-aware verification
 */
export function detectQueryDomain(query: string): QueryDomain {
  const lowerQuery = query.toLowerCase()

  // Economic/Financial keywords
  const economicKeywords = [
    'gdp', 'trillion', 'billion', 'economy', 'economic', 'financial',
    'market', 'stock', 'currency', 'inflation', 'debt', 'trade',
    'world bank', 'imf', 'federal reserve', 'world economic forum',
    'interest rate', 'fiscal', 'monetary', 'investment', 'capital',
    'finance', 'banking', 'forex', 'cryptocurrency', 'budget'
  ]

  // Scientific keywords
  const scientificKeywords = [
    'research', 'study', 'experiment', 'hypothesis', 'theory',
    'quantum', 'physics', 'chemistry', 'biology', 'medical',
    'scientific', 'journal', 'peer-reviewed', 'data shows'
  ]

  // Technical keywords
  const technicalKeywords = [
    'algorithm', 'software', 'hardware', 'programming', 'code',
    'api', 'database', 'machine learning', 'ai', 'neural'
  ]

  // Historical keywords
  const historicalKeywords = [
    'history', 'historical', 'century', 'ancient', 'medieval',
    'war', 'revolution', 'empire', 'civilization'
  ]

  if (economicKeywords.some(k => lowerQuery.includes(k))) return 'economic'
  if (scientificKeywords.some(k => lowerQuery.includes(k))) return 'scientific'
  if (technicalKeywords.some(k => lowerQuery.includes(k))) return 'technical'
  if (historicalKeywords.some(k => lowerQuery.includes(k))) return 'historical'

  return 'general'
}

/**
 * Domain-specific verification context to prevent false positives
 */
function getDomainContext(domain: QueryDomain): string {
  switch (domain) {
    case 'economic':
      return `
ECONOMIC CONTEXT AWARENESS:
- Global GDP is approximately $100-110 trillion USD (2024-2025)
- US GDP alone is ~$28 trillion; China ~$18 trillion
- Global debt exceeds $300 trillion
- Figures in trillions are COMMON and PLAUSIBLE for economic discussions
- The World Economic Forum, IMF, World Bank regularly cite trillion-dollar figures
- Do NOT flag trillion-dollar economic figures as "implausible" - they are normal
- Consider inflation, currency differences, and time periods
- Economic projections and forecasts are inherently estimates, not false claims`

    case 'scientific':
      return `
SCIENTIFIC CONTEXT AWARENESS:
- Distinguish between peer-reviewed findings and preliminary research
- Recognize that scientific understanding evolves
- Theoretical physics often discusses speculative concepts
- Do not flag well-established scientific consensus as unverified`

    case 'technical':
      return `
TECHNICAL CONTEXT AWARENESS:
- Technical specifications and benchmarks vary by context
- Performance claims should be evaluated against stated conditions
- Software capabilities depend on implementation details`

    case 'historical':
      return `
HISTORICAL CONTEXT AWARENESS:
- Historical estimates (population, dates) have inherent uncertainty
- Different sources may provide varying accounts
- Distinguish between established facts and historical interpretation`

    default:
      return ''
  }
}

/**
 * AI-Powered Factuality Verification using Opus 4.5
 *
 * Cross-references AI response against available sources and query context
 * to verify factual accuracy and detect hallucinations.
 *
 * @param response - AI-generated response to verify
 * @param query - Original user query
 * @param sources - Available sources/context (optional)
 * @returns FactualityVerification with score and unsupported claims
 */
export async function verifyFactuality(
  response: string,
  query: string,
  sources: string[] = []
): Promise<FactualityVerification> {
  try {
    // Detect query domain for context-aware verification
    const domain = detectQueryDomain(query)
    const domainContext = getDomainContext(domain)

    const sourcesText = sources.length > 0
      ? sources.map((s, i) => `${i + 1}. ${s}`).join('\n')
      : 'No external sources provided'

    const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5-20251101',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: `Verify factual accuracy of this AI response:

QUERY: "${query}"
DETECTED DOMAIN: ${domain.toUpperCase()}
${domainContext}

RESPONSE:
"""
${response}
"""

AVAILABLE SOURCES:
${sourcesText}

IMPORTANT VERIFICATION RULES:
1. DO NOT flag domain-appropriate figures as "implausible" (e.g., trillion-dollar economics figures are normal)
2. Distinguish between factual errors vs. reasonable estimates/projections
3. Consider the domain context when evaluating claims
4. Only flag claims that are genuinely unsupported or contradictory

Identify:
1. Claims that are well-supported by sources or general knowledge
2. Claims that genuinely lack support or verification (not just estimates)
3. Actual factual errors or hallucinations (not domain-appropriate figures)
4. Contradictions or inconsistencies
5. Recommendations for improving accuracy

Return ONLY valid JSON (no markdown):
{
  "score": 0.0-1.0,
  "unsupportedClaims": ["claim1", "claim2", ...],
  "potentialErrors": ["error1", "error2", ...],
  "recommendations": ["rec1", "rec2", ...],
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

    // Extract results
    const score = Math.max(0, Math.min(1, result.score || 0.7))
    const unsupportedClaims = [
      ...(result.unsupportedClaims || []),
      ...(result.potentialErrors || []),
    ]

    // Domain-aware threshold: economic/financial queries are inherently uncertain
    // and shouldn't trigger as easily as scientific facts
    const getThreshold = (domain: QueryDomain): number => {
      switch (domain) {
        case 'economic':
          return 0.35 // Very lenient - economic forecasts are uncertain by nature
        case 'scientific':
          return 0.55 // Moderate - scientific claims need support
        case 'historical':
          return 0.45 // Lenient - historical accounts vary
        case 'technical':
          return 0.50 // Moderate
        default:
          return 0.60 // Standard threshold
      }
    }

    const threshold = getThreshold(domain)
    const triggered = score < threshold

    console.log(`[Factuality] Domain: ${domain}, Score: ${score.toFixed(2)}, Threshold: ${threshold}, Triggered: ${triggered}`)

    return {
      score,
      triggered,
      unsupportedClaims,
      recommendations: result.recommendations || [],
      confidence: Math.max(0, Math.min(1, result.confidence || 0.7)),
    }
  } catch (error) {
    console.error('[Factuality Verifier] Error:', error)

    // Fallback: assume response is factual (conservative approach)
    return {
      score: 0.7,
      triggered: false,
      unsupportedClaims: [],
      recommendations: ['Factuality verification unavailable - manual review recommended'],
      confidence: 0.5,
    }
  }
}

/**
 * Quick check: does response make claims without evidence?
 */
export function hasUnsupportedClaims(text: string): boolean {
  // Check for definitive claims without evidence markers
  const definiteClaims = (text.match(/\b(is|are|will be|was|were)\b/gi) || []).length

  const evidenceMarkers = [
    /according to/i,
    /research (shows|indicates|suggests)/i,
    /\b\d{4}\b/, // years
    /studies/i,
    /data (shows|indicates)/i,
    /source:/i,
    /reference:/i,
  ]

  const hasEvidence = evidenceMarkers.some((marker) => marker.test(text))

  return definiteClaims > 5 && !hasEvidence
}
