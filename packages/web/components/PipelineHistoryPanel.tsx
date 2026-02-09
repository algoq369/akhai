'use client'

/**
 * PipelineHistoryPanel — Right-side drawer showing AI reasoning traces.
 * Shows what the AI thought, why it chose its approach, and analysis results.
 * Styled after Claude Code's metadata presentation.
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSideCanalStore } from '@/lib/stores/side-canal-store'
import { formatDuration } from '@/lib/thought-stream'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface PipelineHistoryPanelProps {
  isOpen: boolean
  onToggle: () => void
  messages: Message[]
}

export default function PipelineHistoryPanel({ isOpen, onToggle, messages }: PipelineHistoryPanelProps) {
  const messageMetadata = useSideCanalStore((s) => s.messageMetadata)
  const [expandedMsg, setExpandedMsg] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Map assistant msgId -> preceding user query
  const queryLookup = useMemo(() => {
    const lookup: Record<string, string> = {}
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].role === 'assistant' && i > 0 && messages[i - 1].role === 'user') {
        lookup[messages[i].id] = messages[i - 1].content
      }
    }
    return lookup
  }, [messages])

  // Build reasoning-focused groups
  const groups = useMemo(() => {
    const entries = Object.entries(messageMetadata || {})
    if (entries.length === 0) return []
    return entries
      .map(([msgId, events]) => {
        const reasoningEv = events.find(e => e.stage === 'reasoning')
        const analysisEv = events.find(e => e.stage === 'analysis')
        const routingEv = events.find(e => e.stage === 'routing')
        const guardEv = events.find(e => e.stage === 'guard')
        const completeEv = events.find(e => e.stage === 'complete')
        const receivedEv = events.find(e => e.stage === 'received')
        const receivedText = receivedEv?.data?.replace('query: ', '').replace(/"/g, '') || ''

        return {
          messageId: msgId,
          queryText: queryLookup[msgId] || receivedText || '',
          // Reasoning trace
          intent: reasoningEv?.details?.reasoning?.intent || '',
          approach: reasoningEv?.details?.reasoning?.approach || routingEv?.details?.methodology?.reason || '',
          reflectionMode: reasoningEv?.details?.reasoning?.reflectionMode || '',
          ascentLevel: reasoningEv?.details?.reasoning?.ascentLevel || 0,
          providerReason: reasoningEv?.details?.reasoning?.providerReason || '',
          // Analysis trace
          antipatternRisk: analysisEv?.details?.analysis?.antipatternRisk || '',
          purified: analysisEv?.details?.analysis?.purified || false,
          synthesisInsight: analysisEv?.details?.analysis?.synthesisInsight || '',
          dominantAnalysis: analysisEv?.details?.analysis?.dominantLayer || '',
          // Stats
          method: routingEv?.details?.methodology?.selected || '—',
          guardVerdict: guardEv?.details?.guard?.verdict || '—',
          duration: completeEv?.details?.duration ?? completeEv?.timestamp,
          tokens: completeEv?.details?.tokens?.total || 0,
          cost: completeEv?.details?.cost || 0,
          isComplete: events.some(e => e.stage === 'complete'),
          isError: events.some(e => e.stage === 'error'),
          lastTimestamp: events[events.length - 1]?.timestamp ?? 0,
        }
      })
      .sort((a, b) => b.lastTimestamp - a.lastTimestamp)
  }, [messageMetadata, queryLookup])

  useEffect(() => {
    if (scrollRef.current && groups.length > 0) scrollRef.current.scrollTop = 0
  }, [groups.length])

  const totalTokens = groups.reduce((sum, g) => sum + g.tokens, 0)
  const totalCost = groups.reduce((sum, g) => sum + g.cost, 0)

  return (
    <>
      {/* ── Tab on right edge ── */}
      <button
        onClick={onToggle}
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-0.5 px-1 py-2.5 rounded-l-md border border-r-0 transition-all duration-200 ${
          isOpen
            ? 'bg-relic-void text-relic-ghost border-relic-slate/60'
            : 'bg-white/80 dark:bg-relic-void/80 text-relic-silver dark:text-relic-slate/60 border-relic-mist/30 dark:border-relic-slate/20 hover:text-relic-slate dark:hover:text-relic-silver backdrop-blur-sm'
        }`}
      >
        <span className="text-[9px] font-mono">&#9671;</span>
        <span className="text-[6px] font-mono uppercase tracking-widest" style={{ writingMode: 'vertical-rl' }}>history</span>
        {groups.length > 0 && (
          <span className={`text-[7px] font-mono ${isOpen ? 'text-emerald-400' : 'text-relic-silver/40'}`}>{groups.length}</span>
        )}
      </button>

      {/* ── Drawer ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed right-0 top-0 bottom-0 z-30 w-[380px] bg-white dark:bg-[#0a0a0b] border-l border-relic-mist/30 dark:border-relic-slate/20 shadow-2xl flex flex-col font-mono"
          >
            {/* Header */}
            <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-relic-mist/20 dark:border-relic-slate/15">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-widest text-relic-slate dark:text-relic-silver/80">AI Reasoning History</span>
                <button onClick={onToggle} className="text-relic-silver/40 hover:text-relic-slate text-[11px] p-1">&#10005;</button>
              </div>
              {groups.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-2 text-[9px]">
                  <StatBox label="Queries" value={String(groups.length)} />
                  <StatBox label="Tokens" value={totalTokens.toLocaleString()} />
                  <StatBox label="Cost" value={`$${totalCost.toFixed(4)}`} />
                </div>
              )}
            </div>

            {/* Scrollable entries */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto">
              {groups.length === 0 ? (
                <div className="px-4 py-16 text-center text-[9px] text-relic-silver/30">
                  <div className="text-[18px] mb-3 opacity-15">&#9671;</div>
                  no reasoning data yet
                </div>
              ) : (
                groups.map((g, i) => (
                  <ReasoningEntry
                    key={g.messageId}
                    group={g}
                    index={groups.length - i}
                    isExpanded={expandedMsg === g.messageId}
                    onToggle={() => setExpandedMsg(expandedMsg === g.messageId ? null : g.messageId)}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

/* ── Stat Box ── */
function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-relic-ghost/50 dark:bg-relic-slate/10 rounded px-2 py-1.5 text-center">
      <div className="text-[10px] text-relic-slate dark:text-relic-silver/90 font-medium">{value}</div>
      <div className="text-[7px] text-relic-silver/40 uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════ */
/* ReasoningEntry — AI thinking trace per query                   */
/* ═══════════════════════════════════════════════════════════════ */

interface ReasoningGroup {
  messageId: string; queryText: string
  intent: string; approach: string; reflectionMode: string
  ascentLevel: number; providerReason: string
  antipatternRisk: string; purified: boolean
  synthesisInsight: string; dominantAnalysis: string
  method: string; guardVerdict: string
  duration: number | undefined; tokens: number; cost: number
  isComplete: boolean; isError: boolean
}

function ReasoningEntry({ group: g, index, isExpanded, onToggle }: {
  group: ReasoningGroup; index: number; isExpanded: boolean; onToggle: () => void
}) {
  return (
    <div className="border-b border-relic-mist/10 dark:border-relic-slate/10">
      {/* Collapsed: query + quick reasoning summary */}
      <button type="button" onClick={onToggle} className="w-full px-4 py-3 text-left hover:bg-relic-ghost/30 dark:hover:bg-relic-slate/5 transition-colors">
        <div className="flex items-start gap-2">
          <span className="text-[8px] text-relic-silver/25 mt-0.5 flex-shrink-0">#{index}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-relic-slate dark:text-relic-silver/80 leading-snug line-clamp-2">
              {g.queryText || <span className="text-relic-silver/30 italic">query unavailable</span>}
            </p>
            {/* Intent preview — the key reasoning line */}
            {g.intent && (
              <p className="text-[8px] text-indigo-500/70 dark:text-indigo-400/60 mt-1 line-clamp-1">
                &#8594; {g.intent}
              </p>
            )}
            {/* Stats row */}
            <div className="flex items-center gap-1.5 mt-1 text-[7px] text-relic-silver/35 dark:text-relic-slate/35">
              <span className="uppercase">{g.method}</span>
              <span>&#183;</span>
              <span>{g.tokens.toLocaleString()}t</span>
              {g.duration != null && <><span>&#183;</span><span>{formatDuration(g.duration)}</span></>}
              {g.cost > 0 && <><span>&#183;</span><span>${g.cost.toFixed(4)}</span></>}
            </div>
          </div>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 ${
            g.isError ? 'bg-red-500' : g.isComplete ? 'bg-emerald-500/70' : 'bg-amber-400 animate-pulse'
          }`} />
        </div>
      </button>

      {/* Expanded: full reasoning trace */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">

              {/* ── THINKING: What the AI understood ── */}
              {(g.intent || g.approach) && (
                <TraceBlock icon="&#8757;" title="Thinking" color="#818cf8">
                  {g.intent && (
                    <p className="text-[9px] text-relic-slate dark:text-relic-silver/70 leading-relaxed">
                      <span className="text-indigo-400/70">Intent:</span> {g.intent}
                    </p>
                  )}
                  {g.approach && (
                    <p className="text-[9px] text-relic-slate dark:text-relic-silver/70 leading-relaxed mt-0.5">
                      <span className="text-indigo-400/70">Approach:</span> {g.approach}
                    </p>
                  )}
                  {g.providerReason && (
                    <p className="text-[9px] text-relic-silver/50 dark:text-relic-slate/50 leading-relaxed mt-0.5">
                      <span className="text-indigo-400/50">Model:</span> {g.providerReason}
                    </p>
                  )}
                </TraceBlock>
              )}

              {/* ── REFLECTION: How deep it went ── */}
              {(g.reflectionMode || g.ascentLevel > 0) && (
                <TraceBlock icon="&#9672;" title="Reflection" color="#a78bfa">
                  {g.reflectionMode && g.reflectionMode !== 'standard' && (
                    <p className="text-[9px] text-relic-slate dark:text-relic-silver/70">
                      Mode: <span className="text-purple-400">{g.reflectionMode}</span>
                    </p>
                  )}
                  {g.ascentLevel > 0 && (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[8px] text-relic-silver/50">Depth:</span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-1 rounded-sm ${
                              i < g.ascentLevel ? 'bg-purple-400/70' : 'bg-relic-slate/10'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[8px] text-purple-400/60">{g.ascentLevel}/10</span>
                    </div>
                  )}
                </TraceBlock>
              )}

              {/* ── ANALYSIS: Post-processing insights ── */}
              {(g.synthesisInsight || g.purified || g.dominantAnalysis) && (
                <TraceBlock icon="&#8756;" title="Analysis" color="#c084fc">
                  {g.dominantAnalysis && (
                    <p className="text-[9px] text-relic-slate dark:text-relic-silver/70">
                      Dominant layer: <span className="text-purple-300">{g.dominantAnalysis}</span>
                    </p>
                  )}
                  {g.purified && (
                    <p className="text-[9px] text-amber-500/70 mt-0.5">
                      Response purified — {g.antipatternRisk} antipatterns detected and removed
                    </p>
                  )}
                  {g.synthesisInsight && (
                    <p className="text-[9px] text-relic-slate dark:text-relic-silver/60 mt-0.5 italic leading-relaxed">
                      &ldquo;{g.synthesisInsight}&rdquo;
                    </p>
                  )}
                </TraceBlock>
              )}

              {/* ── GUARD: Safety check ── */}
              <TraceBlock icon="&#8856;" title="Guard" color="#10b981">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] ${g.guardVerdict === 'pass' ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {g.guardVerdict === 'pass' ? '\u2713 passed' : `\u26A0 ${g.guardVerdict}`}
                  </span>
                </div>
              </TraceBlock>

              {/* ── USAGE: Compact stats ── */}
              <div className="flex items-center gap-3 pt-1 text-[8px] text-relic-silver/30 dark:text-relic-slate/30 border-t border-relic-mist/10 dark:border-relic-slate/8">
                <span>{g.tokens.toLocaleString()} tokens</span>
                {g.duration != null && <span>{formatDuration(g.duration)}</span>}
                {g.cost > 0 && <span>${g.cost.toFixed(4)}</span>}
                <span className="uppercase">{g.method}</span>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Trace Block wrapper ── */
function TraceBlock({ icon, title, color, children }: {
  icon: string; title: string; color: string; children: React.ReactNode
}) {
  return (
    <div className="bg-relic-ghost/30 dark:bg-relic-slate/5 rounded-md px-3 py-2">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-[10px]" style={{ color }}>{icon}</span>
        <span className="text-[7px] uppercase tracking-widest" style={{ color, opacity: 0.7 }}>{title}</span>
      </div>
      {children}
    </div>
  )
}
