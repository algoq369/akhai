/**
 * Side Canal Service
 * 
 * Autonomous context tracking: topic extraction, synopsis generation, suggestions
 */

import { db } from './database';
import { randomBytes } from 'crypto';
import { LAYERS_KEYWORDS_BY_NAME } from './constants/layer-keywords';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export interface Topic {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  user_id: string | null;
  created_at: number;
  updated_at: number;
}

export interface TopicRelationship {
  id: number;
  topic_from: string;
  topic_to: string;
  relationship_type: string;
  strength: number;
  user_id: string | null;
  created_at: number;
}

export interface Suggestion {
  topicId: string;
  topicName: string;
  reason: string;
  relevance: number;
}

/**
 * Extract topics from query and response using keyword extraction + AI analysis
 */
export async function extractTopics(
  query: string,
  response: string,
  userId: string | null,
  legendMode: boolean = false
): Promise<Topic[]> {
  if (!ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY not configured, skipping topic extraction');
    return [];
  }

  try {
    // Step 1: Keyword extraction (simple noun extraction)
    const keywords = extractKeywords(query + ' ' + response);
    
    // Step 2: AI-powered topic identification using Claude Haiku
    const topicPrompt = `Extract 3-5 SPECIFIC topics from this conversation.

Query: "${query}"
Response: "${response.substring(0, 500)}..."

IMPORTANT: Topic names MUST be SPECIFIC and DESCRIPTIVE (3-5 words).
- BAD: "Technology", "Finance", "Science" (too generic)
- GOOD: "Bitcoin Mining Efficiency", "RSA Encryption Vulnerability", "Quantum Error Correction"

Return ONLY a JSON array of topic objects, each with:
- name: SPECIFIC descriptive topic name (3-5 words, NOT generic categories)
- description: brief explanation of the specific concept (1 sentence)
- category: one of: technology, finance, science, business, health, education, other

Example: [{"name": "Quantum Computing RSA Threat", "description": "How quantum algorithms like Shor's can break RSA encryption", "category": "technology"}, {"name": "Post-Quantum Cryptography Standards", "description": "NIST-approved algorithms resistant to quantum attacks", "category": "technology"}]`;

    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: topicPrompt,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      console.error('Failed to extract topics:', await aiResponse.text());
      return [];
    }

    const aiData = await aiResponse.json();
    const content = aiData.content?.[0]?.text || '';
    
    // Parse JSON from response
    let topics: Array<{ name: string; description?: string; category?: string }> = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        topics = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse topics JSON:', e);
      return [];
    }

    // Step 3: Store topics in database
    const storedTopics: Topic[] = [];
    for (const topicData of topics) {
      const topicId = randomBytes(8).toString('hex');
      
      // Check if topic already exists for this user
      const existing = db.prepare(`
        SELECT * FROM topics WHERE name = ? AND (user_id = ? OR user_id IS NULL)
      `).get(topicData.name, userId) as Topic | undefined;

      if (existing) {
        storedTopics.push(existing);
        continue;
      }

      // Create new topic
      db.prepare(`
        INSERT INTO topics (id, name, description, category, user_id)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        topicId,
        topicData.name,
        topicData.description || null,
        topicData.category || 'other',
        userId
      );

      const newTopic = db.prepare('SELECT * FROM topics WHERE id = ?').get(topicId) as Topic;
      storedTopics.push(newTopic);
    }

    return storedTopics;
  } catch (error) {
    console.error('Topic extraction error:', error);
    return [];
  }
}

/**
 * Enhanced keyword extraction with NLP-inspired techniques
 * - TF-IDF-like scoring (term frequency * inverse document frequency)
 * - Named entity detection (capitalized words, technical terms)
 * - Compound term detection ("machine learning" vs "machine" + "learning")
 * - Layers-aligned keyword boosting
 */

// Common English stop words (expanded list)
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'it', 'its',
  'what', 'which', 'who', 'whom', 'how', 'when', 'where', 'why', 'there', 'here',
  'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
  'about', 'into', 'your', 'you', 'they', 'them', 'their', 'we', 'us', 'our',
  'i', 'me', 'my', 'he', 'she', 'his', 'her', 'him', 'any', 'also', 'get',
  'like', 'make', 'made', 'new', 'now', 'way', 'want', 'know', 'need', 'use'
])

// Technical/domain terms that should be boosted
const DOMAIN_TERMS = new Set([
  'algorithm', 'api', 'blockchain', 'bitcoin', 'crypto', 'database', 'machine',
  'learning', 'neural', 'network', 'optimization', 'protocol', 'security',
  'trading', 'investment', 'portfolio', 'strategy', 'analysis', 'model',
  'framework', 'architecture', 'infrastructure', 'deployment', 'integration',
  'layers', 'kabbalistic', 'hermetic', 'methodology', 'consciousness'
])

// Layers-related keywords for context boosting - imported from shared module
// See: ./constants/layers-keywords.ts

interface KeywordScore {
  word: string
  frequency: number
  tfIdf: number
  isEntity: boolean
  isDomain: boolean
  layersMatch: string | null
  finalScore: number
}

// Known meaningful phrases to detect
const MEANINGFUL_PHRASES = new Set([
  'world economic forum', 'financial system', 'digital currency', 'digital currencies',
  'central bank', 'machine learning', 'artificial intelligence', 'deep learning',
  'neural network', 'natural language', 'climate change', 'economic growth',
  'monetary policy', 'fiscal policy', 'interest rate', 'exchange rate',
  'blockchain technology', 'cryptocurrency market', 'global economy', 'supply chain',
  'data science', 'computer vision', 'tree of life', 'quantum computing'
])

function extractKeywords(text: string): string[] {
  const originalText = text
  const cleanText = text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ')
  const words = cleanText.split(/\s+/).filter(w => w.length > 2)

  // PRIORITY 1: Extract known meaningful phrases first
  const foundPhrases: string[] = []
  for (const phrase of MEANINGFUL_PHRASES) {
    if (cleanText.includes(phrase)) {
      foundPhrases.push(phrase)
    }
  }

  // PRIORITY 2: Extract proper noun phrases (capitalized sequences)
  const properNouns = new Set<string>()
  const capitalizedMatches = originalText.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}/g) || []
  capitalizedMatches.forEach(entity => {
    if (entity.split(' ').length >= 2) { // Only keep 2+ word phrases
      properNouns.add(entity.toLowerCase())
    }
  })

  // PRIORITY 3: Extract compound terms (bigrams, trigrams, 4-grams)
  const ngrams: Record<string, number> = {}

  // Bigrams (2 words)
  for (let i = 0; i < words.length - 1; i++) {
    if (!STOP_WORDS.has(words[i]) && !STOP_WORDS.has(words[i + 1])) {
      const bigram = `${words[i]} ${words[i + 1]}`
      ngrams[bigram] = (ngrams[bigram] || 0) + 1
    }
  }

  // Trigrams (3 words) - more meaningful
  for (let i = 0; i < words.length - 2; i++) {
    // At least 2 of 3 words should be non-stop words
    const nonStopCount = [words[i], words[i + 1], words[i + 2]]
      .filter(w => !STOP_WORDS.has(w)).length
    if (nonStopCount >= 2) {
      const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`
      ngrams[trigram] = (ngrams[trigram] || 0) + 1.5 // Boost trigrams
    }
  }

  // 4-grams (4 words) - most meaningful
  for (let i = 0; i < words.length - 3; i++) {
    const nonStopCount = [words[i], words[i + 1], words[i + 2], words[i + 3]]
      .filter(w => !STOP_WORDS.has(w)).length
    if (nonStopCount >= 3) {
      const fourgram = `${words[i]} ${words[i + 1]} ${words[i + 2]} ${words[i + 3]}`
      ngrams[fourgram] = (ngrams[fourgram] || 0) + 2.0 // Boost 4-grams more
    }
  }

  // Score n-grams
  const ngramScores = Object.entries(ngrams)
    .filter(([phrase, _]) => phrase.split(' ').length >= 2) // Minimum 2 words
    .map(([phrase, count]) => {
      let score = count
      // Boost domain terms
      if (phrase.split(' ').some(w => DOMAIN_TERMS.has(w))) score *= 2.0
      // Boost longer phrases
      const wordCount = phrase.split(' ').length
      score *= (1 + wordCount * 0.3)
      return { phrase, score }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(n => n.phrase)

  // PRIORITY 4: Single-word domain terms (only if important)
  const freq: Record<string, number> = {}
  words.forEach(w => {
    if (!STOP_WORDS.has(w) && w.length > 4) { // Minimum 5 chars for single words
      freq[w] = (freq[w] || 0) + 1
    }
  })

  const singleWordTerms = Object.entries(freq)
    .filter(([word, count]) => {
      // Only keep single words that are domain terms or very frequent
      return DOMAIN_TERMS.has(word) || count >= 3
    })
    .sort((a, b) => {
      const aBoost = DOMAIN_TERMS.has(a[0]) ? 2 : 1
      const bBoost = DOMAIN_TERMS.has(b[0]) ? 2 : 1
      return (b[1] * bBoost) - (a[1] * aBoost)
    })
    .slice(0, 5)
    .map(([word]) => word)

  // Combine all, prioritizing phrases over single words
  const allKeywords = [
    ...foundPhrases,           // Known meaningful phrases first
    ...Array.from(properNouns), // Proper noun phrases
    ...ngramScores,             // Detected n-grams
    ...singleWordTerms          // Important single words last
  ]

  // Remove duplicates while preserving order
  const seen = new Set<string>()
  const uniqueKeywords = allKeywords.filter(kw => {
    const lower = kw.toLowerCase()
    if (seen.has(lower)) return false
    // Also check if this keyword is a substring of an already-seen phrase
    for (const s of seen) {
      if (s.includes(lower) || lower.includes(s)) return false
    }
    seen.add(lower)
    return true
  })

  return uniqueKeywords.slice(0, 12)
}

/**
 * Get Layers context for keywords
 * Returns which Layers are most relevant based on keywords
 */
export function getKeywordLayersContext(keywords: string[]): Record<string, number> {
  const layersScores: Record<string, number> = {}

  for (const keyword of keywords) {
    const keywordLower = keyword.toLowerCase()
    for (const [layerNode, layerNodeKeywords] of Object.entries(LAYERS_KEYWORDS_BY_NAME)) {
      for (const sk of layerNodeKeywords) {
        if (keywordLower.includes(sk) || sk.includes(keywordLower)) {
          layersScores[layerNode] = (layersScores[layerNode] || 0) + 0.2
        }
      }
    }
  }

  return layersScores
}

/**
 * Generate synopsis for a topic based on related queries
 */
export async function generateSynopsis(
  topicId: string,
  queryIds: string[],
  userId: string | null
): Promise<string | null> {
  if (!ANTHROPIC_API_KEY || queryIds.length === 0) {
    return null;
  }

  try {
    // Get queries from database
    const queries = db.prepare(`
      SELECT q.query, q.result
      FROM queries q
      JOIN query_topics qt ON q.id = qt.query_id
      WHERE qt.topic_id = ? AND (q.user_id = ? OR q.user_id IS NULL)
      LIMIT 10
    `).all(topicId, userId) as Array<{ query: string; result: string | null }>;

    if (queries.length === 0) {
      return null;
    }

    // Build context from queries
    const context = queries.map((q, i) => {
      const result = q.result ? JSON.parse(q.result) : null;
      return `Q${i + 1}: ${q.query}\nA${i + 1}: ${result?.finalAnswer || 'No answer'}`;
    }).join('\n\n');

    const synopsisPrompt = `Generate a concise synopsis (2-3 sentences) summarizing the key insights from these related queries:

${context}

Synopsis:`;

    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: synopsisPrompt,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      return null;
    }

    const aiData = await aiResponse.json();
    const synopsis = aiData.content?.[0]?.text?.trim() || null;

    // Store synopsis
    if (synopsis) {
      const synopsisId = randomBytes(8).toString('hex');
      db.prepare(`
        INSERT OR REPLACE INTO synopses (id, topic_id, content, query_ids, user_id)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        synopsisId,
        topicId,
        synopsis,
        JSON.stringify(queryIds),
        userId
      );
    }

    return synopsis;
  } catch (error) {
    console.error('Synopsis generation error:', error);
    return null;
  }
}

/**
 * Get suggestions for related topics based on current conversation topics
 */
export function getSuggestions(
  currentTopics: string[],
  userId: string | null
): Suggestion[] {
  if (currentTopics.length === 0) {
    return [];
  }

  try {
    // Find topics related to current topics via relationships
    const placeholders = currentTopics.map(() => '?').join(',');
    const related = db.prepare(`
      SELECT DISTINCT t.id, t.name, tr.strength, tr.relationship_type
      FROM topics t
      JOIN topic_relationships tr ON t.id = tr.topic_to
      WHERE tr.topic_from IN (${placeholders})
        AND t.id NOT IN (${placeholders})
        AND (t.user_id = ? OR t.user_id IS NULL)
      ORDER BY tr.strength DESC
      LIMIT 5
    `).all(...currentTopics, ...currentTopics, userId) as Array<{
      id: string;
      name: string;
      strength: number;
      relationship_type: string;
    }>;

    return related.map(r => ({
      topicId: r.id,
      topicName: r.name,
      reason: `Related to your current topics (${r.relationship_type})`,
      relevance: r.strength,
    }));
  } catch (error) {
    console.error('Suggestion generation error:', error);
    return [];
  }
}

/**
 * Get context for a query based on related synopses
 */
export function getContextForQuery(
  query: string,
  userId: string | null
): string | null {
  try {
    // Find topics that match query keywords
    const keywords = extractKeywords(query);
    if (keywords.length === 0) {
      return null;
    }

    // Find topics matching keywords
    const placeholders = keywords.map(() => 'name LIKE ?').join(' OR ');
    const matchingTopics = db.prepare(`
      SELECT id FROM topics
      WHERE (${placeholders})
        AND (user_id = ? OR user_id IS NULL)
      LIMIT 3
    `).all(...keywords.map(k => `%${k}%`), userId) as Array<{ id: string }>;

    if (matchingTopics.length === 0) {
      return null;
    }

    // Get synopses for matching topics
    const topicIds = matchingTopics.map(t => t.id);
    const synopsisPlaceholders = topicIds.map(() => '?').join(',');
    const synopses = db.prepare(`
      SELECT content FROM synopses
      WHERE topic_id IN (${synopsisPlaceholders})
        AND (user_id = ? OR user_id IS NULL)
    `).all(...topicIds, userId) as Array<{ content: string }>;

    if (synopses.length === 0) {
      return null;
    }

    return synopses.map(s => s.content).join('\n\n');
  } catch (error) {
    console.error('Context retrieval error:', error);
    return null;
  }
}

/**
 * Link query to topics
 */
export function linkQueryToTopics(
  queryId: string,
  topicIds: string[],
  relevance: number = 1.0
): void {
  try {
    for (const topicId of topicIds) {
      db.prepare(`
        INSERT OR IGNORE INTO query_topics (query_id, topic_id, relevance)
        VALUES (?, ?, ?)
      `).run(queryId, topicId, relevance);
    }
  } catch (error) {
    console.error('Link query to topics error:', error);
  }
}

/**
 * Update topic relationships based on co-occurrence
 */
export function updateTopicRelationships(
  topicIds: string[],
  userId: string | null
): void {
  try {
    // For each pair of topics, create/update relationship
    for (let i = 0; i < topicIds.length; i++) {
      for (let j = i + 1; j < topicIds.length; j++) {
        const topicFrom = topicIds[i];
        const topicTo = topicIds[j];

        // Check if relationship exists
        const existing = db.prepare(`
          SELECT * FROM topic_relationships
          WHERE topic_from = ? AND topic_to = ? AND (user_id = ? OR user_id IS NULL)
        `).get(topicFrom, topicTo, userId);

        if (existing) {
          // Update strength
          db.prepare(`
            UPDATE topic_relationships
            SET strength = strength + 0.1, user_id = ?
            WHERE topic_from = ? AND topic_to = ?
          `).run(userId, topicFrom, topicTo);
        } else {
          // Create new relationship
          db.prepare(`
            INSERT INTO topic_relationships (topic_from, topic_to, relationship_type, strength, user_id)
            VALUES (?, ?, 'related', 1.0, ?)
          `).run(topicFrom, topicTo, userId);
        }
      }
    }
  } catch (error) {
    console.error('Update topic relationships error:', error);
  }
}

