/**
 * Guard Suggestions API
 * Generates refined or pivot query suggestions when guard fails
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { originalQuery, guardResult, action, conversationContext, aiResponse } = await request.json()

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

    // Build conversation context string
    const contextStr = conversationContext && conversationContext.length > 0
      ? `\nConversation context:\n${conversationContext.map((m: {role: string, content: string}) => 
          `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content.substring(0, 200)}${m.content.length > 200 ? '...' : ''}`
        ).join('\n')}\n`
      : ''

    // Build system prompt based on action type
    let systemPrompt = ''
    if (action === 'refine') {
      const violations = guardResult?.sanityViolations || []
      const issues = guardResult?.issues || []

      systemPrompt = `You are a query refinement assistant helping a user rephrase their question to be more realistic.
${contextStr}
User's original message: "${originalQuery}"

This was flagged because: ${violations.length > 0 ? violations.join(', ') : issues.join(', ') || 'unrealistic claims'}

Generate exactly 3 refined questions, ORDERED FROM MOST TO LEAST LOGICAL:

FIRST suggestion (most direct fix): Rephrase the user's exact question but with realistic parameters
SECOND suggestion: Ask about the underlying topic with verifiable facts
THIRD suggestion: Request analysis or historical data about the same subject

Rules:
- All 3 MUST be about the same topic the user asked about (e.g., if they asked about their project making money, all suggestions should be about their project or business revenue)
- Replace unrealistic numbers with "realistic" or ask "what would be realistic"
- Keep the same subject matter, just make it answerable
- Be concise (under 20 words each)

Output ONLY 3 questions, one per line, no numbers, no explanations.`
    } else if (action === 'pivot') {
      systemPrompt = `You are a query pivot assistant helping a user explore their topic from a different angle.
${contextStr}
User's original message: "${originalQuery}"

Generate exactly 3 alternative questions about the SAME TOPIC, ORDERED FROM MOST TO LEAST RELEVANT:

FIRST suggestion (closest pivot): A very related question about the same subject from a factual angle
SECOND suggestion: Ask about what makes this topic realistic or achievable
THIRD suggestion: Request historical examples or case studies about the same subject

Rules:
- All 3 MUST relate to what the user was asking about
- Focus on facts, analysis, or learning instead of speculation
- If they asked about making money, pivot to realistic business questions
- If they asked about price predictions, pivot to analysis or historical data
- Be concise (under 20 words each)

Output ONLY 3 questions, one per line, no numbers, no explanations.`
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
