/**
 * Side Canal Service
 * 
 * Autonomous context tracking: topic extraction, synopsis generation, suggestions
 */

import { db } from './database';
import { randomBytes } from 'crypto';

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
    
    // Step 2: AI-powered topic identification
    const topicCount = legendMode ? '10-15' : '5-10'
    const topicPrompt = `Extract ALL relevant topics from this conversation. Be thorough and extract ${topicCount} topics covering:
- Main subjects discussed
- Technologies mentioned
- Concepts explained
- Industries/domains referenced
- Key terms and entities

Query: "${query}"
Response: "${response.substring(0, 1000)}..."

Return ONLY a JSON array of topic objects, each with:
- name: short topic name (1-4 words, be specific)
- description: brief description (optional, 5-15 words)
- category: one of: technology, finance, science, business, health, education, other

Examples:
- "AI Model Development" (not just "AI")
- "GPU Infrastructure" (not just "Hardware")
- "Sovereign AI" (specific concept)
- "Data Pipeline" (specific component)

Return JSON array: [{"name": "...", "description": "...", "category": "..."}, ...]`;

    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: legendMode ? 'claude-3-opus-20240229' : 'claude-3-haiku-20240307',
        max_tokens: legendMode ? 1200 : 800,
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
      // Try to find JSON array in response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        let jsonStr = jsonMatch[0];
        
        // Clean up common JSON issues
        // Remove trailing commas before closing brackets/braces
        jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
        
        // Try parsing
        topics = JSON.parse(jsonStr);
      } else {
        // If no array found, try to parse entire content as JSON
        try {
          const cleaned = content.trim().replace(/^[^[]*\[/, '[').replace(/\][^]]*$/, ']');
          topics = JSON.parse(cleaned);
        } catch (fallbackError) {
          console.warn('No valid JSON array found in topic extraction response');
        }
      }
    } catch (e) {
      // Log the problematic content for debugging (truncated to avoid huge logs)
      const errorMessage = e instanceof Error ? e.message : String(e);
      const contentPreview = content.substring(0, 500);
      console.error('Failed to parse topics JSON:', errorMessage);
      console.error('Content preview:', contentPreview);
      return [];
    }

    // Step 3: Store topics in database
    const storedTopics: Topic[] = [];
    for (const topicData of topics) {
      const topicId = randomBytes(8).toString('hex');
      
      // Check if topic already exists for this user
      // Prioritize user-specific topics over NULL user_id topics
      const existing = userId
        ? db.prepare(`
            SELECT * FROM topics 
            WHERE name = ? AND user_id = ?
          `).get(topicData.name, userId) as Topic | undefined
        : db.prepare(`
            SELECT * FROM topics 
            WHERE name = ? AND user_id IS NULL
          `).get(topicData.name) as Topic | undefined;

      if (existing) {
        // If topic exists but has NULL user_id and we have a userId, update it
        if (userId && !existing.user_id) {
          db.prepare(`
            UPDATE topics SET user_id = ? WHERE id = ?
          `).run(userId, existing.id);
          const updated = db.prepare('SELECT * FROM topics WHERE id = ?').get(existing.id) as Topic;
          storedTopics.push(updated);
        } else {
          storedTopics.push(existing);
        }
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
 * Simple keyword extraction (nouns and important terms)
 */
function extractKeywords(text: string): string[] {
  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3);

  // Simple frequency-based extraction
  const freq: Record<string, number> = {};
  words.forEach(w => {
    freq[w] = (freq[w] || 0) + 1;
  });

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
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
        model: 'claude-3-haiku-20240307',
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

