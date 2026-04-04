'use client';

/**
 * Canvas visualization renderers — extracted from CanvasWorkspace.tsx
 * DiagramRenderer and ChartRenderer extracted to CanvasChartDiagramRenderers.tsx
 */

import { DiagramRenderer, ChartRenderer } from './CanvasChartDiagramRenderers';

const TOPIC_COLORS = [
  '#94a3b8',
  '#64748b',
  '#475569',
  '#334155',
  '#1e293b',
  '#a1a1aa',
  '#71717a',
  '#52525b',
  '#3f3f46',
  '#27272a',
];

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

export { DiagramRenderer, ChartRenderer, TableRenderer, TimelineRenderer, RadarRenderer };
