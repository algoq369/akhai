/**
 * usePipelineSSE Hook
 *
 * Manages SSE connection to /api/thought-stream for real-time pipeline updates.
 * Connects backend queryId to frontend messageId and updates Zustand store.
 */

import { useEffect, useRef, useCallback } from 'react'
import { usePipelineStore } from '@/lib/stores/pipeline-store'
import { createThoughtEvent, type PipelineStage, type ThoughtEvent } from '@/lib/thought-stream'

interface UsePipelineSSEOptions {
  queryId: string
  messageId: string
  enabled?: boolean
  onComplete?: (data: ThoughtEvent) => void
  onError?: (error: string) => void
}

/**
 * Hook to connect to pipeline SSE stream and update store
 */
export function usePipelineSSE({
  queryId,
  messageId,
  enabled = true,
  onComplete,
  onError
}: UsePipelineSSEOptions) {
  const eventSourceRef = useRef<EventSource | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const {
    setCurrentMetadata,
    addMetadataEvent,
    mapQueryToMessage,
    setConnectionActive,
    isConnectionActive
  } = usePipelineStore.getState()

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setConnectionActive(queryId, false)
    setCurrentMetadata(messageId, null)
  }, [queryId, messageId, setConnectionActive, setCurrentMetadata])

  useEffect(() => {
    if (!enabled || !queryId || !messageId) {
      return
    }

    // Don't create duplicate connections
    if (isConnectionActive(queryId)) {
      console.log(`[SSE] Connection already active for query ${queryId}`)
      return
    }

    // Map queryId to messageId
    mapQueryToMessage(queryId, messageId)

    // Create EventSource connection
    const eventSource = new EventSource(`/api/thought-stream?queryId=${queryId}`)
    eventSourceRef.current = eventSource
    setConnectionActive(queryId, true)

    console.log(`[SSE] Connected to thought-stream for query ${queryId} → message ${messageId}`)

    // Send initial "received" event
    const receivedEvent = createThoughtEvent('received', 'Query received')
    setCurrentMetadata(messageId, receivedEvent)
    addMetadataEvent(messageId, receivedEvent)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        // Skip heartbeat events
        if (data.type === 'heartbeat') {
          return
        }

        // Convert to ThoughtEvent
        const thoughtEvent: ThoughtEvent = {
          stage: data.stage || data.type || 'reasoning',
          timestamp: data.timestamp || Date.now(),
          message: data.message || data.data?.message || '',
          data: data.data || data
        }

        // Update live metadata
        setCurrentMetadata(messageId, thoughtEvent)

        // Add to timeline
        addMetadataEvent(messageId, thoughtEvent)

        console.log(`[SSE] ${thoughtEvent.stage}: ${thoughtEvent.message}`)

        // Handle terminal events
        if (thoughtEvent.stage === 'complete') {
          onComplete?.(thoughtEvent)
          // Give UI time to show final animation
          setTimeout(() => cleanup(), 2000)
        } else if (thoughtEvent.stage === 'error') {
          onError?.(thoughtEvent.message)
          cleanup()
        }
      } catch (error) {
        console.error('[SSE] Parse error:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('[SSE] Connection error:', error)
      onError?.('Connection lost')
      cleanup()
    }

    // Safety timeout - never keep SSE open more than 60s
    timeoutRef.current = setTimeout(() => {
      if (eventSourceRef.current?.readyState !== EventSource.CLOSED) {
        console.warn('[SSE] Safety timeout - closing stale connection')
        cleanup()
      }
    }, 60000)

    return cleanup
  }, [
    enabled,
    queryId,
    messageId,
    cleanup,
    mapQueryToMessage,
    setConnectionActive,
    isConnectionActive,
    setCurrentMetadata,
    addMetadataEvent,
    onComplete,
    onError
  ])

  return { cleanup }
}

/**
 * Emit pipeline events from API route (for use in simple-query/route.ts)
 *
 * This is a helper function to emit events to the SSE stream.
 * Call this at each processing stage.
 */
export function emitPipelineEvent(
  queryId: string,
  stage: PipelineStage,
  message: string,
  data?: Record<string, unknown>
): void {
  // This will be called from the backend
  // The actual emission happens through the event emitter
  const event = createThoughtEvent(stage, message, data)
  console.log(`[Pipeline] ${queryId} → ${stage}: ${message}`)

  // Store in memory for SSE to pick up
  // This is handled by the event-emitter system
}
