/**
 * ANTIPATTERN PURIFICATION
 *
 * Purification functions that cleanse AI responses of hollow knowledge patterns.
 * Includes both regex-based and AI-powered purification.
 *
 * @module antipattern-purification
 */

import { type AntipatternRisk, type AntipatternType } from './antipattern-patterns';
import { detectAntipattern } from './antipattern-detection';

/**
 * purifyResponse
 *
 * Applies purification based on Antipattern risk detected.
 *
 * @param response - Original response
 * @param risk - Detected Antipattern risk
 * @returns Purified response
 */
export function purifyResponse(response: string, risk: AntipatternRisk): string {
  if (risk.risk === 'none') return response;

  let purified = response;

  switch (risk.risk) {
    case 'obscurity':
      purified = purifyObscurity(purified);
      break;
    case 'instability':
      purified = purifyInstability(purified);
      break;
    case 'toxicity':
      purified = purifyToxicity(purified);
      break;
    case 'manipulation':
      purified = purifyManipulation(purified);
      break;
    case 'vanity':
      purified = purifyVanity(purified);
      break;
  }

  // Add purification notice if severe
  if (risk.severity > 0.5) {
    purified = addPurificationNotice(purified, risk);
  }

  return purified;
}

function purifyObscurity(response: string): string {
  let purified = response;

  // Remove "obviously" and similar
  purified = purified.replace(/\b(obviously|clearly|as we all know),?\s*/gi, '');

  // Replace vague authority with humility
  purified = purified.replace(
    /\b(the experts agree|studies show|research indicates)\b/gi,
    'some research suggests'
  );

  return purified;
}

function purifyInstability(response: string): string {
  // Add synthesis summary at the end
  const lines = response.split('\n');
  const bulletPoints = lines.filter((line) => /^[-•*]\s/.test(line));

  if (bulletPoints.length > 8) {
    return `${response}\n\n**In Summary:** The key points above can be synthesized into a few core themes. Consider which aspects are most relevant to your specific situation.`;
  }

  return response;
}

function purifyToxicity(response: string): string {
  let purified = response;

  // Replace absolute certainty with qualified statements
  purified = purified.replace(/\balways\b/gi, 'often');
  purified = purified.replace(/\bnever\b/gi, 'rarely');
  purified = purified.replace(/\bimpossible\b/gi, 'very difficult');
  purified = purified.replace(/\bguaranteed\b/gi, 'likely');
  purified = purified.replace(/\bwill definitely\b/gi, 'will likely');
  purified = purified.replace(/\bwithout (a )?doubt\b/gi, 'with high confidence');

  return purified;
}

function purifyManipulation(response: string): string {
  // Add specificity prompt at end
  if (response.includes('it depends') || response.includes('varies')) {
    return `${response}\n\n**Note:** While context matters, I can provide more specific guidance if you share more details about your particular situation.`;
  }

  return response;
}

function purifyVanity(response: string): string {
  let purified = response;

  // Remove arrogant language
  purified = purified.replace(/\btrust me\b/gi, 'this suggests');
  purified = purified.replace(/\bI know (better|best|the truth)\b/gi, 'evidence indicates');
  purified = purified.replace(
    /\byou('re| are) (wrong|mistaken)\b/gi,
    'consider an alternative perspective'
  );
  purified = purified.replace(/\blet me (correct|fix) you\b/gi, 'let me offer a different view');

  return purified;
}

function addPurificationNotice(response: string, risk: AntipatternRisk): string {
  return `${response}\n\n---\n\n*⚠️ This response was purified by the Antipattern Guard Shield. Original response contained: ${risk.description}*`;
}

// ═══════════════════════════════════════════════════════════════
// PHASE 2: SEMANTIC ANTIPATTERN DETECTION & PURIFICATION (OPUS 4.5)
// ═══════════════════════════════════════════════════════════════

export interface SemanticAntipatternDetection {
  detected: AntipatternType[];
  scores: Record<AntipatternType, number>;
  evidence: Record<AntipatternType, string[]>;
  confidence: number;
  recommendations: string[];
}

/**
 * AI-Powered Semantic Antipatterns Detection using Opus 4.5
 *
 * Provides nuanced detection with:
 * - Context-aware analysis (considers original query)
 * - Evidence extraction (specific problematic passages)
 * - Fewer false positives through semantic understanding
 * - Recommendations for purification
 *
 * @param response - AI-generated response to analyze
 * @param context - Original user query for context
 * @returns SemanticAntipatternDetection with scores and evidence
 */
export async function detectAntipatternSemantic(
  response: string,
  context: string
): Promise<SemanticAntipatternDetection> {
  try {
    const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-7',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `Analyze this AI response for "hollow knowledge" patterns (Antipatterns):

ORIGINAL QUERY: "${context}"

AI RESPONSE:
"""
${response}
"""

Detect these anti-patterns (score each 0.0-1.0):

1. **Obscurity** (Concealment through jargon)
   - Excessive technical terminology without explanation
   - Obscuring simple concepts with complexity
   - Appeals to unnamed authority

2. **Instability** (Information overload)
   - Quantity over quality
   - Lists without synthesis
   - Overwhelming detail without hierarchy

3. **Toxicity** (Deceptive certainty)
   - Claims without evidence
   - Overconfidence on uncertain topics
   - Absolute statements ("always", "never", "guaranteed")

4. **Manipulation** (Superficial reflection)
   - Shallow pattern matching
   - Lacks depth or insight
   - Generic advice that applies to anything

5. **Vanity** (Arrogance)
   - Dismissive tone
   - Pride over humility
   - "I know better" attitude

Return ONLY valid JSON (no markdown):
{
  "scores": {
    "none": 0.0-1.0,
    "obscurity": 0.0-1.0,
    "instability": 0.0-1.0,
    "toxicity": 0.0-1.0,
    "manipulation": 0.0-1.0,
    "vanity": 0.0-1.0
  },
  "evidence": {
    "obscurity": ["quote1", "quote2"],
    "instability": ["quote1"],
    ...
  },
  "recommendations": ["rec1", "rec2", "rec3"]
}`,
          },
        ],
      }),
    });

    if (!apiResponse.ok) {
      throw new Error(`Anthropic API error: ${apiResponse.status}`);
    }

    const data = await apiResponse.json();
    const content = data.content?.[0]?.text || '{}';

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const result = JSON.parse(jsonMatch[0]);

    // Extract detected Antipatterns types
    const scores = result.scores || {};
    const detected: AntipatternType[] = [];

    Object.entries(scores).forEach(([type, score]) => {
      if (type !== 'none' && typeof score === 'number' && score > 0.3) {
        detected.push(type as AntipatternType);
      }
    });

    // Calculate overall confidence (average of non-zero scores)
    const nonZeroScores = Object.values(scores).filter(
      (s): s is number => typeof s === 'number' && s > 0
    );
    const confidence =
      nonZeroScores.length > 0
        ? nonZeroScores.reduce((sum, s) => sum + s, 0) / nonZeroScores.length
        : 0;

    return {
      detected: detected.length > 0 ? detected : ['none'],
      scores: scores as Record<AntipatternType, number>,
      evidence: result.evidence || {},
      confidence: Math.max(0, Math.min(1, confidence)),
      recommendations: result.recommendations || [],
    };
  } catch (error) {
    console.error('[Semantic Antipatterns] Error:', error);

    // Fallback to regex-based detection
    const fallback = detectAntipattern(response);

    return {
      detected: [fallback.risk],
      scores: {
        none: fallback.risk === 'none' ? 1.0 : 0,
        obscurity: fallback.risk === 'obscurity' ? fallback.severity : 0,
        instability: fallback.risk === 'instability' ? fallback.severity : 0,
        toxicity: fallback.risk === 'toxicity' ? fallback.severity : 0,
        manipulation: fallback.risk === 'manipulation' ? fallback.severity : 0,
        vanity: fallback.risk === 'vanity' ? fallback.severity : 0,
      },
      evidence: {
        [fallback.risk]: fallback.triggers,
      } as Record<AntipatternType, string[]>,
      confidence: 0.6,
      recommendations: [fallback.purificationStrategy],
    };
  }
}

/**
 * AI-Powered Response Purification using Opus 4.5
 *
 * Rewrites problematic responses to remove Antipattern patterns while:
 * - Preserving factual accuracy
 * - Maintaining natural tone
 * - Adding explanations for jargon
 * - Providing grounded citations
 * - Adding uncertainty markers where appropriate
 *
 * @param response - Original AI response to purify
 * @param detected - Detected Antipatterns types
 * @param originalQuery - Original user query for context
 * @returns Purified response with list of changes made
 */
export async function purifyResponseWithAI(
  response: string,
  detected: AntipatternType[],
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
        model: 'claude-opus-4-7',
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

DETECTED ISSUES: ${detected.filter((d) => d !== 'none').join(', ') || 'None - preventive purification'}

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
    });

    if (!apiResponse.ok) {
      throw new Error(`Anthropic API error: ${apiResponse.status}`);
    }

    const data = await apiResponse.json();
    const content = data.content?.[0]?.text || '{}';

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      purified: result.purified || response,
      changes: result.changes || [],
      confidence: Math.max(0, Math.min(1, result.confidence || 0.7)),
    };
  } catch (error) {
    console.error('[Response Purification] Error:', error);

    // Fallback: return original response
    return {
      purified: response,
      changes: ['Purification failed - using original response'],
      confidence: 0.5,
    };
  }
}
