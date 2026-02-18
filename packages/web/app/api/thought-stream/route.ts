/**
 * THOUGHT STREAM SSE ENDPOINT
 *
 * Server-Sent Events endpoint for real-time pipeline metadata.
 * Clients connect with ?queryId= to receive stage-by-stage updates.
 *
 * Replays buffered events that fired before the client connected
 * (solves the timing race where simple-query finishes before SSE opens).
 *
 * @module thought-stream/route
 */

import { NextRequest } from 'next/server'
import type { ThoughtEvent } from '@/lib/thought-stream'
import { connections, getBufferedThoughts } from '@/lib/thought-stream'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const queryId = request.nextUrl.searchParams.get('queryId')

  if (!queryId) {
    return new Response('Missing queryId parameter', { status: 400 })
  }

  console.log(`[SSE] thought-stream GET for queryId=${queryId}`)

  const encoder = new TextEncoder()
  let isClosed = false

  const stream = new ReadableStream({
    start(controller) {
      // Register this controller
      if (!connections.has(queryId)) {
        connections.set(queryId, new Set())
      }
      connections.get(queryId)!.add(controller)

      const send = (event: ThoughtEvent) => {
        if (isClosed) return
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
        } catch {
          isClosed = true
        }
      }

      // Send initial connection event
      send({
        id: `${queryId}-init`,
        queryId,
        stage: 'received',
        timestamp: 0,
        data: 'connected',
      })

      // Replay buffered events that fired before we connected.
      // This solves the timing race: simple-query emits events during
      // processing, but SSE connects only after the response returns.
      const buffered = getBufferedThoughts(queryId)
      let hasTerminal = false
      for (const event of buffered) {
        send(event)
        if (event.stage === 'complete' || event.stage === 'error') {
          hasTerminal = true
        }
      }

      if (hasTerminal) {
        // All events already fired — close after short delay
        setTimeout(() => {
          isClosed = true
          try { controller.close() } catch { /* already closed */ }
          const controllers = connections.get(queryId)
          if (controllers) controllers.delete(controller)
        }, 500)
        return
      }

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        console.log(`[SSE] Client disconnected from query ${queryId}`)
        isClosed = true
        const controllers = connections.get(queryId)
        if (controllers) {
          controllers.delete(controller)
          if (controllers.size === 0) connections.delete(queryId)
        }
      })

      // Max timeout of 5 minutes
      setTimeout(() => {
        if (!isClosed) {
          console.warn(`[SSE] Timeout for query ${queryId}`)
          isClosed = true
          try { controller.close() } catch { /* already closed */ }
        }
      }, 300000)
    },
    cancel() {
      isClosed = true
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
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
