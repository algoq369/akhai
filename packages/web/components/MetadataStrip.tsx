'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePipelineStore } from '@/lib/stores/pipeline-store'
import {
  STAGE_META,
  formatElapsed,
  formatTokens,
  formatCost,
  type ThoughtEvent,
  type PipelineStage
} from '@/lib/thought-stream'

interface MetadataStripProps {
  messageId: string
  isStreaming?: boolean
}

/**
 * MetadataStrip - Live pipeline stage visualization
 *
 * Shows live stages during processing, collapses to summary after completion.
 * Inline component that appears under each assistant message.
 */
export default function MetadataStrip({ messageId, isStreaming = false }: MetadataStripProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const currentMetadata = usePipelineStore((state) => state.currentMetadata[messageId])
  const messageMetadata = usePipelineStore((state) => state.messageMetadata[messageId])
  const setHistoryPanelOpen = usePipelineStore((state) => state.setHistoryPanelOpen)

  const events = messageMetadata || []
  const hasEvents = events.length > 0
  const isComplete = events.some((e) => e.stage === 'complete' || e.stage === 'error')
  const isLive = isStreaming && !isComplete

  // Calculate start time from first event
  const startTime = events.length > 0 ? events[0].timestamp : Date.now()

  // Summary calculations
  const summary = useMemo(() => {
    if (events.length === 0) return null

    const completeEvent = events.find((e) => e.stage === 'complete')
    const routingEvent = events.find((e) => e.stage === 'routing')
    const guardEvent = events.find((e) => e.stage === 'guard')
    const lastEvent = events[events.length - 1]

    return {
      methodology: (routingEvent?.data?.methodology as string) || 'direct',
      totalTime: lastEvent.timestamp - startTime,
      tokens: (completeEvent?.data?.tokens as number) || 0,
      cost: (completeEvent?.data?.cost as number) || 0,
      stageCount: events.length,
      guardPassed: (guardEvent?.data?.passed as boolean) ?? true
    }
  }, [events, startTime])

  // Don't render if no events and not streaming
  if (!hasEvents && !isStreaming) {
    return null
  }

  return (
    <div className="mt-3 border-t border-relic-mist/30 dark:border-relic-slate/20 pt-3">
      <AnimatePresence mode="wait">
        {isLive ? (
          // LIVE VIEW - Show current stage with timeline
          <motion.div
            key="live"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-1"
          >
            {/* Current Stage Indicator */}
            {currentMetadata && (
              <div className="flex items-center gap-2 text-xs">
                <motion.span
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className={STAGE_META[currentMetadata.stage].color}
                >
                  {STAGE_META[currentMetadata.stage].symbol}
                </motion.span>
                <span className="uppercase tracking-wider text-relic-slate dark:text-relic-ghost font-medium">
                  {STAGE_META[currentMetadata.stage].label}
                </span>
                <span className="text-relic-silver">·</span>
                <span className="text-relic-silver italic">
                  {currentMetadata.message}
                </span>
                <span className="text-relic-silver/60 ml-auto">
                  {formatElapsed(startTime, currentMetadata.timestamp)}
                </span>
              </div>
            )}

            {/* Stage Timeline */}
            <div className="flex flex-wrap gap-1 mt-2">
              {events.map((event, idx) => (
                <motion.div
                  key={idx}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="group relative"
                >
                  <span
                    className={`text-xs ${STAGE_META[event.stage].color} cursor-help`}
                    title={`${STAGE_META[event.stage].label}: ${event.message}`}
                  >
                    {STAGE_META[event.stage].symbol}
                  </span>
                </motion.div>
              ))}
              {/* Pulsing indicator for next stage */}
              <motion.span
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="text-xs text-relic-silver"
              >
                ···
              </motion.span>
            </div>
          </motion.div>
        ) : hasEvents ? (
          // COLLAPSED/EXPANDED VIEW - Show summary
          <motion.div
            key="summary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Summary Row */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-xs w-full text-left hover:bg-relic-ghost/30 dark:hover:bg-relic-slate/10 rounded px-2 py-1 transition-colors"
            >
              <span className="text-relic-silver">
                {isExpanded ? '▾' : '▸'}
              </span>
              <span className="text-relic-silver">pipeline</span>
              <span className="text-relic-silver">·</span>
              <span className="text-purple-500 font-medium">
                {summary?.methodology}
              </span>
              <span className="text-relic-silver">·</span>
              <span className="text-relic-slate dark:text-relic-ghost">
                {summary ? `${(summary.totalTime / 1000).toFixed(1)}s` : '-'}
              </span>
              <span className="text-relic-silver">·</span>
              <span className="text-relic-slate dark:text-relic-ghost">
                {summary ? formatTokens(summary.tokens) : '-'}
              </span>
              <span className="text-relic-silver">·</span>
              <span className="text-emerald-500">
                {summary ? formatCost(summary.cost) : '-'}
              </span>
              <span className="text-relic-silver">·</span>
              <span className="text-relic-silver">
                {summary?.stageCount || 0} stages
              </span>
              {summary && !summary.guardPassed && (
                <>
                  <span className="text-relic-silver">·</span>
                  <span className="text-amber-500">⚠ guard</span>
                </>
              )}

              {/* Open Panel Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setHistoryPanelOpen(true)
                }}
                className="ml-auto text-relic-silver hover:text-relic-slate dark:hover:text-relic-ghost"
                title="Open pipeline history"
              >
                ◇
              </button>
            </button>

            {/* Expanded Timeline */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 pl-4 border-l-2 border-relic-mist/30 dark:border-relic-slate/20 space-y-1">
                    {events.map((event, idx) => (
                      <StageRow
                        key={idx}
                        event={event}
                        startTime={startTime}
                        isLast={idx === events.length - 1}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          // WAITING STATE - Before any events arrive
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-xs text-relic-silver"
          >
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              ◎
            </motion.span>
            <span>Initializing pipeline...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Individual stage row in expanded view
 */
function StageRow({
  event,
  startTime,
  isLast
}: {
  event: ThoughtEvent
  startTime: number
  isLast: boolean
}) {
  const stageMeta = STAGE_META[event.stage]

  return (
    <div className="flex items-start gap-2 text-xs">
      <span className={stageMeta.color}>{stageMeta.symbol}</span>
      <span className="uppercase tracking-wider text-relic-slate dark:text-relic-ghost font-medium w-20">
        {stageMeta.label}
      </span>
      <span className="text-relic-silver flex-1 truncate" title={event.message}>
        {event.message}
      </span>
      <span className="text-relic-silver/60 tabular-nums">
        {formatElapsed(startTime, event.timestamp)}
      </span>
    </div>
  )
}
