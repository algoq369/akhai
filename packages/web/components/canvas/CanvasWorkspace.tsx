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

interface CanvasNode {
  id: string
  type: 'query' | 'topic' | 'note' | 'config' | 'stat'
  x: number
  y: number
  w: number
  h: number
  data: any
}

interface Connection {
  from: string
  to: string
  color: string
}

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

// Extract topics from query response text (simple keyword extraction)
function extractTopics(text: string): string[] {
  const words = text.match(/[A-Z][a-z]+(?:\s[A-Z][a-z]+)*/g) || []
  const unique = [...new Set(words)].filter(w => w.length > 3 && !['This', 'That', 'These', 'Those', 'What', 'When', 'Where', 'Which', 'There', 'Here'].includes(w))
  return unique.slice(0, 5)
}

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
  const [tool, setTool] = useState<'select' | 'connect' | 'note'>('select')
  const [hovered, setHovered] = useState<string | null>(null)
  const [editingNote, setEditingNote] = useState<string | null>(null)

  const weights = useLayerStore((s) => s.weights)
  const activePreset = useLayerStore((s) => s.activePreset)

  // Auto-generate nodes from queryCards
  useEffect(() => {
    if (queryCards.length === 0) return
    const newNodes: CanvasNode[] = []
    const newConns: Connection[] = []
    const topicMap: Record<string, { count: number; nodeId: string }> = {}
    let topicX = 650, topicY = 60

    queryCards.forEach((card, i) => {
      const qId = `q-${card.id}`
      newNodes.push({
        id: qId, type: 'query', x: 40, y: 40 + i * 170, w: 320, h: 150,
        data: { ...card, methodology: card.methodology || 'auto' },
      })

      // Extract and create topic nodes
      const topics = extractTopics(card.response)
      topics.forEach(topic => {
        const tKey = topic.toLowerCase()
        if (!topicMap[tKey]) {
          const tId = `t-${tKey.replace(/\s/g, '-')}`
          topicMap[tKey] = { count: 1, nodeId: tId }
          newNodes.push({
            id: tId, type: 'topic', x: topicX + (Math.random() - 0.5) * 120, y: topicY, w: 110, h: 44,
            data: { name: topic, count: 1, color: getTopicColor(topic) },
          })
          topicY += 56
          if (topicY > 500) { topicY = 60; topicX += 140 }
        } else {
          topicMap[tKey].count++
          // Update count on existing topic node
          const existing = newNodes.find(n => n.id === topicMap[tKey].nodeId)
          if (existing) existing.data.count = topicMap[tKey].count
        }
        newConns.push({ from: qId, to: topicMap[tKey].nodeId, color: getTopicColor(topic) })
      })
    })

    // Config node
    newNodes.push({
      id: 'cfg', type: 'config', x: 650, y: 10, w: 160, h: 50,
      data: { preset: activePreset || 'balanced', weights },
    })

    // Stats node
    newNodes.push({
      id: 'stats', type: 'stat', x: 40, y: 40 + queryCards.length * 170 + 20, w: 200, h: 60,
      data: { queries: queryCards.length, topics: Object.keys(topicMap).length, connections: newConns.length },
    })

    setNodes(newNodes)
    setConnections(newConns)
  }, [queryCards, activePreset, weights])

  // Pan/zoom handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-node]')) return
    if (tool === 'note' && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left - pan.x) / zoom
      const y = (e.clientY - rect.top - pan.y) / zoom
      const id = `note-${Date.now()}`
      setNodes(prev => [...prev, { id, type: 'note', x, y, w: 200, h: 80, data: { text: 'New note...', color: '#fef3c7' } }])
      setTool('select')
      setEditingNote(id)
      return
    }
    setIsPanning(true)
    panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
    setSelected(null)
  }, [tool, pan, zoom])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y })
    if (dragging && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left - pan.x) / zoom - dragging.ox
      const y = (e.clientY - rect.top - pan.y) / zoom - dragging.oy
      setNodes(prev => prev.map(n => n.id === dragging.id ? { ...n, x, y } : n))
    }
    if (connecting) setConnecting(prev => prev ? { ...prev, mx: e.clientX, my: e.clientY } : null)
  }, [isPanning, dragging, connecting, pan, zoom])

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (connecting && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const mx = (e.clientX - rect.left - pan.x) / zoom
      const my = (e.clientY - rect.top - pan.y) / zoom
      const target = nodes.find(n => n.id !== connecting.fromId && mx >= n.x && mx <= n.x + n.w && my >= n.y && my <= n.y + n.h)
      if (target) setConnections(prev => [...prev, { from: connecting.fromId, to: target.id, color: '#94a3b8' }])
      setConnecting(null)
    }
    setIsPanning(false)
    setDragging(null)
  }, [connecting, nodes, pan, zoom])

  useEffect(() => {
    const el = canvasRef.current; if (!el) return
    const onWheel = (e: WheelEvent) => { e.preventDefault(); setZoom(z => Math.min(2, Math.max(0.3, z - e.deltaY * 0.001))) }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const startDrag = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const node = nodes.find(n => n.id === id)
    if (!node) return
    if (tool === 'connect') {
      setConnecting({ fromId: id, mx: e.clientX, my: e.clientY })
      return
    }
    const mx = (e.clientX - rect.left - pan.x) / zoom
    const my = (e.clientY - rect.top - pan.y) / zoom
    setDragging({ id, ox: mx - node.x, oy: my - node.y })
    setSelected(id)
  }

  const getCenter = (id: string) => {
    const n = nodes.find(nd => nd.id === id)
    return n ? { x: n.x + n.w / 2, y: n.y + n.h / 2 } : { x: 0, y: 0 }
  }

  const deleteSelected = () => {
    if (!selected) return
    setNodes(prev => prev.filter(n => n.id !== selected))
    setConnections(prev => prev.filter(c => c.from !== selected && c.to !== selected))
    setSelected(null)
  }

  const isConnected = (nodeId: string) => {
    if (!hovered) return false
    return connections.some(c => (c.from === hovered && c.to === nodeId) || (c.to === hovered && c.from === nodeId))
  }

  const nodeOpacity = (nodeId: string) => {
    if (!hovered) return 1
    if (nodeId === hovered || isConnected(nodeId)) return 1
    return 0.25
  }

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', fontFamily: "'JetBrains Mono','SF Mono',ui-monospace,monospace", background: '#fafbfc' }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '5px 14px', borderBottom: '1px solid #f1f5f9', background: 'white', gap: 6, flexShrink: 0 }}>
        <button onClick={onSwitchToClassic} style={{ fontSize: 9, padding: '3px 8px', borderRadius: 3, border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>
          ← chat
        </button>
        <div style={{ width: 1, height: 14, background: '#e2e8f0', margin: '0 4px' }} />

        {[
          { id: 'select' as const, icon: '↖', label: 'select' },
          { id: 'connect' as const, icon: '⟶', label: 'connect' },
          { id: 'note' as const, icon: '✎', label: 'note' },
        ].map(t => (
          <button key={t.id} onClick={() => setTool(t.id)} style={{
            fontSize: 9, padding: '3px 7px', borderRadius: 3,
            border: tool === t.id ? '1px solid #6366f1' : '1px solid transparent',
            background: tool === t.id ? '#6366f108' : 'transparent',
            color: tool === t.id ? '#6366f1' : '#94a3b8',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>{t.icon} {t.label}</button>
        ))}

        {selected && (
          <button onClick={deleteSelected} style={{ fontSize: 9, padding: '3px 7px', borderRadius: 3, border: '1px solid #ef4444', background: '#ef444408', color: '#ef4444', cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
        )}

        <span style={{ marginLeft: 'auto', fontSize: 8, color: '#94a3b8' }}>
          {nodes.length} nodes · {connections.length} links · {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Canvas area */}
      <div ref={canvasRef} style={{ flex: 1, overflow: 'hidden', position: 'relative', cursor: tool === 'note' ? 'crosshair' : tool === 'connect' ? 'crosshair' : isPanning ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={() => { setIsPanning(false); setDragging(null) }}>

        {/* Dot grid */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <defs><pattern id="canvas-grid" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="12" cy="12" r="0.4" fill="#cbd5e1" opacity="0.15" /></pattern></defs>
          <rect width="100%" height="100%" fill="url(#canvas-grid)" />
        </svg>

        {/* Transform layer */}
        <div style={{ transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', position: 'absolute' }}>
          {/* SVG connections */}
          <svg width="2000" height="1500" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', overflow: 'visible' }}>
            {connections.map((c, i) => {
              const from = getCenter(c.from), to = getCenter(c.to)
              const hl = hovered && (c.from === hovered || c.to === hovered)
              return <line key={`c-${i}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke={c.color || '#94a3b8'} strokeWidth={hl ? 2 : 1}
                strokeOpacity={hovered ? (hl ? 0.7 : 0.08) : 0.25}
                strokeDasharray={c.color === '#94a3b8' ? '4 4' : 'none'}
                style={{ transition: 'all 0.15s' }} />
            })}
            {connecting && (() => {
              const from = getCenter(connecting.fromId)
              const rect = canvasRef.current?.getBoundingClientRect()
              if (!rect) return null
              const toX = (connecting.mx - rect.left - pan.x) / zoom
              const toY = (connecting.my - rect.top - pan.y) / zoom
              return <line x1={from.x} y1={from.y} x2={toX} y2={toY} stroke="#6366f1" strokeWidth={2} strokeDasharray="6 3" />
            })()}
          </svg>

          {/* Nodes */}
          {nodes.map(node => {
            const styles: Record<string, React.CSSProperties> = {
              query: { background: 'rgba(255,255,255,0.97)', border: selected === node.id ? '1.5px solid #6366f1' : '1px solid #e2e8f0', borderRadius: 6 },
              topic: { background: `${node.data.color}10`, border: selected === node.id ? `1.5px solid ${node.data.color}` : `1px solid ${node.data.color}30`, borderRadius: 20 },
              note: { background: node.data.color || '#fef3c7', border: selected === node.id ? '1.5px dashed #d97706' : '1px dashed #e5e7eb', borderRadius: 6 },
              stat: { background: 'rgba(255,255,255,0.95)', border: '1px solid #f1f5f9', borderRadius: 8 },
              config: { background: 'rgba(255,255,255,0.95)', border: '1px solid #e2e8f020', borderRadius: 8 },
            }

            return (
              <div key={node.id} data-node="true"
                onMouseDown={e => startDrag(node.id, e)}
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  position: 'absolute', left: node.x, top: node.y, width: node.w, height: node.h,
                  ...styles[node.type],
                  cursor: tool === 'connect' ? 'crosshair' : 'move',
                  opacity: nodeOpacity(node.id),
                  transition: dragging?.id === node.id ? 'none' : 'opacity 0.15s, box-shadow 0.15s',
                  boxShadow: selected === node.id ? '0 2px 12px rgba(0,0,0,0.06)' : 'none',
                  zIndex: selected === node.id ? 10 : 1,
                  overflow: 'hidden',
                }}>

                {/* Query node */}
                {node.type === 'query' && (() => {
                  const mc = METHOD_COLORS[node.data.methodology] || '#94a3b8'
                  return (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '10px 12px', borderLeft: `3px solid ${mc}` }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#1e293b', marginBottom: 4, lineHeight: 1.3 }}>{node.data.query}</div>
                      <div style={{ fontSize: 9, color: '#94a3b8', lineHeight: 1.4, flex: 1, overflow: 'hidden' }}>{node.data.response?.slice(0, 100)}...</div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}>
                        <span style={{ fontSize: 7, padding: '1px 5px', borderRadius: 2, background: `${mc}12`, color: mc, fontWeight: 600, textTransform: 'uppercase' }}>{node.data.methodology}</span>
                        <span style={{ fontSize: 7, color: '#cbd5e1', marginLeft: 'auto' }}>
                          {node.data.timestamp ? new Date(node.data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      {selected === node.id && (
                        <button onClick={(e) => { e.stopPropagation(); onQuerySelect?.(node.data.id) }}
                          style={{ fontSize: 8, marginTop: 4, padding: '3px 8px', border: '1px solid #e2e8f0', borderRadius: 3, background: 'white', color: '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>
                          view in chat →
                        </button>
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
                      <textarea autoFocus value={node.data.text}
                        onChange={e => setNodes(prev => prev.map(n => n.id === node.id ? { ...n, data: { ...n.data, text: e.target.value } } : n))}
                        onBlur={() => setEditingNote(null)}
                        style={{ width: '100%', height: '100%', border: 'none', background: 'transparent', fontSize: 9, color: '#78716c', fontFamily: 'inherit', resize: 'none', outline: 'none', lineHeight: 1.5 }} />
                    ) : (
                      <div style={{ fontSize: 9, color: '#78716c', lineHeight: 1.5 }}>{node.data.text}</div>
                    )}
                  </div>
                )}

                {/* Stat node */}
                {node.type === 'stat' && (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '0 10px' }}>
                    {[{ l: 'queries', v: node.data.queries }, { l: 'topics', v: node.data.topics }, { l: 'links', v: node.data.connections }].map((s: any) => (
                      <div key={s.l} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{s.v}</div>
                        <div style={{ fontSize: 7, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Config node */}
                {node.type === 'config' && (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 8px', gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#6366f1' }}>{node.data.preset || 'balanced'}</span>
                  </div>
                )}

                {/* Connect handle indicator */}
                {tool === 'connect' && (
                  <div style={{ position: 'absolute', right: -3, top: '50%', transform: 'translateY(-50%)', width: 6, height: 6, borderRadius: '50%', background: '#6366f1', border: '1.5px solid white' }} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom hints */}
      <div style={{ padding: '3px 14px', borderTop: '1px solid #f1f5f9', background: 'white', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 7, color: '#cbd5e1' }}>
          drag to move · scroll to zoom · {tool === 'connect' ? 'click node → drag to target' : tool === 'note' ? 'click to place note' : 'click to select · double-click note to edit'}
        </span>
        <span style={{ fontSize: 7, color: '#cbd5e1', marginLeft: 'auto' }}>akhai canvas</span>
      </div>
    </div>
  )
}
