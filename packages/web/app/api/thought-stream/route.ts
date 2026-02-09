/**
 * THOUGHT STREAM SSE ENDPOINT
 *
 * Server-Sent Events endpoint for real-time pipeline metadata.
 * Clients connect with ?queryId= to receive stage-by-stage updates.
 *
 * @module thought-stream/route
 */

import { NextRequest } from 'next/server'
import type { ThoughtEvent } from '@/lib/thought-stream'
import { connections } from '@/lib/thought-stream'

export async function GET(request: NextRequest) {
  const queryId = request.nextUrl.searchParams.get('queryId')

  if (!queryId) {
    return new Response('Missing queryId parameter', { status: 400 })
  }

  const stream = new ReadableStream({
    start(controller) {
      // Register this controller
      if (!connections.has(queryId)) {
        connections.set(queryId, new Set())
      }
      connections.get(queryId)!.add(controller)

      // Send initial connection event
      const initEvent: ThoughtEvent = {
        id: `${queryId}-init`,
        queryId,
        stage: 'received',
        timestamp: 0,
        data: 'connected',
      }
      controller.enqueue(
        new TextEncoder().encode(`data: ${JSON.stringify(initEvent)}\n\n`)
      )
    },
    cancel() {
      // Clean up when client disconnects
      const controllers = connections.get(queryId)
      if (controllers) {
        if (controllers.size <= 1) {
          connections.delete(queryId)
        }
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
