'use client';

import type {
  CorrelationRow,
  FactBoxes,
  MetricRow,
  ChartConfig,
} from '@/lib/mini-canvas/content-classifier';

interface CorrelationPanelProps {
  correlations: CorrelationRow[];
  facts: FactBoxes;
  metrics: MetricRow[];
  charts: ChartConfig[];
}

const STRENGTH_BADGE: Record<CorrelationRow['strength'], string> = {
  strong: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  moderate: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  weak: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/30 dark:text-zinc-400',
  inverse: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const ARROW_COLOR: Record<CorrelationRow['strength'], string> = {
  strong: 'text-emerald-500',
  moderate: 'text-amber-500',
  weak: 'text-zinc-400',
  inverse: 'text-red-500',
};

export default function CorrelationPanel({ correlations }: CorrelationPanelProps) {
  if (correlations.length === 0) {
    return (
      <div className="p-3 text-center">
        <p className="text-[10px] text-relic-silver/50 italic">No correlations detected</p>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-1 font-mono">
      {correlations.map((row) => (
        <div
          key={row.id}
          className="flex items-center gap-2 px-2 py-1 rounded hover:bg-zinc-100/50 dark:hover:bg-zinc-800/20 transition-colors"
        >
          <span className={`text-[9px] font-semibold shrink-0 ${ARROW_COLOR[row.strength]}`}>
            {row.factRef.replace(/([A-Z])/g, ' $1').trim()} {row.strength === 'inverse' ? '↔' : '→'}
          </span>
          <span className="text-[9px] text-relic-slate dark:text-relic-ghost italic truncate flex-1">
            {row.relationship}
          </span>
          <span
            className={`text-[8px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${STRENGTH_BADGE[row.strength]}`}
          >
            {row.strength}
          </span>
        </div>
      ))}
    </div>
  );
}
