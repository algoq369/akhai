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
  | 'calling'
  | 'streaming'
  | 'reasoning'
  | 'analysis'
  | 'grounding'
  | 'complete'
  | 'error';

/** Structured payload attached to each stage — varies by stage type */
export interface ThoughtDetails {
  // routing
  methodology?: { selected: string; reason: string; candidates?: string[] };
  confidence?: number;
  // Rich fusion data (attached to routing event)
  queryAnalysis?: {
    complexity: number;
    queryType: string;
    keywords: string[];
    requiresTools: boolean;
    requiresMultiPerspective: boolean;
    isMathematical: boolean;
    isCreative: boolean;
  };
  methodologyScores?: Array<{ methodology: string; score: number; reasons: string[] }>;
  guardReasons?: string[];
  processingMode?: string;
  activeLenses?: string[];

  // layers
  layers?: Record<
    number,
    { name: string; weight: number; activated: boolean; keywords?: string[] }
  >;
  dominantLayer?: string;
  pathActivations?: Array<{ from: string; to: string; weight: number; description: string }>;

  // guard
  guard?: { verdict: 'pass' | 'warn' | 'flag'; risk: number; checks?: string[] };
  // grounding (V6 Block 3 — real NLI factuality)
  grounding?: {
    mode: 'grounded' | 'parametric' | 'heuristic';
    score: number | null;
    spans?: Array<{ start: number; end: number; text?: string; confidence?: number }>;
    ms?: number;
    error?: boolean;
  };

  // side-canal
  sideCanal?: { topics: string[]; contextChars: number };

  // refinements
  refinementCount?: number;

  // reasoning (AI's live thinking)
  reasoning?: {
    intent: string;
    approach: string;
    reflectionMode: string;
    ascentLevel: number;
    providerReason: string;
  };

  // analysis (post-processing insights)
  analysis?: {
    antipatternRisk: string;
    sovereigntyCheck: boolean;
    purified: boolean;
    synthesisInsight: string;
    dominantLayer: string;
    averageLevel: number;
  };

  // Live reasoning narrative (prose explanation per stage)
  narrative?: string;

  // generating / streaming / complete
  model?: string;
  provider?: string;
  tokens?: { input: number; output: number; total: number };
  duration?: number;
  cost?: number;
}

export interface ThoughtEvent {
  id: string;
  queryId: string;
  messageId?: string;
  stage: ThoughtStage;
  timestamp: number; // ms since query start
  data: string;
  details?: ThoughtDetails;
}

// simple-terms: labels a non-technical person understands (rendered uppercase by the components).
export const STAGE_META: Record<string, { symbol: string; label: string; color: string }> = {
  received: { symbol: '\u22b9', label: 'reading', color: '#64748b' },
  routing: { symbol: '\u25ce', label: 'method', color: '#6366f1' },
  layers: { symbol: '\u2b21', label: 'layers', color: '#a855f7' },
  guard: { symbol: '\u2298', label: 'checking', color: '#10b981' },
  'side-canal': { symbol: '\u27f3', label: 'context', color: '#06b6d4' },
  refinements: { symbol: '\u21bb', label: 'refinements', color: '#6366f1' },
  reasoning: { symbol: '\u2235', label: 'thinking', color: '#818cf8' },
  analysis: { symbol: '\u2234', label: 'review', color: '#c084fc' },
  calling: { symbol: '\u2299', label: 'contacting', color: '#94a3b8' },
  generating: { symbol: '\u25b3', label: 'writing', color: '#f59e0b' },
  grounding: { symbol: '\u2295', label: 'sources', color: '#94a3b8' },
  streaming: { symbol: '\u2726', label: 'streaming', color: '#e2e8f0' },
  complete: { symbol: '\u25c7', label: 'complete', color: '#10b981' },
  error: { symbol: '\u2715', label: 'error', color: '#ef4444' },
};

// simple-terms: plain-language names for internal layer names (Embedding/Encoder/\u2026) \u2014
// used wherever a layer name reaches a user-facing live string. Display vocabulary only.
export const LAYER_PLAIN: Record<string, string> = {
  Embedding: 'recalling facts',
  Encoder: 'pattern recognition',
  Reasoning: 'deep reasoning',
  Attention: 'focus',
  Generative: 'creative writing',
  Classifier: 'comparing options',
  Discriminator: 'critical review',
  Expansion: 'exploring possibilities',
  Executor: 'practical steps',
  'Meta-Core': 'self-reflection',
  Synthesis: 'integration',
};

// simple-terms: plain phrasing for meta-core intent categories (matched on the text before ' - ').
// The raw intent strings stay untouched in state — logic elsewhere matches on them.
export const INTENT_PLAIN: Record<string, string> = {
  'Seeking wisdom/guidance': 'Weighing guidance for your decision',
  'Seeking validation': 'Considering your take on it',
  'Seeking understanding': "Understanding what you're asking",
  'Seeking comparison': 'Comparing the options',
  'Seeking implementation knowledge': 'Working out how to do it',
  'Seeking meta-cognitive insight': 'Thinking through the deeper question',
  'Information request': 'Looking up what you asked',
};

// simple-terms: plain names for methodology ids in user-facing live strings.
export const METHOD_PLAIN: Record<string, string> = {
  direct: 'Direct answer',
  cod: 'Draft and refine',
  bot: 'Structured analysis',
  react: 'Web search',
  pot: 'Calculation',
  tot: 'Multi-AI consensus',
  sc: 'Multiple drafts',
  auto: 'Auto',
};

export function formatDuration(ms: number): string {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

export function formatLayerBar(name: string, value: number): string {
  const filled = Math.round(value / 20);
  return `${name} ${'\u2588'.repeat(filled)}${'\u2591'.repeat(5 - filled)} ${value}%`;
}

// ── Server-side SSE connection registry ──────────────────────────────

/** Global connection registry: queryId → set of stream controllers */
export const connections = new Map<string, Set<ReadableStreamDefaultController>>();

/**
 * Per-queryId event backlog. The client opens the SSE subscription (GET /api/thought-stream) and
 * POSTs the query concurrently, so early events (received/routing/reasoning) are frequently emitted
 * BEFORE the subscription's controller registers. Without a backlog those events were silently
 * dropped — the panel then showed only the synthetic 'connected' init event ("RECEIVED connected /
 * 1 pipeline stage"). We buffer every emitted event and replay it when a subscriber connects, so no
 * stage is ever lost to the subscribe-vs-emit race.
 */
const buffers = new Map<string, ThoughtEvent[]>();
// pipeline ~10-40 events + coalesced answer-token 'generating' flushes (~40 chars each → ~100 on a
// 4000-char answer) + extended-thinking deltas. 600 keeps the full backlog replayable; overflow only
// drops the OLDEST from the late-subscriber replay (live delivery is unaffected).
const MAX_BUFFERED = 600;

/** Replay backlog for a subscriber that connects mid-query (called from the SSE route on connect). */
export function getBufferedThoughts(queryId: string): ThoughtEvent[] {
  return buffers.get(queryId) ?? [];
}

/**
 * Emit a thought event to all connected clients for a given queryId, and buffer it so a subscriber
 * that connects after this point still replays it.
 * Called from the query pipeline (simple-query/route.ts) via emitAndPersist.
 */
export function emitThought(queryId: string, event: ThoughtEvent) {
  // Buffer first — a controller may not be registered yet (the query POST races the SSE GET).
  let buffer = buffers.get(queryId);
  if (!buffer) {
    buffer = [];
    buffers.set(queryId, buffer);
  }
  buffer.push(event);
  if (buffer.length > MAX_BUFFERED) buffer.shift();

  const controllers = connections.get(queryId);
  if (controllers && controllers.size > 0) {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    const deadControllers: ReadableStreamDefaultController[] = [];

    for (const controller of controllers) {
      try {
        controller.enqueue(new TextEncoder().encode(data));
      } catch {
        deadControllers.push(controller);
      }
    }

    // Clean up dead connections
    for (const dead of deadControllers) {
      controllers.delete(dead);
    }
  }

  // Auto-close on terminal stages, and free the backlog.
  if (event.stage === 'complete' || event.stage === 'error') {
    setTimeout(() => {
      connections.delete(queryId);
      buffers.delete(queryId);
    }, 3000);
  }
}
