'use client'

/**
 * PipelineHistoryPanel — Toggleable scrollable panel showing
 * all pipeline + side-canal metadata across the entire session.
 *
 * Renders as a slide-up panel anchored near the input area.
 * Each message group shows full pipeline stages with rich details.
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSideCanalStore } from '@/lib/stores/side-canal-store'
import { STAGE_META, formatDuration } from '@/lib/thought-stream'
import type { ThoughtEvent } from '@/lib/thought-stream'

interface PipelineHistoryPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function PipelineHistoryPanel({ isOpen, onClose }: PipelineHistoryPanelProps) {
  const messageMetadata = useSideCanalStore((s) => s.messageMetadata)
  const [expandedMsg, setExpandedMsg] = useState<string | null>(null)
  const [expandedStage, setExpandedStage] = useState<string | null>(null)

  // Build message groups sorted newest first
  const groups = useMemo(() => {
    const entries = Object.entries(messageMetadata || {})
    if (entries.length === 0) return []
    return entries
      .map(([msgId, events]) => {
        const completeEv = events.find(e => e.stage === 'complete')
        const routingEv = events.find(e => e.stage === 'routing')
        const receivedEv = events.find(e => e.stage === 'received')
        const canalEvents = events.filter(e => e.stage === 'side-canal' || e.stage === 'refinements')
        const pipelineEvents = events.filter(e => e.stage !== 'side-canal' && e.stage !== 'refinements')
        return {
          messageId: msgId,
          events,
          pipelineEvents,
          canalEvents,
          query: receivedEv?.data?.replace('query: ', '').replace(/"/g, '') || msgId.slice(0, 8),
          method: completeEv?.details?.methodology?.selected ?? routingEv?.details?.methodology?.selected ?? '?',
          duration: completeEv?.details?.duration ?? completeEv?.timestamp,
          tokens: completeEv?.details?.tokens?.total,
          cost: completeEv?.details?.cost,
          model: completeEv?.details?.model,
          isComplete: events.some(e => e.stage === 'complete' || e.stage === 'error'),
          lastTimestamp: events[events.length - 1]?.timestamp ?? 0,
        }
      })
      .sort((a, b) => b.lastTimestamp - a.lastTimestamp)
  }, [messageMetadata])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: 20, height: 0 }}
          transition={{ duration: 0.2 }}
          className="max-w-3xl mx-auto px-6 mb-2"
        >
          <div className="border border-relic-mist/30 dark:border-relic-slate/30 rounded-lg bg-white/80 dark:bg-relic-void/80 backdrop-blur-sm overflow-hidden shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-relic-mist/20 dark:border-relic-slate/20">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono uppercase tracking-wider text-relic-slate dark:text-relic-silver">
                  &#9671; pipeline history
                </span>
                <span className="text-[8px] font-mono text-relic-silver/60">
                  {groups.length} {groups.length === 1 ? 'query' : 'queries'}
                </span>
              </div>
              <button
                onClick={onClose}
                className="text-[9px] font-mono text-relic-silver hover:text-relic-slate transition-colors"
              >
                &#10005;
              </button>
            </div>

            {/* Scrollable content */}
            <div className="max-h-[320px] overflow-y-auto scrollbar-thin">
              {groups.length === 0 ? (
                <div className="px-3 py-6 text-center text-[9px] font-mono text-relic-silver/50">
                  no pipeline data yet — send a query to begin
                </div>
              ) : (
                <div className="divide-y divide-relic-mist/10 dark:divide-relic-slate/10">
                  {groups.map((group) => (
                    <div key={group.messageId} className="px-3 py-2">
                      {/* Message summary row — click to expand */}
                      <button
                        type="button"
                        onClick={() => setExpandedMsg(expandedMsg === group.messageId ? null : group.messageId)}
                        className="w-full flex items-center gap-2 text-left group"
                      >
                        <span className={`text-[8px] transition-transform ${expandedMsg === group.messageId ? '' : '-rotate-90'}`}>&#9662;</span>
                        <span className="text-[9px] font-mono text-relic-slate dark:text-relic-silver truncate flex-1">
                          {group.query}
                        </span>
                        <span className="flex items-center gap-1 text-[8px] font-mono text-relic-silver/60 flex-shrink-0">
                          <span className="uppercase">{group.method}</span>
                          {group.duration != null && <span>· {formatDuration(group.duration)}</span>}
                          {group.tokens != null && <span>· {group.tokens}t</span>}
                          {group.cost != null && <span>· ${group.cost.toFixed(4)}</span>}
                        </span>
                        {/* Status dot */}
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${group.isComplete ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                      </button>

                      {/* Expanded details */}
                      <AnimatePresence>
                        {expandedMsg === group.messageId && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-1.5 ml-3 space-y-0.5">
                              {/* Pipeline stages */}
                              {group.pipelineEvents.map((ev) => (
                                <StageRow
                                  key={ev.id}
                                  ev={ev}
                                  isExpanded={expandedStage === ev.id}
                                  onToggle={() => setExpandedStage(expandedStage === ev.id ? null : ev.id)}
                                />
                              ))}

                              {/* Side Canal section */}
                              {group.canalEvents.length > 0 && (
                                <div className="mt-1 pt-1 border-t border-relic-mist/10 dark:border-relic-slate/10">
                                  <div className="text-[7px] font-mono uppercase tracking-wider text-cyan-500/60 mb-0.5">side canal</div>
                                  {group.canalEvents.map((ev) => (
                                    <StageRow
                                      key={ev.id}
                                      ev={ev}
                                      isExpanded={expandedStage === ev.id}
                                      onToggle={() => setExpandedStage(expandedStage === ev.id ? null : ev.id)}
                                    />
                                  ))}
                                </div>
                              )}

                              {/* Model info if available */}
                              {group.model && (
                                <div className="text-[7px] font-mono text-relic-silver/40 mt-1">
                                  model: {group.model}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ── Stage Row with expandable details ── */

function StageRow({ ev, isExpanded, onToggle }: { ev: ThoughtEvent; isExpanded: boolean; onToggle: () => void }) {
  const meta = STAGE_META[ev.stage] || STAGE_META.received
  const d = ev.details

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-1.5 text-[8px] font-mono hover:bg-relic-ghost/30 dark:hover:bg-relic-slate/10 rounded px-1 py-0.5 transition-colors"
      >
        <span style={{ color: meta.color }}>{meta.symbol}</span>
        <span className="uppercase tracking-wider" style={{ color: meta.color }}>{meta.label}</span>
        <span className="text-relic-silver/70 dark:text-relic-slate/70 truncate flex-1 text-left">{ev.data}</span>
        <span className="text-relic-silver/40 flex-shrink-0">+{formatDuration(ev.timestamp)}</span>
      </button>

      {/* Expanded detail block */}
      <AnimatePresence>
        {isExpanded && d && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="overflow-hidden ml-4 mb-1"
          >
            <div className="bg-relic-ghost/30 dark:bg-relic-void/30 border border-relic-mist/10 dark:border-relic-slate/10 rounded px-2 py-1 space-y-0.5 text-[8px] font-mono">
              {/* Routing details */}
              {d.methodology && (
                <>
                  <DetailRow label="method" value={d.methodology.selected} />
                  {d.methodology.reason && <DetailRow label="reason" value={d.methodology.reason} />}
                  {d.methodology.candidates && d.methodology.candidates.length > 0 && (
                    <DetailRow label="alternatives" value={d.methodology.candidates.join(', ')} />
                  )}
                  {d.confidence != null && <DetailRow label="confidence" value={`${Math.round(d.confidence * 100)}%`} />}
                </>
              )}
              {/* Layer details */}
              {d.layers && (
                <>
                  {d.dominantLayer && <DetailRow label="dominant" value={d.dominantLayer} />}
                  {Object.entries(d.layers)
                    .filter(([, l]) => (l as any).activated)
                    .sort(([, a], [, b]) => (b as any).weight - (a as any).weight)
                    .slice(0, 5)
                    .map(([id, l]) => (
                      <DetailRow key={id} label={(l as any).name} value={`${Math.round((l as any).weight * 100)}%`} />
                    ))}
                </>
              )}
              {/* Guard details */}
              {d.guard && (
                <>
                  <DetailRow label="verdict" value={d.guard.verdict} valueColor={d.guard.verdict === 'pass' ? '#10b981' : '#f59e0b'} />
                  <DetailRow label="risk" value={`${((d.guard.risk || 0) * 100).toFixed(0)}%`} />
                  {d.guard.checks && d.guard.checks.length > 0 && <DetailRow label="flags" value={d.guard.checks.join(', ')} />}
                </>
              )}
              {/* Token details */}
              {d.tokens && (
                <>
                  <DetailRow label="input" value={`${d.tokens.input} tokens`} />
                  <DetailRow label="output" value={`${d.tokens.output} tokens`} />
                  {d.cost != null && <DetailRow label="cost" value={`$${d.cost.toFixed(4)}`} />}
                  {d.model && <DetailRow label="model" value={d.model} />}
                  {d.duration != null && <DetailRow label="latency" value={formatDuration(d.duration)} />}
                </>
              )}
              {/* Side canal details */}
              {d.sideCanal && (
                <>
                  <DetailRow label="context" value={`${d.sideCanal.contextChars} chars injected`} />
                  {d.sideCanal.topics.length > 0 && <DetailRow label="topics" value={d.sideCanal.topics.join(', ')} />}
                </>
              )}
              {d.refinementCount != null && <DetailRow label="refinements" value={`${d.refinementCount} active`} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function DetailRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[7px] text-relic-silver/40 uppercase tracking-wider w-20 flex-shrink-0 text-right">{label}</span>
      <span className="text-relic-slate dark:text-relic-silver/70" style={valueColor ? { color: valueColor } : undefined}>{value}</span>
    </div>
  )
}
