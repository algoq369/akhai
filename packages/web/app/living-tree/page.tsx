'use client'

/**
 * Living Tree Visualization
 *
 * Force-directed graph showing dynamic topic evolution
 * Real-time updates, Hermetic insights, and interactive exploration
 */

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// TypeScript interfaces
interface TreeNode {
  id: number
  name: string
  description: string
  importance: number
  vibrationLevel: 'high' | 'medium' | 'low'
  polarity: 'positive' | 'negative' | 'neutral'
  rhythmPhase: 'rising' | 'peak' | 'falling' | 'trough'
  emergedAt: string
  isActive: boolean
  parentId: number | null
  // D3 simulation properties
  x?: number
  y?: number
  vx?: number
  vy?: number
  fx?: number | null
  fy?: number | null
}

interface TreeEdge {
  source: number | TreeNode
  target: number | TreeNode
  relationshipType: string
  strength: number
  hermeticLaw: string | null
}

interface EvolutionEvent {
  timestamp: string
  type: string
  description: string
  hermeticInsight: string
  topicIds: string[]
}

interface HermeticSummary {
  dominantLaw: string
  overallVibration: string
  rhythmPhase: string
  instinctInsight: string
}

interface TreeData {
  nodes: TreeNode[]
  edges: TreeEdge[]
  evolutionEvents: EvolutionEvent[]
  hermeticSummary: HermeticSummary
  stats: {
    totalTopics: number
    activeTopics: number
    totalConnections: number
    avgImportance: number
  }
}

export default function LivingTreePage() {
  const [treeData, setTreeData] = useState<TreeData | null>(null)
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [conversationId] = useState('demo_conversation') // TODO: Get from URL or context

  // Fetch tree data
  const fetchTreeData = useCallback(async () => {
    try {
      const response = await fetch(`/api/living-tree?conversationId=${conversationId}&limit=50`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      setTreeData(data)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch Living Tree data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch tree data')
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  // Initial fetch + polling
  useEffect(() => {
    fetchTreeData()
    const interval = setInterval(fetchTreeData, 5000) // Poll every 5 seconds
    return () => clearInterval(interval)
  }, [fetchTreeData])

  // Canvas rendering with force simulation
  useEffect(() => {
    if (!treeData || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const width = canvas.width = canvas.offsetWidth * window.devicePixelRatio
    const height = canvas.height = canvas.offsetHeight * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    // Prepare nodes and edges for D3
    const nodes: TreeNode[] = treeData.nodes.map(n => ({
      ...n,
      x: width / 2 + Math.random() * 100 - 50,
      y: height / 2 + Math.random() * 100 - 50,
      vx: 0,
      vy: 0,
    }))

    const edges: TreeEdge[] = treeData.edges.map(e => ({
      ...e,
      source: typeof e.source === 'number' ? nodes.find(n => n.id === e.source)! : e.source,
      target: typeof e.target === 'number' ? nodes.find(n => n.id === e.target)! : e.target,
    }))

    // Simple force simulation (manual implementation)
    let animationId: number

    const simulate = () => {
      ctx.clearRect(0, 0, width / window.devicePixelRatio, height / window.devicePixelRatio)

      // Apply forces
      nodes.forEach(node => {
        // Center force
        const centerX = width / window.devicePixelRatio / 2
        const centerY = height / window.devicePixelRatio / 2
        node.vx = (node.vx || 0) + (centerX - (node.x || centerX)) * 0.001
        node.vy = (node.vy || 0) + (centerY - (node.y || centerY)) * 0.001

        // Repulsion between nodes
        nodes.forEach(other => {
          if (node === other) return
          const dx = (other.x || 0) - (node.x || 0)
          const dy = (other.y || 0) - (node.y || 0)
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const force = (getNodeRadius(node) + getNodeRadius(other) + 20) / dist
          node.vx = (node.vx || 0) - (dx / dist) * force * 0.1
          node.vy = (node.vy || 0) - (dy / dist) * force * 0.1
        })

        // Edge spring force
        edges.forEach(edge => {
          const source = edge.source as TreeNode
          const target = edge.target as TreeNode
          if (node !== source && node !== target) return

          const other = node === source ? target : source
          const dx = (other.x || 0) - (node.x || 0)
          const dy = (other.y || 0) - (node.y || 0)
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const idealDist = 80
          const force = (dist - idealDist) * edge.strength * 0.01

          if (node === source) {
            node.vx = (node.vx || 0) + (dx / dist) * force
            node.vy = (node.vy || 0) + (dy / dist) * force
          } else {
            node.vx = (node.vx || 0) - (dx / dist) * force
            node.vy = (node.vy || 0) - (dy / dist) * force
          }
        })

        // Apply velocity with damping
        node.vx = (node.vx || 0) * 0.9
        node.vy = (node.vy || 0) * 0.9
        node.x = (node.x || 0) + (node.vx || 0)
        node.y = (node.y || 0) + (node.vy || 0)

        // Boundary constraints
        const radius = getNodeRadius(node)
        const maxWidth = width / window.devicePixelRatio
        const maxHeight = height / window.devicePixelRatio
        node.x = Math.max(radius, Math.min(maxWidth - radius, node.x))
        node.y = Math.max(radius, Math.min(maxHeight - radius, node.y))
      })

      // Draw edges
      edges.forEach(edge => {
        const source = edge.source as TreeNode
        const target = edge.target as TreeNode
        if (!source.x || !source.y || !target.x || !target.y) return

        ctx.strokeStyle = getEdgeColor(edge)
        ctx.lineWidth = edge.strength * 3
        ctx.globalAlpha = 0.4
        ctx.beginPath()
        ctx.moveTo(source.x, source.y)
        ctx.lineTo(target.x, target.y)
        ctx.stroke()
        ctx.globalAlpha = 1.0
      })

      // Draw nodes
      nodes.forEach(node => {
        if (!node.x || !node.y) return

        const radius = getNodeRadius(node)
        const color = getNodeColor(node)

        // Node circle
        ctx.fillStyle = color
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()

        // Node label
        ctx.fillStyle = '#ffffff'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const label = node.name.length > 15 ? node.name.substring(0, 15) + '...' : node.name
        ctx.fillText(label, node.x, node.y)
      })

      animationId = requestAnimationFrame(simulate)
    }

    simulate()

    return () => cancelAnimationFrame(animationId)
  }, [treeData])

  // Helper functions
  const getNodeRadius = (node: TreeNode): number => {
    return 20 + node.importance * 30
  }

  const getNodeColor = (node: TreeNode): string => {
    const vibrationColors = {
      high: '#ef4444',
      medium: '#a855f7',
      low: '#3b82f6',
    }
    return vibrationColors[node.vibrationLevel] || '#6b7280'
  }

  const getEdgeColor = (edge: TreeEdge): string => {
    const typeColors: Record<string, string> = {
      causal: '#22c55e',
      similar: '#3b82f6',
      opposite: '#ef4444',
      evolves_to: '#a855f7',
      merges_with: '#f59e0b',
      splits_from: '#ec4899',
    }
    return typeColors[edge.relationshipType] || '#9ca3af'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-sm font-mono text-relic-slate">Loading Living Tree...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-sm font-mono text-red-600 mb-2">Error loading Living Tree</div>
          <div className="text-xs font-mono text-relic-slate">{error}</div>
          <button
            onClick={fetchTreeData}
            className="mt-4 px-4 py-2 text-xs font-mono border border-relic-mist hover:bg-relic-ghost transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!treeData) {
    return null
  }

  return (
    <div className="min-h-screen bg-white p-6">
      {/* Hermetic Summary Bar */}
      <div className="mb-4 p-3 border border-relic-mist">
        <div className="flex items-center gap-6 text-xs font-mono">
          <span className="text-relic-silver uppercase tracking-wider">▸ Hermetic Summary</span>
          <span className="text-relic-void">
            Dominant Law: <strong>{treeData.hermeticSummary.dominantLaw}</strong>
          </span>
          <span className="text-relic-void">
            Vibration: <strong>{treeData.hermeticSummary.overallVibration}</strong>
          </span>
          <span className="text-relic-void">
            Rhythm: <strong>{treeData.hermeticSummary.rhythmPhase}</strong>
          </span>
          <div className="ml-auto flex items-center gap-4">
            <span className="text-relic-slate">
              {treeData.stats.activeTopics}/{treeData.stats.totalTopics} topics
            </span>
            <span className="text-relic-slate">{treeData.stats.totalConnections} connections</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-6">
        {/* Force-Directed Tree Canvas */}
        <div className="border border-relic-mist relative">
          <canvas
            ref={canvasRef}
            className="w-full h-[800px] cursor-pointer"
            style={{ width: '100%', height: '800px' }}
          />

          {/* Instructions overlay */}
          {treeData.nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-xs font-mono text-relic-silver">
                <div className="mb-2">No topics yet</div>
                <div>Topics will appear after using Legend Mode</div>
              </div>
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Selected Node Details */}
          <AnimatePresence mode="wait">
            {selectedNode ? (
              <motion.div
                key="selected"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="border border-relic-mist p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-mono font-semibold text-sm text-relic-void">
                    {selectedNode.name}
                  </h3>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-xs text-relic-silver hover:text-relic-void"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-relic-slate mb-3">{selectedNode.description}</p>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-relic-silver">Importance:</span>
                    <span className="text-relic-void font-mono">
                      {(selectedNode.importance * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-relic-silver">Vibration:</span>
                    <span className="text-relic-void font-mono capitalize">
                      {selectedNode.vibrationLevel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-relic-silver">Polarity:</span>
                    <span className="text-relic-void font-mono capitalize">
                      {selectedNode.polarity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-relic-silver">Rhythm:</span>
                    <span className="text-relic-void font-mono capitalize">
                      {selectedNode.rhythmPhase}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-relic-silver">Status:</span>
                    <span className="text-relic-void font-mono">
                      {selectedNode.isActive ? 'Active' : 'Dissolved'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="border border-relic-mist p-3 text-center text-xs text-relic-silver"
              >
                Click a node to view details
              </motion.div>
            )}
          </AnimatePresence>

          {/* Evolution Timeline */}
          <div className="border border-relic-mist p-3 max-h-96 overflow-y-auto">
            <h3 className="text-xs font-mono uppercase tracking-wider text-relic-slate mb-3">
              ▸ Evolution Timeline
            </h3>
            {treeData.evolutionEvents.length > 0 ? (
              <div className="space-y-2">
                {treeData.evolutionEvents.map((event, idx) => (
                  <div key={idx} className="pb-2 border-b border-relic-mist last:border-0">
                    <div className="text-xs text-relic-void mb-1">
                      <span className="font-mono uppercase text-[10px] text-relic-silver mr-2">
                        {event.type}
                      </span>
                      {event.description}
                    </div>
                    {event.hermeticInsight && (
                      <div className="text-[10px] text-relic-slate italic pl-2 border-l border-purple-200">
                        {event.hermeticInsight}
                      </div>
                    )}
                    <div className="text-[9px] text-relic-silver mt-1">
                      {new Date(event.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-relic-silver text-center py-4">No events yet</div>
            )}
          </div>

          {/* Instinct Insight */}
          {treeData.hermeticSummary.instinctInsight && (
            <div className="border border-purple-200 bg-purple-50/30 p-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-purple-700 mb-2">
                ▸ Instinct Insight
              </h3>
              <p className="text-xs text-relic-void leading-relaxed">
                {treeData.hermeticSummary.instinctInsight}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 p-4 border border-relic-mist">
        <h3 className="text-xs font-mono uppercase tracking-wider text-relic-slate mb-3">
          ▸ Hermetic Legend
        </h3>
        <div className="grid grid-cols-4 gap-4 text-xs">
          {/* Vibration (Node Color) */}
          <div>
            <div className="text-relic-silver mb-2 font-mono">Vibration (Color)</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-relic-void">High Energy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-relic-void">Medium Energy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-relic-void">Low Energy</span>
              </div>
            </div>
          </div>

          {/* Relationships (Edge Color) */}
          <div>
            <div className="text-relic-silver mb-2 font-mono">Relationships</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-green-500" />
                <span className="text-relic-void">Causal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-blue-500" />
                <span className="text-relic-void">Similar</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-red-500" />
                <span className="text-relic-void">Opposite</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-purple-500" />
                <span className="text-relic-void">Evolution</span>
              </div>
            </div>
          </div>

          {/* Node Size */}
          <div>
            <div className="text-relic-silver mb-2 font-mono">Node Size</div>
            <div className="text-relic-void">Larger = More Important</div>
            <div className="text-[10px] text-relic-slate mt-1">
              Size based on importance score (0-100%)
            </div>
          </div>

          {/* Hermetic Laws */}
          <div>
            <div className="text-relic-silver mb-2 font-mono">7 Hermetic Laws</div>
            <div className="text-[10px] text-relic-void space-y-0.5">
              <div>1. Mentalism - Mind creates reality</div>
              <div>2. Correspondence - As above, so below</div>
              <div>3. Vibration - Everything moves</div>
              <div>4. Polarity - Everything has opposites</div>
              <div>5. Rhythm - Everything flows in cycles</div>
              <div>6. Cause & Effect - Causal chains</div>
              <div>7. Gender - Creative/Receptive aspects</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
