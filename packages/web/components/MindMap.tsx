'use client'

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MindMapDiagramView from './MindMapDiagramView'
import MindMapHistoryView from './MindMapHistoryView'
import MindMapReportView from './MindMapReportView'
import MindMapMiniChat from './MindMapMiniChat'
import VisionBoard from './VisionBoard'
import PredictView from './mindmap/PredictView'

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

type ViewMode = 'board' | 'graph' | 'history' | 'report' | 'predict'

interface MindMapProps {
  isOpen: boolean
  onClose: () => void
  onSendQuery?: (query: string) => void
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

export default function MindMap({ isOpen, onClose, onSendQuery, userId, initialView = 'graph' }: MindMapProps) {
  const [nodes, setNodes] = useState<Node[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>(initialView)
  const [searchQuery, setSearchQuery] = useState('')
  const [connections, setConnections] = useState<Connection[]>([])
  const [topicLinks, setTopicLinks] = useState<{ source: string; target: string; type: string; strength: number }[]>([])
  const [showConnections, setShowConnections] = useState(false)
  const [showPinned, setShowPinned] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  
  const [selectedGraphNode, setSelectedGraphNode] = useState<{ id: string; name: string; category?: string } | null>(null)
  const [miniChatOpen, setMiniChatOpen] = useState(false)
  const [miniChatQuery, setMiniChatQuery] = useState('')

  useEffect(() => {
    setViewMode(initialView)
  }, [initialView])

  useEffect(() => {
    if (selectedGraphNode) {
      setMiniChatQuery(`Tell me more about ${selectedGraphNode.name}`)
    }
  }, [selectedGraphNode])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/mindmap/data')
      if (!res.ok) {
        throw new Error(`Failed to load mind map data (${res.status})`)
      }
      const data = await res.json()
      setNodes(data.nodes || [])
      const rawLinks = data.links || []
      setTopicLinks(rawLinks)
      const conns = rawLinks.map((c: any) => ({
        from: c.source,
        to: c.target,
        type: c.type,
        strength: c.strength,
        fromName: data.nodes?.find((n: Node) => n.id === c.source)?.name,
        toName: data.nodes?.find((n: Node) => n.id === c.target)?.name,
      }))
      setConnections(conns)
    } catch (err) {
      console.error('Failed to fetch:', err)
      setError(err instanceof Error ? err.message : 'Failed to load mind map data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isOpen) return
    fetchData()
  }, [isOpen])

  // Stable ref for onClose to avoid useEffect re-triggering on every render
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // Push history state when modal opens so browser back closes modal instead of navigating away
  useEffect(() => {
    if (!isOpen) return

    window.history.pushState({ mindmapOpen: true }, '', window.location.href)

    const handlePopState = () => {
      onCloseRef.current()
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [isOpen])

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

  const handleSendQuery = (query: string) => {
    onClose()
    onSendQuery?.(query)
  }

  const handleNodeSelect = (node: { id: string; name: string; category?: string } | null) => {
    setSelectedGraphNode(node)
    if (node) {
      setShowConnections(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40 bg-white" style={{ top: 23, bottom: 24 }}>
      <header className="bg-white border-b border-slate-200">
        <div className="flex items-center gap-3 px-4 py-1.5">
          <span className="text-sm font-medium text-slate-900">mind map</span>

          <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg">
            {[
              { id: 'board', label: 'vision' },
              { id: 'graph', label: 'graph' },
              { id: 'history', label: 'history' },
              { id: 'report', label: 'grimoire' },
              { id: 'predict', label: 'predict' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setViewMode(id as ViewMode)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${
                  viewMode === id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-xs">
            <input
              type="text"
              placeholder="search topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-2.5 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-700"
            />
          </div>

          {viewMode === 'graph' && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-600 focus:outline-none"
            >
              <option value="all">all ({nodes.length})</option>
              {categories.map(([cat, count]) => (
                <option key={cat} value={cat}>{cat} ({count})</option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowPinned(!showPinned)}
              className={`px-2 py-0.5 rounded-lg text-[9px] font-medium transition-all ${
                showPinned ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              pinned
            </button>
            <button
              onClick={() => setShowConnections(!showConnections)}
              className={`px-2 py-0.5 rounded-lg text-[9px] font-medium transition-all ${
                showConnections ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              connections ({connections.length})
            </button>
          </div>

          <span className="text-[9px] text-slate-400 ml-auto">{filteredNodes.length} topics</span>

          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      <main className="flex" style={{ height: 'calc(100% - 42px)' }}>
        <div className="flex-1 overflow-hidden relative">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-slate-600 mb-1">Failed to load mind map</p>
                <p className="text-xs text-slate-400">{error}</p>
              </div>
              <button
                onClick={() => fetchData()}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-medium rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                retry
              </button>
            </div>
          ) : viewMode === 'board' ? (
            <VisionBoard userId={userId} />
          ) : viewMode === 'graph' ? (
            <MindMapDiagramView
              userId={userId}
              nodes={filteredNodes}
              searchQuery={searchQuery}
              onNodeSelect={handleNodeSelect}
              onNodeAction={(query) => handleSendQuery(query)}
              onContinueToChat={(query) => {
                setMiniChatQuery(query)
                setMiniChatOpen(true)
              }}
              propTopicLinks={topicLinks}
            />
          ) : viewMode === 'history' ? (
            <MindMapHistoryView onClose={onClose} onContinueToChat={(query) => { setMiniChatQuery(query); setMiniChatOpen(true) }} />
          ) : viewMode === 'report' ? (
            <MindMapReportView userId={userId} selectedTopics={[]} />
          ) : viewMode === 'predict' ? (
            <PredictView />
          ) : null}

          {/* Mini-chat — visible on all tabs */}
          <div className="absolute bottom-4 left-4 z-50">
            <MindMapMiniChat
              selectedTopic={selectedGraphNode ? { id: selectedGraphNode.id, label: selectedGraphNode.name, category: selectedGraphNode.category } : null}
              connectionsCount={connections.length}
              prefillQuery={miniChatQuery}
              isOpen={miniChatOpen}
              onOpenChange={setMiniChatOpen}
              nodes={nodes}
              topicLinks={topicLinks}
            />
          </div>
        </div>

        <AnimatePresence>
          {showConnections && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="h-full bg-slate-50 border-l border-slate-200 overflow-hidden flex-shrink-0"
            >
              <div className="h-full flex flex-col">
                <div className="flex-none p-3 bg-white border-b border-slate-100">
                  <span className="text-xs font-semibold text-slate-700">
                    connections
                  </span>
                  <span className="ml-2 text-[9px] text-slate-400">
                    {nodeConnections.length}
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

                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
