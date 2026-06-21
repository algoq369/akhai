import 'server-only';
import type { ThoughtEvent } from '@/lib/thought-stream';

/**
 * V6 Block 3 — async grounding client. Fire-and-forget after the answer completes:
 * zero added latency; the score arrives as a late `grounding` stage event.
 * Tri-state honesty (kills the factScore=0 stub pattern):
 *   env unset            -> emit nothing (feature off)
 *   no retrieval context -> mode 'parametric', score null (nothing to ground against)
 *   context present      -> mode 'grounded', real LettuceDetect score + unsupported spans
 * Block 4 wires ReAct tool results in as `context`.
 */
const GUARD_URL = process.env.GUARD_NLI_URL;
const GUARD_TOKEN = process.env.GUARD_NLI_TOKEN;

type EmitFn = (queryId: string, event: ThoughtEvent) => void;

export function scoreGroundingAsync(
  queryId: string,
  emit: EmitFn,
  answer: string,
  context: string[] = [],
  startTime: number = Date.now()
): void {
  if (!answer.trim()) return;
  void (async () => {
    const base = {
      id: `${queryId}-grounding`,
      queryId,
      stage: 'grounding' as const,
      timestamp: Date.now() - startTime,
    };
    try {
      // No retrieval context, OR no guard box configured -> honest parametric label (no NLI call).
      // The meter renders today; real grounded scores appear once GUARD_NLI_URL + context (Block 4) exist.
      if (!context.length || !GUARD_URL) {
        emit(queryId, {
          ...base,
          data: 'parametric · not fact-checked',
          details: { grounding: { mode: 'parametric', score: null } },
        });
        return;
      }
      const res = await fetch(`${GUARD_URL}/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(GUARD_TOKEN ? { Authorization: `Bearer ${GUARD_TOKEN}` } : {}),
        },
        body: JSON.stringify({ context, question: '', answer }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`guard ${res.status}`);
      const d = (await res.json()) as {
        score: number;
        spans: Array<{ start: number; end: number; text?: string; confidence?: number }>;
        ms: number;
      };
      const pct = d.score == null ? '—' : `${Math.round(d.score * 100)}%`;
      emit(queryId, {
        ...base,
        data: `grounded · ${pct} supported`,
        details: { grounding: { mode: 'grounded', score: d.score, spans: d.spans, ms: d.ms } },
      });
    } catch {
      emit(queryId, {
        ...base,
        data: 'grounding unavailable',
        details: { grounding: { mode: 'grounded', score: null, error: true } },
      });
    }
  })();
}
