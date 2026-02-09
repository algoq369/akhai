'use client'

/**
 * PipelineHistoryPanel — AI Reasoning History drawer.
 * Narrates what the AI actually thought: query analysis, why it chose
 * its methodology, which layers activated and why, guard reasoning.
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSideCanalStore } from '@/lib/stores/side-canal-store'
import { formatDuration } from '@/lib/thought-stream'

interface Message { id: string; role: 'user' | 'assistant'; content: string }
interface PipelineHistoryPanelProps {
  isOpen: boolean; onToggle: () => void; messages: Message[]
}

export default function PipelineHistoryPanel({ isOpen, onToggle, messages }: PipelineHistoryPanelProps) {
  const messageMetadata = useSideCanalStore((s) => s.messageMetadata)
  const [expandedMsg, setExpandedMsg] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const queryLookup = useMemo(() => {
    const lookup: Record<string, string> = {}
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].role === 'assistant' && i > 0 && messages[i - 1].role === 'user')
        lookup[messages[i].id] = messages[i - 1].content
    }
    return lookup
  }, [messages])

  const groups = useMemo(() => {
    const entries = Object.entries(messageMetadata || {})
    if (!entries.length) return []
    return entries.map(([msgId, events]) => {
      const ev = (s: string) => events.find(e => e.stage === s)
      const routingEv = ev('routing')
      const layersEv = ev('layers')
      const guardEv = ev('guard')
      const genEv = ev('generating')
      const completeEv = ev('complete')
      const receivedEv = ev('received')
      const reasoningEv = ev('reasoning')
      const analysisEv = ev('analysis')
      const d = routingEv?.details || {}
      const ld = layersEv?.details || {}
      const receivedText = receivedEv?.data?.replace('query: ', '').replace(/"/g, '') || ''

      // Extract rich layer data
      const layerData = ld.layers || {}
      const allLayers = Object.entries(layerData)
        .sort(([_, a]: [string, any], [__, b]: [string, any]) => b.weight - a.weight)
        .map(([_, v]: [string, any]) => ({
          name: v.name, weight: v.weight, activated: v.activated, keywords: v.keywords || []
        }))
      const activatedLayers = allLayers.filter(l => l.activated)

      // Extract methodology scores with reasons
      const methScores: any[] = d.methodologyScores || []
      const selectedScore = methScores.find((m: any) => m.methodology === d.methodology?.selected)

      // Build narrative reasoning lines
      const narrativeLines: string[] = []

      // 1. Query analysis narrative
      const qa = d.queryAnalysis as any
      if (qa) {
        const traits: string[] = []
        if (qa.isCreative) traits.push('creative')
        if (qa.isMathematical) traits.push('mathematical')
        if (qa.requiresTools) traits.push('tool-assisted')
        if (qa.requiresMultiPerspective) traits.push('multi-perspective')
        const complexPct = Math.round(qa.complexity * 100)
        narrativeLines.push(`Detected ${qa.queryType} query (${complexPct}% complexity${traits.length ? ', ' + traits.join(', ') : ''})`)
        if (qa.keywords?.length) narrativeLines.push(`Key signals: ${qa.keywords.join(', ')}`)
      }

      // 2. Methodology selection narrative
      if (selectedScore?.reasons?.length) {
        narrativeLines.push(`Chose ${d.methodology?.selected?.toUpperCase()} because: ${selectedScore.reasons.join(', ')}`)
      } else if (d.methodology?.reason) {
        narrativeLines.push(`Chose ${d.methodology?.selected?.toUpperCase()}: ${d.methodology.reason}`)
      }

      // 3. Layer activation narrative
      if (activatedLayers.length > 0) {
        const layerNarr = activatedLayers.map(l => {
          const kw = l.keywords?.length ? ` (triggered by: ${l.keywords.join(', ')})` : ''
          return `${l.name}${kw}`
        })
        narrativeLines.push(`Activated layers: ${layerNarr.join(' → ')}`)
      }

      // 4. Path activations
      const paths = (ld.pathActivations || []) as any[]
      if (paths.length > 0) {
        narrativeLines.push(`Neural paths: ${paths.map((p: any) => `${p.from}→${p.to}: ${p.description}`).join('; ')}`)
      }

      // 5. MetaCore intent (new queries)
      const ri = reasoningEv?.details?.reasoning as any
      if (ri?.intent) narrativeLines.push(`Intent: ${ri.intent}`)
      if (ri?.providerReason) narrativeLines.push(`Model selection: ${ri.providerReason}`)

      // 6. Analysis insights (new queries)
      const ai = analysisEv?.details?.analysis as any
      if (ai?.purified) narrativeLines.push(`⚡ Response purified: ${ai.antipatternRisk} antipatterns removed`)
      if (ai?.synthesisInsight) narrativeLines.push(`Synthesis: "${ai.synthesisInsight}"`)

      return {
        messageId: msgId,
        queryText: queryLookup[msgId] || receivedText || '',
        narrativeLines,
        // Quick summary for collapsed view
        summary: narrativeLines[0] || d.methodology?.reason || d.methodology?.selected || '—',
        // Method scores for comparison
        methScores: methScores.map((m: any) => ({ method: m.methodology, score: m.score, reasons: m.reasons || [] })),
        // Layers for visualization
        allLayers,
        dominantLayer: ld.dominantLayer || '',
        // Guard
        guardVerdict: guardEv?.details?.guard?.verdict || '—',
        guardRisk: guardEv?.details?.guard?.risk || 0,
        guardReasons: d.guardReasons || guardEv?.details?.guard?.checks || [],
        // Lenses
        activeLenses: d.activeLenses || [],
        processingMode: d.processingMode || '',
        // Model
        model: genEv?.details?.model || '',
        provider: genEv?.details?.provider || '',
        // Stats
        method: d.methodology?.selected || '—',
        confidence: d.confidence,
        duration: completeEv?.details?.duration ?? completeEv?.timestamp,
        tokens: completeEv?.details?.tokens || { input: 0, output: 0, total: 0 },
        cost: completeEv?.details?.cost || 0,
        isComplete: events.some(e => e.stage === 'complete'),
        isError: events.some(e => e.stage === 'error'),
        lastTimestamp: events[events.length - 1]?.timestamp ?? 0,
      }
    }).sort((a, b) => b.lastTimestamp - a.lastTimestamp)
  }, [messageMetadata, queryLookup])

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0 }, [groups.length])
  const totalTokens = groups.reduce((s, g) => s + (g.tokens.total || 0), 0)
  const totalCost = groups.reduce((s, g) => s + g.cost, 0)

  return (
    <>
      <button onClick={onToggle}
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-0.5 px-1 py-2.5 rounded-l-md border border-r-0 transition-all duration-200 ${
          isOpen ? 'bg-relic-void text-relic-ghost border-relic-slate/60'
            : 'bg-white/80 dark:bg-relic-void/80 text-relic-silver dark:text-relic-slate/60 border-relic-mist/30 dark:border-relic-slate/20 hover:text-relic-slate dark:hover:text-relic-silver backdrop-blur-sm'
        }`}>
        <span className="text-[9px] font-mono">◇</span>
        <span className="text-[6px] font-mono uppercase tracking-widest" style={{ writingMode: 'vertical-rl' }}>history</span>
        {groups.length > 0 && <span className={`text-[7px] font-mono ${isOpen ? 'text-emerald-400' : 'text-relic-silver/40'}`}>{groups.length}</span>}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed right-0 top-0 bottom-0 z-30 w-[400px] bg-white dark:bg-[#0a0a0b] border-l border-relic-mist/30 dark:border-relic-slate/20 shadow-2xl flex flex-col font-mono">
            <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-relic-mist/20 dark:border-relic-slate/15">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-widest text-relic-slate dark:text-relic-silver/80">AI Reasoning</span>
                <button onClick={onToggle} className="text-relic-silver/40 hover:text-relic-slate text-[11px] p-1">✕</button>
              </div>
              {groups.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-2 text-[9px]">
                  {[['Queries', String(groups.length)], ['Tokens', totalTokens.toLocaleString()], ['Cost', `$${totalCost.toFixed(4)}`]].map(([l, v]) => (
                    <div key={l} className="bg-relic-ghost/50 dark:bg-relic-slate/10 rounded px-2 py-1.5 text-center">
                      <div className="text-[10px] text-relic-slate dark:text-relic-silver/90 font-medium">{v}</div>
                      <div className="text-[7px] text-relic-silver/40 uppercase tracking-wider mt-0.5">{l}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto">
              {groups.length === 0 ? (
                <div className="px-4 py-16 text-center text-[9px] text-relic-silver/30">
                  <div className="text-[18px] mb-3 opacity-15">◇</div>no reasoning data yet
                </div>
              ) : groups.map((g, i) => (
                <Entry key={g.messageId} g={g} idx={groups.length - i}
                  open={expandedMsg === g.messageId}
                  toggle={() => setExpandedMsg(expandedMsg === g.messageId ? null : g.messageId)} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════ */
/* Entry — one query's full reasoning trace                      */
/* ═══════════════════════════════════════════════════════════════ */

function Entry({ g, idx, open, toggle }: { g: any; idx: number; open: boolean; toggle: () => void }) {
  return (
    <div className="border-b border-relic-mist/10 dark:border-relic-slate/10">
      {/* Collapsed */}
      <button type="button" onClick={toggle} className="w-full px-4 py-3 text-left hover:bg-relic-ghost/30 dark:hover:bg-relic-slate/5 transition-colors">
        <div className="flex items-start gap-2">
          <span className="text-[8px] text-relic-silver/25 mt-0.5 shrink-0">#{idx}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-relic-slate dark:text-relic-silver/80 leading-snug line-clamp-2">
              {g.queryText || <span className="text-relic-silver/30 italic">query unavailable</span>}
            </p>
            <p className="text-[8px] text-indigo-400/60 mt-1 line-clamp-1">→ {g.summary}</p>
            <div className="flex items-center gap-1.5 mt-1 text-[7px] text-relic-silver/30">
              <span className="uppercase">{g.method}</span>
              {g.confidence != null && g.confidence > 0 && <><span>·</span><span>{Math.round(g.confidence * 100)}%</span></>}
              <span>·</span><span>{(g.tokens.total || 0).toLocaleString()}t</span>
              {g.duration != null && <><span>·</span><span>{formatDuration(g.duration)}</span></>}
              {g.cost > 0 && <><span>·</span><span>${g.cost.toFixed(4)}</span></>}
            </div>
          </div>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1 ${g.isError ? 'bg-red-500' : g.isComplete ? 'bg-emerald-500/70' : 'bg-amber-400 animate-pulse'}`} />
        </div>
      </button>

      {/* Expanded — full reasoning narrative */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-2.5">

              {/* ── REASONING NARRATIVE ── */}
              {g.narrativeLines.length > 0 && (
                <div className="bg-relic-ghost/30 dark:bg-relic-slate/5 rounded-md px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-[9px] text-indigo-400">∵</span>
                    <span className="text-[7px] uppercase tracking-widest text-indigo-400/70">AI Reasoning</span>
                  </div>
                  <div className="space-y-1.5">
                    {g.narrativeLines.map((line: string, i: number) => (
                      <p key={i} className={`text-[9px] leading-relaxed ${
                        line.startsWith('⚡') ? 'text-amber-500/70' :
                        line.startsWith('Synthesis') ? 'text-purple-400/70 italic' :
                        line.startsWith('Key signals') ? 'text-cyan-500/50' :
                        'text-relic-slate dark:text-relic-silver/70'
                      }`}>
                        {i === 0 ? '' : '· '}{line}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* ── METHOD COMPARISON ── */}
              {g.methScores.length > 1 && (
                <div className="bg-relic-ghost/30 dark:bg-relic-slate/5 rounded-md px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-[9px] text-amber-400">◎</span>
                    <span className="text-[7px] uppercase tracking-widest text-amber-400/70">Method Comparison</span>
                  </div>
                  <div className="space-y-1.5">
                    {g.methScores.map((m: any) => (
                      <div key={m.method} className="flex items-center gap-2">
                        <span className={`text-[8px] w-[40px] uppercase ${m.method === g.method ? 'text-amber-400/80 font-medium' : 'text-relic-silver/30'}`}>
                          {m.method}
                        </span>
                        <div className="flex-1 h-1 bg-relic-slate/8 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${m.method === g.method ? 'bg-amber-400/60' : 'bg-relic-silver/15'}`}
                            style={{ width: `${m.score}%` }} />
                        </div>
                        <span className={`text-[7px] w-6 text-right ${m.method === g.method ? 'text-amber-400/60' : 'text-relic-silver/20'}`}>
                          {m.score}%
                        </span>
                      </div>
                    ))}
                    {/* Show reasons for the winner */}
                    {g.methScores[0]?.reasons?.length > 0 && (
                      <p className="text-[7px] text-relic-silver/40 mt-1 pl-[48px]">
                        {g.methScores[0].reasons.join(' · ')}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ── AI LAYERS ── */}
              {g.allLayers.length > 0 && (
                <div className="bg-relic-ghost/30 dark:bg-relic-slate/5 rounded-md px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-[9px] text-purple-400">⬡</span>
                    <span className="text-[7px] uppercase tracking-widest text-purple-400/70">AI Layers</span>
                    {g.dominantLayer && <span className="text-[7px] text-purple-400/50 ml-auto">{g.dominantLayer} dominant</span>}
                  </div>
                  <div className="space-y-1">
                    {g.allLayers.slice(0, 7).map((l: any) => (
                      <div key={l.name}>
                        <div className="flex items-center gap-2">
                          <span className={`text-[7px] w-[55px] truncate ${l.activated ? 'text-purple-400/80' : 'text-relic-silver/25'}`}>
                            {l.name}
                          </span>
                          <div className="flex-1 h-1 bg-relic-slate/8 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${l.activated ? 'bg-purple-400/50' : 'bg-relic-silver/10'}`}
                              style={{ width: `${Math.min(l.weight, 100)}%` }} />
                          </div>
                          <span className={`text-[7px] w-6 text-right ${l.activated ? 'text-purple-400/50' : 'text-relic-silver/15'}`}>
                            {Math.round(l.weight)}%
                          </span>
                        </div>
                        {l.activated && l.keywords?.length > 0 && (
                          <p className="text-[6px] text-purple-300/30 pl-[63px] mt-0.5">{l.keywords.join(', ')}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── GUARD ── */}
              <div className="bg-relic-ghost/30 dark:bg-relic-slate/5 rounded-md px-3 py-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[9px] text-emerald-400">⊘</span>
                  <span className="text-[7px] uppercase tracking-widest text-emerald-400/70">Guard</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[8px] ${g.guardVerdict === 'pass' ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {g.guardVerdict === 'pass' ? '✓ passed' : `⚠ ${g.guardVerdict}`}
                  </span>
                  {g.guardRisk > 0 && <span className="text-[7px] text-relic-silver/25">risk {Math.round(g.guardRisk * 100)}%</span>}
                </div>
                {g.guardReasons?.length > 0 && (
                  <p className="text-[7px] text-relic-silver/35 mt-1">{g.guardReasons.join(' · ')}</p>
                )}
              </div>

              {/* ── ACTIVE LENSES ── */}
              {g.activeLenses?.length > 0 && (
                <div className="flex items-center gap-1.5 px-1">
                  <span className="text-[7px] text-relic-silver/30">Lenses:</span>
                  {g.activeLenses.map((l: string) => (
                    <span key={l} className="text-[7px] text-cyan-400/50 bg-cyan-400/5 px-1.5 py-0.5 rounded">{l}</span>
                  ))}
                </div>
              )}

              {/* ── MODEL + USAGE footer ── */}
              <div className="pt-1.5 border-t border-relic-mist/10 dark:border-relic-slate/8">
                {g.model && (
                  <div className="flex items-center gap-2 text-[7px] text-relic-silver/25 mb-1.5">
                    <span>△</span>
                    <span>{g.model}</span>
                    <span className="text-relic-silver/15">({g.provider})</span>
                    {g.processingMode && <span className="text-relic-silver/15">· {g.processingMode}</span>}
                  </div>
                )}
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  {[['In', g.tokens.input], ['Out', g.tokens.output], ['Total', g.tokens.total]].map(([l, v]) => (
                    <div key={l as string} className="bg-relic-ghost/20 dark:bg-relic-slate/8 rounded px-1.5 py-1">
                      <div className="text-[8px] text-relic-slate dark:text-relic-silver/60">{(v as number || 0).toLocaleString()}</div>
                      <div className="text-[6px] text-relic-silver/20 uppercase">{l as string}</div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-3 mt-1.5 text-[7px] text-relic-silver/20">
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
