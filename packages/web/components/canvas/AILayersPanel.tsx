'use client'

/**
 * AI LAYERS PANEL
 *
 * Full AI Computational Layers panel replacing VisualsPanel.
 * Shows insights organized by category with view tabs.
 *
 * Visual Structure:
 * ┌─────────────────────────────────────────────────────────────┐
 * │ [AI Layers] [Insight] [Mindmap]          ◻ list  ◼ tree    │
 * ├─────────────────────────────────────────────────────────────┤
 * │ 5 insights · 12 data points · 78% confidence              │
 * ├─────────────────────────────────────────────────────────────┤
 * │ [strategy] [insight] [data] [action]    <- category pills  │
 * ├─────────────────────────────────────────────────────────────┤
 * │ ◇ Focus on customer acquisition...           72%  3 ▸      │
 * │ ✦ Consider partnership channels...           85%  2 ▸      │
 * │ ▣ User data shows preference for...          90%  5 ▸      │
 * │ ▸ Implement A/B testing on landing...        68%  1 ▸      │
 * └─────────────────────────────────────────────────────────────┘
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface AIInsight {
  id: string
  text: string
  category: 'strategy' | 'insight' | 'data' | 'action'
  confidence: number
  metricsCount: number
  dataPercent?: number
}

export interface AILayersPanelProps {
  insights: AIInsight[]
  totalDataPoints: number
  overallConfidence: number
  querySynthesis?: string
  onInsightClick?: (insightId: string) => void
  selectedInsightId?: string | null
}

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

type ViewTab = 'layers' | 'insight' | 'mindmap'
type ViewMode = 'list' | 'tree'

const CATEGORY_ICONS: Record<string, string> = {
  strategy: '◇',
  insight: '✦',
  data: '▣',
  action: '▸',
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  strategy: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
  },
  insight: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
  },
  data: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  action: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
  },
}

// ═══════════════════════════════════════════════════════════════════
// SUBCOMPONENTS
// ═══════════════════════════════════════════════════════════════════

/**
 * View Tab Button
 */
function TabButton({
  label,
  isActive,
  onClick,
}: {
  label: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-2 py-0.5 text-[9px] font-mono uppercase tracking-wide rounded transition-all duration-200
        ${isActive
          ? 'bg-neutral-100 dark:bg-relic-slate/30 text-neutral-800 dark:text-neutral-200'
          : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300'
        }
      `}
    >
      {label}
    </button>
  )
}

/**
 * Category Filter Pill
 */
function CategoryPill({
  category,
  isActive,
  onClick,
}: {
  category: string
  isActive: boolean
  onClick: () => void
}) {
  const colors = CATEGORY_COLORS[category]
  const icon = CATEGORY_ICONS[category]

  return (
    <button
      onClick={onClick}
      className={`
        px-2 py-0.5 text-[9px] font-mono rounded border transition-all duration-200
        ${isActive
          ? `${colors.bg} ${colors.text} ${colors.border}`
          : 'bg-transparent text-neutral-400 dark:text-neutral-500 border-neutral-200 dark:border-relic-slate/30 hover:border-neutral-300'
        }
      `}
    >
      <span className="mr-1">{icon}</span>
      {category}
    </button>
  )
}

/**
 * Single Insight Row
 */
function InsightRow({
  insight,
  isSelected,
  onClick,
}: {
  insight: AIInsight
  isSelected: boolean
  onClick: () => void
}) {
  const colors = CATEGORY_COLORS[insight.category]
  const icon = CATEGORY_ICONS[insight.category]

  return (
    <motion.div
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.1 }}
      onClick={onClick}
      className={`
        flex items-start gap-1.5 p-1.5 rounded-lg border cursor-pointer transition-all duration-200
        ${isSelected
          ? `${colors.bg} ${colors.border} ring-1 ring-purple-300`
          : 'border-transparent hover:border-neutral-200 dark:hover:border-relic-slate/30 hover:bg-neutral-50/50 dark:hover:bg-relic-slate/10'
        }
      `}
    >
      {/* Icon */}
      <span className={`${colors.text} text-[12px] mt-0.5 flex-shrink-0`}>
        {icon}
      </span>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[10px] text-neutral-700 dark:text-neutral-300 leading-snug line-clamp-2">
          {insight.text}
        </p>
      </div>

      {/* Confidence & Metrics */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="font-mono text-[10px] text-neutral-500 dark:text-neutral-400">
          {insight.confidence}%
        </span>
        <span className="font-mono text-[9px] text-neutral-400 dark:text-neutral-500">
          {insight.metricsCount} ▸
        </span>
      </div>
    </motion.div>
  )
}

/**
 * Empty State Component
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
      <div className="text-2xl mb-2 text-neutral-300 dark:text-neutral-600">◇</div>
      <p className="text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
        No insights yet
      </p>
      <p className="text-[9px] mt-1 text-neutral-400 dark:text-neutral-500">
        Start a conversation to generate insights
      </p>
    </div>
  )
}

/**
 * Mindmap Placeholder View
 */
function MindmapView({ insights }: { insights: AIInsight[] }) {
  if (insights.length === 0) return <EmptyState />

  // Simple SVG mindmap visualization
  const categories = ['strategy', 'insight', 'data', 'action']

  return (
    <div className="w-full h-full min-h-[300px] relative overflow-hidden">
      <svg className="w-full h-full" viewBox="0 0 400 300">
        {/* Background Grid */}
        <defs>
          <pattern id="ai-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="0.5" fill="#d1d5db" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ai-grid)" />

        {/* Center Node */}
        <circle cx="200" cy="150" r="24" fill="#a78bfa" opacity="0.9" />
        <text x="200" y="154" textAnchor="middle" fontSize="8" fill="white" fontFamily="monospace">
          AI Layers
        </text>

        {/* Category Nodes */}
        {categories.map((cat, idx) => {
          const angle = (idx * Math.PI * 2) / 4 - Math.PI / 2
          const radius = 80
          const x = 200 + Math.cos(angle) * radius
          const y = 150 + Math.sin(angle) * radius
          const count = insights.filter((i) => i.category === cat).length
          const colors = CATEGORY_COLORS[cat]

          return (
            <g key={cat}>
              {/* Connection Line */}
              <line
                x1="200"
                y1="150"
                x2={x}
                y2={y}
                stroke="#d1d5db"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              {/* Category Node */}
              <circle
                cx={x}
                cy={y}
                r="18"
                fill={cat === 'strategy' ? '#3b82f6' : cat === 'insight' ? '#f59e0b' : cat === 'data' ? '#10b981' : '#a855f7'}
                opacity={count > 0 ? 0.9 : 0.4}
              />
              <text
                x={x}
                y={y - 3}
                textAnchor="middle"
                fontSize="7"
                fill="white"
                fontFamily="monospace"
              >
                {CATEGORY_ICONS[cat]}
              </text>
              <text
                x={x}
                y={y + 6}
                textAnchor="middle"
                fontSize="6"
                fill="white"
                fontFamily="monospace"
              >
                {count}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/**
 * AI Layers Tree View (hierarchical visualization)
 */
function LayersTreeView({ insights }: { insights: AIInsight[] }) {
  if (insights.length === 0) return <EmptyState />

  // Group insights by category
  const grouped = insights.reduce<Record<string, AIInsight[]>>((acc, insight) => {
    if (!acc[insight.category]) acc[insight.category] = []
    acc[insight.category].push(insight)
    return acc
  }, {})

  return (
    <div className="space-y-3 p-2">
      {Object.entries(grouped).map(([category, items]) => {
        const colors = CATEGORY_COLORS[category]
        const icon = CATEGORY_ICONS[category]

        return (
          <div key={category} className="space-y-1">
            {/* Category Header */}
            <div className={`flex items-center gap-2 px-2 py-1 rounded ${colors.bg}`}>
              <span className={colors.text}>{icon}</span>
              <span className={`font-mono text-[10px] uppercase tracking-wide ${colors.text}`}>
                {category}
              </span>
              <span className="font-mono text-[9px] text-neutral-400 ml-auto">
                {items.length}
              </span>
            </div>
            {/* Items */}
            <div className="pl-4 border-l-2 border-neutral-100 dark:border-relic-slate/20 ml-2 space-y-1">
              {items.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="px-2 py-1 text-[10px] font-mono text-neutral-600 dark:text-neutral-400 truncate hover:bg-neutral-50 dark:hover:bg-relic-slate/10 rounded cursor-pointer"
                >
                  {item.text.slice(0, 50)}...
                </div>
              ))}
              {items.length > 3 && (
                <div className="px-2 py-1 text-[9px] font-mono text-neutral-400 italic">
                  +{items.length - 3} more
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function AILayersPanel({
  insights,
  totalDataPoints,
  overallConfidence,
  querySynthesis,
  onInsightClick,
  selectedInsightId,
}: AILayersPanelProps) {
  const [activeTab, setActiveTab] = useState<ViewTab>('layers')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    new Set(['strategy', 'insight', 'data', 'action'])
  )

  // Filter insights by active categories
  const filteredInsights = useMemo(
    () => insights.filter((i) => activeCategories.has(i.category)),
    [insights, activeCategories]
  )

  // Toggle category filter
  const toggleCategory = (category: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        // Don't allow removing all categories
        if (next.size > 1) next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-relic-void">
      {/* Header: View Tabs & Mode Toggle */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-100 dark:border-relic-slate/20">
        {/* View Tabs */}
        <div className="flex gap-1">
          <TabButton
            label="AI Layers"
            isActive={activeTab === 'layers'}
            onClick={() => setActiveTab('layers')}
          />
          <TabButton
            label="Insight"
            isActive={activeTab === 'insight'}
            onClick={() => setActiveTab('insight')}
          />
          <TabButton
            label="Mindmap"
            isActive={activeTab === 'mindmap'}
            onClick={() => setActiveTab('mindmap')}
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode('list')}
            className={`
              px-2 py-1 text-[10px] font-mono rounded transition-all
              ${viewMode === 'list'
                ? 'bg-neutral-100 dark:bg-relic-slate/30 text-neutral-700 dark:text-neutral-300'
                : 'text-neutral-400 hover:text-neutral-600'
              }
            `}
          >
            ◻ list
          </button>
          <button
            onClick={() => setViewMode('tree')}
            className={`
              px-2 py-1 text-[10px] font-mono rounded transition-all
              ${viewMode === 'tree'
                ? 'bg-neutral-100 dark:bg-relic-slate/30 text-neutral-700 dark:text-neutral-300'
                : 'text-neutral-400 hover:text-neutral-600'
              }
            `}
          >
            ◼ tree
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-3 py-2 border-b border-neutral-100 dark:border-relic-slate/20">
        <div className="flex items-center gap-3 font-mono text-[9px] text-neutral-500 dark:text-neutral-400">
          <span>
            <span className="text-neutral-700 dark:text-neutral-300 font-medium">
              {insights.length}
            </span>{' '}
            insights
          </span>
          <span className="text-neutral-300 dark:text-neutral-600">·</span>
          <span>
            <span className="text-neutral-700 dark:text-neutral-300 font-medium">
              {totalDataPoints}
            </span>{' '}
            data points
          </span>
          <span className="text-neutral-300 dark:text-neutral-600">·</span>
          <span>
            <span className="text-neutral-700 dark:text-neutral-300 font-medium">
              {overallConfidence}%
            </span>{' '}
            confidence
          </span>
        </div>
      </div>

      {/* Category Filter Pills - only show in layers/insight tabs */}
      {(activeTab === 'layers' || activeTab === 'insight') && (
        <div className="px-3 py-2 border-b border-neutral-100 dark:border-relic-slate/20">
          <div className="flex gap-2">
            {['strategy', 'insight', 'data', 'action'].map((cat) => (
              <CategoryPill
                key={cat}
                category={cat}
                isActive={activeCategories.has(cat)}
                onClick={() => toggleCategory(cat)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'mindmap' ? (
            <motion.div
              key="mindmap"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="h-full"
            >
              <MindmapView insights={filteredInsights} />
            </motion.div>
          ) : viewMode === 'tree' ? (
            <motion.div
              key="tree"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="h-full"
            >
              <LayersTreeView insights={filteredInsights} />
            </motion.div>
          ) : filteredInsights.length === 0 ? (
            <EmptyState />
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="p-2 space-y-1"
            >
              {filteredInsights.map((insight) => (
                <InsightRow
                  key={insight.id}
                  insight={insight}
                  isSelected={selectedInsightId === insight.id}
                  onClick={() => onInsightClick?.(insight.id)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer: Query Synthesis & Actions */}
      {(querySynthesis || insights.length > 0) && (
        <div className="px-3 py-2 border-t border-neutral-100 dark:border-relic-slate/20 bg-neutral-50/50 dark:bg-relic-slate/10">
          {querySynthesis && (
            <div className="mb-2">
              <div className="font-mono text-[8px] text-neutral-400 uppercase tracking-wide mb-0.5">
                Query Synthesis
              </div>
              <p className="font-mono text-[10px] text-neutral-600 dark:text-neutral-400 line-clamp-2">
                {querySynthesis}
              </p>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="font-mono text-[8px] text-neutral-400">
              data: {totalDataPoints} points
            </div>
            <button className="font-mono text-[9px] text-purple-500 hover:text-purple-600 transition-colors">
              explore ▸
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AILayersPanel
