'use client';

/**
 * InlineDialogue — orchestrates raw thinking view + lens view.
 *
 * CASE A: No rawThinking (extended thinking OFF) → lens-only, no toggle.
 * CASE B: rawThinking present, lenses empty → raw view only, no toggle.
 * CASE C: Both raw AND lens → selected viewMode + pill toggle.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CognitiveSignature } from '@/lib/cognitive/llm-extractor';
import RawThinkingView from './RawThinkingView';
import LensView from './LensView';

interface InlineDialogueProps {
  signature: CognitiveSignature | null;
  isLoading: boolean;
  rawThinking?: string;
  isThinkingStreaming?: boolean;
}

export default function InlineDialogue({
  signature,
  isLoading,
  rawThinking,
  isThinkingStreaming = false,
}: InlineDialogueProps) {
  const [viewMode, setViewMode] = useState<'raw' | 'lens'>('raw');

  const hasRaw = !!rawThinking && rawThinking.length > 0;
  const hasLens = !!signature && signature.inline_dialogue.length > 0;

  // CASE A: No raw thinking — lens-only path (original behavior)
  if (!hasRaw) {
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
    if (!hasLens) return null;
    return (
      <div className="my-2 pl-3 border-l-2 border-indigo-500/30">
        <LensView signature={signature} />
      </div>
    );
  }

  // CASE B: Raw thinking present, still streaming or no lenses yet
  // CASE C: Both raw AND lens available — show toggle
  const showToggle = hasRaw && hasLens;

  return (
    <div className="my-2 pl-3 border-l-2 border-indigo-500/30">
      {/* View mode toggle — only when both views available */}
      {showToggle && (
        <div className="flex items-center gap-0.5 mb-1.5">
          <button
            type="button"
            onClick={() => setViewMode('raw')}
            className={`px-2 py-0.5 rounded-full text-[8px] font-mono transition-colors ${
              viewMode === 'raw'
                ? 'bg-indigo-500/15 text-indigo-400'
                : 'text-relic-silver/30 hover:text-relic-silver/50'
            }`}
          >
            ◊ raw
          </button>
          <button
            type="button"
            onClick={() => setViewMode('lens')}
            className={`px-2 py-0.5 rounded-full text-[8px] font-mono transition-colors ${
              viewMode === 'lens'
                ? 'bg-indigo-500/15 text-indigo-400'
                : 'text-relic-silver/30 hover:text-relic-silver/50'
            }`}
          >
            ✦ lens
          </button>
        </div>
      )}

      {/* Content area with cross-fade */}
      <AnimatePresence mode="wait">
        {(viewMode === 'raw' || !hasLens) && (
          <motion.div
            key="raw"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <RawThinkingView rawThinking={rawThinking!} isStreaming={isThinkingStreaming} />
          </motion.div>
        )}
        {viewMode === 'lens' && hasLens && (
          <motion.div
            key="lens"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <LensView signature={signature!} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
