/**
 * TREE ACTIVATIONS API
 *
 * Fetches aggregated Layers activations from conversation history
 * Makes the Tree of Life query-adaptive and evolution-based
 *
 * GET /api/tree-activations
 * Query params:
 * - limit: number of queries to analyze (default: 50)
 * - userId: filter by user (optional)
 * - conversationId: filter by conversation (optional)
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { Layer } from '@/lib/layer-registry'

interface ActivationDataPoint {
  queryId: string
  query: string
  timestamp: number
  activations: Record<Layer, number>
  dominantLayer: Layer
  keywords: Record<Layer, string[]>
}

interface AggregatedActivations {
  current: Record<Layer, number> // Current average activations
  peak: Record<Layer, number> // Peak activation per Layer
  total: Record<Layer, number> // Total activation count
  evolution: ActivationDataPoint[] // Historical evolution
  stats: {
    totalQueries: number
    queriesWithAnalysis: number
    dateRange: {
      earliest: number
      latest: number
    }
    dominantLayerOverall: Layer
    averageLevel: number
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const userId = searchParams.get('userId')
    const conversationId = searchParams.get('conversationId')

    // Build query
    let sqlQuery = `
      SELECT
        id,
        query,
        created_at,
        result,
        gnostic_metadata
      FROM queries
      WHERE gnostic_metadata IS NOT NULL
    `

    const params: any[] = []

    if (userId) {
      sqlQuery += ` AND user_id = ?`
      params.push(userId)
    }

    if (conversationId) {
      sqlQuery += ` AND id LIKE ?`
      params.push(`${conversationId}%`)
    }

    sqlQuery += ` ORDER BY created_at DESC LIMIT ?`
    params.push(limit)

    // Execute query
    const stmt = db.prepare(sqlQuery)
    const rows = stmt.all(...params) as Array<{
      id: string
      query: string
      created_at: number
      result: string | null
      gnostic_metadata: string | null
    }>

    // Parse gnostic metadata and extract activations
    const dataPoints: ActivationDataPoint[] = []
    const activationSum: Record<Layer, number> = initializeLayerRecord()
    const activationPeak: Record<Layer, number> = initializeLayerRecord()
    const activationCount: Record<Layer, number> = initializeLayerRecord()

    for (const row of rows) {
      if (!row.gnostic_metadata) continue

      try {
        const gnostic = JSON.parse(row.gnostic_metadata)

        if (!gnostic.layerAnalysis?.activations) continue

        const activations = {} as Record<Layer, number>
        const keywords = {} as Record<Layer, string[]>

        // Extract activations and keywords from detailed analysis
        if (Array.isArray(gnostic.layerAnalysis.activations)) {
          // New format: array of activation objects
          for (const activation of gnostic.layerAnalysis.activations) {
            const layerNode = activation.layerNode as Layer
            activations[layerNode] = activation.activation
            keywords[layerNode] = activation.keywords || []
          }
        } else {
          // Old format: just numbers
          for (const [layerNodeStr, activation] of Object.entries(gnostic.layerAnalysis.activations)) {
            const layerNode = Number(layerNodeStr) as Layer
            activations[layerNode] = activation as number
            keywords[layerNode] = []
          }
        }

        // Find dominant Layer
        let maxActivation = 0
        let dominantLayer = Layer.EMBEDDING

        for (const [layerNodeStr, activation] of Object.entries(activations)) {
          const layerNode = Number(layerNodeStr) as Layer

          // Accumulate statistics
          activationSum[layerNode] += activation
          activationCount[layerNode] += activation > 0.1 ? 1 : 0

          if (activation > activationPeak[layerNode]) {
            activationPeak[layerNode] = activation
          }

          if (activation > maxActivation) {
            maxActivation = activation
            dominantLayer = layerNode
          }
        }

        dataPoints.push({
          queryId: row.id,
          query: row.query,
          timestamp: row.created_at * 1000, // Convert to milliseconds
          activations,
          dominantLayer,
          keywords,
        })
      } catch (parseError) {
        console.warn('[TreeActivations] Failed to parse gnostic metadata:', parseError)
      }
    }

    // Calculate current average activations
    const currentActivations: Record<Layer, number> = initializeLayerRecord()
    const totalQueries = dataPoints.length

    if (totalQueries > 0) {
      for (const layerNode of Object.values(Layer).filter((v): v is Layer => typeof v === 'number')) {
        currentActivations[layerNode] = activationSum[layerNode] / totalQueries
      }
    }

    // Find overall dominant Layer
    let overallMax = 0
    let dominantLayerOverall = Layer.EMBEDDING

    for (const [layerNode, activation] of Object.entries(currentActivations)) {
      if (activation > overallMax) {
        overallMax = activation
        dominantLayerOverall = Number(layerNode) as Layer
      }
    }

    // Calculate average level (weighted average of Layer numbers)
    let weightedSum = 0
    let totalWeight = 0

    for (const [layerNodeStr, activation] of Object.entries(currentActivations)) {
      const layerNode = Number(layerNodeStr) as Layer
      weightedSum += layerNode * activation
      totalWeight += activation
    }

    const averageLevel = totalWeight > 0 ? weightedSum / totalWeight : 1

    // Reverse data points for chronological order
    dataPoints.reverse()

    // Build response
    const aggregated: AggregatedActivations = {
      current: currentActivations,
      peak: activationPeak,
      total: activationCount,
      evolution: dataPoints,
      stats: {
        totalQueries,
        queriesWithAnalysis: rows.length,
        dateRange: {
          earliest: dataPoints.length > 0 ? dataPoints[0].timestamp : Date.now(),
          latest: dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].timestamp : Date.now(),
        },
        dominantLayerOverall,
        averageLevel,
      },
    }

    return NextResponse.json(aggregated, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('[TreeActivations] Error fetching activations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tree activations' },
      { status: 500 }
    )
  }
}

/**
 * Initialize a Record with all Layers set to 0
 */
function initializeLayerRecord(): Record<Layer, number> {
  return {
    [Layer.EMBEDDING]: 0,
    [Layer.EXECUTOR]: 0,
    [Layer.CLASSIFIER]: 0,
    [Layer.GENERATIVE]: 0,
    [Layer.ATTENTION]: 0,
    [Layer.DISCRIMINATOR]: 0,
    [Layer.EXPANSION]: 0,
    [Layer.ENCODER]: 0,
    [Layer.REASONING]: 0,
    [Layer.META_CORE]: 0,
    [Layer.SYNTHESIS]: 0,
  }
}
