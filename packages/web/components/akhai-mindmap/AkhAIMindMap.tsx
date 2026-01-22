'use client'

/**
 * AkhAIMindMap - React Flow based mind map for AkhAI
 *
 * Features:
 * - React Flow v12 for node rendering
 * - D3 force layout for positioning
 * - White minimalist popup style
 * - Performance optimized (limited nodes, throttled updates)
 */

import { useCallback, useEffect, useState, useMemo, useRef } from 'react'
import {
  ReactFlow,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  useViewport,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { TopicNode, TopicNodeData } from './TopicNode'
import { MindMapEdge } from './MindMapEdge'
import { useForceLayout } from './useForceLayout'
import { MindMapMiniChat } from '../MindMapMiniChat'

// Node types configuration - defined outside component
const nodeTypes = {
  topic: TopicNode,
}

// Edge types configuration - defined outside component
const edgeTypes = {
  mindmap: MindMapEdge,
}

// Maximum nodes to display at once for performance
const MAX_VISIBLE_NODES = 100

// Topic interface from API
interface Topic {
  id: string
  name: string
  description?: string | null
  category?: string | null
  queryCount?: number
  color?: string
}

// Connection interface from API
interface Connection {
  from: string
  to: string
  fromName?: string
  toName?: string
}

interface AkhAIMindMapProps {
  topics?: Topic[]
  connections?: Connection[]
  onTopicClick?: (topicId: string) => void
  onTopicExpand?: (topicId: string) => void
  userId?: string | null
  className?: string
}

// Convert topics to React Flow nodes with connection counts
function topicsToNodes(topics: Topic[], connections: Connection[]): Node[] {
  // Limit for performance
  const limitedTopics = topics.slice(0, MAX_VISIBLE_NODES)

  // Pre-compute connection counts for each topic
  const connectionCounts = new Map<string, number>()
  connections.forEach(conn => {
    connectionCounts.set(conn.from, (connectionCounts.get(conn.from) || 0) + 1)
    connectionCounts.set(conn.to, (connectionCounts.get(conn.to) || 0) + 1)
  })

  return limitedTopics.map((topic, index) => {
    const cols = Math.ceil(Math.sqrt(limitedTopics.length))
    const row = Math.floor(index / cols)
    const col = index % cols
    const spacing = 220 // Increased for bigger nodes

    return {
      id: topic.id,
      type: 'topic',
      position: {
        x: col * spacing + 100,
        y: row * spacing + 100,
      },
      data: {
        label: topic.name,
        category: topic.category || undefined,
        queryCount: topic.queryCount || 0,
        description: topic.description || undefined,
        color: topic.color,
        connectionCount: connectionCounts.get(topic.id) || 0,
      } as TopicNodeData,
    }
  })
}

// Convert connections to React Flow edges (only for visible nodes)
function connectionsToEdges(connections: Connection[], visibleNodeIds: Set<string>): Edge[] {
  return connections
    .filter(conn => visibleNodeIds.has(conn.from) && visibleNodeIds.has(conn.to))
    .slice(0, 500) // Limit edges for performance
    .map((conn) => ({
      id: `${conn.from}-${conn.to}`,
      source: conn.from,
      target: conn.to,
      type: 'mindmap',
    }))
}

// Extract keywords from topic name and description
function extractKeywords(label: string, description?: string): string[] {
  const text = `${label} ${description || ''}`.toLowerCase()
  const words = text.split(/\s+/)
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'are', 'was', 'were'])
  return words
    .filter(w => w.length > 3 && !stopWords.has(w))
    .slice(0, 5)
}

// Inner component with React Flow hooks
function AkhAIMindMapInner({
  topics = [],
  connections = [],
  onTopicClick,
  onTopicExpand,
  className = '',
}: AkhAIMindMapProps) {
  // ALL HOOKS MUST BE AT THE TOP - no conditional hooks
  const { fitView } = useReactFlow()
  const viewport = useViewport()

  // State hooks - all at top level
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [containerSize] = useState({ width: 800, height: 600 })
  const [visibleCount, setVisibleCount] = useState(MAX_VISIBLE_NODES)
  const [activeMode, setActiveMode] = useState<'default' | 'suggestions' | 'connections'>('default')
  const [miniChatMessage, setMiniChatMessage] = useState<string | null>(null)
  const [topicInsights, setTopicInsights] = useState<string[]>([])
  const [isLoadingInsights, setIsLoadingInsights] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Refs
  const topicIdsRef = useRef<string>('')

  // Memoized visible topics (limited for performance)
  const visibleTopics = useMemo(() =>
    topics.slice(0, visibleCount),
    [topics, visibleCount]
  )

  // Convert props to React Flow format
  const initialNodes = useMemo(() => topicsToNodes(visibleTopics, connections), [visibleTopics, connections])

  // Get visible node IDs for filtering edges
  const visibleNodeIds = useMemo(() =>
    new Set(initialNodes.map(n => n.id)),
    [initialNodes]
  )

  const initialEdges = useMemo(() =>
    connectionsToEdges(connections, visibleNodeIds),
    [connections, visibleNodeIds]
  )

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Force layout simulation with clustering
  const { restartSimulation, stopSimulation, clusterCenters, clusterColors } = useForceLayout(
    nodes,
    edges,
    setNodes,
    {
      strength: -300,
      distance: 150,
      collisionRadius: 80,
      centerX: containerSize.width / 2,
      centerY: containerSize.height / 2,
      enableClustering: true,
    }
  )

  // Update nodes when topic IDs change
  useEffect(() => {
    const currentIds = visibleTopics.map(t => t.id).sort().join(',')
    if (currentIds !== topicIdsRef.current) {
      topicIdsRef.current = currentIds
      const newNodes = topicsToNodes(visibleTopics, connections)
      const nodeIds = new Set(newNodes.map(n => n.id))
      setNodes(newNodes)
      setEdges(connectionsToEdges(connections, nodeIds))
    }
  }, [visibleTopics, connections, setNodes, setEdges])

  // Fit view after layout settles
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.2 })
    }, 800)
    return () => clearTimeout(timer)
  }, [nodes.length, fitView])

  // Memoized selected node
  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId),
    [nodes, selectedNodeId]
  )

  // Get connections for selected topic (from original connections data)
  const topicConnections = useMemo(() => {
    if (!selectedNodeId) return []
    return connections.filter(
      c => c.from === selectedNodeId || c.to === selectedNodeId
    )
  }, [selectedNodeId, connections])

  // Get connected node details
  const connectedNodes = useMemo(() => {
    if (!selectedNode) return []
    return topicConnections
      .map(conn => {
        const connectedId = conn.from === selectedNode.id ? conn.to : conn.from
        const connectedTopic = topics.find(t => t.id === connectedId)
        if (!connectedTopic) return null
        const data = selectedNode.data as TopicNodeData
        const strength = data.category === connectedTopic.category ? 85 : 60
        return {
          id: connectedId,
          label: connectedTopic.name,
          category: connectedTopic.category,
          strength
        }
      })
      .filter(Boolean)
      .slice(0, 10)
  }, [selectedNode, topicConnections, topics])

  // Extract keywords from selected node
  const keywords = useMemo(() => {
    if (!selectedNode) return []
    const data = selectedNode.data as TopicNodeData
    return extractKeywords(data.label, data.description)
  }, [selectedNode])

  // Get suggestions (topics in same category, not connected)
  const suggestions = useMemo(() => {
    if (!selectedNode) {
      // Return random popular topics when nothing selected
      return topics
        .filter(t => (t.queryCount || 0) > 0)
        .sort((a, b) => (b.queryCount || 0) - (a.queryCount || 0))
        .slice(0, 8)
        .map(t => ({
          id: t.id,
          label: t.name,
          category: t.category,
          queryCount: t.queryCount,
        }))
    }
    const data = selectedNode.data as TopicNodeData
    const connectedIds = new Set(connectedNodes.map((c: any) => c?.id))
    return topics
      .filter(t =>
        t.id !== selectedNode.id &&
        !connectedIds.has(t.id) &&
        (t.category || 'other').toLowerCase() === (data.category || 'other').toLowerCase()
      )
      .slice(0, 8)
      .map(t => ({
        id: t.id,
        label: t.name,
        category: t.category,
        queryCount: t.queryCount,
      }))
  }, [selectedNode, topics, connectedNodes])

  // Search-filtered nodes count
  const searchMatchCount = useMemo(() => {
    if (!searchQuery.trim()) return 0
    const query = searchQuery.toLowerCase()
    return nodes.filter(n => {
      const data = n.data as TopicNodeData
      return data.label.toLowerCase().includes(query) ||
             (data.category?.toLowerCase().includes(query)) ||
             (data.description?.toLowerCase().includes(query))
    }).length
  }, [nodes, searchQuery])

  // Get matching node IDs for highlighting
  const matchingNodeIds = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>()
    const query = searchQuery.toLowerCase()
    return new Set(
      nodes
        .filter(n => {
          const data = n.data as TopicNodeData
          return data.label.toLowerCase().includes(query) ||
                 (data.category?.toLowerCase().includes(query)) ||
                 (data.description?.toLowerCase().includes(query))
        })
        .map(n => n.id)
    )
  }, [nodes, searchQuery])

  // Focus on first matching node when search changes
  useEffect(() => {
    if (searchQuery.trim() && matchingNodeIds.size > 0) {
      const firstMatchId = Array.from(matchingNodeIds)[0]
      const matchNode = nodes.find(n => n.id === firstMatchId)
      if (matchNode) {
        fitView({ nodes: [matchNode], padding: 0.5, duration: 300 })
      }
    }
  }, [searchQuery, matchingNodeIds, nodes, fitView])

  // Mini chat ref for sending messages
  const miniChatRef = useRef<{ sendMessage: (text: string) => void } | null>(null)

  // Send to mini chat
  const sendToMiniChat = useCallback((text: string) => {
    setMiniChatMessage(text)
    // Clear after a moment so it can be sent again
    setTimeout(() => setMiniChatMessage(null), 100)
  }, [])

  // Reset active mode when topic changes
  useEffect(() => {
    setActiveMode('default')
  }, [selectedNodeId])

  // Fetch AI insights when topic is selected
  const fetchTopicInsights = useCallback(async (topicLabel: string, topicDescription?: string) => {
    setIsLoadingInsights(true)
    setTopicInsights([])
    try {
      const res = await fetch('/api/simple-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `Give exactly 3 brief insights about "${topicLabel}". ${topicDescription ? `Context: ${topicDescription}.` : ''} Format: Return ONLY 3 bullet points, each under 15 words. No intro text.`,
          methodology: 'direct',
        }),
      })
      if (!res.ok) {
        setTopicInsights(['Unable to load insights'])
        return
      }
      const data = await res.json()
      const response = data.response || ''
      // Parse bullet points from response
      const bullets = response
        .split(/[\n•\-\*]+/)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 5 && s.length < 100)
        .slice(0, 3)
      setTopicInsights(bullets.length > 0 ? bullets : ['No insights available'])
    } catch {
      setTopicInsights(['Unable to load insights'])
    } finally {
      setIsLoadingInsights(false)
    }
  }, [])

  // Fetch insights when topic is selected
  useEffect(() => {
    if (selectedNode) {
      const data = selectedNode.data as TopicNodeData
      fetchTopicInsights(data.label, data.description)
    } else {
      setTopicInsights([])
    }
  }, [selectedNodeId, selectedNode, fetchTopicInsights])

  // Event handlers
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id)
      onTopicClick?.(node.id)
    },
    [onTopicClick]
  )

  const handleNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onTopicExpand?.(node.id)
    },
    [onTopicExpand]
  )

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null)
  }, [])

  const handleClosePopup = useCallback(() => {
    setSelectedNodeId(null)
  }, [])

  const handleLoadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + 50, topics.length))
  }, [topics.length])

  // Export Mind Map as JSON
  const exportJSON = useCallback(() => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      nodeCount: nodes.length,
      connectionCount: edges.length,
      nodes: nodes.map(n => ({
        id: n.id,
        label: (n.data as TopicNodeData).label,
        category: (n.data as TopicNodeData).category,
        description: (n.data as TopicNodeData).description,
        queryCount: (n.data as TopicNodeData).queryCount,
        position: n.position,
      })),
      connections: edges.map(e => ({
        source: e.source,
        target: e.target,
      })),
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mindmap-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [nodes, edges])

  return (
    <div className={`w-full h-full relative ${className}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onPaneClick={handlePaneClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={4}
        defaultEdgeOptions={{ type: 'mindmap' }}
        nodesFocusable
        edgesFocusable={false}
        proOptions={{ hideAttribution: true }}
        // Performance optimizations for 100+ nodes
        onlyRenderVisibleElements={nodes.length > 50}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        selectNodesOnDrag={false}
        className="bg-[#fafafa]"
      >
        <Background color="#e0e0e0" gap={20} size={1} />

        {/* Cluster labels - shows category names at cluster centers */}
        {clusterCenters.length > 0 && (
          <Panel position="top-left" className="pointer-events-none !p-0 !m-0 !bg-transparent" style={{ position: 'absolute', inset: 0 }}>
            <svg className="w-full h-full absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
              {clusterCenters.map((cluster) => (
                <g key={cluster.category}>
                  {/* Subtle cluster region indicator */}
                  <circle
                    cx={cluster.x}
                    cy={cluster.y}
                    r={100 + cluster.nodeCount * 5}
                    fill={cluster.color}
                    fillOpacity={0.03}
                    stroke={cluster.color}
                    strokeOpacity={0.1}
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                  {/* Category label */}
                  <text
                    x={cluster.x}
                    y={cluster.y - 90 - cluster.nodeCount * 3}
                    textAnchor="middle"
                    className="text-[10px] font-mono uppercase tracking-wider"
                    fill={cluster.color}
                    fillOpacity={0.6}
                  >
                    {cluster.category} ({cluster.nodeCount})
                  </text>
                </g>
              ))}
            </svg>
          </Panel>
        )}

        <Controls
          showInteractive={false}
          className="!bg-white !border-[#e0e0e0] !rounded"
        />

        <MiniMap
          nodeColor={() => '#ccc'}
          maskColor="rgba(255, 255, 255, 0.8)"
          className="!bg-white !border-[#e0e0e0]"
        />

        {/* Controls panel - minimalist text links */}
        <Panel position="top-left" className="flex items-center gap-3 text-xs text-neutral-500">
          <button
            onClick={() => restartSimulation()}
            className="hover:text-neutral-800 transition-colors"
          >
            re-layout
          </button>
          <span className="text-neutral-300">·</span>
          <button
            onClick={() => stopSimulation()}
            className="hover:text-neutral-800 transition-colors"
          >
            stop
          </button>
          <span className="text-neutral-300">·</span>
          <button
            onClick={() => fitView({ padding: 0.2 })}
            className="hover:text-neutral-800 transition-colors"
          >
            fit view
          </button>
          {visibleCount < topics.length && (
            <>
              <span className="text-neutral-300">·</span>
              <button
                onClick={handleLoadMore}
                className="hover:text-neutral-800 transition-colors"
              >
                load more <span className="text-neutral-400">({visibleCount}/{topics.length})</span>
              </button>
            </>
          )}
          <span className="text-neutral-300">·</span>
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-neutral-600 placeholder-neutral-400 text-xs w-20 focus:outline-none focus:w-28 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-neutral-400 hover:text-neutral-600 text-xs ml-1"
              >
                ×
              </button>
            )}
          </div>
          {searchQuery && searchMatchCount > 0 && (
            <span className="text-neutral-400">
              {searchMatchCount} found
            </span>
          )}
          <span className="text-neutral-300">·</span>
          <button
            onClick={() => setActiveMode(activeMode === 'suggestions' ? 'default' : 'suggestions')}
            className={`transition-colors ${
              activeMode === 'suggestions' ? 'text-neutral-800' : 'hover:text-neutral-800'
            }`}
          >
            suggestions <span className="text-neutral-400">({suggestions.length})</span>
          </button>
          <span className="text-neutral-300">·</span>
          <button
            onClick={() => setActiveMode(activeMode === 'connections' ? 'default' : 'connections')}
            className={`transition-colors ${
              activeMode === 'connections' ? 'text-neutral-800' : 'hover:text-neutral-800'
            }`}
          >
            connections <span className="text-neutral-400">({topicConnections.length})</span>
          </button>
        </Panel>

        {/* Stats panel - plain text */}
        <Panel position="top-right" className="flex items-center gap-3 text-xs text-neutral-500">
          <span className="text-neutral-400">
            {nodes.length} topics · {edges.length} connections
            {topics.length > visibleCount && ` · showing ${visibleCount}`}
          </span>
          <span className="text-neutral-300">·</span>
          <button
            onClick={exportJSON}
            className="hover:text-neutral-800 transition-colors"
            title="Export Mind Map as JSON"
          >
            export
          </button>
        </Panel>
      </ReactFlow>

      {/* RIGHT CONTEXT PANEL - Settings-style minimalist */}
      {(activeMode === 'suggestions' || activeMode === 'connections') && (
        <div
          className="bg-white border border-neutral-200"
          style={{
            position: 'absolute',
            right: '16px',
            top: '50px',
            width: '180px',
            maxHeight: 'calc(100vh - 120px)',
            overflow: 'hidden',
            zIndex: 40,
          }}
        >
          {/* Panel Header */}
          <div className="px-3 py-2 border-b border-neutral-100 flex justify-between items-center">
            <span className="text-xs text-neutral-500">
              {activeMode === 'suggestions' ? 'suggestions' : 'links'}
            </span>
            <span className="text-xs text-neutral-400">
              {activeMode === 'suggestions' ? suggestions.length : connectedNodes.length}
            </span>
          </div>

          {/* Panel Content */}
          <div className="max-h-80 overflow-y-auto p-2">
            {/* Suggestions Mode */}
            {activeMode === 'suggestions' && Array.isArray(suggestions) && suggestions.length > 0 && suggestions.map((s, idx) => (
              <div
                key={`suggestion-${s?.id || idx}-${idx}`}
                onClick={() => {
                  if (s?.label) sendToMiniChat(`Tell me about "${s.label}"`)
                  if (s?.id) setSelectedNodeId(s.id)
                }}
                className="px-2 py-1.5 cursor-pointer hover:text-neutral-800 transition-colors"
              >
                <div className="text-xs text-neutral-600">
                  {s?.label || 'Unknown'}
                </div>
                <div className="text-[10px] text-neutral-400 mt-0.5">
                  {s?.queryCount || 0} queries · {s?.category || 'other'}
                </div>
              </div>
            ))}

            {/* Connections Mode */}
            {activeMode === 'connections' && Array.isArray(connectedNodes) && connectedNodes.length > 0 && connectedNodes.map((conn: any, idx: number) => (
              <div
                key={`connection-${conn?.id || idx}-${idx}`}
                onClick={() => {
                  const sourceLabel = selectedNode ? (selectedNode.data as TopicNodeData).label : 'topic'
                  if (conn?.label) sendToMiniChat(`Explain the connection between "${sourceLabel}" and "${conn.label}"`)
                  if (conn?.id) setSelectedNodeId(conn.id)
                }}
                className="px-2 py-1.5 cursor-pointer hover:text-neutral-800 transition-colors"
              >
                <div className="text-xs text-neutral-600">
                  {conn?.label || 'Unknown'}
                </div>
                <div className="text-[10px] text-neutral-400 mt-0.5">
                  {conn?.category || 'other'} · {conn?.strength || 60}%
                </div>
              </div>
            ))}

            {/* Empty states */}
            {activeMode === 'suggestions' && (!Array.isArray(suggestions) || suggestions.length === 0) && (
              <div className="py-4 text-center text-xs text-neutral-400">
                {selectedNode ? 'none found' : 'select a node'}
              </div>
            )}
            {activeMode === 'connections' && (!Array.isArray(connectedNodes) || connectedNodes.length === 0) && (
              <div className="py-4 text-center text-xs text-neutral-400">
                {selectedNode ? 'none found' : 'select a node'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* COMPACT RIGHT PANEL - Topic Details - Settings-style minimalist */}
      {selectedNode && (
        <div
          className="bg-white border border-neutral-200"
          style={{
            position: 'fixed',
            right: '16px',
            top: '130px',
            width: '180px',
            maxHeight: '340px',
            zIndex: 100,
            overflowY: 'auto',
          }}
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-neutral-100 flex justify-between items-start">
            <div>
              <div className="text-xs text-neutral-700 font-normal">
                {(selectedNode.data as TopicNodeData).label}
              </div>
              <div className="text-[10px] text-neutral-400 mt-1">
                {(selectedNode.data as TopicNodeData).queryCount || 0} queries · {topicConnections.length} links · {(selectedNode.data as TopicNodeData).category || 'other'}
              </div>
            </div>
            <button
              onClick={handleClosePopup}
              className="text-neutral-400 hover:text-neutral-600 text-sm transition-colors"
            >
              ×
            </button>
          </div>

          {/* Description */}
          {(selectedNode.data as TopicNodeData).description && (
            <div className="px-3 py-2 border-b border-neutral-100">
              <div className="text-[10px] text-neutral-500 leading-relaxed">
                {((selectedNode.data as TopicNodeData).description || '').substring(0, 80)}...
              </div>
            </div>
          )}

          {/* Insights */}
          <div className="px-3 py-2 border-b border-neutral-100">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-neutral-400">insights</span>
              {!isLoadingInsights && (
                <button
                  onClick={() => {
                    const data = selectedNode.data as TopicNodeData
                    fetchTopicInsights(data.label, data.description)
                  }}
                  className="text-[10px] text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  refresh
                </button>
              )}
            </div>
            <div className="text-[10px] text-neutral-500 leading-relaxed">
              {isLoadingInsights ? (
                <span className="text-neutral-400">...</span>
              ) : topicInsights.length > 0 ? (
                topicInsights.slice(0, 2).map((insight, idx) => (
                  <div key={`insight-${idx}`} className="py-0.5">
                    · {insight.substring(0, 50)}{insight.length > 50 ? '...' : ''}
                  </div>
                ))
              ) : (
                <span className="text-neutral-400">—</span>
              )}
            </div>
          </div>

          {/* Connections */}
          <div className="px-3 py-2">
            <div className="text-[10px] text-neutral-400 mb-1">
              links ({connectedNodes.length})
            </div>
            {Array.isArray(connectedNodes) && connectedNodes.length > 0 ? (
              <>
                {connectedNodes.slice(0, 3).map((conn: any, idx: number) => (
                  <div
                    key={`panel-conn-${conn?.id || idx}-${idx}`}
                    onClick={() => conn?.id && setSelectedNodeId(conn.id)}
                    className="py-1 cursor-pointer text-[10px] text-neutral-600 hover:text-neutral-800 flex justify-between transition-colors"
                  >
                    <span>{conn?.label || 'Unknown'}</span>
                    <span className="text-neutral-400">{conn?.strength || 60}%</span>
                  </div>
                ))}
                {connectedNodes.length > 3 && (
                  <div className="text-[10px] text-neutral-400 mt-1">
                    +{connectedNodes.length - 3} more
                  </div>
                )}
              </>
            ) : (
              <div className="text-[10px] text-neutral-400">—</div>
            )}
          </div>
        </div>
      )}

      {/* Mini Chat Panel */}
      <MindMapMiniChat
        selectedTopic={selectedNode ? {
          id: selectedNode.id,
          label: (selectedNode.data as TopicNodeData).label,
          category: (selectedNode.data as TopicNodeData).category,
          description: (selectedNode.data as TopicNodeData).description,
        } : null}
        suggestionsCount={suggestions.length}
        connectionsCount={topicConnections.length}
        externalMessage={miniChatMessage}
      />
    </div>
  )
}

// Main export wrapped with ReactFlowProvider
export function AkhAIMindMap(props: AkhAIMindMapProps) {
  return (
    <ReactFlowProvider>
      <AkhAIMindMapInner {...props} />
    </ReactFlowProvider>
  )
}

export default AkhAIMindMap
