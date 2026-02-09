'use client'

/**
 * VISUALS PANEL
 * 
 * Central panel for mindmap visualization.
 * Simple SVG-based visualization (no external dependencies).
 */

import { useState } from 'react'
import { motion } from 'framer-motion'

export interface VisualNode {
  id: string
  label: string
  type: 'concept' | 'insight' | 'layerNode' | 'connection'
  description?: string
  weight?: number
  color?: string
  x?: number
  y?: number
}

export interface VisualEdge {
  id?: string
  source: string
  target: string
  label?: string
}

interface VisualsPanelProps {
  nodes: VisualNode[]
  edges: VisualEdge[]
  onNodeClick?: (nodeId: string) => void
  selectedNodeId?: string | null
}

const NODE_COLORS = {
  concept: '#a78bfa',
  insight: '#fbbf24', 
  layerNode: '#4ade80',
  connection: '#60a5fa',
}

export function VisualsPanel({
  nodes,
  edges,
  onNodeClick,
  selectedNodeId,
}: VisualsPanelProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  // Calculate positions if not provided
  const positionedNodes = nodes.map((node, idx) => ({
    ...node,
    x: node.x ?? 50 + (idx % 3) * 120,
    y: node.y ?? 50 + Math.floor(idx / 3) * 80,
  }))

  const getNodePosition = (nodeId: string) => {
    const node = positionedNodes.find(n => n.id === nodeId)
    return node ? { x: node.x!, y: node.y! } : { x: 0, y: 0 }
  }

  return (
    <div className="w-full h-full min-h-[300px] bg-relic-ghost/30 relative overflow-hidden">
      {/* Empty State */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-relic-silver">
            <div className="text-2xl mb-2">◇</div>
            <p className="text-[10px] uppercase tracking-wider">Start a conversation</p>
            <p className="text-[9px] mt-1">Concepts will appear here</p>
          </div>
        </div>
      )}

      {/* SVG Canvas */}
      {nodes.length > 0 && (
        <svg className="w-full h-full" viewBox="0 0 400 300">
          {/* Background Grid */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="0.5" fill="#d1d5db" />
            </pattern>
            {/* Glow filter for selected/hovered nodes */}
            <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Edges */}
          {edges.map((edge, idx) => {
            const source = getNodePosition(edge.source)
            const target = getNodePosition(edge.target)
            return (
              <line
                key={edge.id || `edge-${idx}`}
                x1={source.x + 40}
                y1={source.y + 20}
                x2={target.x + 40}
                y2={target.y + 20}
                stroke="#d1d5db"
                strokeWidth="1"
              />
            )
          })}

          {/* Nodes */}
          {positionedNodes.map(node => {
            const isSelected = selectedNodeId === node.id
            const isHovered = hoveredNode === node.id
            const color = NODE_COLORS[node.type] || NODE_COLORS.concept

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => onNodeClick?.(node.id)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Node Background */}
                <rect
                  width="80"
                  height="40"
                  rx="4"
                  fill={isSelected || isHovered ? color : '#ffffff'}
                  stroke={color}
                  strokeWidth={isSelected ? 2 : 1}
                  opacity={isSelected || isHovered ? 1 : 0.8}
                  filter={isSelected || isHovered ? 'url(#node-glow)' : undefined}
                />
                {/* Node Label */}
                <text
                  x="40"
                  y="24"
                  textAnchor="middle"
                  fontSize="8"
                  fill={isSelected || isHovered ? '#ffffff' : '#374151'}
                  fontFamily="monospace"
                >
                  {node.label.slice(0, 12)}
                </text>
              </g>
            )
          })}
        </svg>
      )}

      {/* Controls */}
      <div className="absolute bottom-2 right-2 flex gap-1">
        <button className="px-2 py-1 bg-white border border-relic-mist rounded text-[8px] text-relic-silver hover:text-relic-slate">
          Fit
        </button>
        <button className="px-2 py-1 bg-white border border-relic-mist rounded text-[8px] text-relic-silver hover:text-relic-slate">
          +
        </button>
        <button className="px-2 py-1 bg-white border border-relic-mist rounded text-[8px] text-relic-silver hover:text-relic-slate">
          -
        </button>
      </div>
    </div>
  )
}

export default VisualsPanel
