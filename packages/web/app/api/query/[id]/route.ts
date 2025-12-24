import { NextRequest, NextResponse } from 'next/server'
import { queries } from '@/lib/query-store'
import { getQuery } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: queryId } = await params
  console.log(`[API GET] Fetching query: ${queryId}`)

  try {
    // First check in-memory store
    const memoryQuery = queries.get(queryId)

    if (memoryQuery) {
      console.log(`[API GET] Found query in memory:`, memoryQuery.status)
      console.log(`[API DEBUG] Full memoryQuery:`, JSON.stringify(memoryQuery, null, 2))
      console.log(`[API DEBUG] result.finalAnswer:`, memoryQuery.result?.finalAnswer)

      // Since tokens/cost are only in database, we need to fetch them
      const dbQuery = await getQuery(queryId)

      return NextResponse.json({
        id: queryId,
        query: memoryQuery.query,
        methodology: memoryQuery.flow,
        status: memoryQuery.status,
        response: memoryQuery.result?.finalAnswer || null,
        finalDecision: memoryQuery.result?.finalAnswer || null,
        events: memoryQuery.events || [],
        metrics: {
          tokens: dbQuery?.tokens_used || 0,
          latency: memoryQuery.result?.duration ? memoryQuery.result.duration * 1000 : 0,
          cost: dbQuery?.cost || 0,
        },
        createdAt: dbQuery?.created_at,
        error: memoryQuery.error
      })
    }

    // Fallback to database
    console.log(`[API GET] Query not in memory, checking database...`)
    const dbQuery = await getQuery(queryId) as any

    if (dbQuery) {
      console.log(`[API GET] Found query in database`)

      // Parse the result JSON string
      let parsedResult = null
      try {
        if (dbQuery.result) {
          parsedResult = JSON.parse(dbQuery.result)
        }
      } catch (e) {
        console.error('[API GET] Failed to parse result JSON:', e)
      }

      console.log(`[API DEBUG] Parsed result:`, parsedResult)

      return NextResponse.json({
        id: dbQuery.id,
        query: dbQuery.query,
        methodology: dbQuery.flow,
        status: dbQuery.status,
        response: parsedResult?.finalAnswer || null,
        finalDecision: parsedResult?.finalAnswer || null,
        metrics: {
          tokens: dbQuery.tokens_used || 0,
          latency: parsedResult?.duration ? parsedResult.duration * 1000 : 0,
          cost: dbQuery.cost || 0,
        },
        createdAt: dbQuery.created_at
      })
    }

    console.log(`[API GET] Query not found: ${queryId}`)
    return NextResponse.json(
      { error: 'Query not found', id: queryId },
      { status: 404 }
    )

  } catch (error) {
    console.error('[API GET] Error fetching query:', error)
    return NextResponse.json(
      { error: 'Failed to fetch query', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
