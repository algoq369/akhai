'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Level, LevelInsight } from '@/lib/stores/levels-store'

/**
 * AI COMPUTATIONAL PANEL
 *
 * Center column of each LevelContainer. Three tabbed views:
 * - Layers: 11 AI computational layer activation bars
 * - Insight: Categorized insight list with pills
 * - Mindmap: Placeholder for visual node graph
 *
 * ┌─────────────────────────────────┐
 * │ [Layers]  [Insight]  [Mindmap]  │
 * ├─────────────────────────────────┤
 * │  Active tab content             │
 * ├─────────────────────────────────┤
 * │ 12 data pts · 87% · 3 links    │
 * └─────────────────────────────────┘
 */

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface AIComputationalPanelProps {
  level: Level
  onStartConnection?: (elementId: string, elementType: 'insight' | 'layer') => void
  onCompleteConnection?: (elementId: string, elementType: 'insight' | 'layer') => void
  connectionMode?: boolean
}

type TabId = 'layers' | 'insight' | 'mindmap'

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS — 11 AI Computational Layers
// ═══════════════════════════════════════════════════════════════════

const LAYER_DEFS: { id: number; name: string }[] = [
  { id: 1, name: 'Grounded Output' },
  { id: 2, name: 'Memory Integration' },
  { id: 3, name: 'Structured Logic' },
  { id: 4, name: 'Persistent Patterns' },
  { id: 5, name: 'Balanced Synthesis' },
  { id: 6, name: 'Critical Filtering' },
  { id: 7, name: 'Expansive Context' },
  { id: 8, name: 'Analytical Depth' },
  { id: 9, name: 'Creative Insight' },
  { id: 10, name: 'Strategic Vision' },
  { id: 11, name: 'Hidden Connections' },
]

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function getBarColor(pct: number): string {
  if (pct <= 30) return 'bg-neutral-300'
  if (pct <= 60) return 'bg-purple-300'
  return 'bg-purple-500'
}

function getInsightIcon(category: string): string {
  switch (category) {
    case 'strategy': return '◇'
    case 'insight': return '✦'
    case 'data': return '▣'
    case 'action': return '▸'
    default: return '·'
  }
}

function getCategoryColor(category: string): string {
  switch (category) {
    case 'strategy': return 'text-purple-500'
    case 'insight': return 'text-blue-500'
    case 'data': return 'text-amber-500'
    case 'action': return 'text-green-500'
    default: return 'text-neutral-400'
  }
}

function getCategoryPillStyle(category: string): string {
  switch (category) {
    case 'strategy': return 'bg-purple-100 text-purple-700'
    case 'insight': return 'bg-blue-100 text-blue-700'
    case 'data': return 'bg-amber-100 text-amber-700'
    case 'action': return 'bg-green-100 text-green-700'
    default: return 'bg-neutral-100 text-neutral-600'
  }
}

// ═══════════════════════════════════════════════════════════════════
// CATEGORY PILLS
// ═══════════════════════════════════════════════════════════════════

function CategoryPills({ insights }: { insights: LevelInsight[] }) {
  const counts: Record<string, number> = {}
  insights.forEach((i) => {
    counts[i.category] = (counts[i.category] || 0) + 1
  })

  const entries = Object.entries(counts).filter(([, c]) => c > 0)
  if (entries.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 px-3 py-2">
      {entries.map(([cat, count]) => (
        <span
          key={cat}
          className={`px-2 py-0.5 rounded-full text-[9px] font-mono ${getCategoryPillStyle(cat)}`}
        >
          {cat}({count})
        </span>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// TAB: LAYERS
// ═══════════════════════════════════════════════════════════════════

function LayersTab({
  activeLayerWeights,
  onStartConnection,
  onCompleteConnection,
  connectionMode,
}: {
  activeLayerWeights: Record<number, number>
  onStartConnection?: (elementId: string, elementType: 'layer') => void
  onCompleteConnection?: (elementId: string, elementType: 'layer') => void
  connectionMode?: boolean
}) {
  const hasData = Object.keys(activeLayerWeights).length > 0

  return (
    <motion.div
      key="layers"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="px-3 py-2 space-y-1.5"
    >
      {!hasData && (
        <div className="text-[10px] text-neutral-300 italic text-center py-4">
          Awaiting activation...
        </div>
      )}

      {LAYER_DEFS.map((layer, idx) => {
        const raw = activeLayerWeights[layer.id] ?? 0
        const pct = Math.round(raw * 100)

        return (
          <motion.div
            key={layer.id}
            className="group flex items-center gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: idx * 0.03 }}
          >
            {/* Layer number */}
            <span className="w-6 text-[9px] font-mono text-neutral-400 shrink-0">
              L{layer.id}
            </span>

            {/* Layer name */}
            <span className="w-[120px] text-[10px] text-neutral-600 truncate shrink-0">
              {layer.name}
            </span>

            {/* Bar */}
            <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${getBarColor(pct)}`}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.3, delay: idx * 0.04, type: 'spring', stiffness: 120 }}
              />
            </div>

            {/* Percentage */}
            <span className="w-8 text-[9px] text-neutral-400 font-mono text-right shrink-0">
              {pct}%
            </span>

            {/* Connection dot */}
            {(onStartConnection || onCompleteConnection) && (
              <button
                onClick={() => {
                  if (connectionMode && onCompleteConnection) {
                    onCompleteConnection(`layer-${layer.id}`, 'layer')
                  } else if (onStartConnection) {
                    onStartConnection(`layer-${layer.id}`, 'layer')
                  }
                }}
                className={`
                  w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-200
                  opacity-0 group-hover:opacity-100
                  ${connectionMode
                    ? 'bg-purple-400 shadow-[0_0_3px_rgba(168,85,247,0.5)] opacity-100'
                    : 'bg-neutral-300 hover:bg-neutral-400'
                  }
                `}
                title={connectionMode ? 'Connect here' : 'Start connection'}
              />
            )}
          </motion.div>
        )
      })}
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// TAB: INSIGHT
// ═══════════════════════════════════════════════════════════════════

function InsightTab({
  insights,
  levelId,
  onStartConnection,
  onCompleteConnection,
  connectionMode,
}: {
  insights: LevelInsight[]
  levelId: string
  onStartConnection?: (elementId: string, elementType: 'insight') => void
  onCompleteConnection?: (elementId: string, elementType: 'insight') => void
  connectionMode?: boolean
}) {
  if (insights.length === 0) {
    return (
      <motion.div
        key="insight-empty"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="flex items-center justify-center h-full"
      >
        <span className="text-[10px] text-neutral-300 italic">
          No insights extracted yet
        </span>
      </motion.div>
    )
  }

  return (
    <motion.div
      key="insight"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="flex flex-col h-full"
    >
      {/* Category pills */}
      <CategoryPills insights={insights} />

      {/* Insight list */}
      <div className="overflow-y-auto max-h-[300px] px-3 pb-2">
        {insights.map((insight, idx) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.15 }}
            className="group flex items-start gap-2 py-1.5 border-b border-neutral-50 last:border-0"
          >
            {/* Icon */}
            <span className={`text-[12px] shrink-0 mt-0.5 ${getCategoryColor(insight.category)}`}>
              {getInsightIcon(insight.category)}
            </span>

            {/* Text + optional data bar */}
            <div className="flex-1 min-w-0">
              <span className="text-[12px] text-neutral-700 leading-snug block">
                {insight.text}
              </span>
              {insight.dataPercent > 0 && (
                <div className="mt-1 h-1 w-full max-w-[80px] bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-300 rounded-full"
                    style={{ width: `${Math.min(insight.dataPercent, 100)}%` }}
                  />
                </div>
              )}
            </div>

            {/* Connection dot */}
            {(onStartConnection || onCompleteConnection) && (
              <button
                onClick={() => {
                  if (connectionMode && onCompleteConnection) {
                    onCompleteConnection(insight.id, 'insight')
                  } else if (onStartConnection) {
                    onStartConnection(insight.id, 'insight')
                  }
                }}
                className={`
                  w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 transition-all duration-200
                  opacity-0 group-hover:opacity-100
                  ${connectionMode
                    ? 'bg-purple-400 shadow-[0_0_3px_rgba(168,85,247,0.5)] opacity-100'
                    : 'bg-neutral-300 hover:bg-neutral-400'
                  }
                `}
                title={connectionMode ? 'Connect here' : 'Start connection'}
              />
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// TAB: MINDMAP (placeholder)
// ═══════════════════════════════════════════════════════════════════

function MindmapTab({ levelId }: { levelId: string }) {
  return (
    <motion.div
      key="mindmap"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      data-mindmap-slot={levelId}
      className="flex flex-col items-center justify-center h-full gap-3"
    >
      {/* Simple 3-connected-circles SVG icon */}
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="8" r="5" stroke="#d4d4d4" strokeWidth="1.5" fill="#fafafa" />
        <circle cx="10" cy="32" r="5" stroke="#d4d4d4" strokeWidth="1.5" fill="#fafafa" />
        <circle cx="30" cy="32" r="5" stroke="#d4d4d4" strokeWidth="1.5" fill="#fafafa" />
        <line x1="20" y1="13" x2="10" y2="27" stroke="#e5e5e5" strokeWidth="1" />
        <line x1="20" y1="13" x2="30" y2="27" stroke="#e5e5e5" strokeWidth="1" />
        <line x1="15" y1="32" x2="25" y2="32" stroke="#e5e5e5" strokeWidth="1" />
      </svg>

      <span className="text-[11px] text-neutral-400 font-mono">
        Mind Map
      </span>
      <span className="text-[9px] text-neutral-300">
        Visual connections coming soon
      </span>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function AIComputationalPanel({
  level,
  onStartConnection,
  onCompleteConnection,
  connectionMode,
}: AIComputationalPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('layers')

  const hasResponse = level.response && level.response.trim().length > 0

  const tabs: { id: TabId; label: string }[] = [
    { id: 'layers', label: 'Layers' },
    { id: 'insight', label: 'Insight' },
    { id: 'mindmap', label: 'Mindmap' },
  ]

  return (
    <div className="h-full flex flex-col bg-white">
      {/* ── Tab Switcher ── */}
      <div className="flex items-center px-1 border-b border-neutral-100">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-3 py-2 text-[10px] uppercase tracking-wider font-mono cursor-pointer
              transition-colors duration-150
              ${activeTab === tab.id
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-neutral-400 hover:text-neutral-600'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'layers' && (
            <LayersTab
              activeLayerWeights={level.activeLayerWeights}
              onStartConnection={onStartConnection ? (id, type) => onStartConnection(id, type) : undefined}
              onCompleteConnection={onCompleteConnection ? (id, type) => onCompleteConnection(id, type) : undefined}
              connectionMode={connectionMode}
            />
          )}
          {activeTab === 'insight' && (
            <InsightTab
              insights={level.insights}
              levelId={level.id}
              onStartConnection={onStartConnection ? (id, type) => onStartConnection(id, type) : undefined}
              onCompleteConnection={onCompleteConnection ? (id, type) => onCompleteConnection(id, type) : undefined}
              connectionMode={connectionMode}
            />
          )}
          {activeTab === 'mindmap' && (
            <MindmapTab levelId={level.id} />
          )}
        </AnimatePresence>
      </div>

      {/* ── Stats Footer ── */}
      {hasResponse && (
        <div className="mt-auto px-3 py-2 border-t border-neutral-50 flex items-center justify-end gap-1">
          <span className="text-[9px] text-neutral-400 font-mono">
            {level.dataPoints} data pts
          </span>
          <span className="text-[9px] text-neutral-300">·</span>
          <span className="text-[9px] text-neutral-400 font-mono">
            {level.confidence}%
          </span>
          <span className="text-[9px] text-neutral-300">·</span>
          <span className="text-[9px] text-neutral-400 font-mono">
            {level.semanticConnections} links
          </span>
        </div>
      )}
    </div>
  )
}
