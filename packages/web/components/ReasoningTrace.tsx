'use client';

/**
 * ReasoningTrace — reasoning-persist: the live word-by-word reasoning survives query completion
 * as a collapsible block on the message. Reads the SAME persisted side-canal-store timeline the
 * live ProcessingIndicator streamed into (messageMetadata[messageId]) — no new state, no
 * duplication of the answer. Collapsed by default; expands to the pipeline stage narrative lines
 * plus the full streamed answer text. Renders only what the timeline actually holds.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSideCanalStore } from '@/lib/stores/side-canal-store';
import { STAGE_META } from '@/lib/thought-stream';
import type { ThoughtEvent } from '@/lib/thought-stream';

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

  // Same derivation as ProcessingIndicator: 'generating' events carry the real streamed answer
  // chunks (concatenated into one block); every other narrative-bearing event is a stage line.
  const generatingText = messageTimeline
    .filter((ev) => ev.stage === 'generating' && ev.details?.narrative)
    .map((ev) => ev.details?.narrative ?? '')
    .join('');

  // Exclude extended-thinking chunk events: the live SSE handler (useQueryHandlers) intercepts
  // them before pushMetadata (they belong to the raw-thinking view), but history-loaded timelines
  // (useHomePageEffects loadConversation) contain them — one event per thinking delta.
  const narrativeEntries = messageTimeline
    .filter((ev) => ev.details?.narrative && ev.stage !== 'generating')
    .filter(
      (ev) =>
        ev.details?.reasoning?.intent !== 'extended_thinking' &&
        ev.details?.reasoning?.intent !== 'thinking_complete'
    )
    .map((ev) => ({
      stage: ev.stage,
      narrative: ev.details?.narrative ?? '',
      meta: STAGE_META[ev.stage] || STAGE_META.received,
    }));

  if (narrativeEntries.length === 0 && !generatingText) return null;

  return (
    <div className="mb-2">
      {/* Collapsed summary row — click to expand */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 font-mono text-[9px] text-relic-silver/70 dark:text-relic-slate/60 hover:text-relic-slate dark:hover:text-relic-silver transition-colors"
      >
        <span className={`transition-transform duration-150 ${expanded ? '' : '-rotate-90'}`}>
          &#9662;
        </span>
        <span className="text-relic-silver/40">&#9671;</span>
        <span>live reasoning</span>
        <span className="text-relic-ghost dark:text-relic-slate/30">·</span>
        <span>
          {narrativeEntries.length} stage{narrativeEntries.length === 1 ? '' : 's'}
        </span>
        {generatingText && (
          <>
            <span className="text-relic-ghost dark:text-relic-slate/30">·</span>
            <span>{generatingText.length.toLocaleString()} chars</span>
          </>
        )}
      </button>

      {/* Expanded: stage narrative lines + the full streamed answer text */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="pt-1.5 space-y-0.5">
              {narrativeEntries.map((entry, i) => (
                <div
                  key={`${entry.stage}-${i}`}
                  className="flex items-start gap-2 font-mono text-[8px] text-relic-silver/35 dark:text-relic-slate/30"
                >
                  <span className="flex-shrink-0" style={{ color: entry.meta.color, opacity: 0.4 }}>
                    {entry.meta.symbol}
                  </span>
                  <span
                    className="uppercase tracking-wider flex-shrink-0 w-[70px]"
                    style={{ color: entry.meta.color, opacity: 0.4 }}
                  >
                    {entry.meta.label}
                  </span>
                  <span className="italic">{entry.narrative}</span>
                </div>
              ))}

              {generatingText && (
                <div className="mt-2 rounded border border-relic-ghost/20 dark:border-relic-slate/15 bg-relic-void/[0.02] dark:bg-white/[0.02] px-3 py-2 font-mono text-[12px] text-relic-void/85 dark:text-relic-slate/85 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {generatingText}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
