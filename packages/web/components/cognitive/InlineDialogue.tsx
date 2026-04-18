'use client';

/**
 * InlineDialogue — AkhAI's lens-structured internal reflection under each query.
 * Collapsed: 3-line mixed preview. Expanded: all lens entries.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LENS_MAP } from '@/lib/cognitive/lenses';
import type { CognitiveSignature } from '@/lib/cognitive/llm-extractor';

interface InlineDialogueProps {
  signature: CognitiveSignature | null;
  isLoading: boolean;
}

export default function InlineDialogue({ signature, isLoading }: InlineDialogueProps) {
  const [expanded, setExpanded] = useState(false);

  // Loading state — subtle pulsing placeholder
  if (isLoading || !signature) {
    return (
      <div className="my-2 pl-3 border-l-2 border-indigo-500/20">
        <div className="flex items-center gap-1.5 text-[9px] font-mono text-indigo-400/40 animate-pulse">
          <span>◇</span>
          <span className="uppercase tracking-wider">reflecting...</span>
        </div>
      </div>
    );
  }

  const entries = signature.inline_dialogue;
  if (entries.length === 0) return null;

  const previewEntries = entries.slice(0, 3);
  const remaining = entries.length - 3;

  return (
    <div className="my-2 pl-3 border-l-2 border-indigo-500/30">
      {/* Collapsed preview — click to expand */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left group"
      >
        {!expanded && (
          <div className="space-y-0.5">
            {previewEntries.map((entry, i) => {
              const lens = LENS_MAP.get(entry.lens_id);
              if (!lens) return null;
              const preview = entry.text.split(' ').slice(0, 12).join(' ');
              return (
                <div key={i} className="flex items-start gap-1.5 text-[9px] leading-snug">
                  <span style={{ color: lens.color }} className="shrink-0 mt-px">
                    {lens.sigil}
                  </span>
                  <span className="text-relic-slate/50 dark:text-relic-silver/40 line-clamp-1">
                    {preview}...
                  </span>
                </div>
              );
            })}
            {remaining > 0 && (
              <div className="text-[8px] text-indigo-400/40 font-mono pl-4">
                ▸ {remaining} more thoughts
              </div>
            )}
          </div>
        )}
      </button>

      {/* Expanded — full lens entries */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <button type="button" onClick={() => setExpanded(false)} className="w-full text-left">
              <div className="space-y-2 py-1">
                {entries.map((entry, i) => {
                  const lens = LENS_MAP.get(entry.lens_id);
                  if (!lens) return null;
                  return (
                    <div key={i} className="flex items-start gap-2">
                      <span style={{ color: lens.color }} className="shrink-0 mt-0.5 text-[11px]">
                        {lens.sigil}
                      </span>
                      <div className="min-w-0">
                        <span
                          className="text-[7px] uppercase tracking-[0.15em] font-serif"
                          style={{ color: lens.color }}
                        >
                          {lens.name}
                        </span>
                        <p className="text-[9px] leading-relaxed text-relic-slate/70 dark:text-relic-silver/50 mt-0.5">
                          {entry.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
