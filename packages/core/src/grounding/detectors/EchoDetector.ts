/**
 * Echo Chamber Detector
 *
 * Detects when AI responses are too similar (echo chamber effect).
 * Uses semantic similarity with embeddings (MiniLM).
 *
 * Triggers: High cosine similarity between responses (>0.85 default)
 */

import type { Message, GroundingAlert, AlertSeverity } from '../types.js';

/**
 * Simple embedding cache to avoid re-computing
 */
const embeddingCache = new Map<string, number[]>();

/**
 * Detect echo chamber (excessive similarity between responses)
 */
export async function detectEcho(
  messages: Message[],
  similarityThreshold: number = 0.85
): Promise<GroundingAlert | null> {
  const startTime = Date.now();

  // Get recent assistant messages (last 5)
  const recentAssistant = messages
    .filter(m => m.role === 'assistant')
    .slice(-5);

  if (recentAssistant.length < 2) {
    return null; // Need at least 2 messages to compare
  }

  // Compute pairwise similarities
  const similarities: Array<{
    msg1: number;
    msg2: number;
    similarity: number;
  }> = [];

  for (let i = 0; i < recentAssistant.length - 1; i++) {
    for (let j = i + 1; j < recentAssistant.length; j++) {
      const sim = await computeSimilarity(
        recentAssistant[i].content,
        recentAssistant[j].content
      );
      similarities.push({
        msg1: i,
        msg2: j,
        similarity: sim,
      });
    }
  }

  // Find highest similarity
  const maxSimilarity = Math.max(...similarities.map(s => s.similarity));
  const avgSimilarity =
    similarities.reduce((sum, s) => sum + s.similarity, 0) / similarities.length;

  // Calculate severity
  const severity: AlertSeverity =
    maxSimilarity >= similarityThreshold + 0.1
      ? 'critical'
      : maxSimilarity >= similarityThreshold
      ? 'warning'
      : 'info';

  // Only create alert if similarity exceeds threshold
  if (maxSimilarity < similarityThreshold) {
    return null;
  }

  // Count how many pairs exceed threshold
  const highSimilarityPairs = similarities.filter(
    s => s.similarity >= similarityThreshold
  ).length;

  const evidence = [
    `Highest similarity: ${(maxSimilarity * 100).toFixed(1)}%`,
    `Average similarity: ${(avgSimilarity * 100).toFixed(1)}%`,
    `High-similarity pairs: ${highSimilarityPairs}/${similarities.length}`,
  ];

  const suggestions = [
    'Encourage different perspectives from advisor slots',
    'Verify answers against external sources',
    'Consider asking follow-up questions to probe depth',
  ];

  if (maxSimilarity >= 0.95) {
    suggestions.unshift('Responses are nearly identical - possible lack of diversity');
  }

  return {
    id: `echo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'echo',
    severity,
    confidence: maxSimilarity,
    message:
      maxSimilarity >= 0.95
        ? 'Echo chamber detected - responses lack diversity'
        : 'High similarity detected between responses',
    timestamp: Date.now(),
    evidence,
    suggestions,
  };
}

/**
 * Compute semantic similarity between two texts
 *
 * Uses simple token overlap for now (Jaccard similarity).
 * Can be upgraded to use embeddings when @xenova/transformers is available.
 */
async function computeSimilarity(text1: string, text2: string): Promise<number> {
  // Try ML-based similarity first
  const mlSimilarity = await computeEmbeddingSimilarity(text1, text2);
  if (mlSimilarity !== null) {
    return mlSimilarity;
  }

  // Fallback to token-based Jaccard similarity
  return computeJaccardSimilarity(text1, text2);
}

/**
 * Jaccard similarity (token overlap)
 */
function computeJaccardSimilarity(text1: string, text2: string): number {
  const tokens1 = new Set(
    text1
      .toLowerCase()
      .split(/\s+/)
      .filter(t => t.length > 3) // Skip short words
  );
  const tokens2 = new Set(
    text2
      .toLowerCase()
      .split(/\s+/)
      .filter(t => t.length > 3)
  );

  const intersection = new Set([...tokens1].filter(t => tokens2.has(t)));
  const union = new Set([...tokens1, ...tokens2]);

  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

/**
 * Compute cosine similarity between embeddings
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

/**
 * Compute embedding-based similarity (optional ML enhancement)
 *
 * NOTE: Requires @xenova/transformers to be installed.
 * Currently returns null (falls back to Jaccard).
 * To enable: uncomment imports and implementation.
 */
async function computeEmbeddingSimilarity(
  text1: string,
  text2: string
): Promise<number | null> {
  try {
    // Check cache first
    const cached1 = embeddingCache.get(text1);
    const cached2 = embeddingCache.get(text2);

    if (cached1 && cached2) {
      return cosineSimilarity(cached1, cached2);
    }

    // Lazy load transformers.js
    // const { pipeline } = await import('@xenova/transformers');
    // const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

    // Generate embeddings
    // const embedding1 = cached1 || (await generateEmbedding(embedder, text1));
    // const embedding2 = cached2 || (await generateEmbedding(embedder, text2));

    // Cache for future use
    // if (!cached1) embeddingCache.set(text1, embedding1);
    // if (!cached2) embeddingCache.set(text2, embedding2);

    // return cosineSimilarity(embedding1, embedding2);

    return null; // Disabled for now
  } catch (error) {
    console.warn('[EchoDetector] Embedding similarity not available:', error);
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

  // Convert tensor to array
  return Array.from(result.data);
}

/**
 * Clear embedding cache (useful for memory management)
 */
export function clearEmbeddingCache(): void {
  embeddingCache.clear();
}
