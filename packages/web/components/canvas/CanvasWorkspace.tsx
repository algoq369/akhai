'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { QueryCard } from './QueryCardsPanel'
import type { VisualNode, VisualEdge } from './VisualsPanel'
import type { AIInsight } from './AILayersPanel'
import { useLayerStore } from '@/lib/stores/layer-store'

interface CanvasWorkspaceProps {
  queryCards: QueryCard[]
  visualNodes: VisualNode[]
  visualEdges: VisualEdge[]
  aiInsights?: AIInsight[]
  totalDataPoints?: number
  overallConfidence?: number
  querySynthesis?: string
  onQuerySelect?: (queryId: string) => void
  onNodeSelect?: (nodeId: string) => void
  onInsightSelect?: (insightId: string) => void
  onSwitchToClassic?: () => void
  classicContent?: React.ReactNode
}

type NodeType = 'query' | 'topic' | 'note' | 'config' | 'stat' | 'diagram' | 'chart' | 'drawing'

interface CanvasNode {
  id: string
  type: NodeType
  x: number
  y: number
  w: number
  h: number
  data: any
}

interface Connection { from: string; to: string; color: string }
interface DrawPoint { x: number; y: number }
interface DrawStroke { points: DrawPoint[]; color: string; width: number }

const METHOD_COLORS: Record<string, string> = {
  auto: '#8b5cf6', direct: '#6366f1', cod: '#10b981',
  bot: '#f59e0b', react: '#ef4444', pot: '#0ea5e9', gtp: '#ec4899',
}
const TOPIC_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#0ea5e9', '#8b5cf6', '#ef4444', '#14b8a6']

function getTopicColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return TOPIC_COLORS[Math.abs(hash) % TOPIC_COLORS.length]
}

function extractTopics(text: string): string[] {
  const words = text.match(/[A-Z][a-z]+(?:\s[A-Z][a-z]+)*/g) || []
  return [...new Set(words)].filter(w => w.length > 3 && !['This','That','These','Those','What','When','Where','Which','There','Here'].includes(w)).slice(0, 5)
}

// === LOCAL FALLBACK GENERATORS ===
function generateLocalDiagram(query: string, response: string): any {
  const topics = extractTopics(response)
  if (topics.length === 0) topics.push(query.split(' ').slice(0, 3).join(' '))
  const nodes = topics.map((t, i) => ({ id: `n${i}`, label: t, color: TOPIC_COLORS[i % TOPIC_COLORS.length] }))
  // Central node from query
  const central = { id: 'nc', label: query.slice(0, 32), color: '#6366f1' }
  const edges = nodes.map(n => ({ from: 'nc', to: n.id, label: '' }))
  return { title: query.slice(0, 60), type: 'mindmap', nodes: [central, ...nodes], edges }
}

function generateLocalChart(query: string, response: string): any {
  // Extract numbers from response, or estimate topic relevance
  const numMatches = response.match(/\d+(\.\d+)?%?/g)?.slice(0, 8) || []
  const topics = extractTopics(response).slice(0, 6)
  if (topics.length === 0) topics.push('Main', 'Secondary', 'Other')
  const data = topics.map((t, i) => ({
    label: t,
    value: numMatches[i] ? parseFloat(numMatches[i].replace('%', '')) : Math.round(20 + Math.random() * 60),
    color: TOPIC_COLORS[i % TOPIC_COLORS.length],
  }))
  return { title: query.slice(0, 60), xLabel: 'Topics', yLabel: 'Relevance', data }
}

// === DIAGRAM/CHART GENERATION ===
async function generateVisualization(query: string, response: string, type: 'diagram' | 'chart'): Promise<any> {
  const prompt = type === 'diagram'
    ? `Based on this query and response, generate a Mermaid-style diagram as JSON. Output ONLY valid JSON, no markdown.
Format: { "title": "short title", "type": "flowchart|mindmap|sequence", "nodes": [{"id":"n1","label":"text","color":"#hex"}], "edges": [{"from":"n1","to":"n2","label":"optional"}] }
Query: ${query}
Response: ${response.slice(0, 800)}`
    : `Based on this query and response, extract data for a bar chart as JSON. Output ONLY valid JSON, no markdown.
Format: { "title": "chart title", "xLabel": "x axis", "yLabel": "y axis", "data": [{"label":"item","value":number,"color":"#hex"}] }
If no numeric data exists, estimate reasonable proportional values based on the content.
Query: ${query}
Response: ${response.slice(0, 800)}`

  try {
    const res = await fetch('/api/quick-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: prompt, methodology: 'direct' }),
    })
    if (!res.ok) throw new Error(`API ${res.status}`)
    const data = await res.json()
    if (data.error) throw new Error(data.error)
    const text = data.content || data.response || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
  } catch (e) { console.error('Viz API failed, using local fallback:', e) }
  // Local fallback — always produce something
  return type === 'diagram' ? generateLocalDiagram(query, response) : generateLocalChart(query, response)
}

// === MINI RENDERERS ===
function DiagramRenderer({ data }: { data: any }) {
  if (!data?.nodes) return <div style={{ padding: 10, fontSize: 9, color: '#94a3b8' }}>generating...</div>
  const nodeMap: Record<string, { x: number; y: number; label: string; color: string }> = {}
  const cols = Math.ceil(Math.sqrt(data.nodes.length))
  data.nodes.forEach((n: any, i: number) => {
    nodeMap[n.id] = { x: 30 + (i % cols) * 160, y: 30 + Math.floor(i / cols) * 70, label: n.label, color: n.color || '#6366f1' }
  })
  return (
    <div style={{ padding: '8px 10px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>{data.title || 'Diagram'}</div>
      <svg width="100%" height="100%" viewBox={`0 0 ${cols * 160 + 40} ${Math.ceil(data.nodes.length / cols) * 70 + 40}`} style={{ flex: 1 }}>
        {(data.edges || []).map((e: any, i: number) => {
          const f = nodeMap[e.from], t = nodeMap[e.to]
          return f && t ? <line key={i} x1={f.x + 60} y1={f.y + 18} x2={t.x + 60} y2={t.y + 18} stroke="#cbd5e1" strokeWidth={1.5} markerEnd="url(#arrowhead)" /> : null
        })}
        <defs><marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#cbd5e1" /></marker></defs>
        {data.nodes.map((n: any) => {
          const pos = nodeMap[n.id]
          return (
            <g key={n.id}>
              <rect x={pos.x} y={pos.y} width={120} height={36} rx={6} fill={`${pos.color}15`} stroke={`${pos.color}40`} strokeWidth={1} />
              <text x={pos.x + 60} y={pos.y + 22} textAnchor="middle" fontSize={8} fontWeight={500} fill={pos.color} fontFamily="'JetBrains Mono',monospace">{pos.label.slice(0, 20)}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function ChartRenderer({ data }: { data: any }) {
  if (!data?.data) return <div style={{ padding: 10, fontSize: 9, color: '#94a3b8' }}>generating...</div>
  const maxVal = Math.max(...data.data.map((d: any) => d.value || 0), 1)
  return (
    <div style={{ padding: '8px 10px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>{data.title || 'Chart'}</div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 3, paddingBottom: 16 }}>
        {data.data.map((d: any, i: number) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: 7, color: '#64748b', fontWeight: 600 }}>{d.value}</span>
            <div style={{
              width: '100%', maxWidth: 40,
              height: `${Math.max(8, (d.value / maxVal) * 100)}%`,
              background: d.color || TOPIC_COLORS[i % TOPIC_COLORS.length],
              borderRadius: '3px 3px 0 0', transition: 'height 0.3s',
              minHeight: 8,
            }} />
            <span style={{ fontSize: 6, color: '#94a3b8', textAlign: 'center', lineHeight: 1.1, maxWidth: 50, overflow: 'hidden' }}>{d.label?.slice(0, 16)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// === MAIN COMPONENT ===
export default function CanvasWorkspace({
  queryCards, visualNodes, visualEdges, aiInsights,
  onQuerySelect, onNodeSelect, onInsightSelect, onSwitchToClassic,
}: CanvasWorkspaceProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [nodes, setNodes] = useState<CanvasNode[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [pan, setPan] = useState({ x: 40, y: 40 })
  const [zoom, setZoom] = useState(0.9)
  const [dragging, setDragging] = useState<{ id: string; ox: number; oy: number } | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef({ x: 0, y: 0 })
  const [selected, setSelected] = useState<string | null>(null)
  const [connecting, setConnecting] = useState<{ fromId: string; mx: number; my: number } | null>(null)
  const [tool, setTool] = useState<'select' | 'connect' | 'note' | 'pencil'>('select')
  const [hovered, setHovered] = useState<string | null>(null)
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [generating, setGenerating] = useState<string | null>(null) // "diagram" | "chart" | null
  const autoGenDone = useRef(false)

  // Pencil drawing state
  const [strokes, setStrokes] = useState<DrawStroke[]>([])
  const [currentStroke, setCurrentStroke] = useState<DrawPoint[] | null>(null)
  const [pencilColor, setPencilColor] = useState('#1e293b')

  const weights = useLayerStore((s) => s.weights)
  const activePreset = useLayerStore((s) => s.activePreset)

  // Auto-generate nodes from queryCards
  useEffect(() => {
    if (queryCards.length === 0) return
    const newNodes: CanvasNode[] = []
    const newConns: Connection[] = []
    const topicMap: Record<string, { count: number; nodeId: string }> = {}
    let topicX = 850, topicY = 80

    queryCards.forEach((card, i) => {
      const qId = `q-${card.id}`
      newNodes.push({ id: qId, type: 'query', x: 40, y: 40 + i * 170, w: 320, h: 150, data: { ...card, methodology: card.methodology || 'auto' } })
      const topics = extractTopics(card.response)
      topics.forEach(topic => {
        const tKey = topic.toLowerCase()
        if (!topicMap[tKey]) {
          const tId = `t-${tKey.replace(/\s/g, '-')}`
          topicMap[tKey] = { count: 1, nodeId: tId }
          newNodes.push({ id: tId, type: 'topic', x: topicX + (Math.random() - 0.5) * 120, y: topicY, w: 110, h: 44, data: { name: topic, count: 1, color: getTopicColor(topic) } })
          topicY += 56; if (topicY > 500) { topicY = 60; topicX += 140 }
        } else {
          topicMap[tKey].count++
          const existing = newNodes.find(n => n.id === topicMap[tKey].nodeId)
          if (existing) existing.data.count = topicMap[tKey].count
        }
        newConns.push({ from: qId, to: topicMap[tKey].nodeId, color: getTopicColor(topic) })
      })
    })
    newNodes.push({ id: 'cfg', type: 'config', x: 850, y: 10, w: 160, h: 50, data: { preset: activePreset || 'balanced', weights } })
    newNodes.push({ id: 'stats', type: 'stat', x: 40, y: 40 + queryCards.length * 170 + 20, w: 200, h: 60, data: { queries: queryCards.length, topics: Object.keys(topicMap).length, connections: newConns.length } })
    setNodes(newNodes)
    setConnections(newConns)
  }, [queryCards, activePreset, weights])

  // === GENERATE DIAGRAM/CHART FROM SELECTED QUERY ===
  const handleGenerate = async (type: 'diagram' | 'chart') => {
    const selNode = nodes.find(n => n.id === selected && n.type === 'query')
    if (!selNode) return
    setGenerating(type)
    const vizData = await generateVisualization(selNode.data.query, selNode.data.response, type)
    if (vizData) {
      const newId = `${type}-${Date.now()}`
      const newNode: CanvasNode = {
        id: newId, type, x: selNode.x + selNode.w + 40, y: selNode.y,
        w: type === 'chart' ? 300 : 380, h: type === 'chart' ? 200 : 240,
        data: vizData,
      }
      setNodes(prev => [...prev, newNode])
      setConnections(prev => [...prev, { from: selected!, to: newId, color: '#6366f1' }])
    }
    setGenerating(null)
  }

  // === AUTO-GENERATE DIAGRAM + CHART ON CANVAS LOAD ===
  useEffect(() => {
    if (autoGenDone.current) return
    const queryNodes = nodes.filter(n => n.type === 'query')
    if (queryNodes.length === 0) return
    const hasDiagram = nodes.some(n => n.type === 'diagram')
    const hasChart = nodes.some(n => n.type === 'chart')
    if (hasDiagram && hasChart) return
    autoGenDone.current = true

    // Auto-generate for the most recent query (skip error responses)
    const latest = queryNodes[queryNodes.length - 1]
    const resp = latest.data.response || ''
    const isError = resp.startsWith('Sorry') || resp.startsWith('Error') || resp.length < 80
    if (isError && queryNodes.length === 1) return // Don't auto-gen for solo error queries
    const targetQuery = isError ? queryNodes.find(n => !(n.data.response || '').startsWith('Sorry')) || latest : latest
    const genViz = async () => {
      if (!hasDiagram) {
        const diagData = await generateVisualization(targetQuery.data.query, targetQuery.data.response, 'diagram')
        if (diagData) {
          const dId = `diagram-auto-${Date.now()}`
          setNodes(prev => [...prev, { id: dId, type: 'diagram', x: targetQuery.x + targetQuery.w + 40, y: targetQuery.y, w: 380, h: 240, data: diagData }])
          setConnections(prev => [...prev, { from: targetQuery.id, to: dId, color: '#8b5cf6' }])
        }
      }
      if (!hasChart) {
        const chartData = await generateVisualization(targetQuery.data.query, targetQuery.data.response, 'chart')
        if (chartData) {
          const cId = `chart-auto-${Date.now()}`
          setNodes(prev => [...prev, { id: cId, type: 'chart', x: targetQuery.x + targetQuery.w + 40, y: targetQuery.y + 260, w: 300, h: 200, data: chartData }])
          setConnections(prev => [...prev, { from: targetQuery.id, to: cId, color: '#10b981' }])
        }
      }
    }
    genViz()
  }, [nodes])

  // === MOUSE HANDLERS ===
  const getCanvasPos = (e: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 }
    const rect = canvasRef.current.getBoundingClientRect()
    return { x: (e.clientX - rect.left - pan.x) / zoom, y: (e.clientY - rect.top - pan.y) / zoom }
  }

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-node]')) return
    // Pencil tool — start drawing
    if (tool === 'pencil') {
      const pos = getCanvasPos(e)
      setCurrentStroke([pos])
      return
    }
    // Note tool — place note
    if (tool === 'note' && canvasRef.current) {
      const pos = getCanvasPos(e)
      const id = `note-${Date.now()}`
      setNodes(prev => [...prev, { id, type: 'note', x: pos.x, y: pos.y, w: 200, h: 80, data: { text: 'New note...', color: '#fef3c7' } }])
      setTool('select'); setEditingNote(id); return
    }
    setIsPanning(true)
    panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
    setSelected(null)
  }, [tool, pan, zoom])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y })
    if (dragging && canvasRef.current) {
      const pos = getCanvasPos(e)
      setNodes(prev => prev.map(n => n.id === dragging.id ? { ...n, x: pos.x - dragging.ox, y: pos.y - dragging.oy } : n))
    }
    if (connecting) setConnecting(prev => prev ? { ...prev, mx: e.clientX, my: e.clientY } : null)
    // Pencil — continue stroke
    if (currentStroke && tool === 'pencil') {
      const pos = getCanvasPos(e)
      setCurrentStroke(prev => prev ? [...prev, pos] : null)
    }
  }, [isPanning, dragging, connecting, currentStroke, tool, pan, zoom])

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    // Pencil — finish stroke
    if (currentStroke && currentStroke.length > 1) {
      setStrokes(prev => [...prev, { points: currentStroke, color: pencilColor, width: 2 }])
      setCurrentStroke(null)
    } else { setCurrentStroke(null) }
    // Connect — complete connection
    if (connecting && canvasRef.current) {
      const pos = getCanvasPos(e)
      const target = nodes.find(n => n.id !== connecting.fromId && pos.x >= n.x && pos.x <= n.x + n.w && pos.y >= n.y && pos.y <= n.y + n.h)
      if (target) setConnections(prev => [...prev, { from: connecting.fromId, to: target.id, color: '#94a3b8' }])
      setConnecting(null)
    }
    setIsPanning(false); setDragging(null)
  }, [connecting, currentStroke, pencilColor, nodes, pan, zoom])

  useEffect(() => {
    const el = canvasRef.current; if (!el) return
    const onWheel = (e: WheelEvent) => { e.preventDefault(); setZoom(z => Math.min(2, Math.max(0.3, z - e.deltaY * 0.001))) }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const startDrag = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const node = nodes.find(n => n.id === id); if (!node) return
    if (tool === 'connect') { setConnecting({ fromId: id, mx: e.clientX, my: e.clientY }); return }
    const pos = getCanvasPos(e)
    setDragging({ id, ox: pos.x - node.x, oy: pos.y - node.y }); setSelected(id)
  }

  const getCenter = (id: string) => { const n = nodes.find(nd => nd.id === id); return n ? { x: n.x + n.w / 2, y: n.y + n.h / 2 } : { x: 0, y: 0 } }
  const deleteSelected = () => { if (!selected) return; setNodes(prev => prev.filter(n => n.id !== selected)); setConnections(prev => prev.filter(c => c.from !== selected && c.to !== selected)); setSelected(null) }
  const isConnected = (nodeId: string) => hovered ? connections.some(c => (c.from === hovered && c.to === nodeId) || (c.to === hovered && c.from === nodeId)) : false
  const nodeOpacity = (nodeId: string) => !hovered ? 1 : (nodeId === hovered || isConnected(nodeId)) ? 1 : 0.25
  const selectedIsQuery = selected ? nodes.find(n => n.id === selected)?.type === 'query' : false

  // === RENDER ===
  return (
    <div style={{ width: '100%', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', fontFamily: "'JetBrains Mono','SF Mono',ui-monospace,monospace", background: '#fafbfc' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '5px 14px', borderBottom: '1px solid #f1f5f9', background: 'white', gap: 4, flexShrink: 0, flexWrap: 'wrap' }}>
        <button onClick={onSwitchToClassic} style={{ fontSize: 9, padding: '3px 8px', borderRadius: 3, border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>← chat</button>
        <div style={{ width: 1, height: 14, background: '#e2e8f0', margin: '0 2px' }} />

        {/* Tools */}
        {([
          { id: 'select', icon: '↖', label: 'select' },
          { id: 'pencil', icon: '✏', label: 'pencil' },
          { id: 'connect', icon: '⟶', label: 'connect' },
          { id: 'note', icon: '✎', label: 'note' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTool(t.id)} style={{
            fontSize: 9, padding: '3px 7px', borderRadius: 3,
            border: tool === t.id ? '1px solid #6366f1' : '1px solid transparent',
            background: tool === t.id ? '#6366f108' : 'transparent',
            color: tool === t.id ? '#6366f1' : '#94a3b8', cursor: 'pointer', fontFamily: 'inherit',
          }}>{t.icon} {t.label}</button>
        ))}

        {/* Pencil color picker */}
        {tool === 'pencil' && (
          <div style={{ display: 'flex', gap: 2, marginLeft: 4 }}>
            {['#1e293b', '#6366f1', '#ef4444', '#10b981', '#f59e0b', '#ec4899'].map(c => (
              <button key={c} onClick={() => setPencilColor(c)} style={{
                width: 14, height: 14, borderRadius: '50%', border: pencilColor === c ? '2px solid #1e293b' : '1px solid #e2e8f0',
                background: c, cursor: 'pointer', padding: 0,
              }} />
            ))}
          </div>
        )}

        <div style={{ width: 1, height: 14, background: '#e2e8f0', margin: '0 2px' }} />

        {/* Diagram/Chart generation — only when a query is selected */}
        {selectedIsQuery && (
          <>
            <button onClick={() => handleGenerate('diagram')} disabled={!!generating} style={{
              fontSize: 9, padding: '3px 8px', borderRadius: 3, border: '1px solid #8b5cf6',
              background: generating === 'diagram' ? '#8b5cf615' : 'transparent',
              color: '#8b5cf6', cursor: generating ? 'wait' : 'pointer', fontFamily: 'inherit',
            }}>{generating === 'diagram' ? '◌ generating...' : '◈ diagram'}</button>
            <button onClick={() => handleGenerate('chart')} disabled={!!generating} style={{
              fontSize: 9, padding: '3px 8px', borderRadius: 3, border: '1px solid #10b981',
              background: generating === 'chart' ? '#10b98115' : 'transparent',
              color: '#10b981', cursor: generating ? 'wait' : 'pointer', fontFamily: 'inherit',
            }}>{generating === 'chart' ? '◌ generating...' : '▥ chart'}</button>
          </>
        )}

        {selected && <button onClick={deleteSelected} style={{ fontSize: 9, padding: '3px 7px', borderRadius: 3, border: '1px solid #ef4444', background: '#ef444408', color: '#ef4444', cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>}

        {/* Undo pencil strokes */}
        {strokes.length > 0 && <button onClick={() => setStrokes(prev => prev.slice(0, -1))} style={{ fontSize: 9, padding: '3px 7px', borderRadius: 3, border: '1px solid #94a3b8', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontFamily: 'inherit' }}>↩ undo</button>}

        <span style={{ marginLeft: 'auto', fontSize: 8, color: '#94a3b8' }}>{nodes.length} nodes · {connections.length} links · {strokes.length > 0 ? `${strokes.length} strokes · ` : ''}{Math.round(zoom * 100)}%</span>
      </div>

      {/* Canvas area */}
      <div ref={canvasRef} style={{ flex: 1, overflow: 'hidden', position: 'relative', cursor: tool === 'pencil' ? 'crosshair' : tool === 'note' ? 'crosshair' : tool === 'connect' ? 'crosshair' : isPanning ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={() => { setIsPanning(false); setDragging(null); if (currentStroke) { setStrokes(prev => [...prev, { points: currentStroke, color: pencilColor, width: 2 }]); setCurrentStroke(null) } }}>

        {/* Dot grid */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <defs><pattern id="canvas-grid" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="12" cy="12" r="0.4" fill="#cbd5e1" opacity="0.15" /></pattern></defs>
          <rect width="100%" height="100%" fill="url(#canvas-grid)" />
        </svg>

        {/* Transform layer */}
        <div style={{ transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', position: 'absolute' }}>
          {/* SVG layer: connections + pencil strokes */}
          <svg width="3000" height="2000" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', overflow: 'visible' }}>
            <defs><marker id="ah" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#cbd5e1" /></marker></defs>
            {/* Connection lines */}
            {connections.map((c, i) => {
              const from = getCenter(c.from), to = getCenter(c.to)
              const hl = hovered && (c.from === hovered || c.to === hovered)
              return <line key={`c-${i}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={c.color || '#94a3b8'} strokeWidth={hl ? 2 : 1} strokeOpacity={hovered ? (hl ? 0.7 : 0.08) : 0.25} strokeDasharray={c.color === '#94a3b8' ? '4 4' : 'none'} style={{ transition: 'all 0.15s' }} />
            })}
            {/* Active connection drag line */}
            {connecting && (() => { const from = getCenter(connecting.fromId); const rect = canvasRef.current?.getBoundingClientRect(); if (!rect) return null; const tx = (connecting.mx - rect.left - pan.x) / zoom; const ty = (connecting.my - rect.top - pan.y) / zoom; return <line x1={from.x} y1={from.y} x2={tx} y2={ty} stroke="#6366f1" strokeWidth={2} strokeDasharray="6 3" /> })()}
            {/* Pencil strokes */}
            {strokes.map((stroke, si) => (
              <polyline key={`s-${si}`} points={stroke.points.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke={stroke.color} strokeWidth={stroke.width} strokeLinecap="round" strokeLinejoin="round" />
            ))}
            {/* Current stroke being drawn */}
            {currentStroke && currentStroke.length > 1 && (
              <polyline points={currentStroke.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke={pencilColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
            )}
          </svg>

          {/* Nodes */}
          {nodes.map(node => {
            const styles: Record<string, React.CSSProperties> = {
              query: { background: 'rgba(255,255,255,0.97)', border: selected === node.id ? '1.5px solid #6366f1' : '1px solid #e2e8f0', borderRadius: 6 },
              topic: { background: `${node.data.color}10`, border: selected === node.id ? `1.5px solid ${node.data.color}` : `1px solid ${node.data.color}30`, borderRadius: 20 },
              note: { background: node.data.color || '#fef3c7', border: selected === node.id ? '1.5px dashed #d97706' : '1px dashed #e5e7eb', borderRadius: 6 },
              stat: { background: 'rgba(255,255,255,0.95)', border: '1px solid #f1f5f9', borderRadius: 8 },
              config: { background: 'rgba(255,255,255,0.95)', border: '1px solid #e2e8f020', borderRadius: 8 },
              diagram: { background: 'rgba(255,255,255,0.97)', border: selected === node.id ? '1.5px solid #8b5cf6' : '1px solid #e2e8f0', borderRadius: 8 },
              chart: { background: 'rgba(255,255,255,0.97)', border: selected === node.id ? '1.5px solid #10b981' : '1px solid #e2e8f0', borderRadius: 8 },
              drawing: { background: 'transparent', border: 'none', borderRadius: 0 },
            }
            return (
              <div key={node.id} data-node="true" onMouseDown={e => startDrag(node.id, e)} onMouseEnter={() => setHovered(node.id)} onMouseLeave={() => setHovered(null)}
                style={{ position: 'absolute', left: node.x, top: node.y, width: node.w, height: node.h, ...styles[node.type], cursor: tool === 'connect' ? 'crosshair' : 'move', opacity: nodeOpacity(node.id), transition: dragging?.id === node.id ? 'none' : 'opacity 0.15s, box-shadow 0.15s', boxShadow: selected === node.id ? '0 2px 12px rgba(0,0,0,0.06)' : 'none', zIndex: selected === node.id ? 10 : 1, overflow: 'hidden' }}>
                {/* Query node */}
                {node.type === 'query' && (() => {
                  const mc = METHOD_COLORS[node.data.methodology] || '#94a3b8'
                  return (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '10px 12px', borderLeft: `3px solid ${mc}` }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#1e293b', marginBottom: 4, lineHeight: 1.3 }}>{node.data.query}</div>
                      <div style={{ fontSize: 9, color: '#94a3b8', lineHeight: 1.4, flex: 1, overflow: 'hidden' }}>{node.data.response?.slice(0, 100)}...</div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}>
                        <span style={{ fontSize: 7, padding: '1px 5px', borderRadius: 2, background: `${mc}12`, color: mc, fontWeight: 600, textTransform: 'uppercase' }}>{node.data.methodology}</span>
                        <span style={{ fontSize: 7, color: '#cbd5e1', marginLeft: 'auto' }}>{node.data.timestamp ? new Date(node.data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                      </div>
                      {selected === node.id && (
                        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                          <button onClick={(e) => { e.stopPropagation(); onQuerySelect?.(node.data.id) }} style={{ fontSize: 7, padding: '2px 6px', border: '1px solid #e2e8f0', borderRadius: 3, background: 'white', color: '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>view in chat →</button>
                          <button onClick={(e) => { e.stopPropagation(); handleGenerate('diagram') }} style={{ fontSize: 7, padding: '2px 6px', border: '1px solid #8b5cf6', borderRadius: 3, background: '#8b5cf608', color: '#8b5cf6', cursor: 'pointer', fontFamily: 'inherit' }}>◈ diagram</button>
                          <button onClick={(e) => { e.stopPropagation(); handleGenerate('chart') }} style={{ fontSize: 7, padding: '2px 6px', border: '1px solid #10b981', borderRadius: 3, background: '#10b98108', color: '#10b981', cursor: 'pointer', fontFamily: 'inherit' }}>▥ chart</button>
                        </div>
                      )}
                    </div>
                  )
                })()}
                {/* Topic node */}
                {node.type === 'topic' && (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: node.data.color }} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: node.data.color }}>{node.data.name}</span>
                    {node.data.count > 1 && <span style={{ fontSize: 8, color: '#cbd5e1' }}>×{node.data.count}</span>}
                  </div>
                )}

                {/* Note node */}
                {node.type === 'note' && (
                  <div onDoubleClick={() => setEditingNote(node.id)} style={{ height: '100%', padding: '8px 10px' }}>
                    {editingNote === node.id ? (
                      <textarea autoFocus value={node.data.text} onChange={e => setNodes(prev => prev.map(n => n.id === node.id ? { ...n, data: { ...n.data, text: e.target.value } } : n))} onBlur={() => setEditingNote(null)}
                        style={{ width: '100%', height: '100%', border: 'none', background: 'transparent', fontSize: 9, color: '#78716c', fontFamily: 'inherit', resize: 'none', outline: 'none', lineHeight: 1.5 }} />
                    ) : <div style={{ fontSize: 9, color: '#78716c', lineHeight: 1.5 }}>{node.data.text}</div>}
                  </div>
                )}

                {/* Stat node */}
                {node.type === 'stat' && (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '0 10px' }}>
                    {[{ l: 'queries', v: node.data.queries }, { l: 'topics', v: node.data.topics }, { l: 'links', v: node.data.connections }].map((s: any) => (
                      <div key={s.l} style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{s.v}</div><div style={{ fontSize: 7, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.l}</div></div>
                    ))}
                  </div>
                )}

                {/* Config node */}
                {node.type === 'config' && (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 8px', gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#6366f1' }}>{node.data.preset || 'balanced'}</span>
                  </div>
                )}

                {/* Diagram node */}
                {node.type === 'diagram' && <DiagramRenderer data={node.data} />}

                {/* Chart node */}
                {node.type === 'chart' && <ChartRenderer data={node.data} />}

                {/* Connect handle */}
                {tool === 'connect' && <div style={{ position: 'absolute', right: -3, top: '50%', transform: 'translateY(-50%)', width: 6, height: 6, borderRadius: '50%', background: '#6366f1', border: '1.5px solid white' }} />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom hints */}
      <div style={{ padding: '3px 14px', borderTop: '1px solid #f1f5f9', background: 'white', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 7, color: '#cbd5e1' }}>
          {tool === 'pencil' ? 'draw on canvas · pick color above · ↩ to undo' : tool === 'connect' ? 'click node → drag to target' : tool === 'note' ? 'click to place note' : 'drag to move · scroll to zoom · select query → ◈ diagram or ▥ chart'}
        </span>
        <span style={{ fontSize: 7, color: '#cbd5e1', marginLeft: 'auto' }}>akhai canvas</span>
      </div>
    </div>
  )
}
