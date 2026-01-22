import { NextRequest, NextResponse } from 'next/server'
import { generateQlipothReport, formatJSONAnnotation } from '@/lib/qlipoth'
import type { TreeConfiguration } from '@/lib/tree-configuration'

export const runtime = 'nodejs'

/**
 * POST /api/tree-config/test
 *
 * Run a test query with specified tree configuration.
 * Returns response, metrics, and gnostic annotation.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const { query, weights, processingMode = 'weighted' } = body

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    // Build tree config override
    const treeConfigOverride: Partial<TreeConfiguration> = {
      sephiroth_weights: weights || {},
      processing_mode: processingMode
    }

    // Call the simple-query API internally
    const queryResponse = await fetch(new URL('/api/simple-query', request.url).toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify({
        query,
        treeConfigOverride
      })
    })

    if (!queryResponse.ok) {
      const errorData = await queryResponse.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.error || 'Query failed' },
        { status: queryResponse.status }
      )
    }

    const data = await queryResponse.json()

    // Generate Qlipoth report
    const qlipothReport = generateQlipothReport(
      data.gnostic?.sefirotProcessing || null,
      data.guardResult || null,
      {
        id: 0,
        user_id: null,
        name: 'Test',
        description: '',
        is_active: false,
        sephiroth_weights: weights || {},
        qliphoth_suppression: {},
        pillar_balance: { left: 0.33, middle: 0.34, right: 0.33 },
        created_at: Date.now(),
        updated_at: Date.now()
      },
      data.response
    )

    const processingTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      query,
      response: data.response,
      methodology: data.methodology || 'direct',
      metrics: {
        tokens: data.metrics?.tokens || 0,
        cost: data.metrics?.cost || 0,
        latency: processingTime
      },
      gnostic: data.gnostic,
      guardResult: data.guardResult,
      qlipothReport,
      qlipothAnnotation: formatJSONAnnotation(qlipothReport)
    })
  } catch (error) {
    console.error('Tree config test error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Test failed' },
      { status: 500 }
    )
  }
}
