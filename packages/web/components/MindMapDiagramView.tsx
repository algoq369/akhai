'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Node } from './MindMap'

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
}

const CLUSTER_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {
  technology: { fill: '#EEF2FF', stroke: '#6366F1', text: '#4338CA' },
  business: { fill: '#ECFDF5', stroke: '#10B981', text: '#047857' },
  finance: { fill: '#FEF3C7', stroke: '#F59E0B', text: '#B45309' },
  health: { fill: '#FCE7F3', stroke: '#EC4899', text: '#BE185D' },
  science: { fill: '#E0F2FE', stroke: '#0EA5E9', text: '#0369A1' },
  education: { fill: '#F3E8FF', stroke: '#A855F7', text: '#7C3AED' },
  environment: { fill: '#DCFCE7', stroke: '#22C55E', text: '#15803D' },
  psychology: { fill: '#FFEDD5', stroke: '#F97316', text: '#C2410C' },
  infrastructure: { fill: '#F1F5F9', stroke: '#64748B', text: '#475569' },
  regulation: { fill: '#FEE2E2', stroke: '#EF4444', text: '#DC2626' },
  social: { fill: '#FAE8FF', stroke: '#D946EF', text: '#A21CAF' },
  engineering: { fill: '#FEF9C3', stroke: '#EAB308', text: '#A16207' },
  philosophy: { fill: '#E0E7FF', stroke: '#6366F1', text: '#4338CA' },
  policy: { fill: '#FEE2E2', stroke: '#F87171', text: '#B91C1C' },
  society: { fill: '#F3E8FF', stroke: '#C084FC', text: '#7C3AED' },
  sports: { fill: '#CFFAFE', stroke: '#06B6D4', text: '#0891B2' },
  communication: { fill: '#DBEAFE', stroke: '#3B82F6', text: '#1D4ED8' },
  other: { fill: '#F8FAFC', stroke: '#94A3B8', text: '#64748B' },
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
  const [zoom, setZoom] = useState(0.5)
  const [pan, setPan] = useState({ x: 50, y: 50 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    if (displayNodes.length === 0) return

    const positions = new Map<string, NodePosition>()
    const clusters: ClusterInfo[] = []

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
    
    const centerX = 800
    const centerY = 600
    
    categories.forEach((cat, i) => {
      const nodes = categoryGroups.get(cat)!
      const nodeCount = nodes.length
      const baseRadius = Math.min(180, 60 + nodeCount * 15)
      
      const angle = (i / numCategories) * Math.PI * 2 - Math.PI / 2
      const distance = 250 + numCategories * 20
      
      const clusterX = centerX + Math.cos(angle) * distance
      const clusterY = centerY + Math.sin(angle) * distance
      
      let maxDist = 0
      
      nodes.forEach((node, j) => {
        const spiralFactor = Math.sqrt(j / Math.max(nodeCount, 1))
        const nodeAngle = j * 2.4
        const radius = baseRadius * spiralFactor * 0.7
        
        const x = clusterX + Math.cos(nodeAngle) * radius
        const y = clusterY + Math.sin(nodeAngle) * radius
        
        positions.set(node.id, { x, y })
        
        const dist = Math.sqrt(Math.pow(x - clusterX, 2) + Math.pow(y - clusterY, 2))
        maxDist = Math.max(maxDist, dist)
      })

      clusters.push({
        center: { x: clusterX, y: clusterY },
        radius: maxDist + 50,
        category: cat,
        nodeCount
      })
    })

    setNodePositions(positions)
    setClusterInfos(clusters)
  }, [displayNodes])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      })
    }
  }, [isPanning, panStart])

  const handleMouseUp = () => setIsPanning(false)

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as Element).tagName === 'svg') {
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
      setSelectedNode(null)
      onNodeSelect?.(null)
    }
  }

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.05 : 0.05
    setZoom(z => Math.min(1.5, Math.max(0.15, z + delta)))
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
    
    const minX = Math.min(...allX) - 80
    const maxX = Math.max(...allX) + 80
    const minY = Math.min(...allY) - 80
    const maxY = Math.max(...allY) + 80
    
    const contentWidth = maxX - minX
    const contentHeight = maxY - minY
    
    const scaleX = (container.clientWidth - 40) / contentWidth
    const scaleY = (container.clientHeight - 40) / contentHeight
    const newZoom = Math.min(scaleX, scaleY, 0.7)
    
    setZoom(newZoom)
    setPan({ 
      x: (container.clientWidth - contentWidth * newZoom) / 2 - minX * newZoom,
      y: (container.clientHeight - contentHeight * newZoom) / 2 - minY * newZoom
    })
  }, [clusterInfos])

  useEffect(() => {
    if (clusterInfos.length > 0) {
      const timer = setTimeout(fitToScreen, 100)
      return () => clearTimeout(timer)
    }
  }, [clusterInfos.length > 0])

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-white">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-600">knowledge graph</span>
          <span className="text-xs text-slate-400">
            {displayNodes.length} topics / {clusterInfos.length} clusters
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setZoom(z => Math.max(0.15, z - 0.1))} 
            className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded"
          >
            -
          </button>
          <span className="text-xs font-mono text-slate-500 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button 
            onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} 
            className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded"
          >
            +
          </button>
          <button 
            onClick={fitToScreen} 
            className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded"
          >
            fit
          </button>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="relative flex-1 overflow-hidden bg-white"
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            position: 'absolute',
          }}
        >
          <svg 
            className="absolute pointer-events-none" 
            style={{ width: '2000px', height: '1500px', overflow: 'visible' }}
          >
            {clusterInfos.map(cluster => {
              const color = getClusterColor(cluster.category)
              return (
                <g key={`cluster-${cluster.category}`}>
                  <circle
                    cx={cluster.center.x}
                    cy={cluster.center.y}
                    r={cluster.radius}
                    fill={color.fill}
                    stroke={color.stroke}
                    strokeWidth="1"
                    strokeOpacity="0.3"
                    fillOpacity="0.5"
                  />
                  <text
                    x={cluster.center.x}
                    y={cluster.center.y - cluster.radius - 10}
                    textAnchor="middle"
                    className="text-xs font-medium"
                    fill={color.text}
                  >
                    {cluster.category}
                  </text>
                  <text
                    x={cluster.center.x}
                    y={cluster.center.y - cluster.radius + 5}
                    textAnchor="middle"
                    className="text-[9px]"
                    fill={color.text}
                    opacity="0.6"
                  >
                    {cluster.nodeCount} topics
                  </text>
                </g>
              )
            })}
          </svg>

          {displayNodes.map((node) => {
            const pos = nodePositions.get(node.id)
            if (!pos) return null

            const color = getClusterColor(node.category || 'other')
            const isSelected = selectedNode === node.id
            const isHovered = hoveredNode === node.id
            
            const baseSize = 40
            const sizeMultiplier = Math.min(1.6, 1 + (node.queryCount || 0) * 0.04)
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
                  scale: isSelected ? 1.15 : isHovered ? 1.05 : 1,
                }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                onClick={(e) => handleNodeClick(e, node)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <div
                  className="w-full h-full rounded-full cursor-pointer transition-all duration-150 flex items-center justify-center p-1"
                  style={{
                    backgroundColor: color.fill,
                    border: `2px solid ${isSelected ? color.text : color.stroke}`,
                    boxShadow: isSelected 
                      ? `0 0 0 3px ${color.stroke}40` 
                      : isHovered 
                        ? `0 2px 8px ${color.stroke}30`
                        : 'none',
                  }}
                >
                  <span 
                    className="text-[7px] font-medium text-center leading-tight line-clamp-3 px-0.5"
                    style={{ color: color.text }}
                  >
                    {node.name.length > 20 ? node.name.slice(0, 18) + '..' : node.name}
                  </span>
                </div>

                <AnimatePresence>
                  {(isHovered || isSelected) && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute top-full mt-1 px-2 py-1.5 bg-white rounded shadow-lg border border-slate-200 z-[200] min-w-[120px]"
                      style={{ pointerEvents: isSelected ? 'auto' : 'none' }}
                    >
                      <p className="text-[10px] font-medium text-slate-800 mb-0.5">{node.name}</p>
                      <p className="text-[9px] text-slate-500">
                        {node.category || 'other'} / {node.queryCount || 0} queries
                      </p>
                      
                      {isSelected && (
                        <div className="flex gap-1 mt-1.5 pt-1.5 border-t border-slate-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onNodeAction?.(`Analyze ${node.name}`, node.id)
                              window.open(`/?q=${encodeURIComponent(`Analyze ${node.name}`)}`, '_blank')
                            }}
                            className="flex-1 text-[8px] px-1.5 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                          >
                            analyze
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              navigator.clipboard.writeText(`Tell me about ${node.name}`)
                            }}
                            className="flex-1 text-[8px] px-1.5 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                          >
                            copy
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

      <div className="px-4 py-1.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400">
        <div className="flex items-center gap-4">
          <span>drag to pan</span>
          <span>click to select</span>
          <span>scroll to zoom</span>
        </div>
        <span>akhai knowledge graph</span>
      </div>
    </div>
  )
}
