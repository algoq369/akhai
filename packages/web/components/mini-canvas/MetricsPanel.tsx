'use client';

import type { MetricRow, ChartConfig } from '@/lib/mini-canvas/content-classifier';

interface MetricsPanelProps {
  metrics: MetricRow[];
  charts: ChartConfig[];
}

function SimpleBarChart({ data }: { data: ChartConfig['data'] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-[40px] px-2">
      {data.map((d, i) => {
        const h = (d.value / max) * 30;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5 min-w-0">
            <div
              className="w-full bg-emerald-400/60 dark:bg-emerald-500/40 rounded-t transition-all"
              style={{ height: `${Math.max(h, 2)}px` }}
            />
            <span className="text-[6px] text-relic-silver/50 truncate w-full text-center">
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
      <svg width={100} height={100} viewBox="0 0 120 120">
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
      <div className="space-y-0.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-1">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-[7px] text-relic-silver/70 truncate max-w-[80px]">{d.name}</span>
            <span className="text-[7px] font-mono text-relic-slate dark:text-relic-ghost">
              {d.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function isNegativeValue(value: string): boolean {
  return /^-|decrease|loss|decline|drop|fell|down/i.test(value);
}

export default function MetricsPanel({ metrics, charts }: MetricsPanelProps) {
  const metricCharts = charts.filter((c) => c.panel === 'metrics');

  if (metrics.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-[10px] text-zinc-500 italic">No quantifiable data extracted</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-2">
      {metricCharts.map((chart, ci) => (
        <div key={ci} className="bg-relic-ghost/30 dark:bg-relic-slate/10 rounded-lg p-2">
          <div className="text-[7px] uppercase tracking-wider text-relic-silver/50 mb-1">
            {chart.title}
          </div>
          {chart.type === 'bar' || chart.type === 'line' ? (
            <SimpleBarChart data={chart.data} />
          ) : (
            <SimplePieChart data={chart.data} />
          )}
        </div>
      ))}

      <div className="overflow-x-auto rounded-lg border border-relic-mist/30 dark:border-relic-slate/20">
        <table className="w-full text-[9px] font-mono">
          <thead>
            <tr className="sticky top-0 bg-zinc-50/90 dark:bg-zinc-900/90 backdrop-blur">
              <th className="px-1.5 py-0.5 text-left text-[8px] uppercase tracking-wider text-relic-silver font-semibold">
                Metric
              </th>
              <th className="px-1.5 py-0.5 text-right text-[8px] uppercase tracking-wider text-relic-silver font-semibold">
                Value
              </th>
              <th className="px-1.5 py-0.5 text-left text-[8px] uppercase tracking-wider text-relic-silver font-semibold">
                Context
              </th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30 transition-colors"
              >
                <td className="px-1.5 py-0.5 text-zinc-800 dark:text-relic-ghost max-w-[140px] truncate">
                  {row.metric}
                </td>
                <td
                  className={`px-1.5 py-0.5 text-right font-semibold whitespace-nowrap ${isNegativeValue(row.value) ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}
                >
                  {row.value}
                </td>
                <td className="px-1.5 py-0.5 text-zinc-500 whitespace-nowrap text-[8px]">
                  {row.commentary !== 'N/A' ? row.commentary : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-[8px] text-relic-silver/40 text-center">
        {metrics.length} metrics extracted
      </div>
    </div>
  );
}
