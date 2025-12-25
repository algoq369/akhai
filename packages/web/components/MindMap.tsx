'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import * as d3 from 'd3'
import { HexColorPicker } from 'react-colorful'
import { XMarkIcon, PaintBrushIcon, MapPinIcon, ArchiveBoxIcon, SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { getShapeConfig, ShapeType } from '@/lib/shape-encoder'
import type { TopicInsights } from '@/lib/mindmap-insights'
import MindMapTableView from './MindMapTableView'
import MindMapDiagramView from './MindMapDiagramView'

export interface Node extends d3.SimulationNodeDatum {
  id: string
  name: string
  description: string | null
  category: string | null
  color: string
  pinned: boolean
  archived: boolean
  ai_instructions: string | null
  queryCount: number
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node
  target: string | Node
  type: string
  strength: number
}

interface MindMapProps {
  isOpen: boolean
  onClose: () => void
  userId: string | null
}

const NODE_RADIUS = 20
const COLOR_PALETTE = [
  '#A3A3A3', // relic-silver
  '#6B7280', // grey-500
  '#525252', // relic-slate
  '#9CA3AF', // grey-400
  '#D1D5DB', // grey-300
  '#E5E7EB', // grey-200
  '#F3F4F6', // grey-100
  '#4B5563', // grey-600
]

// Helper function to safely parse JSON responses
async function safeJsonParse(response: Response) {
  const contentType = response.headers.get('content-type')
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text()
    throw new Error(`Expected JSON but got ${contentType}. Status: ${response.status}`)
  }
  return response.json()
}

export default function MindMap({ isOpen, onClose, userId }: MindMapProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [links, setLinks] = useState<Link[]>([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractMessage, setExtractMessage] = useState('')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [aiInstructions, setAiInstructions] = useState('')
  const [viewMode, setViewMode] = useState<'graph' | 'table' | 'diagram'>('graph')
  const [insights, setInsights] = useState<Record<string, TopicInsights>>({})

  const simulationRef = useRef<ReturnType<typeof d3.forceSimulation<Node, Link>> | null>(null)

  const fetchMindMapData = useCallback(async () => {
    if (!userId) {
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch('/api/mindmap/data')
      
      // Handle 401 - authentication required
      if (res.status === 401) {
        setNodes([])
        setLinks([])
        return // Silently return - user is not logged in
      }
      
      if (!res.ok) {
        // Check if response is HTML (error page)
        const contentType = res.headers.get('content-type')
        if (contentType && contentType.includes('text/html')) {
          throw new Error(`Server error (${res.status}). Please try again later.`)
        }
        throw new Error(`Failed to fetch mind map data: ${res.statusText}`)
      }
      const data = await safeJsonParse(res)
      setNodes(data.nodes || [])
      setLinks(data.links || [])
      
      // Fetch insights if we have nodes
      if (data.nodes && data.nodes.length > 0) {
        fetchInsights()
      }
    } catch (error) {
      console.error('Error fetching mind map data:', error)
      setNodes([])
      setLinks([])
      // Show user-friendly error message
      if (error instanceof Error) {
        setExtractMessage(error.message)
        setTimeout(() => setExtractMessage(''), 5000)
      }
    } finally {
      setIsLoading(false)
    }
  }, [userId, isOpen])

  const fetchInsights = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch('/api/mindmap/insights')
      if (res.ok) {
        const data = await res.json()
        setInsights(data.insights || {})
      }
    } catch (error) {
      console.error('Failed to fetch insights:', error)
    }
  }, [userId])

  useEffect(() => {
    if (isOpen) {
      fetchMindMapData()
    }
  }, [isOpen, fetchMindMapData])

  useEffect(() => {
    if (!svgRef.current || !isOpen || isLoading) return

    const svg = d3.select(svgRef.current)
    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight

    svg.selectAll('*').remove() // Clear previous elements

    const g = svg.append('g')

    // Zoom functionality
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })
    svg.call(zoom)

    const visibleNodes = nodes.filter(n => !n.archived)
    const visibleLinks = links.filter(l => {
      const sourceId = typeof l.source === 'string' ? l.source : l.source.id
      const targetId = typeof l.target === 'string' ? l.target : l.target.id
      return visibleNodes.some(n => n.id === sourceId || n.id === targetId)
    })

    // Convert string IDs to node objects for D3 - only keep links with valid nodes
    const linkData = visibleLinks
      .map(l => {
        const sourceId = typeof l.source === 'string' ? l.source : l.source.id
        const targetId = typeof l.target === 'string' ? l.target : l.target.id
        const sourceNode = visibleNodes.find(n => n.id === sourceId)
        const targetNode = visibleNodes.find(n => n.id === targetId)
        
        // Only return link if both nodes exist
        if (!sourceNode || !targetNode) {
          return null
        }
        
        return {
          source: sourceNode,
          target: targetNode,
          type: l.type,
          strength: l.strength,
        }
      })
      .filter((l): l is NonNullable<typeof l> => l !== null)
    

    const simulation = d3.forceSimulation<Node, Link>(visibleNodes)
      .force('link', d3.forceLink<Node, Link>(linkData as any).id((d: any) => d.id).distance(100).strength(0.7))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide(NODE_RADIUS + 5))

    simulationRef.current = simulation

    const link = g.append('g')
      .attr('stroke', '#A3A3A3')
      .attr('stroke-opacity', 0.4)
      .selectAll('line')
      .data(linkData as any)
      .join('line')
      .attr('stroke-width', (d: any) => Math.sqrt(d.strength || 1))

    const dragBehavior = d3.drag<SVGGElement, Node, Node>()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragged)

    const node = g.append('g')
      .attr('stroke', '#FAFAFA')
      .attr('stroke-width', 1.5)
      .selectAll('g')
      .data(visibleNodes)
      .join('g')
      .call(dragBehavior as any)
      .on('click', (event, d) => {
        setSelectedNode(d)
        setAiInstructions(d.ai_instructions || '')
        setShowColorPicker(false)
      })

    // Render nodes as simple circles
    node.each(function(d: Node) {
      const topicInsights = insights[d.id]
      const shapeConfig = getShapeConfig(d, {
        sentiment: topicInsights?.sentiment || 0,
        bias: Array.isArray(topicInsights?.bias) ? topicInsights.bias.length : (topicInsights?.bias || 0)
      })
      const nodeGroup = d3.select(this)
      
      // Simple circle rendering only
      nodeGroup.append('circle')
        .attr('r', shapeConfig.size)
        .attr('fill', shapeConfig.color)
        .attr('stroke', selectedNode?.id === d.id ? '#525252' : '#6B7280')
        .attr('stroke-width', selectedNode?.id === d.id ? 3 : 2)
    })

    node.append('text')
      .attr('x', 0)
      .attr('y', 3)
      .attr('text-anchor', 'middle')
      .attr('fill', '#FAFAFA')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .text(d => {
        const name = d.name || 'Topic'
        return name.length > 12 ? name.substring(0, 10) + '...' : name
      })
      .clone(true).lower()
      .attr('fill', '#171717')
      .attr('stroke', '#FAFAFA')
      .attr('stroke-width', 0.5)

    // Pin indicator
    node.filter(d => d.pinned)
      .append('text')
      .attr('x', 0)
      .attr('y', -NODE_RADIUS - 8)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .text('📌')

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => (d.source as Node).x!)
        .attr('y1', (d: any) => (d.source as Node).y!)
        .attr('x2', (d: any) => (d.target as Node).x!)
        .attr('y2', (d: any) => (d.target as Node).y!)

      node.attr('transform', d => `translate(${d.x},${d.y})`)
    })

    function dragstarted(event: d3.D3DragEvent<SVGGElement, Node, Node>) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      event.subject.fx = event.subject.x
      event.subject.fy = event.subject.y
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, Node, Node>) {
      event.subject.fx = event.x
      event.subject.fy = event.y
    }

    // Cleanup on unmount
    return () => {
      simulation.stop()
    }
  }, [nodes, links, isOpen, isLoading, selectedNode])

  const updateNodeProperty = useCallback(async (nodeId: string, property: string, value: any) => {
    try {
      const res = await fetch(`/api/mindmap/topics/${nodeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [property]: value }),
      })
      if (!res.ok) {
        throw new Error(`Failed to update topic property: ${res.statusText}`)
      }
      setNodes(prevNodes => prevNodes.map(node =>
        node.id === nodeId ? { ...node, [property]: value } : node
      ))
      if (selectedNode?.id === nodeId) {
        setSelectedNode(prev => prev ? { ...prev, [property]: value } : null)
      }
      // If color changed, restart simulation to update node color
      if (property === 'color' && simulationRef.current) {
        simulationRef.current.alpha(0.3).restart()
      }
    } catch (error) {
      console.error(`Error updating node ${property}:`, error)
    }
  }, [selectedNode])

  const handleColorChange = useCallback((color: string) => {
    if (selectedNode) {
      updateNodeProperty(selectedNode.id, 'color', color)
    }
  }, [selectedNode, updateNodeProperty])

  const handlePinToggle = useCallback(() => {
    if (selectedNode) {
      const newPinnedState = !selectedNode.pinned
      updateNodeProperty(selectedNode.id, 'pinned', newPinnedState ? 1 : 0)
      // Fix node position if pinned, unfix if unpinned
      setNodes(prevNodes => prevNodes.map(node => {
        if (node.id === selectedNode.id) {
          return { 
            ...node, 
            pinned: newPinnedState, 
            fx: newPinnedState ? node.x : null, 
            fy: newPinnedState ? node.y : null 
          }
        }
        return node
      }))
      if (simulationRef.current) {
        simulationRef.current.alpha(0.3).restart()
      }
    }
  }, [selectedNode, updateNodeProperty])

  const handleArchiveToggle = useCallback(() => {
    if (selectedNode) {
      updateNodeProperty(selectedNode.id, 'archived', !selectedNode.archived ? 1 : 0)
    }
  }, [selectedNode, updateNodeProperty])

  const handleAiInstructionsChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAiInstructions(e.target.value)
  }, [])

  const handleSaveAiInstructions = useCallback(() => {
    if (selectedNode) {
      updateNodeProperty(selectedNode.id, 'ai_instructions', aiInstructions)
    }
  }, [selectedNode, aiInstructions, updateNodeProperty])

  const handleReExtractTopics = async () => {
    if (!userId) return
    setIsExtracting(true)
    setExtractMessage('Extracting...')
    try {
      const res = await fetch('/api/mindmap/re-extract', { method: 'POST' })
      if (!res.ok) {
        // Check if response is HTML (error page)
        const contentType = res.headers.get('content-type')
        if (contentType && contentType.includes('text/html')) {
          if (res.status === 401) {
            throw new Error('Authentication required. Please log in to re-extract topics.')
          }
          throw new Error(`Server error (${res.status}). Please try again later.`)
        }
        throw new Error(`Failed to re-extract topics: ${res.statusText}`)
      }
      const data = await safeJsonParse(res)
      if (data.success && data.topicsExtracted !== undefined && data.queriesProcessed !== undefined) {
        setExtractMessage(`Re-extracted ${data.topicsExtracted} topics from ${data.queriesProcessed} queries!`)
        fetchMindMapData() // Refresh map data
      } else {
        throw new Error('Invalid response format from server')
      }
    } catch (error) {
      console.error('Error re-extracting topics:', error)
      setExtractMessage(`Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsExtracting(false)
      setTimeout(() => setExtractMessage(''), 5000) // Clear message after 5 seconds
    }
  }

  if (!isOpen) return null

  const visibleNodes = nodes.filter(n => !n.archived)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-relic-void/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-relic-white border border-relic-mist shadow-lg rounded-lg w-full max-w-5xl h-[80vh] p-6 relative flex flex-col animate-scale-in">
        {/* Header with View Toggle */}
        <div className="flex items-center justify-between mb-4 border-b border-relic-mist pb-3">
          <h2 className="text-lg font-mono text-relic-slate">Mind Map</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('graph')}
              className={`px-3 py-1 text-xs font-mono border border-relic-mist transition-all ${
                viewMode === 'graph' 
                  ? 'bg-relic-ghost text-relic-slate border-relic-slate' 
                  : 'bg-relic-white text-relic-silver hover:text-relic-slate'
              }`}
            >
              Graph
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 text-xs font-mono border border-relic-mist transition-all ${
                viewMode === 'table' 
                  ? 'bg-relic-ghost text-relic-slate border-relic-slate' 
                  : 'bg-relic-white text-relic-silver hover:text-relic-slate'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('diagram')}
              className={`px-3 py-1 text-xs font-mono border border-relic-mist transition-all ${
                viewMode === 'diagram' 
                  ? 'bg-relic-ghost text-relic-slate border-relic-slate' 
                  : 'bg-relic-white text-relic-silver hover:text-relic-slate'
              }`}
            >
              Diagram
            </button>
          </div>
          <button onClick={onClose} className="text-relic-silver hover:text-relic-slate">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Main Mind Map Area */}
        <div className="flex-1 relative bg-relic-ghost/10 rounded-md overflow-hidden flex">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-relic-mist border-t-relic-slate rounded-full animate-spin" />
              <span className="ml-3 text-relic-silver">Loading mind map...</span>
            </div>
          ) : visibleNodes.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-relic-silver">
              <p className="text-lg">No topics yet</p>
              <p className="text-sm mt-2">Topics will appear here as you chat with AkhAI.</p>
              <button
                onClick={handleReExtractTopics}
                disabled={isExtracting}
                className="relic-button-primary text-xs px-4 py-2 mt-4 flex items-center gap-2"
              >
                {isExtracting ? (
                  <div className="w-4 h-4 border border-relic-white border-t-relic-slate rounded-full animate-spin" />
                ) : (
                  <ArrowPathIcon className="h-4 w-4" />
                )}
                Re-extract Topics
              </button>
              {extractMessage && (
                <p className="text-xs text-relic-silver mt-2">{extractMessage}</p>
              )}
            </div>
          ) : viewMode === 'graph' ? (
            <>
              <svg ref={svgRef} className="w-full h-full"></svg>
              <div className="absolute top-4 left-4 text-xs text-relic-silver bg-relic-white/70 backdrop-blur-sm px-3 py-1 rounded-md">
                {visibleNodes.length} topics · {links.length} connections
              </div>
              <div className="absolute bottom-4 left-4">
                <button
                  onClick={handleReExtractTopics}
                  disabled={isExtracting}
                  className="relic-button-primary text-xs px-4 py-2 flex items-center gap-2"
                >
                  {isExtracting ? (
                    <div className="w-4 h-4 border border-relic-white border-t-relic-slate rounded-full animate-spin" />
                  ) : (
                    <ArrowPathIcon className="h-4 w-4" />
                  )}
                  Re-extract Topics
                </button>
                {extractMessage && (
                  <p className="text-xs text-relic-silver mt-2">{extractMessage}</p>
                )}
              </div>
            </>
          ) : viewMode === 'table' ? (
            <MindMapTableView
              nodes={visibleNodes}
              links={links}
              insights={insights}
              onNodeSelect={setSelectedNode}
              selectedNode={selectedNode}
            />
          ) : (
            <MindMapDiagramView
              nodes={visibleNodes}
              links={links}
              insights={insights}
              onNodeSelect={setSelectedNode}
              selectedNode={selectedNode}
            />
          )}
        </div>

        {/* Node Details Sidebar - Always visible when node selected */}
        <div className="w-80 bg-relic-ghost/50 border-l border-relic-mist p-4 flex flex-col">
          {selectedNode ? (
            <>
              <h4 className="text-lg font-medium text-relic-slate mb-2">{selectedNode.name}</h4>
              {selectedNode.category && (
                <span className="text-xs px-2 py-0.5 bg-relic-ghost text-relic-slate border border-relic-mist self-start mb-3">
                  {selectedNode.category}
                </span>
              )}
              <p className="text-sm text-relic-silver mb-4">{selectedNode.description || 'No description.'}</p>

              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => setShowColorPicker(prev => !prev)}
                  className={`relic-button text-xs px-3 py-1.5 flex items-center gap-1 ${showColorPicker ? 'bg-relic-mist' : ''}`}
                >
                  <PaintBrushIcon className="h-4 w-4" /> Color
                </button>
                <button
                  onClick={handlePinToggle}
                  className={`relic-button text-xs px-3 py-1.5 flex items-center gap-1 ${selectedNode.pinned ? 'bg-relic-mist' : ''}`}
                >
                  <MapPinIcon className="h-4 w-4" /> {selectedNode.pinned ? 'Unpin' : 'Pin'}
                </button>
                <button
                  onClick={handleArchiveToggle}
                  className={`relic-button text-xs px-3 py-1.5 flex items-center gap-1 ${selectedNode.archived ? 'bg-relic-mist' : ''}`}
                >
                  <ArchiveBoxIcon className="h-4 w-4" /> {selectedNode.archived ? 'Unarchive' : 'Archive'}
                </button>
              </div>

              {showColorPicker && (
                <div className="mb-4">
                  <HexColorPicker color={selectedNode.color} onChange={handleColorChange} />
                  <div className="flex flex-wrap gap-1 mt-2">
                    {COLOR_PALETTE.map(color => (
                      <button
                        key={color}
                        className="w-6 h-6 rounded-full border border-relic-mist"
                        style={{ backgroundColor: color }}
                        onClick={() => handleColorChange(color)}
                      />
                    ))}
                  </div>
                </div>
              )}

              <h5 className="text-sm font-medium text-relic-slate mb-2 flex items-center gap-2">
                <SparklesIcon className="h-4 w-4" /> AI Instructions
              </h5>
              <textarea
                value={aiInstructions}
                onChange={handleAiInstructionsChange}
                onBlur={handleSaveAiInstructions}
                placeholder="Instructions for AI when this topic is relevant..."
                className="relic-input text-xs h-24 mb-4 resize-y"
              />
              <p className="text-[10px] text-relic-silver mb-4">
                These instructions will guide AkhAI's behavior when this topic is active in conversation context.
              </p>

              {/* Insights */}
              {insights[selectedNode.id] && (
                <div className="mt-4 pt-4 border-t border-relic-mist">
                  <h5 className="text-xs font-medium text-relic-slate mb-2">Insights</h5>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-relic-silver">Sentiment: </span>
                      <span className={`${
                        insights[selectedNode.id].sentiment > 0.3 ? 'text-relic-silver' :
                        insights[selectedNode.id].sentiment < -0.3 ? 'text-relic-void' :
                        'text-relic-slate'
                      }`}>
                        {insights[selectedNode.id].sentiment > 0 ? '+' : ''}{(insights[selectedNode.id].sentiment * 100).toFixed(0)}%
                      </span>
                    </div>
                    {insights[selectedNode.id].bias.length > 0 && (
                      <div>
                        <span className="text-relic-silver">Bias: </span>
                        <span className="text-relic-slate">{insights[selectedNode.id].bias.join(', ')}</span>
                      </div>
                    )}
                    {insights[selectedNode.id].marketCorrelation !== null && (
                      <div>
                        <span className="text-relic-silver">Market: </span>
                        <span className="text-relic-slate">{(insights[selectedNode.id].marketCorrelation! * 100).toFixed(0)}%</span>
                      </div>
                    )}
                    {insights[selectedNode.id].manipulation && (
                      <div>
                        <span className="text-relic-silver">⚠️ Manipulation signals detected</span>
                      </div>
                    )}
                    <div>
                      <span className="text-relic-silver">Type: </span>
                      <span className="text-relic-slate">{insights[selectedNode.id].factuality}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-xs text-relic-silver mt-auto pt-4 border-t border-relic-mist">
                <span className="font-medium">{selectedNode.queryCount}</span> queries linked
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-relic-slate px-4">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">👆</div>
                <h3 className="text-lg font-medium mb-2">Select a Topic</h3>
                <p className="text-sm mb-4">Click any node above to see details and tools</p>
              </div>
              
              <div className="w-full space-y-4 text-left">
                <div className="border-l-2 border-relic-mist pl-3">
                  <p className="text-sm font-medium text-relic-slate mb-1">Available Tools:</p>
                  <ul className="text-xs text-relic-silver space-y-1">
                    <li>• <span className="font-medium">Color</span> - Customize topic appearance</li>
                    <li>• <span className="font-medium">Pin</span> - Lock important topics in place</li>
                    <li>• <span className="font-medium">Archive</span> - Hide topics you don't need</li>
                    <li>• <span className="font-medium">AI Instructions</span> - Guide AkhAI's behavior</li>
                  </ul>
                </div>
                
                <div className="border-l-2 border-relic-mist pl-3 pt-2">
                  <p className="text-xs text-relic-silver">
                    <span className="font-medium">Tip:</span> Drag nodes to rearrange • Use mouse wheel to zoom
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
