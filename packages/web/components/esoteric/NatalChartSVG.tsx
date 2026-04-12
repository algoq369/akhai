'use client';

import type { NatalChart } from '@/lib/esoteric/natal-engine';
import { SIGN_ABBR } from '@/lib/esoteric/natal-engine';

const SIZE = 400;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R_OUTER = 180;
const R_SIGN = 160;
const R_SIGN_LABEL = 170;
const R_HOUSE = 140;
const R_PLANET = 115;
const R_INNER = 90;

const SIGNS_ORDER = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
];

function polar(cx: number, cy: number, r: number, deg: number): { x: number; y: number } {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arc(cx: number, cy: number, r: number, start: number, end: number): string {
  const s = polar(cx, cy, r, start);
  const e = polar(cx, cy, r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

interface Props {
  chart: NatalChart;
}

export default function NatalChartSVG({ chart }: Props) {
  // ASC = house 1 cusp, placed at left (180°) by convention
  const ascDeg = chart.houses[0];
  const offset = 180 - ascDeg; // rotation so ASC is at left

  function toChart(lng: number): number {
    return (((lng + offset) % 360) + 360) % 360;
  }

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[400px] mx-auto">
      {/* Outer circle */}
      <circle cx={CX} cy={CY} r={R_OUTER} fill="none" stroke="#d4d4d8" strokeWidth={1} />
      <circle cx={CX} cy={CY} r={R_SIGN} fill="none" stroke="#e4e4e7" strokeWidth={0.5} />
      <circle cx={CX} cy={CY} r={R_HOUSE} fill="none" stroke="#e4e4e7" strokeWidth={0.5} />
      <circle cx={CX} cy={CY} r={R_INNER} fill="none" stroke="#d4d4d8" strokeWidth={1} />

      {/* Zodiac sign divisions + labels */}
      {SIGNS_ORDER.map((sign, i) => {
        const startLng = i * 30;
        const midLng = startLng + 15;
        const chartStart = toChart(startLng);
        const chartMid = toChart(midLng);
        const p1 = polar(CX, CY, R_SIGN, chartStart);
        const p2 = polar(CX, CY, R_OUTER, chartStart);
        const label = polar(CX, CY, R_SIGN_LABEL, chartMid);
        return (
          <g key={sign}>
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#e4e4e7" strokeWidth={0.5} />
            <text
              x={label.x}
              y={label.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={7}
              fill="#a1a1aa"
              fontFamily="monospace"
            >
              {SIGN_ABBR[sign]}
            </text>
          </g>
        );
      })}

      {/* House cusps */}
      {chart.houses.map((cusp, i) => {
        const deg = toChart(cusp);
        const p1 = polar(CX, CY, R_INNER, deg);
        const p2 = polar(CX, CY, R_HOUSE, deg);
        const lbl = polar(CX, CY, R_HOUSE + 8, deg + 3);
        return (
          <g key={`h${i}`}>
            <line
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="#d4d4d8"
              strokeWidth={i === 0 || i === 3 || i === 6 || i === 9 ? 1.5 : 0.5}
            />
            <text
              x={lbl.x}
              y={lbl.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={6}
              fill="#a1a1aa"
              fontFamily="monospace"
            >
              {i + 1}
            </text>
          </g>
        );
      })}

      {/* Aspect lines to North Node */}
      {chart.aspects.map((asp) => {
        const planet = chart.planets.find((p) => p.name === asp.planet);
        if (!planet) return null;
        const nnDeg = toChart(chart.northNode.longitude);
        const pDeg = toChart(planet.longitude);
        const nn = polar(CX, CY, R_PLANET, nnDeg);
        const pp = polar(CX, CY, R_PLANET, pDeg);
        const isHard = asp.type === 'square' || asp.type === 'opposition';
        return (
          <line
            key={`asp-${asp.planet}`}
            x1={nn.x}
            y1={nn.y}
            x2={pp.x}
            y2={pp.y}
            stroke={isHard ? '#ef4444' : '#22c55e'}
            strokeWidth={0.8}
            strokeDasharray={asp.type === 'conjunction' ? undefined : '3 2'}
            opacity={0.5}
          />
        );
      })}

      {/* Planets */}
      {chart.planets.map((p) => {
        const deg = toChart(p.longitude);
        const pos = polar(CX, CY, R_PLANET, deg);
        return (
          <text
            key={p.name}
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={11}
            fill="#71717a"
            fontFamily="serif"
          >
            {p.symbol}
          </text>
        );
      })}

      {/* North Node — highlighted */}
      {(() => {
        const deg = toChart(chart.northNode.longitude);
        const pos = polar(CX, CY, R_PLANET, deg);
        return (
          <g>
            <circle cx={pos.x} cy={pos.y} r={8} fill="#7c3aed" opacity={0.15} />
            <text
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={14}
              fill="#7c3aed"
              fontFamily="serif"
            >
              {'\u260A'}
            </text>
          </g>
        );
      })()}

      {/* South Node — muted */}
      {(() => {
        const deg = toChart(chart.southNode.longitude);
        const pos = polar(CX, CY, R_PLANET, deg);
        return (
          <text
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={12}
            fill="#a1a1aa"
            fontFamily="serif"
          >
            {'\u260B'}
          </text>
        );
      })()}

      {/* Center label */}
      <text
        x={CX}
        y={CY - 6}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={9}
        fill="#7c3aed"
        fontFamily="monospace"
        fontWeight="bold"
      >
        {'\u260A'} NN
      </text>
      <text
        x={CX}
        y={CY + 6}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={8}
        fill="#71717a"
        fontFamily="monospace"
      >
        {chart.northNode.formattedDegree}
      </text>
    </svg>
  );
}
