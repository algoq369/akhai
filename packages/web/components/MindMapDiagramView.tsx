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
  propTopicLinks?: TopicLink[]
}

interface Discussion {
  id: string
  text: string
  fullText: string
  methodology: string | null
  createdAt: number
  conversationId: string | null
}

interface TopicLink {
  source: string
  target: string
  type: string
  strength: number
}

interface ClusterData {
  category: string
  nodes: Node[]
  cx: number
  cy: number
  rx: number
  ry: number
}

interface LayoutNode {
  id: string
  x: number
  y: number
  isShared: boolean
  sharedCategories: string[]
  queryCount: number
  connections: number
}

// Golden angle in radians
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

// Cluster palette — muted, professional
const CLUSTER_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {}
const PALETTE = [
  { fill: 'rgba(99,102,241,0.35)', stroke: 'rgba(99,102,241,0.35)', text: '#6366f1' },
  { fill: 'rgba(16,185,129,0.35)', stroke: 'rgba(16,185,129,0.35)', text: '#10b981' },
  { fill: 'rgba(245,158,11,0.35)', stroke: 'rgba(245,158,11,0.35)', text: '#f59e0b' },
  { fill: 'rgba(239,68,68,0.35)', stroke: 'rgba(239,68,68,0.35)', text: '#ef4444' },
  { fill: 'rgba(139,92,246,0.35)', stroke: 'rgba(139,92,246,0.35)', text: '#8b5cf6' },
  { fill: 'rgba(6,182,212,0.35)', stroke: 'rgba(6,182,212,0.35)', text: '#06b6d4' },
  { fill: 'rgba(236,72,153,0.35)', stroke: 'rgba(236,72,153,0.35)', text: '#ec4899' },
  { fill: 'rgba(107,114,128,0.35)', stroke: 'rgba(107,114,128,0.35)', text: '#6b7280' },
]

function getClusterColor(category: string, idx: number) {
  if (!CLUSTER_COLORS[category]) {
    CLUSTER_COLORS[category] = PALETTE[idx % PALETTE.length]
  }
  return CLUSTER_COLORS[category]
}

function formatTimeAgo(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000)
  const diff = now - timestamp
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(timestamp * 1000).toLocaleDateString()
}

export default function MindMapDiagramView({
  userId,
  nodes: propNodes,
  searchQuery = '',
  onNodeSelect,
  onNodeAction,
  propTopicLinks
}: MindMapDiagramViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Core state
  const [allNodes, setAllNodes] = useState<Node[]>([])
  const [dims, setDims] = useState({ width: 800, height: 600 })

  // Pan/Zoom
  const [zoom, setZoom] = useState(0.85)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const hasInitialized = useRef(false)

  // Node interaction
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({})
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<Node | null>(null)
  const [analyseOpen, setAnalyseOpen] = useState(false)
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null)
  const [hoveredPreview, setHoveredPreview] = useState<{ id: string; x: number; y: number; name: string } | null>(null)
  const [hoveredCluster, setHoveredCluster] = useState<string | null>(null)


  // Discussion panel
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [loadingDiscussions, setLoadingDiscussions] = useState(false)
  const [discussionError, setDiscussionError] = useState<string | null>(null)
  const [discussionTotal, setDiscussionTotal] = useState(0)

  // Topic-to-topic correlation links
  const [topicLinks, setTopicLinks] = useState<TopicLink[]>([])

  // Living graph
  const [isLive, setIsLive] = useState(false)
  const [pulsingClusters, setPulsingClusters] = useState<Set<string>>(new Set())
  const prevNodeCountRef = useRef(0)

  // Search
  const [localSearch, setLocalSearch] = useState('')

  // Fetch nodes
  useEffect(() => {
    if (propNodes && propNodes.length > 0) {
      setAllNodes(propNodes)
      if (propTopicLinks && propTopicLinks.length > 0) {
        setTopicLinks(propTopicLinks)
      } else {
        const fetchLinks = async () => {
          try {
            const res = await fetch('/api/mindmap/data')
            if (res.ok) {
              const data = await res.json()
              setTopicLinks(data.links || [])
            }
          } catch (error) {
            console.error('Failed to fetch links:', error)
          }
        }
        fetchLinks()
      }
      return
    }

    const fetchData = async () => {
      try {
        const res = await fetch('/api/mindmap/data')
        if (!res.ok) return
        const data = await res.json()
        setAllNodes(data.nodes || [])
        setTopicLinks(data.links || [])
      } catch (error) {
        console.error('Failed to fetch:', error)
      }
    }
    fetchData()
  }, [userId, propNodes, propTopicLinks])

  // Living graph — poll every 30s
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/mindmap/data')
        if (!res.ok) return
        const data = await res.json()
        const newNodes: Node[] = data.nodes || []
        setTopicLinks(data.links || [])

        if (prevNodeCountRef.current > 0 && newNodes.length > prevNodeCountRef.current) {
          // Find new nodes and pulse their clusters
          const oldIds = new Set(allNodes.map(n => n.id))
          const newCats = new Set<string>()
          newNodes.forEach(n => {
            if (!oldIds.has(n.id)) newCats.add(n.category || 'other')
          })
          if (newCats.size > 0) {
            setPulsingClusters(newCats)
            setTimeout(() => setPulsingClusters(new Set()), 2000)
          }
          setAllNodes(newNodes)
        }
        prevNodeCountRef.current = newNodes.length
        setIsLive(true)
      } catch {
        setIsLive(false)
      }
    }

    // Don't poll if using prop nodes
    if (propNodes && propNodes.length > 0) return
    prevNodeCountRef.current = allNodes.length

    const interval = setInterval(poll, 30000)
    return () => clearInterval(interval)
  }, [propNodes, allNodes])

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDims({ width: entry.contentRect.width, height: entry.contentRect.height })
      }
    })
    obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  // Native wheel listener for zoom (passive: false)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      setZoom(z => Math.min(2.5, Math.max(0.3, z - e.deltaY * 0.001)))
    }
    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [])

  const displayNodes = propNodes || allNodes
  const effectiveSearch = searchQuery || localSearch

  // Filter nodes by search
  const filteredNodes = useMemo(() => {
    if (!effectiveSearch) return displayNodes
    const q = effectiveSearch.toLowerCase()
    return displayNodes.filter(n =>
      n.name.toLowerCase().includes(q) ||
      n.description?.toLowerCase().includes(q) ||
      n.category?.toLowerCase().includes(q)
    )
  }, [displayNodes, effectiveSearch])

  // Build connection counts per node
  const connectionCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    topicLinks.forEach(link => {
      counts[link.source] = (counts[link.source] || 0) + 1
      counts[link.target] = (counts[link.target] || 0) + 1
    })
    return counts
  }, [topicLinks])

  // Detect shared nodes: connected to 2+ different categories
  const sharedNodeInfo = useMemo(() => {
    const nodeCatMap: Record<string, string> = {}
    filteredNodes.forEach(n => { nodeCatMap[n.id] = n.category || 'other' })

    const shared: Record<string, string[]> = {}
    filteredNodes.forEach(n => {
      const connectedCats = new Set<string>()
      connectedCats.add(n.category || 'other')
      topicLinks.forEach(link => {
        if (link.source === n.id && nodeCatMap[link.target]) connectedCats.add(nodeCatMap[link.target])
        if (link.target === n.id && nodeCatMap[link.source]) connectedCats.add(nodeCatMap[link.source])
      })
      if (connectedCats.size >= 3) {
        shared[n.id] = Array.from(connectedCats)
      }
    })
    return shared
  }, [filteredNodes, topicLinks])

  // CLUSPLOT layout — golden-angle ellipse clusters
  const { clusters, layoutNodes } = useMemo(() => {
    const cx = dims.width / 2
    const cy = dims.height / 2

    // Group by category
    const catGroups = new Map<string, Node[]>()
    filteredNodes.forEach(n => {
      const cat = n.category || 'other'
      if (!catGroups.has(cat)) catGroups.set(cat, [])
      catGroups.get(cat)!.push(n)
    })

    // Sort categories by total query count
    const sortedCats = Array.from(catGroups.entries())
      .sort(([, a], [, b]) => {
        const sumA = a.reduce((s, n) => s + (n.queryCount || 0), 0)
        const sumB = b.reduce((s, n) => s + (n.queryCount || 0), 0)
        return sumB - sumA
      })

    const catCount = sortedCats.length
    if (catCount === 0) return { clusters: [], layoutNodes: {} as Record<string, LayoutNode> }

    // Position cluster centers using golden angle
    const clusterRadius = Math.min(dims.width, dims.height) * (catCount >= 4 ? 0.35 : 0.28)
    const clusterList: ClusterData[] = []
    const nodeLayout: Record<string, LayoutNode> = {}

    sortedCats.forEach(([cat, nodes], catIdx) => {
      // Golden angle placement for cluster centers
      const angle = catIdx * GOLDEN_ANGLE
      const dist = catCount === 1 ? 0 : (220 + catCount * 40) * (0.6 + (catIdx / 80) * 0.55)
      const clusterCx = cx + Math.cos(angle) * dist
      const clusterCy = cy + Math.sin(angle) * dist

      // Sort nodes by queryCount
      const sorted = [...nodes].sort((a, b) => (b.queryCount || 0) - (a.queryCount || 0))

      // Place nodes within cluster using golden angle
      let maxDx = 0, maxDy = 0
      sorted.forEach((node, nIdx) => {
        const nAngle = nIdx * GOLDEN_ANGLE * 2.4
        const nDist = 30 + Math.sqrt(nIdx) * 28
        const nx = clusterCx + Math.cos(nAngle) * nDist
        const ny = clusterCy + Math.sin(nAngle) * nDist * 0.75

        maxDx = Math.max(maxDx, Math.abs(nx - clusterCx))
        maxDy = Math.max(maxDy, Math.abs(ny - clusterCy))

        const isShared = !!sharedNodeInfo[node.id]
        nodeLayout[node.id] = {
          id: node.id,
          x: nx,
          y: ny,
          isShared,
          sharedCategories: sharedNodeInfo[node.id] || [cat],
          queryCount: node.queryCount || 0,
          connections: connectionCounts[node.id] || 0,
        }
      })

      clusterList.push({
        category: cat,
        nodes: sorted,
        cx: clusterCx,
        cy: clusterCy,
        rx: Math.max(maxDx + 50, 80),
        ry: Math.max(maxDy + 40, 60),
      })
    })

    // Reposition shared nodes to midpoint between their cluster centers
    Object.entries(sharedNodeInfo).forEach(([nodeId, cats]) => {
      if (!nodeLayout[nodeId]) return
      const relevantClusters = clusterList.filter(c => cats.includes(c.category))
      if (relevantClusters.length < 2) return

      const midX = relevantClusters.reduce((s, c) => s + c.cx, 0) / relevantClusters.length
      const midY = relevantClusters.reduce((s, c) => s + c.cy, 0) / relevantClusters.length
      nodeLayout[nodeId].x = midX + (Math.random() - 0.5) * 30
      nodeLayout[nodeId].y = midY + (Math.random() - 0.5) * 20
    })

    return { clusters: clusterList, layoutNodes: nodeLayout }
  }, [filteredNodes, dims, sharedNodeInfo, connectionCounts])

  // Auto-center on first render
  useEffect(() => {
    if (hasInitialized.current || dims.width <= 100) return
    if (Object.keys(layoutNodes).length === 0) return
    hasInitialized.current = true
    const z = 0.85
    setPan({
      x: (dims.width / 2) * (1 - z),
      y: (dims.height / 2) * (1 - z),
    })
  }, [dims, layoutNodes])

  // Get node position with user drag override
  const getPos = useCallback((id: string): { x: number; y: number } | null => {
    if (nodePositions[id]) return nodePositions[id]
    const ln = layoutNodes[id]
    return ln ? { x: ln.x, y: ln.y } : null
  }, [nodePositions, layoutNodes])

  // Visible cross-cluster links
  const visibleLinks = useMemo(() => {
    const nodeIds = new Set(Object.keys(layoutNodes))
    return topicLinks.filter(link => nodeIds.has(link.source) && nodeIds.has(link.target))
  }, [topicLinks, layoutNodes])

  // Connected topics for hover highlight
  const connectedTopicIds = useMemo(() => {
    if (!hoveredNode) return new Set<string>()
    const connected = new Set<string>()
    visibleLinks.forEach(link => {
      if (link.source === hoveredNode) connected.add(link.target)
      if (link.target === hoveredNode) connected.add(link.source)
    })
    return connected
  }, [hoveredNode, visibleLinks])

  // Force-directed layout for expanded cluster drill-down
  const forceLayoutNodes = useMemo(() => {
    if (!expandedCluster) return { positions: [] as { id: string; x: number; y: number }[], links: [] as TopicLink[], sortedNodes: [] as Node[] }
    const cl = clusters.find(c => c.category === expandedCluster)
    if (!cl) return { positions: [], links: [], sortedNodes: [] }

    const sorted = [...cl.nodes].sort((a, b) => (b.queryCount || 0) - (a.queryCount || 0))
    const n = sorted.length
    const vw = Math.min(1200, Math.max(800, n * 6))
    const vh = Math.min(900, Math.max(600, n * 4.5))
    const ctrX = vw / 2, ctrY = vh / 2

    // Initialize positions using golden angle spiral
    const pos = sorted.map((_node, i) => {
      const angle = i * GOLDEN_ANGLE
      const dist = 30 + Math.sqrt(i) * 25
      return { id: sorted[i].id, x: ctrX + Math.cos(angle) * dist, y: ctrY + Math.sin(angle) * dist }
    })

    // Intra-cluster links
    const idSet = new Set(sorted.map(nd => nd.id))
    const intLinks = topicLinks.filter(l => idSet.has(l.source) && idSet.has(l.target))
    const posMap = new Map(pos.map(p => [p.id, p]))

    // Run force iterations
    const minDist = n > 100 ? 40 : n > 50 ? 32 : 45
    const iterations = n > 100 ? 150 : 100
    for (let iter = 0; iter < iterations; iter++) {
      // Repulsion between all pairs
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const dx = pos[i].x - pos[j].x, dy = pos[i].y - pos[j].y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          if (dist < minDist) {
            const f = (minDist - dist) / dist * 0.5
            pos[i].x += dx * f; pos[i].y += dy * f
            pos[j].x -= dx * f; pos[j].y -= dy * f
          }
        }
      }
      // Attraction between connected nodes
      intLinks.forEach(link => {
        const ps = posMap.get(link.source), pt = posMap.get(link.target)
        if (!ps || !pt) return
        const dx = pt.x - ps.x, dy = pt.y - ps.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const f = (dist - 80) / dist * 0.05
        ps.x += dx * f; ps.y += dy * f
        pt.x -= dx * f; pt.y -= dy * f
      })
      // Center gravity
      pos.forEach(p => {
        p.x += (ctrX - p.x) * 0.01
        p.y += (ctrY - p.y) * 0.01
      })
    }

    // Clamp to viewport with padding
    const pad = 40
    pos.forEach(p => {
      p.x = Math.max(pad, Math.min(vw - pad, p.x))
      p.y = Math.max(pad, Math.min(vh - pad, p.y))
    })

    return { positions: pos, links: intLinks, sortedNodes: sorted, vw, vh }
  }, [expandedCluster, clusters, topicLinks])

  // Fetch discussions
  const fetchDiscussions = useCallback(async (topicId: string, offset = 0) => {
    setLoadingDiscussions(true)
    setDiscussionError(null)
    try {
      const res = await fetch(`/api/mindmap/topics/${topicId}/queries?limit=10&offset=${offset}`)
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setDiscussions(offset > 0 ? [...discussions, ...data.discussions] : data.discussions || [])
      setDiscussionTotal(data.total || 0)
    } catch {
      setDiscussionError('Failed to load discussions')
    } finally {
      setLoadingDiscussions(false)
    }
  }, [discussions])

  // Event handlers — pan/zoom/drag
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as Element).closest('svg') === svgRef.current && !(e.target as Element).closest('g[data-node]')) {
      setIsPanning(true)
      panStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: panStartRef.current.panX + (e.clientX - panStartRef.current.x),
        y: panStartRef.current.panY + (e.clientY - panStartRef.current.y)
      })
    } else if (draggedNode && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left - pan.x) / zoom
      const y = (e.clientY - rect.top - pan.y) / zoom
      setNodePositions(prev => ({ ...prev, [draggedNode]: { x, y } }))
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
    setDraggedNode(null)
  }

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    setDraggedNode(nodeId)
  }

  const handleNodeClick = (e: React.MouseEvent, node: Node) => {
    e.stopPropagation()
    if (draggedNode) return

    if (selectedTopic?.id === node.id) {
      closeAnalyse()
      return
    }

    setSelectedTopic(node)
    setAnalyseOpen(true)
    fetchDiscussions(node.id)
    onNodeSelect?.({ id: node.id, name: node.name, category: node.category || undefined })
  }

  const closeAnalyse = () => {
    setSelectedTopic(null)
    setAnalyseOpen(false)
    setDiscussions([])
    setDiscussionError(null)
    onNodeSelect?.(null)
  }

  // Zoom controls
  const zoomIn = () => setZoom(z => Math.min(2.5, z + 0.2))
  const zoomOut = () => setZoom(z => Math.max(0.3, z - 0.2))
  const fitView = () => {
    setZoom(0.85)
    setPan({
      x: (dims.width / 2) * (1 - 0.85),
      y: (dims.height / 2) * (1 - 0.85)
    })
    setNodePositions({})
  }

  // Stats
  const totalTopics = filteredNodes.length
  const totalClusters = clusters.length
  const sharedCount = Object.keys(sharedNodeInfo).length

  // Node size from queryCount
  const getNodeRadius = (qc: number) => Math.max(4, Math.min(16, 3 + Math.sqrt(qc) * 3))

  // Build analyse modal data
  const analyseData = useMemo(() => {
    if (!selectedTopic) return null
    const node = layoutNodes[selectedTopic.id]
    if (!node) return null

    const conns = visibleLinks.filter(l => l.source === selectedTopic.id || l.target === selectedTopic.id)
    const connectedNodes = conns.map(l => {
      const otherId = l.source === selectedTopic.id ? l.target : l.source
      const otherNode = filteredNodes.find(n => n.id === otherId)
      return otherNode ? { id: otherId, name: otherNode.name, category: otherNode.category || 'other', strength: l.strength } : null
    }).filter(Boolean) as { id: string; name: string; category: string; strength: number }[]

    // Cluster breakdown
    const clusterBreakdown: Record<string, number> = {}
    clusterBreakdown[selectedTopic.category || 'other'] = (clusterBreakdown[selectedTopic.category || 'other'] || 0)
    connectedNodes.forEach(cn => {
      clusterBreakdown[cn.category] = (clusterBreakdown[cn.category] || 0) + 1
    })

    const internalConns = connectedNodes.filter(cn => cn.category === (selectedTopic.category || 'other')).length
    const crossConns = connectedNodes.length - internalConns

    return {
      queryCount: selectedTopic.queryCount || 0,
      connections: connectedNodes.length,
      clusters: Object.keys(clusterBreakdown).length,
      clusterBreakdown,
      internalConns,
      crossConns,
      topConnections: connectedNodes.sort((a, b) => b.strength - a.strength).slice(0, 5),
      bridges: connectedNodes
        .filter(cn => cn.category !== (selectedTopic.category || 'other'))
        .map(cn => cn.category)
        .filter((v, i, a) => a.indexOf(v) === i),
    }
  }, [selectedTopic, layoutNodes, visibleLinks, filteredNodes])

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[#fafbfc] dark:bg-[#0a0a0a]">
      {/* Header toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-[#111] border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
            knowledge graph
          </span>
          <span className="text-sm text-neutral-400 dark:text-neutral-500 font-mono tracking-wide">
            {totalTopics} topics · {totalClusters} clusters
            {sharedCount > 0 && ` · ${sharedCount} shared`}
          </span>
          {isLive && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              live
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="filter..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-32 pl-7 pr-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-slate-300 text-slate-700 dark:text-slate-300"
              style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
            />
          </div>

          {/* Zoom controls */}
          <button onClick={zoomOut} className="px-2 py-1 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
            -
          </button>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={zoomIn} className="px-2 py-1 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
            +
          </button>
          <button onClick={fitView} className="px-2 py-1 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
            fit
          </button>
        </div>
      </div>

      {/* Main graph area */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden"
        style={{ cursor: isPanning ? 'grabbing' : draggedNode ? 'grabbing' : 'grab' }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Dot grid background */}
        <div
          className="absolute inset-0 pointer-events-none dark:opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle, #e2e8f0 0.7px, transparent 0.7px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* SVG Canvas */}
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.08" />
            </filter>
            <filter id="pulse-glow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Radial gradients for clusters */}
            {clusters.map((cluster, idx) => {
              const color = getClusterColor(cluster.category, idx)
              return (
                <radialGradient key={`grad-${cluster.category}`} id={`cluster-grad-${idx}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={color.text} stopOpacity={0.18} />
                  <stop offset="60%" stopColor={color.text} stopOpacity={0.08} />
                  <stop offset="100%" stopColor={color.text} stopOpacity={0.02} />
                </radialGradient>
              )
            })}
          </defs>

          {/* Transform group for pan/zoom */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>

            {/* Cluster ellipses */}
            {clusters.map((cluster, idx) => {
              const color = getClusterColor(cluster.category, idx)
              const isPulsing = pulsingClusters.has(cluster.category)

              return (
                <g key={`cluster-${cluster.category}`} onClick={(e) => { e.stopPropagation(); setExpandedCluster(cluster.category) }} onMouseEnter={() => setHoveredCluster(cluster.category)} onMouseLeave={() => setHoveredCluster(null)} style={{ cursor: 'pointer' }}>
                  <ellipse
                    cx={cluster.cx}
                    cy={cluster.cy}
                    rx={cluster.rx}
                    ry={cluster.ry}
                    fill={`url(#cluster-grad-${idx})`}
                    stroke={color.stroke}
                    strokeWidth={isPulsing ? 2.5 : 2}
                    strokeDasharray={isPulsing ? 'none' : '6 4'}
                    strokeOpacity={isPulsing ? 0.5 : 0.4}
                    opacity={isPulsing ? 1 : 0.85}
                    filter={isPulsing ? 'url(#pulse-glow)' : undefined}
                    className="transition-all duration-500"
                  />
                  <text x={cluster.cx} y={cluster.cy - cluster.ry * 0.7} textAnchor="middle" fill={color.text} fontSize={12} fontWeight={800} fontFamily="'JetBrains Mono', ui-monospace, monospace" opacity={0.85} className="select-none pointer-events-none">
                    {cluster.category}
                  </text>
                  <text x={cluster.cx} y={cluster.cy - cluster.ry * 0.7 + 14} textAnchor="middle" fill="#94a3b8" fontSize={9} fontFamily="'JetBrains Mono', ui-monospace, monospace" className="select-none pointer-events-none">
                    {cluster.nodes.length} topics
                  </text>
                  {cluster.nodes.slice(0, 5).map((pn, pi) => {
                    const a = (pi / 5) * Math.PI * 2 - Math.PI / 2, px = cluster.cx + Math.cos(a) * cluster.ry * 0.35, py = cluster.cy + Math.sin(a) * cluster.ry * 0.35
                    return <circle key={`pv-${pn.id}`} cx={px} cy={py} r={8} fill={color.text + '70'} stroke={color.text + '40'} strokeWidth={1} onMouseEnter={() => setHoveredPreview({ id: pn.id, x: px, y: py, name: pn.name })} onMouseLeave={() => setHoveredPreview(null)} onClick={(e) => { e.stopPropagation(); setExpandedCluster(cluster.category) }} style={{ cursor: 'pointer' }} />
                  })}
                </g>
              )
            })}

            {/* Cross-cluster connection lines — node-to-node bezier curves */}
            <g className="connections" style={{ pointerEvents: 'none' }}>
              {visibleLinks.map((link, idx) => {
                const sourcePos = getPos(link.source)
                const targetPos = getPos(link.target)
                if (!sourcePos || !targetPos) return null

                const sourceNode = filteredNodes.find(n => n.id === link.source)
                const isDirect = hoveredNode === link.source || hoveredNode === link.target
                const isSecondDeg = !isDirect && (connectedTopicIds.has(link.source) || connectedTopicIds.has(link.target))
                const linkOpacity = isDirect ? 0.5 : isSecondDeg ? 0.25 : 0
                const midX = (sourcePos.x + targetPos.x) / 2
                const midY = (sourcePos.y + targetPos.y) / 2 - 20
                const srcCatIdx = clusters.findIndex(c => c.category === (sourceNode?.category || 'other'))
                const srcColor = getClusterColor(sourceNode?.category || 'other', srcCatIdx >= 0 ? srcCatIdx : 0).text

                return (
                  <path
                    key={`link-${idx}`}
                    d={`M ${sourcePos.x} ${sourcePos.y} Q ${midX} ${midY} ${targetPos.x} ${targetPos.y}`}
                    fill="none"
                    stroke={srcColor}
                    strokeWidth={isDirect ? 2 : 1.5}
                    opacity={linkOpacity}
                    className="transition-all duration-200"
                  />
                )
              })}
            </g>

            {/* Nodes — hidden in overview, visible only in expanded cluster */}
            {false && filteredNodes.map((node) => {
              const pos = getPos(node.id)
              if (!pos) return null

              const ln = layoutNodes[node.id]
              const isShared = ln?.isShared || false
              const isHovered = hoveredNode === node.id
              const isSelected = selectedTopic?.id === node.id
              const isConnected = connectedTopicIds.has(node.id)
              const r = getNodeRadius(node.queryCount || 0)

              const catIdx = clusters.findIndex(c => c.category === (node.category || 'other'))
              const color = getClusterColor(node.category || 'other', catIdx >= 0 ? catIdx : 0)

              return (
                <g
                  key={node.id}
                  data-node={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                  onClick={(e) => handleNodeClick(e, node)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Node shape: diamond for shared, circle for regular */}
                  {isShared ? (
                    <rect
                      x={-r}
                      y={-r}
                      width={r * 2}
                      height={r * 2}
                      rx={2}
                      transform={`rotate(45)`}
                      fill={isSelected ? color.fill : color.text + 'B0'}
                      stroke={isSelected ? color.text : isConnected ? '#94a3b8' : color.text + '80'}
                      strokeWidth={isSelected || isHovered ? 2 : 1}
                      className="transition-all duration-150"
                      filter={isHovered ? 'url(#glow)' : undefined}
                    />
                  ) : (
                    <circle
                      r={r}
                      fill={isSelected ? color.fill : color.text + '90'}
                      stroke={isSelected ? color.text : isConnected ? '#94a3b8' : color.text + '4D'}
                      strokeWidth={isSelected || isHovered ? 2 : 1}
                      className="transition-all duration-150"
                      filter={isHovered ? 'url(#glow)' : undefined}
                    />
                  )}

                  {/* Node label + query count: shown in hover card only */}
                </g>
              )
            })}

            {/* Hover card — foreignObject with interconnection summary */}
            {hoveredNode && !analyseOpen && (() => {
              const node = displayNodes.find(n => n.id === hoveredNode)
              if (!node) return null
              const pos = getPos(hoveredNode)
              if (!pos) return null
              const ln = layoutNodes[hoveredNode]
              if (!ln) return null

              const conns = visibleLinks.filter(l => l.source === hoveredNode || l.target === hoveredNode)
              const connCats: Record<string, number> = {}
              conns.forEach(l => {
                const otherId = l.source === hoveredNode ? l.target : l.source
                const otherNode = filteredNodes.find(n => n.id === otherId)
                const cat = otherNode?.category || 'other'
                connCats[cat] = (connCats[cat] || 0) + 1
              })

              const connNames = conns.slice(0, 3).map(l => { const oid = l.source === hoveredNode ? l.target : l.source; return filteredNodes.find(n => n.id === oid)?.name }).filter(Boolean)
              const cardW = 220
              const cardH = 96 + Object.keys(connCats).length * 16

              return (
                <foreignObject
                  x={pos.x + 20}
                  y={pos.y - cardH / 2}
                  width={cardW}
                  height={cardH}
                  style={{ pointerEvents: 'none', overflow: 'visible' }}
                >
                  <div
                    style={{
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      padding: '10px 12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: 10,
                      color: '#334155',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 3 }}>{node.name}</div>
                    <div style={{ color: '#94a3b8', marginBottom: 3 }}>
                      {node.queryCount || 0} queries · {conns.length} connections · {node.category || 'other'}
                    </div>
                    <div style={{ color: '#64748b', fontSize: 9, marginBottom: 5, lineHeight: '1.3' }}>
                      {node.description ? node.description.slice(0, 60) + (node.description.length > 60 ? '...' : '') : connNames.length > 0 ? `Related to: ${connNames.join(', ')}` : ''}
                    </div>
                    {Object.entries(connCats).map(([cat, count]) => {
                      const ci = clusters.findIndex(c => c.category === cat)
                      const cc = getClusterColor(cat, ci >= 0 ? ci : 0)
                      return (
                        <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: cc.text, display: 'inline-block' }} />
                          <span>{cat}</span>
                          <span style={{ color: '#cbd5e1', marginLeft: 'auto' }}>{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </foreignObject>
              )
            })()}
            {hoveredPreview && (() => {
              const pNode = filteredNodes.find(n => n.id === hoveredPreview.id); if (!pNode) return null
              const pConns = topicLinks.filter(l => l.source === hoveredPreview.id || l.target === hoveredPreview.id)
              const pConnNames = pConns.slice(0, 3).map(l => filteredNodes.find(n => n.id === (l.source === hoveredPreview.id ? l.target : l.source))?.name).filter(Boolean)
              const pCats: Record<string, string> = {}
              pConns.forEach(l => { const oid = l.source === hoveredPreview.id ? l.target : l.source; const on = filteredNodes.find(n => n.id === oid); if (on) { const ci = clusters.findIndex(c => c.category === (on.category || 'other')); pCats[on.category || 'other'] = getClusterColor(on.category || 'other', ci >= 0 ? ci : 0).text } })
              return (<>
                {pConns.map((l, i) => { const oid = l.source === hoveredPreview.id ? l.target : l.source; const op = getPos(oid); if (!op) return null; return <line key={`pl-${i}`} x1={hoveredPreview.x} y1={hoveredPreview.y} x2={op.x} y2={op.y} stroke={(pCats[filteredNodes.find(n => n.id === oid)?.category || 'other'] || '#94a3b8') + '66'} strokeWidth={1.5} className="transition-all duration-200" /> })}
                <foreignObject x={hoveredPreview.x + 16} y={hoveredPreview.y - 55} width={200} height={130} style={{ pointerEvents: 'none', overflow: 'visible' }}>
                  <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 10, color: '#334155' }}>
                    <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 3 }}>{pNode.name}</div>
                    <div style={{ color: '#94a3b8', marginBottom: 3 }}>{pNode.queryCount || 0} queries · {pConns.length} connections</div>
                    {Object.keys(pCats).length > 0 && <div style={{ marginBottom: 3 }}>Correlates: {Object.entries(pCats).map(([cat, col]) => <span key={cat} style={{ marginRight: 6 }}><span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: col, marginRight: 2 }} />{cat}</span>)}</div>}
                    {pConnNames.length > 0 && <div style={{ color: '#64748b', fontSize: 9 }}>Related: {pConnNames.join(', ')}</div>}
                  </div>
                </foreignObject>
              </>)
            })()}
          </g>
        </svg>

        {/* Connection count indicator */}
        {visibleLinks.length > 0 && (
          <div className="absolute bottom-14 left-4 text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
            {visibleLinks.length} connections
          </div>
        )}
      </div>

      {/* Expanded cluster detail view — force-directed layout */}
      {expandedCluster && (() => {
        const cl = clusters.find(c => c.category === expandedCluster)
        if (!cl) return null
        const cc = getClusterColor(cl.category, clusters.indexOf(cl))
        const { positions: fPos, links: fLinks, sortedNodes: fNodes, vw: svgW, vh: svgH } = forceLayoutNodes
        if (fPos.length === 0) return null
        const posMap = new Map(fPos.map(p => [p.id, p]))
        const topN = fNodes.length > 80 ? 10 : fNodes.length > 30 ? 20 : fNodes.length
        const topLabelIds = new Set(fNodes.slice(0, topN).map(n => n.id))
        const connectedIds = hoveredNode ? new Set(fLinks.filter(l => l.source === hoveredNode || l.target === hoveredNode).flatMap(l => [l.source, l.target])) : null
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setExpandedCluster(null)}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)' }} />
            <div onClick={e => e.stopPropagation()} className="bg-white dark:bg-[#18181b]" style={{ position: 'relative', width: '80%', height: '80%', borderRadius: 16, boxShadow: '0 24px 48px rgba(0,0,0,0.12)', overflow: 'hidden', fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
              <div className="border-b border-slate-200 dark:border-slate-700" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 24px' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: cc.text, display: 'inline-block' }} />
                <span className="text-slate-800 dark:text-slate-100" style={{ fontWeight: 700, fontSize: 15 }}>{expandedCluster}</span>
                <span style={{ color: '#94a3b8', fontSize: 11 }}>{cl.nodes.length} topics · {fLinks.length} connections</span>
                <button onClick={() => setExpandedCluster(null)} style={{ marginLeft: 'auto', fontSize: 16, border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}>&#x2715;</button>
              </div>
              <div style={{ width: '100%', height: 'calc(100% - 52px)', overflow: 'auto', minWidth: 600, minHeight: 400 }}>
                <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
                  {fLinks.map((link, li) => {
                    const ps = posMap.get(link.source), pt = posMap.get(link.target)
                    if (!ps || !pt) return null
                    const mx = (ps.x + pt.x) / 2, my = (ps.y + pt.y) / 2 - 15
                    const isHi = hoveredNode === link.source || hoveredNode === link.target
                    return <path key={`fl-${li}`} d={`M ${ps.x} ${ps.y} Q ${mx} ${my} ${pt.x} ${pt.y}`} fill="none" stroke={cc.text} strokeWidth={isHi ? 2 : 1.5} opacity={isHi ? 0.5 : 0.06} className="transition-all duration-200" />
                  })}
                  {fNodes.map((node) => {
                    const p = posMap.get(node.id)
                    if (!p) return null
                    const qc = node.queryCount || 0
                    const nr = Math.max(8, Math.min(16, 6 + Math.sqrt(qc) * 2.5))
                    const isHov = hoveredNode === node.id
                    const isConnected = connectedIds ? connectedIds.has(node.id) : false
                    const nodeOpacity = connectedIds ? (isHov ? 1 : isConnected ? 0.6 : 0.15) : 1
                    const showLabel = topLabelIds.has(node.id) || isHov || isConnected
                    const labelText = node.name.length > 18 ? node.name.slice(0, 18) + '\u2026' : node.name
                    return (
                      <g key={node.id} transform={`translate(${p.x}, ${p.y})`} opacity={nodeOpacity} onMouseEnter={() => setHoveredNode(node.id)} onMouseLeave={() => setHoveredNode(null)} onClick={(e) => { e.stopPropagation(); onNodeAction?.(`Tell me more about ${node.name}`, node.id); setExpandedCluster(null) }} style={{ cursor: 'pointer' }}>
                        <circle r={12} fill="transparent" />
                        <circle r={nr} fill={cc.text + '90'} stroke={isHov ? cc.text : cc.text + '4D'} strokeWidth={isHov ? 2 : 1} />
                        {showLabel && <text y={nr + 14} textAnchor="middle" fill={isHov ? cc.text : '#94a3b8'} fontSize={isHov ? 11 : 9} fontWeight={isHov ? 600 : 400}>{isHov ? node.name : labelText}</text>}
                        {isHov && <text y={-nr - 8} textAnchor="middle" fill="#94a3b8" fontSize={8}>{qc} queries · {connectionCounts[node.id] || 0} connections</text>}
                      </g>
                    )
                  })}
                </svg>
              </div>
            </div>
          </div>
        )
      })()}


      {/* Analyse popup (modal overlay) */}
      <AnimatePresence mode="wait">
        {analyseOpen && selectedTopic && analyseData && (
          <motion.div
            key={selectedTopic.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute inset-x-0 bottom-10 mx-auto max-w-lg z-50"
          >
            <div className="bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">{selectedTopic.name}</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">{selectedTopic.category || 'other'}</p>
                </div>
                <button onClick={closeAnalyse} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Metrics row */}
              <div className="grid grid-cols-3 gap-px bg-slate-100">
                <div className="bg-white px-4 py-3 text-center">
                  <div className="text-lg font-bold text-slate-800">{analyseData.queryCount}</div>
                  <div className="text-[9px] text-slate-400 uppercase tracking-wider">queries</div>
                </div>
                <div className="bg-white px-4 py-3 text-center">
                  <div className="text-lg font-bold text-slate-800">{analyseData.connections}</div>
                  <div className="text-[9px] text-slate-400 uppercase tracking-wider">connections</div>
                </div>
                <div className="bg-white px-4 py-3 text-center">
                  <div className="text-lg font-bold text-slate-800">{analyseData.clusters}</div>
                  <div className="text-[9px] text-slate-400 uppercase tracking-wider">clusters</div>
                </div>
              </div>

              {/* Connection map */}
              <div className="px-5 py-3 border-t border-slate-100">
                <div className="flex items-center gap-4 text-[10px] mb-2">
                  <span className="text-slate-400">internal: <span className="text-slate-700 font-medium">{analyseData.internalConns}</span></span>
                  <span className="text-slate-400">cross-cluster: <span className="text-slate-700 font-medium">{analyseData.crossConns}</span></span>
                </div>

                {/* Top connections */}
                {analyseData.topConnections.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    <div className="text-[9px] text-slate-400 uppercase tracking-wider">top connections</div>
                    {analyseData.topConnections.map(conn => {
                      const ci = clusters.findIndex(c => c.category === conn.category)
                      const cc = getClusterColor(conn.category, ci >= 0 ? ci : 0)
                      return (
                        <div key={conn.id} className="flex items-center gap-2 text-[10px]">
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: cc.text }} className="inline-block flex-shrink-0" />
                          <span className="text-slate-600 truncate">{conn.name}</span>
                          <span className="text-slate-300 ml-auto flex-shrink-0">{conn.category}</span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Bridges */}
                {analyseData.bridges.length > 0 && (
                  <div className="text-[10px] text-slate-400">
                    bridges to: {analyseData.bridges.map((b, i) => {
                      const ci = clusters.findIndex(c => c.category === b)
                      const cc = getClusterColor(b, ci >= 0 ? ci : 0)
                      return (
                        <span key={b}>
                          {i > 0 && ', '}
                          <span style={{ color: cc.text }}>{b}</span>
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Discussions */}
              {loadingDiscussions && discussions.length === 0 ? (
                <div className="flex items-center justify-center py-4 border-t border-slate-100">
                  <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
                </div>
              ) : discussions.length > 0 ? (
                <div className="px-5 py-2 border-t border-slate-100 max-h-[120px] overflow-y-auto">
                  {discussions.slice(0, 5).map((d) => (
                    <button
                      key={d.id}
                      onClick={() => {
                        const url = d.conversationId ? `/query/${d.conversationId}` : `/query/${d.id}`
                        window.open(url, '_blank')
                      }}
                      className="block w-full text-left py-1.5 text-[10px] text-slate-600 hover:text-slate-900 truncate"
                    >
                      {d.text}
                    </button>
                  ))}
                </div>
              ) : null}

              {/* Action buttons */}
              <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 border-t border-slate-100">
                <button
                  onClick={closeAnalyse}
                  className="flex-1 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors text-center"
                >
                  &#x25C7; analyse
                </button>
                <button
                  onClick={() => {
                    onNodeAction?.(`Tell me more about ${selectedTopic.name}`, selectedTopic.id)
                    closeAnalyse()
                  }}
                  className="flex-1 px-3 py-2 text-xs font-medium text-white bg-slate-700 hover:bg-slate-800 rounded-lg transition-colors text-center"
                >
                  &#x2192; continue
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom bar */}
      <div className="px-4 py-1.5 bg-white dark:bg-[#111] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-500" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
        <div className="flex items-center gap-4">
          <span>drag to pan</span>
          <span>scroll to zoom</span>
          <span>click node to analyse</span>
          <span>&#x25C7; = shared topic</span>
        </div>
        <span>akhai clusplot</span>
      </div>
    </div>
  )
}
