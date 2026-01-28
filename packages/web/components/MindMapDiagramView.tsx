'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Node } from './MindMap'
import { 
  ArrowsPointingOutIcon, 
  PlusIcon, 
  MinusIcon,
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

interface ClusterInfo {
  center: { x: number; y: number }
  radius: number
  category: string
  nodeCount: number
  color: string
  labelPosition: { x: number; y: number; align: string }
}

// Beautiful gradient colors for clusters - inspired by the medical futurist image
const CLUSTER_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {
  technology: { fill: 'rgba(99, 102, 241, 0.15)', stroke: 'rgba(99, 102, 241, 0.4)', text: '#818CF8' },
  business: { fill: 'rgba(16, 185, 129, 0.15)', stroke: 'rgba(16, 185, 129, 0.4)', text: '#34D399' },
  finance: { fill: 'rgba(245, 158, 11, 0.15)', stroke: 'rgba(245, 158, 11, 0.4)', text: '#FBBF24' },
  health: { fill: 'rgba(236, 72, 153, 0.15)', stroke: 'rgba(236, 72, 153, 0.4)', text: '#F472B6' },
  science: { fill: 'rgba(14, 165, 233, 0.15)', stroke: 'rgba(14, 165, 233, 0.4)', text: '#38BDF8' },
  education: { fill: 'rgba(139, 92, 246, 0.15)', stroke: 'rgba(139, 92, 246, 0.4)', text: '#A78BFA' },
  environment: { fill: 'rgba(34, 197, 94, 0.15)', stroke: 'rgba(34, 197, 94, 0.4)', text: '#4ADE80' },
  psychology: { fill: 'rgba(249, 115, 22, 0.15)', stroke: 'rgba(249, 115, 22, 0.4)', text: '#FB923C' },
  infrastructure: { fill: 'rgba(100, 116, 139, 0.15)', stroke: 'rgba(100, 116, 139, 0.4)', text: '#94A3B8' },
  regulation: { fill: 'rgba(220, 38, 38, 0.15)', stroke: 'rgba(220, 38, 38, 0.4)', text: '#F87171' },
  social: { fill: 'rgba(192, 38, 211, 0.15)', stroke: 'rgba(192, 38, 211, 0.4)', text: '#E879F9' },
  engineering: { fill: 'rgba(217, 119, 6, 0.15)', stroke: 'rgba(217, 119, 6, 0.4)', text: '#FCD34D' },
  mathematics: { fill: 'rgba(180, 83, 9, 0.15)', stroke: 'rgba(180, 83, 9, 0.4)', text: '#FCA5A5' },
  politics: { fill: 'rgba(239, 68, 68, 0.15)', stroke: 'rgba(239, 68, 68, 0.4)', text: '#FCA5A5' },
  philosophy: { fill: 'rgba(67, 56, 202, 0.15)', stroke: 'rgba(67, 56, 202, 0.4)', text: '#A5B4FC' },
  other: { fill: 'rgba(148, 163, 184, 0.12)', stroke: 'rgba(148, 163, 184, 0.3)', text: '#CBD5E1' },
}

function getClusterColor(category: string) {
  const cat = category?.toLowerCase() || 'other'
  return CLUSTER_COLORS[cat] || CLUSTER_COLORS.other
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
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [hoveredCluster, setHoveredCluster] = useState<string | null>(null)
  const [zoom, setZoom] = useState(0.45)
  const [pan, setPan] = useState({ x: 50, y: 50 })
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
      } catch (error) {
        console.error('Failed to fetch:', error)
      }
    }
    fetchData()
  }, [userId, propNodes])

  const displayNodes = propNodes || allNodes

  // Organic bubble layout - creates overlapping clusters like the medical futurist image
  useEffect(() => {
    if (displayNodes.length === 0) return

    const positions = new Map<string, NodePosition>()
    const clusters: ClusterInfo[] = []

    // Group nodes by category
    const categoryGroups = new Map<string, Node[]>()
    displayNodes.forEach(node => {
      const cat = node.category || 'other'
      if (!categoryGroups.has(cat)) {
        categoryGroups.set(cat, [])
      }
      categoryGroups.get(cat)!.push(node)
    })

    const categories = Array.from(categoryGroups.keys())
    const numCategories = categories.length
    
    // Center of the canvas
    const centerX = 600
    const centerY = 500
    
    // Create organic cluster positions - not perfectly circular, more natural
    const categoryPositions = new Map<string, { x: number; y: number; baseRadius: number }>()
    
    categories.forEach((cat, i) => {
      const nodeCount = categoryGroups.get(cat)!.length
      // Larger categories get bigger radius
      const baseRadius = Math.min(250, 80 + nodeCount * 25)
      
      // Organic positioning - use golden angle for natural distribution
      const goldenAngle = Math.PI * (3 - Math.sqrt(5))
      const angle = i * goldenAngle - Math.PI / 4
      
      // Vary the distance from center based on category size
      const distanceVariation = 0.7 + (nodeCount / 20) * 0.6
      const distance = (180 + numCategories * 35) * distanceVariation
      
      // Add some organic randomness
      const jitterX = (Math.random() - 0.5) * 60
      const jitterY = (Math.random() - 0.5) * 60
      
      categoryPositions.set(cat, {
        x: centerX + Math.cos(angle) * distance + jitterX,
        y: centerY + Math.sin(angle) * distance + jitterY,
        baseRadius
      })
    })

    // Position nodes within clusters using organic spiral
    categoryGroups.forEach((nodes, category) => {
      const catPos = categoryPositions.get(category)!
      const nodeCount = nodes.length
      const color = getClusterColor(category)
      
      // Calculate actual cluster radius based on nodes
      let maxDist = 0
      
      nodes.forEach((node, i) => {
        // Organic spiral placement
        const spiralFactor = Math.sqrt(i / Math.max(nodeCount, 1))
        const angle = i * 2.4 // Golden angle approximation
        const radius = catPos.baseRadius * spiralFactor * 0.8
        
        // Add organic jitter
        const jitterX = (Math.random() - 0.5) * 30
        const jitterY = (Math.random() - 0.5) * 30
        
        const x = catPos.x + Math.cos(angle) * radius + jitterX
        const y = catPos.y + Math.sin(angle) * radius + jitterY
        
        positions.set(node.id, { x, y })
        
        const dist = Math.sqrt(Math.pow(x - catPos.x, 2) + Math.pow(y - catPos.y, 2))
        maxDist = Math.max(maxDist, dist)
      })

      // Calculate label position - outside the cluster
      const clusterRadius = maxDist + 60
      const catIndex = categories.indexOf(category)
      const labelAngle = (catIndex / numCategories) * Math.PI * 2 - Math.PI / 2
      
      // Position labels around the edges
      let labelX = catPos.x
      let labelY = catPos.y - clusterRadius - 25
      let labelAlign = 'middle'
      
      // Adjust label position based on cluster location
      if (catPos.x < centerX - 100) {
        labelX = catPos.x - clusterRadius - 20
        labelY = catPos.y
        labelAlign = 'end'
      } else if (catPos.x > centerX + 100) {
        labelX = catPos.x + clusterRadius + 20
        labelY = catPos.y
        labelAlign = 'start'
      } else if (catPos.y > centerY) {
        labelY = catPos.y + clusterRadius + 30
      }

      clusters.push({
        center: { x: catPos.x, y: catPos.y },
        radius: clusterRadius,
        category,
        nodeCount,
        color: color.fill,
        labelPosition: { x: labelX, y: labelY, align: labelAlign }
      })
    })

    setNodePositions(positions)
    setClusterInfos(clusters)
  }, [displayNodes])

  // Mouse handlers
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      })
    }
  }, [isPanning, panStart])

  const handleMouseUp = () => {
    setIsPanning(false)
  }

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as Element).tagName === 'svg' || (e.target as Element).closest('svg')) {
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
      setSelectedNode(null)
      onNodeSelect?.(null)
    }
  }

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.03 : 0.03
    setZoom(z => Math.min(1.2, Math.max(0.2, z + delta)))
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false })
      return () => container.removeEventListener('wheel', handleWheel)
    }
  }, [handleWheel])

  const handleNodeClick = (e: React.MouseEvent, node: Node) => {
    e.stopPropagation()
    const newSelected = selectedNode === node.id ? null : node.id
    setSelectedNode(newSelected)
    onNodeSelect?.(newSelected ? { id: node.id, name: node.name, category: node.category || undefined } : null)
  }

  const fitToScreen = useCallback(() => {
    if (!containerRef.current || clusterInfos.length === 0) return
    const container = containerRef.current
    
    const allX = clusterInfos.flatMap(c => [c.center.x - c.radius, c.center.x + c.radius])
    const allY = clusterInfos.flatMap(c => [c.center.y - c.radius, c.center.y + c.radius])
    
    const minX = Math.min(...allX) - 100
    const maxX = Math.max(...allX) + 100
    const minY = Math.min(...allY) - 80
    const maxY = Math.max(...allY) + 80
    
    const contentWidth = maxX - minX
    const contentHeight = maxY - minY
    
    const scaleX = (container.clientWidth - 40) / contentWidth
    const scaleY = (container.clientHeight - 40) / contentHeight
    const newZoom = Math.min(scaleX, scaleY, 0.6)
    
    setZoom(newZoom)
    setPan({ 
      x: (container.clientWidth - contentWidth * newZoom) / 2 - minX * newZoom,
      y: (container.clientHeight - contentHeight * newZoom) / 2 - minY * newZoom
    })
  }, [clusterInfos])

  // Auto-fit on first render
  useEffect(() => {
    if (clusterInfos.length > 0) {
      const timer = setTimeout(fitToScreen, 150)
      return () => clearTimeout(timer)
    }
  }, [clusterInfos.length > 0])

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Beautiful gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #1e3a5f 0%, #2d1b4e 30%, #1a365d 60%, #312e81 100%)'
        }}
      />
      
      {/* Toolbar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-2 bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-3">
          <SparklesIcon className="w-4 h-4 text-indigo-300" />
          <span className="text-xs font-medium text-white/80">Knowledge Universe</span>
          <span className="text-[10px] text-white/50 px-2 py-0.5 bg-white/10 rounded-full">
            {displayNodes.length} topics · {clusterInfos.length} clusters
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white/10 rounded-lg overflow-hidden">
            <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="p-1.5 hover:bg-white/10 transition-colors">
              <MinusIcon className="w-3.5 h-3.5 text-white/70" />
            </button>
            <span className="px-2 text-[10px] font-mono text-white/60 min-w-[40px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button onClick={() => setZoom(z => Math.min(1.2, z + 0.1))} className="p-1.5 hover:bg-white/10 transition-colors">
              <PlusIcon className="w-3.5 h-3.5 text-white/70" />
            </button>
          </div>

          <button 
            onClick={fitToScreen} 
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            title="Fit to screen"
          >
            <ArrowsPointingOutIcon className="w-3.5 h-3.5 text-white/70" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div 
        ref={containerRef}
        className="relative flex-1 overflow-hidden"
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Transform container */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            position: 'absolute',
          }}
        >
          {/* SVG Layer for clusters and connections */}
          <svg 
            className="absolute pointer-events-none" 
            style={{ width: '2000px', height: '1500px', overflow: 'visible' }}
          >
            <defs>
              {/* Gradient definitions for each cluster */}
              {clusterInfos.map(cluster => {
                const color = getClusterColor(cluster.category)
                return (
                  <radialGradient 
                    key={`grad-${cluster.category}`} 
                    id={`cluster-gradient-${cluster.category}`}
                    cx="30%" cy="30%"
                  >
                    <stop offset="0%" stopColor={color.stroke} stopOpacity="0.3" />
                    <stop offset="70%" stopColor={color.fill} stopOpacity="0.15" />
                    <stop offset="100%" stopColor={color.fill} stopOpacity="0.05" />
                  </radialGradient>
                )
              })}
              
              {/* Glow filter */}
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Cluster bubbles - overlapping translucent circles */}
            {clusterInfos.map(cluster => {
              const color = getClusterColor(cluster.category)
              const isHovered = hoveredCluster === cluster.category
              
              return (
                <g key={`cluster-${cluster.category}`}>
                  {/* Main cluster bubble */}
                  <circle
                    cx={cluster.center.x}
                    cy={cluster.center.y}
                    r={cluster.radius}
                    fill={`url(#cluster-gradient-${cluster.category})`}
                    stroke={color.stroke}
                    strokeWidth={isHovered ? 2 : 1}
                    strokeOpacity={isHovered ? 0.6 : 0.3}
                    style={{
                      transition: 'all 0.3s ease',
                      filter: isHovered ? 'url(#glow)' : 'none'
                    }}
                    className="pointer-events-auto cursor-pointer"
                    onMouseEnter={() => setHoveredCluster(cluster.category)}
                    onMouseLeave={() => setHoveredCluster(null)}
                  />
                  
                  {/* Inner glow circle */}
                  <circle
                    cx={cluster.center.x}
                    cy={cluster.center.y}
                    r={cluster.radius * 0.7}
                    fill="none"
                    stroke={color.stroke}
                    strokeWidth="1"
                    strokeOpacity="0.1"
                    strokeDasharray="4 8"
                  />
                  
                  {/* Category label */}
                  <text
                    x={cluster.labelPosition.x}
                    y={cluster.labelPosition.y}
                    textAnchor={cluster.labelPosition.align}
                    className="text-sm font-bold uppercase tracking-wider"
                    fill={color.text}
                    style={{
                      textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                      opacity: isHovered ? 1 : 0.8
                    }}
                  >
                    {cluster.category}
                  </text>
                  
                  {/* Node count badge */}
                  <text
                    x={cluster.labelPosition.x}
                    y={cluster.labelPosition.y + 16}
                    textAnchor={cluster.labelPosition.align}
                    className="text-[10px]"
                    fill={color.text}
                    opacity="0.6"
                  >
                    {cluster.nodeCount} {cluster.nodeCount === 1 ? 'topic' : 'topics'}
                  </text>
                </g>
              )
            })}
          </svg>

          {/* Node bubbles */}
          {displayNodes.map((node) => {
            const pos = nodePositions.get(node.id)
            if (!pos) return null

            const color = getClusterColor(node.category || 'other')
            const isSelected = selectedNode === node.id
            const isHovered = hoveredNode === node.id
            
            // Size based on query count
            const baseSize = 50
            const sizeMultiplier = Math.min(1.8, 1 + (node.queryCount || 0) * 0.05)
            const size = baseSize * sizeMultiplier

            return (
              <motion.div
                key={node.id}
                className="absolute flex items-center justify-center"
                style={{
                  left: pos.x - size / 2,
                  top: pos.y - size / 2,
                  width: size,
                  height: size,
                  zIndex: isSelected ? 100 : isHovered ? 50 : 1,
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: 1, 
                  scale: isSelected ? 1.2 : isHovered ? 1.1 : 1,
                }}
                transition={{ type: 'spring', damping: 20, stiffness: 300, delay: Math.random() * 0.3 }}
                onClick={(e) => handleNodeClick(e, node)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Bubble */}
                <div
                  className="w-full h-full rounded-full cursor-pointer transition-all duration-200 flex items-center justify-center p-1"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, ${color.stroke}40, ${color.fill}60)`,
                    border: `2px solid ${isSelected ? color.text : color.stroke}`,
                    boxShadow: isSelected 
                      ? `0 0 20px ${color.stroke}, 0 0 40px ${color.fill}` 
                      : isHovered 
                        ? `0 0 15px ${color.stroke}80`
                        : `0 4px 15px rgba(0,0,0,0.3)`,
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <span 
                    className="text-[8px] font-semibold text-center leading-tight line-clamp-3 px-1"
                    style={{ 
                      color: 'white',
                      textShadow: '0 1px 3px rgba(0,0,0,0.5)'
                    }}
                  >
                    {node.name.length > 25 ? node.name.slice(0, 22) + '...' : node.name}
                  </span>
                </div>

                {/* Tooltip on hover */}
                <AnimatePresence>
                  {(isHovered || isSelected) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.9 }}
                      className="absolute top-full mt-2 px-3 py-2 bg-slate-900/95 backdrop-blur-sm rounded-lg shadow-xl border border-white/10 z-[200] min-w-[140px]"
                      style={{ pointerEvents: isSelected ? 'auto' : 'none' }}
                    >
                      <p className="text-[10px] font-semibold text-white mb-1 line-clamp-2">{node.name}</p>
                      <div className="flex items-center gap-2 text-[9px] text-white/60">
                        <span className="capitalize">{node.category || 'other'}</span>
                        <span>•</span>
                        <span>{node.queryCount || 0} queries</span>
                      </div>
                      
                      {isSelected && (
                        <div className="flex gap-1 mt-2 pt-2 border-t border-white/10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onNodeAction?.(`Analyze ${node.name}`, node.id)
                              window.open(`/?q=${encodeURIComponent(`Analyze ${node.name}`)}`, '_blank')
                            }}
                            className="flex-1 text-[8px] px-2 py-1 bg-indigo-500/30 text-indigo-200 rounded hover:bg-indigo-500/50 transition-colors"
                          >
                            Analyze
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              navigator.clipboard.writeText(`Tell me about ${node.name}`)
                            }}
                            className="flex-1 text-[8px] px-2 py-1 bg-white/10 text-white/70 rounded hover:bg-white/20 transition-colors"
                          >
                            Copy
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 px-4 py-2 bg-white/5 backdrop-blur-sm border-t border-white/10 flex items-center justify-between text-[9px] text-white/40">
        <div className="flex items-center gap-4">
          <span>🖱️ Drag to pan</span>
          <span>👆 Click to select</span>
          <span>🔍 Scroll to zoom</span>
        </div>
        <span className="text-white/30">AkhAI Knowledge Universe</span>
      </div>
    </div>
  )
}
