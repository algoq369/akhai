'use client';

/**
 * Canvas state management hook — extracted from CanvasWorkspace.tsx
 * Manages nodes, connections, drawing, mouse interactions, and auto-generation.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useLayerStore } from '@/lib/stores/layer-store';
import type { CanvasNode, Connection, DrawPoint, DrawStroke, VizType } from './CanvasHelpers';
import {
  extractTopics,
  getTopicColor,
  generateVisualization,
  VIZ_TYPES,
  VIZ_COLORS,
  VIZ_SIZES,
} from './CanvasHelpers';
import type { QueryCard } from './QueryCardsPanel';

export function useCanvasState(queryCards: QueryCard[] = []) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [zoom, setZoom] = useState(0.9);
  const [dragging, setDragging] = useState<{ id: string; ox: number; oy: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const [selected, setSelected] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<{ fromId: string; mx: number; my: number } | null>(
    null
  );
  const [tool, setTool] = useState<'select' | 'connect' | 'note' | 'pencil' | 'goal' | 'milestone'>(
    'select'
  );
  const [hovered, setHovered] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const autoGenDone = useRef(false);
  const nodesRef = useRef<CanvasNode[]>([]);
  nodesRef.current = nodes;

  // Pencil drawing state
  const [strokes, setStrokes] = useState<DrawStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<DrawPoint[] | null>(null);
  const [pencilColor, setPencilColor] = useState('#1e293b');

  const [showThreads, setShowThreads] = useState(true);
  const [highlightedTopic, setHighlightedTopic] = useState<string | null>(null);
  const [highlightedQueries, setHighlightedQueries] = useState<Set<string>>(new Set());

  const weights = useLayerStore((s) => s.weights);
  const activePreset = useLayerStore((s) => s.activePreset);

  // Auto-generate nodes from queryCards
  useEffect(() => {
    if (queryCards.length === 0) return;
    const newNodes: CanvasNode[] = [];
    const newConns: Connection[] = [];
    const topicMap: Record<string, { count: number; nodeId: string; queryIds: string[] }> = {};
    let topicX = 850,
      topicY = 80;

    queryCards.forEach((card, i) => {
      const qId = `q-${card.id}`;
      newNodes.push({
        id: qId,
        type: 'query',
        x: 40,
        y: 40 + i * 170,
        w: 320,
        h: 150,
        data: { ...card, methodology: card.methodology || 'auto', threadIndex: i },
      });
      const topics = extractTopics(card.response);
      topics.forEach((topic) => {
        const tKey = topic.toLowerCase();
        if (!topicMap[tKey]) {
          const tId = `t-${tKey.replace(/\s/g, '-')}`;
          topicMap[tKey] = { count: 1, nodeId: tId, queryIds: [qId] };
          newNodes.push({
            id: tId,
            type: 'topic',
            x: topicX + (Math.random() - 0.5) * 120,
            y: topicY,
            w: 110,
            h: 44,
            data: { name: topic, count: 1, queryIds: [qId], color: getTopicColor(topic) },
          });
          topicY += 56;
          if (topicY > 500) {
            topicY = 60;
            topicX += 140;
          }
        } else {
          topicMap[tKey].count++;
          topicMap[tKey].queryIds.push(qId);
          const existing = newNodes.find((n) => n.id === topicMap[tKey].nodeId);
          if (existing) {
            existing.data.count = topicMap[tKey].count;
            existing.data.queryIds = topicMap[tKey].queryIds;
          }
        }
        newConns.push({ from: qId, to: topicMap[tKey].nodeId, color: getTopicColor(topic) });
      });
    });
    // Thread connections: link consecutive query nodes
    for (let idx = 1; idx < queryCards.length; idx++) {
      const prevId = `q-${queryCards[idx - 1].id}`;
      const currId = `q-${queryCards[idx].id}`;
      // Simple keyword extraction for branch detection
      const getKeywords = (text: string) => {
        const words = text.toLowerCase().match(/[a-z]{4,}/g) || [];
        return new Set(words);
      };
      const prevKeywords = getKeywords(
        queryCards[idx - 1].query + ' ' + queryCards[idx - 1].response
      );
      const currKeywords = getKeywords(queryCards[idx].query + ' ' + queryCards[idx].response);
      let shared = 0;
      prevKeywords.forEach((w) => {
        if (currKeywords.has(w)) shared++;
      });
      const isBranch = shared === 0;
      newConns.push({
        from: prevId,
        to: currId,
        color: isBranch ? '#d4d4d8' : '#a1a1aa',
        label: isBranch ? 'branch' : 'thread',
      });
    }

    // Reposition merged topics to center of their connected queries
    for (const tKey of Object.keys(topicMap)) {
      const entry = topicMap[tKey];
      if (entry.count < 2) continue;
      const topicNode = newNodes.find((n) => n.id === entry.nodeId);
      if (!topicNode) continue;
      let sumX = 0,
        sumY = 0,
        ct = 0;
      for (const qid of entry.queryIds) {
        const qn = newNodes.find((n) => n.id === qid);
        if (qn) {
          sumX += qn.x + qn.w;
          sumY += qn.y + qn.h / 2;
          ct++;
        }
      }
      if (ct > 0) {
        topicNode.x = sumX / ct + 60 + (Math.random() - 0.5) * 40;
        topicNode.y = sumY / ct - topicNode.h / 2 + (Math.random() - 0.5) * 30;
      }
      // Scale width for multi-referenced topics
      topicNode.w = entry.count >= 3 ? 150 : 130;
    }

    newNodes.push({
      id: 'cfg',
      type: 'config',
      x: 850,
      y: 10,
      w: 160,
      h: 50,
      data: { preset: activePreset || 'balanced', weights },
    });
    newNodes.push({
      id: 'stats',
      type: 'stat',
      x: 40,
      y: 40 + queryCards.length * 170 + 20,
      w: 200,
      h: 60,
      data: {
        queries: queryCards.length,
        topics: Object.keys(topicMap).length,
        connections: newConns.length,
      },
    });
    setNodes(newNodes);
    setConnections(newConns);
  }, [queryCards, activePreset, weights]);

  // === GENERATE DIAGRAM/CHART FROM SELECTED QUERY ===
  const handleGenerate = async (type: VizType) => {
    const selNode = nodes.find((n) => n.id === selected && n.type === 'query');
    if (!selNode) return;
    const capturedId = selected!;
    setGenerating(type);
    const vizData = await generateVisualization(selNode.data.query, selNode.data.response, type);
    if (vizData) {
      const newId = `${type}-${Date.now()}`;
      const size = VIZ_SIZES[type];
      setNodes((prev) => {
        const existingViz = prev.filter((n) => VIZ_TYPES.includes(n.type as VizType));
        const yOffset = existingViz.length * 260;
        const newNode: CanvasNode = {
          id: newId,
          type,
          x: selNode.x + selNode.w + 40,
          y: selNode.y + yOffset,
          w: size.w,
          h: size.h,
          data: vizData,
        };
        return [...prev, newNode];
      });
      setConnections((prev) => [...prev, { from: capturedId, to: newId, color: VIZ_COLORS[type] }]);
      setSelected(capturedId);
    }
    setGenerating(null);
  };

  // === AUTO-GENERATE DIAGRAM + CHART ON CANVAS LOAD ===
  useEffect(() => {
    if (autoGenDone.current) return;
    const currentNodes = nodesRef.current;
    const queryNodes = currentNodes.filter((n) => n.type === 'query');
    if (queryNodes.length === 0) return;
    const hasDiagram = currentNodes.some((n) => n.type === 'diagram');
    const hasChart = currentNodes.some((n) => n.type === 'chart');
    if (hasDiagram && hasChart) return;
    autoGenDone.current = true;

    const latest = queryNodes[queryNodes.length - 1];
    const resp = latest.data.response || '';
    const isError = resp.startsWith('Sorry') || resp.startsWith('Error') || resp.length < 80;
    if (isError && queryNodes.length === 1) return;
    const targetQuery = isError
      ? queryNodes.find((n) => !(n.data.response || '').startsWith('Sorry')) || latest
      : latest;
    const genViz = async () => {
      if (!hasDiagram) {
        const diagData = await generateVisualization(
          targetQuery.data.query,
          targetQuery.data.response,
          'diagram'
        );
        if (diagData) {
          const dId = `diagram-auto-${Date.now()}`;
          setNodes((prev) => [
            ...prev,
            {
              id: dId,
              type: 'diagram',
              x: targetQuery.x + targetQuery.w + 40,
              y: targetQuery.y,
              w: 380,
              h: 280,
              data: diagData,
            },
          ]);
          setConnections((prev) => [...prev, { from: targetQuery.id, to: dId, color: '#8b5cf6' }]);
        }
      }
      if (!hasChart) {
        const chartData = await generateVisualization(
          targetQuery.data.query,
          targetQuery.data.response,
          'chart'
        );
        if (chartData) {
          const cId = `chart-auto-${Date.now()}`;
          setNodes((prev) => [
            ...prev,
            {
              id: cId,
              type: 'chart',
              x: targetQuery.x + targetQuery.w + 40,
              y: targetQuery.y + 300,
              w: 300,
              h: 220,
              data: chartData,
            },
          ]);
          setConnections((prev) => [...prev, { from: targetQuery.id, to: cId, color: '#10b981' }]);
        }
      }
    };
    genViz();
  }, [queryCards.length]);

  // === MOUSE HANDLERS ===
  const getCanvasPos = (e: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: (e.clientX - rect.left - pan.x) / zoom, y: (e.clientY - rect.top - pan.y) / zoom };
  };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('[data-node]')) return;
      if (tool === 'pencil') {
        const pos = getCanvasPos(e);
        setCurrentStroke([pos]);
        return;
      }
      if (tool === 'note' && canvasRef.current) {
        const pos = getCanvasPos(e);
        const id = `note-${Date.now()}`;
        setNodes((prev) => [
          ...prev,
          {
            id,
            type: 'note',
            x: pos.x,
            y: pos.y,
            w: 200,
            h: 80,
            data: { text: 'New note...', color: '#fef3c7' },
          },
        ]);
        setTool('select');
        setEditingNote(id);
        return;
      }
      if (tool === 'goal' && canvasRef.current) {
        const pos = getCanvasPos(e);
        const id = `goal-${Date.now()}`;
        setNodes((prev) => [
          ...prev,
          {
            id,
            type: 'goal',
            x: pos.x,
            y: pos.y,
            w: 200,
            h: 70,
            data: { text: 'New goal...', color: '#dcfce7' },
          },
        ]);
        setTool('select');
        setEditingNote(id);
        return;
      }
      if (tool === 'milestone' && canvasRef.current) {
        const pos = getCanvasPos(e);
        const id = `ms-${Date.now()}`;
        setNodes((prev) => [
          ...prev,
          {
            id,
            type: 'milestone',
            x: pos.x,
            y: pos.y,
            w: 180,
            h: 60,
            data: { text: 'Milestone...', color: '#ede9fe' },
          },
        ]);
        setTool('select');
        setEditingNote(id);
        return;
      }
      setIsPanning(true);
      panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      setSelected(null);
    },
    [tool, pan, zoom]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning)
        setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
      if (dragging && canvasRef.current) {
        const pos = getCanvasPos(e);
        setNodes((prev) =>
          prev.map((n) =>
            n.id === dragging.id ? { ...n, x: pos.x - dragging.ox, y: pos.y - dragging.oy } : n
          )
        );
      }
      if (connecting)
        setConnecting((prev) => (prev ? { ...prev, mx: e.clientX, my: e.clientY } : null));
      if (currentStroke && tool === 'pencil') {
        const pos = getCanvasPos(e);
        setCurrentStroke((prev) => (prev ? [...prev, pos] : null));
      }
    },
    [isPanning, dragging, connecting, currentStroke, tool, pan, zoom]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (currentStroke && currentStroke.length > 1) {
        setStrokes((prev) => [...prev, { points: currentStroke, color: pencilColor, width: 2 }]);
        setCurrentStroke(null);
      } else {
        setCurrentStroke(null);
      }
      if (connecting && canvasRef.current) {
        const pos = getCanvasPos(e);
        const target = nodes.find(
          (n) =>
            n.id !== connecting.fromId &&
            pos.x >= n.x &&
            pos.x <= n.x + n.w &&
            pos.y >= n.y &&
            pos.y <= n.y + n.h
        );
        if (target)
          setConnections((prev) => [
            ...prev,
            { from: connecting.fromId, to: target.id, color: '#94a3b8' },
          ]);
        setConnecting(null);
      }
      setIsPanning(false);
      setDragging(null);
    },
    [connecting, currentStroke, pencilColor, nodes, pan, zoom]
  );

  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
    setDragging(null);
    if (currentStroke) {
      setStrokes((prev) => [...prev, { points: currentStroke, color: pencilColor, width: 2 }]);
      setCurrentStroke(null);
    }
  }, [currentStroke, pencilColor]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => Math.min(2, Math.max(0.3, z - e.deltaY * 0.001)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const startDrag = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const node = nodes.find((n) => n.id === id);
    if (!node) return;
    if (tool === 'connect') {
      setConnecting({ fromId: id, mx: e.clientX, my: e.clientY });
      return;
    }
    const pos = getCanvasPos(e);
    setDragging({ id, ox: pos.x - node.x, oy: pos.y - node.y });
    setSelected(id);
  };

  const getCenter = (id: string) => {
    const n = nodes.find((nd) => nd.id === id);
    return n ? { x: n.x + n.w / 2, y: n.y + n.h / 2 } : { x: 0, y: 0 };
  };

  const deleteSelected = () => {
    if (!selected) return;
    setNodes((prev) => prev.filter((n) => n.id !== selected));
    setConnections((prev) => prev.filter((c) => c.from !== selected && c.to !== selected));
    setSelected(null);
  };

  const isConnected = (nodeId: string) =>
    hovered
      ? connections.some(
          (c) => (c.from === hovered && c.to === nodeId) || (c.to === hovered && c.from === nodeId)
        )
      : false;

  const nodeOpacity = (nodeId: string) =>
    !hovered ? 1 : nodeId === hovered || isConnected(nodeId) ? 1 : 0.25;

  const handleTopicClick = useCallback(
    (nodeId: string) => {
      const node = nodesRef.current.find((n) => n.id === nodeId && n.type === 'topic');
      if (!node || !node.data.queryIds) return;
      if (highlightedTopic === nodeId) {
        setHighlightedTopic(null);
        setHighlightedQueries(new Set());
      } else {
        setHighlightedTopic(nodeId);
        setHighlightedQueries(new Set(node.data.queryIds));
      }
    },
    [highlightedTopic]
  );

  const clearHighlights = useCallback(() => {
    setHighlightedTopic(null);
    setHighlightedQueries(new Set());
  }, []);

  const selectedIsQuery = selected ? nodes.find((n) => n.id === selected)?.type === 'query' : false;

  return {
    canvasRef,
    nodes,
    setNodes,
    connections,
    showThreads,
    setShowThreads,
    pan,
    setPan,
    zoom,
    setZoom,
    dragging,
    isPanning,
    selected,
    connecting,
    tool,
    setTool,
    hovered,
    setHovered,
    editingNote,
    setEditingNote,
    generating,
    strokes,
    setStrokes,
    currentStroke,
    pencilColor,
    setPencilColor,
    handleGenerate,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    startDrag,
    getCenter,
    deleteSelected,
    nodeOpacity,
    selectedIsQuery,
    highlightedTopic,
    highlightedQueries,
    handleTopicClick,
    clearHighlights,
  };
}
