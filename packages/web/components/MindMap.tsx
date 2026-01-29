'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  const [connections, setConnections] = useState<Connection[]>([])
  const [showConnections, setShowConnections] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showPinned, setShowPinned] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  
  const [selectedGraphNode, setSelectedGraphNode] = useState<{ id: string; name: string; category?: string } | null>(null)
  const [miniChatOpen, setMiniChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')

  useEffect(() => {
    setViewMode(initialView)
  }, [initialView])

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

  const nodeConnections = useMemo(() => {
    if (!selectedGraphNode) return connections
    return connections.filter(c => c.from === selectedGraphNode.id || c.to === selectedGraphNode.id)
  }, [selectedGraphNode, connections])

  const suggestions = useMemo(() => {
    if (!selectedGraphNode) return nodes.slice(0, 8)
    return nodes.filter(n => 
      n.id !== selectedGraphNode.id && 
      (n.category || 'other').toLowerCase() === (selectedGraphNode.category || 'other').toLowerCase()
    ).slice(0, 8)
  }, [selectedGraphNode, nodes])

  const quickActions = useMemo(() => {
    if (!selectedGraphNode) return [
      { label: 'explore topics', query: 'What topics have I explored most?' },
      { label: 'find patterns', query: 'Find connections between my ideas' },
      { label: 'suggest research', query: 'Suggest new research directions' },
    ]
    return [
      { label: 'analyze', query: `Analyze ${selectedGraphNode.name} in depth` },
      { label: 'connect', query: `Find connections for ${selectedGraphNode.name}` },
      { label: 'expand', query: `Explore related topics to ${selectedGraphNode.name}` },
    ]
  }, [selectedGraphNode])

  const handleSendQuery = (query: string) => {
    window.open(`/?q=${encodeURIComponent(query)}`, '_blank')
    setChatInput('')
  }

  const handleNodeSelect = (node: { id: string; name: string; category?: string } | null) => {
    setSelectedGraphNode(node)
    if (node) {
      setShowSuggestions(true)
      setShowConnections(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40 bg-white">
      <header className="bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-5 py-3">
          <div>
            <h1 className="text-base font-medium text-slate-900">mind map</h1>
            <p className="text-xs text-slate-400">visualize your knowledge graph</p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
            {[
              { id: 'graph', label: 'graph' },
              { id: 'history', label: 'history' },
              { id: 'grimoire', label: 'grimoire' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setViewMode(id as ViewMode)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-3 px-5 py-2 border-t border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="search topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-700"
            />
          </div>

          {viewMode === 'graph' && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none"
            >
              <option value="all">all topics ({nodes.length})</option>
              {categories.map(([cat, count]) => (
                <option key={cat} value={cat}>{cat} ({count})</option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowPinned(!showPinned)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                showPinned ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              pinned
            </button>

            <button
              onClick={() => { setShowConnections(!showConnections); if (!showConnections) setShowSuggestions(false) }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                showConnections ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              connections ({connections.length})
            </button>

            <button
              onClick={() => { setShowSuggestions(!showSuggestions); if (!showSuggestions) setShowConnections(false) }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                showSuggestions ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              suggestions
            </button>
          </div>

          <div className="ml-auto text-[10px] text-slate-400">
            {filteredNodes.length} topics
          </div>
        </div>
      </header>

      <main className="h-[calc(100vh-120px)] flex">
        <div className="flex-1 overflow-hidden relative">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
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
              
              <div className="absolute bottom-4 left-4 z-50">
                <button
                  onClick={() => setMiniChatOpen(!miniChatOpen)}
                  className={`p-3 rounded-full shadow-lg transition-all ${
                    miniChatOpen 
                      ? 'bg-slate-800 text-white' 
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  {miniChatOpen ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  )}
                </button>

                <AnimatePresence>
                  {miniChatOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 20, scale: 0.9 }}
                      className="absolute bottom-16 left-0 w-72 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden"
                    >
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                        <h3 className="font-medium text-sm text-slate-800">quick query</h3>
                        {selectedGraphNode && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            context: {selectedGraphNode.name}
                          </p>
                        )}
                      </div>

                      <div className="p-2 border-b border-slate-100 flex gap-1.5">
                        {quickActions.map((action) => (
                          <button
                            key={action.label}
                            onClick={() => handleSendQuery(action.query)}
                            className="flex-1 px-2 py-1.5 text-[10px] font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>

                      {selectedGraphNode && (
                        <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <span 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: getCategoryStyle(selectedGraphNode.category).dot }}
                            />
                            <span className="text-xs font-medium text-slate-700 truncate flex-1">
                              {selectedGraphNode.name}
                            </span>
                          </div>
                        </div>
                      )}

                      <form onSubmit={(e) => { e.preventDefault(); if (chatInput.trim()) handleSendQuery(chatInput) }} className="p-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="ask anything..."
                            className="flex-1 px-3 py-2 text-sm bg-slate-100 rounded-lg border-0 focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-700"
                          />
                          <button
                            type="submit"
                            disabled={!chatInput.trim()}
                            className="p-2 bg-slate-800 text-white rounded-lg disabled:opacity-50 hover:bg-slate-700 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
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

        <AnimatePresence>
          {(showConnections || showSuggestions) && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="h-full bg-slate-50 border-l border-slate-200 overflow-hidden flex-shrink-0"
            >
              <div className="h-full flex flex-col">
                <div className="flex-none p-3 bg-white border-b border-slate-100">
                  <span className="text-xs font-semibold text-slate-700">
                    {showConnections ? 'connections' : 'suggestions'}
                  </span>
                  <span className="ml-2 text-[9px] text-slate-400">
                    {showConnections ? nodeConnections.length : suggestions.length}
                  </span>
                  {selectedGraphNode && (
                    <p className="text-[10px] text-slate-500 mt-1">
                      for: {selectedGraphNode.name}
                    </p>
                  )}
                </div>

                <div className="flex-1 overflow-auto p-3">
                  {showConnections && (
                    <div className="space-y-2">
                      {nodeConnections.length > 0 ? (
                        nodeConnections.slice(0, 50).map((conn, i) => {
                          const fromNode = nodes.find(n => n.id === conn.from)
                          const toNode = nodes.find(n => n.id === conn.to)
                          return (
                            <div
                              key={i}
                              className="bg-white rounded-lg p-2 border border-slate-100 hover:border-slate-200 cursor-pointer"
                              onClick={() => {
                                const node = fromNode?.id === selectedGraphNode?.id ? toNode : fromNode
                                if (node) handleNodeSelect({ id: node.id, name: node.name, category: node.category || undefined })
                              }}
                            >
                              <div className="flex items-center gap-2 text-[10px]">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getCategoryStyle(fromNode?.category).dot }} />
                                <span className="text-slate-700 truncate flex-1">{fromNode?.name || '?'}</span>
                                <span className="text-slate-400">-</span>
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getCategoryStyle(toNode?.category).dot }} />
                                <span className="text-slate-700 truncate flex-1">{toNode?.name || '?'}</span>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-[10px] text-slate-400">no connections found</p>
                        </div>
                      )}
                    </div>
                  )}

                  {showSuggestions && (
                    <div className="space-y-2">
                      {suggestions.length > 0 ? (
                        suggestions.map(node => (
                          <div key={node.id} className="bg-white rounded-lg p-2.5 border border-slate-100 hover:border-slate-200">
                            <div className="flex items-start gap-2">
                              <span className="w-2 h-2 rounded-full mt-1" style={{ backgroundColor: getCategoryStyle(node.category).dot }} />
                              <div className="flex-1">
                                <span className="text-[11px] font-medium text-slate-700 line-clamp-2">{node.name}</span>
                                <p className="text-[9px] text-slate-400 mt-0.5">{node.category || 'other'} / {node.queryCount || 0} queries</p>
                              </div>
                            </div>
                            <div className="flex gap-1.5 mt-2">
                              <button
                                onClick={() => handleNodeSelect({ id: node.id, name: node.name, category: node.category || undefined })}
                                className="flex-1 text-[9px] px-2 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                              >
                                select
                              </button>
                              <button
                                onClick={() => handleSendQuery(`Analyze ${node.name}`)}
                                className="flex-1 text-[9px] px-2 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                              >
                                analyze
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-[10px] text-slate-400">no suggestions</p>
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
    </div>
  )
}
