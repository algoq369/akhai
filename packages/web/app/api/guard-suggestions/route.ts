/**
 * Guard Suggestions API
 * Generates refined or pivot query suggestions when guard fails
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { originalQuery, guardResult, action } = await request.json()

    if (!originalQuery || !action) {
      return NextResponse.json(
        { error: 'originalQuery and action are required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    // Build system prompt based on action type
    let systemPrompt = ''
    if (action === 'refine') {
      const violations = guardResult?.sanityViolations || []
      const issues = guardResult?.issues || []

      systemPrompt = `You are a query refinement assistant. The user's query triggered reality check violations:

Violations:
${violations.map((v: string) => `- ${v}`).join('\n')}

Issues detected: ${issues.join(', ')}

Generate 3 refined versions of the query that:
1. Address the implausibility/impossibility concerns
2. Ask for realistic information instead
3. Are clear and specific
4. Each should be a standalone question (not numbered)

Original query: "${originalQuery}"

Respond with ONLY 3 refined questions, one per line, no numbering, no explanations.`
    } else if (action === 'pivot') {
      systemPrompt = `You are a query pivot assistant. The user's query was flagged for reality check issues.

Original query: "${originalQuery}"

Generate 3 alternative approaches to this topic that:
1. Take a different angle or perspective
2. Ask about related but more realistic aspects
3. Focus on learning/understanding rather than impossible claims
4. Each should be a standalone question (not numbered)

Respond with ONLY 3 alternative questions, one per line, no numbering, no explanations.`
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Must be "refine" or "pivot"' },
        { status: 400 }
      )
    }

    // Call Claude Haiku for fast, cheap suggestions
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 300,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: 'Generate the 3 questions now.'
          }
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Anthropic API error:', errorText)
      return NextResponse.json(
        { error: 'Failed to generate suggestions' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const content = data.content?.[0]?.text || ''

    // Parse suggestions (split by newlines, filter empty)
    const suggestions = content
      .split('\n')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0 && !s.match(/^\d+\./)) // Remove numbered lines
      .slice(0, 3) // Take max 3

    // Ensure we have at least some suggestions
    if (suggestions.length === 0) {
      return NextResponse.json({
        suggestions: [
          'Could you rephrase your question more specifically?',
          'What specific aspect would you like to know more about?',
          'Can you provide more context for your question?'
        ]
      })
    }

    return NextResponse.json({
      suggestions,
    })
  } catch (error) {
    console.error('Guard suggestions error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
