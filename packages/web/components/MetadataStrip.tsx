'use client';

/**
 * MetadataStrip - Inline pipeline commentary under each assistant message.
 *
 * During streaming: shows current stage (animated symbol + label + data).
 * After completion: shows expandable PipelineTimeline with full history.
 */

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { STAGE_META, formatDuration } from '@/lib/thought-stream';
import type { ThoughtEvent } from '@/lib/thought-stream';
import { useSideCanalStore } from '@/lib/stores/side-canal-store';
import PipelineTimeline from '@/components/PipelineTimeline';

// Stable empty array to prevent Zustand infinite re-render loop
const EMPTY_TIMELINE: ThoughtEvent[] = [];

interface MetadataStripProps {
  messageId: string;
  isStreaming?: boolean;
}

export default function MetadataStrip({ messageId, isStreaming = false }: MetadataStripProps) {
  const currentMetadata = useSideCanalStore((s) => s.currentMetadata?.[messageId] ?? null);
  const messageTimeline = useSideCanalStore(
    (s) => s.messageMetadata?.[messageId] ?? EMPTY_TIMELINE
  );
  const [phase, setPhase] = useState<'live' | 'summary' | 'hidden'>(isStreaming ? 'live' : 'live');
  const [expanded, setExpanded] = useState(false);

  const isTerminal = currentMetadata?.stage === 'complete' || currentMetadata?.stage === 'error';

  // Debug: trace phase transitions
  useEffect(() => {
    console.log('[MetadataStrip]', messageId.slice(0, 8), {
      phase,
      isStreaming,
      isTerminal,
      currentStage: currentMetadata?.stage || 'null',
      timelineLen: messageTimeline.length,
    });
  }, [phase, isStreaming, isTerminal, currentMetadata?.stage, messageTimeline.length, messageId]);

  useEffect(() => {
    if (!currentMetadata) {
      if (isStreaming) {
        // During streaming with no events yet — stay in live phase
        setPhase('live');
      } else if (messageTimeline.length > 0) {
        setPhase('summary');
      }
      return;
    }

    if (isTerminal) {
      const timer = setTimeout(() => setPhase('summary'), 1500);
      return () => clearTimeout(timer);
    } else {
      setPhase('live');
    }
  }, [currentMetadata, isTerminal, messageTimeline.length, isStreaming]);

  const toggleExpand = useCallback(() => setExpanded((v) => !v), []);

  // Nothing to show — but if streaming, always show the connecting state
  if (!currentMetadata && messageTimeline.length === 0 && !isStreaming) return null;

  // ── LIVE phase: connecting state (streaming but no events yet) ─
  if (phase === 'live' && !currentMetadata && isStreaming) {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 0.8, height: 'auto' }}
        transition={{ duration: 0.3 }}
        className="pl-4 border-l-2 border-relic-ghost dark:border-relic-slate/20 mt-1"
      >
        <div className="font-mono text-[9px] text-relic-silver dark:text-relic-slate flex items-center gap-1.5">
          <span className="animate-pulse text-amber-500">◉</span>
          <span className="uppercase tracking-wider text-amber-500/80">
            Connecting to engine...
          </span>
        </div>
      </motion.div>
    );
  }

  // ── LIVE phase: animated current stage ────────────────────────
  // Live phase renders nothing: ALL live metadata (stage rows, advisor lines, streaming words)
  // lives in ONE place — ProcessingIndicator's blue block. This strip resumes at completion with
  // the run summary. (Was echoing currentMetadata.data below the blue block — duplicate metadata.)
  if (phase === 'live' && currentMetadata) {
    return null;
  }

  // ── SUMMARY phase: rich compact line + expandable timeline ─────────
  if (phase === 'summary' && messageTimeline.length > 0) {
    const completeEv = messageTimeline.find((e) => e.stage === 'complete');
    const routingEv = messageTimeline.find((e) => e.stage === 'routing');
    const layersEv = messageTimeline.find((e) => e.stage === 'layers');
    const guardEv = messageTimeline.find((e) => e.stage === 'guard');
    const genEv = [...messageTimeline].reverse().find((e) => e.stage === 'generating');
    const analysisEv = messageTimeline.find((e) => e.stage === 'analysis');

    const method =
      completeEv?.details?.methodology?.selected ?? routingEv?.details?.methodology?.selected;
    const confidence = routingEv?.details?.confidence;
    const dur = completeEv?.details?.duration ?? completeEv?.timestamp;
    const tok = completeEv?.details?.tokens?.total;
    const cost = completeEv?.details?.cost;
    const guardVerdict = guardEv?.details?.guard?.verdict;
    const guardRisk = guardEv?.details?.guard?.risk;
    const model = genEv?.details?.model;
    const dominantLayer = layersEv?.details?.dominantLayer;
    const stageCount = messageTimeline.length;

    // Build compact summary segments
    const segments: Array<{ sigil: string; text: string }> = [];
    if (method)
      segments.push({
        sigil: '◊',
        text: `${method}${confidence ? ` ${Math.round(confidence * 100)}%` : ''}`,
      });
    if (guardVerdict)
      segments.push({ sigil: '△', text: guardVerdict === 'pass' ? 'passed' : guardVerdict });
    if (dominantLayer) segments.push({ sigil: '→', text: dominantLayer });
    if (model)
      segments.push({
        sigil: '⊕',
        text: model
          .replace(/^(?:meta-llama|anthropic|mistralai|deepseek|openai|google)\//, '')
          .replace(/:free$/, ''),
      });
    if (tok) segments.push({ sigil: '○', text: `${tok.toLocaleString()}t` });
    if (dur != null) segments.push({ sigil: '', text: formatDuration(dur) });
    if (cost && cost > 0) segments.push({ sigil: '', text: `$${cost.toFixed(4)}` });

    return (
      <div className="mt-1">
        {/* Rich compact summary — click to expand */}
        <button
          type="button"
          onClick={toggleExpand}
          className="flex items-center gap-1 flex-wrap font-mono text-[9px] text-relic-silver/70 dark:text-relic-slate/60 hover:text-relic-slate dark:hover:text-relic-silver transition-colors pl-4 border-l-2 border-relic-ghost dark:border-relic-slate/20"
        >
          <span className={`transition-transform duration-150 ${expanded ? '' : '-rotate-90'}`}>
            &#9662;
          </span>
          {segments.map((seg, i) => (
            <span key={i} className="flex items-center gap-0.5">
              {i > 0 && <span className="text-relic-ghost dark:text-relic-slate/30">·</span>}
              {seg.sigil && <span className="text-relic-silver/40">{seg.sigil}</span>}
              <span>{seg.text}</span>
            </span>
          ))}
        </button>

        {/* Expanded: rich detail breakdown */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="pl-6 py-2 space-y-1.5 font-mono text-[8px] text-relic-silver/60 dark:text-relic-slate/50 border-l-2 border-relic-ghost dark:border-relic-slate/20">
                {method && (
                  <div>
                    <span className="text-relic-silver/40">◊ FUSION</span> {method}
                    {confidence ? ` · ${Math.round(confidence * 100)}% confidence` : ''}
                    {routingEv?.details?.methodology?.reason
                      ? ` · ${routingEv.details.methodology.reason}`
                      : ''}
                  </div>
                )}
                {guardEv?.details?.guard && (
                  <div>
                    <span className="text-relic-silver/40">△ GUARD</span> {guardVerdict}
                    {guardRisk ? ` · risk ${Math.round(guardRisk * 100)}%` : ''}
                    {guardEv.details.guard.checks?.length
                      ? ` · ${guardEv.details.guard.checks.join(', ')}`
                      : ''}
                  </div>
                )}
                {model && (
                  <div>
                    <span className="text-relic-silver/40">⊕ PROVIDER</span>{' '}
                    {model
                      .replace(/^(?:meta-llama|anthropic|mistralai|deepseek|openai|google)\//, '')
                      .replace(/:free$/, '')}{' '}
                    · {genEv?.details?.provider || 'unknown'}
                  </div>
                )}
                {completeEv?.details?.tokens && (
                  <div>
                    <span className="text-relic-silver/40">○ METRICS</span>{' '}
                    {completeEv.details.tokens.input || 0} in /{' '}
                    {completeEv.details.tokens.output || 0} out ·{' '}
                    {dur != null ? formatDuration(dur) : ''}
                    {cost ? ` · $${cost.toFixed(4)}` : cost === 0 ? ' · $0 (free)' : ''}
                  </div>
                )}
              </div>
              <PipelineTimeline events={messageTimeline} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return null;
}
