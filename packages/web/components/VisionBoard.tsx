'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

type BoardNodeType = 'conversation' | 'note' | 'goal' | 'milestone' | 'insight' | 'drawing'

interface BoardNode {
  id: string
  type: BoardNodeType
  x: number
  y: number
  w: number
  h: number
  data: {
    title?: string
    body?: string
    color?: string
    done?: boolean
    points?: { x: number; y: number }[]
    source?: string
  }
  createdAt: number
}

interface Objective {
  id: string
  text: string
  done: boolean
  createdAt: number
}

interface TopicProgress {
  name: string
  category: string
  queryCount: number
  description: string
  connected: string[]
}

interface BoardState {
  nodes: BoardNode[]
  objectives: Objective[]
  camera: { x: number; y: number; zoom: number }
}

const STORAGE_KEY = 'akhai-vision-board'

const NODE_COLORS: Record<BoardNodeType, { bg: string; border: string; label: string; toolbar: string }> = {
  conversation: { bg: '#f8fafc', border: '#94a3b8', label: 'conv', toolbar: 'conversation' },
  note:         { bg: '#fefce8', border: '#ca8a04', label: 'note', toolbar: 'note' },
  goal:         { bg: '#ecfdf5', border: '#059669', label: 'goal', toolbar: 'goal' },
  milestone:    { bg: '#ede9fe', border: '#7c3aed', label: 'mile', toolbar: 'milestone' },
  insight:      { bg: '#fdf2f8', border: '#db2777', label: 'ai', toolbar: 'insight' },
  drawing:      { bg: '#f0f9ff', border: '#0284c7', label: 'draw', toolbar: 'drawing' },
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function loadState(): BoardState {
  if (typeof window === 'undefined') return { nodes: [], objectives: [], camera: { x: 0, y: 0, zoom: 1 } }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { nodes: [], objectives: [], camera: { x: 0, y: 0, zoom: 1 } }
}

let saveTimer: NodeJS.Timeout | null = null
function saveState(state: BoardState) {
  if (typeof window === 'undefined') return
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
  }, 500)
}

function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }

// ── Component ──────────────────────────────────────────────────────────────────

interface VisionBoardProps {
  userId: string | null
}

export default function VisionBoard({ userId }: VisionBoardProps) {
  const [nodes, setNodes] = useState<BoardNode[]>([])
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 })
  const [topics, setTopics] = useState<TopicProgress[]>([])
  const [topicsLoading, setTopicsLoading] = useState(true)

  // Canvas interaction state
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [panning, setPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [editingNode, setEditingNode] = useState<string | null>(null)
  const [newObjText, setNewObjText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const canvasRef = useRef<HTMLDivElement>(null)

  // ── Load persisted state ──
  useEffect(() => {
    const s = loadState()
    setNodes(s.nodes)
    setObjectives(s.objectives)
    setCamera(s.camera)
  }, [])

  // ── Persist on change ──
  useEffect(() => {
    saveState({ nodes, objectives, camera })
  }, [nodes, objectives, camera])

  // ── Fetch progress topics ──
  useEffect(() => {
    setTopicsLoading(true)
    fetch('/api/mindmap/data')
      .then(r => r.json())
      .then(data => {
        const allNodes = data.nodes || []
        const links = data.links || []
        const t = allNodes
          .map((n: any) => {
            const connIds = links
              .filter((l: any) => l.source === n.id || l.target === n.id)
              .map((l: any) => l.source === n.id ? l.target : l.source)
            const connNames = connIds
              .map((id: string) => allNodes.find((nn: any) => nn.id === id)?.name)
              .filter(Boolean)
              .slice(0, 5)
            return {
              name: n.name,
              category: n.category || 'other',
              queryCount: n.queryCount || 0,
              description: n.description || '',
              connected: connNames,
            }
          })
          .sort((a: TopicProgress, b: TopicProgress) => b.queryCount - a.queryCount)
          .slice(0, 20)
        setTopics(t)
      })
      .catch(() => setTopics([]))
      .finally(() => setTopicsLoading(false))
  }, [])

  // ── Canvas helpers ──
  const screenToCanvas = useCallback((sx: number, sy: number) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return { x: sx, y: sy }
    return {
      x: (sx - rect.left - rect.width / 2) / camera.zoom - camera.x,
      y: (sy - rect.top - rect.height / 2) / camera.zoom - camera.y,
    }
  }, [camera])

  const addNode = useCallback((type: BoardNodeType, x?: number, y?: number, data?: Partial<BoardNode['data']>) => {
    const pos = x !== undefined && y !== undefined
      ? { x, y }
      : { x: -camera.x + Math.random() * 200 - 100, y: -camera.y + Math.random() * 200 - 100 }
    const n: BoardNode = {
      id: uid(), type,
      x: pos.x, y: pos.y,
      w: type === 'drawing' ? 200 : type === 'conversation' ? 200 : 180,
      h: type === 'drawing' ? 140 : type === 'conversation' ? 130 : 100,
      data: { title: '', body: '', ...data },
      createdAt: Date.now(),
    }
    setNodes(prev => [...prev, n])
    setSelectedNode(n.id)
    setEditingNode(n.id)
    return n.id
  }, [camera])

  const deleteNode = useCallback((id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id))
    if (selectedNode === id) setSelectedNode(null)
    if (editingNode === id) setEditingNode(null)
  }, [selectedNode, editingNode])

  const updateNodeData = useCallback((id: string, patch: Partial<BoardNode['data']>) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, data: { ...n.data, ...patch } } : n))
  }, [])

  // ── Mouse handlers ──
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).dataset?.canvas) {
      setPanning(true)
      setPanStart({ x: e.clientX - camera.x * camera.zoom, y: e.clientY - camera.y * camera.zoom })
      setSelectedNode(null)
      setEditingNode(null)
    }
  }, [camera])

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (panning) {
      setCamera(prev => ({
        ...prev,
        x: (e.clientX - panStart.x) / prev.zoom,
        y: (e.clientY - panStart.y) / prev.zoom,
      }))
    }
    if (dragging) {
      const pos = screenToCanvas(e.clientX, e.clientY)
      setNodes(prev => prev.map(n =>
        n.id === dragging ? { ...n, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y } : n
      ))
    }
  }, [panning, panStart, dragging, dragOffset, screenToCanvas])

  const handleCanvasMouseUp = useCallback(() => {
    setPanning(false)
    setDragging(null)
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setCamera(prev => ({
      ...prev,
      zoom: Math.max(0.2, Math.min(3, prev.zoom * delta)),
    }))
  }, [])

  const handleNodeMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const pos = screenToCanvas(e.clientX, e.clientY)
    const node = nodes.find(n => n.id === id)
    if (!node) return
    setDragOffset({ x: pos.x - node.x, y: pos.y - node.y })
    setDragging(id)
    setSelectedNode(id)
  }, [nodes, screenToCanvas])

  // ── Drop from sidebars ──
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const type = e.dataTransfer.getData('node-type') as BoardNodeType
    const topicName = e.dataTransfer.getData('topic-name')
    if (!type && !topicName) return
    const pos = screenToCanvas(e.clientX, e.clientY)
    if (topicName) {
      let body = ''
      try {
        const td = JSON.parse(e.dataTransfer.getData('topic-data') || '{}')
        const parts: string[] = []
        if (td.category) parts.push(`[${td.category}]`)
        if (td.queryCount) parts.push(`${td.queryCount} queries`)
        if (td.description) parts.push(td.description)
        if (td.connected?.length) parts.push(`Connected: ${td.connected.join(', ')}`)
        body = parts.join('\n')
      } catch { body = topicName }
      addNode('conversation', pos.x, pos.y, { title: topicName, body })
    } else if (type) {
      addNode(type, pos.x, pos.y)
    }
  }, [screenToCanvas, addNode])

  // ── AI Summary ──
  const handleAISummary = useCallback(async () => {
    const convNodes = nodes.filter(n => n.type === 'conversation' || n.type === 'note' || n.type === 'goal')
    const context = convNodes.map(n => `${n.data.title || ''}: ${n.data.body || ''}`).filter(Boolean).join('\n')
    if (!context.trim() && topics.length === 0) return

    setAiLoading(true)
    try {
      const nodeNames = convNodes.map(n => n.data.title).filter(Boolean).join(', ')
      const topicNames = topics.slice(0, 10).map(t => t.name).join(', ')
      const prompt = `Summarize these research topics and suggest 2 next steps: ${nodeNames || topicNames || 'general research'}\n\nContext:\n${context || '(no additional context)'}`
      const res = await fetch('/api/quick-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: prompt }),
      })
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const data = await res.json()
      const summary = data.response || data.text || data.result || 'Could not generate. Try again.'
      addNode('insight', -camera.x, -camera.y - 60, {
        title: 'AI Summary',
        body: summary,
        color: '#db2777',
      })
    } catch (err) {
      addNode('insight', -camera.x, -camera.y - 60, {
        title: 'AI Summary',
        body: 'Could not generate. Try again.',
        color: '#ef4444',
      })
    } finally {
      setAiLoading(false)
    }
  }, [nodes, topics, camera, addNode])

  // ── Objectives ──
  const addObjective = useCallback(() => {
    if (!newObjText.trim()) return
    setObjectives(prev => [...prev, { id: uid(), text: newObjText.trim(), done: false, createdAt: Date.now() }])
    setNewObjText('')
  }, [newObjText])

  const toggleObjective = useCallback((id: string) => {
    setObjectives(prev => prev.map(o => o.id === id ? { ...o, done: !o.done } : o))
  }, [])

  const deleteObjective = useCallback((id: string) => {
    setObjectives(prev => prev.filter(o => o.id !== id))
  }, [])

  // ── Timeline sparkline data ──
  const sparklineData = useMemo(() => {
    const sorted = [...nodes].sort((a, b) => a.createdAt - b.createdAt)
    if (sorted.length < 2) return []
    const min = sorted[0].createdAt
    const max = sorted[sorted.length - 1].createdAt
    const range = max - min || 1
    return sorted.map(n => ({
      x: ((n.createdAt - min) / range) * 100,
      type: n.type,
    }))
  }, [nodes])

  // ── Max queries for progress bar scaling ──
  const maxQueries = useMemo(() => Math.max(1, ...topics.map(t => t.queryCount)), [topics])

  return (
    <div className="flex flex-col h-full bg-[#fafafa]">
      {/* ── Main 3-column layout ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: Progress Tracker ── */}
        <div className="w-52 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col">
          <div className="px-3 py-2 border-b border-slate-100">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">progress</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {topicsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
              </div>
            ) : topics.length === 0 ? (
              <p className="text-[10px] text-slate-400 text-center py-4">no topics yet</p>
            ) : (
              topics.map((t, i) => (
                <div
                  key={i}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('topic-name', t.name)
                    e.dataTransfer.setData('node-type', 'conversation')
                    e.dataTransfer.setData('topic-data', JSON.stringify(t))
                  }}
                  className="group px-2 py-1.5 rounded-md hover:bg-slate-50 cursor-grab active:cursor-grabbing"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{
                      backgroundColor: t.category === 'technology' ? '#6366f1' : t.category === 'finance' ? '#f59e0b' : t.category === 'health' ? '#db2777' : t.category === 'science' ? '#0284c7' : '#64748b'
                    }} />
                    <span className="text-[10px] text-slate-700 truncate flex-1">{t.name}</span>
                  </div>
                  <div className="mt-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-400 rounded-full transition-all"
                      style={{ width: `${(t.queryCount / maxQueries) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Center: Infinite Canvas ── */}
        <div
          ref={canvasRef}
          className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
          data-canvas="true"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onWheel={handleWheel}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {/* Grid background */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)',
            backgroundSize: `${20 * camera.zoom}px ${20 * camera.zoom}px`,
            backgroundPosition: `${camera.x * camera.zoom + 50}% ${camera.y * camera.zoom + 50}%`,
          }} />

          {/* Transform layer */}
          <div
            className="absolute"
            style={{
              left: '50%', top: '50%',
              transform: `translate(${camera.x * camera.zoom}px, ${camera.y * camera.zoom}px) scale(${camera.zoom})`,
              transformOrigin: '0 0',
            }}
          >
            {nodes.map(node => {
              const style = NODE_COLORS[node.type]
              const isSelected = selectedNode === node.id
              const isEditing = editingNode === node.id
              return (
                <div
                  key={node.id}
                  onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                  onDoubleClick={(e) => { e.stopPropagation(); setEditingNode(node.id) }}
                  className="absolute rounded-lg border shadow-sm select-none"
                  style={{
                    left: node.x, top: node.y,
                    width: node.w, height: node.h,
                    backgroundColor: style.bg,
                    borderColor: isSelected ? '#18181b' : style.border,
                    borderWidth: isSelected ? 2 : 1,
                    zIndex: isSelected ? 10 : 1,
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-2 py-1 border-b" style={{ borderColor: style.border + '40' }}>
                    <span className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: style.border }}>{style.label}</span>
                    {isSelected && (
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNode(node.id) }}
                        className="text-[10px] text-slate-400 hover:text-red-500"
                      >x</button>
                    )}
                  </div>
                  {/* Content */}
                  <div className="px-2 py-1 overflow-hidden" style={{ height: node.h - 28 }}>
                    {isEditing ? (
                      <div className="space-y-1">
                        <input
                          autoFocus
                          value={node.data.title || ''}
                          onChange={(e) => updateNodeData(node.id, { title: e.target.value })}
                          onKeyDown={(e) => { if (e.key === 'Enter') setEditingNode(null) }}
                          placeholder="title"
                          className="w-full text-[10px] font-medium text-slate-800 bg-transparent outline-none border-b border-slate-200 pb-0.5"
                        />
                        <textarea
                          value={node.data.body || ''}
                          onChange={(e) => updateNodeData(node.id, { body: e.target.value })}
                          placeholder="notes..."
                          className="w-full text-[9px] text-slate-600 bg-transparent outline-none resize-none"
                          style={{ height: node.h - 56 }}
                        />
                      </div>
                    ) : (
                      <>
                        <div className="text-[10px] font-medium text-slate-800 truncate">{node.data.title || 'untitled'}</div>
                        <div className="text-[9px] text-slate-500 mt-0.5 overflow-hidden" style={{
                          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as any,
                        }}>{node.data.body || ''}</div>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Canvas toolbar */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/90 backdrop-blur border border-slate-200 rounded-lg px-2 py-1 shadow-sm z-20">
            {([
              { type: 'note' as BoardNodeType, icon: '\u270F' },
              { type: 'goal' as BoardNodeType, icon: '\u25C7' },
              { type: 'milestone' as BoardNodeType, icon: '\u25C8' },
              { type: 'conversation' as BoardNodeType, icon: '\u25CB' },
            ]).map(({ type, icon }) => (
              <button
                key={type}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('node-type', type)}
                onClick={() => addNode(type)}
                className="px-2 py-0.5 rounded text-[9px] font-medium hover:bg-slate-100 transition-colors"
                style={{ color: NODE_COLORS[type].border }}
              >
                {icon} {NODE_COLORS[type].toolbar}
              </button>
            ))}
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <button
              onClick={handleAISummary}
              disabled={aiLoading}
              className="px-2 py-0.5 rounded text-[9px] font-medium text-pink-600 hover:bg-pink-50 transition-colors disabled:opacity-50"
            >
              {aiLoading ? '...' : '◇ AI summary'}
            </button>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <span className="text-[8px] text-slate-400">{Math.round(camera.zoom * 100)}%</span>
          </div>

          {/* Empty state */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-sm text-slate-400">drag topics from the left or click + to add nodes</p>
                <p className="text-[10px] text-slate-300 mt-1">double-click nodes to edit • scroll to zoom</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Objectives ── */}
        <div className="w-52 flex-shrink-0 border-l border-slate-200 bg-white flex flex-col">
          {/* Canvas tools */}
          <div className="flex-none px-2 py-1.5 border-b border-slate-100 flex items-center gap-1">
            <button
              onClick={() => addNode('drawing')}
              className="px-1.5 py-0.5 rounded text-[8px] font-medium text-sky-600 hover:bg-sky-50 transition-colors"
            >
              &#x270E; draw
            </button>
            <button
              onClick={() => {
                const convTitles = nodes.filter(n => n.type === 'conversation').map(n => n.data.title).filter(Boolean)
                if (convTitles.length === 0) return
                addNode('insight', -camera.x + 100, -camera.y, {
                  title: 'Topic Diagram',
                  body: convTitles.join(' → '),
                  color: '#8b5cf6',
                })
              }}
              className="px-1.5 py-0.5 rounded text-[8px] font-medium text-violet-600 hover:bg-violet-50 transition-colors"
            >
              &#x25C8; diagram
            </button>
            <button
              onClick={() => {
                const convNodes = nodes.filter(n => n.type === 'conversation')
                if (convNodes.length === 0) return
                const chartBody = convNodes.map(n => `${n.data.title || 'untitled'}: ${(n.data.body || '').split('\n')[0]}`).join('\n')
                addNode('insight', -camera.x + 100, -camera.y + 80, {
                  title: 'Data Chart',
                  body: chartBody,
                  color: '#10b981',
                })
              }}
              className="px-1.5 py-0.5 rounded text-[8px] font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
            >
              &#x25A5; chart
            </button>
          </div>
          <div className="px-3 py-2 border-b border-slate-100">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">objectives</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {objectives.length === 0 && (
              <p className="text-[10px] text-slate-400 text-center py-4">no objectives yet</p>
            )}
            {objectives.map(obj => (
              <div key={obj.id} className="group flex items-start gap-1.5 px-1.5 py-1 rounded hover:bg-slate-50">
                <button
                  onClick={() => toggleObjective(obj.id)}
                  className="mt-0.5 w-3 h-3 rounded border border-slate-300 flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: obj.done ? '#059669' : 'transparent', borderColor: obj.done ? '#059669' : undefined }}
                >
                  {obj.done && <span className="text-[7px] text-white">✓</span>}
                </button>
                <span className={`text-[10px] flex-1 ${obj.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{obj.text}</span>
                <button
                  onClick={() => deleteObjective(obj.id)}
                  className="text-[9px] text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                >x</button>
              </div>
            ))}
          </div>
          <div className="flex-none p-2 border-t border-slate-100">
            <div className="flex gap-1">
              <input
                value={newObjText}
                onChange={(e) => setNewObjText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addObjective() }}
                placeholder="add objective..."
                className="flex-1 text-[10px] px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700 outline-none focus:border-slate-400"
              />
              <button
                onClick={addObjective}
                className="px-2 py-1 bg-slate-800 text-white text-[9px] font-medium rounded hover:bg-slate-700"
              >+</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom: Timeline ── */}
      <div className="flex-none border-t border-slate-200 bg-white px-4 flex items-center gap-3" style={{ minHeight: 50 }}>
        <span className="text-[9px] text-slate-400 uppercase tracking-wider">timeline</span>
        <div className="flex-1 h-8 relative">
          {sparklineData.length >= 2 ? (
            <svg viewBox="0 0 100 20" className="w-full h-full" preserveAspectRatio="none">
              {sparklineData.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={10}
                  r={1.5}
                  fill={NODE_COLORS[p.type]?.border || '#94a3b8'}
                  opacity={0.7}
                />
              ))}
              <polyline
                points={sparklineData.map(p => `${p.x},10`).join(' ')}
                fill="none"
                stroke="#94a3b8"
                strokeWidth={0.3}
                opacity={0.4}
              />
            </svg>
          ) : (
            <span className="text-[9px] text-slate-300 absolute inset-0 flex items-center">no timeline data yet</span>
          )}
        </div>
        <span className="text-[9px] text-slate-400">{nodes.length} nodes</span>
      </div>
    </div>
  )
}
