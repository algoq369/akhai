'use client';

interface CyclicalChartProps {
  chartData: Array<{ year: number; index: number; event?: string }>;
  mode: 'secular' | 'esoteric';
}

export default function CyclicalChart({ chartData, mode }: CyclicalChartProps) {
  if (!chartData || chartData.length === 0) return null;

  const W = 640;
  const H = 140;
  const PAD_L = 35;
  const PAD_R = 10;
  const PAD_T = 15;
  const PAD_B = 20;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const minY = Math.min(...chartData.map((d) => d.index));
  const maxY = Math.max(...chartData.map((d) => d.index));
  const minX = chartData[0].year;
  const maxX = chartData[chartData.length - 1].year;

  const scaleX = (year: number) => PAD_L + ((year - minX) / (maxX - minX)) * plotW;
  const scaleY = (val: number) => PAD_T + plotH - ((val - minY) / (maxY - minY)) * plotH;

  const pathD = chartData
    .map(
      (d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(d.year).toFixed(1)} ${scaleY(d.index).toFixed(1)}`
    )
    .join(' ');

  const events = chartData.filter((d) => d.event);
  const nowPoint = chartData.find((d) => d.year === 2026) ?? chartData[chartData.length - 1];
  const decades = [1920, 1940, 1960, 1980, 2000, 2020, 2040];
  const yTicks = [minY, Math.round((minY + maxY) / 2), maxY];

  const title =
    mode === 'secular'
      ? 'Planetary concentration index timeline'
      : 'Barbault cyclical index \u2014 celestial-terrestrial correlation';

  return (
    <div>
      <div className="text-[11px] uppercase tracking-widest text-zinc-500 mb-2">
        {mode === 'esoteric' ? '\u25C8' : '\u25CB'} {title}
      </div>
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-3">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
          {/* Y axis */}
          <line
            x1={PAD_L}
            y1={PAD_T}
            x2={PAD_L}
            y2={PAD_T + plotH}
            stroke="#3f3f46"
            strokeWidth={0.5}
          />
          {yTicks.map((v) => (
            <text
              key={v}
              x={PAD_L - 4}
              y={scaleY(v) + 3}
              textAnchor="end"
              fill="#71717a"
              fontSize={7}
            >
              {v}
            </text>
          ))}

          {/* X axis labels */}
          {decades.map((yr) => (
            <text key={yr} x={scaleX(yr)} y={H - 4} textAnchor="middle" fill="#71717a" fontSize={7}>
              {yr}
            </text>
          ))}

          {/* Data line */}
          <path d={pathD} fill="none" stroke="#7F77DD" strokeWidth={1.5} strokeLinejoin="round" />

          {/* Event markers */}
          {events.map((ev) => (
            <g key={ev.year}>
              <circle
                cx={scaleX(ev.year)}
                cy={scaleY(ev.index)}
                r={2.5}
                fill="#DC2626"
                opacity={0.8}
              />
              <text
                x={scaleX(ev.year)}
                y={scaleY(ev.index) - 5}
                textAnchor="middle"
                fill="#a1a1aa"
                fontSize={5.5}
              >
                {ev.year}
              </text>
            </g>
          ))}

          {/* NOW marker */}
          <circle
            cx={scaleX(nowPoint.year)}
            cy={scaleY(nowPoint.index)}
            r={4}
            fill="#1D9E75"
            opacity={0.9}
          />
          <text
            x={scaleX(nowPoint.year)}
            y={scaleY(nowPoint.index) - 7}
            textAnchor="middle"
            fill="#1D9E75"
            fontSize={7}
            fontWeight="bold"
          >
            NOW
          </text>
        </svg>
      </div>
    </div>
  );
}
