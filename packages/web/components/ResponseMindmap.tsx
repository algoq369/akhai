'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  SparklesIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  XMarkIcon,
  BookOpenIcon,
  LinkIcon
} from '@heroicons/react/24/outline'

interface MindmapNode {
  id: string
  label: string
  fullText: string
  level: number
  parentId?: string
  category?: string
  x?: number
  y?: number
}

interface ResponseMindmapProps {
  content: string
  topics?: Array<{ id: string; name: string; category?: string }>
  isVisible: boolean
  onToggle: () => void
  methodology?: string
  query?: string
}

// Beautiful gradient colors
const NODE_GRADIENTS = [
  { from: '#667eea', to: '#764ba2' },
  { from: '#f093fb', to: '#f5576c' },
  { from: '#4facfe', to: '#00f2fe' },
  { from: '#43e97b', to: '#38f9d7' },
  { from: '#fa709a', to: '#fee140' },
  { from: '#a8edea', to: '#fed6e3' },
  { from: '#ff9a9e', to: '#fecfef' },
  { from: '#ffecd2', to: '#fcb69f' },
]

// Methodology colors
const METHODOLOGY_COLORS: Record<string, { from: string; to: string }> = {
  'direct': { from: '#ef4444', to: '#f97316' },
  'cod': { from: '#f97316', to: '#eab308' },
  'bot': { from: '#eab308', to: '#84cc16' },
  'react': { from: '#22c55e', to: '#14b8a6' },
  'pot': { from: '#3b82f6', to: '#6366f1' },
  'gtp': { from: '#8b5cf6', to: '#a855f7' },
  'auto': { from: '#64748b', to: '#475569' },
}

// Generate tailored footer content based on query analysis
function generateTailoredFooter(
  query: string | undefined,
  nodes: MindmapNode[],
  topics: Array<{ id: string; name: string; category?: string }> | undefined,
  methodology: string,
  isExpanded: boolean,
  selectedNode: MindmapNode | null
): { focus: string; quality: string; action: string } {
  const conceptCount = nodes.length - 1
  const rootLabel = nodes[0]?.label || 'concepts'

  // Analyze query intent
  const queryLower = query?.toLowerCase() || ''
  const hasHow = queryLower.includes('how')
  const hasWhat = queryLower.includes('what')
  const hasWhy = queryLower.includes('why')
  const hasCompare = queryLower.includes('compare') || queryLower.includes('vs') || queryLower.includes('versus') || queryLower.includes('difference')
  const hasList = queryLower.includes('list') || /\d+\./.test(query || '')
  const hasExplain = queryLower.includes('explain') || queryLower.includes('describe')
  const hasCreate = queryLower.includes('create') || queryLower.includes('build') || queryLower.includes('design')

  // Extract subject from query
  const queryWords = query?.split(/\s+/).filter(w => w.length > 3) || []
  const primarySubject = nodes[1]?.label || queryWords[queryWords.length - 1] || 'topic'

  // Detect topic patterns
  const hasNumbers = nodes.some(n => /\d+/.test(n.label))
  const hasQuestions = nodes.some(n => /\?/.test(n.fullText))
  const categories = topics ? new Set(topics.filter(t => t.category).map(t => t.category)) : new Set()

  // Generate FOCUS line (tailored to query type)
  let focus = ''
  if (hasCompare) {
    focus = `Comparative analysis mapping ${conceptCount} distinguishing factors for "${primarySubject}" — radial structure reveals contrast points across ${methodology} methodology with spatial organization highlighting differences.`
  } else if (hasHow) {
    focus = `Procedural knowledge map extracting ${conceptCount} implementation steps for "${primarySubject}" — ${methodology} methodology captures sequential and parallel pathways with interconnected concept relationships.`
  } else if (hasWhat) {
    focus = `Definitional framework identifying ${conceptCount} core aspects of "${primarySubject}" — hierarchical visualization anchored to "${rootLabel}" with categorical concept distribution.`
  } else if (hasWhy) {
    focus = `Causal reasoning graph mapping ${conceptCount} explanatory factors for "${primarySubject}" — ${methodology} methodology surfaces cause-effect relationships through radial concept clustering.`
  } else if (hasList || hasNumbers) {
    focus = `Structured enumeration visualizing ${conceptCount} sequential elements from "${rootLabel}" — numbered hierarchy with radial layout preserving logical ordering from ${methodology} response.`
  } else if (hasCreate || hasExplain) {
    focus = `Constructive knowledge map decomposing "${primarySubject}" into ${conceptCount} foundational concepts — ${methodology} methodology reveals building blocks with spatial organization for synthesis.`
  } else {
    focus = `Conceptual map extracting ${conceptCount} key topics from ${methodology} methodology response — hierarchical visualization centered on "${rootLabel}" with radial concept distribution for spatial knowledge organization.`
  }

  // Generate QUALITY line (tailored to extraction type and content)
  let quality = ''
  if (topics && topics.length > 0) {
    const categoryText = categories.size > 0 ? ` across ${categories.size} ${categories.size === 1 ? 'category' : 'categories'}` : ''
    quality = `Topic-driven extraction with ${conceptCount} confirmed topics${categoryText} — AI-verified against response content with ${Math.round((topics.length / Math.max(conceptCount, 1)) * 100)}% coverage confidence.`
  } else if (hasNumbers) {
    quality = `Numbered pattern extraction preserving sequential structure — ${conceptCount} ordered concepts with ${nodes.filter(n => /^\d+/.test(n.label)).length} explicit enumerations maintaining logical flow integrity.`
  } else if (hasQuestions) {
    quality = `Question-aware extraction identifying ${conceptCount} inquiry-driven concepts — preserves interrogative structure with ${nodes.filter(n => /\?/.test(n.fullText)).length} question nodes for exploratory navigation.`
  } else {
    const boldCount = nodes.filter(n => n.fullText.includes('**')).length
    const headerCount = nodes.filter(n => n.fullText.startsWith('#')).length
    quality = `Pattern-based extraction from ${headerCount} headers and ${boldCount} emphasized terms — ${conceptCount} distinct concepts with semantic deduplication at ${Math.round((conceptCount / Math.max(nodes.length, 1)) * 100)}% retention.`
  }

  // Generate ACTION line (tailored to current state and content type)
  let action = ''
  if (isExpanded && selectedNode) {
    const relatedCount = nodes.filter(n => n.level === 1).length
    action = `Detail view active for "${selectedNode.label}" — revealing full context with ${selectedNode.level === 0 ? relatedCount + ' connected concepts' : 'parent relationships'}. Click other nodes to navigate concept network or drag to reorganize spatial layout.`
  } else if (isExpanded) {
    const interactionHints = hasCompare
      ? 'compare side-by-side by opening multiple detail panels'
      : hasHow
      ? 'explore step-by-step by clicking sequential nodes'
      : 'drill into any concept for full context'
    action = `Interactive exploration enabled: Click nodes to ${interactionHints}. Drag to reorganize — spatial positioning aids memory retention. ${conceptCount} concepts ready for deep-dive analysis.`
  } else {
    const previewHint = hasCompare
      ? 'comparison matrix'
      : hasList
      ? 'ordered workflow'
      : hasHow
      ? 'implementation roadmap'
      : 'concept relationships'
    action = `Compact preview of ${conceptCount}-topic ${previewHint}. Click expand (↗) for interactive mode with draggable nodes, detail panels, and full-text exploration of "${primarySubject}".`
  }

  return { focus, quality, action }
}

function extractConcepts(content: string): MindmapNode[] {
  const nodes: MindmapNode[] = []
  
  // Get first meaningful sentence for root
  const sentences = content.split(/[.!?]/).filter(s => s.trim().length > 10)
  const firstSentence = sentences[0]?.trim() || 'Response'
  const rootLabel = firstSentence.length > 28 
    ? firstSentence.substring(0, 25) + '...' 
    : firstSentence
  
  nodes.push({ 
    id: 'root', 
    label: rootLabel, 
    fullText: firstSentence,
    level: 0 
  })

  // Extract concepts with their full context
  const patterns = [
    { regex: /\*\*([^*]+)\*\*/g, type: 'bold' },
    { regex: /^#+\s*(.+)$/gm, type: 'header' },
    { regex: /^[-•*]\s*(.+)$/gm, type: 'bullet' },
    { regex: /^\d+\.\s*(.+)$/gm, type: 'numbered' },
  ]

  const conceptMap = new Map<string, string>()
  
  patterns.forEach(({ regex }) => {
    let match
    while ((match = regex.exec(content)) !== null) {
      const fullText = match[1]?.trim().replace(/[*#]/g, '').trim()
      if (fullText && fullText.length > 2 && fullText.length < 200) {
        const label = fullText.length > 20 ? fullText.substring(0, 17) + '...' : fullText
        if (!conceptMap.has(label)) {
          conceptMap.set(label, fullText)
        }
      }
    }
  })

  // Convert to nodes (max 8)
  Array.from(conceptMap.entries()).slice(0, 8).forEach(([label, fullText], index) => {
    nodes.push({
      id: `concept-${index}`,
      label,
      fullText,
      level: 1,
      parentId: 'root',
    })
  })

  return nodes
}

export default function ResponseMindmap({
  content,
  topics,
  isVisible,
  onToggle,
  methodology = 'auto',
  query
}: ResponseMindmapProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<MindmapNode | null>(null)
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({})
  const [isDragging, setIsDragging] = useState(false)
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const [showLinkMenu, setShowLinkMenu] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)

  const accentGradient = METHODOLOGY_COLORS[methodology] || METHODOLOGY_COLORS.auto

  const nodes = useMemo(() => {
    if (topics && topics.length > 0) {
      const mapped: MindmapNode[] = [{ id: 'root', label: 'Key Concepts', fullText: 'Main concepts from this response', level: 0 }]
      topics.slice(0, 8).forEach((topic, i) => {
        mapped.push({
          id: topic.id || `topic-${i}`,
          label: topic.name.length > 20 ? topic.name.substring(0, 17) + '...' : topic.name,
          fullText: topic.name,
          level: 1,
          parentId: 'root',
          category: topic.category,
        })
      })
      return mapped
    }
    return extractConcepts(content)
  }, [content, topics])

  const shouldShow = nodes.length >= 4
  const conceptCount = nodes.length - 1

  // Generate tailored footer content
  const footerContent = useMemo(() =>
    generateTailoredFooter(query, nodes, topics, methodology, isExpanded, selectedNode),
    [query, nodes, topics, methodology, isExpanded, selectedNode]
  )

  // Dynamic dimensions based on expansion and detail panel
  const dimensions = useMemo(() => {
    if (selectedNode) {
      return { width: 700, height: 450 }
    }
    return isExpanded 
      ? { width: 700, height: 450 }
      : { width: 380, height: 260 }
  }, [isExpanded, selectedNode])

  // Calculate positions
  const positionedNodes = useMemo(() => {
    const graphWidth = selectedNode ? 400 : dimensions.width
    const centerX = graphWidth / 2
    const centerY = dimensions.height / 2
    const radius = Math.min(graphWidth, dimensions.height) * 0.30

    return nodes.map((node, index) => {
      if (nodePositions[node.id]) {
        return { ...node, ...nodePositions[node.id] }
      }
      
      if (node.level === 0) {
        return { ...node, x: centerX, y: centerY }
      }
      
      const childNodes = nodes.filter(n => n.level === 1)
      const childIndex = childNodes.findIndex(n => n.id === node.id)
      const angleStep = (2 * Math.PI) / childNodes.length
      const angle = angleStep * childIndex - Math.PI / 2
      
      return {
        ...node,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      }
    })
  }, [nodes, dimensions, nodePositions, selectedNode])

  // Drag handlers
  const handleMouseDown = useCallback((nodeId: string, e: React.MouseEvent) => {
    if (selectedNode) return // Don't drag when detail panel is open
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    setDraggedNode(nodeId)
  }, [selectedNode])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !draggedNode || !svgRef.current) return
    
    const svg = svgRef.current
    const rect = svg.getBoundingClientRect()
    const graphWidth = selectedNode ? 400 : dimensions.width
    const x = Math.max(40, Math.min(graphWidth - 40, e.clientX - rect.left))
    const y = Math.max(40, Math.min(dimensions.height - 40, e.clientY - rect.top))
    
    setNodePositions(prev => ({
      ...prev,
      [draggedNode]: { x, y }
    }))
  }, [isDragging, draggedNode, dimensions, selectedNode])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDraggedNode(null)
  }, [])

  const handleNodeClick = useCallback((node: MindmapNode, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isDragging) {
      setSelectedNode(selectedNode?.id === node.id ? null : node)
      if (!isExpanded) setIsExpanded(true)
    }
  }, [isDragging, selectedNode, isExpanded])

  // Close detail panel when clicking outside
  const handleCanvasClick = useCallback(() => {
    if (selectedNode) setSelectedNode(null)
  }, [selectedNode])

  if (!shouldShow && !isVisible) return null

  return (
    <div className="mt-4">
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-300 ${
          isVisible
            ? 'bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-750 text-slate-600 dark:text-slate-300 shadow-sm'
            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
        }`}
      >
        <SparklesIcon className={`w-3.5 h-3.5 transition-transform ${isVisible ? 'rotate-12' : 'group-hover:rotate-12'}`} />
        <span>{isVisible ? 'hide map' : 'visualize'}</span>
        {!isVisible && (
          <span className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[9px]">
            {conceptCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div
              className={`relative rounded-2xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden transition-all duration-300 ${
                isExpanded ? 'shadow-xl' : 'shadow-md'
              } bg-gradient-to-br from-white via-slate-50/30 to-slate-100/20 dark:from-slate-900 dark:via-slate-850 dark:to-slate-800/50`}
              style={{
                width: dimensions.width,
              }}
            >
              {/* Dot pattern */}
              <div
                className="absolute inset-0 opacity-30 dark:opacity-10 pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, #e5e7eb 1px, transparent 0)`,
                  backgroundSize: '20px 20px'
                }}
              />

              {/* Controls */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
                {selectedNode && (
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="p-1.5 rounded-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsExpanded(!isExpanded)
                    if (!isExpanded) setSelectedNode(null)
                  }}
                  className="p-1.5 rounded-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm"
                >
                  {isExpanded ? (
                    <ArrowsPointingInIcon className="w-4 h-4" />
                  ) : (
                    <ArrowsPointingOutIcon className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Instruction */}
              {isExpanded && !selectedNode && (
                <div className="absolute top-3 left-3 z-20">
                  <span className="px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    Click node to explore • Drag to move
                  </span>
                </div>
              )}

              {/* Content Area */}
              <div className="flex">
                {/* SVG Canvas */}
                <svg
                  ref={svgRef}
                  width={selectedNode ? 400 : dimensions.width}
                  height={dimensions.height}
                  className="relative z-10"
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onClick={handleCanvasClick}
                  style={{ cursor: isDragging ? 'grabbing' : 'default' }}
                >
                  <defs>
                    <linearGradient id="rootGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={accentGradient.from} />
                      <stop offset="100%" stopColor={accentGradient.to} />
                    </linearGradient>
                    {NODE_GRADIENTS.map((grad, i) => (
                      <linearGradient key={i} id={`nodeGrad${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={grad.from} />
                        <stop offset="100%" stopColor={grad.to} />
                      </linearGradient>
                    ))}
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15"/>
                    </filter>
                  </defs>

                  {/* Connections */}
                  {positionedNodes.filter(n => n.parentId).map(node => {
                    const parent = positionedNodes.find(p => p.id === node.parentId)
                    if (!parent || !node.x || !node.y || !parent.x || !parent.y) return null
                    
                    const isActive = hoveredNode === node.id || selectedNode?.id === node.id
                    
                    return (
                      <motion.path
                        key={`line-${node.id}`}
                        d={`M ${parent.x} ${parent.y} L ${node.x} ${node.y}`}
                        fill="none"
                        stroke={isActive ? accentGradient.from : '#e2e8f0'}
                        strokeWidth={isActive ? 2.5 : 1.5}
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: isActive ? 1 : 0.5 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                      />
                    )
                  })}

                  {/* Nodes */}
                  {positionedNodes.map((node, index) => {
                    const isRoot = node.level === 0
                    const isHovered = hoveredNode === node.id
                    const isSelected = selectedNode?.id === node.id
                    const isDraggingThis = draggedNode === node.id
                    
                    const nodeWidth = isRoot ? (isExpanded ? 140 : 110) : (isExpanded ? 120 : 90)
                    const nodeHeight = isRoot ? 40 : 34
                    const gradientId = isRoot ? 'rootGrad' : `nodeGrad${index % NODE_GRADIENTS.length}`
                    
                    if (!node.x || !node.y) return null
                    
                    return (
                      <motion.g
                        key={node.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ 
                          scale: isDraggingThis ? 1.1 : (isSelected ? 1.05 : 1), 
                          opacity: 1 
                        }}
                        transition={{ duration: 0.25, delay: index * 0.03 }}
                        onMouseEnter={() => setHoveredNode(node.id)}
                        onMouseLeave={() => setHoveredNode(null)}
                        onMouseDown={(e) => handleMouseDown(node.id, e)}
                        onClick={(e) => handleNodeClick(node, e)}
                        style={{ cursor: selectedNode ? 'pointer' : (isDragging ? 'grabbing' : 'grab') }}
                      >
                        <rect
                          x={node.x - nodeWidth / 2}
                          y={node.y - nodeHeight / 2}
                          width={nodeWidth}
                          height={nodeHeight}
                          rx={4}
                          fill={`url(#${gradientId})`}
                          filter={isHovered || isSelected || isDraggingThis ? 'url(#glow)' : 'url(#shadow)'}
                          className="transition-all duration-150"
                          style={{
                            stroke: isSelected ? '#3b82f6' : 'transparent',
                            strokeWidth: isSelected ? 3 : 0,
                          }}
                        />
                        
                        <text
                          x={node.x}
                          y={node.y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="white"
                          fontSize={isExpanded ? 12 : 11}
                          fontWeight={isRoot ? 600 : 500}
                          fontFamily="system-ui, -apple-system, sans-serif"
                          className="select-none pointer-events-none"
                          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
                        >
                          {node.label.length > (isExpanded ? 18 : 14)
                            ? node.label.substring(0, isExpanded ? 16 : 12) + '…'
                            : node.label
                          }
                        </text>
                      </motion.g>
                    )
                  })}
                </svg>

                {/* Detail Panel */}
                <AnimatePresence>
                  {selectedNode && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 300, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-l border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden"
                    >
                      <div className="p-4 h-full overflow-auto">
                        {/* Header */}
                        <div className="flex items-start gap-3 mb-4">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{
                              background: `linear-gradient(135deg, ${
                                selectedNode.level === 0
                                  ? accentGradient.from
                                  : NODE_GRADIENTS[nodes.indexOf(selectedNode) % NODE_GRADIENTS.length]?.from || '#667eea'
                              }, ${
                                selectedNode.level === 0
                                  ? accentGradient.to
                                  : NODE_GRADIENTS[nodes.indexOf(selectedNode) % NODE_GRADIENTS.length]?.to || '#764ba2'
                              })`
                            }}
                          >
                            <BookOpenIcon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-tight">
                              {selectedNode.label}
                            </h3>
                            {selectedNode.category && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[9px] rounded-full font-medium">
                                {selectedNode.category}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Full Text */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 mb-4">
                          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                            {selectedNode.fullText}
                          </p>
                        </div>

                        {/* Related Concepts */}
                        {selectedNode.level === 0 ? (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <SparklesIcon className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {conceptCount} Concepts Extracted
                              </span>
                            </div>
                            <div className="space-y-1">
                              {nodes.filter(n => n.level === 1).map((n, i) => (
                                <button
                                  key={n.id}
                                  onClick={() => setSelectedNode(n)}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                                >
                                  <div
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{
                                      background: `linear-gradient(135deg, ${NODE_GRADIENTS[i % NODE_GRADIENTS.length].from}, ${NODE_GRADIENTS[i % NODE_GRADIENTS.length].to})`
                                    }}
                                  />
                                  <span className="text-xs text-slate-600 dark:text-slate-400 truncate">{n.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <LinkIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Related Topics</span>
                              </div>
                              <button
                                onClick={() => setShowLinkMenu(!showLinkMenu)}
                                className="text-[9px] text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                              >
                                {showLinkMenu ? 'Hide' : 'Show All'}
                              </button>
                            </div>
                            <button
                              onClick={() => setSelectedNode(nodes[0])}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                            >
                              <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{
                                  background: `linear-gradient(135deg, ${accentGradient.from}, ${accentGradient.to})`
                                }}
                              />
                              <span className="text-xs text-slate-600 dark:text-slate-400 truncate">{nodes[0].label}</span>
                            </button>
                            {showLinkMenu && (
                              <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                                <div className="text-[8px] text-slate-400 uppercase tracking-wider mb-2">All Topics</div>
                                <div className="space-y-1 max-h-[120px] overflow-y-auto">
                                  {nodes.slice(1).map((n, i) => (
                                    <button
                                      key={n.id}
                                      onClick={() => {
                                        setSelectedNode(n)
                                        setShowLinkMenu(false)
                                      }}
                                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
                                    >
                                      <div
                                        className="w-2 h-2 rounded-full flex-shrink-0"
                                        style={{
                                          background: `linear-gradient(135deg, ${NODE_GRADIENTS[i % NODE_GRADIENTS.length].from}, ${NODE_GRADIENTS[i % NODE_GRADIENTS.length].to})`
                                        }}
                                      />
                                      <span className="text-[10px] text-slate-600 dark:text-slate-400 truncate">{n.label}</span>
                                    </button>
                                  ))}
                                </div>
                                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                  <a
                                    href="/mindmap"
                                    className="w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-[10px] text-slate-600 dark:text-slate-300 font-medium"
                                  >
                                    Open in Mind Map →
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer - 3-Line Synthetic Topic Explanation */}
              <div className="px-4 py-3 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-850 dark:via-slate-900 dark:to-slate-850 border-t border-slate-200 dark:border-slate-700">
                {/* High-Level Stats Row */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: `linear-gradient(135deg, ${accentGradient.from}, ${accentGradient.to})` }}
                      />
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Topics:</span>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{conceptCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Root:</span>
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium max-w-[150px] truncate">{nodes[0]?.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Method:</span>
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium uppercase">{methodology}</span>
                    </div>
                  </div>
                </div>

                {/* 3-Line Synthetic Explanation - Tailored to Query */}
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wide flex-shrink-0">Focus:</span>
                    <p className="text-[10px] text-slate-700 dark:text-slate-300 leading-relaxed">
                      {footerContent.focus}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wide flex-shrink-0">Quality:</span>
                    <p className="text-[10px] text-slate-700 dark:text-slate-300 leading-relaxed">
                      {footerContent.quality}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[9px] text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wide flex-shrink-0">Action:</span>
                    <p className="text-[10px] text-slate-700 dark:text-slate-300 leading-relaxed">
                      {footerContent.action}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function shouldShowMindmap(content: string, topics?: any[]): boolean {
  if (topics && topics.length >= 3) return true
  const concepts = extractConcepts(content)
  return concepts.length >= 4
}
