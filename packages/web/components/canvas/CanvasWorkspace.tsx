'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { QueryCard } from './QueryCardsPanel';
import type { VisualNode, VisualEdge } from './VisualsPanel';
import type { AIInsight } from './AILayersPanel';
import { useLayerStore } from '@/lib/stores/layer-store';

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

type NodeType =
  | 'query'
  | 'topic'
  | 'note'
  | 'config'
  | 'stat'
  | 'diagram'
  | 'chart'
  | 'drawing'
  | 'table'
  | 'timeline'
  | 'radar'
  | 'goal'
  | 'milestone';

interface CanvasNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  w: number;
  h: number;
  data: any;
}

interface Connection {
  from: string;
  to: string;
  color: string;
}
interface DrawPoint {
  x: number;
  y: number;
}
interface DrawStroke {
  points: DrawPoint[];
  color: string;
  width: number;
}

const METHOD_COLORS: Record<string, string> = {
  auto: '#8b5cf6',
  direct: '#6366f1',
  cod: '#10b981',
  bot: '#f59e0b',
  react: '#ef4444',
  pot: '#0ea5e9',
  gtp: '#ec4899',
};
const TOPIC_COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#0ea5e9',
  '#8b5cf6',
  '#ef4444',
  '#14b8a6',
];

function getTopicColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return TOPIC_COLORS[Math.abs(hash) % TOPIC_COLORS.length];
}

function extractTopics(text: string): string[] {
  const words = text.match(/[A-Z][a-z]+(?:\s[A-Z][a-z]+)*/g) || [];
  return [...new Set(words)]
    .filter(
      (w) =>
        w.length > 3 &&
        ![
          'This',
          'That',
          'These',
          'Those',
          'What',
          'When',
          'Where',
          'Which',
          'There',
          'Here',
          'Three',
          'Four',
          'Five',
          'Several',
          'Many',
          'Some',
          'Each',
          'Both',
          'Most',
          'Much',
          'Very',
          'Also',
          'However',
          'Therefore',
          'Furthermore',
          'Moreover',
          'Additionally',
          'Sorry',
          'Please',
          'Error',
        ].includes(w)
    )
    .slice(0, 5);
}

// === LOCAL FALLBACK GENERATORS ===
function generateLocalDiagram(query: string, response: string): any {
  const topics = extractTopics(response);
  if (topics.length === 0) topics.push(query.split(' ').slice(0, 3).join(' '));
  const nodes = topics.map((t, i) => ({
    id: `n${i}`,
    label: t,
    color: TOPIC_COLORS[i % TOPIC_COLORS.length],
  }));
  // Central node from query
  const central = { id: 'nc', label: query.slice(0, 32), color: '#6366f1' };
  const edges = nodes.map((n) => ({ from: 'nc', to: n.id, label: '' }));
  return { title: query.slice(0, 60), type: 'mindmap', nodes: [central, ...nodes], edges };
}

function generateLocalChart(query: string, response: string): any {
  // Extract numbers from response, or estimate topic relevance
  const numMatches = response.match(/\d+(\.\d+)?%?/g)?.slice(0, 8) || [];
  const topics = extractTopics(response).slice(0, 6);
  if (topics.length === 0) topics.push('Main', 'Secondary', 'Other');
  const data = topics.map((t, i) => ({
    label: t,
    value: numMatches[i]
      ? parseFloat(numMatches[i].replace('%', ''))
      : Math.round(20 + Math.random() * 60),
    color: TOPIC_COLORS[i % TOPIC_COLORS.length],
  }));
  return { title: query.slice(0, 60), xLabel: 'Topics', yLabel: 'Relevance', data };
}

function generateLocalTable(query: string, response: string): any {
  const topics = extractTopics(response).slice(0, 5);
  if (topics.length === 0) topics.push('Item 1', 'Item 2', 'Item 3');
  const rows = topics.map((t, i) => ({
    entity: t,
    relevance: Math.round(60 + Math.random() * 40) + '%',
    category: ['Primary', 'Secondary', 'Tertiary'][i % 3],
  }));
  return { title: query.slice(0, 60), columns: ['Entity', 'Relevance', 'Category'], rows };
}

function generateLocalTimeline(query: string, response: string): any {
  const topics = extractTopics(response).slice(0, 6);
  if (topics.length === 0) topics.push('Start', 'Middle', 'End');
  const events = topics.map((t, i) => ({
    label: t,
    description: '',
    color: TOPIC_COLORS[i % TOPIC_COLORS.length],
  }));
  return { title: query.slice(0, 60), events };
}

function generateLocalRadar(query: string, response: string): any {
  const topics = extractTopics(response).slice(0, 6);
  if (topics.length < 3) topics.push('Dimension A', 'Dimension B', 'Dimension C');
  const axes = topics.map((t) => ({ label: t, value: Math.round(30 + Math.random() * 70) }));
  return { title: query.slice(0, 60), axes };
}

// === DIAGRAM/CHART GENERATION ===
type VizType = 'diagram' | 'chart' | 'table' | 'timeline' | 'radar';
async function generateVisualization(query: string, response: string, type: VizType): Promise<any> {
  try {
    const res = await fetch('/api/canvas-viz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, response: response.slice(0, 800), type }),
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    if (data.viz) return data.viz;
  } catch (e) {
    console.error('Viz API failed, using local fallback:', e);
  }
  // Local fallback — always produce something
  const fallbacks: Record<VizType, () => any> = {
    diagram: () => generateLocalDiagram(query, response),
    chart: () => generateLocalChart(query, response),
    table: () => generateLocalTable(query, response),
    timeline: () => generateLocalTimeline(query, response),
    radar: () => generateLocalRadar(query, response),
  };
  return fallbacks[type]();
}

// === MINI RENDERERS ===
function DiagramRenderer({ data }: { data: any }) {
  if (!data?.nodes)
    return <div style={{ padding: 10, fontSize: 9, color: '#94a3b8' }}>generating...</div>;
  const cx = 200,
    cy = 140,
    radius = 110;
  const allNodes = data.nodes || [];
  const central = allNodes[0];
  const children = allNodes.slice(1);
  const nodePos: Record<string, { x: number; y: number }> = {};
  if (central) nodePos[central.id] = { x: cx, y: cy };
  children.forEach((n: any, i: number) => {
    const angle = (i / Math.max(children.length, 1)) * Math.PI * 2 - Math.PI / 2;
    nodePos[n.id] = { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
  });
  return (
    <div style={{ padding: '8px 10px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: '#1e293b',
          marginBottom: 6,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          wordBreak: 'break-word',
        }}
      >
        {data.title || 'Diagram'}
      </div>
      <svg width="100%" height="100%" viewBox="0 0 400 300" style={{ flex: 1 }}>
        <defs>
          <filter id="dshadow">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.12" />
          </filter>
        </defs>
        {(data.edges || []).map((e: any, i: number) => {
          const f = nodePos[e.from],
            t = nodePos[e.to];
          if (!f || !t) return null;
          const mx = (f.x + t.x) / 2,
            my = (f.y + t.y) / 2;
          const cpx = mx + (cy - my) * 0.3,
            cpy = my + (mx - cx) * 0.3;
          const tNode = allNodes.find((n: any) => n.id === e.to);
          const edgeColor = tNode?.color || '#cbd5e1';
          return (
            <path
              key={i}
              d={`M ${f.x} ${f.y} Q ${cpx} ${cpy} ${t.x} ${t.y}`}
              fill="none"
              stroke={`${edgeColor}66`}
              strokeWidth={1.5}
            />
          );
        })}
        {/* Central node */}
        {central && (
          <g>
            <circle
              cx={cx}
              cy={cy}
              r={30}
              fill="none"
              stroke={`${central.color || '#6366f1'}30`}
              strokeWidth={1}
            >
              <animate attributeName="r" values="30;34;30" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0.4;1" dur="3s" repeatCount="indefinite" />
            </circle>
            <rect
              x={cx - 70}
              y={cy - 24}
              width={140}
              height={48}
              rx={8}
              fill={`${central.color || '#6366f1'}15`}
              stroke={`${central.color || '#6366f1'}50`}
              strokeWidth={1.5}
              filter="url(#dshadow)"
            />
            <text
              x={cx}
              y={cy + 5}
              textAnchor="middle"
              fontSize={11}
              fontWeight={700}
              fill={central.color || '#6366f1'}
              fontFamily="'JetBrains Mono',monospace"
            >
              {central.label?.slice(0, 22)}
            </text>
          </g>
        )}
        {/* Child nodes */}
        {children.map((n: any) => {
          const pos = nodePos[n.id];
          const c = n.color || '#6366f1';
          return (
            <g key={n.id}>
              <rect
                x={pos.x - 52}
                y={pos.y - 16}
                width={104}
                height={32}
                rx={6}
                fill={`${c}12`}
                stroke={`${c}40`}
                strokeWidth={1}
                filter="url(#dshadow)"
              />
              <text
                x={pos.x}
                y={pos.y + 4}
                textAnchor="middle"
                fontSize={9}
                fontWeight={500}
                fill={c}
                fontFamily="'JetBrains Mono',monospace"
              >
                {n.label?.slice(0, 18)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function ChartRenderer({ data }: { data: any }) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);
  if (!data?.data)
    return <div style={{ padding: 10, fontSize: 9, color: '#94a3b8' }}>generating...</div>;
  const maxVal = Math.max(...data.data.map((d: any) => d.value || 0), 1);
  const ticks = [0, 25, 50, 75, 100];
  const chartH = 120,
    chartL = 28,
    chartR = 8,
    chartT = 6,
    chartB = 28;
  return (
    <div style={{ padding: '8px 10px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: '#1e293b',
          marginBottom: 4,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          wordBreak: 'break-word',
        }}
      >
        {data.title || 'Chart'}
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${chartL + data.data.length * 36 + chartR} ${chartT + chartH + chartB}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Y-axis ticks + gridlines */}
          {ticks.map((t) => {
            const y = chartT + chartH - (t / 100) * chartH;
            return (
              <g key={t}>
                <text
                  x={chartL - 4}
                  y={y + 3}
                  textAnchor="end"
                  fontSize={6}
                  fill="#94a3b8"
                  fontFamily="'JetBrains Mono',monospace"
                >
                  {Math.round((t / 100) * maxVal)}
                </text>
                <line
                  x1={chartL}
                  y1={y}
                  x2={chartL + data.data.length * 36}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth={0.5}
                  strokeDasharray="3 2"
                />
              </g>
            );
          })}
          {/* Y axis line */}
          <line
            x1={chartL}
            y1={chartT}
            x2={chartL}
            y2={chartT + chartH}
            stroke="#e2e8f0"
            strokeWidth={0.5}
          />
          {/* X axis line */}
          <line
            x1={chartL}
            y1={chartT + chartH}
            x2={chartL + data.data.length * 36}
            y2={chartT + chartH}
            stroke="#e2e8f0"
            strokeWidth={0.5}
          />
          {/* Bars */}
          {data.data.map((d: any, i: number) => {
            const barColor = d.color || TOPIC_COLORS[i % TOPIC_COLORS.length];
            const pct = Math.max(0.02, (d.value || 0) / maxVal);
            const barH = mounted ? pct * chartH : 0;
            const barW = 22,
              barX = chartL + i * 36 + 7;
            const barY = chartT + chartH - barH;
            const isHov = hoveredBar === i;
            const tall = pct > 0.4;
            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredBar(i)}
                onMouseLeave={() => setHoveredBar(null)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={barX}
                  y={barY}
                  width={barW}
                  height={barH}
                  rx={4}
                  fill={barColor}
                  opacity={isHov ? 1 : 0.85}
                  style={{
                    transition: 'height 0.6s ease-out, y 0.6s ease-out, opacity 0.15s',
                    transform: isHov ? 'scale(1.05)' : 'none',
                    transformOrigin: `${barX + barW / 2}px ${chartT + chartH}px`,
                  }}
                />
                {/* Dark accent line at bar top */}
                {barH > 4 && (
                  <rect
                    x={barX}
                    y={barY}
                    width={barW}
                    height={2}
                    rx={1}
                    fill={barColor}
                    opacity={0.6}
                    style={{ transition: 'y 0.6s ease-out' }}
                  />
                )}
                {/* Value label */}
                <text
                  x={barX + barW / 2}
                  y={tall ? barY + 12 : barY - 4}
                  textAnchor="middle"
                  fontSize={7}
                  fontWeight={600}
                  fill={tall ? '#fff' : '#64748b'}
                  fontFamily="'JetBrains Mono',monospace"
                  style={{ transition: 'y 0.6s ease-out' }}
                >
                  {d.value}
                </text>
                {/* X label */}
                <text
                  x={barX + barW / 2}
                  y={chartT + chartH + 8}
                  textAnchor="end"
                  fontSize={6}
                  fill="#94a3b8"
                  fontFamily="'JetBrains Mono',monospace"
                  transform={`rotate(-30 ${barX + barW / 2} ${chartT + chartH + 8})`}
                >
                  <title>{d.label}</title>
                  {d.label?.slice(0, 20)}
                </text>
                {/* Hover tooltip */}
                {isHov && (
                  <g>
                    <rect
                      x={barX - 8}
                      y={barY - 22}
                      width={barW + 16}
                      height={16}
                      rx={3}
                      fill="#1e293b"
                    />
                    <text
                      x={barX + barW / 2}
                      y={barY - 11}
                      textAnchor="middle"
                      fontSize={7}
                      fontWeight={600}
                      fill="#fff"
                      fontFamily="'JetBrains Mono',monospace"
                    >
                      {d.value}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function TableRenderer({ data }: { data: any }) {
  if (!data?.rows)
    return <div style={{ padding: 10, fontSize: 9, color: '#94a3b8' }}>generating...</div>;
  const cols = data.columns || Object.keys(data.rows[0] || {});
  return (
    <div
      style={{
        padding: '8px 10px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: '#1e293b',
          marginBottom: 6,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          wordBreak: 'break-word',
        }}
      >
        {data.title || 'Table'}
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 8,
            fontFamily: "'JetBrains Mono',monospace",
          }}
        >
          <thead>
            <tr>
              {cols.map((c: string, i: number) => (
                <th
                  key={i}
                  style={{
                    padding: '3px 6px',
                    textAlign: 'left',
                    background: '#f59e0b15',
                    color: '#92400e',
                    fontWeight: 600,
                    fontSize: 7,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #f59e0b30',
                  }}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row: any, ri: number) => {
              const vals = Array.isArray(row)
                ? row
                : cols.map((c: string) => row[c.toLowerCase()] ?? row[c] ?? '');
              return (
                <tr key={ri} style={{ background: ri % 2 === 0 ? '#f8fafc' : 'white' }}>
                  {vals.map((v: any, ci: number) => (
                    <td
                      key={ci}
                      title={String(v)}
                      style={{
                        padding: '3px 6px',
                        color: '#475569',
                        borderBottom: '1px solid #f1f5f9',
                      }}
                    >
                      {String(v).slice(0, 50)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TimelineRenderer({ data }: { data: any }) {
  if (!data?.events)
    return <div style={{ padding: 10, fontSize: 9, color: '#94a3b8' }}>generating...</div>;
  const events = data.events.slice(0, 8);
  const spacing = Math.min(80, 360 / Math.max(events.length, 1));
  const vbW = Math.min(500, events.length * spacing + 40);
  return (
    <div style={{ padding: '8px 10px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: '#1e293b',
          marginBottom: 6,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          wordBreak: 'break-word',
        }}
      >
        {data.title || 'Timeline'}
      </div>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${vbW} 80`}
        preserveAspectRatio="xMidYMid meet"
        style={{ flex: 1 }}
      >
        {/* Main line */}
        <line
          x1={20}
          y1={40}
          x2={events.length * spacing + 20}
          y2={40}
          stroke="#e2e8f0"
          strokeWidth={2}
        />
        {events.map((ev: any, i: number) => {
          const x = 20 + i * spacing + spacing / 2;
          const color = ev.color || TOPIC_COLORS[i % TOPIC_COLORS.length];
          const above = i % 2 === 0;
          return (
            <g key={i}>
              <circle cx={x} cy={40} r={5} fill={color} stroke="white" strokeWidth={1.5} />
              <text
                x={x}
                y={above ? 18 : 64}
                textAnchor="middle"
                fontSize={8}
                fontWeight={500}
                fill="#475569"
                fontFamily="'JetBrains Mono',monospace"
              >
                <title>{ev.label}</title>
                {ev.label?.slice(0, 30)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function RadarRenderer({ data }: { data: any }) {
  if (!data?.axes)
    return <div style={{ padding: 10, fontSize: 9, color: '#94a3b8' }}>generating...</div>;
  const axes = data.axes.slice(0, 8);
  const cx = 150,
    cy = 120,
    maxR = 90;
  const rings = [25, 50, 75, 100];
  const angleStep = (Math.PI * 2) / axes.length;
  const dataPoints = axes.map((a: any, i: number) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = (Math.min(a.value, 100) / 100) * maxR;
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
  });
  const polygon = dataPoints.map((p: any) => `${p.x},${p.y}`).join(' ');
  return (
    <div style={{ padding: '8px 10px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: '#1e293b',
          marginBottom: 6,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          wordBreak: 'break-word',
        }}
      >
        {data.title || 'Radar'}
      </div>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 300 250"
        preserveAspectRatio="xMidYMid meet"
        style={{ flex: 1 }}
      >
        {/* Guide rings */}
        {rings.map((r) => (
          <circle
            key={r}
            cx={cx}
            cy={cy}
            r={(r / 100) * maxR}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={0.5}
          />
        ))}
        {/* Axis lines + labels */}
        {axes.map((a: any, i: number) => {
          const angle = i * angleStep - Math.PI / 2;
          const lx = cx + Math.cos(angle) * (maxR + 16);
          const ly = cy + Math.sin(angle) * (maxR + 16);
          return (
            <g key={i}>
              <line
                x1={cx}
                y1={cy}
                x2={cx + Math.cos(angle) * maxR}
                y2={cy + Math.sin(angle) * maxR}
                stroke="#e2e8f0"
                strokeWidth={0.5}
              />
              <text
                x={lx}
                y={ly + 3}
                textAnchor="middle"
                fontSize={7}
                fill="#64748b"
                fontFamily="'JetBrains Mono',monospace"
              >
                {a.label?.slice(0, 12)}
              </text>
            </g>
          );
        })}
        {/* Data polygon */}
        {(() => {
          const c = data.color || '#6366f1';
          return (
            <>
              <polygon points={polygon} fill={`${c}20`} stroke={c} strokeWidth={2} />
              {dataPoints.map((p: any, i: number) => (
                <circle key={i} cx={p.x} cy={p.y} r={3} fill={c} stroke="white" strokeWidth={1} />
              ))}
            </>
          );
        })()}
      </svg>
    </div>
  );
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
  const [generating, setGenerating] = useState<string | null>(null); // "diagram" | "chart" | null
  const autoGenDone = useRef(false);
  const nodesRef = useRef<CanvasNode[]>([]);
  nodesRef.current = nodes;

  // Pencil drawing state
  const [strokes, setStrokes] = useState<DrawStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<DrawPoint[] | null>(null);
  const [pencilColor, setPencilColor] = useState('#1e293b');

  const weights = useLayerStore((s) => s.weights);
  const activePreset = useLayerStore((s) => s.activePreset);

  // Auto-generate nodes from queryCards
  useEffect(() => {
    if (queryCards.length === 0) return;
    const newNodes: CanvasNode[] = [];
    const newConns: Connection[] = [];
    const topicMap: Record<string, { count: number; nodeId: string }> = {};
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
        data: { ...card, methodology: card.methodology || 'auto' },
      });
      const topics = extractTopics(card.response);
      topics.forEach((topic) => {
        const tKey = topic.toLowerCase();
        if (!topicMap[tKey]) {
          const tId = `t-${tKey.replace(/\s/g, '-')}`;
          topicMap[tKey] = { count: 1, nodeId: tId };
          newNodes.push({
            id: tId,
            type: 'topic',
            x: topicX + (Math.random() - 0.5) * 120,
            y: topicY,
            w: 110,
            h: 44,
            data: { name: topic, count: 1, color: getTopicColor(topic) },
          });
          topicY += 56;
          if (topicY > 500) {
            topicY = 60;
            topicX += 140;
          }
        } else {
          topicMap[tKey].count++;
          const existing = newNodes.find((n) => n.id === topicMap[tKey].nodeId);
          if (existing) existing.data.count = topicMap[tKey].count;
        }
        newConns.push({ from: qId, to: topicMap[tKey].nodeId, color: getTopicColor(topic) });
      });
    });
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
  const VIZ_TYPES: VizType[] = ['diagram', 'chart', 'table', 'timeline', 'radar'];
  const VIZ_COLORS: Record<VizType, string> = {
    diagram: '#8b5cf6',
    chart: '#10b981',
    table: '#f59e0b',
    timeline: '#0ea5e9',
    radar: '#ec4899',
  };
  const VIZ_SIZES: Record<VizType, { w: number; h: number }> = {
    diagram: { w: 380, h: 280 },
    chart: { w: 300, h: 220 },
    table: { w: 440, h: 200 },
    timeline: { w: 460, h: 140 },
    radar: { w: 320, h: 280 },
  };

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

    // Auto-generate for the most recent query (skip error responses)
    const latest = queryNodes[queryNodes.length - 1];
    const resp = latest.data.response || '';
    const isError = resp.startsWith('Sorry') || resp.startsWith('Error') || resp.length < 80;
    if (isError && queryNodes.length === 1) return; // Don't auto-gen for solo error queries
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
      // Pencil tool — start drawing
      if (tool === 'pencil') {
        const pos = getCanvasPos(e);
        setCurrentStroke([pos]);
        return;
      }
      // Note tool — place note
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
      // Pencil — continue stroke
      if (currentStroke && tool === 'pencil') {
        const pos = getCanvasPos(e);
        setCurrentStroke((prev) => (prev ? [...prev, pos] : null));
      }
    },
    [isPanning, dragging, connecting, currentStroke, tool, pan, zoom]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      // Pencil — finish stroke
      if (currentStroke && currentStroke.length > 1) {
        setStrokes((prev) => [...prev, { points: currentStroke, color: pencilColor, width: 2 }]);
        setCurrentStroke(null);
      } else {
        setCurrentStroke(null);
      }
      // Connect — complete connection
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
  const selectedIsQuery = selected ? nodes.find((n) => n.id === selected)?.type === 'query' : false;

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
        {(
          [
            { id: 'select', icon: '↖', label: 'select' },
            { id: 'pencil', icon: '✏', label: 'pencil' },
            { id: 'connect', icon: '⟶', label: 'connect' },
            { id: 'note', icon: '✎', label: 'note' },
            { id: 'goal', icon: '◎', label: 'goal' },
            { id: 'milestone', icon: '◇', label: 'milestone' },
          ] as const
        ).map((t) => (
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
            {['#1e293b', '#6366f1', '#ef4444', '#10b981', '#f59e0b', '#ec4899'].map((c) => (
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

        {/* Diagram/Chart generation — always visible, disabled when no query selected */}
        {[
          { type: 'diagram' as const, icon: '◈', color: '#8b5cf6' },
          { type: 'chart' as const, icon: '▥', color: '#10b981' },
          { type: 'table' as const, icon: '⊞', color: '#f59e0b' },
          { type: 'timeline' as const, icon: '◉', color: '#0ea5e9' },
          { type: 'radar' as const, icon: '⬡', color: '#ec4899' },
        ].map((btn) => (
          <button
            key={btn.type}
            onClick={() => selectedIsQuery && handleGenerate(btn.type)}
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
            if (nodes.filter((n) => n.type === 'query').length === 0) return;
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
          disabled={nodes.filter((n) => n.type === 'query').length === 0}
          title={
            nodes.filter((n) => n.type === 'query').length > 0
              ? 'Generate summary from all queries'
              : 'No queries on canvas'
          }
          style={{
            fontSize: 9,
            padding: '3px 8px',
            borderRadius: 3,
            border: '1px solid #6366f1',
            background: 'transparent',
            color: nodes.filter((n) => n.type === 'query').length > 0 ? '#6366f1' : '#cbd5e1',
            cursor: nodes.filter((n) => n.type === 'query').length > 0 ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit',
            opacity: nodes.filter((n) => n.type === 'query').length > 0 ? 1 : 0.5,
          }}
        >
          ✦ summary
        </button>

        {selected && (
          <button
            onClick={deleteSelected}
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

      {/* Canvas area */}
      <div
        ref={canvasRef}
        style={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
          cursor:
            tool === 'pencil' ||
            tool === 'note' ||
            tool === 'connect' ||
            tool === 'goal' ||
            tool === 'milestone'
              ? 'crosshair'
              : isPanning
                ? 'grabbing'
                : 'grab',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setIsPanning(false);
          setDragging(null);
          if (currentStroke) {
            setStrokes((prev) => [
              ...prev,
              { points: currentStroke, color: pencilColor, width: 2 },
            ]);
            setCurrentStroke(null);
          }
        }}
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
        {nodes.length === 0 && (
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
            transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`,
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
            {connections.map((c, i) => {
              const from = getCenter(c.from),
                to = getCenter(c.to);
              const hl = hovered && (c.from === hovered || c.to === hovered);
              return (
                <line
                  key={`c-${i}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={c.color || '#94a3b8'}
                  strokeWidth={hl ? 2 : 1}
                  strokeOpacity={hovered ? (hl ? 0.7 : 0.08) : 0.25}
                  strokeDasharray={c.color === '#94a3b8' ? '4 4' : 'none'}
                  style={{ transition: 'all 0.15s' }}
                />
              );
            })}
            {/* Active connection drag line */}
            {connecting &&
              (() => {
                const from = getCenter(connecting.fromId);
                const rect = canvasRef.current?.getBoundingClientRect();
                if (!rect) return null;
                const tx = (connecting.mx - rect.left - pan.x) / zoom;
                const ty = (connecting.my - rect.top - pan.y) / zoom;
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
            {strokes.map((stroke, si) => (
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
            {currentStroke && currentStroke.length > 1 && (
              <polyline
                points={currentStroke.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={pencilColor}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.7}
              />
            )}
          </svg>

          {/* Nodes */}
          {nodes.map((node) => {
            const styles: Record<string, React.CSSProperties> = {
              query: {
                background: 'rgba(255,255,255,0.97)',
                border: selected === node.id ? '1.5px solid #6366f1' : '1px solid #e2e8f0',
                borderRadius: 6,
              },
              topic: {
                background: `${node.data.color}10`,
                border:
                  selected === node.id
                    ? `1.5px solid ${node.data.color}`
                    : `1px solid ${node.data.color}30`,
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
            return (
              <div
                key={node.id}
                data-node="true"
                onMouseDown={(e) => startDrag(node.id, e)}
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  position: 'absolute',
                  left: node.x,
                  top: node.y,
                  width: node.w,
                  height: node.h,
                  ...styles[node.type],
                  cursor: tool === 'connect' ? 'crosshair' : 'move',
                  opacity: nodeOpacity(node.id),
                  transition: dragging?.id === node.id ? 'none' : 'opacity 0.15s, box-shadow 0.15s',
                  boxShadow:
                    selected === node.id
                      ? '0 2px 12px rgba(0,0,0,0.06)'
                      : hovered === node.id && VIZ_COLORS[node.type as VizType]
                        ? `0 0 12px ${VIZ_COLORS[node.type as VizType]}26`
                        : 'none',
                  zIndex: selected === node.id ? 10 : 1,
                  overflow: 'hidden',
                }}
              >
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
                        <div
                          style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}
                        >
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
                                handleGenerate('diagram');
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
                                handleGenerate('chart');
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
                  <div
                    onDoubleClick={() => setEditingNote(node.id)}
                    style={{ height: '100%', padding: '8px 10px' }}
                  >
                    {editingNote === node.id ? (
                      <textarea
                        autoFocus
                        value={node.data.text}
                        onChange={(e) =>
                          setNodes((prev) =>
                            prev.map((n) =>
                              n.id === node.id
                                ? { ...n, data: { ...n.data, text: e.target.value } }
                                : n
                            )
                          )
                        }
                        onBlur={() => setEditingNote(null)}
                        style={{
                          width: '100%',
                          height: '100%',
                          border: 'none',
                          background: 'transparent',
                          fontSize: 9,
                          color: '#78716c',
                          fontFamily: 'inherit',
                          resize: 'none',
                          outline: 'none',
                          lineHeight: 1.5,
                        }}
                      />
                    ) : (
                      <div style={{ fontSize: 9, color: '#78716c', lineHeight: 1.5 }}>
                        {node.data.text}
                      </div>
                    )}
                  </div>
                )}

                {/* Goal node */}
                {node.type === 'goal' && (
                  <div
                    onDoubleClick={() => setEditingNote(node.id)}
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
                        onChange={(e) =>
                          setNodes((prev) =>
                            prev.map((n) =>
                              n.id === node.id
                                ? { ...n, data: { ...n.data, text: e.target.value } }
                                : n
                            )
                          )
                        }
                        onBlur={() => setEditingNote(null)}
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
                      <div style={{ fontSize: 9, color: '#166534', lineHeight: 1.5 }}>
                        {node.data.text}
                      </div>
                    )}
                  </div>
                )}

                {/* Milestone node */}
                {node.type === 'milestone' && (
                  <div
                    onDoubleClick={() => setEditingNote(node.id)}
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
                        onChange={(e) =>
                          setNodes((prev) =>
                            prev.map((n) =>
                              n.id === node.id
                                ? { ...n, data: { ...n.data, text: e.target.value } }
                                : n
                            )
                          )
                        }
                        onBlur={() => setEditingNote(null)}
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
                      <div style={{ fontSize: 9, color: '#5b21b6', lineHeight: 1.5 }}>
                        {node.data.text}
                      </div>
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
              </div>
            );
          })}
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
          {tool === 'pencil'
            ? 'draw on canvas · pick color above · ↩ to undo'
            : tool === 'connect'
              ? 'click node → drag to target'
              : tool === 'note'
                ? 'click to place note'
                : 'drag to move · scroll to zoom · select query → ◈ diagram or ▥ chart'}
        </span>
        <span style={{ fontSize: 7, color: '#cbd5e1', marginLeft: 'auto' }}>akhai canvas</span>
      </div>
    </div>
  );
}
