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

/** Honest signal when an advisor's pinned free model 404s/429s and the free auto-router takes over. */
export function emitTotAdvisorFallback(
  streamQueryId: string | undefined,
  advisorName: string,
  startTime: number
): void {
  if (!streamQueryId) return;
  emitThought(streamQueryId, {
    id: `${streamQueryId}-tot-fallback-${advisorName}`,
    queryId: streamQueryId,
    stage: 'calling',
    timestamp: Date.now() - startTime,
    data: `advisor ${advisorName}: pinned free model unavailable, using free auto-router`,
    details: {
      narrative: `advisor ${advisorName}: pinned free model unavailable, using free auto-router`,
    },
  });
}

/** Honest signal when an advisor misses a round (timeout/failure) — the panel otherwise goes silent. */
export function emitTotAdvisorMiss(
  streamQueryId: string | undefined,
  r: { name: string; status: string; latency: number },
  provider: string,
  round: number,
  startTime: number
): void {
  if (!streamQueryId || (r.status !== 'timeout' && r.status !== 'failed')) return;
  const line =
    r.status === 'timeout'
      ? `advisor ${r.name} timed out (${Math.round(r.latency / 1000)}s) — proceeding without it`
      : `advisor ${r.name} failed — proceeding without it`;
  emitThought(streamQueryId, {
    id: `${streamQueryId}-tot-miss-r${round}-${provider}`,
    queryId: streamQueryId,
    stage: 'reasoning',
    timestamp: Date.now() - startTime,
    data: line,
    details: { narrative: line },
  });
}

/** Honest signal when round 2 is skipped because round 1 came back degraded (missing advisors). */
export function emitTotRound2Skip(
  streamQueryId: string | undefined,
  answered: number,
  total: number,
  startTime: number
): void {
  if (!streamQueryId) return;
  const line = `round 2 skipped — only ${answered}/${total} advisors answered; synthesizing from round 1`;
  emitThought(streamQueryId, {
    id: `${streamQueryId}-tot-round2-skip`,
    queryId: streamQueryId,
    stage: 'reasoning',
    timestamp: Date.now() - startTime,
    data: line,
    details: { narrative: line },
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
