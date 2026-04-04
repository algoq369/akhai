'use client';

/**
 * Canvas toolbar — extracted from CanvasWorkspace.tsx
 */

import React from 'react';
import type { CanvasNode, VizType } from './CanvasHelpers';

type ToolType = 'select' | 'connect' | 'note' | 'pencil' | 'goal' | 'milestone';

interface CanvasToolbarProps {
  tool: ToolType;
  setTool: (t: ToolType) => void;
  pencilColor: string;
  setPencilColor: (c: string) => void;
  nodes: CanvasNode[];
  setNodes: React.Dispatch<React.SetStateAction<CanvasNode[]>>;
  connections: { from: string; to: string; color: string }[];
  strokes: { points: { x: number; y: number }[]; color: string; width: number }[];
  setStrokes: React.Dispatch<
    React.SetStateAction<{ points: { x: number; y: number }[]; color: string; width: number }[]>
  >;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  selected: string | null;
  selectedIsQuery: boolean;
  generating: string | null;
  onSwitchToClassic?: () => void;
  onDeleteSelected: () => void;
  onGenerate: (type: VizType) => void;
}

const TOOLS = [
  { id: 'select' as const, icon: '↖', label: 'select' },
  { id: 'pencil' as const, icon: '✏', label: 'pencil' },
  { id: 'connect' as const, icon: '⟶', label: 'connect' },
  { id: 'note' as const, icon: '✎', label: 'note' },
  { id: 'goal' as const, icon: '◎', label: 'goal' },
  { id: 'milestone' as const, icon: '◇', label: 'milestone' },
];

const PENCIL_COLORS = ['#1e293b', '#6366f1', '#ef4444', '#10b981', '#f59e0b', '#ec4899'];

const VIZ_BUTTONS: { type: VizType; icon: string; color: string }[] = [
  { type: 'diagram', icon: '◈', color: '#8b5cf6' },
  { type: 'chart', icon: '▥', color: '#10b981' },
  { type: 'table', icon: '⊞', color: '#f59e0b' },
  { type: 'timeline', icon: '◉', color: '#0ea5e9' },
  { type: 'radar', icon: '⬡', color: '#ec4899' },
];

export function CanvasToolbar({
  tool,
  setTool,
  pencilColor,
  setPencilColor,
  nodes,
  setNodes,
  connections,
  strokes,
  setStrokes,
  zoom,
  setZoom,
  setPan,
  selected,
  selectedIsQuery,
  generating,
  onSwitchToClassic,
  onDeleteSelected,
  onGenerate,
}: CanvasToolbarProps) {
  const hasQueries = nodes.filter((n) => n.type === 'query').length > 0;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '5px 14px',
        borderBottom: '1px solid #f1f5f9',
        background: 'white',
        gap: 4,
        flexShrink: 0,
        flexWrap: 'wrap',
      }}
    >
      <button
        onClick={onSwitchToClassic}
        style={{
          fontSize: 9,
          padding: '3px 8px',
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          background: 'white',
          color: '#64748b',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        ← chat
      </button>
      <div style={{ width: 1, height: 14, background: '#e2e8f0', margin: '0 2px' }} />

      {/* Tools */}
      {TOOLS.map((t) => (
        <button
          key={t.id}
          onClick={() => setTool(t.id)}
          style={{
            fontSize: 9,
            padding: '3px 7px',
            borderRadius: 3,
            border: tool === t.id ? '1px solid #6366f1' : '1px solid transparent',
            background: tool === t.id ? '#6366f108' : 'transparent',
            color: tool === t.id ? '#6366f1' : '#94a3b8',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {t.icon} {t.label}
        </button>
      ))}

      {/* Pencil color picker */}
      {tool === 'pencil' && (
        <div style={{ display: 'flex', gap: 2, marginLeft: 4 }}>
          {PENCIL_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setPencilColor(c)}
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                border: pencilColor === c ? '2px solid #1e293b' : '1px solid #e2e8f0',
                background: c,
                cursor: 'pointer',
                padding: 0,
              }}
            />
          ))}
        </div>
      )}

      <div style={{ width: 1, height: 14, background: '#e2e8f0', margin: '0 2px' }} />

      {/* Diagram/Chart generation */}
      {VIZ_BUTTONS.map((btn) => (
        <button
          key={btn.type}
          onClick={() => selectedIsQuery && onGenerate(btn.type)}
          disabled={!selectedIsQuery || !!generating}
          title={selectedIsQuery ? `Generate ${btn.type}` : 'Select a query card first'}
          style={{
            fontSize: 9,
            padding: '3px 8px',
            borderRadius: 3,
            border: `1px solid ${selectedIsQuery ? btn.color : '#e2e8f0'}`,
            background: generating === btn.type ? `${btn.color}15` : 'transparent',
            color: selectedIsQuery ? btn.color : '#cbd5e1',
            cursor: !selectedIsQuery ? 'not-allowed' : generating ? 'wait' : 'pointer',
            fontFamily: 'inherit',
            opacity: selectedIsQuery ? 1 : 0.5,
          }}
        >
          {generating === btn.type ? '◌ generating...' : `${btn.icon} ${btn.type}`}
        </button>
      ))}

      <button
        onClick={() => {
          if (!hasQueries) return;
          const summaryText = nodes
            .filter((n) => n.type === 'query')
            .map((n, i) => `${i + 1}. ${n.data.query?.substring(0, 60) || 'Query'}`)
            .join('\n');
          const id = `note-summary-${Date.now()}`;
          setNodes((prev) => [
            ...prev,
            {
              id,
              type: 'note',
              x: 450,
              y: 40,
              w: 280,
              h: 120,
              data: { text: `AI Summary:\n${summaryText}`, color: '#e0e7ff' },
            },
          ]);
        }}
        disabled={!hasQueries}
        title={hasQueries ? 'Generate summary from all queries' : 'No queries on canvas'}
        style={{
          fontSize: 9,
          padding: '3px 8px',
          borderRadius: 3,
          border: '1px solid #6366f1',
          background: 'transparent',
          color: hasQueries ? '#6366f1' : '#cbd5e1',
          cursor: hasQueries ? 'pointer' : 'not-allowed',
          fontFamily: 'inherit',
          opacity: hasQueries ? 1 : 0.5,
        }}
      >
        ✦ summary
      </button>

      {selected && (
        <button
          onClick={onDeleteSelected}
          style={{
            fontSize: 9,
            padding: '3px 7px',
            borderRadius: 3,
            border: '1px solid #ef4444',
            background: '#ef444408',
            color: '#ef4444',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          ✕
        </button>
      )}

      {/* Undo pencil strokes */}
      {strokes.length > 0 && (
        <button
          onClick={() => setStrokes((prev) => prev.slice(0, -1))}
          style={{
            fontSize: 9,
            padding: '3px 7px',
            borderRadius: 3,
            border: '1px solid #94a3b8',
            background: 'transparent',
            color: '#94a3b8',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          ↩ undo
        </button>
      )}

      <div style={{ width: 1, height: 14, background: '#e2e8f0', margin: '0 2px' }} />
      <button
        onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
        style={{
          fontSize: 9,
          padding: '3px 7px',
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          background: 'white',
          color: '#64748b',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        +
      </button>
      <button
        onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))}
        style={{
          fontSize: 9,
          padding: '3px 7px',
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          background: 'white',
          color: '#64748b',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        −
      </button>
      <button
        onClick={() => {
          setZoom(0.9);
          setPan({ x: 0, y: 0 });
        }}
        style={{
          fontSize: 9,
          padding: '3px 7px',
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          background: 'white',
          color: '#64748b',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        ⟲ reset
      </button>
      <span style={{ marginLeft: 'auto', fontSize: 8, color: '#94a3b8' }}>
        {nodes.length} nodes · {connections.length} links ·{' '}
        {strokes.length > 0 ? `${strokes.length} strokes · ` : ''}
        {Math.round(zoom * 100)}%
      </span>
    </div>
  );
}
