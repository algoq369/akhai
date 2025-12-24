'use client'

import { useState, useEffect, useRef } from 'react'

interface Node {
  id: string
  label: string
  description: string | null
  category: string
  queryCount: number
  x?: number
  y?: number
  color?: string
  pinned?: boolean
  archived?: boolean
}

interface Link {
  source: string
  target: string
  type: string
  strength: number
}

interface MindMapProps {
  isOpen: boolean
  onClose: () => void
}

const CATEGORY_COLORS: Record<string, string> = {
  technology: '#3b82f6',
  finance: '#10b981',
  science: '#8b5cf6',
  business: '#f59e0b',
  health: '#ef4444',
  education: '#6366f1',
  other: '#6b7280',
}

const COLOR_PALETTE = [
  '#3b82f6', // blue
  '#10b981', // green
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ef4444', // red
  '#6366f1', // indigo
  '#ec4899', // pink
  '#14b8a6', // teal
]

export default function MindMap({ isOpen, onClose }: MindMapProps) {
  const [nodes, setNodes] = useState<Node[]>([])
  const [links, setLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (isOpen) {
      fetchMindMapData()
    }
  }, [isOpen])

  const fetchMindMapData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/mindmap/data')
      if (res.ok) {
        const data = await res.json()
        // Initialize positions using force-directed layout
        const positionedNodes = initializeLayout(data.nodes, data.links)
        setNodes(positionedNodes)
        setLinks(data.links)
      }
    } catch (error) {
      console.error('Failed to fetch mind map data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Simple force-directed layout initialization
  const initializeLayout = (nodes: Node[], links: Link[]): Node[] => {
    const centerX = 400
    const centerY = 300
    const radius = 200

    return nodes.map((node, i) => {
      if (node.x && node.y) {
        return node // Keep existing position
      }
      // Circular layout
      const angle = (i / nodes.length) * Math.PI * 2
      return {
        ...node,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        color: node.color || CATEGORY_COLORS[node.category] || CATEGORY_COLORS.other,
      }
    })
  }

  const handleNodeClick = (node: Node) => {
    setSelectedNode(node)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggedNode || !svgRef.current) return

      const svg = svgRef.current
      const rect = svg.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      setNodes(prev => prev.map(n =>
        n.id === draggedNode ? { ...n, x, y } : n
      ))
    }

    const handleMouseUp = () => {
      setDraggedNode(null)
    }

    if (draggedNode) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [draggedNode])

  const handleColorChange = async (nodeId: string, color: string) => {
    // Update local state
    setNodes(prev => prev.map(n =>
      n.id === nodeId ? { ...n, color } : n
    ))

    // Update in database
    try {
      await fetch(`/api/mindmap/topics/${nodeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color }),
      })
    } catch (error) {
      console.error('Failed to update topic color:', error)
    }
  }

  const handlePinToggle = async (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return

    const newPinned = !node.pinned
    setNodes(prev => prev.map(n =>
      n.id === nodeId ? { ...n, pinned: newPinned } : n
    ))

    try {
      await fetch(`/api/mindmap/topics/${nodeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned: newPinned ? 1 : 0 }),
      })
    } catch (error) {
      console.error('Failed to update topic pin:', error)
    }
  }

  const handleArchiveToggle = async (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return

    const newArchived = !node.archived
    setNodes(prev => prev.map(n =>
      n.id === nodeId ? { ...n, archived: newArchived } : n
    ))

    try {
      await fetch(`/api/mindmap/topics/${nodeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: newArchived ? 1 : 0 }),
      })
    } catch (error) {
      console.error('Failed to update topic archive:', error)
    }
  }

  if (!isOpen) return null

  const visibleNodes = nodes.filter(n => !n.archived)
  const visibleLinks = links.filter(l =>
    visibleNodes.some(n => n.id === l.source) &&
    visibleNodes.some(n => n.id === l.target)
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-relic-white border border-relic-mist rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden animate-fade-in flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-relic-mist">
          <div>
            <h2 className="text-lg font-medium text-relic-slate">Mind Map</h2>
            <p className="text-xs text-relic-silver">
              {visibleNodes.length} topics · {visibleLinks.length} connections
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-relic-silver hover:text-relic-slate transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Mind Map Canvas */}
        <div className="flex-1 relative overflow-hidden bg-relic-ghost/10">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-2 border-relic-mist border-t-relic-slate rounded-full animate-spin" />
            </div>
          ) : visibleNodes.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-relic-silver text-sm">No topics yet</p>
                <p className="text-relic-silver/60 text-xs mt-1">
                  Topics will appear here as you chat
                </p>
              </div>
            </div>
          ) : (
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              className="cursor-move"
            >
              {/* Links */}
              {visibleLinks.map((link, i) => {
                const sourceNode = visibleNodes.find(n => n.id === link.source)
                const targetNode = visibleNodes.find(n => n.id === link.target)
                if (!sourceNode || !targetNode || !sourceNode.x || !targetNode.y) return null

                return (
                  <line
                    key={i}
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    stroke="#e5e7eb"
                    strokeWidth={link.strength}
                    opacity={0.3}
                  />
                )
              })}

              {/* Nodes */}
              {visibleNodes.map(node => {
                if (!node.x || !node.y) return null

                return (
                  <g key={node.id}>
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.pinned ? 25 : 20}
                      fill={node.color || CATEGORY_COLORS[node.category] || CATEGORY_COLORS.other}
                      stroke={selectedNode?.id === node.id ? '#374151' : '#d1d5db'}
                      strokeWidth={selectedNode?.id === node.id ? 3 : 1}
                      className="cursor-move hover:opacity-80 transition-opacity"
                      onClick={() => handleNodeClick(node)}
                      onMouseDown={() => setDraggedNode(node.id)}
                    />
                    {node.pinned && (
                      <text
                        x={node.x}
                        y={node.y - 30}
                        textAnchor="middle"
                        className="text-xs fill-relic-slate"
                      >
                        📌
                      </text>
                    )}
                    <text
                      x={node.x}
                      y={node.y + 35}
                      textAnchor="middle"
                      className="text-xs fill-relic-slate font-medium"
                    >
                      {node.label}
                    </text>
                  </g>
                )
              })}
            </svg>
          )}
        </div>

        {/* Sidebar - Node Details */}
        {selectedNode && (
          <div className="w-80 border-l border-relic-mist bg-relic-white p-4 overflow-y-auto">
            <h3 className="text-sm font-medium text-relic-slate mb-3">
              {selectedNode.label}
            </h3>

            {selectedNode.description && (
              <p className="text-xs text-relic-silver mb-4">
                {selectedNode.description}
              </p>
            )}

            <div className="space-y-3">
              {/* Color Picker */}
              <div>
                <label className="text-xs text-relic-silver mb-2 block">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_PALETTE.map(color => (
                    <button
                      key={color}
                      onClick={() => handleColorChange(selectedNode.id, color)}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        (selectedNode.color || CATEGORY_COLORS[selectedNode.category]) === color
                          ? 'border-relic-slate scale-110'
                          : 'border-relic-mist hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Pin/Archive */}
              <div className="flex gap-2">
                <button
                  onClick={() => handlePinToggle(selectedNode.id)}
                  className={`flex-1 px-3 py-2 text-xs rounded border transition-colors ${
                    selectedNode.pinned
                      ? 'bg-relic-slate text-white border-relic-slate'
                      : 'bg-relic-ghost text-relic-silver border-relic-mist hover:border-relic-slate'
                  }`}
                >
                  {selectedNode.pinned ? '📌 Pinned' : 'Pin'}
                </button>
                <button
                  onClick={() => handleArchiveToggle(selectedNode.id)}
                  className={`flex-1 px-3 py-2 text-xs rounded border transition-colors ${
                    selectedNode.archived
                      ? 'bg-relic-slate text-white border-relic-slate'
                      : 'bg-relic-ghost text-relic-silver border-relic-mist hover:border-relic-slate'
                  }`}
                >
                  {selectedNode.archived ? '📦 Archived' : 'Archive'}
                </button>
              </div>

              {/* Query Count */}
              <div className="text-xs text-relic-silver">
                <span className="font-medium">{selectedNode.queryCount}</span> queries
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

