/**
 * Side Canal - Keyword Extraction & Layers Context
 *
 * Enhanced keyword extraction with NLP-inspired techniques:
 * - TF-IDF-like scoring (term frequency * inverse document frequency)
 * - Named entity detection (capitalized words, technical terms)
 * - Compound term detection ("machine learning" vs "machine" + "learning")
 * - Layers-aligned keyword boosting
 */

import { LAYERS_KEYWORDS_BY_NAME } from './constants/layer-keywords';

// Common English stop words (expanded list)
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
  'your',
  'you',
  'they',
  'them',
  'their',
  'we',
  'us',
  'our',
  'i',
  'me',
  'my',
  'he',
  'she',
  'his',
  'her',
  'him',
  'any',
  'also',
  'get',
  'like',
  'make',
  'made',
  'new',
  'now',
  'way',
  'want',
  'know',
  'need',
  'use',
]);

// Technical/domain terms that should be boosted
const DOMAIN_TERMS = new Set([
  'algorithm',
  'api',
  'blockchain',
  'bitcoin',
  'crypto',
  'database',
  'machine',
  'learning',
  'neural',
  'network',
  'optimization',
  'protocol',
  'security',
  'trading',
  'investment',
  'portfolio',
  'strategy',
  'analysis',
  'model',
  'framework',
  'architecture',
  'infrastructure',
  'deployment',
  'integration',
  'layers',
  'kabbalistic',
  'hermetic',
  'methodology',
  'consciousness',
]);

// Known meaningful phrases to detect
const MEANINGFUL_PHRASES = new Set([
  'world economic forum',
  'financial system',
  'digital currency',
  'digital currencies',
  'central bank',
  'machine learning',
  'artificial intelligence',
  'deep learning',
  'neural network',
  'natural language',
  'climate change',
  'economic growth',
  'monetary policy',
  'fiscal policy',
  'interest rate',
  'exchange rate',
  'blockchain technology',
  'cryptocurrency market',
  'global economy',
  'supply chain',
  'data science',
  'computer vision',
  'tree of life',
  'quantum computing',
]);

export function extractKeywords(text: string): string[] {
  const originalText = text;
  const cleanText = text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ');
  const words = cleanText.split(/\s+/).filter((w) => w.length > 2);

  // PRIORITY 1: Extract known meaningful phrases first
  const foundPhrases: string[] = [];
  for (const phrase of MEANINGFUL_PHRASES) {
    if (cleanText.includes(phrase)) {
      foundPhrases.push(phrase);
    }
  }

  // PRIORITY 2: Extract proper noun phrases (capitalized sequences)
  const properNouns = new Set<string>();
  const capitalizedMatches = originalText.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}/g) || [];
  capitalizedMatches.forEach((entity) => {
    if (entity.split(' ').length >= 2) {
      // Only keep 2+ word phrases
      properNouns.add(entity.toLowerCase());
    }
  });

  // PRIORITY 3: Extract compound terms (bigrams, trigrams, 4-grams)
  const ngrams: Record<string, number> = {};

  // Bigrams (2 words)
  for (let i = 0; i < words.length - 1; i++) {
    if (!STOP_WORDS.has(words[i]) && !STOP_WORDS.has(words[i + 1])) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      ngrams[bigram] = (ngrams[bigram] || 0) + 1;
    }
  }

  // Trigrams (3 words) - more meaningful
  for (let i = 0; i < words.length - 2; i++) {
    // At least 2 of 3 words should be non-stop words
    const nonStopCount = [words[i], words[i + 1], words[i + 2]].filter(
      (w) => !STOP_WORDS.has(w)
    ).length;
    if (nonStopCount >= 2) {
      const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      ngrams[trigram] = (ngrams[trigram] || 0) + 1.5; // Boost trigrams
    }
  }

  // 4-grams (4 words) - most meaningful
  for (let i = 0; i < words.length - 3; i++) {
    const nonStopCount = [words[i], words[i + 1], words[i + 2], words[i + 3]].filter(
      (w) => !STOP_WORDS.has(w)
    ).length;
    if (nonStopCount >= 3) {
      const fourgram = `${words[i]} ${words[i + 1]} ${words[i + 2]} ${words[i + 3]}`;
      ngrams[fourgram] = (ngrams[fourgram] || 0) + 2.0; // Boost 4-grams more
    }
  }

  // Score n-grams
  const ngramScores = Object.entries(ngrams)
    .filter(([phrase, _]) => phrase.split(' ').length >= 2) // Minimum 2 words
    .map(([phrase, count]) => {
      let score = count;
      // Boost domain terms
      if (phrase.split(' ').some((w) => DOMAIN_TERMS.has(w))) score *= 2.0;
      // Boost longer phrases
      const wordCount = phrase.split(' ').length;
      score *= 1 + wordCount * 0.3;
      return { phrase, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((n) => n.phrase);

  // PRIORITY 4: Single-word domain terms (only if important)
  const freq: Record<string, number> = {};
  words.forEach((w) => {
    if (!STOP_WORDS.has(w) && w.length > 4) {
      // Minimum 5 chars for single words
      freq[w] = (freq[w] || 0) + 1;
    }
  });

  const singleWordTerms = Object.entries(freq)
    .filter(([word, count]) => {
      // Only keep single words that are domain terms or very frequent
      return DOMAIN_TERMS.has(word) || count >= 3;
    })
    .sort((a, b) => {
      const aBoost = DOMAIN_TERMS.has(a[0]) ? 2 : 1;
      const bBoost = DOMAIN_TERMS.has(b[0]) ? 2 : 1;
      return b[1] * bBoost - a[1] * aBoost;
    })
    .slice(0, 5)
    .map(([word]) => word);

  // Combine all, prioritizing phrases over single words
  const allKeywords = [
    ...foundPhrases, // Known meaningful phrases first
    ...Array.from(properNouns), // Proper noun phrases
    ...ngramScores, // Detected n-grams
    ...singleWordTerms, // Important single words last
  ];

  // Remove duplicates while preserving order
  const seen = new Set<string>();
  const uniqueKeywords = allKeywords.filter((kw) => {
    const lower = kw.toLowerCase();
    if (seen.has(lower)) return false;
    // Also check if this keyword is a substring of an already-seen phrase
    for (const s of seen) {
      if (s.includes(lower) || lower.includes(s)) return false;
    }
    seen.add(lower);
    return true;
  });

  return uniqueKeywords.slice(0, 12);
}

/**
 * Get Layers context for keywords
 * Returns which Layers are most relevant based on keywords
 */
export function getKeywordLayersContext(keywords: string[]): Record<string, number> {
  const layersScores: Record<string, number> = {};

  for (const keyword of keywords) {
    const keywordLower = keyword.toLowerCase();
    for (const [layerNode, layerNodeKeywords] of Object.entries(LAYERS_KEYWORDS_BY_NAME)) {
      for (const sk of layerNodeKeywords) {
        if (keywordLower.includes(sk) || sk.includes(keywordLower)) {
          layersScores[layerNode] = (layersScores[layerNode] || 0) + 0.2;
        }
      }
    }
  }

  return layersScores;
}
