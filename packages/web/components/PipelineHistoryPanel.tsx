'use client'

/**
 * PipelineHistoryPanel — Right-side drawer panel showing ALL session
 * pipeline + side-canal metadata. Fully scrollable, always accessible
 * via a persistent toggle button.
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSideCanalStore } from '@/lib/stores/side-canal-store'
import { STAGE_META, formatDuration } from '@/lib/thought-stream'
import type { ThoughtEvent } from '@/lib/thought-stream'

interface PipelineHistoryPanelProps {
  isOpen: boolean
  onToggle: () => void
}

export default function PipelineHistoryPanel({ isOpen, onToggle }: PipelineHistoryPanelProps) {
  const messageMetadata = useSideCanalStore((s) => s.messageMetadata)
  const [expandedMsg, setExpandedMsg] = useState<string | null>(null)
  const [expandedStage, setExpandedStage] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Build message groups sorted newest first
  const groups = useMemo(() => {
    const entries = Object.entries(messageMetadata || {})
    if (entries.length === 0) return []
    return entries
      .map(([msgId, events]) => {
        const completeEv = events.find(e => e.stage === 'complete')
        const routingEv = events.find(e => e.stage === 'routing')
        const generatingEv = events.find(e => e.stage === 'generating')
        const guardEv = events.find(e => e.stage === 'guard')
        const layersEv = events.find(e => e.stage === 'layers')
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
          reason: routingEv?.details?.methodology?.reason || '',
          duration: completeEv?.details?.duration ?? completeEv?.timestamp,
          tokens: completeEv?.details?.tokens,
          cost: completeEv?.details?.cost,
          model: generatingEv?.details?.model || completeEv?.details?.model,
          provider: generatingEv?.details?.provider,
          guardVerdict: guardEv?.details?.guard?.verdict || 'unknown',
          guardRisk: guardEv?.details?.guard?.risk,
          dominantLayer: layersEv?.details?.dominantLayer,
          activatedLayers: layersEv?.details?.layers
            ? Object.values(layersEv.details.layers).filter((l: any) => l.activated)
            : [],
          isComplete: events.some(e => e.stage === 'complete' || e.stage === 'error'),
          isError: events.some(e => e.stage === 'error'),
          lastTimestamp: events[events.length - 1]?.timestamp ?? 0,
          stageCount: events.length,
        }
      })
      .sort((a, b) => b.lastTimestamp - a.lastTimestamp)
  }, [messageMetadata])

  // Auto-scroll to top on new query
  useEffect(() => {
    if (scrollRef.current && groups.length > 0) {
      scrollRef.current.scrollTop = 0
    }
  }, [groups.length])

  // Count total queries
  const totalQueries = groups.length
  const totalTokens = groups.reduce((sum, g) => sum + (g.tokens?.total || 0), 0)
  const totalCost = groups.reduce((sum, g) => sum + (g.cost || 0), 0)

  return (
    <>
      {/* Persistent toggle button — always visible on right side */}
      <button
        onClick={onToggle}
        className={`fixed right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-1 px-1.5 py-3 rounded-lg border transition-all duration-200 ${
          isOpen
            ? 'bg-relic-void text-white border-relic-slate shadow-lg'
            : 'bg-white/90 dark:bg-relic-void/90 text-relic-silver dark:text-relic-slate border-relic-mist/40 dark:border-relic-slate/30 hover:text-relic-slate dark:hover:text-relic-silver hover:border-relic-slate/40 shadow-sm backdrop-blur-sm'
        }`}
        title={isOpen ? 'Close pipeline history' : 'Open pipeline history'}
      >
        <span className="text-[10px] font-mono">◇</span>
        <span className="text-[7px] font-mono uppercase tracking-widest writing-mode-vertical" style={{ writingMode: 'vertical-rl' }}>
          history
        </span>
        {totalQueries > 0 && (
          <span className={`text-[7px] font-mono mt-1 ${isOpen ? 'text-emerald-400' : 'text-relic-silver/60'}`}>
            {totalQueries}
          </span>
        )}
      </button>

      {/* Drawer panel — slides from right */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed right-0 top-0 bottom-0 z-30 w-[340px] bg-white/95 dark:bg-relic-void/95 backdrop-blur-md border-l border-relic-mist/40 dark:border-relic-slate/30 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-relic-mist/30 dark:border-relic-slate/20">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-[11px] font-mono uppercase tracking-wider text-relic-slate dark:text-relic-silver">
                  ◇ pipeline history
                </h2>
                <button
                  onClick={onToggle}
                  className="text-[10px] font-mono text-relic-silver hover:text-relic-slate dark:hover:text-relic-silver transition-colors p-1"
                >
                  ✕
                </button>
              </div>
              {/* Session stats */}
              {totalQueries > 0 && (
                <div className="flex items-center gap-3 text-[8px] font-mono text-relic-silver/60 dark:text-relic-slate/50">
                  <span>{totalQueries} queries</span>
                  <span>·</span>
                  <span>{totalTokens.toLocaleString()} tokens</span>
                  <span>·</span>
                  <span>${totalCost.toFixed(4)}</span>
                </div>
              )}
            </div>

            {/* Scrollable query list */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
              {groups.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <div className="text-[20px] mb-2 opacity-20">◇</div>
                  <p className="text-[9px] font-mono text-relic-silver/40">no pipeline data yet</p>
                  <p className="text-[8px] font-mono text-relic-silver/30 mt-1">send a query to begin</p>
                </div>
              ) : (
                <div className="divide-y divide-relic-mist/15 dark:divide-relic-slate/15">
                  {groups.map((group) => (
                    <QueryBlock
                      key={group.messageId}
                      group={group}
                      isExpanded={expandedMsg === group.messageId}
                      expandedStage={expandedStage}
                      onToggleExpand={() => setExpandedMsg(expandedMsg === group.messageId ? null : group.messageId)}
                      onToggleStage={(id) => setExpandedStage(expandedStage === id ? null : id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════ */
/* QueryBlock — One query's complete metadata                    */
/* ═══════════════════════════════════════════════════════════════ */

interface QueryGroup {
  messageId: string
  events: ThoughtEvent[]
  pipelineEvents: ThoughtEvent[]
  canalEvents: ThoughtEvent[]
  query: string
  method: string
  reason: string
  duration: number | undefined
  tokens: { input: number; output: number; total: number } | undefined
  cost: number | undefined
  model: string | undefined
  provider: string | undefined
  guardVerdict: string
  guardRisk: number | undefined
  dominantLayer: string | undefined
  activatedLayers: any[]
  isComplete: boolean
  isError: boolean
  stageCount: number
}

function QueryBlock({
  group, isExpanded, expandedStage, onToggleExpand, onToggleStage
}: {
  group: QueryGroup
  isExpanded: boolean
  expandedStage: string | null
  onToggleExpand: () => void
  onToggleStage: (id: string) => void
}) {
  return (
    <div className="px-3 py-2.5">
      {/* Query header — always visible */}
      <button
        type="button"
        onClick={onToggleExpand}
        className="w-full text-left"
      >
        {/* Query text */}
        <div className="flex items-start gap-2">
          <span className={`text-[8px] mt-0.5 transition-transform flex-shrink-0 ${isExpanded ? '' : '-rotate-90'}`}>▾</span>
          <span className="text-[10px] font-mono text-relic-slate dark:text-relic-silver leading-snug line-clamp-2 flex-1">
            {group.query}
          </span>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 ${
            group.isError ? 'bg-red-500' : group.isComplete ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'
          }`} />
        </div>

        {/* Quick stats row */}
        <div className="flex items-center gap-1.5 mt-1 ml-4 text-[8px] font-mono text-relic-silver/50 dark:text-relic-slate/50">
          <span className="uppercase text-relic-silver/70 dark:text-relic-slate/70">{group.method}</span>
          {group.duration != null && <span>· {formatDuration(group.duration)}</span>}
          {group.tokens && <span>· {group.tokens.total}t</span>}
          {group.cost != null && <span>· ${group.cost.toFixed(4)}</span>}
          <span>· {group.stageCount} stages</span>
        </div>
      </button>

      {/* Expanded: full reasoning + pipeline */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="mt-2 ml-2 space-y-2">
              {/* ── Reasoning Summary Card ── */}
              <div className="bg-relic-ghost/40 dark:bg-relic-slate/10 rounded-md px-3 py-2 space-y-1.5">
                <div className="text-[7px] font-mono uppercase tracking-wider text-relic-silver/50 dark:text-relic-slate/40">reasoning</div>
                
                {/* Method + reason */}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] font-mono text-indigo-500/80">method</span>
                    <span className="text-[9px] font-mono text-relic-slate dark:text-relic-silver">{group.method}</span>
                  </div>
                  {group.reason && (
                    <div className="text-[8px] font-mono text-relic-silver/60 dark:text-relic-slate/50 ml-0 leading-relaxed">
                      → {group.reason}
                    </div>
                  )}
                </div>

                {/* Model + provider */}
                {group.model && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] font-mono text-amber-500/80">model</span>
                    <span className="text-[9px] font-mono text-relic-slate dark:text-relic-silver">{group.model}</span>
                    {group.provider && <span className="text-[8px] font-mono text-relic-silver/40">({group.provider})</span>}
                  </div>
                )}

                {/* Guard */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] font-mono text-emerald-500/80">guard</span>
                  <span className={`text-[9px] font-mono ${group.guardVerdict === 'pass' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {group.guardVerdict}
                  </span>
                  {group.guardRisk != null && (
                    <span className="text-[8px] font-mono text-relic-silver/40">risk: {(group.guardRisk * 100).toFixed(0)}%</span>
                  )}
                </div>

                {/* Dominant layer */}
                {group.dominantLayer && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] font-mono text-purple-500/80">layers</span>
                    <span className="text-[9px] font-mono text-relic-slate dark:text-relic-silver">{group.dominantLayer}</span>
                    {group.activatedLayers.length > 0 && (
                      <span className="text-[8px] font-mono text-relic-silver/40">
                        ({group.activatedLayers.length} active)
                      </span>
                    )}
                  </div>
                )}

                {/* Token breakdown */}
                {group.tokens && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] font-mono text-cyan-500/80">tokens</span>
                    <span className="text-[8px] font-mono text-relic-silver/60 dark:text-relic-slate/50">
                      {group.tokens.input} in → {group.tokens.output} out = {group.tokens.total} total
                    </span>
                  </div>
                )}
              </div>

              {/* ── Pipeline Stages (expandable) ── */}
              <div>
                <div className="text-[7px] font-mono uppercase tracking-wider text-relic-silver/50 dark:text-relic-slate/40 mb-1">pipeline stages</div>
                <div className="space-y-0">
                  {group.pipelineEvents.map((ev) => (
                    <StageRow
                      key={ev.id}
                      ev={ev}
                      isExpanded={expandedStage === ev.id}
                      onToggle={() => onToggleStage(ev.id)}
                    />
                  ))}
                </div>
              </div>

              {/* ── Side Canal section ── */}
              {group.canalEvents.length > 0 && (
                <div>
                  <div className="text-[7px] font-mono uppercase tracking-wider text-cyan-500/50 mb-1">side canal</div>
                  <div className="space-y-0">
                    {group.canalEvents.map((ev) => (
                      <StageRow
                        key={ev.id}
                        ev={ev}
                        isExpanded={expandedStage === ev.id}
                        onToggle={() => onToggleStage(ev.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════ */
/* StageRow — Individual pipeline stage with expandable details  */
/* ═══════════════════════════════════════════════════════════════ */

function StageRow({ ev, isExpanded, onToggle }: { ev: ThoughtEvent; isExpanded: boolean; onToggle: () => void }) {
  const meta = STAGE_META[ev.stage] || STAGE_META.received
  const d = ev.details

  const hasDetails = d && (d.methodology || d.layers || d.guard || d.tokens || d.sideCanal || d.refinementCount != null)

  return (
    <div>
      <button
        type="button"
        onClick={hasDetails ? onToggle : undefined}
        className={`w-full flex items-center gap-1.5 text-[8px] font-mono rounded px-1.5 py-0.5 transition-colors ${
          hasDetails ? 'hover:bg-relic-ghost/40 dark:hover:bg-relic-slate/10 cursor-pointer' : 'cursor-default'
        }`}
      >
        <span style={{ color: meta.color, fontSize: '9px' }}>{meta.symbol}</span>
        <span className="uppercase tracking-wider text-[7px]" style={{ color: meta.color }}>{meta.label}</span>
        <span className="text-relic-silver/60 dark:text-relic-slate/60 truncate flex-1 text-left text-[8px]">{ev.data}</span>
        <span className="text-relic-silver/30 flex-shrink-0 text-[7px]">+{formatDuration(ev.timestamp)}</span>
        {hasDetails && (
          <span className={`text-[7px] transition-transform text-relic-silver/30 ${isExpanded ? '' : '-rotate-90'}`}>▾</span>
        )}
      </button>

      <AnimatePresence>
        {isExpanded && d && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="overflow-hidden ml-5 mb-1"
          >
            <div className="bg-relic-ghost/20 dark:bg-relic-void/20 border-l-2 border-relic-mist/20 dark:border-relic-slate/15 pl-2 py-1 space-y-0.5 text-[8px] font-mono">
              {d.methodology && (
                <>
                  <DetailRow label="method" value={d.methodology.selected} />
                  {d.methodology.reason && <DetailRow label="reason" value={d.methodology.reason} />}
                  {d.methodology.candidates && d.methodology.candidates.length > 0 && (
                    <DetailRow label="alt" value={d.methodology.candidates.join(', ')} />
                  )}
                  {d.confidence != null && <DetailRow label="confidence" value={`${Math.round(d.confidence * 100)}%`} />}
                </>
              )}
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
              {d.guard && (
                <>
                  <DetailRow label="verdict" value={d.guard.verdict} valueColor={d.guard.verdict === 'pass' ? '#10b981' : '#f59e0b'} />
                  <DetailRow label="risk" value={`${((d.guard.risk || 0) * 100).toFixed(0)}%`} />
                  {d.guard.checks && d.guard.checks.length > 0 && <DetailRow label="flags" value={d.guard.checks.join(', ')} />}
                </>
              )}
              {d.tokens && (
                <>
                  <DetailRow label="in" value={`${d.tokens.input}`} />
                  <DetailRow label="out" value={`${d.tokens.output}`} />
                  {d.cost != null && <DetailRow label="cost" value={`$${d.cost.toFixed(4)}`} />}
                  {d.model && <DetailRow label="model" value={d.model} />}
                  {d.duration != null && <DetailRow label="latency" value={formatDuration(d.duration)} />}
                </>
              )}
              {d.sideCanal && (
                <>
                  <DetailRow label="context" value={`${d.sideCanal.contextChars} chars`} />
                  {d.sideCanal.topics.length > 0 && <DetailRow label="topics" value={d.sideCanal.topics.join(', ')} />}
                </>
              )}
              {d.refinementCount != null && <DetailRow label="refine" value={`${d.refinementCount} active`} />}
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
      <span className="text-[7px] text-relic-silver/35 uppercase tracking-wider w-16 flex-shrink-0 text-right">{label}</span>
      <span className="text-relic-slate dark:text-relic-silver/60" style={valueColor ? { color: valueColor } : undefined}>{value}</span>
    </div>
  )
}
