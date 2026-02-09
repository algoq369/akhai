'use client'

/**
 * PipelineTimeline — Expandable per-message pipeline history.
 *
 * Shows every stage the AI pipeline went through for a specific message:
 * colored dots, labels, durations, and expandable structured details.
 *
 * Design: monospace, grey-only Code Relic, no emojis.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  STAGE_META,
  formatDuration,
  formatLayerBar,
} from '@/lib/thought-stream'
import type { ThoughtEvent } from '@/lib/thought-stream'

interface PipelineTimelineProps {
  events: ThoughtEvent[]
}

export default function PipelineTimeline({ events }: PipelineTimelineProps) {
  const [expandedStage, setExpandedStage] = useState<string | null>(null)

  if (!events || events.length === 0) return null

  // Deduplicate by stage (keep latest per stage)
  const stageMap = new Map<string, ThoughtEvent>()
  for (const ev of events) {
    stageMap.set(ev.stage, ev)
  }
  const dedupedEvents = Array.from(stageMap.values())

  const lastEvent = dedupedEvents[dedupedEvents.length - 1]
  const isComplete = lastEvent?.stage === 'complete' || lastEvent?.stage === 'error'

  // Summary line from the 'complete' event
  const completeEvent = dedupedEvents.find((e) => e.stage === 'complete')
  const totalDuration = completeEvent?.details?.duration ?? lastEvent?.timestamp
  const totalTokens = completeEvent?.details?.tokens?.total
  const methodology = completeEvent?.details?.methodology?.selected
    ?? dedupedEvents.find((e) => e.stage === 'routing')?.details?.methodology?.selected

  return (
    <div className="font-mono text-[9px] border-l-2 border-relic-ghost dark:border-relic-slate/20 pl-3 mt-1.5 space-y-0">
      {/* Stage dot chain — compact row */}
      <div className="flex items-center gap-1 flex-wrap mb-1">
        {dedupedEvents.map((ev, i) => {
          const meta = STAGE_META[ev.stage] || STAGE_META.received
          return (
            <button
              key={ev.id}
              type="button"
              onClick={() => setExpandedStage(expandedStage === ev.stage ? null : ev.stage)}
              className="flex items-center gap-0.5 hover:opacity-100 transition-opacity cursor-pointer"
              style={{ opacity: expandedStage && expandedStage !== ev.stage ? 0.4 : 0.85 }}
              title={`${meta.label}: ${ev.data}`}
            >
              <span style={{ color: meta.color, fontSize: '10px' }}>{meta.symbol}</span>
              {i < dedupedEvents.length - 1 && (
                <span className="text-relic-ghost dark:text-relic-slate/30 mx-0.5">&rarr;</span>
              )}
            </button>
          )
        })}

        {/* Summary after dots */}
        {isComplete && (
          <span className="ml-1 text-[8px] text-relic-silver dark:text-relic-slate">
            {methodology && <span>{methodology}</span>}
            {totalDuration != null && <span> · {formatDuration(totalDuration)}</span>}
            {totalTokens != null && <span> · {totalTokens}t</span>}
          </span>
        )}
      </div>

      {/* Expanded stage details */}
      <AnimatePresence mode="wait">
        {expandedStage && (
          <motion.div
            key={expandedStage}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <StageDetail events={dedupedEvents} stage={expandedStage} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Stage Detail Panel ──────────────────────────────────────────── */

function StageDetail({ events, stage }: { events: ThoughtEvent[]; stage: string }) {
  const ev = events.find((e) => e.stage === stage)
  if (!ev) return null

  const meta = STAGE_META[stage] || STAGE_META.received
  const d = ev.details

  return (
    <div className="bg-relic-ghost/40 dark:bg-relic-void/40 border border-relic-mist/15 dark:border-relic-slate/15 rounded px-2.5 py-1.5 space-y-1">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <span style={{ color: meta.color }}>{meta.symbol}</span>
        <span className="uppercase tracking-wider text-[8px]" style={{ color: meta.color }}>
          {meta.label}
        </span>
        <span className="text-relic-silver dark:text-relic-slate/60 ml-auto">
          +{formatDuration(ev.timestamp)}
        </span>
      </div>

      {/* Data line */}
      <div className="text-relic-slate dark:text-relic-silver/80">{ev.data}</div>

      {/* Structured details — conditional per stage */}
      {d?.methodology && (
        <div className="space-y-0.5 pt-0.5 border-t border-relic-mist/10 dark:border-relic-slate/10">
          <Row label="method" value={d.methodology.selected} />
          {d.methodology.reason && <Row label="reason" value={d.methodology.reason} />}
          {d.methodology.candidates && d.methodology.candidates.length > 0 && (
            <Row label="candidates" value={d.methodology.candidates.join(', ')} />
          )}
          {d.confidence != null && (
            <Row label="confidence" value={`${Math.round(d.confidence * 100)}%`} />
          )}
        </div>
      )}

      {d?.layers && (
        <div className="space-y-0.5 pt-0.5 border-t border-relic-mist/10 dark:border-relic-slate/10">
          {d.dominantLayer && <Row label="dominant" value={d.dominantLayer} />}
          {Object.entries(d.layers)
            .filter(([, l]) => l.activated)
            .sort(([, a], [, b]) => b.weight - a.weight)
            .slice(0, 5)
            .map(([id, l]) => (
              <div key={id} className="text-relic-slate dark:text-relic-silver/70">
                {formatLayerBar(l.name, Math.round(l.weight * 100))}
              </div>
            ))}
        </div>
      )}

      {d?.guard && (
        <div className="space-y-0.5 pt-0.5 border-t border-relic-mist/10 dark:border-relic-slate/10">
          <Row
            label="verdict"
            value={d.guard.verdict}
            valueColor={d.guard.verdict === 'pass' ? '#10b981' : '#f59e0b'}
          />
          <Row label="risk" value={`${(d.guard.risk * 100).toFixed(0)}%`} />
          {d.guard.checks && d.guard.checks.length > 0 && (
            <Row label="checks" value={d.guard.checks.join(', ')} />
          )}
        </div>
      )}

      {d?.tokens && (
        <div className="space-y-0.5 pt-0.5 border-t border-relic-mist/10 dark:border-relic-slate/10">
          <Row label="input" value={`${d.tokens.input}`} />
          <Row label="output" value={`${d.tokens.output}`} />
          <Row label="total" value={`${d.tokens.total}`} />
          {d.cost != null && <Row label="cost" value={`$${d.cost.toFixed(4)}`} />}
          {d.model && <Row label="model" value={d.model} />}
          {d.duration != null && <Row label="latency" value={formatDuration(d.duration)} />}
        </div>
      )}

      {d?.sideCanal && (
        <div className="space-y-0.5 pt-0.5 border-t border-relic-mist/10 dark:border-relic-slate/10">
          <Row label="context" value={`${d.sideCanal.contextChars} chars`} />
          {d.sideCanal.topics.length > 0 && (
            <Row label="topics" value={d.sideCanal.topics.join(', ')} />
          )}
        </div>
      )}
    </div>
  )
}

/* ── Tiny helper row ──────────────────────────────────────────── */

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[8px] text-relic-silver/50 dark:text-relic-slate/50 uppercase tracking-wider w-16 flex-shrink-0 text-right">
        {label}
      </span>
      <span
        className="text-relic-slate dark:text-relic-silver/80"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </span>
    </div>
  )
}
