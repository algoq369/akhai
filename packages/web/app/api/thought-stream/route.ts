/**
 * Thought Stream API - SSE endpoint for pipeline events
 *
 * Emits real-time pipeline stage events during query processing.
 * Connect with: EventSource('/api/thought-stream?queryId=xxx')
 */

import { NextRequest } from 'next/server'
import { subscribeToQuery } from '@/lib/event-emitter'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const queryId = searchParams.get('queryId')

  if (!queryId) {
    return new Response('Missing queryId parameter', { status: 400 })
  }

  const encoder = new TextEncoder()
  let isClosed = false
  let heartbeatInterval: NodeJS.Timeout | null = null
  let unsubscribe: (() => void) | null = null

  const stream = new ReadableStream({
    start(controller) {
      const sendEvent = (data: Record<string, unknown>) => {
        if (isClosed) return
        try {
          const message = `data: ${JSON.stringify(data)}\n\n`
          controller.enqueue(encoder.encode(message))
        } catch (error) {
          console.error('[ThoughtStream] Error sending event:', error)
          cleanup()
        }
      }

      const cleanup = () => {
        if (isClosed) return
        isClosed = true

        if (heartbeatInterval) {
          clearInterval(heartbeatInterval)
          heartbeatInterval = null
        }

        if (unsubscribe) {
          unsubscribe()
          unsubscribe = null
        }

        try {
          controller.close()
        } catch (error) {
          // Controller may already be closed
        }
      }

      // Send initial connection event
      sendEvent({
        type: 'connected',
        stage: 'received',
        message: 'Connected to thought stream',
        queryId,
        timestamp: Date.now()
      })

      // Subscribe to query events
      unsubscribe = subscribeToQuery(queryId, (event: Record<string, unknown>) => {
        sendEvent(event)

        // Auto-close on terminal events
        if (event.stage === 'complete' || event.stage === 'error' ||
            event.type === 'complete' || event.type === 'error') {
          setTimeout(() => cleanup(), 500)
        }
      })

      // Heartbeat every 15 seconds
      heartbeatInterval = setInterval(() => {
        if (!isClosed) {
          sendEvent({
            type: 'heartbeat',
            timestamp: Date.now()
          })
        }
      }, 15000)

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        console.log(`[ThoughtStream] Client disconnected from query ${queryId}`)
        cleanup()
      })

      // Max timeout of 5 minutes
      setTimeout(() => {
        if (!isClosed) {
          console.warn(`[ThoughtStream] Timeout for query ${queryId}`)
          sendEvent({
            type: 'timeout',
            stage: 'error',
            message: 'Stream timeout (5 minutes)',
            timestamp: Date.now()
          })
          cleanup()
        }
      }, 300000)
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  })
}
