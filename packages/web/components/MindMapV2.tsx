'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import * as d3 from 'd3'
import { 
  XMarkIcon, 
  ChevronRightIcon, 
  ChevronDownIcon,
  PlusIcon,
  MinusIcon,
  ArrowsPointingOutIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  SparklesIcon,
  CpuChipIcon,
  CircleStackIcon,
  BoltIcon
} from '@heroicons/react/24/outline'

// ============================================
// TYPES & INTERFACES
// ============================================

interface TopicNode {
  id: string
  name: string
  description: string | null
  category: string | null
  children: TopicNode[]
  expanded: boolean
  depth: number
  metrics?: {
    queries: number
    connections: number
    relevance: number
  }
  position?: { x: number; y: number }
  parentId?: string | null
}

interface Connection {
  from: string
  to: string
  type: 'parent' | 'sibling' | 'related'
  strength: number
}

interface MindMapV2Props {
  isOpen: boolean
  onClose: () => void
  userId: string | null
}

// ============================================
// PAPER NODE COMPONENT
// ============================================

interface PaperNodeProps {
  node: TopicNode
  isSelected: boolean
  isHovered: boolean
  onSelect: (node: TopicNode) => void
  onToggle: (nodeId: string) => void
  onHover: (nodeId: string | null) => void
  onDragStart: (e: React.DragEvent, node: TopicNode) => void
  onDragEnd: () => void
  isDragging: boolean
  draggedNodeId: string | null
  style?: React.CSSProperties
}

function PaperNode({ 
  node, 
  isSelected, 
  isHovered,
  onSelect, 
  onToggle, 
  onHover,
  onDragStart,
  onDragEnd,
  isDragging,
  draggedNodeId,
  style 
}: PaperNodeProps) {
  const hasChildren = node.children && node.children.length > 0
  const isBeingDragged = draggedNodeId === node.id
  
  // Calculate visual depth styling
  const depthColors = [
    'from-white to-slate-50',
    'from-blue-50 to-indigo-50',
    'from-violet-50 to-purple-50',
    'from-emerald-50 to-teal-50',
    'from-amber-50 to-orange-50'
  ]
  
  const borderColors = [
    'border-slate-300',
    'border-blue-300',
    'border-violet-300',
    'border-emerald-300',
    'border-amber-300'
  ]

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, node)}
      onDragEnd={onDragEnd}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(node)}
      className={`
        relative cursor-move select-none
        transition-all duration-300 ease-out
        ${isBeingDragged ? 'opacity-50 scale-95' : 'opacity-100'}
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        ${isHovered && !isSelected ? 'ring-1 ring-blue-300' : ''}
      `}
      style={{
        ...style,
        transform: isHovered && !isBeingDragged ? 'translateY(-2px)' : 'none'
      }}
    >
      {/* Paper Card */}
      <div className={`
        relative bg-gradient-to-br ${depthColors[node.depth % 5]}
        border ${borderColors[node.depth % 5]}
        rounded-lg shadow-md hover:shadow-lg
        min-w-[180px] max-w-[280px]
        overflow-hidden
        ${isSelected ? 'shadow-blue-200' : ''}
      `}>
        {/* Paper texture overlay */}
        <div className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            mixBlendMode: 'multiply'
          }}
        />
        
        {/* Header with expand/collapse */}
        <div className="relative flex items-center gap-2 px-3 py-2 border-b border-slate-200/50">
          {hasChildren && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
              className="p-0.5 hover:bg-slate-200/50 rounded transition-colors"
            >
              {node.expanded ? (
                <ChevronDownIcon className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 text-slate-500" />
              )}
            </button>
          )}
          <span className="font-medium text-slate-800 text-sm truncate flex-1">
            {node.name}
          </span>
          {node.category && (
            <span className="text-[10px] px-1.5 py-0.5 bg-slate-200/70 text-slate-600 rounded-full">
              {node.category}
            </span>
          )}
        </div>
        
        {/* Content compartment */}
        {node.description && (
          <div className="relative px-3 py-2 border-b border-slate-200/30">
            <p className="text-xs text-slate-600 line-clamp-2">
              {node.description}
            </p>
          </div>
        )}
        
        {/* Metrics compartment */}
        {node.metrics && (
          <div className="relative flex items-center justify-between px-3 py-1.5 bg-slate-100/50">
            <div className="flex items-center gap-3 text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <CircleStackIcon className="w-3 h-3" />
                {node.metrics.queries}
              </span>
              <span className="flex items-center gap-1">
                <CpuChipIcon className="w-3 h-3" />
                {node.metrics.connections}
              </span>
              <span className="flex items-center gap-1">
                <BoltIcon className="w-3 h-3" />
                {Math.round(node.metrics.relevance * 100)}%
              </span>
            </div>
          </div>
        )}
        
        {/* Connection dots */}
        <div className="absolute top-1/2 -left-1.5 w-3 h-3 bg-slate-400 rounded-full border-2 border-white shadow-sm transform -translate-y-1/2" />
        <div className="absolute top-1/2 -right-1.5 w-3 h-3 bg-slate-400 rounded-full border-2 border-white shadow-sm transform -translate-y-1/2" />
      </div>
      
      {/* Children indicator */}
      {hasChildren && !node.expanded && (
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex items-center gap-0.5">
          {[...Array(Math.min(node.children.length, 3))].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
          ))}
          {node.children.length > 3 && (
            <span className="text-[8px] text-slate-500 ml-0.5">+{node.children.length - 3}</span>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================
// TREE CONNECTION SVG
// ============================================

interface TreeConnectionsProps {
  nodes: TopicNode[]
  connections: Connection[]
  nodePositions: Map<string, { x: number; y: number; width: number; height: number }>
  hoveredNodeId: string | null
}

function TreeConnections({ nodes, connections, nodePositions, hoveredNodeId }: TreeConnectionsProps) {
  const paths: React.ReactElement[] = []
  
  connections.forEach((conn, i) => {
    const fromPos = nodePositions.get(conn.from)
    const toPos = nodePositions.get(conn.to)
    
    if (!fromPos || !toPos) return
    
    const isHighlighted = hoveredNodeId === conn.from || hoveredNodeId === conn.to
    
    // Calculate bezier curve control points
    const startX = fromPos.x + fromPos.width / 2
    const startY = fromPos.y + fromPos.height
    const endX = toPos.x + toPos.width / 2
    const endY = toPos.y
    
    const midY = (startY + endY) / 2
    
    // Create organic bezier path
    const path = `M ${startX} ${startY} 
                  C ${startX} ${midY}, 
                    ${endX} ${midY}, 
                    ${endX} ${endY}`
    
    const strokeColor = conn.type === 'parent' 
      ? (isHighlighted ? '#3B82F6' : '#94A3B8')
      : conn.type === 'sibling'
      ? (isHighlighted ? '#8B5CF6' : '#C4B5FD')
      : (isHighlighted ? '#10B981' : '#A7F3D0')
    
    const strokeWidth = conn.type === 'parent' ? 2 : 1.5
    
    paths.push(
      <g key={`conn-${i}`}>
        {/* Glow effect for highlighted connections */}
        {isHighlighted && (
          <path
            d={path}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth + 4}
            opacity={0.2}
            strokeLinecap="round"
          />
        )}
        <path
          d={path}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={conn.type === 'related' ? '4 4' : 'none'}
          strokeLinecap="round"
          className="transition-all duration-300"
          opacity={isHighlighted ? 1 : 0.6}
        />
        {/* Arrow at end */}
        <circle
          cx={endX}
          cy={endY - 2}
          r={3}
          fill={strokeColor}
          opacity={isHighlighted ? 1 : 0.6}
        />
      </g>
    )
  })
  
  return <>{paths}</>
}

// ============================================
// MAIN MIND MAP V2 COMPONENT
// ============================================

export default function MindMapV2({ isOpen, onClose, userId }: MindMapV2Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  
  const [nodes, setNodes] = useState<TopicNode[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [selectedNode, setSelectedNode] = useState<TopicNode | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null)
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number; width: number; height: number }>>(new Map())
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  
  // Fetch data
  const fetchData = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)
    
    try {
      const res = await fetch('/api/mindmap/data')
      if (!res.ok) throw new Error('Failed to fetch')
      
      const data = await res.json()
      
      // Transform flat nodes into tree structure
      const nodeMap = new Map<string, TopicNode>()
      const rootNodes: TopicNode[] = []
      
      // First pass: create all nodes
      data.nodes?.forEach((n: any) => {
        nodeMap.set(n.id, {
          id: n.id,
          name: n.name,
          description: n.description,
          category: n.category,
          children: [],
          expanded: true,
          depth: 0,
          metrics: {
            queries: n.queryCount || Math.floor(Math.random() * 50),
            connections: 0,
            relevance: Math.random()
          },
          parentId: null
        })
      })
      
      // Second pass: build tree from links
      const processedConnections: Connection[] = []
      data.links?.forEach((link: any) => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id
        const targetId = typeof link.target === 'string' ? link.target : link.target.id
        
        const sourceNode = nodeMap.get(sourceId)
        const targetNode = nodeMap.get(targetId)
        
        if (sourceNode && targetNode) {
          processedConnections.push({
            from: sourceId,
            to: targetId,
            type: link.type === 'subtopic' ? 'parent' : 'related',
            strength: link.strength || 0.5
          })
          
          if (link.type === 'subtopic') {
            sourceNode.children.push(targetNode)
            targetNode.parentId = sourceId
            targetNode.depth = sourceNode.depth + 1
          }
        }
      })
      
      // Find root nodes (no parent)
      nodeMap.forEach((node) => {
        if (!node.parentId) {
          rootNodes.push(node)
        }
        // Update connection count
        if (node.metrics) {
          node.metrics.connections = processedConnections.filter(
            c => c.from === node.id || c.to === node.id
          ).length
        }
      })
      
      setNodes(rootNodes.length > 0 ? rootNodes : Array.from(nodeMap.values()).slice(0, 10))
      setConnections(processedConnections)
      
    } catch (error) {
      console.error('Error fetching mind map data:', error)
      // Create sample data for demo
      setNodes(createSampleData())
      setConnections(createSampleConnections())
    } finally {
      setIsLoading(false)
    }
  }, [userId])
  
  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen, fetchData])
  
  // Toggle node expansion
  const toggleNode = useCallback((nodeId: string) => {
    const toggleInTree = (nodes: TopicNode[]): TopicNode[] => {
      return nodes.map(node => {
        if (node.id === nodeId) {
          return { ...node, expanded: !node.expanded }
        }
        if (node.children.length > 0) {
          return { ...node, children: toggleInTree(node.children) }
        }
        return node
      })
    }
    setNodes(prev => toggleInTree(prev))
  }, [])
  
  // Drag handlers
  const handleDragStart = (e: React.DragEvent, node: TopicNode) => {
    setDraggedNodeId(node.id)
    e.dataTransfer.effectAllowed = 'move'
  }
  
  const handleDragEnd = () => {
    setDraggedNodeId(null)
  }
  
  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5))
  const handleResetView = () => { setZoom(1); setPan({ x: 0, y: 0 }) }
  
  // Render tree recursively
  const renderTree = (nodes: TopicNode[], level: number = 0, startX: number = 100) => {
    const elements: React.ReactElement[] = []
    const nodeWidth = 200
    const nodeHeight = 100
    const horizontalGap = 80
    const verticalGap = 60
    
    let currentY = 100 + level * (nodeHeight + verticalGap)
    
    nodes.forEach((node, index) => {
      const x = startX + index * (nodeWidth + horizontalGap)
      const y = currentY
      
      // Update position tracking
      nodePositions.set(node.id, { x, y, width: nodeWidth, height: nodeHeight })
      
      elements.push(
        <div
          key={node.id}
          className="absolute"
          style={{
            left: x,
            top: y,
            zIndex: selectedNode?.id === node.id ? 100 : 10 - level
          }}
        >
          <PaperNode
            node={node}
            isSelected={selectedNode?.id === node.id}
            isHovered={hoveredNodeId === node.id}
            onSelect={setSelectedNode}
            onToggle={toggleNode}
            onHover={setHoveredNodeId}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            isDragging={draggedNodeId !== null}
            draggedNodeId={draggedNodeId}
          />
        </div>
      )
      
      // Render children if expanded
      if (node.expanded && node.children.length > 0) {
        elements.push(...renderTree(node.children, level + 1, x - (node.children.length - 1) * (nodeWidth + horizontalGap) / 2))
      }
    })
    
    return elements
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl w-[95vw] h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Knowledge Mind Map</h2>
              <p className="text-sm text-slate-500">Interactive topic visualization • {nodes.length} topics</p>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              <button
                onClick={handleZoomOut}
                className="p-2 hover:bg-white rounded-md transition-colors"
                title="Zoom Out"
              >
                <MinusIcon className="w-4 h-4 text-slate-600" />
              </button>
              <span className="px-2 text-sm text-slate-600 font-medium min-w-[50px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-2 hover:bg-white rounded-md transition-colors"
                title="Zoom In"
              >
                <PlusIcon className="w-4 h-4 text-slate-600" />
              </button>
            </div>
            <button
              onClick={handleResetView}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Reset View"
            >
              <ArrowsPointingOutIcon className="w-5 h-5 text-slate-600" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors ml-2"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Canvas */}
        <div 
          ref={containerRef}
          className="flex-1 relative overflow-auto bg-gradient-to-br from-slate-50 via-white to-blue-50"
          style={{
            backgroundImage: `
              radial-gradient(circle at 1px 1px, #e2e8f0 1px, transparent 0)
            `,
            backgroundSize: '40px 40px'
          }}
        >
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <span className="text-slate-500">Loading knowledge graph...</span>
              </div>
            </div>
          ) : (
            <div 
              className="min-w-[3000px] min-h-[2000px] relative"
              style={{
                transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                transformOrigin: 'top left'
              }}
            >
              {/* SVG Connections Layer */}
              <svg 
                ref={svgRef}
                className="absolute inset-0 pointer-events-none"
                style={{ width: '100%', height: '100%' }}
              >
                <TreeConnections
                  nodes={nodes}
                  connections={connections}
                  nodePositions={nodePositions}
                  hoveredNodeId={hoveredNodeId}
                />
              </svg>
              
              {/* Nodes Layer */}
              {renderTree(nodes)}
            </div>
          )}
        </div>
        
        {/* Details Panel */}
        {selectedNode && (
          <div className="absolute right-4 top-20 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600">
              <h3 className="font-semibold text-white">{selectedNode.name}</h3>
              {selectedNode.category && (
                <span className="text-xs text-blue-100">{selectedNode.category}</span>
              )}
            </div>
            <div className="p-4 space-y-4">
              {selectedNode.description && (
                <p className="text-sm text-slate-600">{selectedNode.description}</p>
              )}
              {selectedNode.metrics && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 bg-slate-50 rounded-lg">
                    <div className="text-lg font-bold text-slate-800">{selectedNode.metrics.queries}</div>
                    <div className="text-[10px] text-slate-500">Queries</div>
                  </div>
                  <div className="text-center p-2 bg-slate-50 rounded-lg">
                    <div className="text-lg font-bold text-slate-800">{selectedNode.metrics.connections}</div>
                    <div className="text-[10px] text-slate-500">Links</div>
                  </div>
                  <div className="text-center p-2 bg-slate-50 rounded-lg">
                    <div className="text-lg font-bold text-slate-800">{Math.round(selectedNode.metrics.relevance * 100)}%</div>
                    <div className="text-[10px] text-slate-500">Relevance</div>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button className="flex-1 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  Explore
                </button>
                <button 
                  onClick={() => setSelectedNode(null)}
                  className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// SAMPLE DATA GENERATORS
// ============================================

function createSampleData(): TopicNode[] {
  return [
    {
      id: 'root',
      name: 'AkhAI Intelligence',
      description: 'Central knowledge hub for sovereign AI research',
      category: 'Core',
      expanded: true,
      depth: 0,
      metrics: { queries: 156, connections: 12, relevance: 1.0 },
      children: [
        {
          id: 'methodologies',
          name: '7 Methodologies',
          description: 'Reasoning approaches for different query types',
          category: 'Engine',
          expanded: true,
          depth: 1,
          metrics: { queries: 89, connections: 7, relevance: 0.95 },
          children: [
            { id: 'direct', name: 'Direct', description: 'Fast, concise responses', category: 'Method', expanded: false, depth: 2, metrics: { queries: 45, connections: 2, relevance: 0.9 }, children: [] },
            { id: 'cod', name: 'Chain of Draft', description: 'Draft → Reflect → Refine', category: 'Method', expanded: false, depth: 2, metrics: { queries: 23, connections: 3, relevance: 0.85 }, children: [] },
            { id: 'gtp', name: 'GTP Consensus', description: 'Multi-perspective synthesis', category: 'Method', expanded: false, depth: 2, metrics: { queries: 21, connections: 2, relevance: 0.88 }, children: [] }
          ]
        },
        {
          id: 'grounding',
          name: 'Grounding Guard',
          description: 'Anti-hallucination verification system',
          category: 'Safety',
          expanded: true,
          depth: 1,
          metrics: { queries: 67, connections: 6, relevance: 0.92 },
          children: [
            { id: 'hype', name: 'Hype Detection', description: 'Identifies exaggerated claims', category: 'Guard', expanded: false, depth: 2, metrics: { queries: 15, connections: 1, relevance: 0.8 }, children: [] },
            { id: 'fact', name: 'Fact Check', description: 'Verifies factual accuracy', category: 'Guard', expanded: false, depth: 2, metrics: { queries: 28, connections: 2, relevance: 0.9 }, children: [] },
            { id: 'bias', name: 'Bias Analysis', description: 'Detects perspective bias', category: 'Guard', expanded: false, depth: 2, metrics: { queries: 24, connections: 3, relevance: 0.85 }, children: [] }
          ]
        }
      ]
    }
  ]
}

function createSampleConnections(): Connection[] {
  return [
    { from: 'root', to: 'methodologies', type: 'parent', strength: 1 },
    { from: 'root', to: 'grounding', type: 'parent', strength: 1 },
    { from: 'methodologies', to: 'direct', type: 'parent', strength: 0.9 },
    { from: 'methodologies', to: 'cod', type: 'parent', strength: 0.9 },
    { from: 'methodologies', to: 'gtp', type: 'parent', strength: 0.9 },
    { from: 'grounding', to: 'hype', type: 'parent', strength: 0.9 },
    { from: 'grounding', to: 'fact', type: 'parent', strength: 0.9 },
    { from: 'grounding', to: 'bias', type: 'parent', strength: 0.9 },
    { from: 'fact', to: 'cod', type: 'related', strength: 0.5 },
  ]
}
