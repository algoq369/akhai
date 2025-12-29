'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Node } from './MindMap'
import { 
  ArrowsPointingOutIcon, 
  PlusIcon, 
  MinusIcon,
  LinkIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

interface MindMapDiagramViewProps {
  userId: string | null
  nodes?: Node[]
  searchQuery?: string
  categoryFilter?: string
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

export default function MindMapDiagramView({ userId, nodes: propNodes, searchQuery = '', categoryFilter = 'all' }: MindMapDiagramViewProps) {
  const [allNodes, setAllNodes] = useState<Node[]>([])
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
        const res = await fetch('/api/mindmap/data')
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
    const spacingX = 150
    const spacingY = 95
    
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
      setSelectedNode(selectedNode === nodeId ? null : nodeId)
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
    <div className="w-full h-full flex flex-col bg-slate-50">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-white border-b border-slate-100">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-3.5 h-3.5 text-indigo-500" />
          <span className="text-[10px] font-medium text-slate-600">Freeform Canvas</span>
          <span className="text-[9px] text-slate-400">
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

          <div className="flex items-center bg-white border border-slate-200 rounded">
            <button onClick={() => setZoom(z => Math.max(0.25, z - 0.1))} className="p-1 hover:bg-slate-50">
              <MinusIcon className="w-3 h-3 text-slate-500" />
            </button>
            <span className="px-1.5 text-[8px] font-mono text-slate-500 min-w-[28px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} className="p-1 hover:bg-slate-50">
              <PlusIcon className="w-3 h-3 text-slate-500" />
            </button>
          </div>

          <button onClick={fitToScreen} className="p-1 hover:bg-slate-100 rounded border border-slate-200">
            <ArrowsPointingOutIcon className="w-3 h-3 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Category legend */}
      <div className="flex items-center gap-2 px-3 py-1 border-b border-slate-100 bg-white/50 overflow-x-auto">
        {categories.slice(0, 12).map(([cat, count]) => {
          const color = getNodeColor(cat)
          return (
            <div key={cat} className="flex items-center gap-1 flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color.text }} />
              <span className="text-[7px] text-slate-500">{cat}</span>
              <span className="text-[6px] text-slate-400">({count})</span>
            </div>
          )
        })}
      </div>

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
            
            const color = getNodeColor(node.category)
            const isSelected = selectedNode === node.id
            const isConnecting = connectingFrom === node.id
            
            return (
              <div
                key={node.id}
                className={`absolute select-none ${
                  isSelected ? 'ring-1 ring-blue-500' : ''
                } ${isConnecting ? 'ring-1 ring-emerald-500' : ''}`}
                style={{
                  left: pos.x,
                  top: pos.y,
                  width: 110,
                  zIndex: isSelected || draggingNode === node.id ? 100 : 1,
                }}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onClick={(e) => handleNodeClick(e, node.id)}
              >
                <div 
                  className="rounded-md overflow-hidden cursor-grab active:cursor-grabbing shadow-sm hover:shadow transition-shadow"
                  style={{ 
                    backgroundColor: color.bg,
                    border: `1px solid ${color.border}`
                  }}
                >
                  <div className="px-2 py-1.5">
                    <h3 className="text-[8px] font-medium leading-tight line-clamp-2" style={{ color: color.text }}>
                      {node.name}
                    </h3>
                    <span className="text-[6px] uppercase tracking-wider opacity-60" style={{ color: color.text }}>
                      {node.category || 'other'}
                    </span>
                  </div>
                  <div className="px-2 py-1 flex items-center justify-between" style={{ backgroundColor: `${color.text}08` }}>
                    <span className="text-[6px]" style={{ color: color.text }}>
                      {node.queryCount || 0}q
                    </span>
                    {(isSelected || isConnecting) && (
                      <button
                        onClick={(e) => handleStartConnection(e, node.id)}
                        className={`text-[6px] px-1 py-0.5 rounded flex items-center gap-0.5 ${
                          isConnecting ? 'bg-emerald-500 text-white' : 'bg-white/60'
                        }`}
                        style={{ color: isConnecting ? 'white' : color.text }}
                      >
                        <LinkIcon className="w-2 h-2" />
                        Link
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Expanded popup on selection - Compact */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 5 }}
                      className="absolute top-full left-0 mt-1 w-44 bg-white dark:bg-slate-800 rounded shadow-lg border border-slate-200 dark:border-slate-700 z-[200] overflow-hidden text-[8px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Header */}
                      <div className="px-2 py-1.5 border-b border-slate-100 dark:border-slate-700" style={{ backgroundColor: color.bg }}>
                        <h4 className="font-semibold truncate" style={{ color: color.text }}>{node.name}</h4>
                      </div>
                      
                      {/* Metrics row */}
                      <div className="px-2 py-1.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                        <span className="text-slate-500">{node.queryCount || 0} queries</span>
                        <span className={`px-1 py-0.5 rounded ${(node.queryCount || 0) > 5 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {(node.queryCount || 0) > 5 ? 'Active' : 'Low'}
                        </span>
                      </div>
                      
                      {/* Quick actions - Opens in new tab */}
                      <div className="p-1.5 space-y-1">
                        <button 
                          onClick={() => window.open(`/?q=${encodeURIComponent(`Analyze ${node.name}`)}`, '_blank')}
                          className="w-full text-left px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                        >
                          → Analyze (new tab)
                        </button>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(`Find connections for ${node.name}`)
                            alert('Query copied! Paste in chat.')
                          }}
                          className="w-full text-left px-2 py-1 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                        >
                          → Copy query
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>

      {/* Instructions */}
      <div className="px-3 py-1 bg-white border-t border-slate-100 flex items-center justify-between text-[7px] text-slate-400">
        <div className="flex items-center gap-3">
          <span>Drag to move</span>
          <span>Click to select</span>
          <span>Scroll to zoom</span>
        </div>
      </div>
    </div>
  )
}
