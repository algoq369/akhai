'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  BoardNode,
  BoardNodeType,
  Objective,
  TopicProgress,
  NODE_COLORS,
  VIZ_SIZES,
} from './VisionBoardTypes';
import { VizType, generateVisualization } from './VisionBoardVizHelpers';
import { VIZ_RENDERERS } from './VisionBoardRenderers';
import { loadState, saveState, genId } from './VisionBoardState';

// ── Component ──────────────────────────────────────────────────────────────────

interface VisionBoardProps {
  userId: string | null;
}

export default function VisionBoard({ userId }: VisionBoardProps) {
  const initState = loadState(userId);
  const [nodes, setNodes] = useState<BoardNode[]>(initState.nodes);
  const [objectives, setObjectives] = useState<Objective[]>(initState.objectives);
  const [camera, setCamera] = useState(initState.camera);
  const boardInitRef = useRef(false);
  const [topics, setTopics] = useState<TopicProgress[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);

  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [newObjText, setNewObjText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [vizLoading, setVizLoading] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!boardInitRef.current) {
      boardInitRef.current = true;
      return;
    }
    saveState({ nodes, objectives, camera }, userId);
  }, [nodes, objectives, camera]);

  useEffect(() => {
    setTopicsLoading(true);
    fetch('/api/mindmap/data')
      .then((r) => r.json())
      .then((data) => {
        const allNodes = data.nodes || [];
        const links = data.links || [];
        const t = allNodes
          .map((n: any) => {
            const connIds = links
              .filter((l: any) => l.source === n.id || l.target === n.id)
              .map((l: any) => (l.source === n.id ? l.target : l.source));
            const connNames = connIds
              .map((id: string) => allNodes.find((nn: any) => nn.id === id)?.name)
              .filter(Boolean)
              .slice(0, 5);
            return {
              name: n.name,
              category: n.category || 'other',
              queryCount: n.queryCount || 0,
              description: n.description || '',
              connected: connNames,
            };
          })
          .sort((a: TopicProgress, b: TopicProgress) => b.queryCount - a.queryCount)
          .slice(0, 20);
        setTopics(t);
      })
      .catch(() => setTopics([]))
      .finally(() => setTopicsLoading(false));
  }, []);

  const screenToCanvas = useCallback(
    (sx: number, sy: number) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return { x: sx, y: sy };
      return {
        x: (sx - rect.left - rect.width / 2) / camera.zoom - camera.x,
        y: (sy - rect.top - rect.height / 2) / camera.zoom - camera.y,
      };
    },
    [camera]
  );

  const addNode = useCallback(
    (type: BoardNodeType, x?: number, y?: number, data?: Partial<BoardNode['data']>) => {
      const pos =
        x !== undefined && y !== undefined
          ? { x, y }
          : { x: -camera.x + Math.random() * 200 - 100, y: -camera.y + Math.random() * 200 - 100 };
      const vizSize = VIZ_SIZES[type];
      const n: BoardNode = {
        id: genId(),
        type,
        x: pos.x,
        y: pos.y,
        w: vizSize?.w || (type === 'drawing' ? 200 : type === 'conversation' ? 280 : 180),
        h: vizSize?.h || (type === 'drawing' ? 140 : type === 'conversation' ? 160 : 100),
        data: { title: '', body: '', ...data },
        createdAt: Date.now(),
      };
      setNodes((prev) => [...prev, n]);
      setSelectedNode(n.id);
      if (!vizSize) setEditingNode(n.id);
      return n.id;
    },
    [camera]
  );

  const deleteNode = useCallback(
    (id: string) => {
      setNodes((prev) => prev.filter((n) => n.id !== id));
      if (selectedNode === id) setSelectedNode(null);
      if (editingNode === id) setEditingNode(null);
    },
    [selectedNode, editingNode]
  );

  const updateNodeData = useCallback((id: string, patch: Partial<BoardNode['data']>) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n))
    );
  }, []);

  // ── Viz generation ──
  const handleGenerateViz = useCallback(
    async (vizType: VizType) => {
      const convNodes = nodes.filter(
        (n) => n.type === 'conversation' || n.type === 'note' || n.type === 'goal'
      );
      const query =
        convNodes
          .map((n) => n.data?.title)
          .filter(Boolean)
          .join(', ') ||
        topics
          .slice(0, 5)
          .map((t) => t.name)
          .join(', ');
      const response =
        convNodes
          .map((n) => `${n.data?.title || ''}: ${n.data?.body || ''}`)
          .filter(Boolean)
          .join('\n') ||
        topics
          .slice(0, 10)
          .map((t) => `${t.name}: ${t.description}`)
          .join('\n');
      if (!query) return;

      const nodeType: BoardNodeType =
        vizType === 'timeline' ? 'timelineViz' : (vizType as BoardNodeType);
      setVizLoading(vizType);
      try {
        const vizData = await generateVisualization(query, response, vizType);
        addNode(nodeType, -camera.x, -camera.y, { vizData });
      } catch {
        addNode('insight', -camera.x, -camera.y, {
          title: `${vizType} failed`,
          body: 'Could not generate. Try again.',
          color: '#ef4444',
        });
      } finally {
        setVizLoading(null);
      }
    },
    [nodes, topics, camera, addNode]
  );

  // ── Mouse handlers ──
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === canvasRef.current || (e.target as HTMLElement).dataset?.canvas) {
        setPanning(true);
        setPanStart({
          x: e.clientX - camera.x * camera.zoom,
          y: e.clientY - camera.y * camera.zoom,
        });
        setSelectedNode(null);
        setEditingNode(null);
      }
    },
    [camera]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (panning) {
        setCamera((prev) => ({
          ...prev,
          x: (e.clientX - panStart.x) / prev.zoom,
          y: (e.clientY - panStart.y) / prev.zoom,
        }));
      }
      if (dragging) {
        const pos = screenToCanvas(e.clientX, e.clientY);
        setNodes((prev) =>
          prev.map((n) =>
            n.id === dragging ? { ...n, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y } : n
          )
        );
      }
    },
    [panning, panStart, dragging, dragOffset, screenToCanvas]
  );

  const handleCanvasMouseUp = useCallback(() => {
    setPanning(false);
    setDragging(null);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setCamera((prev) => ({
      ...prev,
      zoom: Math.max(0.2, Math.min(3, prev.zoom * (e.deltaY > 0 ? 0.9 : 1.1))),
    }));
  }, []);

  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const pos = screenToCanvas(e.clientX, e.clientY);
      const node = nodes.find((n) => n.id === id);
      if (!node) return;
      setDragOffset({ x: pos.x - node.x, y: pos.y - node.y });
      setDragging(id);
      setSelectedNode(id);
    },
    [nodes, screenToCanvas]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('node-type') as BoardNodeType;
      const topicName = e.dataTransfer.getData('topic-name');
      if (!type && !topicName) return;
      const pos = screenToCanvas(e.clientX, e.clientY);
      if (topicName) {
        let body = '';
        try {
          const td = JSON.parse(e.dataTransfer.getData('topic-data') || '{}');
          const parts: string[] = [];
          if (td.category) parts.push(`[${td.category}]`);
          if (td.queryCount) parts.push(`${td.queryCount} queries`);
          if (td.description) parts.push(td.description);
          if (td.connected?.length) parts.push(`Connected: ${td.connected.join(', ')}`);
          body = parts.join('\n');
        } catch {
          body = topicName;
        }
        addNode('conversation', pos.x, pos.y, { title: topicName, body });
      } else if (type) {
        addNode(type, pos.x, pos.y);
      }
    },
    [screenToCanvas, addNode]
  );

  // ── AI Summary ──
  const handleAISummary = useCallback(async () => {
    const convNodes = nodes.filter(
      (n) => n.type === 'conversation' || n.type === 'note' || n.type === 'goal'
    );
    const context = convNodes
      .map((n) => `${n.data?.title || ''}: ${n.data?.body || ''}`)
      .filter(Boolean)
      .join('\n');
    if (!context.trim() && topics.length === 0) return;
    setAiLoading(true);
    try {
      const nodeNames = convNodes
        .map((n) => n.data?.title)
        .filter(Boolean)
        .join(', ');
      const topicNames = topics
        .slice(0, 10)
        .map((t) => t.name)
        .join(', ');
      const prompt = `Summarize these research topics and suggest 2 next steps: ${nodeNames || topicNames || 'general research'}\n\nContext:\n${context || '(no additional context)'}`;
      const res = await fetch('/api/quick-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: prompt }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      addNode('insight', -camera.x, -camera.y - 60, {
        title: 'AI Summary',
        body: data.response || data.text || data.result || 'Could not generate. Try again.',
        color: '#db2777',
      });
    } catch {
      addNode('insight', -camera.x, -camera.y - 60, {
        title: 'AI Summary',
        body: 'Could not generate. Try again.',
        color: '#ef4444',
      });
    } finally {
      setAiLoading(false);
    }
  }, [nodes, topics, camera, addNode]);

  // ── Objectives ──
  const addObjective = useCallback(() => {
    if (!newObjText.trim()) return;
    setObjectives((prev) => [
      ...prev,
      { id: genId(), text: newObjText.trim(), done: false, createdAt: Date.now() },
    ]);
    setNewObjText('');
  }, [newObjText]);

  const toggleObjective = useCallback((id: string) => {
    setObjectives((prev) => prev.map((o) => (o.id === id ? { ...o, done: !o.done } : o)));
  }, []);

  const deleteObjective = useCallback((id: string) => {
    setObjectives((prev) => prev.filter((o) => o.id !== id));
  }, []);

  // ── Calendar Timeline ──
  const PINS_KEY = userId ? `akhai-vision-pins-${userId}` : 'akhai-vision-pins-none';
  const [timelinePins, setTimelinePins] = useState<{ date: string; label: string }[]>(() => {
    if (typeof window === 'undefined' || !userId) return [];
    try {
      const raw = localStorage.getItem(PINS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const pinsInitRef = useRef(false);
  const [hoveredPin, setHoveredPin] = useState<{ label: string; x: number; y: number } | null>(
    null
  );
  const [pinPopup, setPinPopup] = useState<{ date: string; displayDate: string; x: number } | null>(
    null
  );
  const [pinLabel, setPinLabel] = useState('');
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pinsInitRef.current) {
      pinsInitRef.current = true;
      return;
    }
    try {
      localStorage.setItem(PINS_KEY, JSON.stringify(timelinePins));
    } catch {}
  }, [timelinePins]);

  const calendarData = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let minDate: Date;
    if (nodes.length > 0) {
      const earliest = Math.min(...nodes.map((n) => n.createdAt));
      minDate = new Date(earliest);
      minDate = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
    } else {
      minDate = new Date(today.getTime() - 30 * 86400000);
    }
    const maxDate = new Date(today.getTime() + 30 * 86400000);
    const totalDays = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / 86400000));

    // Group node activity by date key
    const activityMap = new Map<string, { count: number; types: Record<string, number> }>();
    nodes.forEach((n) => {
      const d = new Date(n.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const entry = activityMap.get(key) || { count: 0, types: {} };
      entry.count++;
      entry.types[n.type] = (entry.types[n.type] || 0) + 1;
      activityMap.set(key, entry);
    });
    const maxActivity = Math.max(1, ...Array.from(activityMap.values()).map((v) => v.count));

    // Month labels
    const months: { label: string; x: number }[] = [];
    let lastMonth = -1;
    for (let i = 0; i <= totalDays; i++) {
      const d = new Date(minDate.getTime() + i * 86400000);
      if (d.getMonth() !== lastMonth) {
        lastMonth = d.getMonth();
        months.push({
          label: d.toLocaleDateString('en-US', { month: 'short' }),
          x: (i / totalDays) * 100,
        });
      }
    }

    // Today position
    const todayPos = ((today.getTime() - minDate.getTime()) / 86400000 / totalDays) * 100;

    return { minDate, maxDate, totalDays, activityMap, maxActivity, months, todayPos, today };
  }, [nodes]);

  const maxQueries = useMemo(() => Math.max(1, ...topics.map((t) => t.queryCount)), [topics]);

  // ── Toolbar config ──
  const TOOLBAR_ITEMS: { type: BoardNodeType; icon: string; label: string }[] = [
    { type: 'drawing', icon: '\u270E', label: 'draw' },
    { type: 'note', icon: '\u270F', label: 'note' },
    { type: 'goal', icon: '\u25C7', label: 'goal' },
    { type: 'milestone', icon: '\u25C8', label: 'milestone' },
    { type: 'conversation', icon: '\u25CB', label: 'conv' },
  ];

  const VIZ_TOOLBAR: { vizType: VizType; icon: string; label: string; nodeType: BoardNodeType }[] =
    [
      { vizType: 'diagram', icon: '\u25C8', label: 'diagram', nodeType: 'diagram' },
      { vizType: 'chart', icon: '\u25A5', label: 'chart', nodeType: 'chart' },
      { vizType: 'table', icon: '\u229E', label: 'table', nodeType: 'table' },
      { vizType: 'timeline', icon: '\u25C9', label: 'timeline', nodeType: 'timelineViz' },
      { vizType: 'radar', icon: '\u2B21', label: 'radar', nodeType: 'radar' },
    ];

  return (
    <div className="flex flex-col h-full bg-[#fafafa]">
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: Progress Tracker ── */}
        <div className="w-52 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col">
          <div className="px-3 py-2 border-b border-slate-100">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              progress
            </span>
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
                    e.dataTransfer.setData('topic-name', t.name);
                    e.dataTransfer.setData('node-type', 'conversation');
                    e.dataTransfer.setData('topic-data', JSON.stringify(t));
                  }}
                  className="group px-2 py-1.5 rounded-md hover:bg-slate-50 cursor-grab active:cursor-grabbing"
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor:
                          t.category === 'technology'
                            ? '#6366f1'
                            : t.category === 'finance'
                              ? '#f59e0b'
                              : t.category === 'health'
                                ? '#db2777'
                                : t.category === 'science'
                                  ? '#0284c7'
                                  : '#64748b',
                      }}
                    />
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
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)',
              backgroundSize: `${20 * camera.zoom}px ${20 * camera.zoom}px`,
              backgroundPosition: `${camera.x * camera.zoom + 50}% ${camera.y * camera.zoom + 50}%`,
            }}
          />

          <div
            className="absolute"
            style={{
              left: '50%',
              top: '50%',
              transform: `translate(${camera.x * camera.zoom}px, ${camera.y * camera.zoom}px) scale(${camera.zoom})`,
              transformOrigin: '0 0',
            }}
          >
            {nodes
              .filter((n) => n && n.id && n.type)
              .map((node) => {
                if (!node.data) node.data = {};
                const style = NODE_COLORS[node.type] || NODE_COLORS.note;
                const isSelected = selectedNode === node.id;
                const isEditing = editingNode === node.id;
                const VizRenderer = VIZ_RENDERERS[node.type];
                return (
                  <div
                    key={node.id}
                    onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      if (!VizRenderer) setEditingNode(node.id);
                    }}
                    className="absolute rounded-lg border shadow-sm select-none"
                    style={{
                      left: node.x,
                      top: node.y,
                      width: node.w,
                      height: node.h,
                      backgroundColor: style.bg,
                      borderColor: isSelected ? '#18181b' : style.border,
                      borderWidth: isSelected ? 2 : 1,
                      zIndex: isSelected ? 10 : 1,
                    }}
                  >
                    <div
                      className="flex items-center justify-between px-2 py-1 border-b"
                      style={{ borderColor: style.border + '40' }}
                    >
                      <span
                        className="text-[8px] font-semibold uppercase tracking-wider"
                        style={{ color: style.border }}
                      >
                        {style.label}
                      </span>
                      {isSelected && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNode(node.id);
                          }}
                          className="text-[10px] text-slate-400 hover:text-red-500"
                        >
                          x
                        </button>
                      )}
                    </div>
                    <div className="overflow-hidden" style={{ height: node.h - 28 }}>
                      {VizRenderer && node.data?.vizData ? (
                        <VizRenderer data={node.data?.vizData} />
                      ) : isEditing ? (
                        <div className="px-2 py-1 space-y-1">
                          <input
                            autoFocus
                            value={node.data?.title || ''}
                            onChange={(e) => updateNodeData(node.id, { title: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') setEditingNode(null);
                            }}
                            placeholder="title"
                            className="w-full text-[10px] font-medium text-slate-800 bg-transparent outline-none border-b border-slate-200 pb-0.5"
                          />
                          <textarea
                            value={node.data?.body || ''}
                            onChange={(e) => updateNodeData(node.id, { body: e.target.value })}
                            placeholder="notes..."
                            className="w-full text-[9px] text-slate-600 bg-transparent outline-none resize-none"
                            style={{ height: node.h - 56 }}
                          />
                        </div>
                      ) : node.type === 'conversation' ? (
                        <div className="px-2 py-1.5">
                          <div
                            className="text-[11px] font-medium text-slate-800 overflow-hidden"
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical' as any,
                              wordBreak: 'break-word',
                              lineHeight: 1.4,
                            }}
                          >
                            {node.data?.title || 'untitled'}
                          </div>
                          <div
                            className="text-[9px] text-slate-500 mt-1.5 overflow-hidden"
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical' as any,
                            }}
                          >
                            {node.data?.body || ''}
                          </div>
                          {node.data?.source && (
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <span className="px-1 py-0.5 rounded text-[7px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-500">
                                {node.data?.source}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="px-2 py-1">
                          <div className="text-[10px] font-medium text-slate-800 truncate">
                            {node.data?.title || 'untitled'}
                          </div>
                          <div
                            className="text-[9px] text-slate-500 mt-0.5 overflow-hidden"
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical' as any,
                            }}
                          >
                            {node.data?.body || ''}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
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
                style={{
                  color:
                    NODE_COLORS[vizType === 'timeline' ? 'timelineViz' : (vizType as BoardNodeType)]
                      ?.border || '#64748b',
                }}
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
                <p className="text-sm text-slate-400">
                  drag topics from the left or click toolbar to add nodes
                </p>
                <p className="text-[10px] text-slate-300 mt-1">
                  double-click nodes to edit · scroll to zoom
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Objectives ── */}
        <div className="w-52 flex-shrink-0 border-l border-slate-200 bg-white flex flex-col">
          <div className="px-3 py-2 border-b border-slate-100">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              objectives
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {objectives.length === 0 && (
              <p className="text-[10px] text-slate-400 text-center py-4">no objectives yet</p>
            )}
            {objectives.map((obj) => (
              <div
                key={obj.id}
                className="group flex items-start gap-1.5 px-1.5 py-1 rounded hover:bg-slate-50"
              >
                <button
                  onClick={() => toggleObjective(obj.id)}
                  className="mt-0.5 w-3 h-3 rounded border border-slate-300 flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: obj.done ? '#059669' : 'transparent',
                    borderColor: obj.done ? '#059669' : undefined,
                  }}
                >
                  {obj.done && <span className="text-[7px] text-white">✓</span>}
                </button>
                <span
                  className={`text-[10px] flex-1 ${obj.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}
                >
                  {obj.text}
                </span>
                <button
                  onClick={() => deleteObjective(obj.id)}
                  className="text-[9px] text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                >
                  x
                </button>
              </div>
            ))}
          </div>
          <div className="flex-none p-2 border-t border-slate-100">
            <div className="flex gap-1">
              <input
                value={newObjText}
                onChange={(e) => setNewObjText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addObjective();
                }}
                placeholder="add objective..."
                className="flex-1 text-[10px] px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700 outline-none focus:border-slate-400"
              />
              <button
                onClick={addObjective}
                className="px-2 py-1 bg-slate-800 text-white text-[9px] font-medium rounded hover:bg-slate-700"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom: Calendar Timeline ── */}
      <div
        className="flex-none bg-[#f8fafc] select-none"
        style={{ height: 80, borderTop: '1px solid #e2e8f0' }}
      >
        <div className="flex h-full">
          <div className="flex-shrink-0 flex flex-col justify-center px-3" style={{ width: 70 }}>
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                textTransform: 'uppercase',
                color: '#94a3b8',
                letterSpacing: '0.05em',
              }}
            >
              TIMELINE
            </span>
            <span style={{ fontSize: 8, color: '#cbd5e1', marginTop: 2 }}>
              {nodes.length} nodes
            </span>
          </div>
          <div
            ref={timelineRef}
            className="flex-1 relative cursor-crosshair"
            onClick={(e) => {
              const rect = timelineRef.current?.getBoundingClientRect();
              if (!rect) return;
              const pct = (e.clientX - rect.left) / rect.width;
              const dayIdx = Math.floor(pct * calendarData.totalDays);
              const clickedDate = new Date(calendarData.minDate.getTime() + dayIdx * 86400000);
              const dateStr = `${clickedDate.getFullYear()}-${String(clickedDate.getMonth() + 1).padStart(2, '0')}-${String(clickedDate.getDate()).padStart(2, '0')}`;
              const existing = timelinePins.find((p) => p.date === dateStr);
              if (existing) {
                setTimelinePins((prev) => prev.filter((p) => p.date !== dateStr));
                return;
              }
              setPinPopup({
                date: dateStr,
                displayDate: clickedDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                }),
                x: e.clientX - rect.left,
              });
              setPinLabel('');
            }}
          >
            {/* Month labels — top 20px */}
            <div className="absolute top-0 left-0 right-0" style={{ height: 16 }}>
              {calendarData.months.map((m, i) => (
                <span
                  key={i}
                  className="absolute"
                  style={{
                    left: `${m.x}%`,
                    fontSize: 8,
                    fontWeight: 600,
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {m.label}
                </span>
              ))}
            </div>

            {/* Activity bars + pins — middle 40px */}
            <div className="absolute left-0 right-0" style={{ top: 18, height: 40 }}>
              <svg className="w-full h-full" preserveAspectRatio="none">
                {/* Day markers every 5 days */}
                {Array.from({ length: Math.ceil(calendarData.totalDays / 5) }, (_, i) => {
                  const x = ((i * 5) / calendarData.totalDays) * 100;
                  return (
                    <line
                      key={i}
                      x1={`${x}%`}
                      y1="0"
                      x2={`${x}%`}
                      y2="100%"
                      stroke="#e2e8f0"
                      strokeWidth={0.5}
                    />
                  );
                })}

                {/* Activity bars */}
                {Array.from(calendarData.activityMap.entries()).map(([dateKey, activity]) => {
                  const [y, m, d] = dateKey.split('-').map(Number);
                  const date = new Date(y, m - 1, d);
                  const dayIdx = Math.floor(
                    (date.getTime() - calendarData.minDate.getTime()) / 86400000
                  );
                  const x = (dayIdx / calendarData.totalDays) * 100;
                  const barH = (activity.count / calendarData.maxActivity) * 36;
                  const topType = Object.entries(activity.types).sort(
                    (a, b) => b[1] - a[1]
                  )[0]?.[0] as BoardNodeType | undefined;
                  const color = topType ? NODE_COLORS[topType]?.border || '#94a3b8' : '#94a3b8';
                  const barW = Math.max(100 / calendarData.totalDays - 0.2, 0.3);
                  return (
                    <rect
                      key={dateKey}
                      x={`${x}%`}
                      y={40 - barH}
                      width={`${barW}%`}
                      height={barH}
                      rx={1}
                      fill={color}
                      opacity={0.75}
                    />
                  );
                })}

                {/* Today line */}
                {calendarData.todayPos >= 0 && calendarData.todayPos <= 100 && (
                  <line
                    x1={`${calendarData.todayPos}%`}
                    y1="0"
                    x2={`${calendarData.todayPos}%`}
                    y2="100%"
                    stroke="#ef4444"
                    strokeWidth={1.5}
                    opacity={0.7}
                  />
                )}
              </svg>

              {/* Pins */}
              {timelinePins.map((pin, i) => {
                const [y, m, d] = pin.date.split('-').map(Number);
                const pinDate = new Date(y, m - 1, d);
                const dayIdx = Math.floor(
                  (pinDate.getTime() - calendarData.minDate.getTime()) / 86400000
                );
                const x = (dayIdx / calendarData.totalDays) * 100;
                if (x < 0 || x > 100) return null;
                return (
                  <div
                    key={i}
                    className="absolute"
                    style={{ left: `${x}%`, top: 0, transform: 'translateX(-50%)' }}
                    onMouseEnter={(e) =>
                      setHoveredPin({ label: pin.label, x: e.clientX, y: e.clientY })
                    }
                    onMouseLeave={() => setHoveredPin(null)}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10">
                      <polygon points="5,0 10,5 5,10 0,5" fill="#8b5cf6" />
                    </svg>
                  </div>
                );
              })}
            </div>

            {/* Day numbers — bottom 20px */}
            <div className="absolute left-0 right-0 bottom-0" style={{ height: 18 }}>
              {Array.from({ length: Math.ceil(calendarData.totalDays / 5) }, (_, i) => {
                const dayIdx = i * 5;
                const d = new Date(calendarData.minDate.getTime() + dayIdx * 86400000);
                const x = (dayIdx / calendarData.totalDays) * 100;
                return (
                  <span
                    key={i}
                    className="absolute"
                    style={{
                      left: `${x}%`,
                      fontSize: 7,
                      color: '#cbd5e1',
                      transform: 'translateX(-50%)',
                    }}
                  >
                    {d.getDate()}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pin hover tooltip */}
        {hoveredPin && (
          <div
            style={{
              position: 'fixed',
              left: hoveredPin.x + 8,
              top: hoveredPin.y - 28,
              zIndex: 50,
              background: '#1e293b',
              color: 'white',
              fontSize: 9,
              padding: '3px 8px',
              borderRadius: 4,
              pointerEvents: 'none',
              fontFamily: "'JetBrains Mono', monospace",
              whiteSpace: 'nowrap',
            }}
          >
            {hoveredPin.label}
          </div>
        )}

        {/* Inline pin popup */}
        {pinPopup && (
          <div
            style={{
              position: 'absolute',
              left: Math.max(
                10,
                Math.min(pinPopup.x + 70 - 80, (timelineRef.current?.offsetWidth || 400) - 180)
              ),
              bottom: 60,
              zIndex: 50,
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <div style={{ fontSize: 8, color: '#94a3b8', marginBottom: 4 }}>
              pin for {pinPopup.displayDate}
            </div>
            <input
              autoFocus
              value={pinLabel}
              onChange={(e) => setPinLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && pinLabel.trim()) {
                  setTimelinePins((prev) => [
                    ...prev,
                    { date: pinPopup.date, label: pinLabel.trim() },
                  ]);
                  setPinPopup(null);
                  setPinLabel('');
                }
                if (e.key === 'Escape') setPinPopup(null);
              }}
              style={{
                fontSize: 10,
                border: '1px solid #e2e8f0',
                borderRadius: 4,
                padding: '3px 6px',
                width: 140,
                outline: 'none',
              }}
              placeholder="label..."
            />
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
              <button
                onClick={() => setPinPopup(null)}
                style={{
                  fontSize: 8,
                  padding: '2px 6px',
                  border: '1px solid #e2e8f0',
                  borderRadius: 3,
                  background: 'white',
                  cursor: 'pointer',
                  color: '#94a3b8',
                }}
              >
                cancel
              </button>
              <button
                onClick={() => {
                  if (pinLabel.trim())
                    setTimelinePins((prev) => [
                      ...prev,
                      { date: pinPopup.date, label: pinLabel.trim() },
                    ]);
                  setPinPopup(null);
                  setPinLabel('');
                }}
                style={{
                  fontSize: 8,
                  padding: '2px 6px',
                  border: 'none',
                  borderRadius: 3,
                  background: '#1e293b',
                  cursor: 'pointer',
                  color: 'white',
                }}
              >
                add
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
