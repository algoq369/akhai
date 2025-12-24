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

      systemPrompt = `You are a query refinement assistant. The user's message triggered reality check violations.
${contextStr}
User's message that triggered the warning: "${originalQuery}"

AI response that was flagged: "${aiResponse?.substring(0, 300) || 'N/A'}..."

Violations detected:
${violations.length > 0 ? violations.map((v: string) => `- ${v}`).join('\n') : '- Hype/unrealistic claims detected'}

Issues: ${issues.join(', ') || 'hype'}

Generate 3 refined questions that:
1. Stay on the SAME TOPIC the user was discussing
2. Ask for realistic, verifiable information
3. Are specific and answerable
4. Relate directly to the conversation context

IMPORTANT: Your suggestions MUST be about the same subject the user was asking about. Do NOT suggest unrelated topics.

Respond with ONLY 3 refined questions, one per line, no numbering, no explanations.`
    } else if (action === 'pivot') {
      systemPrompt = `You are a query pivot assistant. The user's message was flagged for reality check issues.
${contextStr}
User's message: "${originalQuery}"

Generate 3 alternative approaches that:
1. Explore the SAME TOPIC from a different, more grounded angle
2. Ask about realistic aspects of what the user is interested in
3. Focus on facts, history, or analysis rather than speculation
4. Stay relevant to the conversation subject

IMPORTANT: Your suggestions MUST relate to what the user was actually discussing. Do NOT suggest unrelated topics.

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
