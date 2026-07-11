'use client';

/**
 * ReasoningTrace — reasoning-persist: the live pipeline reasoning survives query completion
 * as a collapsible block on the message. Reads the SAME persisted side-canal-store timeline the
 * live ProcessingIndicator streamed into (messageMetadata[messageId]) — no new state, no
 * duplication of the answer (the streamed answer text itself is ResponseRenderer's job).
 * Collapsed by default; expands to the pipeline stage narrative lines only.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSideCanalStore } from '@/lib/stores/side-canal-store';
import { STAGE_META } from '@/lib/thought-stream';
import type { ThoughtEvent } from '@/lib/thought-stream';
import { STAGE_DESCRIPTIONS } from '@/components/ProcessingIndicator';

interface ReasoningTraceProps {
  messageId: string;
}

// Stable empty array to prevent Zustand re-render loop
const EMPTY_TIMELINE: ThoughtEvent[] = [];

export function ReasoningTrace({ messageId }: ReasoningTraceProps): React.ReactElement | null {
  const messageTimeline = useSideCanalStore(
    (s) => s.messageMetadata?.[messageId] ?? EMPTY_TIMELINE
  );
  const [expanded, setExpanded] = useState(false);

  if (messageTimeline.length === 0) return null;

  // One line per pipeline stage (not just narrative-bearing ones — silent stages like
  // calling/guard/analysis/grounding show their description/label instead of vanishing; labels
  // only, nothing invented). Excluded: 'generating' (streamed-answer chunks — ResponseRenderer
  // shows the final answer), 'complete'/'error' (pure terminal markers), and extended-thinking chunk events (the
  // live SSE handler intercepts those before pushMetadata, but history-loaded timelines contain
  // them — one per thinking delta). Dedupe: latest event per stage wins, first-occurrence order.
  const stageOrder: string[] = [];
  const latestByStage = new Map<string, ThoughtEvent>();
  for (const ev of messageTimeline) {
    if (ev.stage === 'generating' || ev.stage === 'complete' || ev.stage === 'error') continue;
    const intent = ev.details?.reasoning?.intent;
    if (intent === 'extended_thinking' || intent === 'thinking_complete') continue;
    if (!latestByStage.has(ev.stage)) stageOrder.push(ev.stage);
    latestByStage.set(ev.stage, ev);
  }
  const narrativeEntries = stageOrder.map((s) => {
    const ev = latestByStage.get(s)!;
    return {
      stage: s,
      narrative: ev.details?.narrative ?? STAGE_DESCRIPTIONS[s] ?? s,
      // Unknown stages (e.g. 'grounding' has no STAGE_META entry) show their own name
      meta: STAGE_META[s] || { symbol: '⊹', label: s, color: '#64748b' },
    };
  });

  if (narrativeEntries.length === 0) return null;

  return (
    <div className="mb-2">
      {/* Collapsed summary row — click to expand */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 font-mono text-[9px] text-relic-silver/70 dark:text-relic-silver/60 hover:text-relic-slate dark:hover:text-relic-ghost transition-colors"
      >
        <span className={`transition-transform duration-150 ${expanded ? '' : '-rotate-90'}`}>
          &#9662;
        </span>
        <span className="text-relic-silver/40">&#9671;</span>
        <span>live reasoning</span>
        <span className="text-relic-ghost dark:text-relic-slate/40">·</span>
        <span>
          {narrativeEntries.length} stage{narrativeEntries.length === 1 ? '' : 's'}
        </span>
        <span className="flex items-center gap-[3px] ml-0.5">
          {narrativeEntries.map((entry, i) => (
            <span key={i} style={{ color: entry.meta.color }}>
              {entry.meta.symbol}
            </span>
          ))}
        </span>
      </button>

      {/* Expanded: stage narrative lines */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="pt-2 space-y-1">
              {narrativeEntries.map((entry, i) => (
                <div
                  key={`${entry.stage}-${i}`}
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
                  <span className="italic">{entry.narrative}</span>
                </div>
              ))}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
