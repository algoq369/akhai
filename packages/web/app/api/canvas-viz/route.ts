/**
 * Canvas Visualization API - Deterministic JSON output for diagram/chart generation
 * Lower token limit and temperature:0 for reliable structured output
 */

import { NextRequest, NextResponse } from 'next/server'
import { callProvider } from '@/lib/multi-provider-api'

export async function POST(request: NextRequest) {
  try {
    const { query, response, type } = await request.json()

    const validTypes = ['diagram', 'chart', 'table', 'timeline', 'radar']
    if (!query || !type || !validTypes.includes(type)) {
      return NextResponse.json({ error: `query, response, and type (${validTypes.join('|')}) are required` }, { status: 400 })
    }

    const prompts: Record<string, string> = {
      diagram: 'You are a JSON generator. Output ONLY valid JSON, no markdown, no explanation. Generate a diagram from the user content.\nFormat: { "title": "short title", "type": "flowchart|mindmap|sequence", "nodes": [{"id":"n1","label":"text","color":"#hex"}], "edges": [{"from":"n1","to":"n2","label":"optional"}] }',
      chart: 'You are a JSON generator. Output ONLY valid JSON, no markdown, no explanation. Generate chart data from the user content.\nFormat: { "title": "chart title", "xLabel": "x axis", "yLabel": "y axis", "data": [{"label":"item","value":number,"color":"#hex"}] }\nIf no numeric data exists, estimate reasonable proportional values.',
      table: 'You are a JSON generator. Output ONLY valid JSON, no markdown, no explanation. Generate a comparison table from the user content.\nFormat: { "title": "table title", "columns": ["Col1","Col2","Col3"], "rows": [{"col1":"val","col2":"val","col3":"val"}] }\nExtract key entities and their attributes. 3-6 rows, 2-4 columns.',
      timeline: 'You are a JSON generator. Output ONLY valid JSON, no markdown, no explanation. Generate a timeline from the user content.\nFormat: { "title": "timeline title", "events": [{"label":"event name","description":"brief","color":"#hex"}] }\nExtract sequential steps or chronological events. 3-8 events.',
      radar: 'You are a JSON generator. Output ONLY valid JSON, no markdown, no explanation. Generate radar chart data from the user content.\nFormat: { "title": "radar title", "axes": [{"label":"dimension","value":0-100}] }\nExtract 3-8 dimensions with estimated scores. Values must be 0-100.',
    }
    const systemPrompt = prompts[type]

    const userContent = `Query: ${query}\nResponse: ${(response || '').slice(0, 800)}`

    const vizRequest = {
      messages: [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: userContent },
      ],
      model: 'claude-opus-4-6',
      maxTokens: 300,
      temperature: 0,
    }

    let result
    try {
      result = await callProvider('anthropic', vizRequest)
    } catch (err: any) {
      if (err.message?.includes('credit balance') || err.message?.includes('402') || err.message?.includes('400')) {
        console.log('[CanvasViz] Anthropic credits depleted, falling back to OpenRouter')
        // OpenRouter free models: merge system into user prompt, use temperature 0.3
        result = await callProvider('openrouter', {
          ...vizRequest,
          messages: [
            { role: 'user' as const, content: `${systemPrompt}\n\n${userContent}` },
          ],
          temperature: 0.3,
          maxTokens: 500,
        })
      } else {
        throw err
      }
    }

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
