'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Node } from './MindMap'
import {
  ArrowsPointingOutIcon,
  PlusIcon,
  MinusIcon,
  LinkIcon,
  SparklesIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { SEFIROT_COLORS } from '@/lib/mindmap-intelligence'
import { Sefirah, SEPHIROTH_METADATA } from '@/lib/ascent-tracker'

// Extended Node interface with intelligence fields
interface IntelligentNode extends Node {
  dominantSefirah?: Sefirah | null
  sefirotActivations?: Record<number, number>
  size?: number
  borderColor?: string
}

interface MindMapDiagramViewProps {
  userId: string | null
  nodes?: IntelligentNode[]
  searchQuery?: string
  categoryFilter?: string
  onTopicExpand?: (topicId: string) => void
  showSefirotMode?: boolean
}

interface NodePosition {
  x: number
  y: number
}

interface ConnectionLine {
  from: string
  to: string
  id: string
}

const NODE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  business: { bg: '#ECFDF5', border: '#A7F3D0', text: '#059669' },
  technology: { bg: '#EEF2FF', border: '#C7D2FE', text: '#4F46E5' },
  finance: { bg: '#FEF3C7', border: '#FDE68A', text: '#D97706' },
  environment: { bg: '#ECFDF5', border: '#A7F3D0', text: '#059669' },
  psychology: { bg: '#F5F3FF', border: '#DDD6FE', text: '#7C3AED' },
  infrastructure: { bg: '#F0F9FF', border: '#BAE6FD', text: '#0284C7' },
  regulation: { bg: '#FDF2F8', border: '#FBCFE8', text: '#DB2777' },
  engineering: { bg: '#FEF3C7', border: '#FDE68A', text: '#D97706' },
  social: { bg: '#FDF4FF', border: '#F5D0FE', text: '#C026D3' },
  science: { bg: '#F0F9FF', border: '#BAE6FD', text: '#0284C7' },
  health: { bg: '#FDF2F8', border: '#FBCFE8', text: '#DB2777' },
  other: { bg: '#F8FAFC', border: '#E2E8F0', text: '#64748B' },
}

function getNodeColor(category: string | null) {
  const cat = category?.toLowerCase() || 'other'
  return NODE_COLORS[cat] || NODE_COLORS.other
}

// Get Sefirot-based color for a node
function getSefirotNodeColor(node: IntelligentNode): { bg: string; border: string; text: string; glow?: string } {
  if (node.dominantSefirah !== null && node.dominantSefirah !== undefined) {
    const sefirotColor = SEFIROT_COLORS[node.dominantSefirah]
    if (sefirotColor) {
      return {
        bg: `${sefirotColor.primary}20`, // 20% opacity
        border: sefirotColor.primary,
        text: sefirotColor.primary,
        glow: sefirotColor.primary
      }
    }
  }
  return getNodeColor(node.category)
}

export default function MindMapDiagramView({
  userId,
  nodes: propNodes,
  searchQuery = '',
  categoryFilter = 'all',
  onTopicExpand,
  showSefirotMode = false
}: MindMapDiagramViewProps) {
  const [allNodes, setAllNodes] = useState<IntelligentNode[]>([])
  const [nodePositions, setNodePositions] = useState<Map<string, NodePosition>>(new Map())
  const [connections, setConnections] = useState<ConnectionLine[]>([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [draggingNode, setDraggingNode] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(0.5)
  const [pan, setPan] = useState({ x: 30, y: 30 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Use prop nodes if provided, otherwise fetch
  useEffect(() => {
    if (propNodes && propNodes.length > 0) {
      setAllNodes(propNodes)
      return
    }
    if (!userId) return

    const fetchData = async () => {
      try {
        // Fetch with intelligence data for Sefirot colors
        const res = await fetch('/api/mindmap/data?intelligence=true')
        if (!res.ok) return
        const data = await res.json()
        setAllNodes(data.nodes || [])
        if (data.connections) {
          setConnections(data.connections.map((c: any) => ({
            from: c.from,
            to: c.to,
            id: `${c.from}-${c.to}`
          })))
        }
      } catch (error) {
        console.error('Failed to fetch:', error)
      }
    }
    fetchData()
  }, [userId, propNodes])

  // Use filtered nodes from props directly
  const displayNodes = propNodes || allNodes

  // Calculate positions when nodes change
  useEffect(() => {
    if (displayNodes.length === 0) return
    
    const positions = new Map<string, NodePosition>()
    const cols = Math.ceil(Math.sqrt(displayNodes.length))
    const spacingX = 240
    const spacingY = 180
    
    displayNodes.forEach((node, index) => {
      // Keep existing position if node already placed
      const existing = nodePositions.get(node.id)
      if (existing) {
        positions.set(node.id, existing)
        return
      }
      
      const row = Math.floor(index / cols)
      const col = index % cols
      const jitterX = (Math.random() - 0.5) * 12
      const jitterY = (Math.random() - 0.5) * 8
      positions.set(node.id, {
        x: 50 + col * spacingX + jitterX,
        y: 50 + row * spacingY + jitterY
      })
    })
    setNodePositions(positions)
  }, [displayNodes])

  // Category counts
  const categories = useMemo(() => {
    const cats = new Map<string, number>()
    displayNodes.forEach(n => {
      const cat = n.category || 'other'
      cats.set(cat, (cats.get(cat) || 0) + 1)
    })
    return Array.from(cats.entries()).sort((a, b) => b[1] - a[1])
  }, [displayNodes])

  // Drag handlers
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    const pos = nodePositions.get(nodeId)
    if (!pos) return
    
    setDraggingNode(nodeId)
    setDragOffset({
      x: e.clientX / zoom - pos.x - pan.x / zoom,
      y: e.clientY / zoom - pos.y - pan.y / zoom
    })
  }

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggingNode) {
      const newPos = {
        x: e.clientX / zoom - dragOffset.x - pan.x / zoom,
        y: e.clientY / zoom - dragOffset.y - pan.y / zoom
      }
      setNodePositions(prev => {
        const next = new Map(prev)
        next.set(draggingNode, newPos)
        return next
      })
    } else if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      })
    }
  }, [draggingNode, dragOffset, zoom, isPanning, panStart, pan])

  const handleMouseUp = () => {
    setDraggingNode(null)
    setIsPanning(false)
  }

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as Element).tagName === 'svg') {
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
      setSelectedNode(null)
      setConnectingFrom(null)
    }
  }

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.05 : 0.05
    setZoom(z => Math.min(1.5, Math.max(0.25, z + delta)))
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false })
      return () => container.removeEventListener('wheel', handleWheel)
    }
  }, [handleWheel])

  const handleStartConnection = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    setConnectingFrom(connectingFrom === nodeId ? null : nodeId)
  }

  const handleNodeClick = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()

    if (connectingFrom && connectingFrom !== nodeId) {
      // Create connection (existing behavior)
      const newConn: ConnectionLine = {
        from: connectingFrom,
        to: nodeId,
        id: `${connectingFrom}-${nodeId}`
      }
      if (!connections.find(c => c.id === newConn.id || c.id === `${nodeId}-${connectingFrom}`)) {
        setConnections(prev => [...prev, newConn])
      }
      setConnectingFrom(null)
    } else {
      // Direct to expansion panel (single-click)
      onTopicExpand?.(nodeId)
    }
  }

  const fitToScreen = () => {
    if (!containerRef.current || nodePositions.size === 0) return
    const container = containerRef.current
    const positions = Array.from(nodePositions.values())
    const maxX = Math.max(...positions.map(p => p.x)) + 130
    const maxY = Math.max(...positions.map(p => p.y)) + 75
    
    const scaleX = (container.clientWidth - 60) / maxX
    const scaleY = (container.clientHeight - 60) / maxY
    setZoom(Math.min(scaleX, scaleY, 1))
    setPan({ x: 25, y: 25 })
  }

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-relic-void">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-white dark:bg-relic-slate/20 border-b border-slate-100 dark:border-relic-slate/30">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span className="text-[10px] font-medium text-slate-600 dark:text-white">Freeform Canvas</span>
          <span className="text-[9px] text-slate-400 dark:text-relic-ghost">
            {displayNodes.length} topics · {connections.length} links
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <AnimatePresence>
            {connectingFrom && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500 text-white rounded-full text-[8px] font-medium"
              >
                <LinkIcon className="w-2.5 h-2.5" />
                Click target
                <button onClick={() => setConnectingFrom(null)} className="ml-1">✕</button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center bg-white dark:bg-relic-slate/20 border border-slate-200 dark:border-relic-slate/30 rounded">
            <button onClick={() => setZoom(z => Math.max(0.25, z - 0.1))} className="p-1 hover:bg-slate-50 dark:hover:bg-relic-slate/30">
              <MinusIcon className="w-3 h-3 text-slate-500 dark:text-relic-ghost" />
            </button>
            <span className="px-1.5 text-[8px] font-mono text-slate-500 dark:text-relic-ghost min-w-[28px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} className="p-1 hover:bg-slate-50 dark:hover:bg-relic-slate/30">
              <PlusIcon className="w-3 h-3 text-slate-500 dark:text-relic-ghost" />
            </button>
          </div>

          <button onClick={fitToScreen} className="p-1 hover:bg-slate-100 dark:hover:bg-relic-slate/30 rounded border border-slate-200 dark:border-relic-slate/30" title="Fit to screen">
            <ArrowsPointingOutIcon className="w-3 h-3 text-slate-500 dark:text-relic-ghost" />
          </button>

          {/* Export dropdown */}
          <div className="relative group">
            <button className="p-1 hover:bg-slate-100 dark:hover:bg-relic-slate/30 rounded border border-slate-200 dark:border-relic-slate/30" title="Export">
              <ArrowDownTrayIcon className="w-3 h-3 text-slate-500 dark:text-relic-ghost" />
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-relic-slate border border-slate-200 dark:border-relic-slate/30 rounded-lg shadow-lg p-1 hidden group-hover:block z-50 min-w-[120px]">
              <button
                onClick={() => {
                  const data = {
                    nodes: displayNodes,
                    connections,
                    exportedAt: new Date().toISOString()
                  }
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `akhai-mindmap-${Date.now()}.json`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="w-full text-left px-2 py-1 text-[9px] text-slate-600 dark:text-relic-ghost hover:bg-slate-100 dark:hover:bg-relic-slate/50 rounded"
              >
                Export JSON
              </button>
              <button
                onClick={() => {
                  // Generate simple text summary
                  const summary = displayNodes.map(n => {
                    const sefirotName = n.dominantSefirah !== null && n.dominantSefirah !== undefined
                      ? SEFIROT_COLORS[n.dominantSefirah]?.name || ''
                      : ''
                    return `- ${n.name}${sefirotName ? ` (${sefirotName})` : ''}: ${n.queryCount || 0} queries`
                  }).join('\n')
                  const blob = new Blob([`AkhAI Mind Map Export\n${new Date().toISOString()}\n\n${summary}`], { type: 'text/plain' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `akhai-mindmap-${Date.now()}.txt`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="w-full text-left px-2 py-1 text-[9px] text-slate-600 dark:text-relic-ghost hover:bg-slate-100 dark:hover:bg-relic-slate/50 rounded"
              >
                Export Text
              </button>
              <button
                onClick={() => {
                  const shareData = {
                    title: 'AkhAI Mind Map',
                    text: `Mind Map with ${displayNodes.length} topics`,
                    url: window.location.href
                  }
                  if (navigator.share) {
                    navigator.share(shareData)
                  } else {
                    navigator.clipboard.writeText(window.location.href)
                    alert('Link copied to clipboard!')
                  }
                }}
                className="w-full text-left px-2 py-1 text-[9px] text-slate-600 dark:text-relic-ghost hover:bg-slate-100 dark:hover:bg-relic-slate/50 rounded"
              >
                Share Link
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sefirot Legend (when in Sefirot mode) */}
      {showSefirotMode && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-100 dark:border-relic-slate/30 bg-gradient-to-r from-slate-50 to-indigo-50/50 dark:from-relic-slate/10 dark:to-indigo-950/20 overflow-x-auto">
          <span className="text-[7px] text-slate-500 dark:text-relic-ghost font-semibold uppercase tracking-wide flex-shrink-0">Sefirot:</span>
          {Object.entries(SEFIROT_COLORS).map(([sefirahKey, color]) => {
            const sefirah = parseInt(sefirahKey) as Sefirah
            const nodesWithSefirah = displayNodes.filter(n => n.dominantSefirah === sefirah).length
            if (nodesWithSefirah === 0) return null
            return (
              <div key={sefirahKey} className="flex items-center gap-1 flex-shrink-0">
                <span
                  className="w-2.5 h-2.5 rounded-full border border-white/50"
                  style={{
                    backgroundColor: color.primary,
                    boxShadow: `0 0 6px ${color.primary}60`
                  }}
                />
                <span className="text-[7px] text-slate-600 dark:text-relic-ghost font-medium">{color.name}</span>
                <span className="text-[6px] text-slate-400 dark:text-relic-silver">({nodesWithSefirah})</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Category legend (fallback when not in Sefirot mode) */}
      {!showSefirotMode && (
        <div className="flex items-center gap-2 px-3 py-1 border-b border-slate-100 dark:border-relic-slate/30 bg-white/50 dark:bg-relic-slate/10 overflow-x-auto">
          {categories.slice(0, 12).map(([cat, count]) => {
            const color = getNodeColor(cat)
            return (
              <div key={cat} className="flex items-center gap-1 flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color.text }} />
                <span className="text-[7px] text-slate-500 dark:text-relic-ghost">{cat}</span>
                <span className="text-[6px] text-slate-400 dark:text-relic-silver">({count})</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Canvas */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-hidden relative"
        style={{ cursor: isPanning ? 'grabbing' : draggingNode ? 'move' : 'default' }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Grid */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <pattern id="grid" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="8" cy="8" r="0.5" fill="#CBD5E1" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Transform container */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            position: 'absolute',
          }}
        >
          {/* Connections */}
          <svg className="absolute pointer-events-none" style={{ width: '5000px', height: '5000px', overflow: 'visible' }}>
            {connections.map(conn => {
              const fromPos = nodePositions.get(conn.from)
              const toPos = nodePositions.get(conn.to)
              if (!fromPos || !toPos) return null
              
              const fromX = fromPos.x + 55
              const fromY = fromPos.y + 32
              const toX = toPos.x + 55
              const toY = toPos.y + 32
              
              const dx = toX - fromX
              const ctrl1X = fromX + dx * 0.4
              const ctrl2X = toX - dx * 0.4
              
              return (
                <path
                  key={conn.id}
                  d={`M ${fromX} ${fromY} C ${ctrl1X} ${fromY}, ${ctrl2X} ${toY}, ${toX} ${toY}`}
                  stroke="#94A3B8"
                  strokeWidth="1"
                  fill="none"
                  strokeLinecap="round"
                />
              )
            })}
          </svg>

          {/* Nodes */}
          {displayNodes.map((node) => {
            const pos = nodePositions.get(node.id)
            if (!pos) return null

            // Use category-based colors
            const color = getNodeColor(node.category)
            const isSelected = selectedNode === node.id
            const isConnecting = connectingFrom === node.id
            // Ensure minimum visible size: 60-120px (at zoom 0.5 = 30-60px visible)
            // Scale based on queryCount for importance
            const baseSize = 160
            const sizeBoost = Math.min(40, (node.queryCount || 0) * 5)
            const nodeSize = Math.max(160, Math.min(220, node.size || (baseSize + sizeBoost)))

            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`absolute select-none ${
                  isSelected ? 'ring-2 ring-blue-500' : ''
                } ${isConnecting ? 'ring-2 ring-emerald-500' : ''}`}
                style={{
                  left: pos.x,
                  top: pos.y,
                  width: nodeSize,
                  height: nodeSize,
                  zIndex: isSelected || draggingNode === node.id ? 100 : 1,
                }}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onClick={(e) => handleNodeClick(e, node.id)}
              >
                <div
                  className="h-full flex flex-col rounded-lg overflow-hidden cursor-grab active:cursor-grabbing shadow-sm hover:shadow-lg transition-all"
                  style={{
                    backgroundColor: color.bg,
                    border: `2px solid ${color.border}`
                  }}
                >

                  <div className="flex-1 px-3 py-2">
                    <h3 className="text-[12px] font-semibold leading-snug" style={{ color: color.text }}>
                      {node.name}
                    </h3>
                    <span className="text-[9px] uppercase tracking-wider opacity-60 mt-1 block" style={{ color: color.text }}>
                      {node.category || 'other'}
                    </span>
                  </div>

                  <div className="px-3 py-2 flex items-center justify-between" style={{ backgroundColor: `${color.text}08` }}>
                    <span className="text-[10px] font-mono font-semibold" style={{ color: color.text }}>
                      {node.queryCount || 0}q
                    </span>
                    <button
                      onClick={(e) => handleStartConnection(e, node.id)}
                      className={`text-[10px] px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors font-medium ${
                        isConnecting ? 'bg-emerald-500 text-white' : 'bg-white/80 hover:bg-white border border-slate-200'
                      }`}
                      style={{ color: isConnecting ? 'white' : color.text }}
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      Link
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Instructions */}
      <div className="px-3 py-1 bg-white dark:bg-relic-slate/20 border-t border-slate-100 dark:border-relic-slate/30 flex items-center justify-between text-[7px] text-slate-400 dark:text-relic-ghost">
        <div className="flex items-center gap-3">
          <span>Drag to move</span>
          <span>Click to expand</span>
          <span>Scroll to zoom</span>
        </div>
      </div>
    </div>
  )
}
