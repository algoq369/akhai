'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  LinkIcon,
  Squares2X2Icon,
  ListBulletIcon,
  MapIcon,
  ChevronRightIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import { MapPinIcon as MapPinIconSolid } from '@heroicons/react/24/solid'
import MindMapTableView from './MindMapTableView'
import MindMapDiagramView from './MindMapDiagramView'

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

type ViewMode = 'graph' | 'table'

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

function getCategoryStyle(category: string | null | undefined) {
  const cat = category?.toLowerCase() || 'other'
  return CATEGORY_COLORS[cat] || CATEGORY_COLORS.other
}

export default function MindMap({ isOpen, onClose, userId, initialView }: MindMapProps) {
  const [nodes, setNodes] = useState<Node[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>(initialView || 'graph')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [connections, setConnections] = useState<Connection[]>([])
  const [showConnections, setShowConnections] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showPinned, setShowPinned] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [queryPanel, setQueryPanel] = useState<{ query: string; nodeId: string } | null>(null)

  useEffect(() => {
    if (initialView && isOpen) {
      setViewMode(initialView)
    }
  }, [initialView, isOpen])

  useEffect(() => {
    if (!isOpen || !userId) return
    
    const fetchData = async () => {
      try {
        const res = await fetch('/api/mindmap/data')
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

    if (categoryFilter !== 'all') {
      result = result.filter(n => (n.category || 'other').toLowerCase() === categoryFilter.toLowerCase())
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(n =>
        n.name.toLowerCase().includes(q) ||
        n.description?.toLowerCase().includes(q)
      )
    }

    if (showPinned) {
      result = result.filter(n => n.pinned)
    }

    return result
  }, [nodes, searchQuery, showPinned, categoryFilter])

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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40 bg-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200/60">
        <div className="flex items-center justify-between px-5 py-3">
          <div>
            <h1 className="text-lg font-medium text-slate-900">Mind Map</h1>
            <p className="text-xs text-slate-400">Visualize your knowledge graph</p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
            {[
              { id: 'graph', label: 'Graph', icon: Squares2X2Icon },
              { id: 'table', label: 'Table', icon: ListBulletIcon },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setViewMode(id as ViewMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg">
            <XMarkIcon className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-2 border-t border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {/* Category filter dropdown */}
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`appearance-none pl-7 pr-6 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  categoryFilter !== 'all'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <option value="all">All ({nodes.length})</option>
                {categories.map(([cat, count]) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)} ({count})
                  </option>
                ))}
              </select>
              <FunnelIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <svg className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            <button
              onClick={() => setShowPinned(!showPinned)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                showPinned ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MapPinIconSolid className="w-3.5 h-3.5" />
              Pinned
            </button>

            <button
              onClick={() => { setShowConnections(!showConnections); if (!showConnections) setShowSuggestions(false) }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                showConnections ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              Connections
              <span className="px-1 py-0.5 bg-slate-200 text-slate-600 text-[9px] rounded">{connections.length}</span>
            </button>

            <button
              onClick={() => { setShowSuggestions(!showSuggestions); if (!showSuggestions) setShowConnections(false) }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                showSuggestions ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <SparklesIcon className="w-3.5 h-3.5" />
              Suggestions
            </button>
          </div>

          <div className="ml-auto text-[10px] text-slate-400">
            {filteredNodes.length} topics
          </div>
        </div>

      </header>

      {/* Query Panel - shared between Graph and Table views */}
      <AnimatePresence>
        {queryPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-blue-200 bg-blue-50 overflow-hidden"
          >
            <div className="px-5 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-blue-700">Query Panel</span>
                <button
                  onClick={() => setQueryPanel(null)}
                  className="text-[10px] text-blue-500 hover:text-blue-700"
                >
                  Close
                </button>
              </div>
              <div className="bg-white rounded-lg border border-blue-200 p-3">
                <p className="text-xs text-slate-700 mb-2">{queryPanel.query}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(queryPanel.query)
                      setQueryPanel(null)
                    }}
                    className="text-[10px] px-3 py-1.5 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors font-medium"
                  >
                    Copy query
                  </button>
                  <button
                    onClick={() => {
                      window.open(`/?q=${encodeURIComponent(queryPanel.query)}`, '_blank')
                      setQueryPanel(null)
                    }}
                    className="text-[10px] px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors font-medium"
                  >
                    Open in chat
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <main className="h-[calc(100vh-140px)] flex">
        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : viewMode === 'table' ? (
            <MindMapTableView userId={userId} onQueryAction={(query, nodeId) => setQueryPanel({ query, nodeId: nodeId || '' })} />
          ) : (
            <MindMapDiagramView
              userId={userId}
              nodes={filteredNodes}
              searchQuery={searchQuery}
              onNodeAction={(query, nodeId) => setQueryPanel({ query, nodeId })}
            />
          )}
        </div>

        {/* Enhanced Side Panel */}
        <AnimatePresence>
          {(showConnections || showSuggestions) && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="h-full bg-slate-50 border-l border-slate-200 overflow-hidden flex-shrink-0"
            >
              <div className="h-full flex flex-col">
                {/* Panel Header */}
                <div className="flex-none p-3 bg-white border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    {showConnections ? (
                      <LinkIcon className="w-4 h-4 text-indigo-500" />
                    ) : (
                      <SparklesIcon className="w-4 h-4 text-amber-500" />
                    )}
                    <span className="text-xs font-semibold text-slate-700">
                      {showConnections ? 'Connection Explorer' : 'AI Suggestions'}
                    </span>
                    <span className="ml-auto text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {showConnections ? nodeConnections.length : suggestions.length}
                    </span>
                  </div>
                </div>

                {/* Panel Content */}
                <div className="flex-1 overflow-auto p-3">
                  {/* Connections Panel */}
                  {showConnections && (
                    <div className="space-y-2">
                      {nodeConnections.length > 0 ? (
                        nodeConnections.slice(0, 50).map((conn, i) => {
                          const fromNode = nodes.find(n => n.id === conn.from)
                          const toNode = nodes.find(n => n.id === conn.to)
                          return (
                            <div
                              key={i}
                              className="bg-white rounded-lg p-2 shadow-sm border border-slate-100 hover:border-indigo-200 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className="w-2 h-2 rounded-full flex-shrink-0"
                                      style={{ backgroundColor: getCategoryStyle(fromNode?.category).dot }}
                                    />
                                    <span className="text-[10px] font-medium text-slate-700 truncate">
                                      {fromNode?.name || '?'}
                                    </span>
                                  </div>
                                </div>
                                <ChevronRightIcon className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className="w-2 h-2 rounded-full flex-shrink-0"
                                      style={{ backgroundColor: getCategoryStyle(toNode?.category).dot }}
                                    />
                                    <span className="text-[10px] font-medium text-slate-700 truncate">
                                      {toNode?.name || '?'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="text-center py-8">
                          <LinkIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-[10px] text-slate-400">No connections found</p>
                          <p className="text-[9px] text-slate-300 mt-1">Topics will connect as you explore</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Suggestions Panel */}
                  {showSuggestions && (
                    <div className="space-y-2">
                      {suggestions.length > 0 ? (
                        suggestions.map(node => (
                          <div
                            key={node.id}
                            className="bg-white rounded-lg p-2.5 shadow-sm border border-slate-100 hover:border-amber-200 transition-colors"
                          >
                            <div className="flex items-start gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5"
                                style={{ backgroundColor: getCategoryStyle(node.category).dot }}
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-[11px] font-medium text-slate-700 line-clamp-2">
                                  {node.name}
                                </span>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className="text-[8px] text-slate-400 uppercase tracking-wide">
                                    {node.category || 'other'}
                                  </span>
                                  <span className="text-[8px] text-slate-300">•</span>
                                  <span className="text-[8px] text-slate-400">{node.queryCount || 0} queries</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1.5 mt-2">
                              <button
                                onClick={() => setSelectedNode(node)}
                                className="flex-1 text-[9px] px-2 py-1 bg-amber-50 text-amber-700 rounded hover:bg-amber-100 transition-colors font-medium"
                              >
                                Select
                              </button>
                              <button
                                onClick={() => window.open(`/?q=${encodeURIComponent(`Analyze ${node.name}`)}`, '_blank')}
                                className="flex-1 text-[9px] px-2 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors font-medium"
                              >
                                Analyze
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <SparklesIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-[10px] text-slate-400">No suggestions yet</p>
                          <p className="text-[9px] text-slate-300 mt-1">Select a topic to see related items</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer - 3-Line Synthetic Explanation */}
      {!loading && nodes.length > 0 && (
        <footer className="bg-gradient-to-r from-slate-50 via-white to-slate-50 border-t border-slate-200 px-6 py-3">
          <div className="max-w-7xl mx-auto">
            {/* High-Level Stats Row */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Topics:</span>
                  <span className="text-sm font-bold text-slate-700">{filteredNodes.length}</span>
                </div>
                <div className="w-px h-4 bg-slate-300" />
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Links:</span>
                  <span className="text-sm font-bold text-indigo-600">{connections.length}</span>
                </div>
                <div className="w-px h-4 bg-slate-300" />
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Categories:</span>
                  <span className="text-sm font-bold text-emerald-600">{categories.length}</span>
                </div>
                <div className="w-px h-4 bg-slate-300" />
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Density:</span>
                  <span className="text-sm font-bold text-blue-600">
                    {connections.length > 0 ? (connections.length / nodes.length).toFixed(1) : '0.0'}
                  </span>
                </div>
              </div>

              {/* Dominant Category */}
              {categories.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wide">Dominant:</span>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ backgroundColor: getCategoryStyle(categories[0][0]).bg }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getCategoryStyle(categories[0][0]).dot }} />
                    <span className="text-[10px] font-semibold" style={{ color: getCategoryStyle(categories[0][0]).dot }}>
                      {categories[0][0]}
                    </span>
                    <span className="text-[9px] text-slate-500">
                      {Math.round((categories[0][1] / nodes.length) * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 3-Line Synthetic Explanation */}
            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wide flex-shrink-0">Focus:</span>
                <p className="text-[10px] text-slate-700 leading-relaxed">
                  Persistent knowledge repository tracking {filteredNodes.length} topics across {categories.length} domains — {nodes.filter(n => n.pinned).length} pinned for priority access, {nodes.filter(n => !n.archived).length} actively maintained ({Math.round((nodes.filter(n => !n.archived).length / nodes.length) * 100)}% retention rate).
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[9px] text-emerald-600 font-semibold uppercase tracking-wide flex-shrink-0">Synergy:</span>
                <p className="text-[10px] text-slate-700 leading-relaxed">
                  {connections.length} verified connections with {connections.length > 0 ? (connections.length / nodes.length).toFixed(1) : '0.0'} average links per topic — {categories.length > 0 ? `${categories[0][0]} category dominates (${Math.round((categories[0][1] / nodes.length) * 100)}%)` : 'balanced distribution'}, enabling cross-domain pattern recognition and strategic insight bridging.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[9px] text-blue-600 font-semibold uppercase tracking-wide flex-shrink-0">Action:</span>
                <p className="text-[10px] text-slate-700 leading-relaxed">
                  {viewMode === 'graph' ? 'Graph view visualizes topic clusters and connection density — click nodes for details, pin high-value topics, archive obsolete items. Filter by category or search to navigate large knowledge bases efficiently.' : 'Table view enables bulk management — sort by query count to identify frequently accessed topics, edit AI instructions per topic for customized responses, export for external analysis.'}
                </p>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}

