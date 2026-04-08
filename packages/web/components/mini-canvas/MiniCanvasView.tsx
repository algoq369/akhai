'use client';

import { useState } from 'react';
import type { MiniCanvasData } from '@/lib/mini-canvas/content-classifier';
import FactsPanel from './FactsPanel';
import MetricsPanel from './MetricsPanel';
import CorrelationPanel from './CorrelationPanel';

interface MiniCanvasViewProps {
  data?: MiniCanvasData | null;
}

interface PanelConfig {
  id: 'facts' | 'metrics' | 'correlation';
  title: string;
  icon: string;
  borderColor: string;
  count: number;
}

export default function MiniCanvasView({ data }: MiniCanvasViewProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  if (!data) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div
          className="rounded-xl border border-dashed border-relic-mist/50 dark:border-relic-slate/30 p-12 text-center"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #e5e7eb 0.5px, transparent 0)',
            backgroundSize: '16px 16px',
          }}
        >
          <div className="text-2xl text-relic-silver/30 mb-3">◈</div>
          <p className="text-[11px] text-relic-silver/50">Submit a query to see visual analysis</p>
          <p className="text-[9px] text-relic-silver/30 mt-1">
            Facts, Metrics, and Correlations will appear here
          </p>
        </div>
      </div>
    );
  }

  const panels: PanelConfig[] = [
    {
      id: 'facts',
      title: 'Facts',
      icon: '◇',
      borderColor: 'border-t-blue-400',
      count: data.facts.length,
    },
    {
      id: 'metrics',
      title: 'Metrics',
      icon: '◈',
      borderColor: 'border-t-emerald-400',
      count: data.metrics.length,
    },
    {
      id: 'correlation',
      title: 'Correlation',
      icon: '◆',
      borderColor: 'border-t-purple-400',
      count: data.correlations.length,
    },
  ];

  const toggleCollapse = (id: string) => setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="max-w-5xl mx-auto px-4 py-4">
      {/* Background dot grid */}
      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-3"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #e5e7eb 0.3px, transparent 0)',
          backgroundSize: '20px 20px',
        }}
      >
        {panels.map((panel) => (
          <div
            key={panel.id}
            className={`border-t-2 ${panel.borderColor} bg-white dark:bg-relic-void/60 rounded-lg shadow-sm border border-relic-mist/40 dark:border-relic-slate/20 overflow-hidden`}
          >
            {/* Panel header — drag handle + collapse */}
            <div className="flex items-center justify-between px-3 py-2 bg-relic-ghost/30 dark:bg-relic-slate/10 cursor-grab active:cursor-grabbing">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-relic-silver">{panel.icon}</span>
                <span className="text-[9px] font-medium uppercase tracking-wider text-relic-slate dark:text-relic-ghost">
                  {panel.title}
                </span>
                <span className="text-[8px] px-1.5 py-0.5 bg-relic-ghost/50 dark:bg-relic-slate/20 rounded text-relic-silver">
                  {panel.count}
                </span>
              </div>
              <button
                onClick={() => toggleCollapse(panel.id)}
                className="w-5 h-5 flex items-center justify-center text-relic-silver hover:text-relic-slate text-[10px]"
              >
                {collapsed[panel.id] ? '▼' : '▲'}
              </button>
            </div>

            {/* Panel content */}
            {!collapsed[panel.id] && (
              <div className="max-h-[400px] overflow-auto">
                {panel.id === 'facts' && <FactsPanel facts={data.facts} charts={data.charts} />}
                {panel.id === 'metrics' && (
                  <MetricsPanel metrics={data.metrics} charts={data.charts} />
                )}
                {panel.id === 'correlation' && (
                  <CorrelationPanel
                    correlations={data.correlations}
                    facts={data.facts}
                    metrics={data.metrics}
                    charts={data.charts}
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
