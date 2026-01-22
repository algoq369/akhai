/**
 * Living Tree API Endpoint
 *
 * Provides dynamic topic tree data for visualization
 * GET /api/living-tree?conversationId=XXX&limit=50
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId parameter is required' },
        { status: 400 }
      )
    }

    // Fetch living topics (nodes)
    const topicsStmt = db.prepare(`
      SELECT id, name, description, importance_score, vibration_level, polarity, rhythm_phase,
             emergence_query_id, dissolution_query_id, parent_topic_id, created_at
      FROM living_topics
      WHERE conversation_id = ?
      ORDER BY importance_score DESC, created_at DESC
      LIMIT ?
    `)

    const topics = topicsStmt.all(conversationId, limit) as Array<{
      id: number
      name: string
      description: string
      importance_score: number
      vibration_level: 'high' | 'medium' | 'low'
      polarity: 'positive' | 'negative' | 'neutral'
      rhythm_phase: 'rising' | 'peak' | 'falling' | 'trough'
      emergence_query_id: string
      dissolution_query_id: string | null
      parent_topic_id: number | null
      created_at: number
    }>

    // Get topic IDs for filtering edges
    const topicIds = topics.map((t) => t.id)

    // Fetch living topic edges (relationships)
    let edges: Array<{
      source: number
      target: number
      relationshipType: string
      strength: number
      hermeticLaw: string | null
    }> = []

    if (topicIds.length > 0) {
      const placeholders = topicIds.map(() => '?').join(',')
      const edgesStmt = db.prepare(`
        SELECT source_topic_id as source, target_topic_id as target,
               relationship_type as relationshipType, strength, hermetic_law as hermeticLaw
        FROM living_topic_edges
        WHERE conversation_id = ?
          AND source_topic_id IN (${placeholders})
          AND target_topic_id IN (${placeholders})
        ORDER BY strength DESC
      `)

      edges = edgesStmt.all(conversationId, ...topicIds, ...topicIds) as Array<{
        source: number
        target: number
        relationshipType: string
        strength: number
        hermeticLaw: string | null
      }>
    }

    // Fetch evolution events
    const eventsStmt = db.prepare(`
      SELECT event_type, topic_ids, description, hermetic_insight, created_at
      FROM topic_evolution_events
      WHERE conversation_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `)

    const evolutionEvents = eventsStmt.all(conversationId) as Array<{
      event_type: string
      topic_ids: string
      description: string
      hermetic_insight: string
      created_at: number
    }>

    // Fetch hermetic summary (most recent analysis)
    const hermeticStmt = db.prepare(`
      SELECT law_mentalism, law_correspondence, law_vibration, law_polarity,
             law_rhythm, law_cause_effect, law_gender, instinct_insight
      FROM hermetic_analysis
      WHERE conversation_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `)

    const hermeticData = hermeticStmt.get(conversationId) as
      | {
          law_mentalism: string
          law_correspondence: string
          law_vibration: string
          law_polarity: string
          law_rhythm: string
          law_cause_effect: string
          law_gender: string
          instinct_insight: string
        }
      | undefined

    // Calculate hermetic summary
    const hermeticSummary = hermeticData
      ? {
          dominantLaw: determineDominantLaw(hermeticData),
          overallVibration: determineOverallVibration(topics),
          rhythmPhase: determineRhythmPhase(topics),
          instinctInsight: hermeticData.instinct_insight,
        }
      : {
          dominantLaw: 'Unknown',
          overallVibration: 'medium',
          rhythmPhase: 'rising',
          instinctInsight: '',
        }

    // Format nodes for visualization
    const nodes = topics.map((topic) => ({
      id: topic.id,
      name: topic.name,
      description: topic.description,
      importance: topic.importance_score,
      vibrationLevel: topic.vibration_level,
      polarity: topic.polarity,
      rhythmPhase: topic.rhythm_phase,
      emergedAt: new Date(topic.created_at * 1000).toISOString(),
      isActive: topic.dissolution_query_id === null,
      parentId: topic.parent_topic_id,
    }))

    // Format evolution events
    const formattedEvents = evolutionEvents.map((event) => ({
      timestamp: new Date(event.created_at * 1000).toISOString(),
      type: event.event_type,
      description: event.description,
      hermeticInsight: event.hermetic_insight,
      topicIds: JSON.parse(event.topic_ids),
    }))

    return NextResponse.json({
      nodes,
      edges,
      evolutionEvents: formattedEvents,
      hermeticSummary,
      stats: {
        totalTopics: nodes.length,
        activeTopics: nodes.filter((n) => n.isActive).length,
        totalConnections: edges.length,
        avgImportance:
          nodes.reduce((sum, n) => sum + n.importance, 0) / (nodes.length || 1),
      },
    })
  } catch (error) {
    console.error('[Living Tree API] Error fetching tree data:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch Living Tree data',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

/**
 * Determine dominant Hermetic Law based on analysis
 */
function determineDominantLaw(hermeticData: {
  law_mentalism: string
  law_correspondence: string
  law_vibration: string
  law_polarity: string
  law_rhythm: string
  law_cause_effect: string
  law_gender: string
}): string {
  // Simple heuristic: longest insight = most relevant law
  const laws = [
    { name: 'Mentalism', text: hermeticData.law_mentalism },
    { name: 'Correspondence', text: hermeticData.law_correspondence },
    { name: 'Vibration', text: hermeticData.law_vibration },
    { name: 'Polarity', text: hermeticData.law_polarity },
    { name: 'Rhythm', text: hermeticData.law_rhythm },
    { name: 'Cause & Effect', text: hermeticData.law_cause_effect },
    { name: 'Gender', text: hermeticData.law_gender },
  ]

  const dominant = laws.reduce((max, law) =>
    law.text.length > max.text.length ? law : max
  )

  return dominant.name
}

/**
 * Determine overall vibration level from topics
 */
function determineOverallVibration(
  topics: Array<{ vibration_level: string; importance_score: number }>
): 'high' | 'medium' | 'low' {
  if (topics.length === 0) return 'medium'

  // Weight by importance
  const vibrationScores = topics.map((t) => {
    const score =
      t.vibration_level === 'high' ? 3 : t.vibration_level === 'medium' ? 2 : 1
    return score * t.importance_score
  })

  const avgScore =
    vibrationScores.reduce((sum, s) => sum + s, 0) / vibrationScores.length

  if (avgScore >= 2.5) return 'high'
  if (avgScore >= 1.5) return 'medium'
  return 'low'
}

/**
 * Determine rhythm phase from topics
 */
function determineRhythmPhase(
  topics: Array<{ rhythm_phase: string; importance_score: number }>
): 'rising' | 'peak' | 'falling' | 'trough' {
  if (topics.length === 0) return 'rising'

  // Count weighted by importance
  const phaseCounts = {
    rising: 0,
    peak: 0,
    falling: 0,
    trough: 0,
  }

  topics.forEach((t) => {
    const phase = t.rhythm_phase as keyof typeof phaseCounts
    if (phase in phaseCounts) {
      phaseCounts[phase] += t.importance_score
    }
  })

  const dominant = Object.entries(phaseCounts).reduce((max, [phase, count]) =>
    count > max[1] ? [phase, count] : max
  ) as [string, number]

  return dominant[0] as 'rising' | 'peak' | 'falling' | 'trough'
}
