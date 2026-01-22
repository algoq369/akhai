'use client'

/**
 * useForceLayout - D3 force simulation hook for AkhAI Mind Map
 *
 * Features:
 * - Clustered layout by category
 * - Hierarchical arrangement (important nodes in center)
 * - Performance optimizations
 * - Cluster boundary data for visualization
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { Node, Edge } from '@xyflow/react'
import * as d3 from 'd3'

interface ForceNode extends d3.SimulationNodeDatum {
  id: string
  x: number
  y: number
  category?: string
  queryCount?: number
}

interface ClusterCenter {
  x: number
  y: number
  category: string
  color: string
  nodeCount: number
}

interface UseForceLayoutOptions {
  strength?: number
  distance?: number
  collisionRadius?: number
  alphaDecay?: number
  velocityDecay?: number
  centerX?: number
  centerY?: number
  enableClustering?: boolean
}

// Cluster colors based on AI computational layers
const CLUSTER_COLORS: Record<string, string> = {
  technology: '#3B82F6',   // Blue - implementation
  business: '#10B981',     // Green - evaluation
  finance: '#F59E0B',      // Amber - exploration
  science: '#0284C7',      // Sky - research
  psychology: '#8B5CF6',   // Violet - reasoning
  health: '#DB2777',       // Pink - generation
  education: '#7C3AED',    // Purple - learning
  social: '#C026D3',       // Fuchsia - interaction
  environment: '#059669',  // Emerald - sustainability
  infrastructure: '#0EA5E9', // Cyan - systems
  engineering: '#D97706',  // Orange - building
  regulation: '#EC4899',   // Pink - constraints
  other: '#6B7280',        // Gray - misc
}

export function useForceLayout(
  nodes: Node[],
  edges: Edge[],
  setNodes: (updater: (nodes: Node[]) => Node[]) => void,
  options: UseForceLayoutOptions = {}
) {
  const {
    strength = -400,
    distance = 160,
    collisionRadius = 90,
    alphaDecay = 0.04,
    velocityDecay = 0.4,
    centerX = 500,
    centerY = 400,
    enableClustering = true
  } = options

  const simulationRef = useRef<d3.Simulation<ForceNode, undefined> | null>(null)
  const forceNodesRef = useRef<ForceNode[]>([])
  const nodeIdsRef = useRef<string>('')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [clusterCenters, setClusterCenters] = useState<ClusterCenter[]>([])
  const [clusterNodes, setClusterNodes] = useState<Map<string, ForceNode[]>>(new Map())

  useEffect(() => {
    if (nodes.length === 0) return

    const currentNodeIds = nodes.map(n => n.id).sort().join(',')

    if (currentNodeIds === nodeIdsRef.current && simulationRef.current) {
      return
    }
    nodeIdsRef.current = currentNodeIds

    // Stop existing simulation
    if (simulationRef.current) {
      simulationRef.current.stop()
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Group nodes by category for clustering
    const categoryGroups = new Map<string, Node[]>()
    nodes.forEach(node => {
      const category = (node.data as any)?.category?.toLowerCase() || 'other'
      if (!categoryGroups.has(category)) {
        categoryGroups.set(category, [])
      }
      categoryGroups.get(category)!.push(node)
    })

    // Calculate cluster centers arranged in a circle
    const clusterCenterMap = new Map<string, { x: number; y: number }>()
    const clusterCentersList: ClusterCenter[] = []
    const numClusters = categoryGroups.size
    const clusterRadius = Math.min(centerX, centerY) * 0.6 // 60% of available space

    let clusterIndex = 0
    categoryGroups.forEach((categoryNodes, category) => {
      // Arrange clusters in a circle around center
      const angle = (clusterIndex / numClusters) * 2 * Math.PI - Math.PI / 2 // Start from top
      const cx = centerX + Math.cos(angle) * clusterRadius
      const cy = centerY + Math.sin(angle) * clusterRadius

      clusterCenterMap.set(category, { x: cx, y: cy })
      clusterCentersList.push({
        x: cx,
        y: cy,
        category,
        color: CLUSTER_COLORS[category] || CLUSTER_COLORS.other,
        nodeCount: categoryNodes.length
      })
      clusterIndex++
    })

    setClusterCenters(clusterCentersList)

    // Create force nodes with initial positions near their cluster center
    const forceNodes: ForceNode[] = nodes.map((node, i) => {
      const category = (node.data as any)?.category?.toLowerCase() || 'other'
      const clusterCenter = clusterCenterMap.get(category) || { x: centerX, y: centerY }
      const queryCount = (node.data as any)?.queryCount || 1

      // Spread nodes around cluster center with some randomness
      const spreadRadius = 80
      const angle = Math.random() * 2 * Math.PI
      const dist = Math.random() * spreadRadius

      return {
        id: node.id,
        x: clusterCenter.x + Math.cos(angle) * dist,
        y: clusterCenter.y + Math.sin(angle) * dist,
        category,
        queryCount
      }
    })
    forceNodesRef.current = forceNodes

    // Track nodes by cluster for hull visualization
    const nodesByCluster = new Map<string, ForceNode[]>()
    forceNodes.forEach(node => {
      const cat = node.category || 'other'
      if (!nodesByCluster.has(cat)) {
        nodesByCluster.set(cat, [])
      }
      nodesByCluster.get(cat)!.push(node)
    })

    // Create force links
    const forceLinks = edges
      .filter(edge =>
        forceNodes.some(n => n.id === edge.source) &&
        forceNodes.some(n => n.id === edge.target)
      )
      .map((edge) => ({
        source: edge.source,
        target: edge.target,
      }))

    // Create simulation with clustering forces
    const simulation = d3.forceSimulation<ForceNode>(forceNodes)
      .force('charge', d3.forceManyBody<ForceNode>()
        .strength(strength)
        .distanceMax(400)
      )
      .force(
        'link',
        d3.forceLink(forceLinks)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .id((d: any) => d.id)
          .distance(distance)
          .strength(0.2)
      )
      .force('collision', d3.forceCollide<ForceNode>().radius(collisionRadius))
      .alphaDecay(alphaDecay)
      .velocityDecay(velocityDecay)

    // Add clustering forces if enabled
    if (enableClustering) {
      // Pull nodes toward their cluster center
      simulation
        .force('clusterX', d3.forceX<ForceNode>((d) => {
          const center = clusterCenterMap.get(d.category || 'other')
          return center?.x || centerX
        }).strength(0.15))
        .force('clusterY', d3.forceY<ForceNode>((d) => {
          const center = clusterCenterMap.get(d.category || 'other')
          return center?.y || centerY
        }).strength(0.15))

      // Radial force - important nodes (high query count) closer to their cluster center
      simulation.force('radial', d3.forceRadial<ForceNode>(
        (d) => {
          // Nodes with more queries are pulled closer to center
          const importance = Math.min(d.queryCount || 1, 20)
          return 150 - (importance * 5) // Range: 50-150px from cluster center
        },
        centerX,
        centerY
      ).strength(0.03))
    } else {
      // Simple center force without clustering
      simulation.force('center', d3.forceCenter(centerX, centerY))
    }

    // Throttled update
    let lastUpdateTime = 0
    const MIN_UPDATE_INTERVAL = 60

    simulation.on('tick', () => {
      const now = performance.now()
      if (now - lastUpdateTime < MIN_UPDATE_INTERVAL) {
        return
      }
      lastUpdateTime = now

      const positions = new Map<string, { x: number; y: number }>()
      forceNodes.forEach((node) => {
        positions.set(node.id, { x: node.x, y: node.y })
      })

      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          const pos = positions.get(node.id)
          if (pos) {
            return {
              ...node,
              position: { x: pos.x, y: pos.y },
            }
          }
          return node
        })
      )

      // Update cluster nodes for hull visualization
      setClusterNodes(new Map(nodesByCluster))
    })

    simulationRef.current = simulation

    // Auto-stop after 3 seconds max (longer for clustering)
    timeoutRef.current = setTimeout(() => {
      if (simulationRef.current) {
        simulationRef.current.stop()
      }
    }, 3000)

    return () => {
      simulation.stop()
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [nodes.length, edges.length, strength, distance, collisionRadius, alphaDecay, velocityDecay, centerX, centerY, enableClustering, setNodes])

  const stopSimulation = useCallback(() => {
    if (simulationRef.current) {
      simulationRef.current.stop()
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  const restartSimulation = useCallback(() => {
    if (simulationRef.current && forceNodesRef.current.length > 0) {
      nodeIdsRef.current = ''
      simulationRef.current.alpha(0.5).restart()

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        if (simulationRef.current) {
          simulationRef.current.stop()
        }
      }, 3000)
    }
  }, [])

  const reheatSimulation = useCallback(() => {
    if (simulationRef.current) {
      simulationRef.current.alpha(0.2).restart()
    }
  }, [])

  return {
    stopSimulation,
    restartSimulation,
    reheatSimulation,
    isRunning: simulationRef.current ? simulationRef.current.alpha() > 0 : false,
    clusterCenters,
    clusterNodes,
    clusterColors: CLUSTER_COLORS
  }
}

export default useForceLayout
