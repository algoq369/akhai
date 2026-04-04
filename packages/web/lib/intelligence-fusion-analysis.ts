/**
 * INTELLIGENCE FUSION — Query Analysis
 *
 * Analyzes user queries for complexity, type, and keyword extraction.
 */

import { LRUCache, QueryAnalysis, QueryType } from './intelligence-fusion-types';

// Cache for query analysis results (100 entries)
const queryAnalysisCache = new LRUCache<string, QueryAnalysis>(100);

// ============================================================
// COMPLEXITY INDICATORS
// ============================================================

const COMPLEXITY_INDICATORS = {
  length: { threshold: 50, weight: 0.1 },
  longQuery: { threshold: 15, weight: 0.1 }, // word count > 15
  technical: {
    keywords: [
      'algorithm',
      'architecture',
      'implementation',
      'optimization',
      'infrastructure',
      'framework',
      'protocol',
      'specification',
      'platform',
      'system',
      'model',
      'database',
      'pipeline',
      'deployment',
      'server',
      'api',
      'backend',
      'frontend',
      'microservice',
      'container',
    ],
    weight: 0.15,
  },
  multiPart: {
    patterns: [/\band\b.*\band\b/, /\bfirst\b.*\bthen\b/i, /\bboth\b.*\band\b/i],
    weight: 0.2,
  },
  comparative: {
    keywords: [
      'compare',
      'versus',
      'vs',
      'difference',
      'better',
      'worse',
      'best',
      'top',
      'optimal',
      'recommend',
    ],
    weight: 0.15,
  },
  strategic: {
    keywords: [
      'strategy',
      'strategies',
      'approach',
      'plan',
      'roadmap',
      'framework',
      'methodology',
      'sovereign',
      'independent',
      'autonomous',
    ],
    weight: 0.15,
  },
  research: {
    keywords: [
      'comprehensive',
      'detailed',
      'in-depth',
      'thorough',
      'research',
      'analysis',
      'evaluate',
      'assess',
    ],
    weight: 0.2,
  },
  uncertainty: { keywords: ['might', 'could', 'perhaps', 'possibly', 'uncertain'], weight: 0.1 },
  scope: {
    keywords: [
      'all',
      'every',
      'comprehensive',
      'complete',
      'entire',
      'europe',
      'global',
      'worldwide',
      'industry',
    ],
    weight: 0.15,
  },
};

// ============================================================
// STOP WORDS
// ============================================================

const STOP_WORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'but',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'by',
  'from',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'could',
  'should',
  'may',
  'might',
  'must',
  'can',
  'this',
  'that',
  'these',
  'those',
  'it',
  'its',
  'what',
  'which',
  'who',
  'whom',
  'how',
  'when',
  'where',
  'why',
  'there',
  'here',
  'all',
  'each',
  'every',
  'both',
  'few',
  'more',
  'most',
  'other',
  'some',
  'such',
  'no',
  'not',
  'only',
  'own',
  'same',
  'so',
  'than',
  'too',
  'very',
  'just',
  'about',
  'into',
]);

// ============================================================
// QUERY ANALYSIS
// ============================================================

export function analyzeQuery(query: string): QueryAnalysis {
  // Check cache first
  const cached = queryAnalysisCache.get(query);
  if (cached) {
    return cached;
  }

  const words = query.toLowerCase().split(/\s+/);
  const wordCount = words.length;
  const queryLower = query.toLowerCase();

  // Calculate complexity score
  let complexity = 0.15; // Base complexity

  // Length-based complexity
  if (query.length > COMPLEXITY_INDICATORS.length.threshold)
    complexity += COMPLEXITY_INDICATORS.length.weight;
  if (wordCount > COMPLEXITY_INDICATORS.longQuery.threshold)
    complexity += COMPLEXITY_INDICATORS.longQuery.weight;
  if (wordCount > 10)
    complexity += 0.08; // Medium-length bonus (10+ words = non-trivial)
  else if (wordCount > 8) complexity += 0.05; // Short-medium bonus

  // Question mark = structured inquiry (slight boost)
  if (/\?$/.test(query.trim())) complexity += 0.05;

  for (const kw of COMPLEXITY_INDICATORS.technical.keywords) {
    if (queryLower.includes(kw)) {
      complexity += COMPLEXITY_INDICATORS.technical.weight;
      break;
    }
  }

  for (const pattern of COMPLEXITY_INDICATORS.multiPart.patterns) {
    if (pattern.test(queryLower)) {
      complexity += COMPLEXITY_INDICATORS.multiPart.weight;
      break;
    }
  }

  for (const kw of COMPLEXITY_INDICATORS.comparative.keywords) {
    if (queryLower.includes(kw)) {
      complexity += COMPLEXITY_INDICATORS.comparative.weight;
      break;
    }
  }

  for (const kw of COMPLEXITY_INDICATORS.strategic.keywords) {
    if (queryLower.includes(kw)) {
      complexity += COMPLEXITY_INDICATORS.strategic.weight;
      break;
    }
  }

  for (const kw of COMPLEXITY_INDICATORS.research.keywords) {
    if (queryLower.includes(kw)) {
      complexity += COMPLEXITY_INDICATORS.research.weight;
      break;
    }
  }

  for (const kw of COMPLEXITY_INDICATORS.scope.keywords) {
    if (queryLower.includes(kw)) {
      complexity += COMPLEXITY_INDICATORS.scope.weight;
      break;
    }
  }

  complexity = Math.min(1, complexity);

  // Determine query type (order: specific → general, strategic/analytical before factual default)
  let queryType: QueryType = 'factual';
  if (/compare|versus|vs\b|better|worse|pros.*cons|advantages|disadvantages/i.test(query))
    queryType = 'comparative';
  else if (/how to|step.?by.?step|guide|tutorial|setup|install|configure/i.test(query))
    queryType = 'procedural';
  else if (/plan|strateg|roadmap|approach|best\s+(?:way|method|practice|strategies)/i.test(query))
    queryType = 'planning';
  else if (/what\s+(?:are|is)\s+the\s+best/i.test(query))
    queryType = 'planning'; // "What are the best X" is strategic
  else if (/analy[zs]e|evaluate|assess|review|examine|audit/i.test(query)) queryType = 'analytical';
  else if (/research|comprehensive|detailed|in-depth|survey|overview/i.test(query))
    queryType = 'research';
  else if (/create|design|brainstorm|ideas|imagine|invent|generate/i.test(query))
    queryType = 'creative';
  else if (/fix|error|bug|issue|problem|debug|broken|crash/i.test(query))
    queryType = 'troubleshooting';
  else if (wordCount > 10 && /\?$/.test(query.trim()))
    queryType = 'analytical'; // 10+ word questions default to analytical
  else if (complexity >= 0.5) queryType = 'research'; // High complexity without specific type → research

  // Extract keywords (improved extraction)
  const keywords = words
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w))
    .reduce(
      (acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

  const sortedKeywords = Object.entries(keywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);

  const result: QueryAnalysis = {
    complexity,
    queryType,
    requiresTools: /search|lookup|find|fetch|get.*data|api|price|stock|weather/i.test(query),
    requiresMultiPerspective:
      /compare|perspective|opinion|view|argument|strateg|approach|best|recommend|pros|cons/i.test(
        query
      ),
    isMathematical: /\d+\s*[+\-*/^%]\s*\d+|calculate|compute|equation|formula/i.test(query),
    isFactual: /what is|who is|when did|where is|how many/i.test(query) && wordCount < 15,
    isProcedural: /how to|step|guide|tutorial|process/i.test(query),
    isCreative: /create|design|brainstorm|ideas|imagine|invent/i.test(query),
    wordCount,
    keywords: sortedKeywords,
  };

  // Cache the result
  queryAnalysisCache.set(query, result);

  return result;
}
