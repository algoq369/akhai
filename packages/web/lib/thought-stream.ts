/**
 * Thought Stream - SSE Event Types and Stage Metadata
 *
 * Defines the pipeline stages emitted during AI query processing.
 * These events flow from backend → SSE → Zustand store → UI components
 */

export type PipelineStage =
  | 'received'
  | 'routing'
  | 'layers'
  | 'reasoning'
  | 'generating'
  | 'guard'
  | 'analysis'
  | 'complete'
  | 'error'

export interface ThoughtEvent {
  stage: PipelineStage
  timestamp: number
  message: string
  data?: Record<string, unknown>
}

/**
 * Stage metadata with display properties
 */
export const STAGE_META: Record<PipelineStage, {
  symbol: string
  label: string
  color: string
  description: string
}> = {
  received: {
    symbol: '◉',
    label: 'RECEIVED',
    color: 'text-blue-500',
    description: 'Query received and validated'
  },
  routing: {
    symbol: '⟐',
    label: 'ROUTING',
    color: 'text-purple-500',
    description: 'Selecting optimal methodology'
  },
  layers: {
    symbol: '⬡',
    label: 'LAYERS',
    color: 'text-indigo-500',
    description: 'Activating Sefirot layers'
  },
  reasoning: {
    symbol: '◇',
    label: 'REASONING',
    color: 'text-cyan-500',
    description: 'Processing with AI reasoning'
  },
  generating: {
    symbol: '△',
    label: 'GENERATING',
    color: 'text-emerald-500',
    description: 'Generating response'
  },
  guard: {
    symbol: '⊘',
    label: 'GUARD',
    color: 'text-amber-500',
    description: 'Running grounding guard'
  },
  analysis: {
    symbol: '◈',
    label: 'ANALYSIS',
    color: 'text-pink-500',
    description: 'Post-processing analysis'
  },
  complete: {
    symbol: '◇',
    label: 'COMPLETE',
    color: 'text-green-500',
    description: 'Query processing complete'
  },
  error: {
    symbol: '✕',
    label: 'ERROR',
    color: 'text-red-500',
    description: 'An error occurred'
  }
}

/**
 * Format elapsed time in human-readable format
 */
export function formatElapsed(startTime: number, currentTime: number): string {
  const elapsed = currentTime - startTime
  if (elapsed < 1000) {
    return `+${elapsed}ms`
  }
  return `+${(elapsed / 1000).toFixed(1)}s`
}

/**
 * Format token count
 */
export function formatTokens(tokens: number): string {
  if (tokens < 1000) return `${tokens}t`
  return `${(tokens / 1000).toFixed(1)}k`
}

/**
 * Format cost in USD
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) return `$${cost.toFixed(4)}`
  return `$${cost.toFixed(2)}`
}

/**
 * Create a thought event
 */
export function createThoughtEvent(
  stage: PipelineStage,
  message: string,
  data?: Record<string, unknown>
): ThoughtEvent {
  return {
    stage,
    timestamp: Date.now(),
    message,
    data
  }
}

/**
 * Pipeline summary for collapsed view
 */
export interface PipelineSummary {
  methodology: string
  totalTime: number
  tokens: number
  cost: number
  stageCount: number
  guardPassed: boolean
}

/**
 * Generate pipeline summary from events
 */
export function generatePipelineSummary(events: ThoughtEvent[]): PipelineSummary | null {
  if (events.length === 0) return null

  const completeEvent = events.find(e => e.stage === 'complete')
  const routingEvent = events.find(e => e.stage === 'routing')
  const guardEvent = events.find(e => e.stage === 'guard')
  const firstEvent = events[0]
  const lastEvent = events[events.length - 1]

  return {
    methodology: (routingEvent?.data?.methodology as string) || 'direct',
    totalTime: lastEvent.timestamp - firstEvent.timestamp,
    tokens: (completeEvent?.data?.tokens as number) || 0,
    cost: (completeEvent?.data?.cost as number) || 0,
    stageCount: events.length,
    guardPassed: (guardEvent?.data?.passed as boolean) ?? true
  }
}
