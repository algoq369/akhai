'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

type BoardNodeType = 'conversation' | 'note' | 'goal' | 'milestone' | 'insight' | 'drawing' | 'diagram' | 'chart' | 'table' | 'timelineViz' | 'radar'

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
    vizData?: any
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

const TOPIC_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#0ea5e9', '#8b5cf6', '#ef4444', '#14b8a6']

const NODE_COLORS: Record<BoardNodeType, { bg: string; border: string; label: string }> = {
  conversation: { bg: '#f8fafc', border: '#94a3b8', label: 'conv' },
  note:         { bg: '#fefce8', border: '#ca8a04', label: 'note' },
  goal:         { bg: '#ecfdf5', border: '#059669', label: 'goal' },
  milestone:    { bg: '#ede9fe', border: '#7c3aed', label: 'mile' },
  insight:      { bg: '#fdf2f8', border: '#db2777', label: 'ai' },
  drawing:      { bg: '#f0f9ff', border: '#0284c7', label: 'draw' },
  diagram:      { bg: '#eef2ff', border: '#6366f1', label: 'diagram' },
  chart:        { bg: '#ecfdf5', border: '#10b981', label: 'chart' },
  table:        { bg: '#fef3c7', border: '#f59e0b', label: 'table' },
  timelineViz:  { bg: '#fdf4ff', border: '#c026d3', label: 'timeline' },
  radar:        { bg: '#f0f9ff', border: '#0ea5e9', label: 'radar' },
}

const VIZ_SIZES: Partial<Record<BoardNodeType, { w: number; h: number }>> = {
  diagram: { w: 380, h: 280 },
  chart: { w: 320, h: 240 },
  table: { w: 300, h: 200 },
  timelineViz: { w: 380, h: 160 },
  radar: { w: 300, h: 280 },
}

// ── Viz Helpers (from CanvasWorkspace) ──────────────────────────────────────────

function extractTopics(text: string): string[] {
  const words = text.match(/[A-Z][a-z]+(?:\s[A-Z][a-z]+)*/g) || []
  return [...new Set(words)].filter(w => w.length > 3 && !['This','That','These','Those','What','When','Where','Which','There','Here','Sorry','Please','Error'].includes(w)).slice(0, 5)
}

function generateLocalDiagram(query: string, response: string): any {
  const topics = extractTopics(response)
  if (topics.length === 0) topics.push(query.split(' ').slice(0, 3).join(' '))
  const nodes = topics.map((t, i) => ({ id: `n${i}`, label: t, color: TOPIC_COLORS[i % TOPIC_COLORS.length] }))
  const central = { id: 'nc', label: query.slice(0, 32), color: '#6366f1' }
  const edges = nodes.map(n => ({ from: 'nc', to: n.id, label: '' }))
  return { title: query.slice(0, 60), type: 'mindmap', nodes: [central, ...nodes], edges }
}

function generateLocalChart(query: string, response: string): any {
  const numMatches = response.match(/\d+(\.\d+)?%?/g)?.slice(0, 8) || []
  const topics = extractTopics(response).slice(0, 6)
  if (topics.length === 0) topics.push('Main', 'Secondary', 'Other')
  return { title: query.slice(0, 60), xLabel: 'Topics', yLabel: 'Relevance', data: topics.map((t, i) => ({
    label: t, value: numMatches[i] ? parseFloat(numMatches[i].replace('%', '')) : Math.round(20 + Math.random() * 60), color: TOPIC_COLORS[i % TOPIC_COLORS.length],
  })) }
}

function generateLocalTable(query: string, response: string): any {
  const topics = extractTopics(response).slice(0, 5)
  if (topics.length === 0) topics.push('Item 1', 'Item 2', 'Item 3')
  return { title: query.slice(0, 60), columns: ['Entity', 'Relevance', 'Category'], rows: topics.map((t, i) => ({ entity: t, relevance: Math.round(60 + Math.random() * 40) + '%', category: ['Primary', 'Secondary', 'Tertiary'][i % 3] })) }
}

function generateLocalTimeline(query: string, response: string): any {
  const topics = extractTopics(response).slice(0, 6)
  if (topics.length === 0) topics.push('Start', 'Middle', 'End')
  return { title: query.slice(0, 60), events: topics.map((t, i) => ({ label: t, description: '', color: TOPIC_COLORS[i % TOPIC_COLORS.length] })) }
}

function generateLocalRadar(query: string, response: string): any {
  const topics = extractTopics(response).slice(0, 6)
  if (topics.length < 3) topics.push('Dimension A', 'Dimension B', 'Dimension C')
  return { title: query.slice(0, 60), axes: topics.map(t => ({ label: t, value: Math.round(30 + Math.random() * 70) })) }
}

type VizType = 'diagram' | 'chart' | 'table' | 'timeline' | 'radar'

async function generateVisualization(query: string, response: string, type: VizType): Promise<any> {
  try {
    const res = await fetch('/api/canvas-viz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, response: response.slice(0, 800), type }),
    })
    if (!res.ok) throw new Error(`API ${res.status}`)
    const data = await res.json()
    if (data.error) throw new Error(data.error)
    if (data.viz) return data.viz
  } catch (e) { console.error('Viz API failed, using local fallback:', e) }
  const fallbacks: Record<VizType, () => any> = {
    diagram: () => generateLocalDiagram(query, response),
    chart: () => generateLocalChart(query, response),
    table: () => generateLocalTable(query, response),
    timeline: () => generateLocalTimeline(query, response),
    radar: () => generateLocalRadar(query, response),
  }
  return fallbacks[type]()
}

// ── Mini Renderers (from CanvasWorkspace) ──────────────────────────────────────

function DiagramRenderer({ data }: { data: any }) {
  if (!data?.nodes) return <div style={{ padding: 10, fontSize: 9, color: '#94a3b8' }}>generating...</div>
  const cx = 200, cy = 140, radius = 110
  const allNodes = data.nodes || []
  const central = allNodes[0]
  const children = allNodes.slice(1)
  const nodePos: Record<string, { x: number; y: number }> = {}
  if (central) nodePos[central.id] = { x: cx, y: cy }
  children.forEach((n: any, i: number) => {
    const angle = (i / Math.max(children.length, 1)) * Math.PI * 2 - Math.PI / 2
    nodePos[n.id] = { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius }
  })
  return (
    <div style={{ padding: '8px 10px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#1e293b', marginBottom: 6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', wordBreak: 'break-word' }}>{data.title || 'Diagram'}</div>
      <svg width="100%" height="100%" viewBox="0 0 400 300" style={{ flex: 1 }}>
        {(data.edges || []).map((e: any, i: number) => {
          const f = nodePos[e.from], t = nodePos[e.to]
          if (!f || !t) return null
          const mx = (f.x + t.x) / 2, my = (f.y + t.y) / 2
          const cpx = mx + (cy - my) * 0.3, cpy = my + (mx - cx) * 0.3
          const tNode = allNodes.find((n: any) => n.id === e.to)
          return <path key={i} d={`M ${f.x} ${f.y} Q ${cpx} ${cpy} ${t.x} ${t.y}`} fill="none" stroke={`${tNode?.color || '#cbd5e1'}66`} strokeWidth={1.5} />
        })}
        {central && (
          <g>
            <rect x={cx - 70} y={cy - 24} width={140} height={48} rx={8} fill={`${central.color || '#6366f1'}15`} stroke={`${central.color || '#6366f1'}50`} strokeWidth={1.5} />
            <text x={cx} y={cy + 5} textAnchor="middle" fontSize={11} fontWeight={700} fill={central.color || '#6366f1'} fontFamily="'JetBrains Mono',monospace">{central.label?.slice(0, 22)}</text>
          </g>
        )}
        {children.map((n: any) => {
          const pos = nodePos[n.id]; const c = n.color || '#6366f1'
          return (
            <g key={n.id}>
              <rect x={pos.x - 52} y={pos.y - 16} width={104} height={32} rx={6} fill={`${c}12`} stroke={`${c}40`} strokeWidth={1} />
              <text x={pos.x} y={pos.y + 4} textAnchor="middle" fontSize={9} fontWeight={500} fill={c} fontFamily="'JetBrains Mono',monospace">{n.label?.slice(0, 18)}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function ChartRenderer({ data }: { data: any }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMounted(true), 50); return () => clearTimeout(t) }, [])
  if (!data?.data) return <div style={{ padding: 10, fontSize: 9, color: '#94a3b8' }}>generating...</div>
  const maxVal = Math.max(...data.data.map((d: any) => d.value || 0), 1)
  const chartH = 120, chartL = 28, chartR = 8, chartT = 6, chartB = 28
  return (
    <div style={{ padding: '8px 10px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>{data.title || 'Chart'}</div>
      <div style={{ flex: 1, position: 'relative' }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${chartL + (data.data.length * 36) + chartR} ${chartT + chartH + chartB}`} preserveAspectRatio="xMidYMid meet">
          <line x1={chartL} y1={chartT} x2={chartL} y2={chartT + chartH} stroke="#e2e8f0" strokeWidth={0.5} />
          <line x1={chartL} y1={chartT + chartH} x2={chartL + data.data.length * 36} y2={chartT + chartH} stroke="#e2e8f0" strokeWidth={0.5} />
          {data.data.map((d: any, i: number) => {
            const barColor = d.color || TOPIC_COLORS[i % TOPIC_COLORS.length]
            const pct = Math.max(0.02, (d.value || 0) / maxVal)
            const barH = mounted ? pct * chartH : 0
            const barW = 22, barX = chartL + i * 36 + 7, barY = chartT + chartH - barH
            return (
              <g key={i}>
                <rect x={barX} y={barY} width={barW} height={barH} rx={4} fill={barColor} opacity={0.85} style={{ transition: 'height 0.6s ease-out, y 0.6s ease-out' }} />
                <text x={barX + barW / 2} y={barY - 4} textAnchor="middle" fontSize={7} fontWeight={600} fill="#64748b" fontFamily="'JetBrains Mono',monospace">{d.value}</text>
                <text x={barX + barW / 2} y={chartT + chartH + 8} textAnchor="end" fontSize={6} fill="#94a3b8" fontFamily="'JetBrains Mono',monospace" transform={`rotate(-30 ${barX + barW / 2} ${chartT + chartH + 8})`}>{d.label?.slice(0, 20)}</text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

function TableRenderer({ data }: { data: any }) {
  if (!data?.rows) return <div style={{ padding: 10, fontSize: 9, color: '#94a3b8' }}>generating...</div>
  const cols = data.columns || Object.keys(data.rows[0] || {})
  return (
    <div style={{ padding: '8px 10px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>{data.title || 'Table'}</div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 8, fontFamily: "'JetBrains Mono',monospace" }}>
          <thead>
            <tr>{cols.map((c: string, i: number) => (
              <th key={i} style={{ padding: '3px 6px', textAlign: 'left', background: '#f59e0b15', color: '#92400e', fontWeight: 600, fontSize: 7, textTransform: 'uppercase', borderBottom: '1px solid #f59e0b30' }}>{c}</th>
            ))}</tr>
          </thead>
          <tbody>
            {data.rows.map((row: any, ri: number) => {
              const vals = Array.isArray(row) ? row : cols.map((c: string) => row[c.toLowerCase()] ?? row[c] ?? '')
              return (
                <tr key={ri} style={{ background: ri % 2 === 0 ? '#f8fafc' : 'white' }}>
                  {vals.map((v: any, ci: number) => (
                    <td key={ci} style={{ padding: '3px 6px', color: '#475569', borderBottom: '1px solid #f1f5f9' }}>{String(v).slice(0, 50)}</td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TimelineVizRenderer({ data }: { data: any }) {
  if (!data?.events) return <div style={{ padding: 10, fontSize: 9, color: '#94a3b8' }}>generating...</div>
  const events = data.events.slice(0, 8)
  const spacing = Math.min(80, 360 / Math.max(events.length, 1))
  const vbW = Math.min(500, events.length * spacing + 40)
  return (
    <div style={{ padding: '8px 10px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>{data.title || 'Timeline'}</div>
      <svg width="100%" height="100%" viewBox={`0 0 ${vbW} 80`} preserveAspectRatio="xMidYMid meet" style={{ flex: 1 }}>
        <line x1={20} y1={40} x2={events.length * spacing + 20} y2={40} stroke="#e2e8f0" strokeWidth={2} />
        {events.map((ev: any, i: number) => {
          const x = 20 + i * spacing + spacing / 2
          const color = ev.color || TOPIC_COLORS[i % TOPIC_COLORS.length]
          const above = i % 2 === 0
          return (
            <g key={i}>
              <circle cx={x} cy={40} r={5} fill={color} stroke="white" strokeWidth={1.5} />
              <text x={x} y={above ? 18 : 64} textAnchor="middle" fontSize={8} fontWeight={500} fill="#475569" fontFamily="'JetBrains Mono',monospace">{ev.label?.slice(0, 30)}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function RadarRenderer({ data }: { data: any }) {
  if (!data?.axes) return <div style={{ padding: 10, fontSize: 9, color: '#94a3b8' }}>generating...</div>
  const axes = data.axes.slice(0, 8)
  const cx = 150, cy = 120, maxR = 90
  const rings = [25, 50, 75, 100]
  const angleStep = (Math.PI * 2) / axes.length
  const dataPoints = axes.map((a: any, i: number) => {
    const angle = i * angleStep - Math.PI / 2
    const r = (Math.min(a.value, 100) / 100) * maxR
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r }
  })
  const polygon = dataPoints.map((p: any) => `${p.x},${p.y}`).join(' ')
  const c = data.color || '#6366f1'
  return (
    <div style={{ padding: '8px 10px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>{data.title || 'Radar'}</div>
      <svg width="100%" height="100%" viewBox="0 0 300 250" preserveAspectRatio="xMidYMid meet" style={{ flex: 1 }}>
        {rings.map(r => <circle key={r} cx={cx} cy={cy} r={(r / 100) * maxR} fill="none" stroke="#f1f5f9" strokeWidth={0.5} />)}
        {axes.map((a: any, i: number) => {
          const angle = i * angleStep - Math.PI / 2
          const lx = cx + Math.cos(angle) * (maxR + 16), ly = cy + Math.sin(angle) * (maxR + 16)
          return (
            <g key={i}>
              <line x1={cx} y1={cy} x2={cx + Math.cos(angle) * maxR} y2={cy + Math.sin(angle) * maxR} stroke="#e2e8f0" strokeWidth={0.5} />
              <text x={lx} y={ly + 3} textAnchor="middle" fontSize={7} fill="#64748b" fontFamily="'JetBrains Mono',monospace">{a.label?.slice(0, 12)}</text>
            </g>
          )
        })}
        <polygon points={polygon} fill={`${c}20`} stroke={c} strokeWidth={2} />
        {dataPoints.map((p: any, i: number) => <circle key={i} cx={p.x} cy={p.y} r={3} fill={c} stroke="white" strokeWidth={1} />)}
      </svg>
    </div>
  )
}

const VIZ_RENDERERS: Partial<Record<BoardNodeType, React.FC<{ data: any }>>> = {
  diagram: DiagramRenderer,
  chart: ChartRenderer,
  table: TableRenderer,
  timelineViz: TimelineVizRenderer,
  radar: RadarRenderer,
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function loadState(): BoardState {
  if (typeof window === 'undefined') return { nodes: [], objectives: [], camera: { x: 0, y: 0, zoom: 1 } }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      // Filter out malformed nodes and ensure required fields
      parsed.nodes = (parsed.nodes || [])
        .filter((n: any) => n && n.id && n.type)
        .map((n: any) => ({
          ...n,
          type: n.type || 'note',
          data: n.data || {},
          w: n.w || 200,
          h: n.h || 120,
          x: n.x ?? 0,
          y: n.y ?? 0,
          createdAt: n.createdAt || Date.now(),
        }))
      parsed.objectives = (parsed.objectives || []).filter((o: any) => o && o.id)
      parsed.camera = parsed.camera || { x: 0, y: 0, zoom: 1 }
      return parsed
    }
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
  const initState = loadState()
  const [nodes, setNodes] = useState<BoardNode[]>(initState.nodes)
  const [objectives, setObjectives] = useState<Objective[]>(initState.objectives)
  const [camera, setCamera] = useState(initState.camera)
  const boardInitRef = useRef(false)
  const [topics, setTopics] = useState<TopicProgress[]>([])
  const [topicsLoading, setTopicsLoading] = useState(true)

  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [panning, setPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [editingNode, setEditingNode] = useState<string | null>(null)
  const [newObjText, setNewObjText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [vizLoading, setVizLoading] = useState<string | null>(null)

  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!boardInitRef.current) { boardInitRef.current = true; return }
    saveState({ nodes, objectives, camera })
  }, [nodes, objectives, camera])

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
            return { name: n.name, category: n.category || 'other', queryCount: n.queryCount || 0, description: n.description || '', connected: connNames }
          })
          .sort((a: TopicProgress, b: TopicProgress) => b.queryCount - a.queryCount)
          .slice(0, 20)
        setTopics(t)
      })
      .catch(() => setTopics([]))
      .finally(() => setTopicsLoading(false))
  }, [])

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
    const vizSize = VIZ_SIZES[type]
    const n: BoardNode = {
      id: uid(), type,
      x: pos.x, y: pos.y,
      w: vizSize?.w || (type === 'drawing' ? 200 : type === 'conversation' ? 280 : 180),
      h: vizSize?.h || (type === 'drawing' ? 140 : type === 'conversation' ? 160 : 100),
      data: { title: '', body: '', ...data },
      createdAt: Date.now(),
    }
    setNodes(prev => [...prev, n])
    setSelectedNode(n.id)
    if (!vizSize) setEditingNode(n.id)
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

  // ── Viz generation ──
  const handleGenerateViz = useCallback(async (vizType: VizType) => {
    const convNodes = nodes.filter(n => n.type === 'conversation' || n.type === 'note' || n.type === 'goal')
    const query = convNodes.map(n => n.data?.title).filter(Boolean).join(', ') || topics.slice(0, 5).map(t => t.name).join(', ')
    const response = convNodes.map(n => `${n.data?.title || ''}: ${n.data?.body || ''}`).filter(Boolean).join('\n') || topics.slice(0, 10).map(t => `${t.name}: ${t.description}`).join('\n')
    if (!query) return

    const nodeType: BoardNodeType = vizType === 'timeline' ? 'timelineViz' : vizType as BoardNodeType
    setVizLoading(vizType)
    try {
      const vizData = await generateVisualization(query, response, vizType)
      addNode(nodeType, -camera.x, -camera.y, { vizData })
    } catch {
      addNode('insight', -camera.x, -camera.y, { title: `${vizType} failed`, body: 'Could not generate. Try again.', color: '#ef4444' })
    } finally {
      setVizLoading(null)
    }
  }, [nodes, topics, camera, addNode])

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
      setCamera(prev => ({ ...prev, x: (e.clientX - panStart.x) / prev.zoom, y: (e.clientY - panStart.y) / prev.zoom }))
    }
    if (dragging) {
      const pos = screenToCanvas(e.clientX, e.clientY)
      setNodes(prev => prev.map(n => n.id === dragging ? { ...n, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y } : n))
    }
  }, [panning, panStart, dragging, dragOffset, screenToCanvas])

  const handleCanvasMouseUp = useCallback(() => { setPanning(false); setDragging(null) }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    setCamera(prev => ({ ...prev, zoom: Math.max(0.2, Math.min(3, prev.zoom * (e.deltaY > 0 ? 0.9 : 1.1))) }))
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
    const context = convNodes.map(n => `${n.data?.title || ''}: ${n.data?.body || ''}`).filter(Boolean).join('\n')
    if (!context.trim() && topics.length === 0) return
    setAiLoading(true)
    try {
      const nodeNames = convNodes.map(n => n.data?.title).filter(Boolean).join(', ')
      const topicNames = topics.slice(0, 10).map(t => t.name).join(', ')
      const prompt = `Summarize these research topics and suggest 2 next steps: ${nodeNames || topicNames || 'general research'}\n\nContext:\n${context || '(no additional context)'}`
      const res = await fetch('/api/quick-query', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: prompt }) })
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const data = await res.json()
      addNode('insight', -camera.x, -camera.y - 60, { title: 'AI Summary', body: data.response || data.text || data.result || 'Could not generate. Try again.', color: '#db2777' })
    } catch {
      addNode('insight', -camera.x, -camera.y - 60, { title: 'AI Summary', body: 'Could not generate. Try again.', color: '#ef4444' })
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

  // ── Calendar Timeline ──
  const PINS_KEY = 'akhai-vision-pins'
  const [timelinePins, setTimelinePins] = useState<{date: string, label: string}[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem('akhai-vision-pins')
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  })
  const pinsInitRef = useRef(false)
  const [hoveredPin, setHoveredPin] = useState<{label: string, x: number, y: number} | null>(null)
  const [pinPopup, setPinPopup] = useState<{date: string, displayDate: string, x: number} | null>(null)
  const [pinLabel, setPinLabel] = useState('')
  const timelineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!pinsInitRef.current) { pinsInitRef.current = true; return }
    try { localStorage.setItem(PINS_KEY, JSON.stringify(timelinePins)) } catch {}
  }, [timelinePins])

  const calendarData = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    let minDate: Date
    if (nodes.length > 0) {
      const earliest = Math.min(...nodes.map(n => n.createdAt))
      minDate = new Date(earliest)
      minDate = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())
    } else {
      minDate = new Date(today.getTime() - 30 * 86400000)
    }
    const maxDate = new Date(today.getTime() + 30 * 86400000)
    const totalDays = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / 86400000))

    // Group node activity by date key
    const activityMap = new Map<string, { count: number; types: Record<string, number> }>()
    nodes.forEach(n => {
      const d = new Date(n.createdAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const entry = activityMap.get(key) || { count: 0, types: {} }
      entry.count++
      entry.types[n.type] = (entry.types[n.type] || 0) + 1
      activityMap.set(key, entry)
    })
    const maxActivity = Math.max(1, ...Array.from(activityMap.values()).map(v => v.count))

    // Month labels
    const months: { label: string; x: number }[] = []
    let lastMonth = -1
    for (let i = 0; i <= totalDays; i++) {
      const d = new Date(minDate.getTime() + i * 86400000)
      if (d.getMonth() !== lastMonth) {
        lastMonth = d.getMonth()
        months.push({ label: d.toLocaleDateString('en-US', { month: 'short' }), x: (i / totalDays) * 100 })
      }
    }

    // Today position
    const todayPos = ((today.getTime() - minDate.getTime()) / 86400000 / totalDays) * 100

    return { minDate, maxDate, totalDays, activityMap, maxActivity, months, todayPos, today }
  }, [nodes])

  const maxQueries = useMemo(() => Math.max(1, ...topics.map(t => t.queryCount)), [topics])

  // ── Toolbar config ──
  const TOOLBAR_ITEMS: { type: BoardNodeType; icon: string; label: string }[] = [
    { type: 'drawing', icon: '\u270E', label: 'draw' },
    { type: 'note', icon: '\u270F', label: 'note' },
    { type: 'goal', icon: '\u25C7', label: 'goal' },
    { type: 'milestone', icon: '\u25C8', label: 'milestone' },
    { type: 'conversation', icon: '\u25CB', label: 'conv' },
  ]

  const VIZ_TOOLBAR: { vizType: VizType; icon: string; label: string; nodeType: BoardNodeType }[] = [
    { vizType: 'diagram', icon: '\u25C8', label: 'diagram', nodeType: 'diagram' },
    { vizType: 'chart', icon: '\u25A5', label: 'chart', nodeType: 'chart' },
    { vizType: 'table', icon: '\u229E', label: 'table', nodeType: 'table' },
    { vizType: 'timeline', icon: '\u25C9', label: 'timeline', nodeType: 'timelineViz' },
    { vizType: 'radar', icon: '\u2B21', label: 'radar', nodeType: 'radar' },
  ]

  return (
    <div className="flex flex-col h-full bg-[#fafafa]">
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
                    <div className="h-full bg-slate-400 rounded-full transition-all" style={{ width: `${(t.queryCount / maxQueries) * 100}%` }} />
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
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)',
            backgroundSize: `${20 * camera.zoom}px ${20 * camera.zoom}px`,
            backgroundPosition: `${camera.x * camera.zoom + 50}% ${camera.y * camera.zoom + 50}%`,
          }} />

          <div className="absolute" style={{
            left: '50%', top: '50%',
            transform: `translate(${camera.x * camera.zoom}px, ${camera.y * camera.zoom}px) scale(${camera.zoom})`,
            transformOrigin: '0 0',
          }}>
            {nodes.filter(n => n && n.id && n.type).map(node => {
              if (!node.data) node.data = {}
              const style = NODE_COLORS[node.type] || NODE_COLORS.note
              const isSelected = selectedNode === node.id
              const isEditing = editingNode === node.id
              const VizRenderer = VIZ_RENDERERS[node.type]
              return (
                <div
                  key={node.id}
                  onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                  onDoubleClick={(e) => { e.stopPropagation(); if (!VizRenderer) setEditingNode(node.id) }}
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
                  <div className="flex items-center justify-between px-2 py-1 border-b" style={{ borderColor: style.border + '40' }}>
                    <span className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: style.border }}>{style.label}</span>
                    {isSelected && (
                      <button onClick={(e) => { e.stopPropagation(); deleteNode(node.id) }} className="text-[10px] text-slate-400 hover:text-red-500">x</button>
                    )}
                  </div>
                  <div className="overflow-hidden" style={{ height: node.h - 28 }}>
                    {VizRenderer && node.data.vizData ? (
                      <VizRenderer data={node.data.vizData} />
                    ) : isEditing ? (
                      <div className="px-2 py-1 space-y-1">
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
                    ) : node.type === 'conversation' ? (
                      <div className="px-2 py-1.5">
                        <div className="text-[11px] font-medium text-slate-800 overflow-hidden" style={{
                          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as any, wordBreak: 'break-word', lineHeight: 1.4,
                        }}>{node.data.title || 'untitled'}</div>
                        <div className="text-[9px] text-slate-500 mt-1.5 overflow-hidden" style={{
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any,
                        }}>{node.data.body || ''}</div>
                        {node.data.source && (
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <span className="px-1 py-0.5 rounded text-[7px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-500">{node.data.source}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="px-2 py-1">
                        <div className="text-[10px] font-medium text-slate-800 truncate">{node.data.title || 'untitled'}</div>
                        <div className="text-[9px] text-slate-500 mt-0.5 overflow-hidden" style={{
                          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as any,
                        }}>{node.data.body || ''}</div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Unified toolbar ── */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-white/90 backdrop-blur border border-slate-200 rounded-lg px-1.5 py-1 shadow-sm z-20">
            {TOOLBAR_ITEMS.map(({ type, icon, label }) => (
              <button
                key={type}
                onClick={() => addNode(type)}
                className="px-1.5 py-0.5 rounded text-[9px] font-medium hover:bg-slate-100 transition-colors"
                style={{ color: NODE_COLORS[type].border }}
              >
                {icon} {label}
              </button>
            ))}
            <div className="w-px h-4 bg-slate-200 mx-0.5" />
            {VIZ_TOOLBAR.map(({ vizType, icon, label }) => (
              <button
                key={vizType}
                onClick={() => handleGenerateViz(vizType)}
                disabled={vizLoading !== null}
                className="px-1.5 py-0.5 rounded text-[9px] font-medium hover:bg-slate-100 transition-colors disabled:opacity-40"
                style={{ color: NODE_COLORS[vizType === 'timeline' ? 'timelineViz' : vizType as BoardNodeType]?.border || '#64748b' }}
              >
                {vizLoading === vizType ? '..' : `${icon} ${label}`}
              </button>
            ))}
            <div className="w-px h-4 bg-slate-200 mx-0.5" />
            <button
              onClick={handleAISummary}
              disabled={aiLoading}
              className="px-1.5 py-0.5 rounded text-[9px] font-medium text-pink-600 hover:bg-pink-50 transition-colors disabled:opacity-50"
            >
              {aiLoading ? '...' : '\u25C7 AI summary'}
            </button>
            <div className="w-px h-4 bg-slate-200 mx-0.5" />
            <span className="text-[8px] text-slate-400 px-1">{Math.round(camera.zoom * 100)}%</span>
          </div>

          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-sm text-slate-400">drag topics from the left or click toolbar to add nodes</p>
                <p className="text-[10px] text-slate-300 mt-1">double-click nodes to edit · scroll to zoom</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Objectives ── */}
        <div className="w-52 flex-shrink-0 border-l border-slate-200 bg-white flex flex-col">
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
                <button onClick={() => deleteObjective(obj.id)} className="text-[9px] text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100">x</button>
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
              <button onClick={addObjective} className="px-2 py-1 bg-slate-800 text-white text-[9px] font-medium rounded hover:bg-slate-700">+</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom: Calendar Timeline ── */}
      <div className="flex-none bg-[#f8fafc] select-none" style={{ height: 80, borderTop: '1px solid #e2e8f0' }}>
        <div className="flex h-full">
          <div className="flex-shrink-0 flex flex-col justify-center px-3" style={{ width: 70 }}>
            <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>TIMELINE</span>
            <span style={{ fontSize: 8, color: '#cbd5e1', marginTop: 2 }}>{nodes.length} nodes</span>
          </div>
          <div
            ref={timelineRef}
            className="flex-1 relative cursor-crosshair"
            onClick={(e) => {
              const rect = timelineRef.current?.getBoundingClientRect()
              if (!rect) return
              const pct = (e.clientX - rect.left) / rect.width
              const dayIdx = Math.floor(pct * calendarData.totalDays)
              const clickedDate = new Date(calendarData.minDate.getTime() + dayIdx * 86400000)
              const dateStr = `${clickedDate.getFullYear()}-${String(clickedDate.getMonth() + 1).padStart(2, '0')}-${String(clickedDate.getDate()).padStart(2, '0')}`
              const existing = timelinePins.find(p => p.date === dateStr)
              if (existing) {
                setTimelinePins(prev => prev.filter(p => p.date !== dateStr))
                return
              }
              setPinPopup({ date: dateStr, displayDate: clickedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), x: e.clientX - rect.left })
              setPinLabel('')
            }}
          >
            {/* Month labels — top 20px */}
            <div className="absolute top-0 left-0 right-0" style={{ height: 16 }}>
              {calendarData.months.map((m, i) => (
                <span key={i} className="absolute" style={{ left: `${m.x}%`, fontSize: 8, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.label}</span>
              ))}
            </div>

            {/* Activity bars + pins — middle 40px */}
            <div className="absolute left-0 right-0" style={{ top: 18, height: 40 }}>
              <svg className="w-full h-full" preserveAspectRatio="none">
                {/* Day markers every 5 days */}
                {Array.from({ length: Math.ceil(calendarData.totalDays / 5) }, (_, i) => {
                  const x = ((i * 5) / calendarData.totalDays) * 100
                  return <line key={i} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%" stroke="#e2e8f0" strokeWidth={0.5} />
                })}

                {/* Activity bars */}
                {Array.from(calendarData.activityMap.entries()).map(([dateKey, activity]) => {
                  const [y, m, d] = dateKey.split('-').map(Number)
                  const date = new Date(y, m - 1, d)
                  const dayIdx = Math.floor((date.getTime() - calendarData.minDate.getTime()) / 86400000)
                  const x = (dayIdx / calendarData.totalDays) * 100
                  const barH = (activity.count / calendarData.maxActivity) * 36
                  const topType = Object.entries(activity.types).sort((a, b) => b[1] - a[1])[0]?.[0] as BoardNodeType | undefined
                  const color = topType ? (NODE_COLORS[topType]?.border || '#94a3b8') : '#94a3b8'
                  const barW = Math.max(100 / calendarData.totalDays - 0.2, 0.3)
                  return <rect key={dateKey} x={`${x}%`} y={40 - barH} width={`${barW}%`} height={barH} rx={1} fill={color} opacity={0.75} />
                })}

                {/* Today line */}
                {calendarData.todayPos >= 0 && calendarData.todayPos <= 100 && (
                  <line x1={`${calendarData.todayPos}%`} y1="0" x2={`${calendarData.todayPos}%`} y2="100%" stroke="#ef4444" strokeWidth={1.5} opacity={0.7} />
                )}
              </svg>

              {/* Pins */}
              {timelinePins.map((pin, i) => {
                const [y, m, d] = pin.date.split('-').map(Number)
                const pinDate = new Date(y, m - 1, d)
                const dayIdx = Math.floor((pinDate.getTime() - calendarData.minDate.getTime()) / 86400000)
                const x = (dayIdx / calendarData.totalDays) * 100
                if (x < 0 || x > 100) return null
                return (
                  <div
                    key={i}
                    className="absolute"
                    style={{ left: `${x}%`, top: 0, transform: 'translateX(-50%)' }}
                    onMouseEnter={(e) => setHoveredPin({ label: pin.label, x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setHoveredPin(null)}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10">
                      <polygon points="5,0 10,5 5,10 0,5" fill="#8b5cf6" />
                    </svg>
                  </div>
                )
              })}
            </div>

            {/* Day numbers — bottom 20px */}
            <div className="absolute left-0 right-0 bottom-0" style={{ height: 18 }}>
              {Array.from({ length: Math.ceil(calendarData.totalDays / 5) }, (_, i) => {
                const dayIdx = i * 5
                const d = new Date(calendarData.minDate.getTime() + dayIdx * 86400000)
                const x = (dayIdx / calendarData.totalDays) * 100
                return (
                  <span key={i} className="absolute" style={{ left: `${x}%`, fontSize: 7, color: '#cbd5e1', transform: 'translateX(-50%)' }}>
                    {d.getDate()}
                  </span>
                )
              })}
            </div>
          </div>
        </div>

        {/* Pin hover tooltip */}
        {hoveredPin && (
          <div style={{
            position: 'fixed', left: hoveredPin.x + 8, top: hoveredPin.y - 28, zIndex: 50,
            background: '#1e293b', color: 'white', fontSize: 9, padding: '3px 8px', borderRadius: 4,
            pointerEvents: 'none', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap',
          }}>{hoveredPin.label}</div>
        )}

        {/* Inline pin popup */}
        {pinPopup && (
          <div style={{
            position: 'absolute', left: Math.max(10, Math.min(pinPopup.x + 70 - 80, (timelineRef.current?.offsetWidth || 400) - 180)), bottom: 60, zIndex: 50,
            background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: "'JetBrains Mono', monospace",
          }}>
            <div style={{ fontSize: 8, color: '#94a3b8', marginBottom: 4 }}>pin for {pinPopup.displayDate}</div>
            <input
              autoFocus
              value={pinLabel}
              onChange={(e) => setPinLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && pinLabel.trim()) {
                  setTimelinePins(prev => [...prev, { date: pinPopup.date, label: pinLabel.trim() }])
                  setPinPopup(null); setPinLabel('')
                }
                if (e.key === 'Escape') setPinPopup(null)
              }}
              style={{ fontSize: 10, border: '1px solid #e2e8f0', borderRadius: 4, padding: '3px 6px', width: 140, outline: 'none' }}
              placeholder="label..."
            />
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
              <button onClick={() => setPinPopup(null)} style={{ fontSize: 8, padding: '2px 6px', border: '1px solid #e2e8f0', borderRadius: 3, background: 'white', cursor: 'pointer', color: '#94a3b8' }}>cancel</button>
              <button onClick={() => {
                if (pinLabel.trim()) setTimelinePins(prev => [...prev, { date: pinPopup.date, label: pinLabel.trim() }])
                setPinPopup(null); setPinLabel('')
              }} style={{ fontSize: 8, padding: '2px 6px', border: 'none', borderRadius: 3, background: '#1e293b', cursor: 'pointer', color: 'white' }}>add</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
