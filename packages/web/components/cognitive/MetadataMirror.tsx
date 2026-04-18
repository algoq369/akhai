'use client';

/**
 * MetadataMirror — Zone 1 of the right panel.
 * Per-exchange archive: query, metadata summary, output summary.
 * Click to expand → full 12-lens dialogue.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LensEntries from './LensEntries';
import type { CognitiveSignature } from '@/lib/cognitive/llm-extractor';

export interface MirrorExchange {
  queryId: string;
  query: string;
  shortMetadataSummary: string;
  shortOutputSummary: string;
  fullDialogue: CognitiveSignature | null;
}

interface MetadataMirrorProps {
  exchanges: MirrorExchange[];
  highlightedExchangeId: string | null;
}

export default function MetadataMirror({ exchanges, highlightedExchangeId }: MetadataMirrorProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const blockRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Scroll to highlighted exchange
  useEffect(() => {
    if (highlightedExchangeId && blockRefs.current[highlightedExchangeId]) {
      blockRefs.current[highlightedExchangeId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [highlightedExchangeId]);

  if (exchanges.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-[9px] text-relic-silver/20 font-mono">
        no exchanges yet
      </div>
    );
  }

  return (
    <div>
      <div className="px-4 pt-3 pb-2">
        <span className="text-[8px] uppercase tracking-[0.2em] text-relic-silver/40 font-mono">
          Metadata Mirror
        </span>
      </div>
      {exchanges.map((ex, idx) => {
        const isHighlighted = highlightedExchangeId === ex.queryId;
        const isExpanded = expandedId === ex.queryId;

        return (
          <div
            key={ex.queryId}
            id={`exchange-${ex.queryId}`}
            ref={(el) => {
              blockRefs.current[ex.queryId] = el;
            }}
            className={`border-b border-relic-mist/10 dark:border-relic-slate/10 transition-all duration-500 ${
              isHighlighted ? 'ring-1 ring-indigo-500/40 bg-indigo-500/5' : ''
            }`}
          >
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : ex.queryId)}
              className="w-full px-4 py-2.5 text-left hover:bg-relic-ghost/20 dark:hover:bg-relic-slate/5 transition-colors"
            >
              <div className="flex items-start gap-2">
                <span className="text-[7px] text-relic-silver/20 mt-0.5 shrink-0 font-mono">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-[9px] text-relic-slate/60 dark:text-relic-silver/50 italic line-clamp-2">
                    {ex.query}
                  </p>
                  {ex.shortMetadataSummary && (
                    <p className="text-[8px] text-indigo-400/50 leading-snug">
                      {ex.shortMetadataSummary}
                    </p>
                  )}
                  {ex.shortOutputSummary && (
                    <p className="text-[8px] text-relic-silver/40 leading-snug">
                      {ex.shortOutputSummary}
                    </p>
                  )}
                </div>
                <span
                  className={`text-[8px] text-relic-silver/20 transition-transform ${isExpanded ? '' : '-rotate-90'}`}
                >
                  ▾
                </span>
              </div>
            </button>

            <AnimatePresence>
              {isExpanded && ex.fullDialogue && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-3">
                    <LensEntries entries={ex.fullDialogue.inline_dialogue} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
