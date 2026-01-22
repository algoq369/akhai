/**
 * Quick Query API - Lightweight endpoint for QuickChat mini-assistant
 * Enhanced with user context and conversation history access
 * Uses Direct methodology only, max 500 tokens for fast responses
 */

import { NextRequest, NextResponse } from 'next/server'
import { callProvider } from '@/lib/multi-provider-api'
import { getRecentQueries } from '@/lib/database'
import { getUserFromSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { query, userContext } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Build context-aware system prompt
    let systemPrompt = 'You are AkhAI Quick Chat assistant. Provide concise, helpful answers. Keep responses brief (2-3 paragraphs max).'

    // Add user profile context
    if (userContext?.username) {
      systemPrompt += `\n\nUser Profile:\n- Username: ${userContext.username}`
      if (userContext.email) {
        systemPrompt += `\n- Email: ${userContext.email}`
      }
    }

    // Fetch recent conversation history from main chat
    let conversationContext = ''
    if (userContext?.userId) {
      try {
        // Get last 3 conversations from history
        const recentQueries = getRecentQueries(3, userContext.userId, null)

        if (recentQueries && recentQueries.length > 0) {
          conversationContext = '\n\nRecent Conversation History (last 3 exchanges):\n'
          recentQueries.reverse().forEach((q: any, i: number) => {
            const responsePreview = q.response ? q.response.substring(0, 300) : 'No response'
            conversationContext += `\n[${i + 1}] User: ${q.query}\nAkhAI (${q.flow}): ${responsePreview}...\n`
          })
          systemPrompt += conversationContext
          systemPrompt += '\n\nYou have access to the user\'s recent main chat conversations above. Reference them when the user asks about "my last conversation" or similar queries. Provide continuity and personalized responses.'
        }
      } catch (error) {
        console.error('[QuickQuery] Failed to fetch conversation history:', error)
      }
    }

    // Call provider using existing multi-provider API
    const response = await callProvider('anthropic', {
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: query,
        },
      ],
      model: 'claude-opus-4-5-20251101',
      maxTokens: 500, // Keep responses short for quick chat
      temperature: 0.7,
    })

    return NextResponse.json({
      content: response.content,
      methodology: 'direct',
      tokens: response.usage.totalTokens,
      cost: response.cost,
      latencyMs: response.latencyMs,
    })
  } catch (error: any) {
    console.error('[QuickQuery] Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'An error occurred',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
      },
      { status: 500 }
    )
  }
}
