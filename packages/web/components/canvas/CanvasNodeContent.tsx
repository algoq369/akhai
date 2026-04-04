'use client';

/**
 * Canvas node content renderers — extracted from CanvasWorkspace.tsx
 * Renders the inner content of each node based on its type.
 */

import React from 'react';
import type { CanvasNode, VizType } from './CanvasHelpers';
import { METHOD_COLORS, VIZ_COLORS } from './CanvasHelpers';
import {
  DiagramRenderer,
  ChartRenderer,
  TableRenderer,
  TimelineRenderer,
  RadarRenderer,
} from './CanvasRenderers';

interface CanvasNodeContentProps {
  node: CanvasNode;
  selected: string | null;
  editingNote: string | null;
  tool: string;
  onSetEditingNote: (id: string | null) => void;
  onUpdateNodeText: (nodeId: string, text: string) => void;
  onQuerySelect?: (queryId: string) => void;
  onGenerateDiagram: () => void;
  onGenerateChart: () => void;
}

export function CanvasNodeContent({
  node,
  selected,
  editingNote,
  tool,
  onSetEditingNote,
  onUpdateNodeText,
  onQuerySelect,
  onGenerateDiagram,
  onGenerateChart,
}: CanvasNodeContentProps) {
  return (
    <>
      {/* Query node */}
      {node.type === 'query' &&
        (() => {
          const mc = METHOD_COLORS[node.data.methodology] || '#94a3b8';
          return (
            <div
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                padding: '10px 12px',
                borderLeft: `3px solid ${mc}`,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#1e293b',
                  marginBottom: 4,
                  lineHeight: 1.3,
                }}
              >
                {node.data.query}
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: '#94a3b8',
                  lineHeight: 1.4,
                  flex: 1,
                  overflow: 'hidden',
                }}
              >
                {node.data.response?.slice(0, 100)}...
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}>
                <span
                  style={{
                    fontSize: 7,
                    padding: '1px 5px',
                    borderRadius: 2,
                    background: `${mc}12`,
                    color: mc,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  {node.data.methodology}
                </span>
                <span style={{ fontSize: 7, color: '#cbd5e1', marginLeft: 'auto' }}>
                  {node.data.timestamp
                    ? new Date(node.data.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </span>
              </div>
              {selected === node.id && (
                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuerySelect?.(node.data.id);
                    }}
                    style={{
                      fontSize: 7,
                      padding: '2px 6px',
                      border: '1px solid #e2e8f0',
                      borderRadius: 3,
                      background: 'white',
                      color: '#64748b',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    view in chat →
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onGenerateDiagram();
                    }}
                    style={{
                      fontSize: 7,
                      padding: '2px 6px',
                      border: '1px solid #8b5cf6',
                      borderRadius: 3,
                      background: '#8b5cf608',
                      color: '#8b5cf6',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    ◈ diagram
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onGenerateChart();
                    }}
                    style={{
                      fontSize: 7,
                      padding: '2px 6px',
                      border: '1px solid #10b981',
                      borderRadius: 3,
                      background: '#10b98108',
                      color: '#10b981',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    ▥ chart
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      {/* Topic node */}
      {node.type === 'topic' && (
        <div
          style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: node.data.color,
            }}
          />
          <span style={{ fontSize: 10, fontWeight: 600, color: node.data.color }}>
            {node.data.name}
          </span>
          {node.data.count > 1 && (
            <span style={{ fontSize: 8, color: '#cbd5e1' }}>×{node.data.count}</span>
          )}
        </div>
      )}

      {/* Note node */}
      {node.type === 'note' && (
        <EditableTextNode
          node={node}
          editingNote={editingNote}
          onSetEditingNote={onSetEditingNote}
          onUpdateNodeText={onUpdateNodeText}
          textColor="#78716c"
        />
      )}

      {/* Goal node */}
      {node.type === 'goal' && (
        <div
          onDoubleClick={() => onSetEditingNote(node.id)}
          style={{ height: '100%', padding: '6px 10px', borderLeft: '3px solid #22c55e' }}
        >
          <div
            style={{
              fontSize: 7,
              color: '#16a34a',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 2,
            }}
          >
            ◎ Goal
          </div>
          {editingNote === node.id ? (
            <textarea
              autoFocus
              value={node.data.text}
              onChange={(e) => onUpdateNodeText(node.id, e.target.value)}
              onBlur={() => onSetEditingNote(null)}
              style={{
                width: '100%',
                height: 'calc(100% - 16px)',
                border: 'none',
                background: 'transparent',
                fontSize: 9,
                color: '#166534',
                fontFamily: 'inherit',
                resize: 'none',
                outline: 'none',
                lineHeight: 1.5,
              }}
            />
          ) : (
            <div style={{ fontSize: 9, color: '#166534', lineHeight: 1.5 }}>{node.data.text}</div>
          )}
        </div>
      )}

      {/* Milestone node */}
      {node.type === 'milestone' && (
        <div
          onDoubleClick={() => onSetEditingNote(node.id)}
          style={{ height: '100%', padding: '6px 10px', borderLeft: '3px solid #8b5cf6' }}
        >
          <div
            style={{
              fontSize: 7,
              color: '#7c3aed',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 2,
            }}
          >
            ◇ Milestone
          </div>
          {editingNote === node.id ? (
            <textarea
              autoFocus
              value={node.data.text}
              onChange={(e) => onUpdateNodeText(node.id, e.target.value)}
              onBlur={() => onSetEditingNote(null)}
              style={{
                width: '100%',
                height: 'calc(100% - 16px)',
                border: 'none',
                background: 'transparent',
                fontSize: 9,
                color: '#5b21b6',
                fontFamily: 'inherit',
                resize: 'none',
                outline: 'none',
                lineHeight: 1.5,
              }}
            />
          ) : (
            <div style={{ fontSize: 9, color: '#5b21b6', lineHeight: 1.5 }}>{node.data.text}</div>
          )}
        </div>
      )}

      {/* Stat node */}
      {node.type === 'stat' && (
        <div
          style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            padding: '0 10px',
          }}
        >
          {[
            { l: 'queries', v: node.data.queries },
            { l: 'topics', v: node.data.topics },
            { l: 'links', v: node.data.connections },
          ].map((s: any) => (
            <div key={s.l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{s.v}</div>
              <div
                style={{
                  fontSize: 7,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {s.l}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Config node */}
      {node.type === 'config' && (
        <div
          style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px 8px',
            gap: 6,
          }}
        >
          <span style={{ fontSize: 10, fontWeight: 600, color: '#6366f1' }}>
            {node.data.preset || 'balanced'}
          </span>
        </div>
      )}

      {/* Diagram node */}
      {node.type === 'diagram' && <DiagramRenderer data={node.data} />}

      {/* Chart node */}
      {node.type === 'chart' && <ChartRenderer data={node.data} />}

      {/* Table node */}
      {node.type === 'table' && <TableRenderer data={node.data} />}

      {/* Timeline node */}
      {node.type === 'timeline' && <TimelineRenderer data={node.data} />}

      {/* Radar node */}
      {node.type === 'radar' && <RadarRenderer data={node.data} />}

      {/* Connect handle */}
      {tool === 'connect' && (
        <div
          style={{
            position: 'absolute',
            right: -3,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#6366f1',
            border: '1.5px solid white',
          }}
        />
      )}
    </>
  );
}

/** Reusable editable text node for note type */
function EditableTextNode({
  node,
  editingNote,
  onSetEditingNote,
  onUpdateNodeText,
  textColor,
}: {
  node: CanvasNode;
  editingNote: string | null;
  onSetEditingNote: (id: string | null) => void;
  onUpdateNodeText: (nodeId: string, text: string) => void;
  textColor: string;
}) {
  return (
    <div
      onDoubleClick={() => onSetEditingNote(node.id)}
      style={{ height: '100%', padding: '8px 10px' }}
    >
      {editingNote === node.id ? (
        <textarea
          autoFocus
          value={node.data.text}
          onChange={(e) => onUpdateNodeText(node.id, e.target.value)}
          onBlur={() => onSetEditingNote(null)}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            background: 'transparent',
            fontSize: 9,
            color: textColor,
            fontFamily: 'inherit',
            resize: 'none',
            outline: 'none',
            lineHeight: 1.5,
          }}
        />
      ) : (
        <div style={{ fontSize: 9, color: textColor, lineHeight: 1.5 }}>{node.data.text}</div>
      )}
    </div>
  );
}

/** Get node style based on type and selection state */
export function getNodeStyle(node: CanvasNode, selected: string | null): React.CSSProperties {
  const styles: Record<string, React.CSSProperties> = {
    query: {
      background: 'rgba(255,255,255,0.97)',
      border: selected === node.id ? '1.5px solid #6366f1' : '1px solid #e2e8f0',
      borderRadius: 6,
    },
    topic: {
      background: `${node.data.color}10`,
      border:
        selected === node.id ? `1.5px solid ${node.data.color}` : `1px solid ${node.data.color}30`,
      borderRadius: 20,
    },
    note: {
      background: node.data.color || '#fef3c7',
      border: selected === node.id ? '1.5px dashed #d97706' : '1px dashed #e5e7eb',
      borderRadius: 6,
    },
    stat: {
      background: 'rgba(255,255,255,0.95)',
      border: '1px solid #f1f5f9',
      borderRadius: 8,
    },
    config: {
      background: 'rgba(255,255,255,0.95)',
      border: '1px solid #e2e8f020',
      borderRadius: 8,
    },
    diagram: {
      background: 'rgba(255,255,255,0.97)',
      border: selected === node.id ? '1.5px solid #8b5cf6' : '1px solid #e2e8f0',
      borderRadius: 8,
      borderTop: '3px solid #8b5cf6',
    },
    chart: {
      background: 'rgba(255,255,255,0.97)',
      border: selected === node.id ? '1.5px solid #10b981' : '1px solid #e2e8f0',
      borderRadius: 8,
      borderTop: '3px solid #10b981',
    },
    drawing: { background: 'transparent', border: 'none', borderRadius: 0 },
    table: {
      background: 'rgba(255,255,255,0.97)',
      border: selected === node.id ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
      borderRadius: 8,
      borderTop: '3px solid #f59e0b',
    },
    timeline: {
      background: 'rgba(255,255,255,0.97)',
      border: selected === node.id ? '1.5px solid #0ea5e9' : '1px solid #e2e8f0',
      borderRadius: 8,
      borderTop: '3px solid #0ea5e9',
    },
    radar: {
      background: 'rgba(255,255,255,0.97)',
      border: selected === node.id ? '1.5px solid #ec4899' : '1px solid #e2e8f0',
      borderRadius: 8,
      borderTop: '3px solid #ec4899',
    },
  };
  return styles[node.type] || {};
}
