'use client';

/**
 * ProcessingIndicator — Shows live AI thinking process under the user's query.
 * Subscribes to SSE thought-stream events via side-canal-store.
 * Displays current pipeline stage with sigil + description + elapsed time.
 * Fades out when response arrives (stage === 'complete' or 'error').
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useSideCanalStore } from '@/lib/stores/side-canal-store';
import { STAGE_META, formatDuration } from '@/lib/thought-stream';
import type { ThoughtEvent } from '@/lib/thought-stream';

interface ProcessingIndicatorProps {
  messageId: string;
  isVisible: boolean;
}

const EMPTY_TIMELINE: ThoughtEvent[] = [];

export const STAGE_DESCRIPTIONS: Record<string, string> = {
  received: 'Analyzing query...',
  routing: 'Selecting methodology...',
  layers: 'Activating neural layers...',
  reasoning: 'Decomposing problem...',
  calling: 'Connecting to AI provider...',
  generating: 'Generating response...',
  guard: 'Guard checking response...',
  analysis: 'Analyzing output quality...',
  grounding: 'Grounding response in sources...',
  complete: 'Complete',
  error: 'Error occurred',
};

export default function ProcessingIndicator({ messageId, isVisible }: ProcessingIndicatorProps) {
  const currentMetadata = useSideCanalStore((s) => s.currentMetadata?.[messageId] ?? null);
  const messageTimeline = useSideCanalStore(
    (s) => s.messageMetadata?.[messageId] ?? EMPTY_TIMELINE
  );

  const stage = currentMetadata?.stage;
  const isTerminal = stage === 'complete' || stage === 'error';

  if (!isVisible || !currentMetadata || isTerminal) return null;

  const meta = STAGE_META[stage || 'received'] || STAGE_META.received;
  const description = currentMetadata.data
    ? currentMetadata.data.replace(/^query:\s*/i, '').slice(0, 60)
    : STAGE_DESCRIPTIONS[stage || 'received'] || 'Processing...';
  const elapsed = currentMetadata.timestamp > 0 ? formatDuration(currentMetadata.timestamp) : '';

  // Build rich detail from routing/layers metadata
  let detail = '';
  if (stage === 'routing' && currentMetadata.details?.methodology?.selected) {
    const conf = currentMetadata.details.confidence
      ? ` (${Math.round(currentMetadata.details.confidence * 100)}%)`
      : '';
    detail = `${currentMetadata.details.methodology.selected.toUpperCase()}${conf}`;
    if (currentMetadata.details.methodology.reason) {
      detail += ` — ${currentMetadata.details.methodology.reason}`;
    }
  } else if (stage === 'layers' && currentMetadata.details?.dominantLayer) {
    detail = `${currentMetadata.details.dominantLayer} dominant`;
  } else if (stage === 'generating') {
    detail = '';
  } else if (stage === 'guard' && currentMetadata.details?.guard) {
    const verdict = currentMetadata.details.guard.verdict;
    detail = verdict === 'pass' ? 'all clear' : verdict;
  }

  // live words — the answer streaming, accumulated from chunk events into flowing text.
  // This BLUE metadata block is the ONE place the words appear (moved from MetadataStrip's FUSION).
  const liveWords =
    stage === 'generating'
      ? messageTimeline
          .filter((ev) => ev.stage === 'generating' && ev.details?.narrative)
          .map((ev) => ev.details?.narrative ?? '')
          .join('')
          .slice(-400)
      : '';

  // Collect one line per completed pipeline stage (exclude 'generating' — those are the streamed-
  // answer chunks rendered as one growing block below — plus terminal markers and the pulsing
  // current stage). Silent stages (calling/guard/analysis/grounding/…) carry no narrative field:
  // they show their human description/label instead of vanishing — labels only, nothing invented.
  // Dedupe: the latest event per stage wins, ordered by first occurrence (= pipeline order).
  // Key by stage+narrative (NOT stage alone): methodologies like tot emit MANY distinct events on
  // the same stage (each advisor's fallback/response/miss) — latest-per-stage made them overwrite
  // each other into a single mutating row. Distinct narratives each keep a row; identical re-emits
  // still collapse. Capped to the last 12 rows so re-fired stages can't build a wall.
  const rowOrder: string[] = [];
  const latestByKey = new Map<string, ThoughtEvent>();
  for (const ev of messageTimeline) {
    if (ev.stage === 'generating' || ev.stage === 'complete' || ev.stage === 'error') continue;
    // Exclude only the exact CURRENT event (it's the pulsing status line below) — NOT the whole
    // current stage: tot re-fires stages (advisor responses/misses on 'reasoning'), and excluding
    // by stage made every prior advisor row vanish whenever a new same-stage event became current.
    if (ev.id === currentMetadata.id) continue;
    const intent = ev.details?.reasoning?.intent;
    if (intent === 'extended_thinking' || intent === 'thinking_complete') continue;
    const key = `${ev.stage}|${ev.details?.narrative ?? ''}`;
    if (!latestByKey.has(key)) rowOrder.push(key);
    latestByKey.set(key, ev);
  }
  const cappedOrder = rowOrder.slice(-12);
  const narrativeEntries = cappedOrder.map((k) => {
    const ev = latestByKey.get(k)!;
    const s = ev.stage;
    return {
      stage: s,
      narrative: ev.details?.narrative ?? STAGE_DESCRIPTIONS[s] ?? s,
      // Unknown stages (e.g. 'grounding' has no STAGE_META entry) show their own name, not a wrong sigil label
      meta: STAGE_META[s] || { symbol: '⊹', label: s, color: '#64748b' },
    };
  });

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`processing-${messageId}`}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.2 }}
        className="max-w-3xl mx-auto px-10 py-1"
      >
        <div className="space-y-1">
          {/* Accumulated narrative from completed stages */}
          {narrativeEntries.map((entry) => (
            <motion.div
              key={`${entry.stage}|${entry.narrative}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-baseline gap-2 font-mono text-[9px] leading-relaxed text-relic-slate/60 dark:text-relic-silver/55"
            >
              <span
                className="flex-shrink-0 w-[10px] text-center"
                style={{ color: entry.meta.color, opacity: 0.75 }}
              >
                {entry.meta.symbol}
              </span>
              <span
                className="uppercase tracking-wider flex-shrink-0 w-[70px]"
                style={{ color: entry.meta.color, opacity: 0.6 }}
              >
                {entry.meta.label}
              </span>
              <span className="italic truncate">{entry.narrative}</span>
            </motion.div>
          ))}

          {/* Current active stage (pulsing) */}
          <div className="flex items-center gap-2 font-mono text-[9px] text-relic-silver/60 dark:text-relic-silver/70">
            <motion.span
              style={{ color: meta.color }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {meta.symbol}
            </motion.span>
            <span className="uppercase tracking-wider" style={{ color: meta.color }}>
              {STAGE_DESCRIPTIONS[stage || 'received']}
            </span>
            {detail && (
              <>
                <span className="text-relic-ghost dark:text-relic-slate/40">·</span>
                <span className="text-relic-silver/40 dark:text-relic-silver/50 truncate max-w-[300px]">
                  {detail}
                </span>
              </>
            )}
            {elapsed && (
              <span className="ml-auto text-relic-ghost dark:text-relic-slate/30">+{elapsed}</span>
            )}
          </div>

          {/* the answer words flowing live, inside the metadata block */}
          {liveWords && (
            <div className="pl-[18px] font-mono text-[9px] italic leading-relaxed text-relic-silver/60 dark:text-relic-silver/55 whitespace-pre-wrap">
              {liveWords}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
