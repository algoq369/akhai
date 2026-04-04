'use client';

import { useState } from 'react';
import type { Node } from './MindMap';
import type { ClusterData, TopicLink } from './MindMapUtils';
import { getClusterColor } from './MindMapUtils';

interface ClusterDetailProps {
  expandedCluster: string;
  clusters: ClusterData[];
  forceLayoutNodes: {
    positions: { id: string; x: number; y: number }[];
    links: TopicLink[];
    sortedNodes: Node[];
    vw?: number;
    vh?: number;
  };
  connectionCounts: Record<string, number>;
  onNodeAction?: (query: string, nodeId: string) => void;
  onClose: () => void;
}

export default function MindMapClusterDetail({
  expandedCluster,
  clusters,
  forceLayoutNodes,
  connectionCounts,
  onNodeAction,
  onClose,
}: ClusterDetailProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [drillZoom, setDrillZoom] = useState(1);
  const [drillPan, setDrillPan] = useState({ x: 0, y: 0 });
  const [isDrillPanning, setIsDrillPanning] = useState(false);
  const drillPanStartRef = { x: 0, y: 0, panX: 0, panY: 0 };

  const cl = clusters.find((c) => c.category === expandedCluster);
  if (!cl) return null;
  const cc = getClusterColor(cl.category, clusters.indexOf(cl));
  const {
    positions: fPos,
    links: fLinks,
    sortedNodes: fNodes,
    vw: svgW,
    vh: svgH,
  } = forceLayoutNodes;
  if (fPos.length === 0) return null;
  const posMap = new Map(fPos.map((p) => [p.id, p]));
  const topLabelIds = new Set(fNodes.map((n) => n.id));
  const hubIds = new Set(
    fNodes.slice(0, Math.min(Math.max(3, Math.ceil(fNodes.length / 15)), 8)).map((n) => n.id)
  );
  const connectedIds = hoveredNode
    ? new Set(
        fLinks
          .filter((l) => l.source === hoveredNode || l.target === hoveredNode)
          .flatMap((l) => [l.source, l.target])
      )
    : null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)' }} />
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#18181b]"
        style={{
          position: 'relative',
          width: '90%',
          height: '90%',
          borderRadius: 16,
          boxShadow: '0 24px 48px rgba(0,0,0,0.12)',
          overflow: 'hidden',
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        }}
      >
        <div
          className="border-b border-slate-200 dark:border-slate-700"
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 24px' }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: cc.text,
              display: 'inline-block',
            }}
          />
          <span
            className="text-slate-800 dark:text-slate-100"
            style={{ fontWeight: 700, fontSize: 15 }}
          >
            {expandedCluster}
          </span>
          <span style={{ color: '#94a3b8', fontSize: 11 }}>
            {cl.nodes.length} topics · {fLinks.length} connections
          </span>
          <span style={{ color: '#64748b', fontSize: 10, marginLeft: 'auto', marginRight: 12 }}>
            {Math.round(drillZoom * 100)}%
          </span>
          <button
            onClick={() => {
              setDrillZoom(1);
              setDrillPan({ x: 0, y: 0 });
            }}
            style={{
              fontSize: 10,
              border: '1px solid #e2e8f0',
              borderRadius: 4,
              background: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: '2px 6px',
              marginRight: 8,
            }}
          >
            reset
          </button>
          <button
            onClick={onClose}
            style={{
              fontSize: 16,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
            }}
          >
            &#x2715;
          </button>
        </div>
        <div
          style={{
            width: '100%',
            height: 'calc(100% - 52px)',
            overflow: 'hidden',
            cursor: isDrillPanning ? 'grabbing' : 'grab',
          }}
          onWheel={(e) => {
            e.stopPropagation();
            setDrillZoom((z) => Math.min(3, Math.max(0.3, z - e.deltaY * 0.001)));
          }}
          onMouseDown={(e) => {
            if (!(e.target as Element).closest('g[style*="pointer"]')) {
              setIsDrillPanning(true);
              drillPanStartRef.x = e.clientX;
              drillPanStartRef.y = e.clientY;
              drillPanStartRef.panX = drillPan.x;
              drillPanStartRef.panY = drillPan.y;
            }
          }}
          onMouseMove={(e) => {
            if (isDrillPanning) {
              setDrillPan({
                x: drillPanStartRef.panX + (e.clientX - drillPanStartRef.x),
                y: drillPanStartRef.panY + (e.clientY - drillPanStartRef.y),
              });
            }
          }}
          onMouseUp={() => setIsDrillPanning(false)}
          onMouseLeave={() => setIsDrillPanning(false)}
        >
          <svg width="100%" height="100%" viewBox={`0 0 ${svgW} ${svgH}`}>
            <g transform={`translate(${drillPan.x}, ${drillPan.y}) scale(${drillZoom})`}>
              {/* Tree branches: hub -> children (always visible) */}
              {fLinks.map((link, li) => {
                const ps = posMap.get(link.source),
                  pt = posMap.get(link.target);
                if (!ps || !pt) return null;
                // Only draw if one end is a hub
                const isTreeEdge = hubIds.has(link.source) || hubIds.has(link.target);
                const isHi = hoveredNode === link.source || hoveredNode === link.target;
                if (!isTreeEdge && !isHi) return null;
                return (
                  <line
                    key={`fl-${li}`}
                    x1={ps.x}
                    y1={ps.y}
                    x2={pt.x}
                    y2={pt.y}
                    stroke={cc.text}
                    strokeWidth={isHi ? 2 : 1}
                    opacity={isHi ? 0.6 : 0.12}
                  />
                );
              })}
              {fNodes.map((node) => {
                const p = posMap.get(node.id);
                if (!p) return null;
                const qc = node.queryCount || 0;
                const isHub = hubIds.has(node.id);
                const hubR = fNodes.length < 20 ? 10 : 14;
                const childR =
                  fNodes.length < 20 ? 5 : Math.max(6, Math.min(12, 4 + Math.sqrt(qc) * 2));
                const nr = isHub ? hubR : childR;
                const isHov = hoveredNode === node.id;
                const isConnected = connectedIds ? connectedIds.has(node.id) : false;
                const nodeOpacity = connectedIds ? (isHov ? 1 : isConnected ? 0.6 : 0.15) : 1;
                const showLabel = topLabelIds.has(node.id) || isHov || isConnected;
                const labelText =
                  node.name.length > 24 ? node.name.slice(0, 24) + '\u2026' : node.name;
                return (
                  <g
                    key={node.id}
                    transform={`translate(${p.x}, ${p.y})`}
                    opacity={nodeOpacity}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onNodeAction?.(`Tell me more about ${node.name}`, node.id);
                      onClose();
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle r={20} fill="transparent" />
                    <circle
                      r={nr}
                      fill={isHub ? cc.text + 'D0' : cc.text + '70'}
                      stroke={isHov ? cc.text : cc.text + '4D'}
                      strokeWidth={isHub ? 2.5 : isHov ? 2 : 1}
                    />
                    {showLabel && (
                      <text
                        y={nr + 14}
                        textAnchor="middle"
                        fill={isHov ? cc.text : isHub ? cc.text : '#94a3b8'}
                        fontSize={isHub ? 11 : isHov ? 10 : 8}
                        fontWeight={isHub ? 700 : isHov ? 600 : 400}
                      >
                        {isHov ? node.name : labelText}
                      </text>
                    )}
                    {isHov && (
                      <text y={-nr - 8} textAnchor="middle" fill="#94a3b8" fontSize={8}>
                        {qc} queries · {connectionCounts[node.id] || 0} connections
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
