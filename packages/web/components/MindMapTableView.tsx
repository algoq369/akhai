'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Node } from './MindMap'
import { MagnifyingGlassIcon, ChevronRightIcon, SparklesIcon, LinkIcon, ChartBarIcon } from '@heroicons/react/24/outline'

interface MindMapTableViewProps {
  userId: string | null
  onQueryAction?: (query: string, nodeId?: string) => void
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  technology: { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  finance: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  health: { bg: '#ECFDF5', text: '#065F46', dot: '#10B981' },
  education: { bg: '#F5F3FF', text: '#5B21B6', dot: '#8B5CF6' },
  entertainment: { bg: '#FFF1F2', text: '#9F1239', dot: '#F43F5E' },
  business: { bg: '#FFF7ED', text: '#C2410C', dot: '#F97316' },
  science: { bg: '#F0F9FF', text: '#0369A1', dot: '#0EA5E9' },
  engineering: { bg: '#FDF4FF', text: '#86198F', dot: '#D946EF' },
  environment: { bg: '#F0FDF4', text: '#166534', dot: '#22C55E' },
  psychology: { bg: '#FFF7ED', text: '#9A3412', dot: '#EA580C' },
  infrastructure: { bg: '#F1F5F9', text: '#334155', dot: '#64748B' },
  regulation: { bg: '#FEF2F2', text: '#991B1B', dot: '#DC2626' },
  social: { bg: '#FCE7F3', text: '#9D174D', dot: '#EC4899' },
  other: { bg: '#F1F5F9', text: '#475569', dot: '#64748B' },
}

function getCategoryColor(category: string) {
  const cat = (category || 'other').toLowerCase()
  return CATEGORY_COLORS[cat] || CATEGORY_COLORS.other
}

export default function MindMapTableView({ userId, onQueryAction }: MindMapTableViewProps) {
  const [nodes, setNodes] = useState<Node[]>([])
  const [expandedNode, setExpandedNode] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedForChat, setSelectedForChat] = useState<{query: string, nodeId: string} | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/mindmap/data')
        if (!res.ok) return
        const data = await res.json()
        const nodes = data.nodes || []
        console.log('[MindMap TableView] API returned:', nodes.length, 'topics')
        console.log('[MindMap TableView] Meta:', data.meta)
        setNodes(nodes)
      } catch (error) {
        console.error('Failed to fetch:', error)
      }
    }
    fetchData()
  }, [userId])

  const categories = useMemo(() => {
    const cats = new Map<string, number>()
    nodes.forEach(n => {
      const cat = n.category || 'other'
      cats.set(cat, (cats.get(cat) || 0) + 1)
    })
    return Array.from(cats.entries()).sort((a, b) => b[1] - a[1])
  }, [nodes])

  const filteredNodes = useMemo(() => {
    let filtered = nodes
    if (filterCategory) filtered = filtered.filter(n => (n.category || 'other') === filterCategory)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(n => n.name.toLowerCase().includes(q) || (n.category || '').toLowerCase().includes(q))
    }
    return filtered.sort((a, b) => (b.queryCount || 0) - (a.queryCount || 0))
  }, [nodes, filterCategory, searchQuery])

  // Handle action - opens inline chat or triggers callback
  const handleAction = (query: string, nodeId: string) => {
    if (onQueryAction) {
      onQueryAction(query, nodeId)
    } else {
      setSelectedForChat({ query, nodeId })
    }
  }

  const getMetrics = (node: Node) => {
    const q = node.queryCount || 0
    return {
      queries: q,
      activity: Math.min((q / 20) * 100, 100),
      status: q > 10 ? 'Active' : q > 0 ? 'Moderate' : 'Inactive'
    }
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex-none p-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-[11px] border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterCategory || ''}
            onChange={e => setFilterCategory(e.target.value || null)}
            className="px-2 py-1.5 text-[11px] border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            <option value="">All Categories</option>
            {categories.map(([cat, count]) => (
              <option key={cat} value={cat}>{cat} ({count})</option>
            ))}
          </select>
        </div>
        
        {/* Category pills */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          <button
            onClick={() => setFilterCategory(null)}
            className={`px-2 py-1 rounded text-[9px] font-medium ${!filterCategory ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
          >
            All
          </button>
          {categories.slice(0, 8).map(([cat, count]) => {
            const colors = getCategoryColor(cat)
            const isActive = filterCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(isActive ? null : cat)}
                className="px-2 py-1 rounded text-[9px] font-medium flex items-center gap-1"
                style={{ backgroundColor: isActive ? colors.dot : colors.bg, color: isActive ? 'white' : colors.text }}
              >
                <span className="w-1 h-1 rounded-full" style={{ backgroundColor: isActive ? 'white' : colors.dot }} />
                {cat} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Inline Chat Panel */}
      <AnimatePresence>
        {selectedForChat && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 overflow-hidden"
          >
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-medium text-blue-700 dark:text-blue-300">Query Panel</span>
                <button 
                  onClick={() => setSelectedForChat(null)}
                  className="text-[9px] text-blue-500 hover:text-blue-700"
                >
                  ✕ close
                </button>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded border border-blue-200 dark:border-blue-700 p-2">
                <p className="text-[11px] text-slate-700 dark:text-slate-200 mb-2">{selectedForChat.query}</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      // Copy to clipboard
                      navigator.clipboard.writeText(selectedForChat.query)
                      setSelectedForChat(null)
                    }}
                    className="text-[9px] px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-200"
                  >
                    Copy query
                  </button>
                  <button 
                    onClick={() => {
                      // Open in new tab with query
                      window.open(`/?q=${encodeURIComponent(selectedForChat.query)}`, '_blank')
                      setSelectedForChat(null)
                    }}
                    className="text-[9px] px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Open in chat →
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {filteredNodes.map(node => {
          const colors = getCategoryColor(node.category || 'other')
          const isExpanded = expandedNode === node.id
          const m = getMetrics(node)
          
          return (
            <div key={node.id} className="border-b border-slate-100 dark:border-slate-800">
              {/* Row */}
              <button
                onClick={() => setExpandedNode(isExpanded ? null : node.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${isExpanded ? 'bg-slate-50 dark:bg-slate-800/50' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'}`}
              >
                <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.15 }}>
                  <ChevronRightIcon className="w-3 h-3 text-slate-400" />
                </motion.div>
                
                <div className="w-7 h-7 rounded flex items-center justify-center text-[10px] font-bold shrink-0" style={{ backgroundColor: colors.bg, color: colors.text }}>
                  {node.name.charAt(0)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium text-slate-700 dark:text-slate-200 truncate">{node.name}</div>
                </div>
                
                <span className="px-1.5 py-0.5 rounded text-[8px] font-medium shrink-0" style={{ backgroundColor: colors.bg, color: colors.text }}>
                  {node.category || 'Other'}
                </span>
                
                <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 w-8 text-right">{m.queries}</div>
                
                <span className={`text-[8px] px-1.5 py-0.5 rounded shrink-0 ${m.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : m.status === 'Moderate' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                  {m.status}
                </span>
              </button>
              
              {/* Expanded - Compact */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 pt-1 ml-10 grid grid-cols-3 gap-2 text-[9px]">
                      {/* Metrics */}
                      <div className="bg-slate-50 dark:bg-slate-800 rounded p-2">
                        <div className="flex items-center gap-1 text-slate-400 mb-1.5">
                          <ChartBarIcon className="w-3 h-3" />Metrics
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Activity</span><span className="font-mono">{Math.round(m.activity)}%</span></div>
                          <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Queries</span><span className="font-mono">{m.queries}</span></div>
                        </div>
                      </div>
                      
                      {/* Connections - Clickable */}
                      <div className="bg-slate-50 dark:bg-slate-800 rounded p-2">
                        <div className="flex items-center gap-1 text-slate-400 mb-1.5">
                          <LinkIcon className="w-3 h-3" />Connections
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {['Similar', 'Related'].map((conn, i) => (
                            <button 
                              key={i}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAction(`Find ${conn.toLowerCase()} topics to ${node.name}`, node.id)
                              }}
                              className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-600 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                            >
                              {conn}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="bg-slate-50 dark:bg-slate-800 rounded p-2">
                        <div className="flex items-center gap-1 text-slate-400 mb-1.5">
                          <SparklesIcon className="w-3 h-3" />Actions
                        </div>
                        <div className="space-y-1">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAction(`Deep analysis of ${node.name}`, node.id)
                            }}
                            className="w-full text-left px-1.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                          >
                            → Analyze
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAction(`Summarize ${node.name}`, node.id)
                            }}
                            className="w-full text-left px-1.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                          >
                            → Summary
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
        
        {filteredNodes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <div className="text-2xl mb-2">🔍</div>
            <div className="text-[11px]">No topics found</div>
          </div>
        )}
      </div>
    </div>
  )
}
