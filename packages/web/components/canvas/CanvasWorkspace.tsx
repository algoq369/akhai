'use client';

import type { QueryCard } from './QueryCardsPanel';
import type { VisualNode, VisualEdge } from './VisualsPanel';
import type { AIInsight } from './AILayersPanel';
import type { VizType } from './CanvasHelpers';
import { VIZ_COLORS } from './CanvasHelpers';
import { CanvasNodeContent, getNodeStyle } from './CanvasNodeContent';
import { CanvasToolbar } from './CanvasToolbar';
import { useCanvasState } from './useCanvasState';

interface CanvasWorkspaceProps {
  queryCards: QueryCard[];
  visualNodes: VisualNode[];
  visualEdges: VisualEdge[];
  aiInsights?: AIInsight[];
  totalDataPoints?: number;
  overallConfidence?: number;
  querySynthesis?: string;
  onQuerySelect?: (queryId: string) => void;
  onNodeSelect?: (nodeId: string) => void;
  onInsightSelect?: (insightId: string) => void;
  onSwitchToClassic?: () => void;
  classicContent?: React.ReactNode;
}

// === MAIN COMPONENT ===
export default function CanvasWorkspace({
  queryCards,
  visualNodes,
  visualEdges,
  aiInsights,
  onQuerySelect,
  onNodeSelect,
  onInsightSelect,
  onSwitchToClassic,
}: CanvasWorkspaceProps) {
  const cs = useCanvasState(queryCards);

  // === RENDER ===
  return (
    <div
      style={{
        width: '100%',
        height: 'calc(100vh - 120px)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'JetBrains Mono','SF Mono',ui-monospace,monospace",
        background: '#fafbfc',
      }}
    >
      {/* Toolbar */}
      <CanvasToolbar
        tool={cs.tool}
        setTool={cs.setTool}
        pencilColor={cs.pencilColor}
        setPencilColor={cs.setPencilColor}
        nodes={cs.nodes}
        setNodes={cs.setNodes}
        connections={cs.connections}
        strokes={cs.strokes}
        setStrokes={cs.setStrokes}
        zoom={cs.zoom}
        setZoom={cs.setZoom}
        setPan={cs.setPan}
        selected={cs.selected}
        selectedIsQuery={cs.selectedIsQuery}
        generating={cs.generating}
        onSwitchToClassic={onSwitchToClassic}
        onDeleteSelected={cs.deleteSelected}
        onGenerate={cs.handleGenerate}
      />

      {/* Canvas area */}
      <div
        ref={cs.canvasRef}
        style={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
          cursor:
            cs.tool === 'pencil' ||
            cs.tool === 'note' ||
            cs.tool === 'connect' ||
            cs.tool === 'goal' ||
            cs.tool === 'milestone'
              ? 'crosshair'
              : cs.isPanning
                ? 'grabbing'
                : 'grab',
        }}
        onMouseDown={cs.handleMouseDown}
        onMouseMove={cs.handleMouseMove}
        onMouseUp={cs.handleMouseUp}
        onMouseLeave={cs.handleMouseLeave}
      >
        {/* Dot grid */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <defs>
            <pattern id="canvas-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="12" cy="12" r="0.4" fill="#cbd5e1" opacity="0.15" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#canvas-grid)" />
        </svg>

        {/* Empty state */}
        {cs.nodes.length === 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <div style={{ textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.3 }}>◇</div>
              <div style={{ fontSize: 11, fontWeight: 500 }}>Canvas is empty</div>
              <div style={{ fontSize: 9, marginTop: 4, maxWidth: 220 }}>
                Submit a query in chat mode first, then switch to canvas to visualize your research.
              </div>
            </div>
          </div>
        )}

        {/* Transform layer */}
        <div
          style={{
            transform: `translate(${cs.pan.x}px,${cs.pan.y}px) scale(${cs.zoom})`,
            transformOrigin: '0 0',
            position: 'absolute',
          }}
        >
          {/* SVG layer: connections + pencil strokes */}
          <svg
            width="3000"
            height="2000"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none',
              overflow: 'visible',
            }}
          >
            <defs>
              <marker id="ah" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#cbd5e1" />
              </marker>
            </defs>
            {/* Connection lines */}
            {cs.connections.map((c, i) => {
              const from = cs.getCenter(c.from),
                to = cs.getCenter(c.to);
              const hl = cs.hovered && (c.from === cs.hovered || c.to === cs.hovered);
              return (
                <line
                  key={`c-${i}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={c.color || '#94a3b8'}
                  strokeWidth={hl ? 2 : 1}
                  strokeOpacity={cs.hovered ? (hl ? 0.7 : 0.08) : 0.25}
                  strokeDasharray={c.color === '#94a3b8' ? '4 4' : 'none'}
                  style={{ transition: 'all 0.15s' }}
                />
              );
            })}
            {/* Active connection drag line */}
            {cs.connecting &&
              (() => {
                const from = cs.getCenter(cs.connecting.fromId);
                const rect = cs.canvasRef.current?.getBoundingClientRect();
                if (!rect) return null;
                const tx = (cs.connecting.mx - rect.left - cs.pan.x) / cs.zoom;
                const ty = (cs.connecting.my - rect.top - cs.pan.y) / cs.zoom;
                return (
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={tx}
                    y2={ty}
                    stroke="#6366f1"
                    strokeWidth={2}
                    strokeDasharray="6 3"
                  />
                );
              })()}
            {/* Pencil strokes */}
            {cs.strokes.map((stroke, si) => (
              <polyline
                key={`s-${si}`}
                points={stroke.points.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={stroke.color}
                strokeWidth={stroke.width}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {/* Current stroke being drawn */}
            {cs.currentStroke && cs.currentStroke.length > 1 && (
              <polyline
                points={cs.currentStroke.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={cs.pencilColor}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.7}
              />
            )}
          </svg>

          {/* Nodes */}
          {cs.nodes.map((node) => (
            <div
              key={node.id}
              data-node="true"
              onMouseDown={(e) => cs.startDrag(node.id, e)}
              onMouseEnter={() => cs.setHovered(node.id)}
              onMouseLeave={() => cs.setHovered(null)}
              style={{
                position: 'absolute',
                left: node.x,
                top: node.y,
                width: node.w,
                height: node.h,
                ...getNodeStyle(node, cs.selected),
                cursor: cs.tool === 'connect' ? 'crosshair' : 'move',
                opacity: cs.nodeOpacity(node.id),
                transition:
                  cs.dragging?.id === node.id ? 'none' : 'opacity 0.15s, box-shadow 0.15s',
                boxShadow:
                  cs.selected === node.id
                    ? '0 2px 12px rgba(0,0,0,0.06)'
                    : cs.hovered === node.id && VIZ_COLORS[node.type as VizType]
                      ? `0 0 12px ${VIZ_COLORS[node.type as VizType]}26`
                      : 'none',
                zIndex: cs.selected === node.id ? 10 : 1,
                overflow: 'hidden',
              }}
            >
              <CanvasNodeContent
                node={node}
                selected={cs.selected}
                editingNote={cs.editingNote}
                tool={cs.tool}
                onSetEditingNote={cs.setEditingNote}
                onUpdateNodeText={(nodeId, text) =>
                  cs.setNodes((prev) =>
                    prev.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, text } } : n))
                  )
                }
                onQuerySelect={onQuerySelect}
                onGenerateDiagram={() => cs.handleGenerate('diagram')}
                onGenerateChart={() => cs.handleGenerate('chart')}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom hints */}
      <div
        style={{
          padding: '3px 14px',
          borderTop: '1px solid #f1f5f9',
          background: 'white',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 7, color: '#cbd5e1' }}>
          {cs.tool === 'pencil'
            ? 'draw on canvas · pick color above · ↩ to undo'
            : cs.tool === 'connect'
              ? 'click node → drag to target'
              : cs.tool === 'note'
                ? 'click to place note'
                : 'drag to move · scroll to zoom · select query → ◈ diagram or ▥ chart'}
        </span>
        <span style={{ fontSize: 7, color: '#cbd5e1', marginLeft: 'auto' }}>akhai canvas</span>
      </div>
    </div>
  );
}
