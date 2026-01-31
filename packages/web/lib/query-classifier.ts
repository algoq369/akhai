/**
 * Query Classifier - Detects simple queries that should use DIRECT mode
 *
 * DIRECT mode = single AI call, no consensus, ~5 seconds
 *
 * Simple queries:
 * - "btc price", "eth price", "price of X"
 * - "what is X", "who is X", "define X"
 * - Short factual questions (< 5 words)
 * - No comparison words (vs, versus, compare, difference)
 *
 * Phase 2: AI-Powered Classification with Opus 4.5
 */

export type Methodology = 'direct' | 'cod' | 'bot' | 'react' | 'pot' | 'gtp' | 'auto'

export interface QueryClassification {
  isSimple: boolean;
  reason: string;
  suggestedMethodology: 'direct' | 'gtp' | 'cot' | 'aot';
}

export interface AIQueryClassification {
  methodology: Methodology
  confidence: number
  reasoning: string
  complexity: number // 1-10 scale
  multiDimensional: boolean
}

/**
 * Classify a query to determine optimal methodology
 */
export function classifyQuery(query: string): QueryClassification {
  const lowerQuery = query.toLowerCase().trim();
  const words = lowerQuery.split(/\s+/);
  const wordCount = words.length;

  // Pattern 1: Price queries (highest priority)
  const pricePatterns = [
    /\b(btc|eth|bitcoin|ethereum|crypto|price|cost)\b/,
    /^(price|cost|value)\s+of\s+/,
    /\s+(price|cost|value)$/,
  ];

  if (pricePatterns.some(pattern => pattern.test(lowerQuery))) {
    return {
      isSimple: true,
      reason: 'Price/cost query detected',
      suggestedMethodology: 'direct',
    };
  }

  // Pattern 2: Definition queries
  const definitionPatterns = [
    /^(what|who|where|when)\s+(is|are|was|were)\s+/,
    /^define\s+/,
    /^explain\s+/,
    /^tell\s+me\s+(about|what)\s+/,
  ];

  if (definitionPatterns.some(pattern => pattern.test(lowerQuery))) {
    // If it's short (< 5 words), it's simple
    if (wordCount < 5) {
      return {
        isSimple: true,
        reason: 'Short factual question detected',
        suggestedMethodology: 'direct',
      };
    }
  }

  // Pattern 3: Comparison queries → NOT simple, use GTP
  const comparisonKeywords = [
    'vs', 'versus', 'compare', 'comparison', 'difference', 'differences',
    'better', 'worse', 'pros and cons', 'advantages', 'disadvantages',
    'which is', 'which should',
  ];

  if (comparisonKeywords.some(keyword => lowerQuery.includes(keyword))) {
    return {
      isSimple: false,
      reason: 'Comparison detected - requires multiple perspectives',
      suggestedMethodology: 'gtp',
    };
  }

  // Pattern 4: Complex analysis queries → NOT simple
  const complexKeywords = [
    'analyze', 'analysis', 'evaluate', 'assessment', 'review',
    'strategy', 'recommend', 'should i', 'how to', 'best way',
    'implementation', 'approach', 'solution',
  ];

  if (complexKeywords.some(keyword => lowerQuery.includes(keyword))) {
    return {
      isSimple: false,
      reason: 'Complex analysis required',
      suggestedMethodology: wordCount > 10 ? 'cot' : 'gtp',
    };
  }

  // Pattern 5: Very short queries (< 5 words) with no complex keywords = simple
  if (wordCount < 5) {
    return {
      isSimple: true,
      reason: `Short query (${wordCount} words)`,
      suggestedMethodology: 'direct',
    };
  }

  // Default: Medium complexity, use GTP
  return {
    isSimple: false,
    reason: `Medium complexity (${wordCount} words)`,
    suggestedMethodology: 'gtp',
  };
}

/**
 * Quick check: should this query use DIRECT mode?
 */
export function shouldUseDirect(query: string): boolean {
  return classifyQuery(query).isSimple;
}

// ═══════════════════════════════════════════════════════════════
// PHASE 2: AI-POWERED QUERY CLASSIFICATION (OPUS 4.5)
// ═══════════════════════════════════════════════════════════════

/**
 * AI-Powered Query Classifier using Opus 4.5
 *
 * Provides semantic intent analysis with:
 * - Intent understanding (not just keyword matching)
 * - Confidence scoring
 * - Better multi-dimensional query detection
 * - Adaptive to new query types
 *
 * @param query - User's input question
 * @returns AIQueryClassification with methodology, confidence, reasoning
 */
/**
 * QueryIntent - Intent classification result (for tests compatibility)
 */
export interface QueryIntent {
  type: 'factual' | 'analytical' | 'creative' | 'procedural' | 'conversational'
  confidence: number
  reasoning: string
  complexity: number
  requiresTools: boolean
  suggestedMethodology: Methodology
}

/**
 * classifyQueryIntent - Classify query intent (test-compatible API)
 * 
 * @param query - User's input question
 * @returns QueryIntent with type, confidence, reasoning, complexity
 */
export function classifyQueryIntent(query: string): QueryIntent {
  const basic = classifyQuery(query)
  const queryLower = query.toLowerCase()
  const wordCount = query.split(/\s+/).length
  
  // Determine query type
  let type: QueryIntent['type'] = 'factual'
  if (/write|create|generate|compose|imagine|story|poem/i.test(query)) {
    type = 'creative'
  } else if (/why|how does|implication|differ|analyze|evaluate/i.test(query)) {
    type = 'analytical'
  } else if (/how (do|to|can)|step|guide|tutorial|install/i.test(query)) {
    type = 'procedural'
  } else if (/hello|hi|hey|help|think|you|your/i.test(query) && wordCount < 10) {
    type = 'conversational'
  }
  
  // Calculate complexity (0-1 scale based on word count and keywords)
  let complexity = Math.min(1, wordCount / 50)
  if (/comprehensive|detailed|in-depth|complex|multi/i.test(query)) {
    complexity = Math.min(1, complexity + 0.3)
  }
  
  // Determine if tools required
  const requiresTools = /calculate|compute|current|latest|price|search|find|lookup/i.test(query)
  
  // Calculate confidence
  let confidence = 0.7
  if (basic.isSimple) confidence = 0.9
  if (wordCount < 5) confidence = 0.95
  if (wordCount > 30) confidence = 0.6
  
  // Map methodology
  let suggestedMethodology: Methodology = basic.suggestedMethodology === 'cot' 
    ? 'cod' 
    : basic.suggestedMethodology === 'aot' 
      ? 'bot' 
      : (basic.suggestedMethodology as Methodology)
  
  return {
    type,
    confidence,
    reasoning: basic.reason,
    complexity,
    requiresTools,
    suggestedMethodology,
  }
}

export async function classifyQueryWithAI(query: string): Promise<AIQueryClassification> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5-20251101',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: `Analyze this query and select the optimal reasoning methodology:

Query: "${query}"

Methodologies:
- direct: Simple facts, quick answers, factual lookups (e.g., "what is X", "btc price")
- cod: Step-by-step explanations, iterative reasoning with reflection (e.g., "explain how X works", "analyze Y")
- bot: Deep analysis, template-based reasoning for structured problems (e.g., "compare X and Y", "evaluate Z")
- react: Research, fact-finding with tools, multi-step investigation (e.g., "find latest research on X")
- pot: Math, calculations, code-based solutions (e.g., "calculate X", "solve Y equation")
- gtp: Multi-perspective consensus needed for complex judgments (e.g., "which is better X or Y", "should I do Z")
- auto: Let system decide based on query characteristics

Return ONLY valid JSON (no markdown):
{
  "methodology": "<name>",
  "confidence": 0.0-1.0,
  "reasoning": "why this methodology fits best",
  "complexity": 1-10,
  "multiDimensional": true/false
}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.content?.[0]?.text || '{}'

    // Parse JSON from response (handle potential markdown wrapping)
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response')
    }

    const result = JSON.parse(jsonMatch[0])

    // Validate and normalize
    return {
      methodology: result.methodology || 'auto',
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      reasoning: result.reasoning || 'AI classification',
      complexity: Math.max(1, Math.min(10, result.complexity || 5)),
      multiDimensional: Boolean(result.multiDimensional),
    }
  } catch (error) {
    console.error('[AI Classifier] Error:', error)

    // Fallback to regex-based classification
    const fallback = classifyQuery(query)
    return {
      methodology: fallback.suggestedMethodology === 'gtp' ? 'gtp' : 'direct',
      confidence: 0.6,
      reasoning: `Fallback: ${fallback.reason}`,
      complexity: query.split(' ').length > 10 ? 7 : 3,
      multiDimensional: fallback.suggestedMethodology === 'gtp',
    }
  }
}
