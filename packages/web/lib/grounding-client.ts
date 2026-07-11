import 'server-only';
import type { ThoughtEvent } from '@/lib/thought-stream';
import { scoreLexicalSupport } from './grounding-heuristic';

/**
 * V6 Block 3 — async grounding client. Fire-and-forget after the answer completes:
 * zero added latency; the score arrives as a late `grounding` stage event.
 * Honest tiering (kills the factScore=0 stub pattern):
 *   no retrieval context -> mode 'parametric', score null (nothing to ground against)
 *   context, no NLI box  -> mode 'heuristic', in-process lexical-support score (E1.1)
 *   context + NLI box     -> mode 'grounded', real LettuceDetect score + unsupported spans
 * ReAct tool results arrive as `context`.
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
      // No retrieval context -> honest parametric label (nothing to ground against).
      if (!context.length) {
        emit(queryId, {
          ...base,
          data: 'Answered from general knowledge — no sources to check against',
          details: { grounding: { mode: 'parametric', score: null } },
        });
        return;
      }
      // Context present but no NLI box -> in-process lexical support (lighter tier, no network).
      if (!GUARD_URL) {
        const { score, spans } = scoreLexicalSupport(answer, context);
        emit(queryId, {
          ...base,
          data: `Quick source check: ${Math.round(score * 100)}% of the answer matches the sources`,
          details: { grounding: { mode: 'heuristic', score, spans } },
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
        data: `Checked against sources: ${pct} supported`,
        details: { grounding: { mode: 'grounded', score: d.score, spans: d.spans, ms: d.ms } },
      });
    } catch {
      emit(queryId, {
        ...base,
        data: 'Source check unavailable right now',
        details: { grounding: { mode: 'grounded', score: null, error: true } },
      });
    }
  })();
}
