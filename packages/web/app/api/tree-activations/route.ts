/**
 * TREE ACTIVATIONS API
 *
 * Fetches aggregated Sefirot activations from conversation history
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
import { Sefirah } from '@/lib/ascent-tracker'

interface ActivationDataPoint {
  queryId: string
  query: string
  timestamp: number
  activations: Record<Sefirah, number>
  dominantSefirah: Sefirah
  keywords: Record<Sefirah, string[]>
}

interface AggregatedActivations {
  current: Record<Sefirah, number> // Current average activations
  peak: Record<Sefirah, number> // Peak activation per Sefirah
  total: Record<Sefirah, number> // Total activation count
  evolution: ActivationDataPoint[] // Historical evolution
  stats: {
    totalQueries: number
    queriesWithGnostic: number
    dateRange: {
      earliest: number
      latest: number
    }
    dominantSefirahOverall: Sefirah
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
    const activationSum: Record<Sefirah, number> = initializeSefirotRecord()
    const activationPeak: Record<Sefirah, number> = initializeSefirotRecord()
    const activationCount: Record<Sefirah, number> = initializeSefirotRecord()

    for (const row of rows) {
      if (!row.gnostic_metadata) continue

      try {
        const gnostic = JSON.parse(row.gnostic_metadata)

        if (!gnostic.sephirothAnalysis?.activations) continue

        const activations = {} as Record<Sefirah, number>
        const keywords = {} as Record<Sefirah, string[]>

        // Extract activations and keywords from detailed analysis
        if (Array.isArray(gnostic.sephirothAnalysis.activations)) {
          // New format: array of activation objects
          for (const activation of gnostic.sephirothAnalysis.activations) {
            const sefirah = activation.sefirah as Sefirah
            activations[sefirah] = activation.activation
            keywords[sefirah] = activation.keywords || []
          }
        } else {
          // Old format: just numbers
          for (const [sefirahStr, activation] of Object.entries(gnostic.sephirothAnalysis.activations)) {
            const sefirah = Number(sefirahStr) as Sefirah
            activations[sefirah] = activation as number
            keywords[sefirah] = []
          }
        }

        // Find dominant Sefirah
        let maxActivation = 0
        let dominantSefirah = Sefirah.MALKUTH

        for (const [sefirahStr, activation] of Object.entries(activations)) {
          const sefirah = Number(sefirahStr) as Sefirah

          // Accumulate statistics
          activationSum[sefirah] += activation
          activationCount[sefirah] += activation > 0.1 ? 1 : 0

          if (activation > activationPeak[sefirah]) {
            activationPeak[sefirah] = activation
          }

          if (activation > maxActivation) {
            maxActivation = activation
            dominantSefirah = sefirah
          }
        }

        dataPoints.push({
          queryId: row.id,
          query: row.query,
          timestamp: row.created_at * 1000, // Convert to milliseconds
          activations,
          dominantSefirah,
          keywords,
        })
      } catch (parseError) {
        console.warn('[TreeActivations] Failed to parse gnostic metadata:', parseError)
      }
    }

    // Calculate current average activations
    const currentActivations: Record<Sefirah, number> = initializeSefirotRecord()
    const totalQueries = dataPoints.length

    if (totalQueries > 0) {
      for (const sefirah of Object.values(Sefirah).filter((v): v is Sefirah => typeof v === 'number')) {
        currentActivations[sefirah] = activationSum[sefirah] / totalQueries
      }
    }

    // Find overall dominant Sefirah
    let overallMax = 0
    let dominantSefirahOverall = Sefirah.MALKUTH

    for (const [sefirah, activation] of Object.entries(currentActivations)) {
      if (activation > overallMax) {
        overallMax = activation
        dominantSefirahOverall = Number(sefirah) as Sefirah
      }
    }

    // Calculate average level (weighted average of Sefirah numbers)
    let weightedSum = 0
    let totalWeight = 0

    for (const [sefirahStr, activation] of Object.entries(currentActivations)) {
      const sefirah = Number(sefirahStr) as Sefirah
      weightedSum += sefirah * activation
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
        queriesWithGnostic: rows.length,
        dateRange: {
          earliest: dataPoints.length > 0 ? dataPoints[0].timestamp : Date.now(),
          latest: dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].timestamp : Date.now(),
        },
        dominantSefirahOverall,
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
 * Initialize a Record with all Sefirot set to 0
 */
function initializeSefirotRecord(): Record<Sefirah, number> {
  return {
    [Sefirah.MALKUTH]: 0,
    [Sefirah.YESOD]: 0,
    [Sefirah.HOD]: 0,
    [Sefirah.NETZACH]: 0,
    [Sefirah.TIFERET]: 0,
    [Sefirah.GEVURAH]: 0,
    [Sefirah.CHESED]: 0,
    [Sefirah.BINAH]: 0,
    [Sefirah.CHOKMAH]: 0,
    [Sefirah.KETHER]: 0,
    [Sefirah.DAAT]: 0,
  }
}
