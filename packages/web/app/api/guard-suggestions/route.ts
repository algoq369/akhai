/**
 * Guard Suggestions API
 * Generates refined or pivot query suggestions when guard fails
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { originalQuery, guardResult, action, conversationContext, aiResponse, legendMode = false } = await request.json()

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

      systemPrompt = `You help users rephrase their question to be realistic. The user will ask these questions TO AN AI ASSISTANT.

User's original question: "${originalQuery}"
Problem: ${violations.length > 0 ? violations[0] : 'unrealistic claim'}

Generate 3 alternative questions the USER can ask the AI:

Example for "i have a project that can make 1 trillion in 1 month":
- "How much can a new project realistically make in its first month?"
- "What's typical monthly revenue for early-stage projects?"
- "How do I estimate realistic revenue for my project?"

RULES:
- Questions are FROM the user TO the AI (not the AI asking the user)
- Keep the same topic (project, money, timeframe)
- Replace impossible numbers with "realistic" or typical ranges
- Start with "How", "What", "Can you" - questions the user would ask
- Under 12 words each

Output exactly 3 questions, one per line, no numbers:`
    } else if (action === 'pivot') {
      systemPrompt = `You help users explore their topic from a different angle. The user will ask these questions TO AN AI ASSISTANT.

User's original question: "${originalQuery}"

Generate 3 alternative questions the USER can ask the AI about the SAME topic:

Example for "i have a project that can make 1 trillion in 1 month":
- "What makes a project financially successful?"
- "How do successful startups grow their revenue?"
- "What revenue growth is realistic for new projects?"

RULES:
- Questions are FROM the user TO the AI (not the AI asking the user)
- Stay on the same topic the user mentioned
- Focus on learning, understanding, realistic expectations
- Start with "How", "What", "Why" - questions seeking knowledge
- Under 12 words each

Output exactly 3 questions, one per line, no numbers:`
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Must be "refine" or "pivot"' },
        { status: 400 }
      )
    }

    // Select model based on legend mode
    const model = legendMode ? 'claude-3-opus-20240229' : 'claude-3-haiku-20240307'
    const maxTokens = legendMode ? 500 : 300
    
    // Call Claude API for suggestions
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
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

    // Parse suggestions (split by newlines, clean up formatting)
    const maxSuggestions = legendMode ? 5 : 3
    const suggestions = content
      .split('\n')
      .map((s: string) => s.trim())
      .map((s: string) => s.replace(/^[\d]+[\.\)]\s*/, '')) // Remove numbering like "1. " or "1) "
      .map((s: string) => s.replace(/^[-•]\s*/, '')) // Remove bullet points
      .map((s: string) => s.replace(/^["']|["']$/g, '')) // Remove quotes
      .filter((s: string) => s.length > 10 && s.includes('?')) // Must be a question > 10 chars
      .slice(0, maxSuggestions) // Take max suggestions based on mode

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
