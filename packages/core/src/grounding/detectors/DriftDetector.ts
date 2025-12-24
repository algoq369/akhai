/**
 * Drift Detector
 *
 * Detects topic drift in conversation (staying on track).
 * Compares current topic to initial topic using embeddings.
 *
 * Triggers: Low similarity between current and initial topic (<0.7 default)
 */

import type { Message, GroundingAlert, AlertSeverity } from '../types.js';

/**
 * Detect topic drift
 */
export async function detectDrift(
  messages: Message[],
  driftTolerance: number = 0.3
): Promise<GroundingAlert | null> {
  const startTime = Date.now();

  if (messages.length < 4) {
    return null; // Need enough messages to detect drift
  }

  // Get initial context (first 2 user messages)
  const initialMessages = messages.filter(m => m.role === 'user').slice(0, 2);
  const recentMessages = messages.filter(m => m.role === 'user').slice(-2);

  if (initialMessages.length === 0 || recentMessages.length === 0) {
    return null;
  }

  // Combine messages into topic summaries
  const initialTopic = initialMessages.map(m => m.content).join(' ');
  const recentTopic = recentMessages.map(m => m.content).join(' ');

  // Compute topic similarity
  const similarity = await computeTopicSimilarity(initialTopic, recentTopic);

  // Calculate drift score (inverse of similarity)
  const driftScore = 1 - similarity;

  // Calculate severity
  const severity: AlertSeverity =
    driftScore >= driftTolerance + 0.3
      ? 'critical'
      : driftScore >= driftTolerance
      ? 'warning'
      : 'info';

  // Only create alert if drift exceeds tolerance
  if (driftScore < driftTolerance) {
    return null;
  }

  // Extract topics for evidence
  const initialKeywords = extractKeywords(initialTopic);
  const recentKeywords = extractKeywords(recentTopic);

  const evidence = [
    `Topic similarity: ${(similarity * 100).toFixed(1)}%`,
    `Drift score: ${(driftScore * 100).toFixed(1)}%`,
    `Initial topics: ${initialKeywords.slice(0, 5).join(', ')}`,
    `Recent topics: ${recentKeywords.slice(0, 5).join(', ')}`,
  ];

  const suggestions = [
    'Review initial query to stay on track',
    'Explicitly redirect conversation back to original topic',
    'Summarize progress before continuing',
  ];

  if (driftScore >= 0.7) {
    suggestions.unshift('Conversation has significantly drifted from original topic');
  }

  return {
    id: `drift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'drift',
    severity,
    confidence: driftScore,
    message:
      driftScore >= 0.7
        ? 'Significant topic drift detected'
        : 'Topic drift detected - conversation may be diverging',
    timestamp: Date.now(),
    evidence,
    suggestions,
  };
}

/**
 * Compute topic similarity
 *
 * Uses simple keyword overlap for now.
 * Can be upgraded to use embeddings when @xenova/transformers is available.
 */
async function computeTopicSimilarity(topic1: string, topic2: string): Promise<number> {
  // Try ML-based similarity first
  const mlSimilarity = await computeEmbeddingSimilarity(topic1, topic2);
  if (mlSimilarity !== null) {
    return mlSimilarity;
  }

  // Fallback to keyword-based similarity
  return computeKeywordSimilarity(topic1, topic2);
}

/**
 * Keyword-based similarity (TF-IDF weighted)
 */
function computeKeywordSimilarity(text1: string, text2: string): number {
  const keywords1 = extractKeywords(text1);
  const keywords2 = extractKeywords(text2);

  if (keywords1.length === 0 || keywords2.length === 0) {
    return 0;
  }

  // Simple overlap score
  const set1 = new Set(keywords1);
  const set2 = new Set(keywords2);
  const intersection = new Set([...set1].filter(k => set2.has(k)));

  return (2 * intersection.size) / (set1.size + set2.size);
}

/**
 * Extract keywords from text (simple heuristic)
 */
function extractKeywords(text: string): string[] {
  // Remove common words (stop words)
  const stopWords = new Set([
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
    'as',
    'is',
    'was',
    'are',
    'were',
    'been',
    'be',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'should',
    'could',
    'may',
    'might',
    'can',
    'this',
    'that',
    'these',
    'those',
    'i',
    'you',
    'he',
    'she',
    'it',
    'we',
    'they',
    'what',
    'when',
    'where',
    'why',
    'how',
  ]);

  // Extract words, filter stop words, count frequency
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w));

  // Count word frequency
  const frequency = new Map<string, number>();
  for (const word of words) {
    frequency.set(word, (frequency.get(word) || 0) + 1);
  }

  // Return top keywords by frequency
  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .slice(0, 10);
}

/**
 * Compute embedding-based similarity (optional ML enhancement)
 *
 * NOTE: Requires @xenova/transformers to be installed.
 * Currently returns null (falls back to keyword-based).
 * To enable: uncomment imports and implementation.
 */
async function computeEmbeddingSimilarity(
  text1: string,
  text2: string
): Promise<number | null> {
  try {
    // Lazy load transformers.js
    // const { pipeline } = await import('@xenova/transformers');
    // const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

    // Generate embeddings
    // const embedding1 = await generateEmbedding(embedder, text1);
    // const embedding2 = await generateEmbedding(embedder, text2);

    // return cosineSimilarity(embedding1, embedding2);

    return null; // Disabled for now
  } catch (error) {
    console.warn('[DriftDetector] Embedding similarity not available:', error);
    return null;
  }
}

/**
 * Generate embedding vector for text (optional)
 */
async function generateEmbedding(embedder: any, text: string): Promise<number[]> {
  const result = await embedder(text.substring(0, 512), {
    pooling: 'mean',
    normalize: true,
  });

  return Array.from(result.data);
}

/**
 * Cosine similarity between two vectors
 */
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}
