'use client';

import type {
  CorrelationRow,
  FactItem,
  MetricRow,
  ChartConfig,
} from '@/lib/mini-canvas/content-classifier';
import { extractTitle } from '@/lib/mini-canvas/content-classifier';

interface CorrelationPanelProps {
  correlations: CorrelationRow[];
  facts: FactItem[];
  metrics: MetricRow[];
  charts: ChartConfig[];
}

const STRENGTH_COLORS: Record<CorrelationRow['strength'], string> = {
  strong: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  moderate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  weak: 'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400',
  inverse: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const STRENGTH_LINE_COLORS: Record<CorrelationRow['strength'], string> = {
  strong: '#22c55e',
  moderate: '#eab308',
  weak: '#9ca3af',
  inverse: '#ef4444',
};

function NetworkDiagram({
  correlations,
  facts,
  metrics,
}: {
  correlations: CorrelationRow[];
  facts: FactItem[];
  metrics: MetricRow[];
}) {
  const width = 300;
  const height = 200;
  const cx = width / 2;
  const cy = height / 2;

  // Position facts on left, metrics on right
  const factPositions = facts.slice(0, 5).map((f, i) => ({
    id: f.id,
    label: f.statement.slice(0, 20),
    x: 60,
    y: 30 + i * 35,
    type: 'fact' as const,
  }));

  const metricPositions = metrics.slice(0, 5).map((m, i) => ({
    id: m.id,
    label: m.metric.slice(0, 20),
    x: width - 60,
    y: 30 + i * 35,
    type: 'metric' as const,
  }));

  return (
    <svg width={width} height={height} className="mx-auto">
      {/* Connection lines */}
      {correlations.map((corr, i) => {
        const factNode = factPositions.find((f) => f.id === corr.factRef);
        const metricNode = metricPositions.find((m) => m.id === corr.metricRef);
        if (!factNode || !metricNode) return null;
        return (
          <line
            key={`line-${i}`}
            x1={factNode.x + 15}
            y1={factNode.y}
            x2={metricNode.x - 15}
            y2={metricNode.y}
            stroke={STRENGTH_LINE_COLORS[corr.strength]}
            strokeWidth={corr.strength === 'strong' ? 2 : 1}
            opacity={0.6}
            strokeDasharray={corr.strength === 'weak' ? '4,4' : undefined}
          />
        );
      })}

      {/* Fact nodes (blue circles) */}
      {factPositions.map((node) => (
        <g key={node.id}>
          <circle cx={node.x} cy={node.y} r={12} fill="#3b82f6" opacity={0.7} />
          <text
            x={node.x}
            y={node.y + 1}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize={7}
            fontFamily="monospace"
          >
            F
          </text>
          <text
            x={node.x + 18}
            y={node.y + 1}
            dominantBaseline="middle"
            fill="#94a3b8"
            fontSize={7}
            fontFamily="monospace"
          >
            {node.label}
          </text>
        </g>
      ))}

      {/* Metric nodes (emerald squares) */}
      {metricPositions.map((node) => (
        <g key={node.id}>
          <rect
            x={node.x - 10}
            y={node.y - 10}
            width={20}
            height={20}
            rx={3}
            fill="#10b981"
            opacity={0.7}
          />
          <text
            x={node.x}
            y={node.y + 1}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize={7}
            fontFamily="monospace"
          >
            M
          </text>
          <text
            x={node.x - 18}
            y={node.y + 1}
            textAnchor="end"
            dominantBaseline="middle"
            fill="#94a3b8"
            fontSize={7}
            fontFamily="monospace"
          >
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function CorrelationPanel({
  correlations,
  facts,
  metrics,
  charts,
}: CorrelationPanelProps) {
  if (correlations.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-[10px] text-relic-silver/50 italic">No correlations detected</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-2">
      {/* SVG Network Diagram */}
      {correlations.length >= 2 && (
        <div className="bg-relic-ghost/30 dark:bg-relic-slate/10 rounded-lg p-2">
          <div className="text-[8px] uppercase tracking-wider text-relic-silver/50 mb-1 px-1">
            Fact → Metric Network
          </div>
          <NetworkDiagram correlations={correlations} facts={facts} metrics={metrics} />
        </div>
      )}

      {/* Synthesis Table */}
      <div className="overflow-x-auto rounded-lg border border-relic-mist/30 dark:border-relic-slate/20">
        <table className="w-full text-[9px] font-mono">
          <thead>
            <tr className="bg-relic-ghost/50 dark:bg-relic-slate/20">
              <th className="px-2 py-1.5 text-left text-[8px] uppercase tracking-wider text-relic-silver font-semibold">
                Fact
              </th>
              <th className="px-2 py-1.5 text-left text-[8px] uppercase tracking-wider text-relic-silver font-semibold">
                Metric
              </th>
              <th className="px-2 py-1.5 text-left text-[8px] uppercase tracking-wider text-relic-silver font-semibold">
                Relationship
              </th>
              <th className="px-2 py-1.5 text-left text-[8px] uppercase tracking-wider text-relic-silver font-semibold">
                Strength
              </th>
              <th className="px-2 py-1.5 text-left text-[8px] uppercase tracking-wider text-relic-silver font-semibold">
                Implication
              </th>
            </tr>
          </thead>
          <tbody>
            {correlations.map((row, i) => (
              <tr
                key={row.id}
                className={
                  i % 2 === 0
                    ? 'bg-white dark:bg-relic-void/20'
                    : 'bg-relic-ghost/20 dark:bg-relic-slate/5'
                }
              >
                <td className="px-2 py-1 text-blue-600 dark:text-blue-400 max-w-[140px] truncate">
                  {(() => {
                    const f = facts.find((x) => x.id === row.factRef);
                    return f ? extractTitle(f.statement) : row.factRef;
                  })()}
                </td>
                <td className="px-2 py-1 text-emerald-600 dark:text-emerald-400 max-w-[140px] truncate">
                  {(() => {
                    const m = metrics.find((x) => x.id === row.metricRef);
                    return m ? `${m.metric.slice(0, 25)}: ${m.value}` : '—';
                  })()}
                </td>
                <td className="px-2 py-1 text-relic-slate dark:text-relic-ghost max-w-[150px] truncate">
                  {row.relationship}
                </td>
                <td className="px-2 py-1">
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-semibold ${STRENGTH_COLORS[row.strength]}`}
                  >
                    {row.strength}
                  </span>
                </td>
                <td className="px-2 py-1 text-relic-silver max-w-[120px] truncate">
                  {row.implication}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-[8px] text-relic-silver/40 text-center">
        {correlations.length} correlations mapped
      </div>
    </div>
  );
}
