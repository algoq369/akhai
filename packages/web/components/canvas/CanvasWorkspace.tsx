'use client';

import { useEffect, useState } from 'react';
import type { QueryCard } from './QueryCardsPanel';
import type { VisualNode, VisualEdge } from './VisualsPanel';
import type { AIInsight } from './AILayersPanel';
import type { VizType } from './CanvasHelpers';
import { VIZ_COLORS } from './CanvasHelpers';
import { CanvasNodeContent, getNodeStyle } from './CanvasNodeContent';
import { CanvasToolbar } from './CanvasToolbar';
import { useCanvasState } from './useCanvasState';
import CanvasShelf, {
  SHELF_COLLAPSED_WIDTH,
  SHELF_EXPANDED_WIDTH,
  readShelfExpandedFromStorage,
} from './CanvasShelf';

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
  /** Which queries are currently staged. When provided, canvas renders stage layout with 1-3 slots. */
  stageIds?: string[];
  /** Toggle a query's stage membership. Called from CanvasShelf. */
  onToggleStage?: (queryId: string) => void;
}

// === MAIN COMPONENT ===
export default function CanvasWorkspace({
  queryCards = [],
  visualNodes = [],
  visualEdges = [],
  aiInsights = [],
  onQuerySelect,
  onNodeSelect,
  onInsightSelect,
  onSwitchToClassic,
  stageIds,
  onToggleStage,
}: CanvasWorkspaceProps) {
  // Stage mode: only render the staged subset in chronological order (oldest left, newest right).
  // Grid mode (no stageIds prop): render all queryCards in the row-wrapping grid (legacy behavior).
  const stageMode = Array.isArray(stageIds);
  const stagedCards = stageMode
    ? queryCards
        .filter((c) => stageIds!.includes(c.id))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    : queryCards;
  const cs = useCanvasState(stagedCards, stageMode ? 'stage' : 'grid');
  const [hoveredConn, setHoveredConn] = useState<{ x: number; y: number; topics: string[] } | null>(
    null
  );

  // Shelf expansion state — hydrate from localStorage after mount to avoid SSR mismatch.
  const [shelfExpanded, setShelfExpanded] = useState<boolean>(true);
  useEffect(() => {
    setShelfExpanded(readShelfExpandedFromStorage());
  }, []);
  const shelfWidth = shelfExpanded ? SHELF_EXPANDED_WIDTH : SHELF_COLLAPSED_WIDTH;

  // Shelf sees all queries and the current stage membership for the on-stage dot.
  const shelfStageIds = stageIds ?? [];
  const shelfOnToggle = onToggleStage ?? (() => {});

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
        paddingLeft: shelfWidth,
        transition: 'padding-left 200ms ease',
      }}
    >
      <CanvasShelf
        queryCards={queryCards}
        stageIds={shelfStageIds}
        onToggle={shelfOnToggle}
        expanded={shelfExpanded}
        onToggleExpanded={() => setShelfExpanded((v) => !v)}
      />
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
        showThreads={cs.showThreads}
        setShowThreads={cs.setShowThreads}
        showCrossLinks={cs.showCrossLinks}
        setShowCrossLinks={cs.setShowCrossLinks}
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
        onMouseDown={(e) => {
          cs.clearHighlights();
          cs.handleMouseDown(e);
        }}
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
        {(cs.nodes ?? []).length === 0 && (
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
              <marker
                id="thread-arrow"
                viewBox="0 0 10 10"
                refX="10"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#a1a1aa" />
              </marker>
              <marker
                id="branch-arrow"
                viewBox="0 0 10 10"
                refX="10"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#d4d4d8" />
              </marker>
            </defs>
            {/* Cross-query connections (behind everything) */}
            {cs.showCrossLinks &&
              (cs.connections ?? [])
                .filter((c) => c.label === 'cross-query')
                .map((c, i) => {
                  const from = cs.getCenter(c.from),
                    to = cs.getCenter(c.to);
                  if (from.x === 0 && from.y === 0 && to.x === 0 && to.y === 0) return null;
                  const count = c.topics?.length || 2;
                  const sw = count >= 4 ? 2 : count >= 3 ? 1.5 : 1;
                  return (
                    <line
                      key={`xq-${i}`}
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke="#d4d4d8"
                      strokeWidth={sw}
                      strokeOpacity={0.4}
                      strokeDasharray="2 4"
                      style={{ transition: 'all 0.15s', pointerEvents: 'stroke', cursor: 'help' }}
                      onMouseEnter={(e) => {
                        const rect = cs.canvasRef.current?.getBoundingClientRect();
                        if (rect && c.topics)
                          setHoveredConn({
                            x: e.clientX - rect.left,
                            y: e.clientY - rect.top - 30,
                            topics: c.topics,
                          });
                      }}
                      onMouseLeave={() => setHoveredConn(null)}
                    />
                  );
                })}
            {/* Thread/branch connection lines (behind other connections) */}
            {cs.showThreads &&
              (cs.connections ?? [])
                .filter((c) => c.label === 'thread' || c.label === 'branch')
                .map((c, i) => {
                  const from = cs.getCenter(c.from),
                    to = cs.getCenter(c.to);
                  if (from.x === 0 && from.y === 0 && to.x === 0 && to.y === 0) return null;
                  const isThread = c.label === 'thread';
                  return (
                    <line
                      key={`th-${i}`}
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke={c.color || '#a1a1aa'}
                      strokeWidth={1}
                      strokeOpacity={0.5}
                      strokeDasharray={isThread ? '6 4' : '3 6'}
                      markerEnd={isThread ? 'url(#thread-arrow)' : 'url(#branch-arrow)'}
                      style={{ transition: 'all 0.15s' }}
                    />
                  );
                })}
            {/* Connection lines */}
            {(cs.connections ?? [])
              .filter(
                (c) => c.label !== 'thread' && c.label !== 'branch' && c.label !== 'cross-query'
              )
              .map((c, i) => {
                const from = cs.getCenter(c.from),
                  to = cs.getCenter(c.to);
                if (from.x === 0 && from.y === 0 && to.x === 0 && to.y === 0) return null;
                const hl = cs.hovered && (c.from === cs.hovered || c.to === cs.hovered);
                const topicHl =
                  cs.highlightedTopic &&
                  (c.from === cs.highlightedTopic || c.to === cs.highlightedTopic);
                const hasHighlights = cs.highlightedQueries.size > 0;
                return (
                  <line
                    key={`c-${i}`}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={c.color || '#94a3b8'}
                    strokeWidth={topicHl ? 3 : hl ? 2 : 1}
                    strokeOpacity={
                      topicHl ? 0.8 : hasHighlights ? 0.06 : cs.hovered ? (hl ? 0.7 : 0.08) : 0.25
                    }
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
            {(cs.strokes ?? []).map((stroke, si) => (
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
          {(cs.nodes ?? []).map((node) => {
            const hasHighlights = cs.highlightedQueries.size > 0;
            const isHighlighted =
              cs.highlightedQueries.has(node.id) || cs.highlightedTopic === node.id;
            const dimmed = hasHighlights && !isHighlighted;
            return (
              <div
                key={node.id}
                data-node="true"
                onMouseDown={(e) => cs.startDrag(node.id, e)}
                onClick={() => {
                  if (node.type === 'topic') cs.handleTopicClick(node.id);
                }}
                onMouseEnter={() => cs.setHovered(node.id)}
                onMouseLeave={() => cs.setHovered(null)}
                style={{
                  position: 'absolute',
                  left: node.x,
                  top: node.y,
                  width: node.w,
                  height: node.h,
                  ...getNodeStyle(node, cs.selected, isHighlighted),
                  cursor:
                    node.type === 'topic'
                      ? 'pointer'
                      : cs.tool === 'connect'
                        ? 'crosshair'
                        : 'move',
                  opacity: dimmed ? 0.25 : cs.nodeOpacity(node.id),
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
            );
          })}
        </div>
        {/* Cross-query hover tooltip */}
        {hoveredConn && (
          <div
            style={{
              position: 'absolute',
              left: hoveredConn.x,
              top: hoveredConn.y,
              background: '#27272a',
              color: '#fafafa',
              fontSize: 9,
              fontFamily: "'JetBrains Mono','SF Mono',ui-monospace,monospace",
              padding: '4px 8px',
              borderRadius: 4,
              pointerEvents: 'none',
              zIndex: 50,
              whiteSpace: 'nowrap',
            }}
          >
            Shared: {hoveredConn.topics.join(', ')}
          </div>
        )}
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
