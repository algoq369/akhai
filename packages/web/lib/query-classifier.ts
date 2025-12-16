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
 */

export interface QueryClassification {
  isSimple: boolean;
  reason: string;
  suggestedMethodology: 'direct' | 'gtp' | 'cot' | 'aot';
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
