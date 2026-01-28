'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  LinkIcon,
  Squares2X2Icon,
  ClockIcon,
  BookOpenIcon,
  ChevronRightIcon,
  FunnelIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  LightBulbIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline'
import { MapPinIcon as MapPinIconSolid } from '@heroicons/react/24/solid'
import MindMapTableView from './MindMapTableView'
import MindMapDiagramView from './MindMapDiagramView'
import MindMapHistoryView from './MindMapHistoryView'
import MindMapGrimoireView from './MindMapGrimoireView'

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

type ViewMode = 'graph' | 'history' | 'grimoire'

interface MindMapProps {
  isOpen: boolean
  onClose: () => void
  userId: string | null
  initialView?: ViewMode
}

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
  mathematics: { bg: '#FEF3C7', dot: '#B45309' },
  politics: { bg: '#FEE2E2', dot: '#DC2626' },
  philosophy: { bg: '#E0E7FF', dot: '#4338CA' },
  other: { bg: '#F8FAFC', dot: '#64748B' },
}

function getCategoryStyle(category: string | null | undefined) {
  const cat = category?.toLowerCase() || 'other'
  return CATEGORY_COLORS[cat] || CATEGORY_COLORS.other
}

export default function MindMap({ isOpen, onClose, userId, initialView = 'graph' }: MindMapProps) {
  const [nodes, setNodes] = useState<Node[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>(initialView)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [connections, setConnections] = useState<Connection[]>([])
  const [showConnections, setShowConnections] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showPinned, setShowPinned] = useState(false)
  
  // Graph-specific state
  const [selectedGraphNode, setSelectedGraphNode] = useState<{ id: string; name: string; category?: string } | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  
  // Mini Chat state
  const [miniChatOpen, setMiniChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')

  // Sync viewMode with initialView when it changes
  useEffect(() => {
    setViewMode(initialView)
  }, [initialView])

  // Update chat input when node is selected
  useEffect(() => {
    if (selectedGraphNode) {
      setChatInput(`Tell me more about ${selectedGraphNode.name}`)
    }
  }, [selectedGraphNode])

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

  // Categories with counts
  const categories = useMemo(() => {
    const cats = new Map<string, number>()
    nodes.forEach(n => {
      const cat = n.category || 'other'
      cats.set(cat, (cats.get(cat) || 0) + 1)
    })
    return Array.from(cats.entries()).sort((a, b) => b[1] - a[1])
  }, [nodes])

  // Filtered nodes (by search, category, pinned)
  const filteredNodes = useMemo(() => {
    let result = [...nodes]

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

    if (showPinned) {
      result = result.filter(n => n.pinned)
    }

    return result
  }, [nodes, searchQuery, categoryFilter, showPinned])

  // Connections for selected node
  const nodeConnections = useMemo(() => {
    if (!selectedGraphNode) return connections
    return connections.filter(c => c.from === selectedGraphNode.id || c.to === selectedGraphNode.id)
  }, [selectedGraphNode, connections])

  // AI Suggestions based on selected node
  const suggestions = useMemo(() => {
    if (!selectedGraphNode) return nodes.slice(0, 8)
    return nodes.filter(n => 
      n.id !== selectedGraphNode.id && 
      (n.category || 'other').toLowerCase() === (selectedGraphNode.category || 'other').toLowerCase()
    ).slice(0, 8)
  }, [selectedGraphNode, nodes])

  // Quick actions for mini chat
  const quickActions = useMemo(() => {
    if (!selectedGraphNode) return [
      { label: 'Explore topics', query: 'What topics have I explored most?' },
      { label: 'Find patterns', query: 'Find connections between my ideas' },
      { label: 'Suggest research', query: 'Suggest new research directions' },
    ]
    return [
      { label: 'Analyze', query: `Analyze ${selectedGraphNode.name} in depth` },
      { label: 'Connect', query: `Find connections for ${selectedGraphNode.name}` },
      { label: 'Expand', query: `Explore related topics to ${selectedGraphNode.name}` },
    ]
  }, [selectedGraphNode])

  const handleSendQuery = (query: string) => {
    window.open(`/?q=${encodeURIComponent(query)}`, '_blank')
    setChatInput('')
  }

  const handleNodeSelect = (node: { id: string; name: string; category?: string } | null) => {
    setSelectedGraphNode(node)
    if (node) {
      // Auto-open suggestions when a node is selected
      setShowSuggestions(true)
      setShowConnections(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40 bg-white dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-5 py-3">
          <div>
            <h1 className="text-lg font-medium text-slate-900 dark:text-white">Mind Map</h1>
            <p className="text-xs text-slate-400 dark:text-slate-500">Visualize your knowledge graph</p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 p-0.5 rounded-lg">
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
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
            <XMarkIcon className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-2 border-t border-slate-100 dark:border-slate-700">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 dark:text-slate-200"
            />
          </div>

          {/* Category Filter - Graph View Only */}
          {viewMode === 'graph' && (
            <div className="relative">
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  categoryFilter !== 'all' 
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800' 
                    : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'
                }`}
              >
                <FunnelIcon className="w-3.5 h-3.5" />
                {categoryFilter === 'all' ? 'All Topics' : categoryFilter}
                <span className="px-1 py-0.5 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-[9px] rounded">
                  {categoryFilter === 'all' ? filteredNodes.length : categories.find(c => c[0].toLowerCase() === categoryFilter.toLowerCase())?.[1] || 0}
                </span>
              </button>

              {/* Category Dropdown */}
              <AnimatePresence>
                {showCategoryDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden"
                  >
                    <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Filter by Category</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1">
                      <button
                        onClick={() => { setCategoryFilter('all'); setShowCategoryDropdown(false) }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                          categoryFilter === 'all' 
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                        <span className="flex-1 text-left font-medium">All Topics</span>
                        <span className="text-[10px] text-slate-400">{nodes.length}</span>
                      </button>
                      {categories.map(([cat, count]) => {
                        const style = getCategoryStyle(cat)
                        return (
                          <button
                            key={cat}
                            onClick={() => { setCategoryFilter(cat); setShowCategoryDropdown(false) }}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                              categoryFilter.toLowerCase() === cat.toLowerCase()
                                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: style.dot }} />
                            <span className="flex-1 text-left font-medium capitalize">{cat}</span>
                            <span className="text-[10px] text-slate-400">{count}</span>
                          </button>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowPinned(!showPinned)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                showPinned ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
              }`}
            >
              <MapPinIconSolid className="w-3.5 h-3.5" />
              Pinned
            </button>

            <button
              onClick={() => { setShowConnections(!showConnections); if (!showConnections) setShowSuggestions(false) }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                showConnections ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              Connections
              <span className="px-1 py-0.5 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-[9px] rounded">{connections.length}</span>
            </button>

            <button
              onClick={() => { setShowSuggestions(!showSuggestions); if (!showSuggestions) setShowConnections(false) }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                showSuggestions ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
              }`}
            >
              <SparklesIcon className="w-3.5 h-3.5" />
              Suggestions
            </button>
          </div>

          <div className="ml-auto text-[10px] text-slate-400 dark:text-slate-500">
            {filteredNodes.length} topics
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="h-[calc(100vh-140px)] flex">
        {/* Content */}
        <div className="flex-1 overflow-hidden relative">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-5 h-5 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          ) : viewMode === 'graph' ? (
            <div className="relative w-full h-full">
              <MindMapDiagramView
                userId={userId}
                nodes={filteredNodes}
                searchQuery={searchQuery}
                onNodeSelect={handleNodeSelect}
                onNodeAction={(query, nodeId) => handleSendQuery(query)}
              />
              
              {/* Integrated Mini Chat Panel */}
              <div className="absolute bottom-4 left-4 z-50">
                {/* Toggle Button */}
                <motion.button
                  onClick={() => setMiniChatOpen(!miniChatOpen)}
                  className={`p-3 rounded-full shadow-lg transition-all ${
                    miniChatOpen 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {miniChatOpen ? <XMarkIcon className="w-5 h-5" /> : <ChatBubbleLeftRightIcon className="w-5 h-5" />}
                </motion.button>

                {/* Chat Panel */}
                <AnimatePresence>
                  {miniChatOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 20, scale: 0.9 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                      className="absolute bottom-16 left-0 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                    >
                      {/* Header */}
                      <div className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                        <div className="flex items-center gap-2">
                          <LightBulbIcon className="w-4 h-4" />
                          <h3 className="font-semibold text-sm">Quick Query</h3>
                        </div>
                        {selectedGraphNode && (
                          <p className="text-xs text-white/80 mt-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                            Context: {selectedGraphNode.name}
                          </p>
                        )}
                      </div>

                      {/* Quick Actions */}
                      <div className="p-2 border-b border-slate-200 dark:border-slate-700 flex gap-1.5">
                        {quickActions.map((action) => (
                          <button
                            key={action.label}
                            onClick={() => handleSendQuery(action.query)}
                            className="flex-1 flex items-center justify-center gap-1 px-2 py-2 text-[10px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>

                      {/* Selected Node Context */}
                      {selectedGraphNode && (
                        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600">
                          <div className="flex items-center gap-2">
                            <span 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: getCategoryStyle(selectedGraphNode.category).dot }}
                            />
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate flex-1">
                              {selectedGraphNode.name}
                            </span>
                            <button
                              onClick={() => window.open(`/?q=${encodeURIComponent(`Analyze ${selectedGraphNode.name}`)}`, '_blank')}
                              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"
                            >
                              <ArrowTopRightOnSquareIcon className="w-3 h-3 text-slate-400" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Input */}
                      <form onSubmit={(e) => { e.preventDefault(); if (chatInput.trim()) handleSendQuery(chatInput) }} className="p-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Ask anything..."
                            className="flex-1 px-3 py-2.5 text-sm bg-slate-100 dark:bg-slate-700 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-200 placeholder-slate-400"
                          />
                          <button
                            type="submit"
                            disabled={!chatInput.trim()}
                            className="p-2.5 bg-indigo-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-600 transition-colors"
                          >
                            <PaperAirplaneIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : viewMode === 'history' ? (
            <MindMapHistoryView onClose={onClose} />
          ) : viewMode === 'grimoire' ? (
            <MindMapGrimoireView userId={userId} selectedTopics={[]} />
          ) : null}
        </div>

        {/* Side Panel - Connections & Suggestions */}
        <AnimatePresence>
          {(showConnections || showSuggestions) && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="h-full bg-slate-50 dark:bg-slate-800/50 border-l border-slate-200 dark:border-slate-700 overflow-hidden flex-shrink-0"
            >
              <div className="h-full flex flex-col">
                {/* Panel Header */}
                <div className="flex-none p-3 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    {showConnections ? (
                      <LinkIcon className="w-4 h-4 text-indigo-500" />
                    ) : (
                      <SparklesIcon className="w-4 h-4 text-amber-500" />
                    )}
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {showConnections ? 'Connection Explorer' : 'AI Suggestions'}
                    </span>
                    <span className="ml-auto text-[9px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                      {showConnections ? nodeConnections.length : suggestions.length}
                    </span>
                  </div>
                  {selectedGraphNode && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
                      <span 
                        className="w-1.5 h-1.5 rounded-full" 
                        style={{ backgroundColor: getCategoryStyle(selectedGraphNode.category).dot }}
                      />
                      Showing for: {selectedGraphNode.name}
                    </p>
                  )}
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
                              className="bg-white dark:bg-slate-700 rounded-lg p-2.5 shadow-sm border border-slate-100 dark:border-slate-600 hover:border-indigo-200 dark:hover:border-indigo-500 transition-colors cursor-pointer"
                              onClick={() => {
                                const node = fromNode?.id === selectedGraphNode?.id ? toNode : fromNode
                                if (node) handleNodeSelect({ id: node.id, name: node.name, category: node.category || undefined })
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className="w-2 h-2 rounded-full flex-shrink-0"
                                      style={{ backgroundColor: getCategoryStyle(fromNode?.category).dot }}
                                    />
                                    <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300 truncate">
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
                                    <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300 truncate">
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
                          <LinkIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">No connections found</p>
                          <p className="text-[9px] text-slate-300 dark:text-slate-600 mt-1">Topics will connect as you explore</p>
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
                            className="bg-white dark:bg-slate-700 rounded-lg p-3 shadow-sm border border-slate-100 dark:border-slate-600 hover:border-amber-200 dark:hover:border-amber-500 transition-colors"
                          >
                            <div className="flex items-start gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5"
                                style={{ backgroundColor: getCategoryStyle(node.category).dot }}
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 line-clamp-2">
                                  {node.name}
                                </span>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className="text-[8px] text-slate-400 uppercase tracking-wide">
                                    {node.category || 'other'}
                                  </span>
                                  <span className="text-[8px] text-slate-300 dark:text-slate-600">•</span>
                                  <span className="text-[8px] text-slate-400">{node.queryCount || 0} queries</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1.5 mt-2.5">
                              <button
                                onClick={() => handleNodeSelect({ id: node.id, name: node.name, category: node.category || undefined })}
                                className="flex-1 text-[9px] px-2 py-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors font-medium"
                              >
                                Select
                              </button>
                              <button
                                onClick={() => handleSendQuery(`Analyze ${node.name}`)}
                                className="flex-1 text-[9px] px-2 py-1.5 bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors font-medium"
                              >
                                Analyze
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <SparklesIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">No suggestions yet</p>
                          <p className="text-[9px] text-slate-300 dark:text-slate-600 mt-1">Select a topic to see related items</p>
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

      {/* Footer Stats */}
      {!loading && nodes.length > 0 && (
        <footer className="bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 border-t border-slate-200 dark:border-slate-700 px-6 py-3">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Topics:</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{filteredNodes.length}</span>
                </div>
                <div className="w-px h-4 bg-slate-300 dark:bg-slate-600" />
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Links:</span>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{connections.length}</span>
                </div>
                <div className="w-px h-4 bg-slate-300 dark:bg-slate-600" />
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Categories:</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{categories.length}</span>
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto max-w-md">
                {categories.slice(0, 6).map(([cat, count]) => {
                  const style = getCategoryStyle(cat)
                  return (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(categoryFilter === cat ? 'all' : cat)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-medium transition-all whitespace-nowrap ${
                        categoryFilter === cat 
                          ? 'ring-2 ring-indigo-500 ring-offset-1' 
                          : 'hover:opacity-80'
                      }`}
                      style={{ backgroundColor: style.bg }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: style.dot }} />
                      <span className="capitalize" style={{ color: style.dot }}>{cat}</span>
                      <span className="text-slate-400">({count})</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* Click outside to close dropdown */}
      {showCategoryDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowCategoryDropdown(false)} 
        />
      )}
    </div>
  )
}
