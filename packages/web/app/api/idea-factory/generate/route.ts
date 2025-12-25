import { NextRequest, NextResponse } from 'next/server'
import { getUserFromSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('session_token')?.value
    const user = token ? getUserFromSession(token) : null

    const { prompt } = await request.json()

    // Use AkhAI to generate ideas
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `Generate creative ideas for AI agent capabilities based on: "${prompt}". Return as a JSON array of strings.`
        }],
      }),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to generate ideas' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const content = data.content?.[0]?.text || '[]'
    
    // Parse ideas from response
    let ideas: string[] = []
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        ideas = JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      // Fallback: split by newlines
      ideas = content.split('\n').filter((line: string) => line.trim().length > 0)
    }

    return NextResponse.json({ ideas })
  } catch (error) {
    console.error('Idea generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate ideas' },
      { status: 500 }
    )
  }
}

