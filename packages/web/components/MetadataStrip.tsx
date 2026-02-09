'use client'

/**
 * MetadataStrip - Inline pipeline commentary under each assistant message.
 *
 * During streaming: shows current stage (animated symbol + label + data).
 * After completion: shows expandable PipelineTimeline with full history.
 */

import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { STAGE_META, formatDuration } from '@/lib/thought-stream'
import type { ThoughtEvent } from '@/lib/thought-stream'
import { useSideCanalStore } from '@/lib/stores/side-canal-store'
import PipelineTimeline from '@/components/PipelineTimeline'

// Stable empty array to prevent Zustand infinite re-render loop
const EMPTY_TIMELINE: ThoughtEvent[] = []

interface MetadataStripProps {
  messageId: string
}

export default function MetadataStrip({ messageId }: MetadataStripProps) {
  const currentMetadata = useSideCanalStore(
    (s) => s.currentMetadata?.[messageId] ?? null
  )
  const messageTimeline = useSideCanalStore(
    (s) => s.messageMetadata?.[messageId] ?? EMPTY_TIMELINE
  )

  const [phase, setPhase] = useState<'live' | 'summary' | 'hidden'>('live')
  const [expanded, setExpanded] = useState(false)

  const isTerminal =
    currentMetadata?.stage === 'complete' || currentMetadata?.stage === 'error'

  useEffect(() => {
    if (!currentMetadata) {
      // If we have timeline history but no current metadata, show summary
      if (messageTimeline.length > 0) {
        setPhase('summary')
      }
      return
    }

    if (isTerminal) {
      // Brief pause on the terminal stage, then switch to summary
      const timer = setTimeout(() => setPhase('summary'), 1500)
      return () => clearTimeout(timer)
    } else {
      setPhase('live')
    }
  }, [currentMetadata, isTerminal, messageTimeline.length])

  const toggleExpand = useCallback(() => setExpanded((v) => !v), [])

  // Nothing to show
  if (!currentMetadata && messageTimeline.length === 0) return null

  // ── LIVE phase: animated current stage ────────────────────────
  if (phase === 'live' && currentMetadata) {
    const meta = STAGE_META[currentMetadata.stage] || STAGE_META.received
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMetadata.stage}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 0.8, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="pl-4 border-l-2 border-relic-ghost dark:border-relic-slate/20 mt-1"
        >
          <div className="flex items-center gap-1.5 font-mono text-[9px] text-relic-silver dark:text-relic-slate">
            <span style={{ color: meta.color }}>{meta.symbol}</span>
            <span className="uppercase tracking-wider" style={{ color: meta.color }}>
              {meta.label}
            </span>
            {currentMetadata.data && (
              <>
                <span className="text-relic-ghost dark:text-relic-slate/30">&middot;</span>
                <span>{currentMetadata.data}</span>
              </>
            )}
            {currentMetadata.timestamp > 0 && (
              <>
                <span className="text-relic-ghost dark:text-relic-slate/30">&middot;</span>
                <span>+{formatDuration(currentMetadata.timestamp)}</span>
              </>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    )
  }

  // ── SUMMARY phase: compact line + expandable timeline ─────────
  if (phase === 'summary' && messageTimeline.length > 0) {
    const completeEv = messageTimeline.find((e) => e.stage === 'complete')
    const routingEv = messageTimeline.find((e) => e.stage === 'routing')
    const method = completeEv?.details?.methodology?.selected ?? routingEv?.details?.methodology?.selected
    const dur = completeEv?.details?.duration ?? completeEv?.timestamp
    const tok = completeEv?.details?.tokens?.total
    const stageCount = messageTimeline.length

    return (
      <div className="mt-1">
        {/* Compact summary — click to expand */}
        <button
          type="button"
          onClick={toggleExpand}
          className="flex items-center gap-1 font-mono text-[9px] text-relic-silver/70 dark:text-relic-slate/60 hover:text-relic-slate dark:hover:text-relic-silver transition-colors pl-4 border-l-2 border-relic-ghost dark:border-relic-slate/20"
        >
          <span className={`transition-transform duration-150 ${expanded ? '' : '-rotate-90'}`}>
            &#9662;
          </span>
          <span className="uppercase tracking-wider">pipeline</span>
          <span className="text-relic-ghost dark:text-relic-slate/30">&middot;</span>
          {method && <span>{method}</span>}
          {dur != null && (
            <>
              <span className="text-relic-ghost dark:text-relic-slate/30">&middot;</span>
              <span>{formatDuration(dur)}</span>
            </>
          )}
          {tok != null && (
            <>
              <span className="text-relic-ghost dark:text-relic-slate/30">&middot;</span>
              <span>{tok}t</span>
            </>
          )}
          <span className="text-relic-ghost dark:text-relic-slate/30">&middot;</span>
          <span>{stageCount} stages</span>
        </button>

        {/* Expanded timeline */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <PipelineTimeline events={messageTimeline} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return null
}
