'use client';

import type { MiniCanvasData } from '@/lib/mini-canvas/content-classifier';
import FactsPanel from './FactsPanel';
import MetricsPanel from './MetricsPanel';
import CorrelationPanel from './CorrelationPanel';

interface MiniCanvasViewProps {
  data?: MiniCanvasData | null;
  isLoading?: boolean;
}

function PanelHeader({ icon, title, count }: { icon: string; title: string; count: number }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-relic-ghost/30 dark:bg-relic-slate/10">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-relic-silver">{icon}</span>
        <span className="text-[9px] font-medium uppercase tracking-wider text-relic-slate dark:text-relic-ghost">
          {title}
        </span>
        <span className="text-[8px] px-1.5 py-0.5 bg-relic-ghost/50 dark:bg-relic-slate/20 rounded text-relic-silver">
          {count}
        </span>
      </div>
    </div>
  );
}

export default function MiniCanvasView({ data, isLoading }: MiniCanvasViewProps) {
  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className={`text-3xl text-relic-silver/20 mb-4 ${isLoading ? 'animate-pulse' : ''}`}>
            ◈
          </div>
          <p className="text-[11px] text-relic-silver/40">
            {isLoading ? 'Analyzing response...' : 'Submit a query to see visual analysis'}
          </p>
          {!isLoading && (
            <p className="text-[9px] text-relic-silver/25 mt-1">
              Facts, Metrics, and Correlations will appear here
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-auto px-6 py-4"
      style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, #e5e7eb 0.3px, transparent 0)',
        backgroundSize: '20px 20px',
      }}
    >
      {/* 2-column dashboard: Facts left, Metrics+Correlation right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* LEFT: Facts */}
        <div className="border-t-2 border-t-blue-400 bg-white dark:bg-relic-void/60 rounded-lg shadow-sm border border-relic-mist/40 dark:border-relic-slate/20 overflow-hidden">
          <PanelHeader icon="◇" title="Facts" count={5} />
          <FactsPanel facts={data.facts} charts={data.charts} />
        </div>

        {/* RIGHT: Metrics + Correlation stacked */}
        <div className="flex flex-col gap-2">
          <div className="border-t-2 border-t-emerald-400 bg-white dark:bg-relic-void/60 rounded-lg shadow-sm border border-relic-mist/40 dark:border-relic-slate/20 overflow-hidden">
            <PanelHeader icon="◈" title="Metrics" count={data.metrics.length} />
            <div className="max-h-[350px] overflow-auto">
              <MetricsPanel metrics={data.metrics} charts={data.charts} />
            </div>
          </div>

          <div className="border-t-2 border-t-purple-400 bg-white dark:bg-relic-void/60 rounded-lg shadow-sm border border-relic-mist/40 dark:border-relic-slate/20 overflow-hidden">
            <PanelHeader icon="◆" title="Correlation" count={data.correlations.length} />
            <div className="max-h-[300px] overflow-auto">
              <CorrelationPanel
                correlations={data.correlations}
                facts={data.facts}
                metrics={data.metrics}
                charts={data.charts}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
