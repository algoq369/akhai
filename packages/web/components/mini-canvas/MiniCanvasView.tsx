'use client';

import { useState } from 'react';
import type { MiniCanvasData } from '@/lib/mini-canvas/content-classifier';
import FactsPanel from './FactsPanel';
import MetricsPanel from './MetricsPanel';
import CorrelationPanel from './CorrelationPanel';

interface MiniCanvasViewProps {
  data?: MiniCanvasData | null;
}

function PanelHeader({
  icon,
  title,
  count,
  collapsed,
  onToggle,
}: {
  icon: string;
  title: string;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
}) {
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
      <button
        onClick={onToggle}
        className="w-5 h-5 flex items-center justify-center text-relic-silver hover:text-relic-slate text-[10px]"
      >
        {collapsed ? '▼' : '▲'}
      </button>
    </div>
  );
}

export default function MiniCanvasView({ data }: MiniCanvasViewProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setCollapsed((p) => ({ ...p, [id]: !p[id] }));

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-3xl text-relic-silver/20 mb-4">◈</div>
          <p className="text-[11px] text-relic-silver/40">Submit a query to see visual analysis</p>
          <p className="text-[9px] text-relic-silver/25 mt-1">
            Facts, Metrics, and Correlations will appear here
          </p>
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
          <PanelHeader
            icon="◇"
            title="Facts"
            count={5}
            collapsed={!!collapsed['facts']}
            onToggle={() => toggle('facts')}
          />
          {!collapsed['facts'] && <FactsPanel facts={data.facts} charts={data.charts} />}
        </div>

        {/* RIGHT: Metrics + Correlation stacked */}
        <div className="flex flex-col gap-2">
          <div className="border-t-2 border-t-emerald-400 bg-white dark:bg-relic-void/60 rounded-lg shadow-sm border border-relic-mist/40 dark:border-relic-slate/20 overflow-hidden">
            <PanelHeader
              icon="◈"
              title="Metrics"
              count={data.metrics.length}
              collapsed={!!collapsed['metrics']}
              onToggle={() => toggle('metrics')}
            />
            {!collapsed['metrics'] && (
              <div className="max-h-[200px] overflow-auto">
                <MetricsPanel metrics={data.metrics} charts={data.charts} />
              </div>
            )}
          </div>

          <div className="border-t-2 border-t-purple-400 bg-white dark:bg-relic-void/60 rounded-lg shadow-sm border border-relic-mist/40 dark:border-relic-slate/20 overflow-hidden">
            <PanelHeader
              icon="◆"
              title="Correlation"
              count={data.correlations.length}
              collapsed={!!collapsed['correlation']}
              onToggle={() => toggle('correlation')}
            />
            {!collapsed['correlation'] && (
              <div className="max-h-[150px] overflow-auto">
                <CorrelationPanel
                  correlations={data.correlations}
                  facts={data.facts}
                  metrics={data.metrics}
                  charts={data.charts}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
