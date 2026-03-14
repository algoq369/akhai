/**
 * Canvas Visualization API - Deterministic JSON output for diagram/chart generation
 * Lower token limit and temperature:0 for reliable structured output
 */

import { NextRequest, NextResponse } from 'next/server'
import { callProvider } from '@/lib/multi-provider-api'

export async function POST(request: NextRequest) {
  try {
    const { query, response, type } = await request.json()

    if (!query || !type || !['diagram', 'chart'].includes(type)) {
      return NextResponse.json({ error: 'query, response, and type (diagram|chart) are required' }, { status: 400 })
    }

    const systemPrompt = type === 'diagram'
      ? 'You are a JSON generator. Output ONLY valid JSON, no markdown, no explanation. Generate a diagram from the user content.\nFormat: { "title": "short title", "type": "flowchart|mindmap|sequence", "nodes": [{"id":"n1","label":"text","color":"#hex"}], "edges": [{"from":"n1","to":"n2","label":"optional"}] }'
      : 'You are a JSON generator. Output ONLY valid JSON, no markdown, no explanation. Generate chart data from the user content.\nFormat: { "title": "chart title", "xLabel": "x axis", "yLabel": "y axis", "data": [{"label":"item","value":number,"color":"#hex"}] }\nIf no numeric data exists, estimate reasonable proportional values.'

    const userContent = `Query: ${query}\nResponse: ${(response || '').slice(0, 800)}`

    const result = await callProvider('anthropic', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      model: 'claude-opus-4-6',
      maxTokens: 300,
      temperature: 0,
    })

    const text = result.content || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return NextResponse.json({ viz: JSON.parse(jsonMatch[0]) })
    }

    return NextResponse.json({ error: 'Failed to parse JSON from response', raw: text }, { status: 422 })
  } catch (error: any) {
    console.error('[CanvasViz] Error:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    )
  }
}
