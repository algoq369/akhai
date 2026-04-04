/**
 * Side Canal Service
 * 
 * Autonomous context tracking: topic extraction, synopsis generation, suggestions
 */

import { db } from './database';
import { randomBytes } from 'crypto';
import { extractKeywords } from './side-canal-keywords';
export { extractKeywords } from './side-canal-keywords';
export { getKeywordLayersContext } from './side-canal-keywords';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const FREE_MODE = process.env.AKHAI_FREE_MODE === 'true';

/**
 * Call LLM with OpenRouter free tier fallback when Anthropic is unavailable.
 * Returns the text content from the response, or null on failure.
 */
async function callLLM(prompt: string, maxTokens: number): Promise<string | null> {
  // Use Anthropic if credits available and not in free mode
  if (ANTHROPIC_API_KEY && !FREE_MODE) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.content?.[0]?.text || null;
      }
      // 400/401/402/429 = fall through to OpenRouter
      const status = res.status;
      if (status >= 400 && status < 500) {
        console.warn(`Anthropic API returned ${status}, falling back to OpenRouter`);
      } else {
        console.error(`Anthropic API error: ${status}`);
        return null;
      }
    } catch (err) {
      console.warn('Anthropic API unreachable, falling back to OpenRouter:', err);
    }
  }

  // OpenRouter free tier fallback
  if (!OPENROUTER_API_KEY) {
    console.warn('No OPENROUTER_API_KEY configured, cannot fall back');
    return null;
  }

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
      }),
    });

    if (!res.ok) {
      console.error('OpenRouter API error:', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.error('OpenRouter API error:', err);
    return null;
  }
}

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
  if (!ANTHROPIC_API_KEY && !OPENROUTER_API_KEY) {
    console.warn('No API keys configured, skipping topic extraction');
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

    const content = await callLLM(topicPrompt, 500);
    if (!content) {
      console.error('Failed to extract topics: no LLM response');
      return [];
    }
    
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
        SELECT * FROM topics WHERE name = ? AND (user_id = ?)
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
 * Generate synopsis for a topic based on related queries
 */
export async function generateSynopsis(
  topicId: string,
  queryIds: string[],
  userId: string | null
): Promise<string | null> {
  if ((!ANTHROPIC_API_KEY && !OPENROUTER_API_KEY) || queryIds.length === 0) {
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

    const synopsis = (await callLLM(synopsisPrompt, 200))?.trim() || null;

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
        AND (user_id = ?)
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
        AND (user_id = ?)
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
          WHERE topic_from = ? AND topic_to = ? AND (user_id = ?)
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

