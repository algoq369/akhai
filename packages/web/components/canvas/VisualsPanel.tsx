'use client'

/**
 * VISUALS PANEL
 * 
 * Central panel for mindmap visualization, insight nodes, and Sefirot responses.
 * Uses React Flow for node-based canvas with force-directed layout.
 */

import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { motion } from 'framer-motion'

// Custom Node Types
interface InsightNodeData {
  label: string
  type: 'concept' | 'insight' | 'sefirah' | 'connection'
  description?: string
  weight?: number
  color?: string
}

function InsightNode({ data }: { data: InsightNodeData }) {
  const bgColors = {
    concept: 'bg-blue-100 border-blue-300',
    insight: 'bg-purple-100 border-purple-300',
    sefirah: 'bg-amber-100 border-amber-300',
    connection: 'bg-green-100 border-green-300',
  }

  const iconMap = {
    concept: '💡',
    insight: '✨',
    sefirah: '◇',
    connection: '🔗',
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`px-3 py-2 rounded-lg border-2 ${bgColors[data.type]} min-w-[100px] max-w-[180px]`}
      style={{ 
        boxShadow: data.weight ? `0 0 ${data.weight * 20}px ${data.color || '#a78bfa'}40` : undefined 
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm">{iconMap[data.type]}</span>
        <span className="text-[10px] font-medium text-relic-void truncate">{data.label}</span>
      </div>
      {data.description && (
        <p className="text-[8px] text-relic-slate leading-tight">{data.description}</p>
      )}
      {data.weight !== undefined && (
        <div className="mt-1 flex items-center gap-1">
          <div className="flex-1 h-1 bg-white/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-current rounded-full transition-all"
              style={{ width: `${data.weight * 100}%`, color: data.color || '#a78bfa' }}
            />
          </div>
          <span className="text-[7px] text-relic-silver">{Math.round(data.weight * 100)}%</span>
        </div>
      )}
    </motion.div>
  )
}

const nodeTypes = {
  insight: InsightNode,
}

export interface VisualNode {
  id: string
  label: string
  type: 'concept' | 'insight' | 'sefirah' | 'connection'
  description?: string
  weight?: number
  color?: string
  x?: number
  y?: number
}

export interface VisualEdge {
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

export function VisualsPanel({ 
  nodes: inputNodes, 
  edges: inputEdges, 
  onNodeClick,
  selectedNodeId 
}: VisualsPanelProps) {
  // Convert to React Flow format
  const initialNodes: Node[] = useMemo(() => 
    inputNodes.map((node, index) => ({
      id: node.id,
      type: 'insight',
      position: { 
        x: node.x ?? 150 + (index % 3) * 200, 
        y: node.y ?? 50 + Math.floor(index / 3) * 120 
      },
      data: {
        label: node.label,
        type: node.type,
        description: node.description,
        weight: node.weight,
        color: node.color,
      },
      selected: node.id === selectedNodeId,
    })),
  [inputNodes, selectedNodeId])

  const initialEdges: Edge[] = useMemo(() => 
    inputEdges.map((edge, index) => ({
      id: `e-${edge.source}-${edge.target}-${index}`,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      animated: true,
      style: { stroke: '#a78bfa', strokeWidth: 1.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#a78bfa' },
    })),
  [inputEdges])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const handleNodeClick = useCallback((_: any, node: Node) => {
    onNodeClick?.(node.id)
  }, [onNodeClick])

  return (
    <div className="w-full h-full" style={{ minHeight: 300 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={2}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: '#a78bfa' },
        }}
      >
        <Background color="#e5e7eb" gap={16} size={1} />
        <Controls className="!bg-white !border-relic-mist !rounded-lg !shadow-sm" />
        <MiniMap 
          className="!bg-white !border-relic-mist !rounded-lg"
          nodeColor={(node) => {
            const data = node.data as unknown as InsightNodeData
            return data?.color || '#a78bfa'
          }}
          maskColor="rgba(0,0,0,0.05)"
        />
      </ReactFlow>
    </div>
  )
}

export default VisualsPanel
