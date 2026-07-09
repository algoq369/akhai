import 'server-only';
import { emitThought } from './thought-stream';

/**
 * live-words progress for GTP Flash consensus (tot). The advisors use a non-streaming provider call
 * and the Mother Base synthesis uses a non-streaming direct fetch, so these surface REAL excerpts as
 * each lands (completion-level, not word-by-word). Emitted to the caller's thought-stream queryId so
 * they appear in the same live panel as the single-pass methods.
 */

interface AdvisorResult {
  name: string;
  status: string;
  content: string;
}

/** Surface one advisor's real answer excerpt as it completes. */
export function emitTotAdvisor(
  streamQueryId: string | undefined,
  r: AdvisorResult,
  provider: string,
  startTime: number
): void {
  if (!streamQueryId || r.status !== 'complete' || !r.content) return;
  emitThought(streamQueryId, {
    id: `${streamQueryId}-tot-advisor-${provider}`,
    queryId: streamQueryId,
    stage: 'reasoning',
    timestamp: Date.now() - startTime,
    data: `${r.name} advisor responded`,
    details: { narrative: `${r.name}: ${r.content.slice(0, 200).replace(/\s+/g, ' ').trim()}` },
  });
}

/** Emit the synthesized answer excerpt (one real excerpt — synthesis is not token-streamed). */
export function emitTotSynthesis(
  streamQueryId: string | undefined,
  text: string,
  startTime: number
): void {
  if (!streamQueryId || !text) return;
  emitThought(streamQueryId, {
    id: `${streamQueryId}-gen-tot-synthesis`,
    queryId: streamQueryId,
    stage: 'generating',
    timestamp: Date.now() - startTime,
    data: 'Mother Base synthesis',
    details: { narrative: text.slice(0, 400).replace(/\s+/g, ' ').trim() },
  });
}
