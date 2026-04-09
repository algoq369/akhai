'use client';

import type { FactItem, ChartConfig } from '@/lib/mini-canvas/content-classifier';
import { stripMarkdown, extractTitle } from '@/lib/mini-canvas/content-classifier';

interface FactsPanelProps {
  facts: FactItem[];
  charts: ChartConfig[];
}

const FACT_COLORS = [
  'border-l-blue-400',
  'border-l-blue-500',
  'border-l-indigo-400',
  'border-l-sky-400',
  'border-l-blue-300',
  'border-l-indigo-500',
];

export default function FactsPanel({ facts, charts }: FactsPanelProps) {
  const factCharts = charts.filter((c) => c.panel === 'facts');

  if (facts.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-[10px] text-relic-silver/50 italic">No verifiable facts extracted</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-2">
      {/* Chart above cards when available */}
      {factCharts.length > 0 && (
        <div className="bg-relic-ghost/30 dark:bg-relic-slate/10 rounded-lg p-3">
          <div className="text-[8px] uppercase tracking-wider text-relic-silver/50 mb-2">
            Distribution
          </div>
          <div className="flex items-end gap-1 h-[100px]">
            {factCharts[0].data.map((d, i) => {
              const max = Math.max(...factCharts[0].data.map((x) => x.value));
              const h = max > 0 ? (d.value / max) * 80 : 10;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-blue-400/60 dark:bg-blue-500/40 rounded-t"
                    style={{ height: `${h}px` }}
                  />
                  <span className="text-[7px] text-relic-silver/50 truncate max-w-[60px]">
                    {d.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fact cards — 2-column grid */}
      <div className="grid grid-cols-2 gap-2">
        {facts.map((fact, i) => {
          const title = extractTitle(fact.statement);
          const body = stripMarkdown(fact.statement);
          return (
            <div
              key={fact.id}
              className={`border-l-2 ${FACT_COLORS[i % FACT_COLORS.length]} bg-white dark:bg-relic-void/40 rounded-r-lg p-2.5 shadow-sm`}
            >
              <div className="flex items-start gap-1.5 mb-1">
                <span className="text-green-500 text-[10px] flex-shrink-0">✓</span>
                <span className="text-[10px] font-semibold text-relic-slate dark:text-relic-ghost leading-tight">
                  {title}
                </span>
              </div>
              <p className="text-[9px] text-relic-silver dark:text-relic-silver/70 leading-relaxed line-clamp-2 mb-1">
                {body.length > 140 ? body.slice(0, 137) + '...' : body}
              </p>
              {fact.dataPoint && (
                <span className="inline-block text-[8px] px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded font-mono">
                  {fact.dataPoint}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-[8px] text-relic-silver/40 text-center">
        {facts.length} verifiable facts extracted
      </div>
    </div>
  );
}
