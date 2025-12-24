/**
 * Re-extract topics from recent queries
 * Useful when topics weren't extracted initially
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { getUserFromSession } from '@/lib/auth'
import { extractTopics, linkQueryToTopics, updateTopicRelationships } from '@/lib/side-canal'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('session_token')?.value
    const user = token ? getUserFromSession(token) : null
    const userId = user?.id || null

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get recent queries with responses
    const queries = db.prepare(`
      SELECT id, query, result
      FROM queries
      WHERE user_id = ? 
        AND status = 'complete'
        AND result IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 20
    `).all(userId) as Array<{
      id: string
      query: string
      result: string | null
    }>

    let extractedCount = 0

    for (const q of queries) {
      try {
        if (!q.result) continue
        
        const resultData = JSON.parse(q.result)
        // Handle both response formats: {response: ...} or {finalAnswer: ...}
        const response = resultData?.response || resultData?.finalAnswer || ''

        if (!response || typeof response !== 'string') continue

        // Extract topics
        const topics = await extractTopics(q.query, response, userId)

        if (topics.length > 0) {
          const topicIds = topics.map(t => t.id)
          linkQueryToTopics(q.id, topicIds)
          updateTopicRelationships(topicIds, userId)
          extractedCount += topics.length
        }
      } catch (error) {
        console.error(`Failed to extract topics for query ${q.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      queriesProcessed: queries.length,
      topicsExtracted: extractedCount,
    })
  } catch (error) {
    console.error('Re-extract topics error:', error)
    return NextResponse.json(
      { error: 'Failed to re-extract topics' },
      { status: 500 }
    )
  }
}

