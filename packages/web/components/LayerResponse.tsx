'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  XMarkIcon,
  SparklesIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'

interface CoreInsight {
  id: string
  rank: number
  title: string
  fullContent: string
  category: 'executive' | 'strategy' | 'action' | 'insight' | 'data'
  confidence: number
  impact: number
  connections: number
  children: string[]
  dataDensity: number  // 0-1 score for how much factual data this contains
  metrics: string[]    // Extracted numbers/percentages
}

interface LayerResponseProps {
  content: string
  query: string
  methodology?: string
  onClose?: () => void
  onSwitchToInsight?: () => void
  onOpenMindMap?: () => void
  onDeepDive?: (query: string) => void  // NEW: For Deep Dive → Mini Chat
}

// Clean category colors
const CATEGORY_CONFIG = {
  executive: {
    bg: 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20',
    border: 'border-indigo-300 dark:border-indigo-600/30',
    dot: 'bg-indigo-500',
    text: 'text-indigo-700 dark:text-indigo-300',
    badge: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
    icon: '◆'
  },
  strategy: {
    bg: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
    border: 'border-purple-300 dark:border-purple-600/30',
    dot: 'bg-purple-500',
    text: 'text-purple-700 dark:text-purple-300',
    badge: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    icon: '◇'
  },
  action: {
    bg: 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
    border: 'border-emerald-300 dark:border-emerald-600/30',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300',
    badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    icon: '▸'
  },
  insight: {
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
    border: 'border-amber-300 dark:border-amber-600/30',
    dot: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
    badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    icon: '✦'
  },
  data: {
    bg: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
    border: 'border-blue-300 dark:border-blue-600/30',
    dot: 'bg-blue-500',
    text: 'text-blue-700 dark:text-blue-300',
    badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    icon: '▣'
  },
}

// Enhanced metrics extraction
function extractMetrics(text: string): string[] {
  const metrics: string[] = []

  // Patterns for different metric types
  const patterns = [
    /\d+(?:\.\d+)?%/g,                          // Percentages: 85%, 12.5%
    /\$\d+(?:,\d{3})*(?:\.\d{2})?[KMB]?/g,      // Money: $100K, $1.5M, $2B
    /\d+(?:,\d{3})*(?:\.\d+)?[KMB]?\s*(?:users|people|customers|clients)/gi,  // Users: 10K users
    /\d+(?:\.\d+)?x/g,                          // Multipliers: 5x, 2.5x
    /\d+(?:,\d{3})*(?:\.\d+)?\s*(?:hours?|days?|weeks?|months?|years?)/gi,  // Time: 3 days
    /\d+:\d+/g,                                 // Ratios: 3:1, 10:1
    /\d+(?:,\d{3})*(?:\.\d+)?/g                 // Pure numbers: 1000, 45.7
  ]

  patterns.forEach(pattern => {
    const matches = text.match(pattern)
    if (matches) metrics.push(...matches)
  })

  // Remove duplicates and return unique metrics
  return [...new Set(metrics)].slice(0, 5)
}

// Calculate data density score (0-1)
function calculateDataDensity(text: string): number {
  const metrics = extractMetrics(text)
  const words = text.split(/\s+/).length

  // Scoring factors
  const metricCount = metrics.length
  const hasPercentage = /\d+%/.test(text)
  const hasMoney = /\$\d+/.test(text)
  const hasTimeframe = /\d+\s*(?:hours?|days?|weeks?|months?|years?)/i.test(text)
  const hasQuantity = /\d+[KMB]?/.test(text)
  const hasComparison = /(?:vs|versus|compared to|more than|less than|increase|decrease)/i.test(text)

  // Calculate score
  let score = 0
  score += Math.min(metricCount * 0.15, 0.4)  // Up to 0.4 for metrics
  score += hasPercentage ? 0.15 : 0
  score += hasMoney ? 0.15 : 0
  score += hasTimeframe ? 0.1 : 0
  score += hasQuantity ? 0.1 : 0
  score += hasComparison ? 0.1 : 0

  // Bonus for density (metrics per word)
  if (words > 0) {
    const density = metricCount / words
    score += Math.min(density * 0.5, 0.2)
  }

  return Math.min(score, 1.0)
}

function extractHighLevelInsights(content: string, query: string): CoreInsight[] {
  const insights: CoreInsight[] = []
  const seen = new Set<string>()
  let rank = 0

  // PRIORITY 1: Extract numbered lists (often contain concrete steps/data)
  const numberedPattern = /^\d+[\.)]\s*(.{10,150})$/gm
  let match
  while ((match = numberedPattern.exec(content)) !== null) {
    const text = match[1].trim()
    const key = text.toLowerCase().substring(0, 30)

    if (seen.has(key)) continue
    seen.add(key)

    const metrics = extractMetrics(text)
    const dataDensity = calculateDataDensity(text)

    // Skip if no meaningful data
    if (metrics.length === 0 && dataDensity < 0.15) continue

    rank++
    insights.push({
      id: `insight-${rank}`,
      rank,
      title: text.length > 60 ? text.substring(0, 57) + '...' : text,
      fullContent: text,
      category: dataDensity > 0.5 ? 'data' : 'action',
      confidence: 0.88 + dataDensity * 0.1,
      impact: 0.82 + dataDensity * 0.15,
      connections: Math.floor(metrics.length / 2),
      children: [],
      dataDensity,
      metrics
    })
  }

  // PRIORITY 2: Extract headers with emphasis on data-rich ones
  const headerPattern = /^#+\s*(.+)$/gm
  while ((match = headerPattern.exec(content)) !== null) {
    const text = match[1].trim().replace(/[#*]/g, '').trim()
    const key = text.toLowerCase().substring(0, 30)

    if (text.length < 5 || text.length > 100 || seen.has(key)) continue
    seen.add(key)

    const metrics = extractMetrics(text)
    const dataDensity = calculateDataDensity(text)
    const textLower = text.toLowerCase()

    // Determine category with data focus
    let category: CoreInsight['category'] = 'strategy'
    if (dataDensity > 0.4 || textLower.includes('metric') || textLower.includes('data') || textLower.includes('stat')) {
      category = 'data'
    } else if (textLower.includes('summary') || textLower.includes('overview') || textLower.includes('executive')) {
      category = 'executive'
    } else if (textLower.includes('action') || textLower.includes('implement') || textLower.includes('step')) {
      category = 'action'
    } else if (textLower.includes('insight') || textLower.includes('key') || textLower.includes('finding')) {
      category = 'insight'
    }

    rank++
    insights.push({
      id: `insight-${rank}`,
      rank,
      title: text.length > 60 ? text.substring(0, 57) + '...' : text,
      fullContent: text,
      category,
      confidence: 0.85 + dataDensity * 0.12,
      impact: 0.78 + dataDensity * 0.18,
      connections: Math.max(1, Math.floor(metrics.length / 2)),
      children: [],
      dataDensity,
      metrics
    })
  }

  // PRIORITY 3: Extract bold concepts with metrics
  const boldPattern = /\*\*([^*]{8,80})\*\*/g
  const maxBold = 12 - insights.length
  let boldCount = 0

  while ((match = boldPattern.exec(content)) !== null && boldCount < maxBold) {
    const text = match[1].trim()
    const key = text.toLowerCase().substring(0, 30)

    if (seen.has(key)) continue
    seen.add(key)

    const metrics = extractMetrics(text)
    const dataDensity = calculateDataDensity(text)
    const textLower = text.toLowerCase()

    // Only include if has data or is important
    if (metrics.length === 0 && dataDensity < 0.2 &&
        !textLower.includes('key') && !textLower.includes('critical') &&
        !textLower.includes('important')) {
      continue
    }

    let category: CoreInsight['category'] = 'strategy'
    if (dataDensity > 0.35 || metrics.length >= 2) {
      category = 'data'
    } else if (textLower.includes('action') || textLower.includes('implement')) {
      category = 'action'
    } else if (textLower.includes('insight')) {
      category = 'insight'
    }

    rank++
    boldCount++
    insights.push({
      id: `insight-${rank}`,
      rank,
      title: text.length > 55 ? text.substring(0, 52) + '...' : text,
      fullContent: text,
      category,
      confidence: 0.72 + dataDensity * 0.2,
      impact: 0.68 + dataDensity * 0.25,
      connections: metrics.length > 0 ? 1 : 0,
      children: [],
      dataDensity,
      metrics
    })
  }

  // PRIORITY 4: Extract bullet points with data
  const bulletPattern = /^[•\-*]\s*(.{10,120})$/gm
  const maxBullets = 14 - insights.length
  let bulletCount = 0

  while ((match = bulletPattern.exec(content)) !== null && bulletCount < maxBullets) {
    const text = match[1].trim()
    const key = text.toLowerCase().substring(0, 30)

    if (seen.has(key)) continue

    const metrics = extractMetrics(text)
    const dataDensity = calculateDataDensity(text)

    // Only include bullets with substantial data
    if (metrics.length < 1 && dataDensity < 0.25) continue

    seen.add(key)
    rank++
    bulletCount++

    insights.push({
      id: `insight-${rank}`,
      rank,
      title: text.length > 50 ? text.substring(0, 47) + '...' : text,
      fullContent: text,
      category: dataDensity > 0.4 ? 'data' : 'insight',
      confidence: 0.68 + dataDensity * 0.25,
      impact: 0.62 + dataDensity * 0.3,
      connections: metrics.length > 1 ? 1 : 0,
      children: [],
      dataDensity,
      metrics
    })
  }

  // Sort by: data density (40%) + impact (35%) + confidence (25%)
  return insights
    .sort((a, b) => {
      const scoreA = (a.dataDensity * 0.4) + (a.impact * 0.35) + (a.confidence * 0.25)
      const scoreB = (b.dataDensity * 0.4) + (b.impact * 0.35) + (b.confidence * 0.25)
      return scoreB - scoreA
    })
    .slice(0, 10)
    .map((ins, i) => ({ ...ins, rank: i + 1 }))
}

export default function LayerResponse({ content, query, methodology = 'auto', onClose, onSwitchToInsight, onOpenMindMap, onDeepDive }: LayerResponseProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('list')

  const insights = useMemo(() => extractHighLevelInsights(content, query), [content, query])

  // Check if Insight view is available for this content
  const canShowInsight = useMemo(() => {
    const boldCount = (content.match(/\*\*[^*]+\*\*/g) || []).length
    const headerCount = (content.match(/^#+\s*.+$/gm) || []).length
    const bulletCount = (content.match(/^[-•*]\s+.+$/gm) || []).length
    return boldCount >= 2 || headerCount >= 2 || bulletCount >= 3
  }, [content])

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, CoreInsight[]> = {
      executive: [],
      strategy: [],
      action: [],
      insight: [],
      data: []
    }
    insights.forEach(ins => groups[ins.category].push(ins))
    return groups
  }, [insights])

  // Calculate connections based on content similarity
  const connections = useMemo(() => {
    const conns: Array<{ from: string; to: string; strength: number }> = []
    insights.forEach((a, i) => {
      insights.slice(i + 1).forEach(b => {
        // Simple word overlap similarity
        const wordsA = new Set(a.fullContent.toLowerCase().split(/\s+/))
        const wordsB = new Set(b.fullContent.toLowerCase().split(/\s+/))
        const intersection = [...wordsA].filter(w => wordsB.has(w) && w.length > 3)
        const strength = intersection.length / Math.min(wordsA.size, wordsB.size)

        if (strength > 0.2) { // 20% similarity threshold
          conns.push({ from: a.id, to: b.id, strength })
        }
      })
    })
    return conns
  }, [insights])

  // Dynamic layout based on insight distribution
  const layout = useMemo(() => {
    const total = insights.length
    if (total <= 3) return 'compact'
    if (total <= 6) return 'dual'
    return 'full'
  }, [insights])
  
  const stats = useMemo(() => {
    const totalMetrics = insights.reduce((sum, ins) => sum + ins.metrics.length, 0)
    const avgDataDensity = Math.round(insights.reduce((a, b) => a + b.dataDensity, 0) / insights.length * 100)

    return {
      total: insights.length,
      avgConfidence: Math.round(insights.reduce((a, b) => a + b.confidence, 0) / insights.length * 100),
      avgImpact: Math.round(insights.reduce((a, b) => a + b.impact, 0) / insights.length * 100),
      categories: Object.entries(grouped).filter(([, items]) => items.length > 0).length,
      totalMetrics,
      avgDataDensity
    }
  }, [insights, grouped])
  
  if (insights.length < 2) return null
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <div className="rounded-xl border border-slate-200/60 dark:border-relic-slate/30 bg-white dark:bg-relic-slate/20 overflow-hidden shadow-sm">
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-relic-slate/30 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-relic-slate/30 transition-colors"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-sm">
              <SparklesIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
                {(() => {
                  // Generate query-specific title
                  const queryWords = query.split(' ').filter(w => w.length > 3)
                  const keyTopic = queryWords.slice(0, 3).join(' ')
                  const topCategory = Object.entries(grouped)
                    .filter(([, items]) => items.length > 0)
                    .sort((a, b) => b[1].length - a[1].length)[0]?.[0] || 'insight'

                  return keyTopic.length > 40
                    ? `${keyTopic.substring(0, 37)}... — ${topCategory} synthesis`
                    : `${keyTopic} — ${topCategory} analysis`
                })()}
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-relic-ghost/70 font-mono">
                {insights.length} insights · {stats.totalMetrics} data points · {stats.avgDataDensity}% data · {stats.avgConfidence}% confidence
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-relic-slate/40">
              <button
                onClick={(e) => { e.stopPropagation(); setViewMode('list') }}
                className={`px-2 py-1 text-[9px] rounded-md transition-all ${
                  viewMode === 'list' ? 'bg-white dark:bg-relic-void shadow-sm text-slate-700 dark:text-white' : 'text-slate-500 dark:text-relic-ghost'
                }`}
              >
                ≡ List
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setViewMode('tree') }}
                className={`px-2 py-1 text-[9px] rounded-md transition-all ${
                  viewMode === 'tree' ? 'bg-white dark:bg-relic-void shadow-sm text-slate-700 dark:text-white' : 'text-slate-500 dark:text-relic-ghost'
                }`}
              >
                ◎ Tree
              </button>
            </div>
            {isCollapsed ? <ChevronDownIcon className="w-4 h-4 text-slate-400 dark:text-relic-ghost" /> : <ChevronUpIcon className="w-4 h-4 text-slate-400 dark:text-relic-ghost" />}
          </div>
        </div>
        
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              {/* Stats Bar */}
              <div className="px-4 py-2 bg-slate-50/50 dark:bg-relic-slate/10 border-b border-slate-100 dark:border-relic-slate/30 flex items-center gap-4">
                <div className="flex items-center gap-3">
                  {Object.entries(grouped).filter(([, items]) => items.length > 0).map(([cat, items]) => {
                    const config = CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG]
                    return (
                      <div key={cat} className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                        <span className="text-[10px] text-slate-600 dark:text-relic-ghost capitalize">{cat}</span>
                        <span className="text-[10px] text-slate-400 dark:text-relic-ghost/60">({items.length})</span>
                      </div>
                    )
                  })}
                </div>
              </div>
              
              {viewMode === 'list' ? (
                /* LIST VIEW - Clickable Insights */
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {insights.map((insight, idx) => {
                    const config = CATEGORY_CONFIG[insight.category]
                    const isExpanded = expandedId === insight.id
                    
                    return (
                      <motion.div
                        key={insight.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className={`group transition-colors ${isExpanded ? config.bg : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/50'}`}
                      >
                        <div className="px-3 py-2">
                          <div 
                            className="flex items-start gap-2 cursor-pointer"
                            onClick={() => setExpandedId(isExpanded ? null : insight.id)}
                          >
                            {/* Rank */}
                            <div className={`w-5 h-5 rounded ${config.badge} flex items-center justify-center flex-shrink-0`}>
                              <span className="text-[9px] font-bold">{insight.rank}</span>
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[10px] ${config.text}`}>{config.icon}</span>
                                <h4 className="text-[11px] font-medium text-slate-800 dark:text-slate-200 flex-1 min-w-0 truncate">{insight.title}</h4>

                                {/* Data Metrics Badges - PROMINENT */}
                                {insight.metrics.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    {insight.metrics.slice(0, 3).map((metric, i) => (
                                      <span
                                        key={i}
                                        className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-mono font-semibold"
                                        title="Extracted metric"
                                      >
                                        {metric}
                                      </span>
                                    ))}
                                    {insight.metrics.length > 3 && (
                                      <span className="text-[8px] text-slate-400 font-mono">
                                        +{insight.metrics.length - 3}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Data Density Indicator */}
                              {insight.dataDensity > 0.3 && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden max-w-[100px]">
                                    <div
                                      className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all"
                                      style={{ width: `${insight.dataDensity * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-[8px] text-slate-500 font-mono">
                                    {Math.round(insight.dataDensity * 100)}% data
                                  </span>
                                </div>
                              )}

                              {/* Expanded - Compact with Actions */}
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="mt-2 overflow-hidden"
                                  >
                                    <p className="text-[10px] text-slate-700 dark:text-slate-300 leading-relaxed mb-2 font-medium">
                                      {insight.fullContent}
                                    </p>

                                    {/* All Metrics - Expanded View */}
                                    {insight.metrics.length > 0 && (
                                      <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                                        <div className="text-[8px] text-blue-600 dark:text-blue-400 font-semibold mb-1 uppercase tracking-wide">
                                          📊 Key Data Points ({insight.metrics.length})
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                          {insight.metrics.map((metric, i) => (
                                            <span
                                              key={i}
                                              className="text-[10px] px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-mono font-bold"
                                            >
                                              {metric}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className={`text-[8px] px-1.5 py-0.5 rounded ${config.badge} capitalize font-semibold`}>
                                        {insight.category}
                                      </span>
                                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">
                                        {Math.round(insight.dataDensity * 100)}% data
                                      </span>
                                      {/* Actions - Open in new tab */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          onDeepDive?.(`Explain more about: ${insight.title}`)
                                        }}
                                        className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors font-medium"
                                      >
                                        🔍 Deep Dive
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          const copyText = `${insight.title}\n\n${insight.fullContent}\n\nMetrics: ${insight.metrics.join(', ')}`
                                          navigator.clipboard.writeText(copyText)
                                        }}
                                        className="text-[8px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium"
                                      >
                                        📋 Copy All
                                      </button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* Metrics - Compact */}
                            <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-mono text-emerald-600 font-bold">{Math.round(insight.confidence * 100)}%</span>
                                <span className="text-[9px] font-mono text-blue-600 font-bold">{Math.round(insight.impact * 100)}%</span>
                                <ChevronDownIcon className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </div>
                              {insight.metrics.length > 0 && (
                                <span className="text-[7px] text-blue-600 font-mono font-semibold">
                                  {insight.metrics.length} metrics
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                /* TREE VIEW - Dynamic Layout Based on Query */
                <div className="relative p-4 min-h-[300px] bg-gradient-to-br from-slate-50/50 to-indigo-50/20">
                  {/* SVG Connections Layer */}
                  <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
                    {connections.map((conn, i) => (
                      <line
                        key={i}
                        x1="50%"
                        y1="30%"
                        x2="50%"
                        y2="70%"
                        stroke={`rgba(139, 92, 246, ${conn.strength})`}
                        strokeWidth={conn.strength * 2}
                        strokeDasharray={conn.strength > 0.5 ? "0" : "4,4"}
                        className="transition-all"
                      />
                    ))}
                  </svg>

                  {/* Dynamic Layout */}
                  {layout === 'compact' ? (
                    /* Single Row - Few Insights */
                    <div className="flex justify-center gap-4" style={{ zIndex: 10, position: 'relative' }}>
                      {insights.slice(0, 3).map((insight, idx) => {
                        const config = CATEGORY_CONFIG[insight.category]
                        const isExpanded = expandedId === insight.id
                        const nodeConnections = connections.filter(c => c.from === insight.id || c.to === insight.id)

                        return (
                          <motion.div
                            key={insight.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`relative cursor-pointer ${isExpanded ? 'z-50' : 'z-10'}`}
                            onClick={() => setExpandedId(isExpanded ? null : insight.id)}
                          >
                            <div className={`px-4 py-3 rounded-xl border-2 ${config.bg} ${config.border} min-w-[180px] max-w-[240px] transition-all ${isExpanded ? 'shadow-lg scale-105' : 'hover:shadow-md'}`}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                                <span className={`text-[10px] font-semibold ${config.text} capitalize`}>{insight.category}</span>
                                {nodeConnections.length > 0 && (
                                  <span className="text-[8px] text-slate-400">🔗{nodeConnections.length}</span>
                                )}
                              </div>
                              <h4 className={`text-[11px] font-medium ${config.text} ${isExpanded ? '' : 'line-clamp-2'}`}>{insight.title}</h4>

                              {/* Data Metrics Preview - Collapsed */}
                              {!isExpanded && insight.metrics.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {insight.metrics.slice(0, 2).map((metric, i) => (
                                    <span
                                      key={i}
                                      className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-mono font-bold"
                                    >
                                      {metric}
                                    </span>
                                  ))}
                                  {insight.metrics.length > 2 && (
                                    <span className="text-[8px] text-slate-500 font-mono">
                                      +{insight.metrics.length - 2}
                                    </span>
                                  )}
                                </div>
                              )}

                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-mono font-bold">{Math.round(insight.confidence * 100)}%</span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-mono font-bold">{Math.round(insight.impact * 100)}%</span>
                                {insight.dataDensity > 0.3 && (
                                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-600 font-mono">
                                    {Math.round(insight.dataDensity * 100)}% data
                                  </span>
                                )}
                              </div>

                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="mt-3 pt-3 border-t border-white/50 space-y-2"
                                  >
                                    {/* Full Content */}
                                    <p className="text-[11px] text-slate-700 leading-relaxed font-medium">{insight.fullContent}</p>

                                    {/* Extracted Data Metrics - PROMINENT */}
                                    {insight.metrics.length > 0 && (
                                      <div className="p-2 bg-blue-50 rounded border border-blue-200">
                                        <div className="text-[8px] text-blue-600 font-bold mb-1.5 uppercase tracking-wide">
                                          📊 Extracted Data ({insight.metrics.length})
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                          {insight.metrics.map((metric, i) => (
                                            <span
                                              key={i}
                                              className="text-[10px] px-2 py-1 rounded bg-white border border-blue-300 text-blue-700 font-mono font-bold shadow-sm"
                                            >
                                              {metric}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Metrics */}
                                    <div className="flex items-center gap-3 pt-2 flex-wrap">
                                      <div className="flex items-center gap-1">
                                        <span className="text-[8px] text-slate-500">Confidence:</span>
                                        <span className="text-[9px] font-mono text-emerald-600 font-bold">{Math.round(insight.confidence * 100)}%</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <span className="text-[8px] text-slate-500">Impact:</span>
                                        <span className="text-[9px] font-mono text-blue-600 font-bold">{Math.round(insight.impact * 100)}%</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <span className="text-[8px] text-slate-500">Data:</span>
                                        <span className="text-[9px] font-mono text-indigo-600 font-bold">{Math.round(insight.dataDensity * 100)}%</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <span className="text-[8px] text-slate-500">Rank:</span>
                                        <span className="text-[9px] font-mono text-slate-600 font-bold">#{insight.rank}</span>
                                      </div>
                                    </div>

                                    {/* Connected Topics */}
                                    {nodeConnections.length > 0 && (
                                      <div className="pt-2">
                                        <div className="text-[8px] text-slate-400 mb-1">🔗 Connected to {nodeConnections.length} topics:</div>
                                        <div className="flex flex-wrap gap-1">
                                          {nodeConnections.map((c, i) => {
                                            const relatedId = c.from === insight.id ? c.to : c.from
                                            const related = insights.find(ins => ins.id === relatedId)
                                            if (!related) return null
                                            const relatedConfig = CATEGORY_CONFIG[related.category]

                                            return (
                                              <button
                                                key={i}
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  setExpandedId(related.id)
                                                }}
                                                className={`text-[9px] px-2 py-1 rounded-md ${relatedConfig.badge} hover:opacity-80 transition-opacity`}
                                              >
                                                {related.title.substring(0, 30)}{related.title.length > 30 ? '...' : ''}
                                              </button>
                                            )
                                          })}
                                        </div>
                                      </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1.5 pt-2 border-t border-white/30">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          window.open(`/?q=${encodeURIComponent(`Explore: ${insight.title}`)}`, '_blank')
                                        }}
                                        className="text-[9px] px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                                      >
                                        ↗ Explore More
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          navigator.clipboard.writeText(insight.fullContent)
                                        }}
                                        className="text-[9px] px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                                      >
                                        📋 Copy
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          // Could integrate with Mind Map here
                                        }}
                                        className="text-[9px] px-2 py-1 rounded bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                                      >
                                        🗺️ Add to Map
                                      </button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  ) : layout === 'dual' ? (
                    /* Two Rows - Medium Insights */
                    <>
                      <div className="flex justify-center gap-4 mb-4" style={{ zIndex: 10, position: 'relative' }}>
                        {insights.slice(0, 3).map((insight, idx) => {
                          const config = CATEGORY_CONFIG[insight.category]
                          const isExpanded = expandedId === insight.id
                          const nodeConnections = connections.filter(c => c.from === insight.id || c.to === insight.id)

                          return (
                            <motion.div
                              key={insight.id}
                              initial={{ opacity: 0, y: -20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className={`relative cursor-pointer ${isExpanded ? 'z-50' : 'z-10'}`}
                              onClick={() => setExpandedId(isExpanded ? null : insight.id)}
                            >
                              <div className={`px-3 py-2 rounded-lg border-2 ${config.bg} ${config.border} transition-all ${isExpanded ? 'min-w-[240px] shadow-2xl' : 'min-w-[140px] max-w-[180px] hover:shadow-md'}`}>
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                                  <span className={`text-[9px] ${config.text}`}>{config.icon}</span>
                                  {nodeConnections.length > 0 && <span className="text-[7px] text-slate-400">🔗{nodeConnections.length}</span>}
                                </div>
                                <h4 className={`text-[10px] font-medium ${config.text} ${isExpanded ? '' : 'line-clamp-2'}`}>{insight.title}</h4>

                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="mt-2 pt-2 border-t border-white/50 space-y-2"
                                    >
                                      <p className="text-[10px] text-slate-700 leading-relaxed">{insight.fullContent}</p>

                                      <div className="flex items-center gap-2 text-[8px]">
                                        <span className="text-emerald-600 font-semibold">{Math.round(insight.confidence * 100)}%</span>
                                        <span className="text-blue-600 font-semibold">{Math.round(insight.impact * 100)}%</span>
                                      </div>

                                      {nodeConnections.length > 0 && (
                                        <div className="text-[8px] text-slate-500">
                                          🔗 {nodeConnections.length} connections
                                        </div>
                                      )}

                                      <div className="flex gap-1">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            window.open(`/?q=${encodeURIComponent(`Explore: ${insight.title}`)}`, '_blank')
                                          }}
                                          className="text-[8px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700"
                                        >
                                          ↗
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            navigator.clipboard.writeText(insight.fullContent)
                                          }}
                                          className="text-[8px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700"
                                        >
                                          📋
                                        </button>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>

                      <div className="flex justify-center mb-4">
                        <div className="w-px h-8 bg-gradient-to-b from-purple-200 via-violet-300 to-emerald-200" />
                      </div>

                      <div className="flex justify-center gap-3" style={{ zIndex: 10, position: 'relative' }}>
                        {insights.slice(3, 6).map((insight, idx) => {
                          const config = CATEGORY_CONFIG[insight.category]
                          const isExpanded = expandedId === insight.id
                          const nodeConnections = connections.filter(c => c.from === insight.id || c.to === insight.id)

                          return (
                            <motion.div
                              key={insight.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 + idx * 0.05 }}
                              className={`cursor-pointer ${isExpanded ? 'z-50' : 'z-10'}`}
                              onClick={() => setExpandedId(isExpanded ? null : insight.id)}
                            >
                              <div className={`px-3 py-2 rounded-lg border ${config.bg} ${config.border} transition-all ${isExpanded ? 'min-w-[200px] shadow-2xl' : 'min-w-[120px] max-w-[160px] hover:shadow'}`}>
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[9px] ${config.text}`}>{config.icon}</span>
                                  <span className={`text-[10px] font-medium ${config.text} ${isExpanded ? '' : 'line-clamp-1'}`}>{insight.title}</span>
                                </div>

                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="mt-2 pt-2 border-t border-white/50 space-y-1.5"
                                    >
                                      <p className="text-[9px] text-slate-700 leading-relaxed">{insight.fullContent}</p>
                                      <div className="flex items-center gap-2 text-[8px]">
                                        <span className="text-emerald-600">{Math.round(insight.confidence * 100)}%</span>
                                        <span className="text-blue-600">{Math.round(insight.impact * 100)}%</span>
                                        {nodeConnections.length > 0 && <span className="text-slate-400">🔗{nodeConnections.length}</span>}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </>
                  ) : (
                    /* Three Rows - Full Layout */
                    <>
                      {/* Top: High-impact insights */}
                      <div className="flex justify-center gap-3 mb-3" style={{ zIndex: 10, position: 'relative' }}>
                        {insights.slice(0, 2).map((insight, idx) => {
                          const config = CATEGORY_CONFIG[insight.category]
                          const nodeConnections = connections.filter(c => c.from === insight.id || c.to === insight.id)
                          const isExpanded = expandedId === insight.id

                          return (
                            <motion.div
                              key={insight.id}
                              initial={{ opacity: 0, y: -20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className={`cursor-pointer ${isExpanded ? 'z-50' : 'z-10'}`}
                              onClick={() => setExpandedId(isExpanded ? null : insight.id)}
                            >
                              <div className={`px-4 py-3 rounded-xl border-2 ${config.bg} ${config.border} transition-all hover:shadow-lg hover:scale-105 ${isExpanded ? 'min-w-[280px] shadow-2xl scale-105' : 'min-w-[160px] max-w-[200px]'}`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                                  <span className={`text-[10px] font-semibold ${config.text}`}>{insight.category}</span>
                                  {nodeConnections.length > 0 && <span className="text-[8px] text-slate-400">🔗{nodeConnections.length}</span>}
                                </div>
                                <h4 className={`text-[11px] font-medium ${config.text} ${isExpanded ? '' : 'line-clamp-2'}`}>{insight.title}</h4>

                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="mt-3 pt-3 border-t border-white/50 space-y-2"
                                    >
                                      <p className="text-[10px] text-slate-700 leading-relaxed">{insight.fullContent}</p>
                                      <div className="flex items-center gap-3 text-[8px]">
                                        <span className="text-emerald-600 font-semibold">{Math.round(insight.confidence * 100)}%</span>
                                        <span className="text-blue-600 font-semibold">{Math.round(insight.impact * 100)}%</span>
                                        <span className="text-slate-600">#{insight.rank}</span>
                                      </div>
                                      {nodeConnections.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                          {nodeConnections.slice(0, 3).map((c, i) => {
                                            const relatedId = c.from === insight.id ? c.to : c.from
                                            const related = insights.find(ins => ins.id === relatedId)
                                            if (!related) return null
                                            return (
                                              <button
                                                key={i}
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  setExpandedId(related.id)
                                                }}
                                                className="text-[8px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
                                              >
                                                → {related.title.substring(0, 20)}...
                                              </button>
                                            )
                                          })}
                                        </div>
                                      )}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>

                      {/* Middle: Strategy/Action */}
                      <div className="flex justify-center gap-3 mb-3" style={{ zIndex: 10, position: 'relative' }}>
                        {insights.slice(2, 6).map((insight, idx) => {
                          const config = CATEGORY_CONFIG[insight.category]
                          const isExpanded = expandedId === insight.id
                          const nodeConnections = connections.filter(c => c.from === insight.id || c.to === insight.id)

                          return (
                            <motion.div
                              key={insight.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.2 + idx * 0.05 }}
                              className={`cursor-pointer ${isExpanded ? 'z-50' : 'z-10'}`}
                              onClick={() => setExpandedId(isExpanded ? null : insight.id)}
                            >
                              <div className={`px-3 py-2 rounded-lg border ${config.bg} ${config.border} transition-all hover:shadow hover:scale-105 ${isExpanded ? 'min-w-[220px] shadow-2xl scale-105' : 'min-w-[120px] max-w-[150px]'}`}>
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[9px] ${config.text}`}>{config.icon}</span>
                                  <span className={`text-[10px] font-medium ${config.text} ${isExpanded ? '' : 'line-clamp-1'}`}>{insight.title}</span>
                                </div>

                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="mt-2 pt-2 border-t border-white/50 space-y-1.5"
                                    >
                                      <p className="text-[9px] text-slate-700 leading-relaxed">{insight.fullContent}</p>
                                      <div className="flex items-center gap-2 text-[8px]">
                                        <span className="text-emerald-600">{Math.round(insight.confidence * 100)}%</span>
                                        <span className="text-blue-600">{Math.round(insight.impact * 100)}%</span>
                                        {nodeConnections.length > 0 && <span className="text-slate-400">🔗{nodeConnections.length}</span>}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>

                      {/* Bottom: Details/Data */}
                      <div className="flex justify-center gap-2 flex-wrap" style={{ zIndex: 10, position: 'relative' }}>
                        {insights.slice(6, 10).map((insight, idx) => {
                          const config = CATEGORY_CONFIG[insight.category]
                          const isExpanded = expandedId === insight.id

                          return (
                            <motion.div
                              key={insight.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4 + idx * 0.03 }}
                              className={`cursor-pointer ${isExpanded ? 'z-50' : 'z-10'}`}
                              onClick={() => setExpandedId(isExpanded ? null : insight.id)}
                            >
                              <div className={`px-2 py-1.5 rounded border ${config.bg} ${config.border} transition-all hover:shadow hover:scale-105 ${isExpanded ? 'min-w-[180px] shadow-xl scale-105' : 'min-w-[100px] max-w-[120px]'}`}>
                                <span className={`text-[9px] ${config.text} ${isExpanded ? '' : 'line-clamp-1'}`}>{insight.title}</span>

                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="mt-2 pt-2 border-t border-white/50 dark:border-relic-slate/30"
                                    >
                                      <p className="text-[8px] text-slate-700 dark:text-relic-ghost/80 leading-relaxed">{insight.fullContent}</p>
                                      <div className="flex items-center gap-1.5 mt-1.5 text-[7px]">
                                        <span className="text-emerald-600 dark:text-emerald-400">{Math.round(insight.confidence * 100)}%</span>
                                        <span className="text-blue-600 dark:text-blue-400">{Math.round(insight.impact * 100)}%</span>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </>
                  )}

                  {/* Connection Count Indicator */}
                  {connections.length > 0 && (
                    <div className="absolute bottom-2 right-2 text-[8px] text-slate-400 dark:text-relic-ghost/60">
                      {connections.length} connections
                    </div>
                  )}
                </div>
              )}
              
              {/* Footer - Query-Specific Synthesis */}
              <div className="px-4 py-3 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-relic-slate/10 dark:via-relic-slate/20 dark:to-relic-slate/10 border-t border-slate-200 dark:border-relic-slate/30">
                {/* View Navigation */}
                {((onSwitchToInsight && canShowInsight) || onOpenMindMap) && (
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200 dark:border-relic-slate/30">
                    <span className="text-[9px] text-slate-500 dark:text-relic-ghost/70 font-semibold uppercase tracking-wide">Switch View:</span>
                    <div className="flex items-center gap-2">
                      <button
                        disabled
                        className="px-3 py-1.5 rounded-lg text-[10px] font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-600/30 cursor-not-allowed"
                      >
                        ◆ AI Layers <span className="text-[8px] opacity-60">(current)</span>
                      </button>
                      {onSwitchToInsight && canShowInsight && (
                        <button
                          onClick={onSwitchToInsight}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-medium bg-white dark:bg-relic-slate/30 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-600/30 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                        >
                          ◇ Insight Graph
                        </button>
                      )}
                      {onOpenMindMap && (
                        <button
                          onClick={onOpenMindMap}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-medium bg-white dark:bg-relic-slate/30 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-600/30 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                        >
                          🗺️ Mind Map
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <span className="text-[9px] text-slate-500 dark:text-relic-ghost/70 font-semibold uppercase tracking-wide flex-shrink-0">Query:</span>
                    <p className="text-[10px] text-slate-700 dark:text-relic-ghost leading-relaxed">
                      {(() => {
                        // Extract key topics from query and insights
                        const queryLower = query.toLowerCase()
                        const topCategories = Object.entries(grouped)
                          .filter(([, items]) => items.length > 0)
                          .sort((a, b) => b[1].length - a[1].length)
                          .slice(0, 2)
                          .map(([cat]) => cat)

                        const topMetrics = insights
                          .flatMap(i => i.metrics)
                          .slice(0, 3)

                        const metricsText = topMetrics.length > 0
                          ? ` with ${topMetrics.length} key metrics (${topMetrics.join(', ')})`
                          : ''

                        return `"${query.length > 60 ? query.substring(0, 57) + '...' : query}" — ${insights.length} ${topCategories.join(' and ')} insights extracted${metricsText}`
                      })()}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wide flex-shrink-0">Data:</span>
                    <p className="text-[10px] text-slate-700 dark:text-relic-ghost leading-relaxed">
                      {(() => {
                        const topDataInsights = insights
                          .filter(i => i.dataDensity > 0.4)
                          .slice(0, 2)

                        if (topDataInsights.length > 0) {
                          const titles = topDataInsights.map(i =>
                            i.title.length > 40 ? i.title.substring(0, 37) + '...' : i.title
                          ).join(' • ')
                          return `${stats.totalMetrics} quantitative metrics found — ${stats.avgDataDensity}% data density — Top data: ${titles}`
                        } else {
                          const topInsights = insights.slice(0, 2).map(i =>
                            i.title.length > 35 ? i.title.substring(0, 32) + '...' : i.title
                          ).join(' • ')
                          return `${stats.avgConfidence}% confidence synthesis — Key concepts: ${topInsights}`
                        }
                      })()}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[9px] text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wide flex-shrink-0">Explore:</span>
                    <p className="text-[10px] text-slate-700 dark:text-relic-ghost leading-relaxed">
                      {(() => {
                        const connectedInsights = insights.filter(i =>
                          connections.some(c => c.from === i.id || c.to === i.id)
                        ).slice(0, 2)

                        if (connections.length > 0 && connectedInsights.length > 0) {
                          const titles = connectedInsights.map(i =>
                            i.title.length > 30 ? i.title.substring(0, 27) + '...' : i.title
                          ).join(' ↔ ')
                          return `${connections.length} semantic connections — ${viewMode === 'tree' ? 'Tree view' : 'List view'} — Click to explore: ${titles}`
                        } else {
                          const topInsight = insights[0]
                          return `${viewMode === 'tree' ? 'Tree view active' : 'List view active'} — Click "${topInsight.title.substring(0, 40)}..." to ${topInsight.metrics.length > 0 ? `see ${topInsight.metrics.length} metrics` : 'explore deeper'}`
                        }
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export function shouldShowLayers(content: string, hasGnosticData: boolean = false): boolean {
  // ALWAYS show if gnostic data exists (user wants max capabilities)
  if (hasGnosticData) {
    return true
  }

  // For non-gnostic responses, show if there's ANY structure
  const headerCount = (content.match(/^#+\s*.+$/gm) || []).length
  const boldCount = (content.match(/\*\*[^*]+\*\*/g) || []).length
  const bulletCount = (content.match(/^[-•*]\s+.+$/gm) || []).length

  // Much lower threshold - show for any structured content
  return headerCount >= 1 || boldCount >= 2 || bulletCount >= 2 || content.length > 300
}
