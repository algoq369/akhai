'use client'

import { useMemo } from 'react'
import * as d3 from 'd3'
import type { Node } from './MindMap'
import type { TopicInsights } from '@/lib/mindmap-insights'
import { getShapeConfig } from '@/lib/shape-encoder'

interface MindMapDiagramViewProps {
  nodes: Node[]
  links: Array<{ source: string | Node; target: string | Node; type: string; strength: number }>
  insights: Record<string, TopicInsights>
  onNodeSelect: (node: Node) => void
  selectedNode: Node | null
}

export default function MindMapDiagramView({ nodes, links, insights, onNodeSelect, selectedNode }: MindMapDiagramViewProps) {
  // Group nodes by category
  const clusters = useMemo(() => {
    const clusterMap = new Map<string, Node[]>()
    nodes.forEach(node => {
      const category = node.category || 'other'
      if (!clusterMap.has(category)) {
        clusterMap.set(category, [])
      }
      clusterMap.get(category)!.push(node)
    })
    return Array.from(clusterMap.entries())
  }, [nodes])

  // Calculate cluster positions in a grid layout
  const clusterLayout = useMemo(() => {
    const cols = Math.ceil(Math.sqrt(clusters.length))
    const clusterSize = 200
    const padding = 50

    return clusters.map(([category, clusterNodes], index) => {
      const row = Math.floor(index / cols)
      const col = index % cols
      return {
        category,
        nodes: clusterNodes,
        x: col * (clusterSize + padding) + clusterSize / 2,
        y: row * (clusterSize + padding) + clusterSize / 2,
        size: clusterSize,
      }
    })
  }, [clusters])

  return (
    <div className="w-full h-full overflow-auto p-6">
      <svg width={Math.max(800, clusterLayout.length > 0 ? Math.max(...clusterLayout.map(c => c.x)) + 250 : 800)} 
           height={Math.max(600, clusterLayout.length > 0 ? Math.max(...clusterLayout.map(c => c.y)) + 250 : 600)}
           className="border border-relic-mist">
        {clusterLayout.map((cluster, clusterIndex) => (
          <g key={cluster.category}>
            {/* Cluster background */}
            <rect
              x={cluster.x - cluster.size / 2}
              y={cluster.y - cluster.size / 2}
              width={cluster.size}
              height={cluster.size}
              fill="none"
              stroke="#E5E5E5"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
            
            {/* Cluster label */}
            <text
              x={cluster.x}
              y={cluster.y - cluster.size / 2 - 10}
              textAnchor="middle"
              fontSize="12"
              fill="#525252"
              fontWeight="bold"
              fontFamily="monospace"
            >
              {cluster.category}
            </text>

            {/* Nodes in cluster - arranged in a grid within the cluster */}
            {cluster.nodes.map((node, nodeIndex) => {
              const nodesPerRow = Math.ceil(Math.sqrt(cluster.nodes.length))
              const nodeSpacing = cluster.size / (nodesPerRow + 1)
              const nodeRow = Math.floor(nodeIndex / nodesPerRow)
              const nodeCol = nodeIndex % nodesPerRow
              const nodeX = cluster.x - cluster.size / 2 + (nodeCol + 1) * nodeSpacing
              const nodeY = cluster.y - cluster.size / 2 + (nodeRow + 1) * nodeSpacing

              const topicInsights = insights[node.id]
              const shapeConfig = getShapeConfig(node, {
                sentiment: topicInsights?.sentiment || 0,
                bias: Array.isArray(topicInsights?.bias) ? topicInsights.bias.length : (topicInsights?.bias || 0)
              })
              const isSelected = selectedNode?.id === node.id

              return (
                <g
                  key={node.id}
                  transform={`translate(${nodeX}, ${nodeY})`}
                  onClick={() => onNodeSelect(node)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Simple circle only */}
                  <circle
                    r={shapeConfig.size}
                    fill={shapeConfig.color}
                    stroke={isSelected ? '#525252' : '#6B7280'}
                    strokeWidth={isSelected ? 3 : 2}
                  />
                  
                  {/* Node label */}
                  <text
                    y={shapeConfig.size + 15}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#525252"
                    fontFamily="monospace"
                  >
                    {node.name.length > 12 ? node.name.substring(0, 10) + '...' : node.name}
                  </text>
                </g>
              )
            })}
          </g>
        ))}
      </svg>
    </div>
  )
}

