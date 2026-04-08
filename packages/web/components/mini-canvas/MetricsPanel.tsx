'use client';

import type { MetricRow, ChartConfig } from '@/lib/mini-canvas/content-classifier';

interface MetricsPanelProps {
  metrics: MetricRow[];
  charts: ChartConfig[];
}

const COLUMNS = [
  'Metric',
  'Value/%',
  'Date',
  'Source',
  'Link',
  'Commentary',
  'Expert',
  'Scientific',
  'Theologic',
] as const;

function SimpleBarChart({ data }: { data: ChartConfig['data'] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1.5 h-[140px] px-2">
      {data.map((d, i) => {
        const h = (d.value / max) * 120;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <span className="text-[7px] text-relic-silver/60 font-mono">
              {d.value.toLocaleString()}
            </span>
            <div
              className="w-full bg-emerald-400/60 dark:bg-emerald-500/40 rounded-t transition-all"
              style={{ height: `${Math.max(h, 4)}px` }}
            />
            <span className="text-[7px] text-relic-silver/50 truncate w-full text-center">
              {d.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SimplePieChart({ data }: { data: ChartConfig['data'] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const COLORS = ['#34d399', '#60a5fa', '#f472b6', '#fbbf24', '#a78bfa', '#fb923c'];

  return (
    <div className="flex items-center gap-4 px-2">
      <svg width={120} height={120} viewBox="0 0 120 120">
        {
          data.reduce(
            (acc, d, i) => {
              const angle = (d.value / total) * 360;
              const startAngle = acc.offset;
              const endAngle = startAngle + angle;
              const largeArc = angle > 180 ? 1 : 0;
              const rad = (a: number) => (a * Math.PI) / 180;
              const x1 = 60 + 50 * Math.cos(rad(startAngle - 90));
              const y1 = 60 + 50 * Math.sin(rad(startAngle - 90));
              const x2 = 60 + 50 * Math.cos(rad(endAngle - 90));
              const y2 = 60 + 50 * Math.sin(rad(endAngle - 90));
              acc.paths.push(
                <path
                  key={i}
                  d={`M60,60 L${x1},${y1} A50,50 0 ${largeArc},1 ${x2},${y2} Z`}
                  fill={COLORS[i % COLORS.length]}
                  opacity={0.7}
                />
              );
              acc.offset = endAngle;
              return acc;
            },
            { paths: [] as React.ReactElement[], offset: 0 }
          ).paths
        }
      </svg>
      <div className="space-y-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-[8px] text-relic-silver/70 truncate max-w-[100px]">{d.name}</span>
            <span className="text-[8px] font-mono text-relic-slate dark:text-relic-ghost">
              {d.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MetricsPanel({ metrics, charts }: MetricsPanelProps) {
  const metricCharts = charts.filter((c) => c.panel === 'metrics');

  if (metrics.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-[10px] text-relic-silver/50 italic">No metrics extracted</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-2">
      {/* Chart first when available */}
      {metricCharts.map((chart, ci) => (
        <div key={ci} className="bg-relic-ghost/30 dark:bg-relic-slate/10 rounded-lg p-3">
          <div className="text-[8px] uppercase tracking-wider text-relic-silver/50 mb-2">
            {chart.title}
          </div>
          {chart.type === 'bar' || chart.type === 'line' ? (
            <SimpleBarChart data={chart.data} />
          ) : (
            <SimplePieChart data={chart.data} />
          )}
        </div>
      ))}

      {/* 8-Column Table */}
      <div className="overflow-x-auto rounded-lg border border-relic-mist/30 dark:border-relic-slate/20">
        <table className="w-full text-[9px] font-mono">
          <thead>
            <tr className="bg-relic-ghost/50 dark:bg-relic-slate/20 sticky top-0">
              {COLUMNS.map((col) => (
                <th
                  key={col}
                  className="px-2 py-1.5 text-left text-[8px] uppercase tracking-wider text-relic-silver font-semibold whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((row, i) => (
              <tr
                key={row.id}
                className={
                  i % 2 === 0
                    ? 'bg-white dark:bg-relic-void/20'
                    : 'bg-relic-ghost/20 dark:bg-relic-slate/5'
                }
              >
                <td className="px-2 py-1 text-relic-slate dark:text-relic-ghost max-w-[120px] truncate">
                  {row.metric}
                </td>
                <td className="px-2 py-1 font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                  {row.value}
                </td>
                <td className="px-2 py-1 text-relic-silver whitespace-nowrap">{row.date}</td>
                <td className="px-2 py-1 text-relic-silver">
                  {row.source === 'N/A' ? (
                    <span className="italic text-relic-silver/40">N/A</span>
                  ) : (
                    row.source
                  )}
                </td>
                <td className="px-2 py-1">
                  {row.link !== 'N/A' ? (
                    <a
                      href={row.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      link
                    </a>
                  ) : (
                    <span className="italic text-relic-silver/40">N/A</span>
                  )}
                </td>
                <td className="px-2 py-1 text-relic-silver max-w-[100px] truncate">
                  {row.commentary === 'N/A' ? (
                    <span className="italic text-relic-silver/40">N/A</span>
                  ) : (
                    row.commentary
                  )}
                </td>
                <td className="px-2 py-1 text-relic-silver max-w-[80px] truncate">
                  {row.expertConsensus === 'N/A' ? (
                    <span className="italic text-relic-silver/40">N/A</span>
                  ) : (
                    row.expertConsensus
                  )}
                </td>
                <td className="px-2 py-1 text-relic-silver max-w-[80px] truncate">
                  {row.scientificPOV === 'N/A' ? (
                    <span className="italic text-relic-silver/40">N/A</span>
                  ) : (
                    row.scientificPOV
                  )}
                </td>
                <td className="px-2 py-1 text-relic-silver max-w-[80px] truncate">
                  {row.theologicPOV === 'N/A' ? (
                    <span className="italic text-relic-silver/40">N/A</span>
                  ) : (
                    row.theologicPOV
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-[8px] text-relic-silver/40 text-center">
        {metrics.length} metrics across {COLUMNS.length} dimensions
      </div>
    </div>
  );
}
