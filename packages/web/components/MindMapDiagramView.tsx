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

// Minimal monochrome palette - elegant slate grays
function getCategoryStyle(category: string): { accent: string; bg: string } {
  // All categories use unified monochrome style
  return { accent: '#64748b', bg: '#f8fafc' }
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
  onNodeAction
}: MindMapDiagramViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Core state
  const [allNodes, setAllNodes] = useState<Node[]>([])
  const [dims, setDims] = useState({ width: 800, height: 600 })

  // Pan/Zoom (transform-based) — start zoomed out to see full graph
  const [zoom, setZoom] = useState(0.75)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const hasInitialized = useRef(false)

  // Auto-center graph on first meaningful render
  useEffect(() => {
    if (hasInitialized.current || dims.width <= 100) return
    if (allNodes.length === 0 && (!propNodes || propNodes.length === 0)) return
    hasInitialized.current = true
    // Center: at zoom z, position (cx,cy) maps to (cx*z + panX, cy*z + panY)
    // We want it at (w/2, h/2), so panX = w/2 - cx*z = w/2*(1-z)
    const panX = (dims.width / 2) * (1 - 0.75)
    const panY = (dims.height / 2) * (1 - 0.75)
    setPan({ x: panX, y: panY })
  }, [dims, allNodes, propNodes])

  // Node interaction
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({})
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<Node | null>(null)

  // Discussion panel
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [loadingDiscussions, setLoadingDiscussions] = useState(false)
  const [discussionError, setDiscussionError] = useState<string | null>(null)
  const [discussionTotal, setDiscussionTotal] = useState(0)

  // Hover discussion cache (avoid re-fetching)
  const [hoverCache, setHoverCache] = useState<Record<string, Discussion[]>>({})
  const [hoverLoading, setHoverLoading] = useState<string | null>(null)

  // Topic-to-topic correlation links
  const [topicLinks, setTopicLinks] = useState<TopicLink[]>([])

  // Expanded panel visibility
  const [expandedPanelOpen, setExpandedPanelOpen] = useState(false)

  // Search
  const [localSearch, setLocalSearch] = useState('')

  // Fetch nodes
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
        setTopicLinks(data.links || [])
      } catch (error) {
        console.error('Failed to fetch:', error)
      }
    }
    fetchData()
  }, [userId, propNodes])

  // Resize handler (only updates dims, not zoom/pan)
  useEffect(() => {
    const updateDims = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDims({ width: rect.width, height: rect.height })
      }
    }
    updateDims()
    window.addEventListener('resize', updateDims)
    return () => window.removeEventListener('resize', updateDims)
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

  const MAX_VISIBLE_PER_CATEGORY = 3
  const MAX_CATEGORIES = 6

  // TreePosition interface for tree hierarchy
  interface TreePosition {
    x: number
    y: number
    level: 0 | 1 | 2  // 0=root, 1=category, 2=topic
    parentId: string | null
    childCount?: number
  }

  // Build visible groups: top N topics per category + overflow count
  const visibleGroups = useMemo(() => {
    const groups = new Map<string, { visible: Node[]; overflow: number; total: number }>()
    filteredNodes.forEach(n => {
      const cat = n.category || 'other'
      if (!groups.has(cat)) groups.set(cat, { visible: [], overflow: 0, total: 0 })
      groups.get(cat)!.total++
      groups.get(cat)!.visible.push(n)
    })
    // Sort each category by queryCount desc, keep top N
    groups.forEach((group) => {
      group.visible.sort((a, b) => (b.queryCount || 0) - (a.queryCount || 0))
      if (group.visible.length > MAX_VISIBLE_PER_CATEGORY) {
        group.overflow = group.visible.length - MAX_VISIBLE_PER_CATEGORY
        group.visible = group.visible.slice(0, MAX_VISIBLE_PER_CATEGORY)
      }
    })
    return groups
  }, [filteredNodes])

  // Calculate positions (tree hierarchy layout: ROOT → CATEGORIES → TOPICS)
  const positions = useMemo((): Record<string, TreePosition> => {
    const cx = dims.width / 2
    const result: Record<string, TreePosition> = {}

    // Sort categories by total queryCount, limit to MAX_CATEGORIES
    const sortedCategories = Array.from(visibleGroups.entries())
      .map(([cat, group]) => ({
        cat,
        totalQueries: group.visible.reduce((sum, n) => sum + (n.queryCount || 0), 0),
        group
      }))
      .filter(c => c.group.visible.length > 0)  // Skip empty categories
      .sort((a, b) => b.totalQueries - a.totalQueries)
      .slice(0, MAX_CATEGORIES)

    // LEVEL 0: Root node at top center
    const rootY = 80
    result['root'] = { x: cx, y: rootY, level: 0, parentId: null }

    if (sortedCategories.length === 0) {
      return result
    }

    // LEVEL 1: Category nodes in horizontal arc below root
    const categoryY = 200
    const catCount = sortedCategories.length
    const categorySpread = Math.min(dims.width - 200, catCount * 150)
    const categoryStartX = cx - categorySpread / 2

    sortedCategories.forEach((catData, idx) => {
      const catX = catCount === 1
        ? cx
        : categoryStartX + (idx / Math.max(catCount - 1, 1)) * categorySpread

      result[`cat-${catData.cat}`] = {
        x: catX,
        y: categoryY,
        level: 1,
        parentId: 'root',
        childCount: Math.min(catData.group.visible.length, MAX_VISIBLE_PER_CATEGORY)
      }

      // LEVEL 2: Topic nodes in VERTICAL COLUMN below each category
      const topics = catData.group.visible.slice(0, MAX_VISIBLE_PER_CATEGORY)
      const topicStartY = 320
      const topicSpacingY = 60

      topics.forEach((node, tIdx) => {
        // Slight horizontal offset for visual interest (zigzag)
        const xOffset = (tIdx % 2 === 0 ? -15 : 15) * (tIdx > 0 ? 1 : 0)

        result[node.id] = {
          x: catX + xOffset,
          y: topicStartY + tIdx * topicSpacingY,  // 320, 380, 440
          level: 2,
          parentId: `cat-${catData.cat}`
        }
      })
    })

    return result
  }, [visibleGroups, dims])

  // Get position with user override - returns TreePosition | null
  const getPos = useCallback((id: string): TreePosition | null => {
    if (nodePositions[id]) {
      // Merge user override with existing TreePosition data
      const base = positions[id]
      return base ? { ...base, x: nodePositions[id].x, y: nodePositions[id].y } : null
    }
    return positions[id] || null
  }, [nodePositions, positions])

  // Category groups for rendering (uses visibleGroups)
  const categoryGroups = useMemo(() => {
    const groups = new Map<string, Node[]>()
    visibleGroups.forEach((group, cat) => {
      groups.set(cat, group.visible)
    })
    return groups
  }, [visibleGroups])

  // Only show links between currently visible topics
  const visibleLinks = useMemo(() => {
    const visibleTopicIds = new Set(
      Object.entries(positions)
        .filter(([, pos]) => pos.level === 2)
        .map(([id]) => id)
    )
    return topicLinks.filter(link =>
      visibleTopicIds.has(link.source) && visibleTopicIds.has(link.target)
    )
  }, [topicLinks, positions])

  // Topics connected to the currently hovered topic
  const connectedTopicIds = useMemo(() => {
    if (!hoveredNode) return new Set<string>()
    const connected = new Set<string>()
    visibleLinks.forEach(link => {
      if (link.source === hoveredNode) connected.add(link.target)
      if (link.target === hoveredNode) connected.add(link.source)
    })
    return connected
  }, [hoveredNode, visibleLinks])

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

  // Fetch hover discussions (for tooltip, limited to 5)
  const fetchHoverDiscussions = useCallback(async (topicId: string) => {
    if (hoverCache[topicId]) return  // Already cached
    setHoverLoading(topicId)
    try {
      const res = await fetch(`/api/mindmap/topics/${topicId}/queries?limit=5`)
      if (!res.ok) return
      const data = await res.json()
      setHoverCache(prev => ({ ...prev, [topicId]: data.discussions || [] }))
    } catch (err) {
      console.error('Hover fetch failed:', err)
    } finally {
      setHoverLoading(null)
    }
  }, [hoverCache])

  // Event handlers
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
    if (draggedNode) return // Don't select if just finished dragging

    // Toggle off if clicking same node
    if (selectedTopic?.id === node.id) {
      closePanel()
      return
    }

    setSelectedTopic(node)
    setExpandedPanelOpen(true)
    fetchDiscussions(node.id)
    onNodeSelect?.({ id: node.id, name: node.name, category: node.category || undefined })
  }

  const closePanel = () => {
    setSelectedTopic(null)
    setExpandedPanelOpen(false)
    setDiscussions([])
    setDiscussionError(null)
    onNodeSelect?.(null)
  }

  // Zoom controls
  const zoomIn = () => setZoom(z => Math.min(2.5, z + 0.2))
  const zoomOut = () => setZoom(z => Math.max(0.3, z - 0.2))
  const fitView = () => {
    setZoom(0.75)
    setPan({
      x: (dims.width / 2) * (1 - 0.75),
      y: (dims.height / 2) * (1 - 0.75)
    })
    setNodePositions({})
  }

  // Stats - tree-based counts
  const displayedTopics = Object.values(positions).filter(p => p.level === 2).length
  const displayedCategories = Object.values(positions).filter(p => p.level === 1).length
  const totalTopics = filteredNodes.length

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[#fafbfc]">
      {/* Header toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-700">knowledge graph</span>
          <span className="text-sm text-neutral-400 font-mono tracking-wide">
            {displayedTopics} topics · {displayedCategories} categories
          </span>
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
              className="w-32 pl-7 pr-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-300 text-slate-700"
            />
          </div>

          {/* Zoom controls */}
          <button onClick={zoomOut} className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded">
            -
          </button>
          <span className="text-xs font-mono text-slate-500 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={zoomIn} className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded">
            +
          </button>
          <button onClick={fitView} className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded">
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
        {/* Fixed dot grid background (doesn't pan/zoom) */}
        <div
          className="absolute inset-0 pointer-events-none"
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
            {/* Glow filter */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Shadow filter */}
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.08" />
            </filter>
          </defs>

          {/* Transform group for pan/zoom */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Connection Lines - render FIRST for z-order (behind nodes) */}
            <g className="connections" style={{ pointerEvents: 'none' }}>
              {/* Root to Categories - subtle gray */}
              {Array.from(visibleGroups.keys()).slice(0, MAX_CATEGORIES).map(cat => {
                const rootPos = getPos('root')
                const catPos = getPos(`cat-${cat}`)
                if (!rootPos || !catPos) return null

                const isHovered = hoveredNode === `cat-${cat}`
                const midY = (rootPos.y + catPos.y) / 2

                return (
                  <path
                    key={`root-to-${cat}`}
                    d={`M ${rootPos.x} ${rootPos.y + 42}
                        C ${rootPos.x} ${midY},
                          ${catPos.x} ${midY},
                          ${catPos.x} ${catPos.y - 32}`}
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth={isHovered ? 1.5 : 1}
                    strokeDasharray="4 4"
                    opacity={isHovered ? 0.6 : 0.3}
                    className="transition-all duration-200"
                  />
                )
              })}

              {/* Categories to Topics - lighter gray */}
              {Array.from(visibleGroups.entries()).slice(0, MAX_CATEGORIES).map(([cat, { visible }]) => {
                const catPos = getPos(`cat-${cat}`)
                if (!catPos) return null

                return visible.slice(0, MAX_VISIBLE_PER_CATEGORY).map(topic => {
                  const topicPos = getPos(topic.id)
                  if (!topicPos || topicPos.level !== 2) return null

                  const isActive = hoveredNode === topic.id || selectedTopic?.id === topic.id
                  const controlOffset = 20

                  return (
                    <path
                      key={`${cat}-to-${topic.id}`}
                      d={`M ${catPos.x} ${catPos.y + 32}
                          C ${catPos.x} ${catPos.y + 32 + controlOffset},
                            ${topicPos.x} ${topicPos.y - 16 - controlOffset},
                            ${topicPos.x} ${topicPos.y - 16}`}
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth={isActive ? 1.2 : 0.8}
                      strokeDasharray="3 3"
                      opacity={isActive ? 0.5 : 0.25}
                      className="transition-all duration-200"
                    />
                  )
                })
              })}
            </g>

            {/* Topic-to-Topic Correlation Lines - single muted color */}
            <g className="correlation-links" style={{ pointerEvents: 'none' }}>
              {visibleLinks.map((link, idx) => {
                const sourcePos = getPos(link.source)
                const targetPos = getPos(link.target)
                if (!sourcePos || !targetPos) return null
                if (sourcePos.x === targetPos.x && sourcePos.y === targetPos.y) return null

                const midX = (sourcePos.x + targetPos.x) / 2
                const midY = Math.min(sourcePos.y, targetPos.y) - 40

                const isHighlighted = hoveredNode === link.source || hoveredNode === link.target

                return (
                  <path
                    key={`link-${idx}`}
                    d={`M ${sourcePos.x} ${sourcePos.y}
                        Q ${midX} ${midY} ${targetPos.x} ${targetPos.y}`}
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth={isHighlighted ? 1.5 : 0.5}
                    strokeDasharray={isHighlighted ? "none" : "2 2"}
                    opacity={isHighlighted ? 0.5 : 0.15}
                    className="transition-all duration-200"
                  />
                )
              })}
            </g>

            {/* Root node - Minimal dark circle */}
            {(() => {
              const rootPos = getPos('root')
              if (!rootPos) return null
              const topicCount = Object.values(positions).filter(p => p.level === 2).length

              return (
                <g data-node="root" transform={`translate(${rootPos.x}, ${rootPos.y})`}>
                  {/* Simple circle - no animation */}
                  <circle
                    r={42}
                    fill="#1e293b"
                    stroke="#334155"
                    strokeWidth={1}
                  />

                  {/* AKHAI text */}
                  <text
                    y={-4}
                    textAnchor="middle"
                    fill="#f1f5f9"
                    fontSize={13}
                    fontWeight={600}
                    fontFamily="ui-monospace, monospace"
                    letterSpacing={2}
                    className="select-none pointer-events-none"
                  >
                    AKHAI
                  </text>

                  {/* Topic count */}
                  <text
                    y={14}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize={9}
                    fontFamily="ui-monospace, monospace"
                    className="select-none pointer-events-none"
                  >
                    {topicCount} topics
                  </text>
                </g>
              )
            })()}

            {/* Category nodes - Simple circles, no emoji */}
            {Array.from(visibleGroups.entries()).slice(0, MAX_CATEGORIES).map(([cat, { visible }]) => {
              const pos = getPos(`cat-${cat}`)
              if (!pos || pos.level !== 1) return null

              const isHovered = hoveredNode === `cat-${cat}`
              const topicCount = Math.min(visible.length, MAX_VISIBLE_PER_CATEGORY)

              return (
                <g
                  key={`cat-${cat}`}
                  data-node={`cat-${cat}`}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onMouseEnter={() => setHoveredNode(`cat-${cat}`)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onMouseDown={(e) => handleNodeMouseDown(e, `cat-${cat}`)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Simple circle */}
                  <circle
                    r={32}
                    fill={isHovered ? '#f1f5f9' : '#ffffff'}
                    stroke={isHovered ? '#64748b' : '#e2e8f0'}
                    strokeWidth={isHovered ? 1.5 : 1}
                    className="transition-all duration-150"
                  />

                  {/* Category initial letter */}
                  <text
                    y={-2}
                    textAnchor="middle"
                    fill="#475569"
                    fontSize={14}
                    fontWeight={600}
                    fontFamily="ui-monospace, monospace"
                    className="select-none pointer-events-none"
                  >
                    {cat.charAt(0).toUpperCase()}
                  </text>

                  {/* Category name */}
                  <text
                    y={12}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize={8}
                    fontFamily="system-ui, sans-serif"
                    className="select-none pointer-events-none"
                  >
                    {cat.length > 8 ? cat.slice(0, 7) + '…' : cat}
                  </text>

                  {/* Count - subtle, no badge */}
                  <text
                    y={24}
                    textAnchor="middle"
                    fill="#cbd5e1"
                    fontSize={8}
                    className="select-none pointer-events-none"
                  >
                    {topicCount}
                  </text>
                </g>
              )
            })}

            {/* Topic nodes - Clean rounded rectangles */}
            {Array.from(visibleGroups.entries()).slice(0, MAX_CATEGORIES).map(([cat, { visible }]) => {
              return visible.slice(0, MAX_VISIBLE_PER_CATEGORY).map((node) => {
                const pos = getPos(node.id)
                if (!pos || pos.level !== 2) return null  // Critical level check

                const isHovered = hoveredNode === node.id
                const isSelected = selectedTopic?.id === node.id
                const isConnected = connectedTopicIds.has(node.id)

                return (
                  <g
                    key={node.id}
                    data-node={node.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    onMouseEnter={() => { setHoveredNode(node.id); fetchHoverDiscussions(node.id) }}
                    onMouseLeave={() => setHoveredNode(null)}
                    onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                    onClick={(e) => handleNodeClick(e, node)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Rounded rectangle instead of ellipse */}
                    <rect
                      x={-52}
                      y={-16}
                      width={104}
                      height={32}
                      rx={6}
                      ry={6}
                      fill={isSelected ? '#f8fafc' : '#ffffff'}
                      stroke={isSelected ? '#475569' : isConnected ? '#94a3b8' : '#e2e8f0'}
                      strokeWidth={isSelected ? 1.5 : 1}
                      className="transition-all duration-150"
                    />

                    {/* Topic name - centered, clean */}
                    <text
                      y={4}
                      textAnchor="middle"
                      fill={isHovered || isSelected ? '#1e293b' : '#475569'}
                      fontSize={10}
                      fontWeight={isSelected ? 500 : 400}
                      fontFamily="system-ui, sans-serif"
                      className="select-none pointer-events-none"
                    >
                      {node.name.length > 14 ? node.name.slice(0, 13) + '…' : node.name}
                    </text>
                  </g>
                )
              })
            })}

            {/* Hover Tooltip */}
            {hoveredNode && !selectedTopic && (() => {
              const node = displayNodes.find(n => n.id === hoveredNode)
              if (!node) return null
              const pos = getPos(hoveredNode)
              if (!pos) return null
              const cached = hoverCache[hoveredNode]
              const isLoading = hoverLoading === hoveredNode
              const itemCount = cached?.length || 0
              const height = isLoading ? 44 : itemCount > 0 ? 32 + itemCount * 24 : 44

              return (
                <g transform={`translate(${pos.x}, ${pos.y + 40})`} style={{ pointerEvents: 'none' }}>
                  {/* Arrow */}
                  <path
                    d="M -6 0 L 0 -8 L 6 0 Z"
                    fill="white"
                    stroke="#e2e8f0"
                    strokeWidth={1}
                  />

                  {/* Tooltip background */}
                  <rect
                    x={-115}
                    y={0}
                    width={230}
                    height={height}
                    rx={8}
                    fill="white"
                    stroke="#e2e8f0"
                    filter="url(#shadow)"
                  />

                  {/* Content */}
                  {isLoading ? (
                    <text x={0} y={height / 2 + 4} textAnchor="middle" fill="#94a3b8" fontSize={10}>
                      loading...
                    </text>
                  ) : itemCount > 0 ? (
                    <g>
                      {cached.slice(0, 5).map((disc, i) => (
                        <g key={disc.id} transform={`translate(-105, ${18 + i * 24})`}>
                          <text fill="#334155" fontSize={10}>
                            {disc.text.slice(0, 28)}{disc.text.length > 28 ? '…' : ''}
                          </text>
                          <text x={210} fill="#94a3b8" fontSize={9} textAnchor="end">
                            {formatTimeAgo(disc.createdAt)}
                          </text>
                        </g>
                      ))}
                    </g>
                  ) : (
                    <text x={0} y={height / 2 + 4} textAnchor="middle" fill="#94a3b8" fontSize={10}>
                      no queries yet
                    </text>
                  )}
                </g>
              )
            })()}
          </g>
        </svg>

        {/* Minimal correlation indicator */}
        {visibleLinks.length > 0 && (
          <div className="absolute bottom-14 left-4 text-[10px] text-neutral-400 font-mono">
            {visibleLinks.length} connections
          </div>
        )}
      </div>

      {/* Inline Expanded Panel (below SVG) */}
      <AnimatePresence mode="wait">
        {expandedPanelOpen && selectedTopic && (
          <motion.div
            key={selectedTopic.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="border-t border-slate-200 bg-white overflow-hidden"
          >
            {/* Header - Minimal */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
              <div>
                <h3 className="font-semibold text-slate-800">{selectedTopic.name}</h3>
                <p className="text-xs text-slate-500">{discussionTotal} conversations · {selectedTopic.category || 'other'}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNodeAction?.(`Tell me more about ${selectedTopic.name}`, selectedTopic.id)}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-slate-700 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  new query
                </button>
                <button
                  onClick={closePanel}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Conversations grid */}
            <div className="max-h-[220px] overflow-y-auto p-4">
              {discussionError ? (
                <div className="text-center py-4">
                  <p className="text-xs text-red-500 mb-2">{discussionError}</p>
                  <button
                    onClick={() => fetchDiscussions(selectedTopic.id)}
                    className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 rounded"
                  >
                    retry
                  </button>
                </div>
              ) : loadingDiscussions && discussions.length === 0 ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
                </div>
              ) : discussions.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-6">no conversations yet</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {discussions.slice(0, 6).map((d, idx) => (
                      <button
                        key={d.id}
                        onClick={() => {
                          const url = d.conversationId ? `/query/${d.conversationId}` : `/query/${d.id}`
                          window.open(url, '_blank')
                        }}
                        className="text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-slate-300 text-xs font-mono">{idx + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-700 font-medium line-clamp-2">{d.text}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-slate-400">{formatTimeAgo(d.createdAt)}</span>
                              {d.methodology && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-slate-200 text-slate-500 rounded">
                                  {d.methodology}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Load More */}
                  {discussions.length < discussionTotal && (
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => fetchDiscussions(selectedTopic.id, discussions.length)}
                        disabled={loadingDiscussions}
                        className="px-4 py-2 text-xs text-slate-500 hover:text-slate-700 border border-dashed border-slate-300 hover:border-slate-400 rounded-lg disabled:opacity-50"
                      >
                        {loadingDiscussions ? 'loading...' : `show ${discussionTotal - discussions.length} more`}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom bar */}
      <div className="px-4 py-1.5 bg-white border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400">
        <div className="flex items-center gap-4">
          <span>drag to pan</span>
          <span>scroll to zoom</span>
          <span>click topic to see discussions</span>
        </div>
        <span>akhai knowledge graph</span>
      </div>
    </div>
  )
}
