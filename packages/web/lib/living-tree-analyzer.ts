/**
 * Living Tree Analyzer
 *
 * AI-powered topic extraction and Hermetic analysis using Claude Opus 4.5
 * Applies 7 Hermetic Laws to conversation evolution
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// TypeScript interfaces for Living Tree data structures
export interface LivingTopic {
  id?: number;
  conversation_id: string;
  name: string;
  description: string;
  emergence_query_id?: string;
  dissolution_query_id?: string | null;
  parent_topic_id?: number | null;
  importance_score: number;
  vibration_level: 'high' | 'medium' | 'low';
  polarity: 'positive' | 'negative' | 'neutral';
  rhythm_phase: 'rising' | 'peak' | 'falling' | 'trough';
  created_at?: number;
}

export interface TopicEdge {
  source_topic_id: number;
  target_topic_id: number;
  relationship_type: 'causal' | 'similar' | 'opposite' | 'evolves_to' | 'merges_with' | 'splits_from';
  strength: number;
  hermetic_law?: string;
}

export interface EvolutionEvent {
  event_type: 'emergence' | 'transformation' | 'merger' | 'split' | 'dissolution' | 'strengthening' | 'weakening';
  topic_ids: string;
  description: string;
  hermetic_insight: string;
}

export interface HermeticAnalysis {
  law_mentalism: string;
  law_correspondence: string;
  law_vibration: string;
  law_polarity: string;
  law_rhythm: string;
  law_cause_effect: string;
  law_gender: string;
  instinct_insight: string;
}

export interface TopicAnalysisResult {
  topics: LivingTopic[];
  edges: TopicEdge[];
  evolutionEvents: EvolutionEvent[];
  hermeticAnalysis: HermeticAnalysis;
  instinctInsight: string;
}

/**
 * Analyze conversation using Claude Opus 4.5 with Hermetic lens
 */
export async function analyzeWithOpus(request: {
  query: string;
  response: string;
  previousTopics: LivingTopic[];
  conversationHistory: Array<{ query: string; response: string }>;
  conversationId: string;
  queryId: string;
}): Promise<TopicAnalysisResult> {
  const systemPrompt = `You are a Hermetic Intelligence Analyst with deep knowledge of the 7 Hermetic Laws and the Tree of Life. Your role is to analyze conversations to identify:

1. **Topics**: Core subjects being discussed (3-7 topics per exchange)
2. **Topic Evolution**: How subjects transform, emerge, merge, split, or dissolve
3. **Hermetic Patterns**: How the 7 Laws manifest in the discussion:
   - **Mentalism**: "All is mind; the universe is mental" - Thoughts creating reality
   - **Correspondence**: "As above, so below; as within, so without" - Macro/micro patterns
   - **Vibration**: "Nothing rests; everything moves; everything vibrates" - Energy levels and importance
   - **Polarity**: "Everything is dual; everything has poles" - Opposites and contrasts
   - **Rhythm**: "Everything flows, out and in; everything has its tides" - Cycles and phases
   - **Cause & Effect**: "Every cause has its effect; every effect has its cause" - Causal chains
   - **Gender**: "Gender is in everything; everything has masculine and feminine principles" - Creative vs receptive aspects
4. **Instinct**: Non-logical pattern recognition (what feels significant beyond pure analysis)

For each topic you identify, provide:
- **Name**: Concise topic name (2-5 words)
- **Description**: What this topic represents (1-2 sentences)
- **Importance Score**: 0.0 to 1.0 (how central is this topic?)
- **Vibration Level**: high (intense, urgent), medium (moderate), low (calm, background)
- **Polarity**: positive (constructive, growth), negative (destructive, challenge), neutral (informational)
- **Rhythm Phase**: rising (emerging), peak (dominant), falling (declining), trough (minimal)

For topic relationships, identify:
- **Causal**: One topic leads to another
- **Similar**: Topics share common themes
- **Opposite**: Topics represent contrasting ideas
- **Evolves_to**: Topic transforms into another
- **Merges_with**: Topics combine
- **Splits_from**: Topic diverges from parent

For evolution events, describe what happened (emergence, transformation, merger, split, dissolution, strengthening, weakening).

Analyze with authenticity - trust your instinct about what matters.

Return your analysis as a JSON object with this structure:
{
  "topics": [
    {
      "name": "string",
      "description": "string",
      "importance_score": number,
      "vibration_level": "high" | "medium" | "low",
      "polarity": "positive" | "negative" | "neutral",
      "rhythm_phase": "rising" | "peak" | "falling" | "trough"
    }
  ],
  "topic_relationships": [
    {
      "source_topic_name": "string",
      "target_topic_name": "string",
      "relationship_type": "causal" | "similar" | "opposite" | "evolves_to" | "merges_with" | "splits_from",
      "strength": number,
      "hermetic_law": "string"
    }
  ],
  "evolution_events": [
    {
      "event_type": "emergence" | "transformation" | "merger" | "split" | "dissolution" | "strengthening" | "weakening",
      "topic_names": ["string"],
      "description": "string",
      "hermetic_insight": "string"
    }
  ],
  "hermetic_analysis": {
    "mentalism": "string (how thoughts/mental constructs appear)",
    "correspondence": "string (macro/micro patterns)",
    "vibration": "string (overall energy level)",
    "polarity": "string (key opposites present)",
    "rhythm": "string (cycles observed)",
    "cause_effect": "string (causal chains)",
    "gender": "string (creative/receptive aspects)"
  },
  "instinct_insight": "string (non-logical pattern recognition, what feels significant)"
}`;

  const userPrompt = buildAnalysisPrompt(request);

  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 4000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    return parseOpusResponse(responseText, request.conversationId, request.queryId);
  } catch (error) {
    console.error('[Living Tree Analyzer] Opus 4.5 analysis failed:', error);
    throw error;
  }
}

/**
 * Build analysis prompt from request data
 */
function buildAnalysisPrompt(request: {
  query: string;
  response: string;
  previousTopics: LivingTopic[];
  conversationHistory: Array<{ query: string; response: string }>;
}): string {
  let prompt = `Analyze the following conversation exchange:\n\n`;

  prompt += `**User Query:**\n${request.query}\n\n`;
  prompt += `**AI Response:**\n${request.response}\n\n`;

  if (request.previousTopics.length > 0) {
    prompt += `**Previous Topics in This Conversation:**\n`;
    request.previousTopics.forEach((topic) => {
      prompt += `- ${topic.name}: ${topic.description} (importance: ${topic.importance_score}, vibration: ${topic.vibration_level})\n`;
    });
    prompt += `\n`;
  }

  if (request.conversationHistory.length > 0) {
    prompt += `**Recent Conversation History (last ${request.conversationHistory.length} exchanges):**\n`;
    request.conversationHistory.forEach((exchange, idx) => {
      prompt += `${idx + 1}. Q: ${exchange.query.substring(0, 100)}${exchange.query.length > 100 ? '...' : ''}\n`;
      prompt += `   A: ${exchange.response.substring(0, 100)}${exchange.response.length > 100 ? '...' : ''}\n`;
    });
    prompt += `\n`;
  }

  prompt += `Now, provide a comprehensive Hermetic analysis of this exchange in JSON format.`;

  return prompt;
}

/**
 * Parse Opus 4.5 response into structured data
 */
function parseOpusResponse(
  responseText: string,
  conversationId: string,
  queryId: string
): TopicAnalysisResult {
  try {
    // Extract JSON from response (Opus may wrap it in markdown code blocks)
    let jsonText = responseText.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const parsed = JSON.parse(jsonText);

    // Convert parsed topics to LivingTopic format
    const topics: LivingTopic[] = (parsed.topics || []).map((t: any) => ({
      conversation_id: conversationId,
      name: t.name,
      description: t.description,
      emergence_query_id: queryId,
      importance_score: t.importance_score || 0.5,
      vibration_level: t.vibration_level || 'medium',
      polarity: t.polarity || 'neutral',
      rhythm_phase: t.rhythm_phase || 'rising',
    }));

    // Convert topic relationships to edges (will need to map names to IDs after DB insertion)
    const edges: TopicEdge[] = (parsed.topic_relationships || []).map((r: any) => ({
      source_topic_id: 0, // Placeholder - will be resolved after DB insertion
      target_topic_id: 0, // Placeholder - will be resolved after DB insertion
      source_topic_name: r.source_topic_name, // Temporary field for mapping
      target_topic_name: r.target_topic_name, // Temporary field for mapping
      relationship_type: r.relationship_type || 'related',
      strength: r.strength || 0.5,
      hermetic_law: r.hermetic_law,
    } as any));

    // Evolution events
    const evolutionEvents: EvolutionEvent[] = (parsed.evolution_events || []).map((e: any) => ({
      event_type: e.event_type,
      topic_ids: JSON.stringify(e.topic_names || []),
      description: e.description,
      hermetic_insight: e.hermetic_insight,
    }));

    // Hermetic analysis
    const hermeticAnalysis: HermeticAnalysis = {
      law_mentalism: parsed.hermetic_analysis?.mentalism || '',
      law_correspondence: parsed.hermetic_analysis?.correspondence || '',
      law_vibration: parsed.hermetic_analysis?.vibration || '',
      law_polarity: parsed.hermetic_analysis?.polarity || '',
      law_rhythm: parsed.hermetic_analysis?.rhythm || '',
      law_cause_effect: parsed.hermetic_analysis?.cause_effect || '',
      law_gender: parsed.hermetic_analysis?.gender || '',
      instinct_insight: parsed.instinct_insight || '',
    };

    return {
      topics,
      edges,
      evolutionEvents,
      hermeticAnalysis,
      instinctInsight: parsed.instinct_insight || '',
    };
  } catch (error) {
    console.error('[Living Tree Analyzer] Failed to parse Opus response:', error);
    console.error('Response text:', responseText.substring(0, 500));

    // Return empty result on parse failure
    return {
      topics: [],
      edges: [],
      evolutionEvents: [],
      hermeticAnalysis: {
        law_mentalism: '',
        law_correspondence: '',
        law_vibration: '',
        law_polarity: '',
        law_rhythm: '',
        law_cause_effect: '',
        law_gender: '',
        instinct_insight: '',
      },
      instinctInsight: '',
    };
  }
}

/**
 * Save Living Tree analysis to database
 */
export async function saveLivingTreeAnalysis(
  queryId: string,
  conversationId: string,
  analysis: TopicAnalysisResult
): Promise<void> {
  const { db } = await import('./database');

  try {
    // 1. Save Hermetic Analysis
    const hermeticStmt = db.prepare(`
      INSERT INTO hermetic_analysis (
        query_id, conversation_id,
        law_mentalism, law_correspondence, law_vibration, law_polarity,
        law_rhythm, law_cause_effect, law_gender, instinct_insight
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    hermeticStmt.run(
      queryId,
      conversationId,
      analysis.hermeticAnalysis.law_mentalism,
      analysis.hermeticAnalysis.law_correspondence,
      analysis.hermeticAnalysis.law_vibration,
      analysis.hermeticAnalysis.law_polarity,
      analysis.hermeticAnalysis.law_rhythm,
      analysis.hermeticAnalysis.law_cause_effect,
      analysis.hermeticAnalysis.law_gender,
      analysis.hermeticAnalysis.instinct_insight
    );

    // 2. Save Living Topics
    const topicStmt = db.prepare(`
      INSERT INTO living_topics (
        conversation_id, name, description, emergence_query_id,
        importance_score, vibration_level, polarity, rhythm_phase
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const topicIdMap = new Map<string, number>(); // Map topic names to database IDs

    for (const topic of analysis.topics) {
      const result = topicStmt.run(
        conversationId,
        topic.name,
        topic.description,
        queryId,
        topic.importance_score,
        topic.vibration_level,
        topic.polarity,
        topic.rhythm_phase
      );

      topicIdMap.set(topic.name, result.lastInsertRowid as number);
    }

    // 3. Save Topic Edges (now that we have topic IDs)
    const edgeStmt = db.prepare(`
      INSERT INTO living_topic_edges (
        conversation_id, source_topic_id, target_topic_id,
        relationship_type, strength, hermetic_law, first_seen_query_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const edge of analysis.edges) {
      const sourceId = topicIdMap.get((edge as any).source_topic_name);
      const targetId = topicIdMap.get((edge as any).target_topic_name);

      if (sourceId && targetId) {
        edgeStmt.run(
          conversationId,
          sourceId,
          targetId,
          edge.relationship_type,
          edge.strength,
          edge.hermetic_law || null,
          queryId
        );
      }
    }

    // 4. Save Evolution Events
    const eventStmt = db.prepare(`
      INSERT INTO topic_evolution_events (
        conversation_id, query_id, event_type, topic_ids, description, hermetic_insight
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const event of analysis.evolutionEvents) {
      eventStmt.run(
        conversationId,
        queryId,
        event.event_type,
        event.topic_ids,
        event.description,
        event.hermetic_insight
      );
    }

    console.log(
      `[Living Tree] Saved analysis: ${analysis.topics.length} topics, ${analysis.edges.length} edges, ${analysis.evolutionEvents.length} events`
    );
  } catch (error) {
    console.error('[Living Tree] Failed to save analysis to database:', error);
    throw error;
  }
}

/**
 * Get active topics for a conversation (not dissolved)
 */
export async function getActiveTopics(conversationId: string): Promise<LivingTopic[]> {
  const { db } = await import('./database');

  const stmt = db.prepare(`
    SELECT *
    FROM living_topics
    WHERE conversation_id = ? AND dissolution_query_id IS NULL
    ORDER BY importance_score DESC
    LIMIT 50
  `);

  return stmt.all(conversationId) as LivingTopic[];
}

/**
 * Get recent queries for conversation history context
 */
export async function getRecentQueries(
  conversationId: string,
  limit: number = 5
): Promise<Array<{ query: string; response: string }>> {
  const { db } = await import('./database');

  // For now, return empty array - will be populated from queries table when conversation tracking is added
  // This is a placeholder for future implementation
  return [];
}
