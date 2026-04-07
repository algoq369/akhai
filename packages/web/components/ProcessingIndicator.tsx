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

interface ProcessingIndicatorProps {
  messageId: string;
  isVisible: boolean;
}

const STAGE_DESCRIPTIONS: Record<string, string> = {
  received: 'Analyzing query...',
  routing: 'Selecting methodology...',
  layers: 'Activating neural layers...',
  reasoning: 'Decomposing problem...',
  generating: 'Generating response...',
  guard: 'Guard checking response...',
  analysis: 'Analyzing output quality...',
  complete: 'Complete',
  error: 'Error occurred',
};

export default function ProcessingIndicator({ messageId, isVisible }: ProcessingIndicatorProps) {
  const currentMetadata = useSideCanalStore((s) => s.currentMetadata?.[messageId] ?? null);

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
  } else if (stage === 'generating' && currentMetadata.details?.model) {
    const cleanModel = currentMetadata.details.model
      .replace(/^(?:meta-llama|anthropic|mistralai|deepseek|openai|google)\//, '')
      .replace(/:free$/, '');
    detail = `via ${cleanModel}`;
  } else if (stage === 'guard' && currentMetadata.details?.guard) {
    const verdict = currentMetadata.details.guard.verdict;
    detail = verdict === 'pass' ? 'all clear' : verdict;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stage}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.2 }}
        className="max-w-3xl mx-auto px-10 py-1"
      >
        <div className="flex items-center gap-2 font-mono text-[9px] text-relic-silver/60 dark:text-relic-slate/50">
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
              <span className="text-relic-ghost dark:text-relic-slate/20">·</span>
              <span className="text-relic-silver/40 dark:text-relic-slate/40 truncate max-w-[300px]">
                {detail}
              </span>
            </>
          )}
          {elapsed && (
            <span className="ml-auto text-relic-ghost dark:text-relic-slate/30">+{elapsed}</span>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
