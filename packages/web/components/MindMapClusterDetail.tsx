'use client';

import { useMemo, useState } from 'react';
import type { Node } from './MindMap';
import type { ClusterData, TopicLink } from './MindMapUtils';
import { getClusterColor } from './MindMapUtils';
import {
  flowerOfLifeLayout,
  flowerOfLifeCircles,
  flowerLayoutRadius,
} from '@/lib/flower-of-life-layout';
import { useIsDarkTheme } from './akhai-mindmap/tunnel-theme';

// Vogel spacing for the drill flower: max dot radius is 35 (diameter 70), spacing 100 keeps every
// pair ≥ ~80 apart (see lib/__tests__/flower-of-life-layout.test.ts) — no collisions at 124+ nodes.
const FLOWER_SPACING = 100;

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
  const isDark = useIsDarkTheme();
  const drillPanStartRef = { x: 0, y: 0, panX: 0, panY: 0 };

  const cl = clusters.find((c) => c.category === expandedCluster);
  if (!cl) return null;
  const cc = getClusterColor(cl.category, clusters.indexOf(cl));
  const { positions: fPos, links: fLinks, sortedNodes: fNodes } = forceLayoutNodes;
  if (fPos.length === 0) return null;
  // mindmap-flower: the drill view positions nodes on a pertinence-ranked Flower-of-Life layout —
  // most-important topic at the exact center, less-important radiating outward on a golden-angle
  // spiral (deterministic). The OUTER graph's force layout is untouched; fPos only gates emptiness.
  const importanceOf = (n: Node) =>
    (connectionCounts[n.id] || 0) + Math.min(n.queryCount || 1, 8);
  const maxR = flowerLayoutRadius(fNodes.length, FLOWER_SPACING);
  const svgW = Math.max(900, Math.ceil(2 * (maxR + 160)));
  const svgH = Math.max(700, Math.ceil(2 * (maxR + 160)));
  const flowerCenter = { x: svgW / 2, y: svgH / 2 };
  const posMap = flowerOfLifeLayout(fNodes, importanceOf, flowerCenter, FLOWER_SPACING);
  const centerId = fNodes.find((n) => {
    const p = posMap.get(n.id);
    return !!p && p.x === flowerCenter.x && p.y === flowerCenter.y;
  })?.id;
  const backdropCircles = flowerOfLifeCircles(flowerCenter, Math.max(150, (maxR + 80) / 3));
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

  const subclusters = useMemo(() => {
    if (!fNodes?.length) return [];
    const groups: Record<string, Node[]> = {};
    for (const n of fNodes) {
      const k = n.name.split(/[\s,·-]/)[0].toLowerCase();
      (groups[k.length > 3 ? k : 'other'] ||= []).push(n);
    }
    return Object.entries(groups)
      .map(([k, items]) => ({ name: k[0].toUpperCase() + k.slice(1), count: items.length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [fNodes]);

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
        {subclusters.length > 1 && (
          <div className="flex flex-wrap gap-2 border-b border-slate-200 px-4 py-2.5 dark:border-slate-700">
            {subclusters.slice(0, 6).map((s) => (
              <span key={s.name} className="rounded bg-slate-100 px-2 py-0.5 text-[10px]">
                {s.name} {s.count}
              </span>
            ))}
          </div>
        )}
        <div
          style={{
            width: '100%',
            height: subclusters.length > 1 ? 'calc(100% - 130px)' : 'calc(100% - 52px)',
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
              {/* Flower-of-Life backdrop — the sacred substrate, faint + theme-aware.
                  non-scaling-stroke keeps the guide lines a crisp 1px at any zoom (the drill
                  viewBox spans thousands of units, so a scaled stroke would vanish). */}
              <g pointerEvents="none" opacity={0.08}>
                {backdropCircles.map((c, i) => (
                  <circle
                    key={`fol-${i}`}
                    cx={c.cx}
                    cy={c.cy}
                    r={c.r}
                    fill="none"
                    stroke={isDark ? '#e2e8f0' : '#334155'}
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </g>
              {fLinks.map((link, li) => {
                const ps = posMap.get(link.source),
                  pt = posMap.get(link.target);
                if (!ps || !pt) return null;
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
                    strokeWidth={isHi ? 1.2 : 0.3}
                    opacity={isHi ? 0.4 : 0.08}
                  />
                );
              })}
              {fNodes.map((node) => {
                const p = posMap.get(node.id);
                if (!p) return null;
                const qc = node.queryCount || 0;
                const conns = connectionCounts[node.id] || 0;
                const importance = conns + Math.min(qc || 1, 8);
                const nodeRadius = Math.max(10, Math.min(35, 10 + importance * 2.5));
                const isImportant = importance >= 2 || hubIds.has(node.id);
                const isCenter = node.id === centerId;
                const isHov = hoveredNode === node.id;
                const isConnected = connectedIds ? connectedIds.has(node.id) : false;
                const nodeOpacity = connectedIds ? (isHov ? 1 : isConnected ? 0.6 : 0.15) : 1;
                const labelText =
                  node.name.length > 30 ? node.name.slice(0, 27) + '\u2026' : node.name;
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
                    <circle r={Math.max(nodeRadius + 8, 16)} fill="transparent" />
                    {/* center emphasis — the cluster's heart gets a soft glow + double ring */}
                    {isCenter && (
                      <>
                        <circle r={nodeRadius + 18} fill={cc.text} opacity={0.07} />
                        <circle
                          r={nodeRadius + 14}
                          fill="none"
                          stroke={cc.text}
                          strokeWidth={0.6}
                          opacity={0.2}
                        />
                        <circle
                          r={nodeRadius + 6}
                          fill="none"
                          stroke={cc.text}
                          strokeWidth={1}
                          opacity={0.45}
                        />
                      </>
                    )}
                    <circle
                      r={nodeRadius}
                      fill={isHov ? cc.text : isImportant ? cc.text + 'CC' : cc.text + '80'}
                      stroke={isHov ? 'white' : 'none'}
                      strokeWidth={isHov ? 1.5 : 0}
                    />
                    {isHov && (
                      <circle
                        r={nodeRadius + 4}
                        fill="none"
                        stroke={cc.text}
                        strokeWidth={0.5}
                        opacity={0.3}
                      />
                    )}
                    {(isImportant || isHov) && (
                      <text
                        y={nodeRadius + 16}
                        textAnchor="middle"
                        fill={isHov ? cc.text : isDark ? '#f1f5f9' : '#475569'}
                        fontSize={isImportant ? 16 : 13}
                        fontWeight={isImportant ? 600 : 400}
                        opacity={1}
                      >
                        {isHov ? node.name : labelText}
                      </text>
                    )}
                    {isHov && (
                      <text y={-nodeRadius - 8} textAnchor="middle" fill="#94a3b8" fontSize={8}>
                        {qc} queries · {conns} connections
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
