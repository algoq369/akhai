/**
 * Mind Map Data API
 * Returns topics with relationships for visualization
 * Enhanced with Intelligence Fusion data for Sefirot-colored nodes
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { getUserFromSession } from '@/lib/auth'
import {
  SEFIROT_COLORS,
  buildIntelligenceMindMap,
  getSefirotColor,
  calculateNodeSize
} from '@/lib/mindmap-intelligence'
import { Sefirah } from '@/lib/ascent-tracker'

export async function GET(request: NextRequest) {
  const includeIntelligence = request.nextUrl.searchParams.get('intelligence') === 'true'
  try {
    // Get user from session
    const token = request.cookies.get('session_token')?.value
    const user = token ? getUserFromSession(token) : null
    const userId = user?.id || null

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if topics table exists
    const tablesCheck = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='topics'
    `).all() as Array<{ name: string }>

    if (tablesCheck.length === 0) {
      // Topics table doesn't exist yet - return empty data
      return NextResponse.json({
        nodes: [],
        links: [],
      })
    }

    // Migrate NULL user_id topics to current user (one-time migration)
    try {
      db.prepare(`
        UPDATE topics 
        SET user_id = ?, updated_at = ?
        WHERE user_id IS NULL
      `).run(userId, Math.floor(Date.now() / 1000))
    } catch (migrationError) {
      console.error('Migration error (non-fatal):', migrationError)
    }

    // Get all topics for user
    let topics: Array<{
      id: string
      name: string
      description: string | null
      category: string | null
      color: string | null
      pinned: number
      archived: number
      ai_instructions: string | null
      created_at: number
      query_count: number
    }> = []

    try {
      topics = db.prepare(`
        SELECT 
          t.id,
          t.name,
          t.description,
          t.category,
          t.color,
          t.pinned,
          t.archived,
          t.ai_instructions,
          t.created_at,
          COUNT(DISTINCT qt.query_id) as query_count
        FROM topics t
        LEFT JOIN query_topics qt ON t.id = qt.topic_id
        WHERE t.user_id = ?
        GROUP BY t.id
        ORDER BY t.pinned DESC, t.created_at DESC
      `).all(userId) as Array<{
        id: string
        name: string
        description: string | null
        category: string | null
        color: string | null
        pinned: number
        archived: number
        ai_instructions: string | null
        created_at: number
        query_count: number
      }>
    } catch (topicsError) {
      console.error('Error fetching topics:', topicsError)
      topics = []
    }

    // Get all relationships
    let relationships: Array<{
      topic_from: string
      topic_to: string
      relationship_type: string
      strength: number
    }> = []

    try {
      relationships = db.prepare(`
        SELECT 
          topic_from,
          topic_to,
          relationship_type,
          strength
        FROM topic_relationships
        WHERE user_id = ?
      `).all(userId) as Array<{
        topic_from: string
        topic_to: string
        relationship_type: string
        strength: number
      }>
    } catch (relError) {
      console.error('Error fetching relationships:', relError)
      relationships = []
    }

    // Fetch intelligence metadata if requested
    let intelligenceData: Array<{
      query_id: string
      query: string
      intelligence: string | null
      tokens: number
    }> = []

    if (includeIntelligence) {
      try {
        intelligenceData = db.prepare(`
          SELECT
            id as query_id,
            query,
            gnostic_metadata as intelligence,
            COALESCE(tokens_used, 0) as tokens
          FROM queries
          WHERE user_id = ?
          ORDER BY created_at DESC
          LIMIT 100
        `).all(userId) as Array<{
          query_id: string
          query: string
          intelligence: string | null
          tokens: number
        }>
      } catch (e) {
        console.log('[MindMap] Intelligence data not available:', e)
      }
    }

    // Process topics with Sefirot colors
    const processedNodes = topics.map(t => {
      // Try to get Sefirot color from related query intelligence
      let sefirotColor = t.color || '#94a3b8'
      let dominantSefirah: Sefirah | null = null
      let sefirotActivations: Record<number, number> = {}

      // Find related intelligence data for this topic
      const relatedQuery = intelligenceData.find(q =>
        q.query.toLowerCase().includes(t.name.toLowerCase()) ||
        t.name.toLowerCase().split(' ').some(word =>
          word.length > 3 && q.query.toLowerCase().includes(word)
        )
      )

      if (relatedQuery?.intelligence) {
        try {
          const gnosticData = JSON.parse(relatedQuery.intelligence)
          // Extract Sefirot activations if available
          if (gnosticData.sefirotProcessing?.activations) {
            sefirotActivations = gnosticData.sefirotProcessing.activations
            const colorResult = getSefirotColor(sefirotActivations)
            sefirotColor = colorResult.primary
            dominantSefirah = colorResult.dominant
          }
        } catch {
          // Use default color
        }
      }

      // Calculate node size based on query count
      const nodeSize = calculateNodeSize(
        Math.min(1, t.query_count / 10), // Relevance based on query count
        0,
        15 + Math.min(20, t.query_count * 2) // Base + query boost
      )

      return {
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category || 'other',
        color: sefirotColor,
        borderColor: dominantSefirah !== null
          ? SEFIROT_COLORS[dominantSefirah]?.secondary || sefirotColor
          : sefirotColor,
        pinned: t.pinned === 1,
        archived: t.archived === 1,
        queryCount: t.query_count,
        ai_instructions: t.ai_instructions,
        // Intelligence fields
        dominantSefirah,
        sefirotActivations,
        size: nodeSize,
      }
    })

    // Build intelligence mind map if requested
    let intelligenceMindMap = null
    if (includeIntelligence && intelligenceData.length > 0) {
      const queriesWithIntelligence = intelligenceData
        .filter(q => q.intelligence)
        .map(q => {
          try {
            const gnosticData = JSON.parse(q.intelligence!)
            // Convert gnostic metadata to IntelligenceFusionResult format
            return {
              id: q.query_id,
              query: q.query,
              intelligence: {
                analysis: {
                  complexity: 0.5,
                  queryType: 'factual' as const,
                  requiresTools: false,
                  requiresMultiPerspective: false,
                  isMathematical: false,
                  isFactual: true,
                  isProcedural: false,
                  isCreative: false,
                  wordCount: q.query.split(' ').length,
                  keywords: q.query.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3).slice(0, 5)
                },
                sefirotActivations: Object.entries(gnosticData.sefirotProcessing?.activations || {}).map(([k, v]) => ({
                  sefirah: parseInt(k) as Sefirah,
                  name: SEFIROT_COLORS[parseInt(k) as Sefirah]?.name || 'Unknown',
                  activation: v as number,
                  weight: 0.5,
                  effectiveWeight: (v as number) * 0.5,
                  keywords: []
                })),
                dominantSefirot: [],
                pathActivations: [],
                selectedMethodology: gnosticData.sefirotProcessing?.methodologySuggestion || 'direct',
                methodologyScores: [],
                confidence: 0.7,
                guardRecommendation: 'proceed' as const,
                guardReasons: [],
                instinctPrompt: '',
                activeLenses: [],
                contextInjection: null,
                relatedTopics: [],
                extendedThinkingBudget: 3000,
                processingMode: 'weighted' as const,
                timestamp: Date.now(),
                processingTimeMs: 0
              },
              tokens: q.tokens
            }
          } catch {
            return null
          }
        })
        .filter((q): q is NonNullable<typeof q> => q !== null)

      if (queriesWithIntelligence.length > 0) {
        intelligenceMindMap = buildIntelligenceMindMap(queriesWithIntelligence)
      }
    }

    const responseData = {
      nodes: processedNodes,
      connections: relationships.map(r => ({
        from: r.topic_from,
        to: r.topic_to,
        type: r.relationship_type,
        strength: r.strength,
      })),
      // Backwards compatibility
      links: relationships.map(r => ({
        source: r.topic_from,
        target: r.topic_to,
        type: r.relationship_type,
        strength: r.strength,
      })),
      // Intelligence data
      intelligence: intelligenceMindMap,
      sefirotColors: SEFIROT_COLORS,
    }
    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Mind map data error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch mind map data' },
      { status: 500 }
    )
  }
}
