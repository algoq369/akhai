'use client';

/**
 * InlineDialogue — orchestrates 3 views of AI reasoning:
 *
 * ◊ classic  — pipeline metadata timeline (received → routing → guard → complete)
 * ✦ esoteric — cognitive signature lenses (MIRROR, USER GNOSIS, etc.)
 * ⊕ raw      — extended thinking stream (only when available)
 *
 * View tabs appear when 2+ views have data.
 * Default: classic (if pipeline data exists), else esoteric, else raw.
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CognitiveSignature } from '@/lib/cognitive/llm-extractor';
import { useSideCanalStore } from '@/lib/stores/side-canal-store';
import { STAGE_META, formatDuration } from '@/lib/thought-stream';
import type { ThoughtEvent } from '@/lib/thought-stream';
import PipelineTimeline from '@/components/PipelineTimeline';
import RawThinkingView from './RawThinkingView';
import LensView from './LensView';

type ViewMode = 'classic' | 'esoteric' | 'raw';

interface InlineDialogueProps {
  messageId: string;
  signature: CognitiveSignature | null;
  isLoading: boolean;
  rawThinking?: string;
  isThinkingStreaming?: boolean;
}

export default function InlineDialogue({
  messageId,
  signature,
  isLoading,
  rawThinking,
  isThinkingStreaming = false,
}: InlineDialogueProps) {
  // Pipeline metadata from side-canal store
  const messageTimeline = useSideCanalStore(
    (s) => s.messageMetadata?.[messageId] ?? EMPTY_TIMELINE
  );

  const hasClassic = messageTimeline.length > 0;
  const hasEsoteric = !!signature && signature.inline_dialogue.length > 0;
  const hasRaw = !!rawThinking && rawThinking.length > 0;

  const availableViews = useMemo(() => {
    const views: ViewMode[] = [];
    if (hasClassic) views.push('classic');
    if (hasEsoteric) views.push('esoteric');
    if (hasRaw) views.push('raw');
    return views;
  }, [hasClassic, hasEsoteric, hasRaw]);

  // Default view: classic if pipeline data, else esoteric, else raw
  const defaultView: ViewMode = hasClassic ? 'classic' : hasEsoteric ? 'esoteric' : 'raw';
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView);

  // If current view has no data, fall to next available
  const activeView = availableViews.includes(viewMode) ? viewMode : availableViews[0] || 'classic';

  // Still loading — show placeholder
  if (!hasClassic && !hasEsoteric && !hasRaw) {
    if (isLoading || isThinkingStreaming) {
      return (
        <div className="my-2 pl-3 border-l-2 border-indigo-500/20">
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-indigo-400/40 animate-pulse">
            <span>◇</span>
            <span className="uppercase tracking-wider">reflecting...</span>
          </div>
        </div>
      );
    }
    return null;
  }

  const showTabs = availableViews.length >= 2;

  const TAB_CONFIG: Record<ViewMode, { sigil: string; label: string }> = {
    classic: { sigil: '◊', label: 'classic' },
    esoteric: { sigil: '✦', label: 'esoteric' },
    raw: { sigil: '⊕', label: 'raw' },
  };

  return (
    <div className="my-2 pl-3 border-l-2 border-indigo-500/30">
      {/* View mode tabs */}
      {showTabs && (
        <div className="flex items-center gap-0.5 mb-1.5">
          {availableViews.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setViewMode(v)}
              className={`px-2 py-0.5 rounded-full text-[8px] font-mono transition-colors ${
                activeView === v
                  ? 'bg-indigo-500/15 text-indigo-400'
                  : 'text-relic-silver/30 hover:text-relic-silver/50'
              }`}
            >
              {TAB_CONFIG[v].sigil} {TAB_CONFIG[v].label}
            </button>
          ))}
        </div>
      )}

      {/* Content area with cross-fade */}
      <AnimatePresence mode="wait">
        {activeView === 'classic' && hasClassic && (
          <motion.div
            key="classic"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ClassicView events={messageTimeline} />
          </motion.div>
        )}
        {activeView === 'esoteric' && hasEsoteric && (
          <motion.div
            key="esoteric"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <LensView signature={signature!} />
          </motion.div>
        )}
        {activeView === 'raw' && hasRaw && (
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
      </AnimatePresence>
    </div>
  );
}

// Stable empty array to prevent Zustand re-render loop
const EMPTY_TIMELINE: ThoughtEvent[] = [];

/**
 * ClassicView — renders pipeline metadata summary + expandable timeline.
 * Extracted from MetadataStrip summary phase logic.
 */
function ClassicView({ events }: { events: ThoughtEvent[] }) {
  const [expanded, setExpanded] = useState(false);

  const completeEv = events.find((e) => e.stage === 'complete');
  const routingEv = events.find((e) => e.stage === 'routing');
  const layersEv = events.find((e) => e.stage === 'layers');
  const guardEv = events.find((e) => e.stage === 'guard');
  const groundingEv = events.find((e) => e.stage === 'grounding');
  const genEv = [...events].reverse().find((e) => e.stage === 'generating');

  const method =
    completeEv?.details?.methodology?.selected ?? routingEv?.details?.methodology?.selected;
  const confidence = routingEv?.details?.confidence;
  const dur = completeEv?.details?.duration ?? completeEv?.timestamp;
  const tok = completeEv?.details?.tokens?.total;
  const cost = completeEv?.details?.cost;
  const guardVerdict = guardEv?.details?.guard?.verdict;
  const guardRisk = guardEv?.details?.guard?.risk;
  const grounding = groundingEv?.details?.grounding;
  const groundPct = grounding?.score == null ? null : Math.round(grounding.score * 100);
  const groundColor =
    groundPct == null
      ? '#64748b'
      : groundPct >= 80
        ? '#10b981'
        : groundPct >= 50
          ? '#eab308'
          : '#ef4444';
  const model = genEv?.details?.model;
  const dominantLayer = layersEv?.details?.dominantLayer;

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
    <div>
      {/* Compact summary line — click to expand */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 flex-wrap font-mono text-[9px] text-relic-silver/70 dark:text-relic-slate/60 hover:text-relic-slate dark:hover:text-relic-silver transition-colors"
      >
        <span className={`transition-transform duration-150 ${expanded ? '' : '-rotate-90'}`}>
          &#9662;
        </span>
        {segments.length > 0 ? (
          segments.map((seg, i) => (
            <span key={i} className="flex items-center gap-0.5">
              {i > 0 && <span className="text-relic-ghost dark:text-relic-slate/30">·</span>}
              {seg.sigil && <span className="text-relic-silver/40">{seg.sigil}</span>}
              <span>{seg.text}</span>
            </span>
          ))
        ) : (
          <span className="text-relic-silver/40">{events.length} pipeline stages</span>
        )}
      </button>

      {/* Expanded: rich detail breakdown + full timeline */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="py-2 space-y-1.5 font-mono text-[8px] text-relic-silver/60 dark:text-relic-slate/50">
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
              {grounding && (
                <div>
                  <span className="text-relic-silver/40">⊕ GROUNDING</span>{' '}
                  {grounding.mode === 'parametric' ? (
                    <span className="text-relic-silver/50">parametric · not fact-checked</span>
                  ) : grounding.mode === 'heuristic' ? (
                    groundPct == null ? (
                      <span className="text-relic-silver/50">unavailable</span>
                    ) : (
                      <>
                        <span style={{ color: '#94a3b8' }}>≈{groundPct}% lexical support</span>
                        <span className="ml-1.5 inline-block h-1.5 w-16 rounded-full bg-relic-silver/15 align-middle">
                          <span
                            className="block h-full rounded-full"
                            style={{ width: `${groundPct}%`, backgroundColor: '#94a3b8' }}
                          />
                        </span>
                        {grounding.spans?.length
                          ? ` · ${grounding.spans.length} unsupported span${grounding.spans.length > 1 ? 's' : ''}`
                          : ''}
                      </>
                    )
                  ) : groundPct == null ? (
                    <span className="text-relic-silver/50">unavailable</span>
                  ) : (
                    <>
                      <span style={{ color: groundColor }}>{groundPct}% supported</span>
                      <span className="ml-1.5 inline-block h-1.5 w-16 rounded-full bg-relic-silver/15 align-middle">
                        <span
                          className="block h-full rounded-full"
                          style={{ width: `${groundPct}%`, backgroundColor: groundColor }}
                        />
                      </span>
                      {grounding.spans?.length
                        ? ` · ${grounding.spans.length} unsupported span${grounding.spans.length > 1 ? 's' : ''}`
                        : ''}
                    </>
                  )}
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
                  {completeEv.details.tokens.output || 0} out
                  {dur != null ? ` · ${formatDuration(dur)}` : ''}
                  {cost ? ` · $${cost.toFixed(4)}` : cost === 0 ? ' · $0 (free)' : ''}
                </div>
              )}
            </div>
            <PipelineTimeline events={events} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
