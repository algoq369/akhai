'use client'

/**
 * PipelineHistoryPanel — AI Reasoning History drawer.
 * Shows what the AI thought, why it chose its approach, layer activations, and analysis.
 * Extracts reasoning from ALL pipeline events (old + new).
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSideCanalStore } from '@/lib/stores/side-canal-store'
import { formatDuration } from '@/lib/thought-stream'
import type { ThoughtEvent } from '@/lib/thought-stream'

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

  // Map assistant msgId → preceding user query
  const queryLookup = useMemo(() => {
    const lookup: Record<string, string> = {}
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].role === 'assistant' && i > 0 && messages[i - 1].role === 'user') {
        lookup[messages[i].id] = messages[i - 1].content
      }
    }
    return lookup
  }, [messages])

  // Build reasoning groups — extract from ALL available events
  const groups = useMemo(() => {
    const entries = Object.entries(messageMetadata || {})
    if (entries.length === 0) return []
    return entries
      .map(([msgId, events]) => {
        const ev = (stage: string) => events.find(e => e.stage === stage)
        const receivedEv = ev('received')
        const routingEv = ev('routing')
        const layersEv = ev('layers')
        const guardEv = ev('guard')
        const generatingEv = ev('generating')
        const completeEv = ev('complete')
        const reasoningEv = ev('reasoning')
        const analysisEv = ev('analysis')
        const receivedText = receivedEv?.data?.replace('query: ', '').replace(/"/g, '') || ''

        // Extract layer activations
        const layerData = layersEv?.details?.layers || {}
        const activatedLayers = Object.entries(layerData)
          .filter(([_, v]: [string, any]) => v.activated)
          .sort(([_, a]: [string, any], [__, b]: [string, any]) => b.weight - a.weight)
          .map(([_, v]: [string, any]) => ({ name: v.name, weight: v.weight }))

        const allLayers = Object.entries(layerData)
          .sort(([_, a]: [string, any], [__, b]: [string, any]) => b.weight - a.weight)
          .map(([_, v]: [string, any]) => ({ name: v.name, weight: v.weight, activated: v.activated }))

        return {
          messageId: msgId,
          queryText: queryLookup[msgId] || receivedText || '',
          // THINKING — from reasoning event OR fallback to routing
          intent: reasoningEv?.details?.reasoning?.intent || '',
          approach: reasoningEv?.details?.reasoning?.approach
            || routingEv?.details?.methodology?.reason || '',
          providerReason: reasoningEv?.details?.reasoning?.providerReason || '',
          reflectionMode: reasoningEv?.details?.reasoning?.reflectionMode || '',
          ascentLevel: reasoningEv?.details?.reasoning?.ascentLevel || 0,
          // ROUTING — always available
          method: routingEv?.details?.methodology?.selected || '—',
          methodReason: routingEv?.details?.methodology?.reason || '',
          candidates: routingEv?.details?.methodology?.candidates || [],
          confidence: routingEv?.details?.confidence,
          // LAYERS — always available when fusion runs
          dominantLayer: layersEv?.details?.dominantLayer || '',
          activatedLayers,
          allLayers,
          // MODEL — from generating event
          model: generatingEv?.details?.model || '',
          provider: generatingEv?.details?.provider || '',
          // GUARD
          guardVerdict: guardEv?.details?.guard?.verdict || '—',
          guardRisk: guardEv?.details?.guard?.risk || 0,
          guardChecks: guardEv?.details?.guard?.checks || [],
          // ANALYSIS — from analysis event (new queries only)
          antipatternRisk: analysisEv?.details?.analysis?.antipatternRisk || '',
          purified: analysisEv?.details?.analysis?.purified || false,
          synthesisInsight: analysisEv?.details?.analysis?.synthesisInsight || '',
          // STATS
          duration: completeEv?.details?.duration ?? completeEv?.timestamp,
          tokens: completeEv?.details?.tokens || { input: 0, output: 0, total: 0 },
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

  const totalTokens = groups.reduce((sum, g) => sum + (g.tokens.total || 0), 0)
  const totalCost = groups.reduce((sum, g) => sum + g.cost, 0)

  return (
    <>
      {/* Tab on right edge */}
      <button
        onClick={onToggle}
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-0.5 px-1 py-2.5 rounded-l-md border border-r-0 transition-all duration-200 ${
          isOpen
            ? 'bg-relic-void text-relic-ghost border-relic-slate/60'
            : 'bg-white/80 dark:bg-relic-void/80 text-relic-silver dark:text-relic-slate/60 border-relic-mist/30 dark:border-relic-slate/20 hover:text-relic-slate dark:hover:text-relic-silver backdrop-blur-sm'
        }`}
      >
        <span className="text-[9px] font-mono">◇</span>
        <span className="text-[6px] font-mono uppercase tracking-widest" style={{ writingMode: 'vertical-rl' }}>history</span>
        {groups.length > 0 && (
          <span className={`text-[7px] font-mono ${isOpen ? 'text-emerald-400' : 'text-relic-silver/40'}`}>{groups.length}</span>
        )}
      </button>

      {/* Drawer */}
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
                <button onClick={onToggle} className="text-relic-silver/40 hover:text-relic-slate text-[11px] p-1">✕</button>
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
                  <div className="text-[18px] mb-3 opacity-15">◇</div>
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

/* ── StatBox ── */
function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-relic-ghost/50 dark:bg-relic-slate/10 rounded px-2 py-1.5 text-center">
      <div className="text-[10px] text-relic-slate dark:text-relic-silver/90 font-medium">{value}</div>
      <div className="text-[7px] text-relic-silver/40 uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════ */
/* ReasoningEntry — full AI thinking trace per query              */
/* ═══════════════════════════════════════════════════════════════ */

interface LayerInfo { name: string; weight: number; activated?: boolean }
interface ReasoningGroup {
  messageId: string; queryText: string
  intent: string; approach: string; providerReason: string
  reflectionMode: string; ascentLevel: number
  method: string; methodReason: string; candidates: string[]; confidence?: number
  dominantLayer: string; activatedLayers: LayerInfo[]; allLayers: LayerInfo[]
  model: string; provider: string
  guardVerdict: string; guardRisk: number; guardChecks: string[]
  antipatternRisk: string; purified: boolean; synthesisInsight: string
  duration: number | undefined; tokens: { input: number; output: number; total: number }; cost: number
  isComplete: boolean; isError: boolean
}

function ReasoningEntry({ group: g, index, isExpanded, onToggle }: {
  group: ReasoningGroup; index: number; isExpanded: boolean; onToggle: () => void
}) {
  // Build a one-line reasoning summary for collapsed view
  const summary = g.intent
    || g.methodReason
    || (g.dominantLayer ? `${g.dominantLayer} layer dominant` : '')
    || g.method

  return (
    <div className="border-b border-relic-mist/10 dark:border-relic-slate/10">
      {/* Collapsed */}
      <button type="button" onClick={onToggle} className="w-full px-4 py-3 text-left hover:bg-relic-ghost/30 dark:hover:bg-relic-slate/5 transition-colors">
        <div className="flex items-start gap-2">
          <span className="text-[8px] text-relic-silver/25 mt-0.5 flex-shrink-0">#{index}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-relic-slate dark:text-relic-silver/80 leading-snug line-clamp-2">
              {g.queryText || <span className="text-relic-silver/30 italic">query unavailable</span>}
            </p>
            {/* Reasoning preview */}
            <p className="text-[8px] text-indigo-500/70 dark:text-indigo-400/60 mt-1 line-clamp-1">
              → {summary}
            </p>
            {/* Stats row */}
            <div className="flex items-center gap-1.5 mt-1 text-[7px] text-relic-silver/35">
              <span className="uppercase">{g.method}</span>
              <span>·</span>
              <span>{(g.tokens.total || 0).toLocaleString()}t</span>
              {g.duration != null && <><span>·</span><span>{formatDuration(g.duration)}</span></>}
              {g.cost > 0 && <><span>·</span><span>${g.cost.toFixed(4)}</span></>}
            </div>
          </div>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 ${
            g.isError ? 'bg-red-500' : g.isComplete ? 'bg-emerald-500/70' : 'bg-amber-400 animate-pulse'
          }`} />
        </div>
      </button>

      {/* Expanded — full reasoning trace */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2.5">

              {/* ── THINKING: Intent + Approach ── */}
              <TraceBlock icon="∵" title="Thinking" color="#818cf8">
                {g.intent && (
                  <Row label="Intent" value={g.intent} />
                )}
                <Row label="Approach" value={g.approach || g.methodReason || `${g.method} methodology`} />
                {g.providerReason && (
                  <Row label="Model choice" value={g.providerReason} dim />
                )}
                {g.confidence != null && g.confidence > 0 && (
                  <Row label="Confidence" value={`${Math.round(g.confidence * 100)}%`} />
                )}
                {g.candidates.length > 1 && (
                  <Row label="Alternatives" value={g.candidates.join(', ')} dim />
                )}
              </TraceBlock>

              {/* ── AI LAYERS: What activated ── */}
              {g.allLayers.length > 0 && (
                <TraceBlock icon="⬡" title="AI Layers" color="#a855f7">
                  {g.dominantLayer && (
                    <Row label="Dominant" value={g.dominantLayer} highlight />
                  )}
                  <div className="mt-1.5 space-y-1">
                    {g.allLayers.slice(0, 7).map((l) => (
                      <div key={l.name} className="flex items-center gap-2">
                        <span className={`text-[8px] w-[60px] truncate ${l.activated ? 'text-purple-400/80' : 'text-relic-silver/30'}`}>
                          {l.name}
                        </span>
                        <div className="flex-1 h-1 bg-relic-slate/8 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${l.activated ? 'bg-purple-400/60' : 'bg-relic-silver/15'}`}
                            style={{ width: `${Math.min(l.weight, 100)}%` }}
                          />
                        </div>
                        <span className={`text-[7px] w-6 text-right ${l.activated ? 'text-purple-400/60' : 'text-relic-silver/20'}`}>
                          {Math.round(l.weight)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </TraceBlock>
              )}

              {/* ── REFLECTION: Depth (new queries only) ── */}
              {g.ascentLevel > 0 && (
                <TraceBlock icon="◈" title="Reflection" color="#a78bfa">
                  {g.reflectionMode && g.reflectionMode !== 'standard' && (
                    <Row label="Mode" value={g.reflectionMode} />
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[8px] text-relic-silver/50">Depth</span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className={`w-2 h-1 rounded-sm ${i < g.ascentLevel ? 'bg-purple-400/70' : 'bg-relic-slate/10'}`} />
                      ))}
                    </div>
                    <span className="text-[8px] text-purple-400/60">{g.ascentLevel}/10</span>
                  </div>
                </TraceBlock>
              )}

              {/* ── ANALYSIS: Post-processing (new queries) or synthesis ── */}
              {(g.synthesisInsight || g.purified) && (
                <TraceBlock icon="∴" title="Analysis" color="#c084fc">
                  {g.purified && (
                    <p className="text-[8px] text-amber-500/70">
                      ⚡ Response purified — {g.antipatternRisk} antipatterns removed
                    </p>
                  )}
                  {g.synthesisInsight && (
                    <p className="text-[8px] text-relic-silver/60 italic mt-0.5">"{g.synthesisInsight}"</p>
                  )}
                </TraceBlock>
              )}

              {/* ── GUARD ── */}
              <TraceBlock icon="⊘" title="Guard" color="#10b981">
                <div className="flex items-center gap-3">
                  <span className={`text-[8px] ${g.guardVerdict === 'pass' ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {g.guardVerdict === 'pass' ? '✓ passed' : `⚠ ${g.guardVerdict}`}
                  </span>
                  {g.guardRisk > 0 && (
                    <span className="text-[7px] text-relic-silver/30">risk: {Math.round(g.guardRisk * 100)}%</span>
                  )}
                </div>
                {g.guardChecks.length > 0 && (
                  <p className="text-[7px] text-amber-400/50 mt-0.5">{g.guardChecks.join(', ')}</p>
                )}
              </TraceBlock>

              {/* ── MODEL ── */}
              {g.model && (
                <TraceBlock icon="△" title="Model" color="#f59e0b">
                  <Row label="Model" value={g.model} />
                  <Row label="Provider" value={g.provider} dim />
                </TraceBlock>
              )}

              {/* ── USAGE footer ── */}
              <div className="pt-1.5 border-t border-relic-mist/10 dark:border-relic-slate/8">
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <MiniStat label="Input" value={`${(g.tokens.input || 0).toLocaleString()}`} />
                  <MiniStat label="Output" value={`${(g.tokens.output || 0).toLocaleString()}`} />
                  <MiniStat label="Total" value={`${(g.tokens.total || 0).toLocaleString()}`} />
                </div>
                <div className="flex items-center justify-center gap-3 mt-1.5 text-[7px] text-relic-silver/25">
                  {g.duration != null && <span>{formatDuration(g.duration)}</span>}
                  {g.cost > 0 && <span>${g.cost.toFixed(4)}</span>}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Helper Components ── */

function TraceBlock({ icon, title, color, children }: {
  icon: string; title: string; color: string; children: React.ReactNode
}) {
  return (
    <div className="bg-relic-ghost/30 dark:bg-relic-slate/5 rounded-md px-3 py-2">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[9px]" style={{ color }}>{icon}</span>
        <span className="text-[7px] uppercase tracking-widest" style={{ color, opacity: 0.7 }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

function Row({ label, value, dim, highlight }: { label: string; value: string; dim?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-start gap-2 text-[8px] leading-relaxed">
      <span className="text-relic-silver/40 w-[70px] flex-shrink-0">{label}</span>
      <span className={
        highlight ? 'text-purple-400/80' :
        dim ? 'text-relic-silver/40' :
        'text-relic-slate dark:text-relic-silver/70'
      }>{value}</span>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-relic-ghost/20 dark:bg-relic-slate/8 rounded px-1.5 py-1">
      <div className="text-[8px] text-relic-slate dark:text-relic-silver/60">{value}</div>
      <div className="text-[6px] text-relic-silver/25 uppercase">{label}</div>
    </div>
  )
}
