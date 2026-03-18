'use client'

/**
 * ActivityFeed — Scrolling monospace event log for God View panel.
 * Displays sigil-marked pipeline events in real-time.
 * Data: god-view-store activations + side-canal-store metadata.
 */

import { useRef, useEffect, useState } from 'react'
import { useGodViewStore } from '@/lib/stores/god-view-store'
import { useSideCanalStore } from '@/lib/stores/side-canal-store'

interface FeedEntry {
  id: string
  time: string
  sigil: string
  text: string
}

function formatTime(ts?: number): string {
  const d = ts ? new Date(ts) : new Date()
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function ActivityFeed() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [entries, setEntries] = useState<FeedEntry[]>([])
  const prevActivationsRef = useRef<string>('')

  const activations = useGodViewStore((s) => s.activations)
  const isProcessing = useGodViewStore((s) => s.isProcessing)
  const metadataHistory = useSideCanalStore((s) => s.metadataHistory)
  const currentMetadata = useSideCanalStore((s) => s.currentMetadata)

  // Generate entries from SSE metadata events
  useEffect(() => {
    const allEvents = Object.values(currentMetadata)
    const newEntries: FeedEntry[] = []

    for (const ev of allEvents) {
      const time = formatTime(ev.timestamp)
      const id = `${ev.messageId}-${ev.stage}`

      switch (ev.stage) {
        case 'received':
          newEntries.push({ id, time, sigil: '◊', text: `Query initiated — ${ev.data?.slice(0, 40) || 'processing'}` })
          break
        case 'routing':
          if (ev.details?.methodology?.selected) {
            newEntries.push({ id, time, sigil: '→', text: `Fusion: ${ev.details.methodology.selected.toUpperCase()} selected (${Math.round((ev.details.confidence || 0) * 100)}% confidence)` })
          }
          break
        case 'layers':
          if (ev.details?.dominantLayer) {
            const layerKeys = Object.keys(ev.details.layers || {})
            const topWeight = layerKeys.length > 0 ? (ev.details.layers as any)?.[layerKeys[0]]?.weight || 0 : 0
            newEntries.push({ id, time, sigil: '⊕', text: `${ev.details.dominantLayer} dominant — weight ${Math.round(topWeight)}%` })
          }
          break
        case 'guard':
          if (ev.details?.guard) {
            const g = ev.details.guard
            const risk = Math.round((g.risk || 0) * 100)
            newEntries.push({ id, time, sigil: '△', text: `Guard: ${g.verdict === 'pass' ? 'PASS' : g.verdict} — risk ${risk}%` })
          }
          break
        case 'reasoning':
          if (ev.details?.reasoning?.intent) {
            newEntries.push({ id, time, sigil: '∵', text: `Intent: ${ev.details.reasoning.intent}` })
          }
          break
        case 'generating':
          if (ev.details?.model) {
            newEntries.push({ id, time, sigil: '○', text: `Generating via ${ev.details.model}` })
          }
          break
        case 'analysis':
          if (ev.details?.analysis?.synthesisInsight) {
            newEntries.push({ id, time, sigil: '◇', text: `Synthesis: ${ev.details.analysis.synthesisInsight.slice(0, 50)}` })
          }
          break
        case 'complete':
          newEntries.push({ id, time, sigil: '○', text: `Complete — ${ev.details?.duration ? Math.round(ev.details.duration) + 'ms' : ''} ${ev.details?.cost ? '· $' + ev.details.cost.toFixed(4) : ''}`.trim() })
          break
      }
    }

    if (newEntries.length > 0) {
      setEntries(prev => {
        const existingIds = new Set(prev.map(e => e.id))
        const fresh = newEntries.filter(e => !existingIds.has(e.id))
        if (fresh.length === 0) return prev
        const combined = [...prev, ...fresh]
        return combined.slice(-30)
      })
    }
  }, [currentMetadata])

  // Generate entries from god-view activations changes
  useEffect(() => {
    const key = JSON.stringify({
      methodology: activations.methodology,
      confidence: activations.confidence,
      dom: activations.dominantLayers,
    })
    if (key === prevActivationsRef.current) return
    prevActivationsRef.current = key

    if (!activations.methodology) return

    const time = formatTime()
    const newEntries: FeedEntry[] = []

    if (activations.methodology) {
      newEntries.push({
        id: `act-meth-${Date.now()}`,
        time,
        sigil: '→',
        text: `Methodology: ${activations.methodology} (${Math.round(activations.confidence * 100)}%)`,
      })
    }

    if (activations.dominantLayers.length > 0) {
      newEntries.push({
        id: `act-dom-${Date.now()}`,
        time,
        sigil: '⊕',
        text: `Dominant: ${activations.dominantLayers.join(', ')}`,
      })
    }

    if (activations.guardReasons.length > 0) {
      newEntries.push({
        id: `act-guard-${Date.now()}`,
        time,
        sigil: '△',
        text: `Guard: ${activations.guardReasons.join(', ')}`,
      })
    }

    if (newEntries.length > 0) {
      setEntries(prev => [...prev, ...newEntries].slice(-30))
    }
  }, [activations])

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [entries.length])

  return (
    <div className="flex flex-col h-full bg-black/90 rounded-b-md overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-relic-slate/15">
        <span className="text-[8px] font-mono uppercase tracking-widest text-relic-silver/50">
          Activity Feed
        </span>
        {isProcessing && (
          <span className="text-[7px] font-mono text-amber-400 animate-pulse">LIVE</span>
        )}
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 scrollbar-thin">
        {entries.length === 0 ? (
          <div className="text-[8px] font-mono text-relic-silver/20 text-center py-8">
            awaiting query...
          </div>
        ) : entries.map((entry) => (
          <div key={entry.id} className="flex items-start gap-1.5 text-[9px] font-mono leading-relaxed">
            <span className="text-relic-silver/30 flex-shrink-0">[{entry.time}]</span>
            <span className="text-relic-silver/50 flex-shrink-0">{entry.sigil}</span>
            <span className="text-gray-400 break-words">{entry.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
