'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import {
  XMarkIcon,
  Squares2X2Icon,
  ChevronRightIcon,
  ClockIcon,
  BookOpenIcon,
  LinkIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import DarkModeToggle from './DarkModeToggle'
import MindMapHistoryView from './MindMapHistoryView'
import SefirotConsole from './SefirotConsole'
import { TopicExpansionPanel } from './TopicExpansionPanel'
import MindMapGrimoireView from './MindMapGrimoireView'

// Dynamic import with SSR disabled for ReactFlow-based components
const AkhAIMindMap = dynamic(
  () => import('./akhai-mindmap').then(mod => mod.AkhAIMindMap),
  { ssr: false, loading: () => <MindMapLoadingPlaceholder /> }
)

// Loading placeholder component
function MindMapLoadingPlaceholder() {
  return (
    <div className="h-full flex items-center justify-center bg-[#fafafa]">
      <div className="text-center">
        <div className="animate-spin w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full mx-auto mb-2" />
        <p className="text-xs text-slate-500 font-mono">Loading mind map...</p>
      </div>
    </div>
  )
}

import { Sefirah } from '@/lib/ascent-tracker'

export interface Node {
  id: string
  name: string
  description: string | null
  category: string | null
  color: string
  pinned: boolean
  archived: boolean
  ai_instructions: string | null
  queryCount: number
  // Intelligence fields
  dominantSefirah?: Sefirah | null
  sefirotActivations?: Record<number, number>
  size?: number
  borderColor?: string
}

interface Connection {
  from: string
  to: string
  fromName?: string
  toName?: string
}

interface MindMapProps {
  isOpen: boolean
  onClose: () => void
  userId: string | null
  initialView?: ViewMode
}

type ViewMode = 'graph' | 'history' | 'grimoire'

const CATEGORY_COLORS: Record<string, { bg: string; dot: string }> = {
  business: { bg: '#ECFDF5', dot: '#10B981' },
  technology: { bg: '#EEF2FF', dot: '#6366F1' },
  finance: { bg: '#FEF3C7', dot: '#F59E0B' },
  environment: { bg: '#ECFDF5', dot: '#059669' },
  psychology: { bg: '#F5F3FF', dot: '#8B5CF6' },
  infrastructure: { bg: '#F0F9FF', dot: '#0EA5E9' },
  regulation: { bg: '#FDF2F8', dot: '#EC4899' },
  engineering: { bg: '#FEF3C7', dot: '#D97706' },
  social: { bg: '#FDF4FF', dot: '#C026D3' },
  science: { bg: '#F0F9FF', dot: '#0284C7' },
  health: { bg: '#FDF2F8', dot: '#DB2777' },
  education: { bg: '#F5F3FF', dot: '#7C3AED' },
  other: { bg: '#F8FAFC', dot: '#64748B' },
}

function getCategoryStyle(category: string | null) {
  const cat = category?.toLowerCase() || 'other'
  return CATEGORY_COLORS[cat] || CATEGORY_COLORS.other
}

export default function MindMap({ isOpen, onClose, userId, initialView }: MindMapProps) {
  const [nodes, setNodes] = useState<Node[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>(initialView || 'graph')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [connections, setConnections] = useState<Connection[]>([])
  const [showConnections, setShowConnections] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [sefirotConsoleOpen, setSefirotConsoleOpen] = useState(false)
  // Inline research panel state
  const [researchPanel, setResearchPanel] = useState<{
    isOpen: boolean
    query: string
    result: string
    isLoading: boolean
    nodeId?: string
  }>({
    isOpen: false,
    query: '',
    result: '',
    isLoading: false
  })
  // Topic expansion panel state
  const [expansionPanel, setExpansionPanel] = useState<{
    isOpen: boolean
    topicId: string | null
  }>({
    isOpen: false,
    topicId: null
  })

  useEffect(() => {
    if (!isOpen || !userId) return

    const fetchData = async () => {
      try {
        // Fetch with intelligence data for Sefirot colors
        const res = await fetch('/api/mindmap/data?intelligence=true')
        if (res.ok) {
          const data = await res.json()
          setNodes(data.nodes || [])
          const conns = (data.connections || []).map((c: any) => ({
            ...c,
            fromName: data.nodes?.find((n: Node) => n.id === c.from)?.name,
            toName: data.nodes?.find((n: Node) => n.id === c.to)?.name,
          }))
          setConnections(conns)
        }
      } catch (error) {
        console.error('Failed to fetch:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [isOpen, userId])

  const categories = useMemo(() => {
    const cats = new Map<string, number>()
    nodes.forEach(n => {
      const cat = n.category || 'other'
      cats.set(cat, (cats.get(cat) || 0) + 1)
    })
    return Array.from(cats.entries()).sort((a, b) => b[1] - a[1])
  }, [nodes])

  const filteredNodes = useMemo(() => {
    let result = [...nodes]

    // Filter out high query count nodes (likely test/spam or overly generic topics)
    const MAX_QUERY_COUNT_THRESHOLD = 50
    result = result.filter(n => (n.queryCount || 0) <= MAX_QUERY_COUNT_THRESHOLD)

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(n =>
        n.name.toLowerCase().includes(q) ||
        n.description?.toLowerCase().includes(q)
      )
    }

    if (categoryFilter !== 'all') {
      result = result.filter(n => (n.category || 'other').toLowerCase() === categoryFilter.toLowerCase())
    }

    return result
  }, [nodes, searchQuery, categoryFilter])

  const nodeConnections = useMemo(() => {
    if (!selectedNode) return connections
    return connections.filter(c => c.from === selectedNode.id || c.to === selectedNode.id)
  }, [selectedNode, connections])

  const suggestions = useMemo(() => {
    if (!selectedNode) return nodes.slice(0, 8)
    return nodes.filter(n =>
      n.id !== selectedNode.id &&
      (n.category || 'other').toLowerCase() === (selectedNode.category || 'other').toLowerCase()
    ).slice(0, 8)
  }, [selectedNode, nodes])

  // Handle inline query execution (Analyze/Summary) - Creates expandable research panel
  const handleInlineQuery = useCallback(async (query: string, nodeId?: string) => {
    // Open panel and set loading state
    setResearchPanel({
      isOpen: true,
      query,
      result: '',
      isLoading: true,
      nodeId
    })

    try {
      // Call API to get response
      const res = await fetch('/api/simple-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          methodology: 'direct',
          conversationHistory: []
        })
      })

      const data = await res.json()

      // Update panel with result
      setResearchPanel(prev => ({
        ...prev,
        result: data.response || 'No response available',
        isLoading: false
      }))
    } catch (error) {
      console.error('Inline research error:', error)
      setResearchPanel(prev => ({
        ...prev,
        result: 'Error: Failed to get response. Please try again.',
        isLoading: false
      }))
    }
  }, [])

  // Handle topic expansion - Opens TopicExpansionPanel
  const handleTopicExpansion = useCallback((topicId: string) => {
    setExpansionPanel({
      isOpen: true,
      topicId
    })
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40 bg-white dark:bg-relic-void">
      {/* Header */}
      <header className="bg-white dark:bg-relic-void border-b border-slate-200/60 dark:border-relic-slate/30">
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="text-xs text-relic-silver dark:text-relic-ghost hover:text-relic-slate dark:hover:text-white transition-colors"
            >
              ← back
            </button>
            <div>
              <h1 className="text-lg font-medium text-slate-900 dark:text-white">Mind Map</h1>
              <p className="text-xs text-slate-400 dark:text-relic-silver">Visualize your knowledge graph</p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-relic-slate/20 p-0.5 rounded-lg">
            {[
              { id: 'graph', label: 'Graph', icon: Squares2X2Icon },
              { id: 'history', label: 'History', icon: ClockIcon },
              { id: 'grimoire', label: 'Grimoire', icon: BookOpenIcon },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setViewMode(id as ViewMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === id
                    ? 'bg-white dark:bg-relic-slate text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-relic-silver hover:text-slate-700 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Tree of Life Console Toggle */}
            <motion.button
              onClick={() => setSefirotConsoleOpen(!sefirotConsoleOpen)}
              className="text-[14px] transition-all duration-200"
              style={{
                color: sefirotConsoleOpen ? '#a855f7' : '#cbd5e1',
                filter: sefirotConsoleOpen ? 'drop-shadow(0 0 4px #a855f7)' : 'none'
              }}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.9 }}
              title="Tree of Life Configuration"
            >
              ✦
            </motion.button>

            <DarkModeToggle />
          </div>
        </div>

        {/* Toolbar - Minimalist */}
        <div className="flex items-center gap-4 px-5 py-2 border-t border-relic-mist/30 dark:border-relic-slate/30 font-mono">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <input
              type="text"
              placeholder="search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 bg-transparent border border-relic-mist/50 dark:border-relic-slate/30 text-[11px] text-relic-void dark:text-white placeholder:text-relic-silver/50 focus:outline-none focus:border-relic-slate/50"
            />
          </div>

          {/* Minimal text controls */}
          <div className="flex items-center gap-4 text-[10px]">
            <span
              onClick={() => { setShowSuggestions(!showSuggestions); if (!showSuggestions) setShowConnections(false) }}
              className={`cursor-pointer transition-colors ${
                showSuggestions ? 'text-relic-void dark:text-white' : 'text-relic-silver hover:text-relic-slate dark:hover:text-relic-ghost'
              }`}
            >
              [{showSuggestions ? '●' : '○'}] suggestions
            </span>

            <span
              onClick={() => { setShowConnections(!showConnections); if (!showConnections) setShowSuggestions(false) }}
              className={`cursor-pointer transition-colors ${
                showConnections ? 'text-relic-void dark:text-white' : 'text-relic-silver hover:text-relic-slate dark:hover:text-relic-ghost'
              }`}
            >
              [{showConnections ? '●' : '○'}] links ({connections.length})
            </span>

            {/* Category dropdown - minimal */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent border-none text-[10px] text-relic-silver dark:text-relic-ghost cursor-pointer focus:outline-none"
            >
              <option value="all">all ({nodes.length})</option>
              {categories.map(([cat, count]) => (
                <option key={cat} value={cat}>{cat} ({count})</option>
              ))}
            </select>
          </div>

          <span className="ml-auto text-[9px] text-relic-silver">
            {filteredNodes.length} nodes
          </span>
        </div>

      </header>

      {/* Main */}
      <main className="h-[calc(100vh-140px)] flex">
        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading && viewMode !== 'history' && viewMode !== 'grimoire' ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-5 h-5 border-2 border-slate-200 dark:border-relic-slate border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin" />
            </div>
          ) : viewMode === 'history' ? (
            <MindMapHistoryView onClose={onClose} onTopicExpand={handleTopicExpansion} />
          ) : viewMode === 'grimoire' ? (
            <MindMapGrimoireView userId={userId} selectedTopics={filteredNodes.map(n => n.id)} onTopicExpand={handleTopicExpansion} />
          ) : (
            <AkhAIMindMap
              topics={filteredNodes.map(n => ({
                id: n.id,
                name: n.name,
                description: n.description,
                category: n.category,
                queryCount: n.queryCount,
                color: n.color
              }))}
              connections={connections}
              userId={userId}
              onTopicExpand={handleTopicExpansion}
            />
          )}
        </div>

        {/* Side Panel */}
        <AnimatePresence>
          {(showConnections || showSuggestions) && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="h-full bg-white dark:bg-relic-void border-l border-slate-200 dark:border-relic-slate/30 overflow-hidden flex-shrink-0"
            >
              <div className="h-full overflow-auto p-3">
                {/* Connections */}
                {showConnections && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <LinkIcon className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                      <span className="text-[10px] font-semibold text-slate-700 dark:text-white">Connections</span>
                      <span className="text-[8px] text-slate-400 dark:text-relic-silver">({nodeConnections.length})</span>
                    </div>
                    {nodeConnections.length > 0 ? (
                      <div className="space-y-0.5 max-h-52 overflow-auto">
                        {nodeConnections.slice(0, 30).map((conn, i) => {
                          const fromNode = nodes.find(n => n.id === conn.from)
                          const toNode = nodes.find(n => n.id === conn.to)
                          return (
                            <div key={i} className="flex items-center gap-1 p-1 rounded hover:bg-slate-50 text-[8px]">
                              <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: getCategoryStyle(fromNode?.category ?? null).dot }} />
                              <span className="text-slate-600 truncate flex-1">{fromNode?.name || '?'}</span>
                              <ChevronRightIcon className="w-2 h-2 text-slate-300 flex-shrink-0" />
                              <span className="text-slate-600 truncate flex-1">{toNode?.name || '?'}</span>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-[9px] text-slate-400 text-center py-4">No connections</p>
                    )}
                  </div>
                )}

                {/* Suggestions */}
                {showSuggestions && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <SparklesIcon className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[10px] font-semibold text-slate-700">Related Topics</span>
                    </div>
                    <div className="space-y-0.5">
                      {suggestions.map(node => (
                        <button
                          key={node.id}
                          onClick={() => setSelectedNode(node)}
                          className="w-full flex items-center gap-1.5 p-1 rounded hover:bg-slate-50 text-left"
                        >
                          <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: getCategoryStyle(node.category).dot }} />
                          <span className="text-[9px] text-slate-600 truncate">{node.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer - Enhanced Insights & Valuable Metrics */}
      {!loading && nodes.length > 0 && (
        <footer className="bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-relic-void dark:via-relic-void/90 dark:to-relic-void border-t border-slate-200 dark:border-relic-slate/30 px-6 py-3.5">
          <div className="max-w-7xl mx-auto">
            {/* First Row: Core Network Metrics */}
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100 dark:border-relic-slate/30">
              <div className="flex items-center gap-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-slate-500 dark:text-relic-silver uppercase tracking-wider font-semibold">Network:</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-white">{filteredNodes.length}</span>
                  <span className="text-[8px] text-slate-400 dark:text-relic-silver">topics</span>
                </div>
                <div className="w-px h-4 bg-slate-300 dark:bg-relic-slate/50" />
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-indigo-600 uppercase tracking-wider font-semibold">Links:</span>
                  <span className="text-sm font-bold text-indigo-600">{connections.length}</span>
                  <span className="text-[8px] text-slate-400">({connections.length > 0 ? (connections.length / nodes.length).toFixed(1) : '0.0'}/topic)</span>
                </div>
                <div className="w-px h-4 bg-slate-300" />
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-emerald-600 uppercase tracking-wider font-semibold">Queries:</span>
                  <span className="text-sm font-bold text-emerald-600">{nodes.reduce((sum, n) => sum + (n.queryCount || 0), 0)}</span>
                  <span className="text-[8px] text-slate-400">total</span>
                </div>
                <div className="w-px h-4 bg-slate-300" />
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-amber-600 uppercase tracking-wider font-semibold">Hot Topics:</span>
                  <span className="text-sm font-bold text-amber-600">{nodes.filter(n => (n.queryCount || 0) > 5).length}</span>
                  <span className="text-[8px] text-slate-400">({Math.round((nodes.filter(n => (n.queryCount || 0) > 5).length / nodes.length) * 100)}%)</span>
                </div>
                <div className="w-px h-4 bg-slate-300" />
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-blue-600 uppercase tracking-wider font-semibold">Pinned:</span>
                  <span className="text-sm font-bold text-blue-600">{nodes.filter(n => n.pinned).length}</span>
                  <span className="text-[8px] text-slate-400">priority</span>
                </div>
              </div>

              {/* Dominant Category + Coverage */}
              {categories.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wide">Coverage:</span>
                    <span className="text-[10px] font-mono text-slate-600">{categories.length} domains</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ backgroundColor: getCategoryStyle(categories[0][0]).bg }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getCategoryStyle(categories[0][0]).dot }} />
                    <span className="text-[10px] font-semibold" style={{ color: getCategoryStyle(categories[0][0]).dot }}>
                      {categories[0][0]}
                    </span>
                    <span className="text-[9px] text-slate-500">
                      {Math.round((categories[0][1] / nodes.length) * 100)}% dominant
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Second Row: Value Insights (3 lines) */}
            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wide flex-shrink-0">📊 Density:</span>
                <p className="text-[10px] text-slate-700 leading-relaxed">
                  {connections.length > 0 ? (connections.length / nodes.length).toFixed(2) : '0.00'} links/topic average · {nodes.filter(n => (n.queryCount || 0) > 10).length} high-activity nodes (10+ queries) · {Math.round((nodes.filter(n => !n.archived).length / nodes.length) * 100)}% active retention · Network clustering suggests {categories.length > 3 ? 'strong cross-domain synergy' : 'focused specialization'}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wide flex-shrink-0">💡 Intelligence:</span>
                <p className="text-[10px] text-slate-700 leading-relaxed">
                  {nodes.filter(n => n.ai_instructions).length} topics have custom AI instructions ({Math.round((nodes.filter(n => n.ai_instructions).length / nodes.length) * 100)}% specialized) · Top category ({categories[0]?.[0] || 'N/A'}) accounts for {Math.round((categories[0]?.[1] || 0) / nodes.length * 100)}% of knowledge base · {nodes.filter(n => n.pinned).length} pinned for strategic priority · Avg {(nodes.reduce((sum, n) => sum + (n.queryCount || 0), 0) / nodes.length).toFixed(1)} queries/topic indicates {nodes.reduce((sum, n) => sum + (n.queryCount || 0), 0) / nodes.length > 3 ? 'heavy utilization' : 'selective usage'}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[9px] text-blue-600 font-bold uppercase tracking-wide flex-shrink-0">🎯 Actionable:</span>
                <p className="text-[10px] text-slate-700 leading-relaxed">
                  {viewMode === 'graph' ? `Graph view reveals ${connections.length} connections · Click nodes → Analyze (deep dive) or Summary (quick overview) · Pin high-value topics for dashboard access · Archive stale nodes to maintain quality` : `Table view shows ${filteredNodes.length} topics sorted by activity · Use Analyze/Summary actions inline (no page switch) · Filter ${categories.length} categories · Export data for external analysis or reporting`} · Side chat enables parallel research without losing context
                </p>
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* Inline Research Panel - Expandable output for Analyze/Summary */}
      <AnimatePresence>
        {researchPanel.isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-relic-void border-t-2 border-blue-500 dark:border-blue-400 shadow-2xl z-50 overflow-hidden"
            style={{ maxHeight: '60vh' }}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-b border-blue-200 dark:border-blue-800/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 dark:bg-blue-600 rounded-lg">
                    <SparklesIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Research Output</h3>
                    <p className="text-[10px] text-slate-500 dark:text-relic-silver truncate max-w-2xl">{researchPanel.query}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {researchPanel.isLoading && (
                    <div className="flex items-center gap-2 text-[10px] text-blue-600 dark:text-blue-400">
                      <div className="w-3 h-3 border-2 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin" />
                      Researching...
                    </div>
                  )}
                  <button
                    onClick={() => setResearchPanel(prev => ({ ...prev, isOpen: false }))}
                    className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4 text-slate-500 dark:text-relic-silver" />
                  </button>
                </div>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto px-5 py-4 bg-white dark:bg-relic-void">
                {researchPanel.isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-relic-silver">
                    <div className="w-8 h-8 border-3 border-slate-200 dark:border-relic-slate border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin mb-3" />
                    <p className="text-sm">Analyzing data...</p>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div className="text-sm text-slate-700 dark:text-relic-ghost leading-relaxed whitespace-pre-wrap">
                      {researchPanel.result}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between px-5 py-2.5 bg-slate-50 dark:bg-relic-slate/20 border-t border-slate-200 dark:border-relic-slate/30">
                <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-relic-silver">
                  <span>Output generated from Mind Map query</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (typeof navigator !== 'undefined' && navigator.clipboard) {
                        navigator.clipboard.writeText(researchPanel.result)
                      }
                    }}
                    className="px-3 py-1.5 text-[11px] font-medium text-slate-600 dark:text-relic-silver bg-white dark:bg-relic-slate/30 border border-slate-200 dark:border-relic-slate/50 rounded-lg hover:bg-slate-50 dark:hover:bg-relic-slate/40 transition-colors"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => setResearchPanel(prev => ({ ...prev, isOpen: false }))}
                    className="px-3 py-1.5 text-[11px] font-medium text-white bg-blue-500 dark:bg-blue-600 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Topic Expansion Panel */}
      {expansionPanel.isOpen && expansionPanel.topicId && (
        <TopicExpansionPanel
          topicId={expansionPanel.topicId}
          topicName={nodes.find(n => n.id === expansionPanel.topicId)?.name || ''}
          topicDescription={nodes.find(n => n.id === expansionPanel.topicId)?.description || undefined}
          category={nodes.find(n => n.id === expansionPanel.topicId)?.category || undefined}
          relatedTopics={connections
            .filter(c => c.from === expansionPanel.topicId || c.to === expansionPanel.topicId)
            .map(c => c.from === expansionPanel.topicId ? c.toName : c.fromName)
            .filter((name): name is string => name !== undefined)
          }
          onClose={() => setExpansionPanel({ isOpen: false, topicId: null })}
          onQueryAction={handleInlineQuery}
        />
      )}

      {/* Sefirot Console - Tree of Life Configuration */}
      <SefirotConsole
        isOpen={sefirotConsoleOpen}
        onToggle={() => setSefirotConsoleOpen(!sefirotConsoleOpen)}
      />
    </div>
  )
}

