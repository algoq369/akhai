import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface TopicSuggestionsRequest {
  topicId: string
  topicName: string
  topicDescription?: string
  category?: string
  relatedTopics: string[]
  queryCount?: number
  lastQueries?: string[]
}

interface TopicSuggestionsResponse {
  suggestions: {
    deeperQuestions: Array<{ question: string; reasoning: string }>
    connections: Array<{ targetTopic: string; relationship: string }>
    researchDirections: Array<{ direction: string; why: string }>
    practicalActions: Array<{ action: string; outcome: string }>
  }
  insights: string[]
  confidence: number
}

/**
 * POST /api/mindmap/topic-suggestions
 *
 * Generate AI-powered suggestions for a topic using Claude Opus 4.5
 * Returns:
 * - 1 deeper question
 * - 1 most pertinent connection
 * - 1 research direction
 * - 1 practical action
 * - 3-5 key insights
 */
export async function POST(request: NextRequest) {
  try {
    const body: TopicSuggestionsRequest = await request.json()

    const { topicName, topicDescription, category, relatedTopics, queryCount, lastQueries } = body

    // Construct AI prompt
    const systemPrompt = `You are analyzing a knowledge graph topic for a research system.
Generate exactly 4 actionable suggestions to help the user explore this topic more deeply.

Your response must be ONLY valid JSON matching this exact structure:
{
  "suggestions": {
    "deeperQuestions": [
      { "question": "...", "reasoning": "..." }
    ],
    "connections": [
      { "targetTopic": "...", "relationship": "..." }
    ],
    "researchDirections": [
      { "direction": "...", "why": "..." }
    ],
    "practicalActions": [
      { "action": "...", "outcome": "..." }
    ]
  },
  "insights": ["...", "...", "..."],
  "confidence": 0.85
}

Requirements:
- deeperQuestions: 1 most insightful question exploring an unexplored aspect, assumption, or deeper layer
- connections: 1 most pertinent topic to connect with, with clear relationship description
- researchDirections: 1 most promising direction for further investigation
- practicalActions: 1 most valuable concrete action the user can take to apply or experiment with this knowledge
- insights: 3-5 key insights about this topic (concise, valuable observations)
- confidence: Your confidence in these suggestions (0.0-1.0)

Focus on intellectual depth, practical value, and genuine curiosity. Choose only the BEST suggestion for each category.`

    const userPrompt = `Topic: ${topicName}
${topicDescription ? `Description: ${topicDescription}` : ''}
${category ? `Category: ${category}` : ''}
${relatedTopics.length > 0 ? `Related Topics: ${relatedTopics.join(', ')}` : 'Related Topics: None yet'}
${queryCount !== undefined ? `Query Count: ${queryCount}` : ''}
${lastQueries && lastQueries.length > 0 ? `Recent Queries: ${lastQueries.join('; ')}` : ''}

Generate suggestions that help explore this topic more deeply.`

    // Call Claude Opus 4.5
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 4096,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    // Extract text content
    const textContent = message.content.find((block) => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI')
    }

    // Parse JSON response
    let parsedResponse: TopicSuggestionsResponse
    try {
      // Try to extract JSON from markdown code blocks if present
      let jsonText = textContent.text.trim()
      const jsonMatch = jsonText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/)
      if (jsonMatch) {
        jsonText = jsonMatch[1]
      }

      parsedResponse = JSON.parse(jsonText)
    } catch (parseError) {
      console.error('Failed to parse AI response:', textContent.text)
      throw new Error('Invalid JSON response from AI')
    }

    // Validate structure
    if (
      !parsedResponse.suggestions ||
      !Array.isArray(parsedResponse.suggestions.deeperQuestions) ||
      !Array.isArray(parsedResponse.suggestions.connections) ||
      !Array.isArray(parsedResponse.suggestions.researchDirections) ||
      !Array.isArray(parsedResponse.suggestions.practicalActions) ||
      !Array.isArray(parsedResponse.insights)
    ) {
      throw new Error('Invalid response structure from AI')
    }

    // Validate counts
    if (
      parsedResponse.suggestions.deeperQuestions.length !== 1 ||
      parsedResponse.suggestions.connections.length !== 1 ||
      parsedResponse.suggestions.researchDirections.length !== 1 ||
      parsedResponse.suggestions.practicalActions.length !== 1
    ) {
      console.warn('AI returned incorrect suggestion counts, adjusting...')
      // Trim to correct sizes (take first item only)
      parsedResponse.suggestions.deeperQuestions = parsedResponse.suggestions.deeperQuestions.slice(0, 1)
      parsedResponse.suggestions.connections = parsedResponse.suggestions.connections.slice(0, 1)
      parsedResponse.suggestions.researchDirections = parsedResponse.suggestions.researchDirections.slice(0, 1)
      parsedResponse.suggestions.practicalActions = parsedResponse.suggestions.practicalActions.slice(0, 1)
    }

    return NextResponse.json(parsedResponse)
  } catch (error) {
    console.error('Topic suggestions API error:', error)

    // Return fallback suggestions
    return NextResponse.json(
      {
        suggestions: {
          deeperQuestions: [
            {
              question: 'What are the fundamental principles underlying this topic?',
              reasoning: 'Understanding core principles helps build solid foundations',
            },
          ],
          connections: [
            {
              targetTopic: 'Related Concepts',
              relationship: 'Explore related concepts to understand context and applications',
            },
          ],
          researchDirections: [
            {
              direction: 'Historical development and evolution',
              why: 'Understanding history reveals why current approaches exist',
            },
          ],
          practicalActions: [
            {
              action: 'Create a concept map of key ideas',
              outcome: 'Visual organization helps identify gaps and connections',
            },
          ],
        },
        insights: [
          'This topic has multiple layers of complexity worth exploring',
          'Building connections to related topics enhances understanding',
          'Practical experimentation often reveals insights theory cannot',
        ],
        confidence: 0.5,
      },
      { status: 500 }
    )
  }
}
