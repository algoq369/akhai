import { NextRequest, NextResponse } from 'next/server'
import { getUserFromSession } from '@/lib/auth'
import { generateSynopsis } from '@/lib/side-canal'

/**
 * POST /api/side-canal/synopsis
 * Generate synopsis for a specific topic
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('session_token')?.value
    const user = token ? getUserFromSession(token) : null
    const userId = user?.id || null

    const { topicId, queryIds } = await request.json()

    if (!topicId || !queryIds || !Array.isArray(queryIds)) {
      return NextResponse.json(
        { error: 'topicId and queryIds (array) are required' },
        { status: 400 }
      )
    }

    // Generate synopsis for this topic
    const synopsis = await generateSynopsis(topicId, queryIds, userId)

    return NextResponse.json({ synopsis })
  } catch (error) {
    console.error('[Side Canal Synopsis] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate synopsis' },
      { status: 500 }
    )
  }
}
