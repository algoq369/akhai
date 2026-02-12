'use client'

import { useState, useEffect } from 'react'
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

interface PipelineHistoryPanelProps {
  selectedMessageId?: string
}

/**
 * PipelineHistoryPanel - Right-side drawer for full pipeline reasoning
 *
 * Shows detailed reasoning narrative for a selected message.
 * Expandable sections: AI Reasoning, Method Comparison, AI Layers, Guard, Model + Usage
 */
export default function PipelineHistoryPanel({ selectedMessageId }: PipelineHistoryPanelProps) {
  const isOpen = usePipelineStore((state) => state.historyPanelOpen)
  const setOpen = usePipelineStore((state) => state.setHistoryPanelOpen)
  const messageMetadata = usePipelineStore((state) => state.messageMetadata)
  const currentMetadata = usePipelineStore((state) => state.currentMetadata)

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    reasoning: true,
    methodology: false,
    layers: false,
    guard: false,
    usage: false
  })

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Get all message IDs with events
  const messageIds = Object.keys(messageMetadata).filter(
    (id) => messageMetadata[id] && messageMetadata[id].length > 0
  )

  // Active message (selected or most recent)
  const activeMessageId = selectedMessageId || messageIds[messageIds.length - 1]
  const events = activeMessageId ? messageMetadata[activeMessageId] || [] : []
  const liveEvent = activeMessageId ? currentMetadata[activeMessageId] : null

  // Extract data from events
  const routingEvent = events.find((e) => e.stage === 'routing')
  const layersEvent = events.find((e) => e.stage === 'layers')
  const guardEvent = events.find((e) => e.stage === 'guard')
  const completeEvent = events.find((e) => e.stage === 'complete')
  const receivedEvent = events.find((e) => e.stage === 'received')

  const startTime = events.length > 0 ? events[0].timestamp : Date.now()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-96 max-w-[90vw] bg-white dark:bg-relic-void border-l border-relic-mist dark:border-relic-slate/30 shadow-xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-relic-mist dark:border-relic-slate/30">
              <div className="flex items-center gap-2">
                <span className="text-purple-500">◇</span>
                <span className="uppercase tracking-wider text-xs font-medium text-relic-slate dark:text-relic-ghost">
                  Pipeline History
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-relic-silver hover:text-relic-slate dark:hover:text-relic-ghost transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {events.length === 0 ? (
                <div className="text-center text-relic-silver text-sm py-8">
                  <p>No pipeline data available</p>
                  <p className="text-xs mt-2">Submit a query to see processing stages</p>
                </div>
              ) : (
                <>
                  {/* Query Section */}
                  {receivedEvent && (
                    <div className="bg-relic-ghost/30 dark:bg-relic-slate/10 rounded-lg p-3">
                      <div className="text-[10px] uppercase tracking-wider text-relic-silver mb-2">
                        Query
                      </div>
                      <p className="text-sm text-relic-slate dark:text-relic-ghost">
                        {receivedEvent.message || 'Unknown query'}
                      </p>
                    </div>
                  )}

                  {/* Live Stage Indicator */}
                  {liveEvent && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/30 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-2 text-xs">
                        <motion.span
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                          className={STAGE_META[liveEvent.stage].color}
                        >
                          {STAGE_META[liveEvent.stage].symbol}
                        </motion.span>
                        <span className="uppercase tracking-wider font-medium text-blue-700 dark:text-blue-300">
                          {STAGE_META[liveEvent.stage].label}
                        </span>
                        <span className="text-blue-500 dark:text-blue-400 ml-auto">
                          {formatElapsed(startTime, liveEvent.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-300 mt-1 italic">
                        {liveEvent.message}
                      </p>
                    </motion.div>
                  )}

                  {/* AI Reasoning Section */}
                  <CollapsibleSection
                    title="AI Reasoning"
                    icon="◈"
                    isExpanded={expandedSections.reasoning}
                    onToggle={() => toggleSection('reasoning')}
                  >
                    <div className="space-y-2">
                      {events.map((event, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-xs"
                        >
                          <span className={STAGE_META[event.stage].color}>
                            {STAGE_META[event.stage].symbol}
                          </span>
                          <div className="flex-1">
                            <span className="font-medium text-relic-slate dark:text-relic-ghost">
                              {STAGE_META[event.stage].label}
                            </span>
                            <p className="text-relic-silver mt-0.5">
                              {event.message}
                            </p>
                          </div>
                          <span className="text-relic-silver/60 tabular-nums">
                            {formatElapsed(startTime, event.timestamp)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>

                  {/* Methodology Section */}
                  {routingEvent && (
                    <CollapsibleSection
                      title="Method Selection"
                      icon="⟐"
                      isExpanded={expandedSections.methodology}
                      onToggle={() => toggleSection('methodology')}
                    >
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-relic-silver">Selected</span>
                          <span className="text-purple-500 font-medium">
                            {(routingEvent.data?.methodology as string) || 'direct'}
                          </span>
                        </div>
                        {routingEvent.data?.confidence !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-relic-silver">Confidence</span>
                            <span className="text-relic-slate dark:text-relic-ghost">
                              {Math.round(Number(routingEvent.data.confidence) * 100)}%
                            </span>
                          </div>
                        )}
                        {typeof routingEvent.data?.reason === 'string' && routingEvent.data.reason && (
                          <div className="mt-2 text-relic-silver italic">
                            {routingEvent.data.reason}
                          </div>
                        )}
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* AI Layers Section */}
                  {layersEvent && (
                    <CollapsibleSection
                      title="AI Layers (Sefirot)"
                      icon="⬡"
                      isExpanded={expandedSections.layers}
                      onToggle={() => toggleSection('layers')}
                    >
                      <div className="space-y-1 text-xs">
                        {typeof layersEvent.data?.dominant === 'string' && layersEvent.data.dominant && (
                          <div className="flex justify-between">
                            <span className="text-relic-silver">Dominant</span>
                            <span className="text-indigo-500 font-medium">
                              {layersEvent.data.dominant}
                            </span>
                          </div>
                        )}
                        {(() => {
                          const activations = layersEvent.data?.activations
                          if (!activations || typeof activations !== 'object') return null
                          return (
                            <div className="mt-2 grid grid-cols-2 gap-1">
                              {Object.entries(activations as Record<string, number>).map(
                                ([name, value]) => (
                                  <div key={name} className="flex items-center gap-1">
                                    <div
                                      className="w-16 h-1.5 bg-relic-ghost dark:bg-relic-slate/30 rounded-full overflow-hidden"
                                    >
                                      <div
                                        className="h-full bg-indigo-500"
                                        style={{ width: `${Number(value) * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] text-relic-silver truncate">
                                    {name}
                                  </span>
                                </div>
                              )
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* Guard Section */}
                  {guardEvent && (
                    <CollapsibleSection
                      title="Grounding Guard"
                      icon="⊘"
                      isExpanded={expandedSections.guard}
                      onToggle={() => toggleSection('guard')}
                    >
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-relic-silver">Status</span>
                          <span
                            className={
                              guardEvent.data?.passed
                                ? 'text-green-500'
                                : 'text-amber-500'
                            }
                          >
                            {guardEvent.data?.passed ? '✓ Passed' : '⚠ Issues'}
                          </span>
                        </div>
                        {Array.isArray(guardEvent.data?.issues) && guardEvent.data.issues.length > 0 && (
                          <div className="mt-2">
                            <span className="text-relic-silver">Issues:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(guardEvent.data.issues as string[]).map((issue, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded text-[10px]"
                                >
                                  {String(issue)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* Model + Usage Section */}
                  {completeEvent && (
                    <CollapsibleSection
                      title="Model + Usage"
                      icon="△"
                      isExpanded={expandedSections.usage}
                      onToggle={() => toggleSection('usage')}
                    >
                      <div className="space-y-2 text-xs">
                        {typeof completeEvent.data?.provider === 'string' && completeEvent.data.provider && (
                          <div className="flex justify-between">
                            <span className="text-relic-silver">Provider</span>
                            <span className="text-relic-slate dark:text-relic-ghost">
                              {completeEvent.data.provider}
                            </span>
                          </div>
                        )}
                        {typeof completeEvent.data?.model === 'string' && completeEvent.data.model && (
                          <div className="flex justify-between">
                            <span className="text-relic-silver">Model</span>
                            <span className="text-relic-slate dark:text-relic-ghost font-mono text-[10px]">
                              {completeEvent.data.model}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-relic-silver">Tokens</span>
                          <span className="text-relic-slate dark:text-relic-ghost">
                            {formatTokens((completeEvent.data?.tokens as number) || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-relic-silver">Latency</span>
                          <span className="text-relic-slate dark:text-relic-ghost">
                            {((completeEvent.timestamp - startTime) / 1000).toFixed(1)}s
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-relic-silver">Cost</span>
                          <span className="text-emerald-500">
                            {formatCost((completeEvent.data?.cost as number) || 0)}
                          </span>
                        </div>
                      </div>
                    </CollapsibleSection>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-relic-mist dark:border-relic-slate/30 p-3">
              <div className="flex items-center justify-between text-[10px] text-relic-silver">
                <span>{messageIds.length} queries in session</span>
                {events.length > 0 && (
                  <span>
                    {events.length} stages · {formatElapsed(startTime, events[events.length - 1]?.timestamp || Date.now())}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/**
 * Collapsible section component
 */
function CollapsibleSection({
  title,
  icon,
  isExpanded,
  onToggle,
  children
}: {
  title: string
  icon: string
  isExpanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="border border-relic-mist/50 dark:border-relic-slate/20 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 p-3 hover:bg-relic-ghost/30 dark:hover:bg-relic-slate/10 transition-colors"
      >
        <span className="text-purple-500">{icon}</span>
        <span className="text-xs uppercase tracking-wider font-medium text-relic-slate dark:text-relic-ghost flex-1 text-left">
          {title}
        </span>
        <span className="text-relic-silver text-xs">
          {isExpanded ? '▾' : '▸'}
        </span>
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0 border-t border-relic-mist/30 dark:border-relic-slate/10">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
