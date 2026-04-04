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
import { loadState, saveState, genId } from './VisionBoardState';
import VisionBoardTimeline from './VisionBoardTimeline';
import VisionBoardObjectives from './VisionBoardObjectives';
import VisionBoardProgress from './VisionBoardProgress';
import VisionBoardNode from './VisionBoardNode';

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

  // ── Derived ──

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
        <VisionBoardProgress
          topics={topics}
          topicsLoading={topicsLoading}
          maxQueries={maxQueries}
        />

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
                return (
                  <VisionBoardNode
                    key={node.id}
                    node={node}
                    isSelected={selectedNode === node.id}
                    isEditing={editingNode === node.id}
                    onMouseDown={handleNodeMouseDown}
                    onDoubleClick={(id) => setEditingNode(id)}
                    onDelete={deleteNode}
                    onUpdateData={updateNodeData}
                    onStopEditing={() => setEditingNode(null)}
                  />
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
        <VisionBoardObjectives objectives={objectives} setObjectives={setObjectives} />
      </div>

      {/* ── Bottom: Calendar Timeline ── */}
      <VisionBoardTimeline nodes={nodes} userId={userId} />
    </div>
  );
}
