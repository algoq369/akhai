'use client'

/**
 * PipelineHistoryPanel — Right-side drawer showing session metadata.
 * Styled after Claude Code's clean metadata presentation.
 * Shows actual query text, structured stats, and expandable details.
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSideCanalStore } from '@/lib/stores/side-canal-store'
import { STAGE_META, formatDuration } from '@/lib/thought-stream'
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

  // Build a lookup: assistantMsgId → preceding user query text
  const queryLookup = useMemo(() => {
    const lookup: Record<string, string> = {}
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].role === 'assistant' && i > 0 && messages[i - 1].role === 'user') {
        lookup[messages[i].id] = messages[i - 1].content
      }
    }
    return lookup
  }, [messages])

  // Build groups sorted newest first
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

        // Get actual query text from messages lookup, fallback to received event, then ID
        const receivedText = receivedEv?.data?.replace('query: ', '').replace(/"/g, '') || ''
        const queryText = queryLookup[msgId] || receivedText || ''

        // Extract structured data
        const method = routingEv?.details?.methodology?.selected || completeEv?.details?.methodology?.selected || '—'
        const reason = routingEv?.details?.methodology?.reason || ''
        const confidence = routingEv?.details?.confidence
        const model = generatingEv?.details?.model || completeEv?.details?.model || ''
        const provider = generatingEv?.details?.provider || ''
        const duration = completeEv?.details?.duration ?? completeEv?.timestamp
        const tokensIn = completeEv?.details?.tokens?.input || 0
        const tokensOut = completeEv?.details?.tokens?.output || 0
        const tokensTotal = completeEv?.details?.tokens?.total || 0
        const cost = completeEv?.details?.cost || 0
        const guardVerdict = guardEv?.details?.guard?.verdict || '—'
        const guardRisk = guardEv?.details?.guard?.risk
        const dominantLayer = layersEv?.details?.dominantLayer || ''
        const activatedCount = layersEv?.details?.layers
          ? Object.values(layersEv.details.layers).filter((l: any) => l.activated).length
          : 0
        const isComplete = events.some(e => e.stage === 'complete')
        const isError = events.some(e => e.stage === 'error')

        return {
          messageId: msgId,
          queryText,
          method, reason, confidence,
          model, provider,
          duration,
          tokensIn, tokensOut, tokensTotal,
          cost,
          guardVerdict, guardRisk,
          dominantLayer, activatedCount,
          isComplete, isError,
          stageCount: events.length,
          lastTimestamp: events[events.length - 1]?.timestamp ?? 0,
        }
      })
      .sort((a, b) => b.lastTimestamp - a.lastTimestamp)
  }, [messageMetadata, queryLookup])

  useEffect(() => {
    if (scrollRef.current && groups.length > 0) scrollRef.current.scrollTop = 0
  }, [groups.length])

  const totalTokens = groups.reduce((sum, g) => sum + g.tokensTotal, 0)
  const totalCost = groups.reduce((sum, g) => sum + g.cost, 0)

  return (
    <>
      {/* ── Persistent toggle tab on right edge ── */}
      <button
        onClick={onToggle}
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-0.5 px-1 py-2.5 rounded-l-md border border-r-0 transition-all duration-200 ${
          isOpen
            ? 'bg-relic-void text-relic-ghost border-relic-slate/60'
            : 'bg-white/80 dark:bg-relic-void/80 text-relic-silver dark:text-relic-slate/60 border-relic-mist/30 dark:border-relic-slate/20 hover:text-relic-slate dark:hover:text-relic-silver backdrop-blur-sm'
        }`}
        title={isOpen ? 'Close history' : 'Open history'}
      >
        <span className="text-[9px] font-mono">◇</span>
        <span className="text-[6px] font-mono uppercase tracking-widest" style={{ writingMode: 'vertical-rl' }}>
          history
        </span>
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
            className="fixed right-0 top-0 bottom-0 z-30 w-[360px] bg-white dark:bg-[#0a0a0b] border-l border-relic-mist/30 dark:border-relic-slate/20 shadow-2xl flex flex-col font-mono"
          >
            {/* Header — Claude Code style */}
            <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-relic-mist/20 dark:border-relic-slate/15">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-widest text-relic-slate dark:text-relic-silver/80">Pipeline History</span>
                <button onClick={onToggle} className="text-relic-silver/40 hover:text-relic-slate text-[11px] p-1 transition-colors">✕</button>
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
                  no pipeline data yet
                </div>
              ) : (
                groups.map((g, i) => (
                  <QueryEntry
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

/* ── Stat box for header ── */
function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-relic-ghost/50 dark:bg-relic-slate/10 rounded px-2 py-1.5 text-center">
      <div className="text-[10px] text-relic-slate dark:text-relic-silver/90 font-medium">{value}</div>
      <div className="text-[7px] text-relic-silver/40 dark:text-relic-slate/40 uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════ */
/* QueryEntry — Claude Code style metadata card                  */
/* ═══════════════════════════════════════════════════════════════ */

interface QueryGroup {
  messageId: string
  queryText: string
  method: string
  reason: string
  confidence: number | undefined
  model: string
  provider: string
  duration: number | undefined
  tokensIn: number
  tokensOut: number
  tokensTotal: number
  cost: number
  guardVerdict: string
  guardRisk: number | undefined
  dominantLayer: string
  activatedCount: number
  isComplete: boolean
  isError: boolean
  stageCount: number
}

function QueryEntry({ group: g, index, isExpanded, onToggle }: {
  group: QueryGroup
  index: number
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <div className="border-b border-relic-mist/10 dark:border-relic-slate/10">
      {/* Collapsed row */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 text-left hover:bg-relic-ghost/30 dark:hover:bg-relic-slate/5 transition-colors"
      >
        {/* Query text — the actual question */}
        <div className="flex items-start gap-2">
          <span className="text-[8px] text-relic-silver/30 dark:text-relic-slate/30 mt-0.5 flex-shrink-0">
            #{index}
          </span>
          <p className="text-[10px] text-relic-slate dark:text-relic-silver/80 leading-snug line-clamp-2 flex-1">
            {g.queryText || <span className="text-relic-silver/30 italic">query text unavailable</span>}
          </p>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 ${
            g.isError ? 'bg-red-500' : g.isComplete ? 'bg-emerald-500/70' : 'bg-amber-400 animate-pulse'
          }`} />
        </div>
        {/* Quick stats — Claude Code style one-liner */}
        <div className="flex items-center gap-1.5 mt-1.5 ml-5 text-[8px] text-relic-silver/40 dark:text-relic-slate/40">
          <span className="text-relic-silver/60 dark:text-relic-slate/50 uppercase">{g.method}</span>
          <span>·</span>
          <span>{g.tokensTotal.toLocaleString()}t</span>
          {g.duration != null && <><span>·</span><span>{formatDuration(g.duration)}</span></>}
          {g.cost > 0 && <><span>·</span><span>${g.cost.toFixed(4)}</span></>}
        </div>
      </button>

      {/* Expanded detail — structured metadata table */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-3">
              {/* ── Model & Method ── */}
              <MetaSection title="Routing">
                <MetaRow label="Method" value={g.method} highlight />
                {g.reason && <MetaRow label="Reason" value={g.reason} />}
                {g.confidence != null && <MetaRow label="Confidence" value={`${Math.round(g.confidence * 100)}%`} />}
              </MetaSection>

              {/* ── Model ── */}
              {g.model && (
                <MetaSection title="Model">
                  <MetaRow label="Name" value={g.model} highlight />
                  {g.provider && <MetaRow label="Provider" value={g.provider} />}
                </MetaSection>
              )}

              {/* ── Guard ── */}
              <MetaSection title="Guard">
                <MetaRow
                  label="Verdict"
                  value={g.guardVerdict}
                  valueColor={g.guardVerdict === 'pass' ? '#10b981' : g.guardVerdict === 'fail' ? '#ef4444' : undefined}
                />
                {g.guardRisk != null && (
                  <MetaRow label="Risk" value={`${(g.guardRisk * 100).toFixed(0)}%`} />
                )}
              </MetaSection>

              {/* ── Layers ── */}
              {g.dominantLayer && (
                <MetaSection title="AI Layers">
                  <MetaRow label="Dominant" value={g.dominantLayer} highlight />
                  <MetaRow label="Activated" value={`${g.activatedCount} layers`} />
                </MetaSection>
              )}

              {/* ── Token Usage — Claude Code style ── */}
              <MetaSection title="Usage">
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <UsageBox label="Input" value={g.tokensIn.toLocaleString()} unit="tokens" />
                  <UsageBox label="Output" value={g.tokensOut.toLocaleString()} unit="tokens" />
                  <UsageBox label="Total" value={g.tokensTotal.toLocaleString()} unit="tokens" />
                </div>
                <div className="flex items-center gap-4 mt-1.5">
                  {g.cost > 0 && <MetaRow label="Cost" value={`$${g.cost.toFixed(4)}`} highlight />}
                  {g.duration != null && <MetaRow label="Latency" value={formatDuration(g.duration)} />}
                </div>
              </MetaSection>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Helper components ── */

function MetaSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[7px] uppercase tracking-widest text-relic-silver/30 dark:text-relic-slate/30 mb-1">{title}</div>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function MetaRow({ label, value, highlight, valueColor }: {
  label: string
  value: string
  highlight?: boolean
  valueColor?: string
}) {
  return (
    <div className="flex items-baseline gap-2 text-[9px]">
      <span className="text-relic-silver/35 dark:text-relic-slate/35 w-[70px] flex-shrink-0 text-right">{label}</span>
      <span
        className={highlight ? 'text-relic-slate dark:text-relic-silver/80' : 'text-relic-silver/60 dark:text-relic-slate/50'}
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </span>
    </div>
  )
}

function UsageBox({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="bg-relic-ghost/30 dark:bg-relic-slate/8 rounded px-2 py-1.5 text-center">
      <div className="text-[10px] text-relic-slate dark:text-relic-silver/70 tabular-nums">{value}</div>
      <div className="text-[6px] text-relic-silver/30 dark:text-relic-slate/30 uppercase tracking-wider">{label} {unit}</div>
    </div>
  )
}
