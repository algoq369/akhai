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
  onNodeSelect?: (node: { id: string; name: string; category?: string } | null) => void
  onNodeAction?: (query: string, nodeId: string) => void
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

interface ClusterInfo {
  center: { x: number; y: number }
  radius: number
  category: string
  nodeCount: number
}

const NODE_COLORS: Record<string, { bg: string; border: string; text: string; cluster: string }> = {
  business: { bg: '#ECFDF5', border: '#A7F3D0', text: '#059669', cluster: '#10B98115' },
  technology: { bg: '#EEF2FF', border: '#C7D2FE', text: '#4F46E5', cluster: '#6366F115' },
  finance: { bg: '#FEF3C7', border: '#FDE68A', text: '#D97706', cluster: '#F59E0B15' },
  environment: { bg: '#ECFDF5', border: '#A7F3D0', text: '#059669', cluster: '#05966915' },
  psychology: { bg: '#F5F3FF', border: '#DDD6FE', text: '#7C3AED', cluster: '#8B5CF615' },
  infrastructure: { bg: '#F0F9FF', border: '#BAE6FD', text: '#0284C7', cluster: '#0EA5E915' },
  regulation: { bg: '#FDF2F8', border: '#FBCFE8', text: '#DB2777', cluster: '#EC489915' },
  engineering: { bg: '#FEF3C7', border: '#FDE68A', text: '#D97706', cluster: '#D9770615' },
  social: { bg: '#FDF4FF', border: '#F5D0FE', text: '#C026D3', cluster: '#C026D315' },
  science: { bg: '#F0F9FF', border: '#BAE6FD', text: '#0284C7', cluster: '#0284C715' },
  health: { bg: '#FDF2F8', border: '#FBCFE8', text: '#DB2777', cluster: '#DB277715' },
  mathematics: { bg: '#FEF3C7', border: '#FDE68A', text: '#B45309', cluster: '#B4530915' },
  politics: { bg: '#FEE2E2', border: '#FECACA', text: '#DC2626', cluster: '#DC262615' },
  sports: { bg: '#D1FAE5', border: '#A7F3D0', text: '#047857', cluster: '#04785715' },
  philosophy: { bg: '#E0E7FF', border: '#C7D2FE', text: '#4338CA', cluster: '#4338CA15' },
  policy: { bg: '#FCE7F3', border: '#FBCFE8', text: '#BE185D', cluster: '#BE185D15' },
  education: { bg: '#F5F3FF', border: '#DDD6FE', text: '#6D28D9', cluster: '#6D28D915' },
  other: { bg: '#F8FAFC', border: '#E2E8F0', text: '#64748B', cluster: '#64748B10' },
}

function getNodeColor(category: string | null) {
  const cat = category?.toLowerCase() || 'other'
  return NODE_COLORS[cat] || NODE_COLORS.other
}

export default function MindMapDiagramView({ 
  userId, 
  nodes: propNodes, 
  searchQuery = '',
  onNodeSelect,
  onNodeAction 
}: MindMapDiagramViewProps) {
  const [allNodes, setAllNodes] = useState<Node[]>([])
  const [nodePositions, setNodePositions] = useState<Map<string, NodePosition>>(new Map())
  const [clusterInfos, setClusterInfos] = useState<ClusterInfo[]>([])
  const [connections, setConnections] = useState<ConnectionLine[]>([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
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

  // Force-directed layout simulation with cluster backgrounds
  useEffect(() => {
    if (displayNodes.length === 0) return

    const positions = new Map<string, NodePosition>()
    const clusters: ClusterInfo[] = []

    // Group nodes by category for cluster-based positioning
    const categoryGroups = new Map<string, Node[]>()
    displayNodes.forEach(node => {
      const cat = node.category || 'other'
      if (!categoryGroups.has(cat)) {
        categoryGroups.set(cat, [])
      }
      categoryGroups.get(cat)!.push(node)
    })

    // Calculate cluster centers with better spacing
    const categories = Array.from(categoryGroups.keys())
    const numCategories = categories.length
    const totalNodes = displayNodes.length
    const centerX = 500
    const centerY = 400
    
    // Larger cluster radius for better separation
    const clusterRadius = Math.min(800, 200 + numCategories * 60 + totalNodes * 0.5)

    const categoryPositions = new Map<string, { x: number; y: number }>()
    categories.forEach((cat, i) => {
      const angle = (i / numCategories) * Math.PI * 2 - Math.PI / 2
      categoryPositions.set(cat, {
        x: centerX + Math.cos(angle) * clusterRadius,
        y: centerY + Math.sin(angle) * clusterRadius
      })
    })

    // Position nodes within their category cluster
    categoryGroups.forEach((nodes, category) => {
      const clusterCenter = categoryPositions.get(category)!
      const nodeCount = nodes.length
      
      // Larger inner radius for better node spacing
      const innerRadius = Math.min(200, 50 + nodeCount * 12)

      let maxDistFromCenter = 0

      nodes.forEach((node, i) => {
        // Keep existing position if node already placed (for drag stability)
        const existing = nodePositions.get(node.id)
        if (existing) {
          positions.set(node.id, existing)
          const dist = Math.sqrt(
            Math.pow(existing.x - clusterCenter.x, 2) + 
            Math.pow(existing.y - clusterCenter.y, 2)
          )
          maxDistFromCenter = Math.max(maxDistFromCenter, dist)
          return
        }

        // Spiral layout within cluster for better distribution
        const spiralAngle = (i / nodeCount) * Math.PI * 2
        const spiralRadius = innerRadius * (0.3 + 0.7 * (i / Math.max(nodeCount - 1, 1)))
        
        // Reduced jitter for tighter clusters
        const jitterX = (Math.random() - 0.5) * 8
        const jitterY = (Math.random() - 0.5) * 8

        const nodeX = clusterCenter.x + Math.cos(spiralAngle) * spiralRadius + jitterX
        const nodeY = clusterCenter.y + Math.sin(spiralAngle) * spiralRadius + jitterY

        positions.set(node.id, { x: nodeX, y: nodeY })
        
        const dist = Math.sqrt(
          Math.pow(nodeX - clusterCenter.x, 2) + 
          Math.pow(nodeY - clusterCenter.y, 2)
        )
        maxDistFromCenter = Math.max(maxDistFromCenter, dist)
      })

      // Store cluster info for background rendering
      clusters.push({
        center: clusterCenter,
        radius: maxDistFromCenter + 80, // Add padding
        category,
        nodeCount
      })
    })

    setNodePositions(positions)
    setClusterInfos(clusters)
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
      onNodeSelect?.(null)
    }
  }

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.05 : 0.05
    setZoom(z => Math.min(1.5, Math.max(0.2, z + delta)))
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

  const handleNodeClick = (e: React.MouseEvent, node: Node) => {
    e.stopPropagation()
    
    if (connectingFrom && connectingFrom !== node.id) {
      const newConn: ConnectionLine = {
        from: connectingFrom,
        to: node.id,
        id: `${connectingFrom}-${node.id}`
      }
      if (!connections.find(c => c.id === newConn.id || c.id === `${node.id}-${connectingFrom}`)) {
        setConnections(prev => [...prev, newConn])
      }
      setConnectingFrom(null)
    } else {
      const newSelected = selectedNode === node.id ? null : node.id
      setSelectedNode(newSelected)
      onNodeSelect?.(newSelected ? { id: node.id, name: node.name, category: node.category || undefined } : null)
    }
  }

  // Auto-fit on initial load
  const fitToScreen = useCallback(() => {
    if (!containerRef.current || nodePositions.size === 0) return
    const container = containerRef.current
    const positions = Array.from(nodePositions.values())
    
    const minX = Math.min(...positions.map(p => p.x)) - 60
    const minY = Math.min(...positions.map(p => p.y)) - 40
    const maxX = Math.max(...positions.map(p => p.x)) + 160
    const maxY = Math.max(...positions.map(p => p.y)) + 100
    
    const contentWidth = maxX - minX
    const contentHeight = maxY - minY
    
    const scaleX = (container.clientWidth - 60) / contentWidth
    const scaleY = (container.clientHeight - 60) / contentHeight
    const newZoom = Math.min(scaleX, scaleY, 0.8)
    
    setZoom(newZoom)
    setPan({ 
      x: (container.clientWidth - contentWidth * newZoom) / 2 - minX * newZoom,
      y: (container.clientHeight - contentHeight * newZoom) / 2 - minY * newZoom
    })
  }, [nodePositions])

  // Auto-fit on first render
  useEffect(() => {
    if (nodePositions.size > 0) {
      const timer = setTimeout(fitToScreen, 100)
      return () => clearTimeout(timer)
    }
  }, [nodePositions.size > 0])

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Knowledge Graph</span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full">
            {displayNodes.length} topics · {connections.length} links
          </span>
        </div>

        <div className="flex items-center gap-2">
          <AnimatePresence>
            {connectingFrom && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500 text-white rounded-full text-[10px] font-medium"
              >
                <LinkIcon className="w-3 h-3" />
                Click target node
                <button onClick={() => setConnectingFrom(null)} className="ml-1 hover:bg-white/20 rounded-full p-0.5">✕</button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
            <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
              <MinusIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            </button>
            <span className="px-2 text-[10px] font-mono text-slate-600 dark:text-slate-300 min-w-[36px] text-center border-x border-slate-200 dark:border-slate-600">
              {Math.round(zoom * 100)}%
            </span>
            <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
              <PlusIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            </button>
          </div>

          <button 
            onClick={fitToScreen} 
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 transition-colors"
            title="Fit to screen"
          >
            <ArrowsPointingOutIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>
      </div>

      {/* Category legend */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 overflow-x-auto">
        {categories.slice(0, 12).map(([cat, count]) => {
          const color = getNodeColor(cat)
          return (
            <div key={cat} className="flex items-center gap-1.5 flex-shrink-0">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color.text }} />
              <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 capitalize">{cat}</span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500">({count})</span>
            </div>
          )
        })}
      </div>

      {/* Canvas */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-hidden relative"
        style={{ cursor: isPanning ? 'grabbing' : draggingNode ? 'move' : 'grab' }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Grid pattern */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="0.5" fill="#94A3B8" opacity="0.2" />
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
          {/* Cluster backgrounds */}
          <svg className="absolute pointer-events-none" style={{ width: '5000px', height: '5000px', overflow: 'visible' }}>
            {clusterInfos.map(cluster => {
              const color = getNodeColor(cluster.category)
              return (
                <g key={`cluster-${cluster.category}`}>
                  {/* Cluster background circle */}
                  <circle
                    cx={cluster.center.x + 55}
                    cy={cluster.center.y + 32}
                    r={cluster.radius}
                    fill={color.cluster}
                    stroke={color.text}
                    strokeWidth="1"
                    strokeOpacity="0.1"
                    strokeDasharray="8 4"
                  />
                  {/* Cluster label */}
                  <text
                    x={cluster.center.x + 55}
                    y={cluster.center.y - cluster.radius + 15}
                    textAnchor="middle"
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    fill={color.text}
                    opacity="0.6"
                  >
                    {cluster.category}
                  </text>
                </g>
              )
            })}
          </svg>

          {/* Connections */}
          <svg className="absolute pointer-events-none" style={{ width: '5000px', height: '5000px', overflow: 'visible' }}>
            <defs>
              <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#94A3B8" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#64748B" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            {connections.map(conn => {
              const fromPos = nodePositions.get(conn.from)
              const toPos = nodePositions.get(conn.to)
              if (!fromPos || !toPos) return null

              const fromX = fromPos.x + 55
              const fromY = fromPos.y + 32
              const toX = toPos.x + 55
              const toY = toPos.y + 32

              const distance = Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2))
              const opacity = Math.max(0.15, Math.min(0.6, 200 / distance))

              const midX = (fromX + toX) / 2
              const midY = (fromY + toY) / 2
              const dx = toX - fromX
              const dy = toY - fromY
              const perpX = -dy * 0.15
              const perpY = dx * 0.15

              return (
                <g key={conn.id}>
                  <path
                    d={`M ${fromX} ${fromY} Q ${midX + perpX} ${midY + perpY} ${toX} ${toY}`}
                    stroke="#6366F1"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeOpacity={opacity}
                  />
                  <circle cx={fromX} cy={fromY} r="3" fill="#6366F1" opacity={opacity} />
                  <circle cx={toX} cy={toY} r="3" fill="#6366F1" opacity={opacity} />
                </g>
              )
            })}
          </svg>

          {/* Nodes */}
          {displayNodes.map((node) => {
            const pos = nodePositions.get(node.id)
            if (!pos) return null

            const color = getNodeColor(node.category)
            const isSelected = selectedNode === node.id
            const isHovered = hoveredNode === node.id
            const isConnecting = connectingFrom === node.id

            const baseWidth = 110
            const queryScale = Math.min(1.3, 1 + (node.queryCount || 0) * 0.015)
            const nodeWidth = Math.round(baseWidth * queryScale)

            return (
              <motion.div
                key={node.id}
                className="absolute select-none"
                style={{
                  left: pos.x - (nodeWidth - 110) / 2,
                  top: pos.y,
                  width: nodeWidth,
                  zIndex: isSelected || draggingNode === node.id ? 100 : isHovered ? 50 : 1,
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: 1, 
                  scale: isSelected ? 1.05 : isHovered ? 1.02 : 1,
                }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onClick={(e) => handleNodeClick(e, node)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <div
                  className={`rounded-xl overflow-hidden cursor-grab active:cursor-grabbing transition-all duration-200 ${
                    isSelected ? 'ring-2 ring-indigo-500 shadow-lg shadow-indigo-500/20' : 
                    isHovered ? 'shadow-md' : 'shadow-sm'
                  } ${isConnecting ? 'ring-2 ring-emerald-500' : ''}`}
                  style={{
                    backgroundColor: color.bg,
                    border: `2px solid ${isSelected ? color.text : color.border}`,
                  }}
                >
                  <div className="px-3 py-2.5">
                    <h3 
                      className="text-[11px] font-semibold leading-tight line-clamp-2" 
                      style={{ color: color.text }}
                    >
                      {node.name}
                    </h3>
                    <span 
                      className="text-[8px] uppercase tracking-wider opacity-60 mt-1 block font-medium" 
                      style={{ color: color.text }}
                    >
                      {node.category || 'other'}
                    </span>
                  </div>
                  <div 
                    className="px-3 py-1.5 flex items-center justify-between" 
                    style={{ backgroundColor: `${color.text}10` }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono font-bold" style={{ color: color.text }}>
                        {node.queryCount || 0}
                      </span>
                      <span className="text-[7px] opacity-60 font-medium" style={{ color: color.text }}>queries</span>
                    </div>
                    {(isSelected || isConnecting) && (
                      <button
                        onClick={(e) => handleStartConnection(e, node.id)}
                        className={`text-[8px] px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold transition-colors ${
                          isConnecting ? 'bg-emerald-500 text-white' : 'bg-white/80 hover:bg-white'
                        }`}
                        style={{ color: isConnecting ? 'white' : color.text }}
                      >
                        <LinkIcon className="w-2.5 h-2.5" />
                        Link
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Node popup */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 5 }}
                      className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-[200] overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700" style={{ backgroundColor: color.bg }}>
                        <h4 className="text-[11px] font-semibold truncate" style={{ color: color.text }}>{node.name}</h4>
                      </div>
                      
                      <div className="px-3 py-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                        <span className="text-[10px] text-slate-500">{node.queryCount || 0} queries</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                          (node.queryCount || 0) > 5 
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                        }`}>
                          {(node.queryCount || 0) > 5 ? '● Active' : '○ Low'}
                        </span>
                      </div>
                      
                      <div className="p-2 space-y-1">
                        <button 
                          onClick={() => {
                            onNodeAction?.(`Analyze ${node.name} in depth`, node.id)
                            window.open(`/?q=${encodeURIComponent(`Analyze ${node.name}`)}`, '_blank')
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-[10px] font-medium bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors flex items-center gap-1.5"
                        >
                          <SparklesIcon className="w-3 h-3" />
                          Analyze in depth
                        </button>
                        <button 
                          onClick={() => {
                            onNodeAction?.(`Find connections for ${node.name}`, node.id)
                            navigator.clipboard.writeText(`Find connections for ${node.name}`)
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-[10px] font-medium bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors flex items-center gap-1.5"
                        >
                          <LinkIcon className="w-3 h-3" />
                          Copy query
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-500">
        <div className="flex items-center gap-4">
          <span>🖱️ Drag to move</span>
          <span>👆 Click to select</span>
          <span>🔍 Scroll to zoom</span>
        </div>
        <span className="text-slate-300 dark:text-slate-600">AkhAI Mind Map</span>
      </div>
    </div>
  )
}
