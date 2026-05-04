'use client';

import type { RefObject } from 'react';
import type { Node } from './MindMap';
import type { ClusterData, LayoutNode, TopicLink } from './MindMapUtils';
import { getClusterColor } from './MindMapUtils';

interface MindMapSVGProps {
  svgRef: RefObject<SVGSVGElement | null>;
  pan: { x: number; y: number };
  zoom: number;
  clusters: ClusterData[];
  layoutNodes: Record<string, LayoutNode>;
  filteredNodes: Node[];
  displayNodes: Node[];
  visibleLinks: TopicLink[];
  connectedTopicIds: Set<string>;
  connectionCounts: Record<string, number>;
  hoveredNode: string | null;
  analyseOpen: boolean;
  pulsingClusters: Set<string>;
  getPos: (id: string) => { x: number; y: number } | null;
  setHoveredNode: (id: string | null) => void;
  setExpandedCluster: (cat: string) => void;
  handleNodeClick: (e: React.MouseEvent, node: Node) => void;
  handleNodeMouseDown: (e: React.MouseEvent, nodeId: string) => void;
}

export default function MindMapSVG({
  svgRef,
  pan,
  zoom,
  clusters,
  layoutNodes,
  filteredNodes,
  displayNodes,
  visibleLinks,
  connectedTopicIds,
  connectionCounts,
  hoveredNode,
  analyseOpen,
  pulsingClusters,
  getPos,
  setHoveredNode,
  setExpandedCluster,
  handleNodeClick,
  handleNodeMouseDown,
}: MindMapSVGProps) {
  return (
    <svg ref={svgRef} className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.08" />
        </filter>
        <filter id="pulse-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {clusters.map((cluster, idx) => {
          const color = getClusterColor(cluster.category, idx);
          return (
            <radialGradient
              key={`grad-${cluster.category}`}
              id={`cluster-grad-${idx}`}
              cx="50%"
              cy="50%"
              r="50%"
            >
              <stop offset="0%" stopColor={color.text} stopOpacity={0.18} />
              <stop offset="60%" stopColor={color.text} stopOpacity={0.08} />
              <stop offset="100%" stopColor={color.text} stopOpacity={0.02} />
            </radialGradient>
          );
        })}
      </defs>

      <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
        {/* Cluster ellipses */}
        {clusters.map((cluster, idx) => {
          const color = getClusterColor(cluster.category, idx);
          const isPulsing = pulsingClusters.has(cluster.category);

          return (
            <g
              key={`cluster-${cluster.category}`}
              onClick={(e) => {
                e.stopPropagation();
                setExpandedCluster(cluster.category);
              }}
              style={{ cursor: 'pointer' }}
            >
              <ellipse
                cx={cluster.cx}
                cy={cluster.cy}
                rx={cluster.rx}
                ry={cluster.ry}
                fill={`url(#cluster-grad-${idx})`}
                stroke={color.stroke}
                strokeWidth={isPulsing ? 2.5 : 2}
                strokeDasharray={isPulsing ? 'none' : '6 4'}
                strokeOpacity={isPulsing ? 0.5 : 0.4}
                opacity={isPulsing ? 1 : 0.85}
                filter={isPulsing ? 'url(#pulse-glow)' : undefined}
                className="transition-all duration-500"
              />
              <text
                x={cluster.cx}
                y={cluster.cy - cluster.ry * 0.7}
                textAnchor="middle"
                fill={color.text}
                fontSize={12}
                fontWeight={800}
                fontFamily="'JetBrains Mono', ui-monospace, monospace"
                opacity={0.85}
                className="select-none pointer-events-none"
              >
                {cluster.category}
              </text>
              <text
                x={cluster.cx}
                y={cluster.cy - cluster.ry * 0.7 + 14}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize={9}
                fontFamily="'JetBrains Mono', ui-monospace, monospace"
                className="select-none pointer-events-none"
              >
                {cluster.nodes.length} topics
              </text>
            </g>
          );
        })}

        {/* Cross-cluster connection lines — ghost by default, active on hover */}
        <g className="connections" style={{ pointerEvents: 'none' }}>
          {visibleLinks.map((link, idx) => {
            const sourcePos = getPos(link.source);
            const targetPos = getPos(link.target);
            if (!sourcePos || !targetPos) return null;

            const sourceNode = filteredNodes.find((n) => n.id === link.source);
            const isActive = hoveredNode === link.source || hoveredNode === link.target;
            const mx = (sourcePos.x + targetPos.x) / 2;
            const my = (sourcePos.y + targetPos.y) / 2 - 15;
            const srcCatIdx = clusters.findIndex(
              (c) => c.category === (sourceNode?.category || 'other')
            );
            const srcColor = getClusterColor(
              sourceNode?.category || 'other',
              srcCatIdx >= 0 ? srcCatIdx : 0
            ).text;

            return (
              <g key={`link-${idx}`}>
                <path
                  d={`M ${sourcePos.x} ${sourcePos.y} Q ${mx} ${my} ${targetPos.x} ${targetPos.y}`}
                  fill="none"
                  stroke={srcColor}
                  strokeWidth={isActive ? 1.2 : 0.3}
                  opacity={isActive ? 0.45 : 0.05}
                  strokeLinecap="round"
                />
                {isActive && (
                  <>
                    <circle cx={sourcePos.x} cy={sourcePos.y} r={5} fill={srcColor} opacity={0.9} />
                    <circle cx={targetPos.x} cy={targetPos.y} r={5} fill={srcColor} opacity={0.9} />
                  </>
                )}
              </g>
            );
          })}
        </g>

        {/* Top 5 nodes per cluster — sized by importance, labels for important / hovered */}
        {clusters.map((cluster, cIdx) => {
          const color = getClusterColor(cluster.category, cIdx);
          const top5 = cluster.nodes.slice(0, 5);
          return top5.map((node) => {
            const pos = getPos(node.id);
            if (!pos) return null;
            const isHov = hoveredNode === node.id;
            const conns = connectionCounts[node.id] || 0;
            const queryCount = node.queryCount || 1;
            const importance = conns + Math.min(queryCount, 10);
            const baseRadius = Math.max(4, Math.min(20, 4 + importance * 1.5));
            const isImportant = importance >= 5;
            const labelText = node.name.length > 20 ? node.name.slice(0, 17) + '...' : node.name;

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                style={{ pointerEvents: 'all', cursor: 'pointer' }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  handleNodeClick(e, node);
                }}
              >
                <circle r={Math.max(baseRadius + 6, 14)} fill="transparent" />
                <circle
                  r={baseRadius}
                  fill={isHov ? color.text : isImportant ? color.text + 'DD' : color.text + '40'}
                  stroke={isHov ? 'white' : 'none'}
                  strokeWidth={isHov ? 1.5 : 0}
                />
                {isHov && (
                  <circle
                    r={baseRadius + 5}
                    fill="none"
                    stroke={color.text}
                    strokeWidth={0.5}
                    opacity={0.3}
                  />
                )}
                {(isImportant || isHov) && (
                  <text
                    y={baseRadius + 12}
                    textAnchor="middle"
                    fontSize={9}
                    fill={isHov ? '#1e293b' : '#64748b'}
                    fontWeight={isImportant ? 500 : 400}
                    opacity={isHov ? 1 : 0.7}
                    className="select-none pointer-events-none"
                  >
                    {labelText}
                  </text>
                )}
              </g>
            );
          });
        })}

        {/* Hover card */}
        {hoveredNode &&
          !analyseOpen &&
          (() => {
            const node = displayNodes.find((n) => n.id === hoveredNode);
            if (!node) return null;
            const pos = getPos(hoveredNode);
            if (!pos) return null;
            const ln = layoutNodes[hoveredNode];
            if (!ln) return null;

            const conns = visibleLinks.filter(
              (l) => l.source === hoveredNode || l.target === hoveredNode
            );
            const connCats: Record<string, number> = {};
            conns.forEach((l) => {
              const otherId = l.source === hoveredNode ? l.target : l.source;
              const otherNode = filteredNodes.find((n) => n.id === otherId);
              const cat = otherNode?.category || 'other';
              connCats[cat] = (connCats[cat] || 0) + 1;
            });

            const connNames = conns
              .slice(0, 3)
              .map((l) => {
                const oid = l.source === hoveredNode ? l.target : l.source;
                return filteredNodes.find((n) => n.id === oid)?.name;
              })
              .filter(Boolean);
            const cardW = 220;
            const cardH = 96 + Object.keys(connCats).length * 16;

            return (
              <foreignObject
                x={pos.x + 20}
                y={pos.y - cardH / 2}
                width={cardW}
                height={cardH}
                style={{ pointerEvents: 'none', overflow: 'visible' }}
              >
                <div
                  style={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    padding: '10px 12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: 10,
                    color: '#334155',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 3 }}>{node.name}</div>
                  <div style={{ color: '#94a3b8', marginBottom: 3 }}>
                    {node.queryCount || 0} queries · {conns.length} connections ·{' '}
                    {node.category || 'other'}
                  </div>
                  <div
                    style={{ color: '#64748b', fontSize: 9, marginBottom: 5, lineHeight: '1.3' }}
                  >
                    {node.description
                      ? node.description.slice(0, 60) + (node.description.length > 60 ? '...' : '')
                      : connNames.length > 0
                        ? `Related to: ${connNames.join(', ')}`
                        : ''}
                  </div>
                  {Object.entries(connCats).map(([cat, count]) => {
                    const ci = clusters.findIndex((c) => c.category === cat);
                    const cc = getClusterColor(cat, ci >= 0 ? ci : 0);
                    return (
                      <div
                        key={cat}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: cc.text,
                            display: 'inline-block',
                          }}
                        />
                        <span>{cat}</span>
                        <span style={{ color: '#cbd5e1', marginLeft: 'auto' }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </foreignObject>
            );
          })()}
      </g>
    </svg>
  );
}
