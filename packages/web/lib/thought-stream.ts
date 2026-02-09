/**
 * THOUGHT STREAM
 *
 * Real-time AI pipeline commentary types and utilities.
 * Events flow from the query pipeline via SSE to the MetadataStrip component.
 *
 * @module thought-stream
 */

export type ThoughtStage =
  | 'received'
  | 'routing'
  | 'layers'
  | 'guard'
  | 'side-canal'
  | 'refinements'
  | 'generating'
  | 'streaming'
  | 'reasoning'
  | 'analysis'
  | 'complete'
  | 'error'

/** Structured payload attached to each stage — varies by stage type */
export interface ThoughtDetails {
  // routing
  methodology?: { selected: string; reason: string; candidates?: string[] }
  confidence?: number
  // Rich fusion data (attached to routing event)
  queryAnalysis?: {
    complexity: number
    queryType: string
    keywords: string[]
    requiresTools: boolean
    requiresMultiPerspective: boolean
    isMathematical: boolean
    isCreative: boolean
  }
  methodologyScores?: Array<{ methodology: string; score: number; reasons: string[] }>
  guardReasons?: string[]
  processingMode?: string
  activeLenses?: string[]

  // layers
  layers?: Record<number, { name: string; weight: number; activated: boolean; keywords?: string[] }>
  dominantLayer?: string
  pathActivations?: Array<{ from: string; to: string; weight: number; description: string }>

  // guard
  guard?: { verdict: 'pass' | 'warn' | 'flag'; risk: number; checks?: string[] }

  // side-canal
  sideCanal?: { topics: string[]; contextChars: number }

  // refinements
  refinementCount?: number

  // reasoning (AI's live thinking)
  reasoning?: {
    intent: string
    approach: string
    reflectionMode: string
    ascentLevel: number
    providerReason: string
  }

  // analysis (post-processing insights)
  analysis?: {
    antipatternRisk: string
    sovereigntyCheck: boolean
    purified: boolean
    synthesisInsight: string
    dominantLayer: string
    averageLevel: number
  }

  // generating / streaming / complete
  model?: string
  provider?: string
  tokens?: { input: number; output: number; total: number }
  duration?: number
  cost?: number
}

export interface ThoughtEvent {
  id: string
  queryId: string
  messageId?: string
  stage: ThoughtStage
  timestamp: number // ms since query start
  data: string
  details?: ThoughtDetails
}

export const STAGE_META: Record<
  string,
  { symbol: string; label: string; color: string }
> = {
  received: { symbol: '\u22b9', label: 'received', color: '#64748b' },
  routing: { symbol: '\u25ce', label: 'routing', color: '#6366f1' },
  layers: { symbol: '\u2b21', label: 'layers', color: '#a855f7' },
  guard: { symbol: '\u2298', label: 'guard', color: '#10b981' },
  'side-canal': { symbol: '\u27f3', label: 'side canal', color: '#06b6d4' },
  refinements: { symbol: '\u21bb', label: 'refinements', color: '#6366f1' },
  reasoning: { symbol: '\u2235', label: 'reasoning', color: '#818cf8' },
  analysis: { symbol: '\u2234', label: 'analysis', color: '#c084fc' },
  generating: { symbol: '\u25b3', label: 'fusion', color: '#f59e0b' },
  streaming: { symbol: '\u2726', label: 'streaming', color: '#e2e8f0' },
  complete: { symbol: '\u25c7', label: 'complete', color: '#10b981' },
  error: { symbol: '\u2715', label: 'error', color: '#ef4444' },
}

export function formatDuration(ms: number): string {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
}

export function formatLayerBar(name: string, value: number): string {
  const filled = Math.round(value / 20)
  return `${name} ${'\u2588'.repeat(filled)}${'\u2591'.repeat(5 - filled)} ${value}%`
}

// ── Server-side SSE connection registry ──────────────────────────────

/** Global connection registry: queryId → set of stream controllers */
export const connections = new Map<string, Set<ReadableStreamDefaultController>>()

/**
 * Emit a thought event to all connected clients for a given queryId.
 * Called from the query pipeline (simple-query/route.ts).
 */
export function emitThought(queryId: string, event: ThoughtEvent) {
  const controllers = connections.get(queryId)
  if (!controllers || controllers.size === 0) return

  const data = `data: ${JSON.stringify(event)}\n\n`
  const deadControllers: ReadableStreamDefaultController[] = []

  for (const controller of controllers) {
    try {
      controller.enqueue(new TextEncoder().encode(data))
    } catch {
      deadControllers.push(controller)
    }
  }

  // Clean up dead connections
  for (const dead of deadControllers) {
    controllers.delete(dead)
  }

  // Auto-close on terminal stages
  if (event.stage === 'complete' || event.stage === 'error') {
    setTimeout(() => {
      connections.delete(queryId)
    }, 2000)
  }
}
