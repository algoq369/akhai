/**
 * Methodology Selector
 *
 * Analyzes user queries and automatically selects the optimal reasoning methodology.
 *
 * Available methodologies:
 * - direct: Simple factual queries (~5s)
 * - cot: Chain of Thought, sequential reasoning (~30s)
 * - aot: Atom of Thoughts, decompose→solve→contract (~60s)
 * - gtp: Flash/parallel multi-AI consensus (~25s)
 * - auto: Let selector decide (default)
 *
 * Selection logic:
 * - direct: complexity < 0.3, factual queries
 * - cot: sequential reasoning, procedural, troubleshooting
 * - aot: high complexity, research, multi-step decomposition
 * - gtp: comparative, creative, multiple perspectives needed
 */

import type {
  MethodologyType,
  QueryType,
  QueryAnalysis,
  MethodologySelection,
} from './types.js';

/**
 * Query type detection keywords
 */
const QUERY_PATTERNS: Record<QueryType, { keywords: string[]; patterns: RegExp[] }> = {
  factual: {
    keywords: ['what is', 'who is', 'when did', 'where is', 'define', 'explain'],
    patterns: [/^what (is|are) /i, /^who (is|was|are) /i, /^define /i],
  },
  comparative: {
    keywords: ['vs', 'versus', 'compare', 'comparison', 'difference between', 'better than', 'which is', 'or'],
    patterns: [/ vs /i, / versus /i, /compare .+ (to|with|and) /i, /difference between .+ and /i, /\w+ or \w+/],
  },
  procedural: {
    keywords: ['how to', 'step by step', 'guide', 'tutorial', 'instructions', 'process for'],
    patterns: [/^how (to|do|can) /i, /step[- ]by[- ]step/i, /guide (to|for) /i],
  },
  research: {
    keywords: ['research', 'investigate', 'comprehensive', 'in-depth', 'detailed analysis', 'explore', 'examine'],
    patterns: [/research (on|about|into) /i, /comprehensive (analysis|study|review) /i],
  },
  creative: {
    keywords: ['brainstorm', 'ideas for', 'suggestions', 'innovative', 'creative', 'come up with', 'think of'],
    patterns: [/brainstorm/i, /(give|suggest|provide) .+ ideas/i, /innovative (ways|approaches|solutions) /i],
  },
  analytical: {
    keywords: ['analyze', 'analysis', 'evaluate', 'assess', 'examine', 'investigate', 'study'],
    patterns: [/^analyze /i, /^evaluate /i, /analysis of /i],
  },
  troubleshooting: {
    keywords: ['fix', 'debug', 'error', 'problem', 'issue', 'not working', 'broken', 'troubleshoot', 'diagnose'],
    patterns: [/^(fix|debug|solve) /i, /why (is|does|doesn't) .+ (not )?(work|working)/i, / error$/i],
  },
  planning: {
    keywords: ['plan', 'strategy', 'roadmap', 'approach', 'schedule', 'organize', 'design'],
    patterns: [/^plan (for|to|a) /i, /develop (a |an )?(strategy|roadmap) /i],
  },
};

/**
 * Complexity indicators (each adds to complexity score)
 */
const COMPLEXITY_INDICATORS = {
  length: { threshold: 100, weight: 0.1 }, // Long queries are more complex
  technical: { keywords: ['algorithm', 'architecture', 'implementation', 'scalability', 'optimization', 'performance'], weight: 0.15 },
  multi_part: { patterns: [/\band\b.*\band\b/i, /,.*,/], weight: 0.2 }, // Multiple clauses
  comparative: { keywords: ['compare', 'versus', 'vs', 'difference'], weight: 0.15 },
  research: { keywords: ['comprehensive', 'detailed', 'in-depth', 'thorough'], weight: 0.2 },
  uncertainty: { keywords: ['might', 'could', 'perhaps', 'possibly', 'maybe'], weight: 0.1 },
  scope: { keywords: ['all', 'every', 'comprehensive', 'complete'], weight: 0.15 },
};

export class MethodologySelector {
  /**
   * Analyze a query to determine complexity, type, and characteristics
   *
   * @param query - User query to analyze
   * @returns Query analysis
   */
  analyzeQuery(query: string): QueryAnalysis {
    const lowerQuery = query.toLowerCase();
    const wordCount = query.split(/\s+/).length;

    // 1. Detect query type
    const queryType = this.detectQueryType(lowerQuery);

    // 2. Calculate complexity (0-1)
    let complexity = 0.2; // Base complexity

    // Length factor
    if (wordCount > COMPLEXITY_INDICATORS.length.threshold) {
      complexity += COMPLEXITY_INDICATORS.length.weight;
    }

    // Technical terms
    if (COMPLEXITY_INDICATORS.technical.keywords.some(kw => lowerQuery.includes(kw))) {
      complexity += COMPLEXITY_INDICATORS.technical.weight;
    }

    // Multi-part question
    if (COMPLEXITY_INDICATORS.multi_part.patterns.some(p => p.test(lowerQuery))) {
      complexity += COMPLEXITY_INDICATORS.multi_part.weight;
    }

    // Comparative
    if (COMPLEXITY_INDICATORS.comparative.keywords.some(kw => lowerQuery.includes(kw))) {
      complexity += COMPLEXITY_INDICATORS.comparative.weight;
    }

    // Research depth
    if (COMPLEXITY_INDICATORS.research.keywords.some(kw => lowerQuery.includes(kw))) {
      complexity += COMPLEXITY_INDICATORS.research.weight;
    }

    // Uncertainty
    if (COMPLEXITY_INDICATORS.uncertainty.keywords.some(kw => lowerQuery.includes(kw))) {
      complexity += COMPLEXITY_INDICATORS.uncertainty.weight;
    }

    // Scope
    if (COMPLEXITY_INDICATORS.scope.keywords.some(kw => lowerQuery.includes(kw))) {
      complexity += COMPLEXITY_INDICATORS.scope.weight;
    }

    // Cap at 1.0
    complexity = Math.min(1.0, complexity);

    // 3. Determine characteristics
    const requiresMultiplePerspectives = this.detectMultiplePerspectives(lowerQuery, queryType);
    const requiresSequentialReasoning = this.detectSequentialReasoning(queryType, lowerQuery);
    const requiresDecomposition = complexity > 0.7 || queryType === 'planning' || queryType === 'research';

    // 4. Estimate tokens (rough)
    const estimatedTokens = Math.ceil(wordCount * 1.3); // ~1.3 tokens per word on average

    // 5. Extract keywords
    const keywords = this.extractKeywords(query);

    // 6. Determine time sensitivity
    const timeSensitivity = this.detectTimeSensitivity(lowerQuery);

    return {
      query,
      complexity,
      queryType,
      requiresMultiplePerspectives,
      requiresSequentialReasoning,
      requiresDecomposition,
      estimatedTokens,
      keywords,
      timeSensitivity,
    };
  }

  /**
   * Select optimal methodology based on query analysis
   *
   * @param analysis - Query analysis result
   * @returns Methodology selection with reasoning
   */
  selectMethodology(analysis: QueryAnalysis): MethodologySelection {
    // Simple pattern detection for instant direct routing
    const SIMPLE_PATTERNS = [/^what is/i, /^who is/i, /^when/i, /^where/i, /^how much/i, /^define/i];
    const wordCount = analysis.query.split(/\s+/).length;
    const hasComparison = /\b(vs|compare|difference|between)\b/i.test(analysis.query);

    if (SIMPLE_PATTERNS.some(p => p.test(analysis.query)) && wordCount <= 15 && !hasComparison) {
      return { methodology: 'direct', confidence: 0.95, reasoning: 'Simple factual query', alternatives: [] };
    }

    const scores: Record<Exclude<MethodologyType, 'auto'>, number> = {
      direct: 0,
      cot: 0,
      aot: 0,
      gtp: 0,
    };

    const reasons: Record<Exclude<MethodologyType, 'auto'>, string[]> = {
      direct: [],
      cot: [],
      aot: [],
      gtp: [],
    };

    // =======================
    // DIRECT Scoring
    // =======================
    // Best for: simple factual queries
    if (analysis.complexity < 0.3) {
      scores.direct += 0.5;
      reasons.direct.push('Low complexity');
    }

    if (analysis.queryType === 'factual') {
      scores.direct += 0.4;
      reasons.direct.push('Factual query');
    }

    if (analysis.timeSensitivity === 'high') {
      scores.direct += 0.3;
      reasons.direct.push('Time-sensitive');
    }

    if (!analysis.requiresMultiplePerspectives) {
      scores.direct += 0.2;
      reasons.direct.push('Single perspective sufficient');
    }

    // =======================
    // COT (Chain of Thought) Scoring
    // =======================
    // Best for: sequential reasoning, procedural, troubleshooting
    if (analysis.requiresSequentialReasoning) {
      scores.cot += 0.5;
      reasons.cot.push('Sequential reasoning required');
    }

    if (analysis.queryType === 'procedural') {
      scores.cot += 0.4;
      reasons.cot.push('Step-by-step procedure');
    }

    if (analysis.queryType === 'troubleshooting') {
      scores.cot += 0.4;
      reasons.cot.push('Debugging/troubleshooting');
    }

    if (analysis.complexity >= 0.3 && analysis.complexity < 0.7) {
      scores.cot += 0.3;
      reasons.cot.push('Medium complexity');
    }

    // =======================
    // AOT (Atom of Thoughts) Scoring
    // =======================
    // Best for: high complexity, research, decomposition
    if (analysis.requiresDecomposition) {
      scores.aot += 0.5;
      reasons.aot.push('Requires decomposition');
    }

    if (analysis.queryType === 'research') {
      scores.aot += 0.4;
      reasons.aot.push('In-depth research');
    }

    if (analysis.queryType === 'planning') {
      scores.aot += 0.4;
      reasons.aot.push('Strategic planning');
    }

    if (analysis.complexity > 0.7) {
      scores.aot += 0.4;
      reasons.aot.push('High complexity');
    }

    if (analysis.queryType === 'analytical') {
      scores.aot += 0.3;
      reasons.aot.push('Analytical thinking');
    }

    // =======================
    // GTP (Flash) Scoring
    // =======================
    // Best for: comparative, creative, multiple perspectives
    if (analysis.requiresMultiplePerspectives) {
      scores.gtp += 0.6;
      reasons.gtp.push('Multiple perspectives needed');
    }

    if (analysis.queryType === 'comparative') {
      scores.gtp += 0.5;
      reasons.gtp.push('Comparison analysis');
    }

    if (analysis.queryType === 'creative') {
      scores.gtp += 0.5;
      reasons.gtp.push('Creative brainstorming');
    }

    if (analysis.complexity >= 0.5 && analysis.complexity < 0.8) {
      scores.gtp += 0.3;
      reasons.gtp.push('Moderate-high complexity');
    }

    if (analysis.queryType === 'analytical' && analysis.requiresMultiplePerspectives) {
      scores.gtp += 0.3;
      reasons.gtp.push('Multi-perspective analysis');
    }

    // =======================
    // Select Winner
    // =======================
    const entries = Object.entries(scores) as Array<[Exclude<MethodologyType, 'auto'>, number]>;
    entries.sort((a, b) => b[1] - a[1]);

    const [selectedMethodology, selectedScore] = entries[0];

    // Build alternatives
    const alternatives = entries.slice(1).map(([methodology, score]) => ({
      methodology,
      score,
      reason: reasons[methodology].join(', ') || 'Alternative option',
    }));

    // Calculate confidence (normalized score)
    const confidence = Math.min(1.0, selectedScore);

    return {
      methodology: selectedMethodology,
      confidence,
      reasoning: reasons[selectedMethodology].join(', ') || 'Best match for query characteristics',
      alternatives,
    };
  }

  /**
   * Detect query type from keywords and patterns
   *
   * @param lowerQuery - Lowercase query
   * @returns Detected query type
   */
  private detectQueryType(lowerQuery: string): QueryType {
    const scores: Record<QueryType, number> = {
      factual: 0,
      comparative: 0,
      procedural: 0,
      research: 0,
      creative: 0,
      analytical: 0,
      troubleshooting: 0,
      planning: 0,
    };

    // Check each query type
    for (const [type, { keywords, patterns }] of Object.entries(QUERY_PATTERNS)) {
      // Keyword matching
      keywords.forEach(keyword => {
        if (lowerQuery.includes(keyword)) {
          scores[type as QueryType] += 1;
        }
      });

      // Pattern matching
      patterns.forEach(pattern => {
        if (pattern.test(lowerQuery)) {
          scores[type as QueryType] += 2; // Patterns are stronger indicators
        }
      });
    }

    // Find highest score
    const entries = Object.entries(scores) as Array<[QueryType, number]>;
    entries.sort((a, b) => b[1] - a[1]);

    const [topType, topScore] = entries[0];

    // Default to factual if no strong match
    return topScore > 0 ? topType : 'factual';
  }

  /**
   * Detect if query requires multiple perspectives
   *
   * @param lowerQuery - Lowercase query
   * @param queryType - Detected query type
   * @returns True if multiple perspectives needed
   */
  private detectMultiplePerspectives(lowerQuery: string, queryType: QueryType): boolean {
    // Certain query types inherently need multiple perspectives
    if (['comparative', 'creative', 'analytical'].includes(queryType)) {
      return true;
    }

    // Keywords that suggest multiple angles
    const multiPerspectiveKeywords = [
      'pros and cons',
      'advantages and disadvantages',
      'perspectives',
      'viewpoints',
      'opinions',
      'debate',
      'controversy',
      'trade-offs',
      'implications',
    ];

    return multiPerspectiveKeywords.some(kw => lowerQuery.includes(kw));
  }

  /**
   * Detect if query requires sequential reasoning
   *
   * @param queryType - Detected query type
   * @param lowerQuery - Lowercase query
   * @returns True if sequential reasoning needed
   */
  private detectSequentialReasoning(queryType: QueryType, lowerQuery: string): boolean {
    // Certain query types are inherently sequential
    if (['procedural', 'troubleshooting', 'planning'].includes(queryType)) {
      return true;
    }

    // Keywords that suggest step-by-step thinking
    const sequentialKeywords = [
      'first',
      'then',
      'next',
      'finally',
      'step',
      'process',
      'workflow',
      'sequence',
      'order',
    ];

    return sequentialKeywords.some(kw => lowerQuery.includes(kw));
  }

  /**
   * Extract important keywords from query
   *
   * @param query - Original query
   * @returns Array of keywords
   */
  private extractKeywords(query: string): string[] {
    // Remove common stop words
    const stopWords = new Set([
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
      'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
      'to', 'was', 'will', 'with', 'can', 'should', 'would', 'could',
    ]);

    const words = query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));

    // Return unique keywords, limited to top 10
    return Array.from(new Set(words)).slice(0, 10);
  }

  /**
   * Detect time sensitivity of query
   *
   * @param lowerQuery - Lowercase query
   * @returns Time sensitivity level
   */
  private detectTimeSensitivity(lowerQuery: string): 'low' | 'medium' | 'high' {
    const highPriority = ['urgent', 'asap', 'quickly', 'immediately', 'now', 'fast'];
    const mediumPriority = ['soon', 'today', 'quick'];

    if (highPriority.some(kw => lowerQuery.includes(kw))) {
      return 'high';
    }

    if (mediumPriority.some(kw => lowerQuery.includes(kw))) {
      return 'medium';
    }

    return 'low';
  }
}

// Export convenience function
export function selectMethodology(query: string): MethodologySelection {
  const selector = new MethodologySelector();
  const analysis = selector.analyzeQuery(query);
  return selector.selectMethodology(analysis);
}

// Export convenience function for analysis only
export function analyzeQuery(query: string): QueryAnalysis {
  const selector = new MethodologySelector();
  return selector.analyzeQuery(query);
}
