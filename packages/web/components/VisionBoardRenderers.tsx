'use client';

import React, { useState, useEffect } from 'react';
import { BoardNodeType, TOPIC_COLORS } from './VisionBoardTypes';

// ── Mini Renderers (from CanvasWorkspace) ──────────────────────────────────────

export function DiagramRenderer({ data }: { data: any }) {
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
        {(data.edges || []).map((e: any, i: number) => {
          const f = nodePos[e.from],
            t = nodePos[e.to];
          if (!f || !t) return null;
          const mx = (f.x + t.x) / 2,
            my = (f.y + t.y) / 2;
          const cpx = mx + (cy - my) * 0.3,
            cpy = my + (mx - cx) * 0.3;
          const tNode = allNodes.find((n: any) => n.id === e.to);
          return (
            <path
              key={i}
              d={`M ${f.x} ${f.y} Q ${cpx} ${cpy} ${t.x} ${t.y}`}
              fill="none"
              stroke={`${tNode?.color || '#cbd5e1'}66`}
              strokeWidth={1.5}
            />
          );
        })}
        {central && (
          <g>
            <rect
              x={cx - 70}
              y={cy - 24}
              width={140}
              height={48}
              rx={8}
              fill={`${central.color || '#6366f1'}15`}
              stroke={`${central.color || '#6366f1'}50`}
              strokeWidth={1.5}
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

export function ChartRenderer({ data }: { data: any }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);
  if (!data?.data)
    return <div style={{ padding: 10, fontSize: 9, color: '#94a3b8' }}>generating...</div>;
  const maxVal = Math.max(...data.data.map((d: any) => d.value || 0), 1);
  const chartH = 120,
    chartL = 28,
    chartR = 8,
    chartT = 6,
    chartB = 28;
  return (
    <div style={{ padding: '8px 10px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>
        {data.title || 'Chart'}
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${chartL + data.data.length * 36 + chartR} ${chartT + chartH + chartB}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <line
            x1={chartL}
            y1={chartT}
            x2={chartL}
            y2={chartT + chartH}
            stroke="#e2e8f0"
            strokeWidth={0.5}
          />
          <line
            x1={chartL}
            y1={chartT + chartH}
            x2={chartL + data.data.length * 36}
            y2={chartT + chartH}
            stroke="#e2e8f0"
            strokeWidth={0.5}
          />
          {data.data.map((d: any, i: number) => {
            const barColor = d.color || TOPIC_COLORS[i % TOPIC_COLORS.length];
            const pct = Math.max(0.02, (d.value || 0) / maxVal);
            const barH = mounted ? pct * chartH : 0;
            const barW = 22,
              barX = chartL + i * 36 + 7,
              barY = chartT + chartH - barH;
            return (
              <g key={i}>
                <rect
                  x={barX}
                  y={barY}
                  width={barW}
                  height={barH}
                  rx={4}
                  fill={barColor}
                  opacity={0.85}
                  style={{ transition: 'height 0.6s ease-out, y 0.6s ease-out' }}
                />
                <text
                  x={barX + barW / 2}
                  y={barY - 4}
                  textAnchor="middle"
                  fontSize={7}
                  fontWeight={600}
                  fill="#64748b"
                  fontFamily="'JetBrains Mono',monospace"
                >
                  {d.value}
                </text>
                <text
                  x={barX + barW / 2}
                  y={chartT + chartH + 8}
                  textAnchor="end"
                  fontSize={6}
                  fill="#94a3b8"
                  fontFamily="'JetBrains Mono',monospace"
                  transform={`rotate(-30 ${barX + barW / 2} ${chartT + chartH + 8})`}
                >
                  {d.label?.slice(0, 20)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export function TableRenderer({ data }: { data: any }) {
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
      <div style={{ fontSize: 10, fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>
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

export function TimelineVizRenderer({ data }: { data: any }) {
  if (!data?.events)
    return <div style={{ padding: 10, fontSize: 9, color: '#94a3b8' }}>generating...</div>;
  const events = data.events.slice(0, 8);
  const spacing = Math.min(80, 360 / Math.max(events.length, 1));
  const vbW = Math.min(500, events.length * spacing + 40);
  return (
    <div style={{ padding: '8px 10px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>
        {data.title || 'Timeline'}
      </div>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${vbW} 80`}
        preserveAspectRatio="xMidYMid meet"
        style={{ flex: 1 }}
      >
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
                {ev.label?.slice(0, 30)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function RadarRenderer({ data }: { data: any }) {
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
  const c = data.color || '#6366f1';
  return (
    <div style={{ padding: '8px 10px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>
        {data.title || 'Radar'}
      </div>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 300 250"
        preserveAspectRatio="xMidYMid meet"
        style={{ flex: 1 }}
      >
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
        {axes.map((a: any, i: number) => {
          const angle = i * angleStep - Math.PI / 2;
          const lx = cx + Math.cos(angle) * (maxR + 16),
            ly = cy + Math.sin(angle) * (maxR + 16);
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
        <polygon points={polygon} fill={`${c}20`} stroke={c} strokeWidth={2} />
        {dataPoints.map((p: any, i: number) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill={c} stroke="white" strokeWidth={1} />
        ))}
      </svg>
    </div>
  );
}

export const VIZ_RENDERERS: Partial<Record<BoardNodeType, React.FC<{ data: any }>>> = {
  diagram: DiagramRenderer,
  chart: ChartRenderer,
  table: TableRenderer,
  timelineViz: TimelineVizRenderer,
  radar: RadarRenderer,
};
