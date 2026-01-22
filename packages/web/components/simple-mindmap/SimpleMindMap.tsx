'use client'

/**
 * SimpleMindMap - Main container with D3 Force Layout
 *
 * Fresh redesign featuring:
 * - D3 force-directed layout for intelligent positioning
 * - Framer Motion for smooth drag interactions
 * - Simplified state (5 variables max)
 * - Settings-style minimalist aesthetic
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as d3 from 'd3'
import { MindMapNode, type MindMapNodeData } from './MindMapNode'
import { MindMapConnection, type ConnectionData } from './MindMapConnection'

// D3 simulation node type
interface SimulationNode extends d3.SimulationNodeDatum {
  id: string
  name: string
  description?: string | null
  category?: string | null
  queryCount?: number
  color?: string
  x: number
  y: number
  fx?: number | null
  fy?: number | null
}

interface SimpleMindMapProps {
  topics: MindMapNodeData[]
  connections: Array<{ from: string; to: string; type?: string; strength?: number }>
  onTopicSelect?: (topicId: string | null) => void
  onTopicExpand?: (topicId: string) => void
}

export function SimpleMindMap({
  topics,
  connections,
  onTopicSelect,
  onTopicExpand
}: SimpleMindMapProps) {
  // Core state (5 variables as per plan)
  const [nodes, setNodes] = useState<SimulationNode[]>([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const simulationRef = useRef<d3.Simulation<SimulationNode, undefined> | null>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  // Get container dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDimensions({ width: rect.width, height: rect.height })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Initialize D3 force simulation
  useEffect(() => {
    if (topics.length === 0) {
      setNodes([])
      return
    }

    // Convert topics to simulation nodes
    const simNodes: SimulationNode[] = topics.map((t, i) => ({
      ...t,
      x: t.x ?? dimensions.width / 2 + (Math.random() - 0.5) * 200,
      y: t.y ?? dimensions.height / 2 + (Math.random() - 0.5) * 200,
      fx: null,
      fy: null
    }))

    // Create link data for D3
    const simLinks = connections
      .filter(c => {
        const sourceExists = simNodes.some(n => n.id === c.from)
        const targetExists = simNodes.some(n => n.id === c.to)
        return sourceExists && targetExists
      })
      .map(c => ({
        source: c.from,
        target: c.to,
        strength: c.strength || 0.5
      }))

    // Stop existing simulation
    if (simulationRef.current) {
      simulationRef.current.stop()
    }

    // Create new simulation
    const simulation = d3.forceSimulation<SimulationNode>(simNodes)
      .force('charge', d3.forceManyBody<SimulationNode>()
        .strength(-200)
        .distanceMax(300)
      )
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collision', d3.forceCollide<SimulationNode>().radius(100))
      .force('link', d3.forceLink(simLinks)
        .id((d: any) => d.id)
        .distance(180)
        .strength((d: any) => d.strength * 0.3)
      )
      .force('x', d3.forceX(dimensions.width / 2).strength(0.03))
      .force('y', d3.forceY(dimensions.height / 2).strength(0.03))
      .alphaDecay(0.02)
      .velocityDecay(0.4)

    // Update state on each tick
    simulation.on('tick', () => {
      setNodes([...simNodes])
    })

    simulationRef.current = simulation

    // Initial nodes state
    setNodes(simNodes)

    return () => {
      simulation.stop()
    }
  }, [topics, connections, dimensions.width, dimensions.height])

  // Handle node selection
  const handleNodeSelect = useCallback((nodeId: string) => {
    if (isDragging) return
    setSelectedNode(prev => prev === nodeId ? null : nodeId)
    onTopicSelect?.(nodeId)
  }, [isDragging, onTopicSelect])

  // Handle drag start - fix node position
  const handleDragStart = useCallback((nodeId: string) => {
    setIsDragging(true)
    const simulation = simulationRef.current
    if (!simulation) return

    simulation.alphaTarget(0.3).restart()

    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        return { ...n, fx: n.x, fy: n.y }
      }
      return n
    }))
  }, [])

  // Handle drag - update fixed position
  const handleDrag = useCallback((nodeId: string, x: number, y: number) => {
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        return { ...n, fx: x, fy: y, x, y }
      }
      return n
    }))
  }, [])

  // Handle drag end - release node or keep fixed
  const handleDragEnd = useCallback((nodeId: string) => {
    setIsDragging(false)
    const simulation = simulationRef.current
    if (!simulation) return

    simulation.alphaTarget(0)

    // Release node to flow naturally
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        return { ...n, fx: null, fy: null }
      }
      return n
    }))
  }, [])

  // Restart simulation
  const restartSimulation = useCallback(() => {
    const simulation = simulationRef.current
    if (!simulation) return
    simulation.alpha(1).restart()
  }, [])

  // Handle zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY * -0.001
    setZoom(z => Math.max(0.3, Math.min(2, z + delta)))
  }, [])

  // Build node position map for connections
  const nodePositions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>()
    nodes.forEach(n => {
      map.set(n.id, { x: n.x, y: n.y })
    })
    return map
  }, [nodes])

  // Connection data with unique IDs
  const connectionData: ConnectionData[] = useMemo(() => {
    return connections.map((c, i) => ({
      id: `${c.from}-${c.to}-${i}`,
      from: c.from,
      to: c.to,
      type: c.type,
      strength: c.strength
    }))
  }, [connections])

  // Get selected node data
  const selectedNodeData = useMemo(() => {
    return nodes.find(n => n.id === selectedNode) || null
  }, [nodes, selectedNode])

  return (
    <div className="relative w-full h-full bg-neutral-50 overflow-hidden" ref={containerRef}>
      {/* Controls - minimalist text links */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-3 text-xs text-neutral-500">
        <button
          onClick={restartSimulation}
          className="hover:text-neutral-800 transition-colors"
        >
          re-layout
        </button>
        <span className="text-neutral-300">·</span>
        <button
          onClick={() => setZoom(1)}
          className="hover:text-neutral-800 transition-colors"
        >
          reset zoom
        </button>
        <span className="text-neutral-300">·</span>
        <span className="text-neutral-400">
          {nodes.length} nodes · {connections.length} links
        </span>
      </div>

      {/* Zoom indicator */}
      <div className="absolute top-4 right-4 z-20 text-[10px] text-neutral-400 font-mono">
        {Math.round(zoom * 100)}%
      </div>

      {/* Canvas with zoom/pan */}
      <motion.div
        className="absolute inset-0"
        style={{
          scale: zoom,
          x: pan.x,
          y: pan.y,
          transformOrigin: 'center center'
        }}
        onWheel={handleWheel}
      >
        {/* SVG layer for connections */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ overflow: 'visible' }}
        >
          {connectionData.map(conn => (
            <MindMapConnection
              key={conn.id}
              connection={conn}
              fromPos={nodePositions.get(conn.from) || null}
              toPos={nodePositions.get(conn.to) || null}
              selected={conn.from === selectedNode || conn.to === selectedNode}
            />
          ))}
        </svg>

        {/* Nodes layer */}
        {nodes.map(node => (
          <MindMapNode
            key={node.id}
            node={node}
            selected={node.id === selectedNode}
            onSelect={handleNodeSelect}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            containerRef={containerRef}
          />
        ))}
      </motion.div>

      {/* Detail panel - slide from right */}
      <AnimatePresence>
        {selectedNodeData && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute right-0 top-0 h-full w-72 bg-white border-l border-neutral-200 z-30"
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-sm text-neutral-700 font-normal">
                    {selectedNodeData.name}
                  </h2>
                  {selectedNodeData.category && (
                    <span className="text-[10px] text-neutral-400">
                      {selectedNodeData.category}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-neutral-400 hover:text-neutral-600 text-sm transition-colors"
                >
                  ×
                </button>
              </div>

              {/* Divider */}
              <div className="h-px bg-neutral-100 mb-4" />

              {/* Description */}
              {selectedNodeData.description && (
                <p className="text-xs text-neutral-500 leading-relaxed mb-4">
                  {selectedNodeData.description}
                </p>
              )}

              {/* Stats */}
              <div className="text-[10px] text-neutral-400 space-y-1 mb-4">
                <div>{selectedNodeData.queryCount || 0} queries</div>
                <div>
                  {connections.filter(c =>
                    c.from === selectedNodeData.id || c.to === selectedNodeData.id
                  ).length} connections
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 text-xs text-neutral-500">
                <button
                  onClick={() => onTopicExpand?.(selectedNodeData.id)}
                  className="hover:text-neutral-800 transition-colors"
                >
                  expand
                </button>
                <span className="text-neutral-300">·</span>
                <button className="hover:text-neutral-800 transition-colors">
                  insights
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-xs text-neutral-400 mb-2">no topics yet</div>
            <div className="text-[10px] text-neutral-300">
              topics are extracted from your queries
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SimpleMindMap
