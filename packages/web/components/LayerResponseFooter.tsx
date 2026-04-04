'use client';

import { CoreInsight, CATEGORY_CONFIG } from './LayerResponseUtils';

interface ConnectionData {
  from: string;
  to: string;
  strength: number;
}

interface LayerResponseFooterProps {
  insights: CoreInsight[];
  connections: ConnectionData[];
  grouped: Record<string, CoreInsight[]>;
  stats: {
    total: number;
    avgConfidence: number;
    avgImpact: number;
    categories: number;
    totalMetrics: number;
    avgDataDensity: number;
  };
  viewMode: 'tree' | 'list';
  query: string;
  canShowInsight: boolean;
  onSwitchToInsight?: () => void;
  onOpenMindMap?: () => void;
}

export default function LayerResponseFooter({
  insights,
  connections,
  grouped,
  stats,
  viewMode,
  query,
  canShowInsight,
  onSwitchToInsight,
  onOpenMindMap,
}: LayerResponseFooterProps) {
  return (
    <div className="px-4 py-3 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-relic-slate/10 dark:via-relic-slate/20 dark:to-relic-slate/10 border-t border-slate-200 dark:border-relic-slate/30">
      {/* View Navigation */}
      {((onSwitchToInsight && canShowInsight) || onOpenMindMap) && (
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200 dark:border-relic-slate/30">
          <span className="text-[9px] text-slate-500 dark:text-relic-ghost/70 font-semibold uppercase tracking-wide">
            Switch View:
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled
              className="px-3 py-1.5 rounded-lg text-[10px] font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-600/30 cursor-not-allowed"
            >
              ◆ AI Layers <span className="text-[8px] opacity-60">(current)</span>
            </button>
            {onSwitchToInsight && canShowInsight && (
              <button
                onClick={onSwitchToInsight}
                className="px-3 py-1.5 rounded-lg text-[10px] font-medium bg-white dark:bg-relic-slate/30 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-600/30 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
              >
                ◇ Insight Graph
              </button>
            )}
            {onOpenMindMap && (
              <button
                onClick={onOpenMindMap}
                className="px-3 py-1.5 rounded-lg text-[10px] font-medium bg-white dark:bg-relic-slate/30 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-600/30 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
              >
                🗺️ Mind Map
              </button>
            )}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <div className="flex items-start gap-2">
          <span className="text-[9px] text-slate-500 dark:text-relic-ghost/70 font-semibold uppercase tracking-wide flex-shrink-0">
            Query:
          </span>
          <p className="text-[10px] text-slate-700 dark:text-relic-ghost leading-relaxed">
            {(() => {
              const topCategories = Object.entries(grouped)
                .filter(([, items]) => items.length > 0)
                .sort((a, b) => b[1].length - a[1].length)
                .slice(0, 2)
                .map(([cat]) => cat);

              const topMetrics = insights.flatMap((i) => i.metrics).slice(0, 3);

              const metricsText =
                topMetrics.length > 0
                  ? ` with ${topMetrics.length} key metrics (${topMetrics.join(', ')})`
                  : '';

              return `"${query.length > 60 ? query.substring(0, 57) + '...' : query}" — ${insights.length} ${topCategories.join(' and ')} insights extracted${metricsText}`;
            })()}
          </p>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wide flex-shrink-0">
            Data:
          </span>
          <p className="text-[10px] text-slate-700 dark:text-relic-ghost leading-relaxed">
            {(() => {
              const topDataInsights = insights.filter((i) => i.dataDensity > 0.4).slice(0, 2);

              if (topDataInsights.length > 0) {
                const titles = topDataInsights
                  .map((i) => (i.title.length > 40 ? i.title.substring(0, 37) + '...' : i.title))
                  .join(' • ');
                return `${stats.totalMetrics} quantitative metrics found — ${stats.avgDataDensity}% data density — Top data: ${titles}`;
              } else {
                const topInsights = insights
                  .slice(0, 2)
                  .map((i) => (i.title.length > 35 ? i.title.substring(0, 32) + '...' : i.title))
                  .join(' • ');
                return `${stats.avgConfidence}% confidence synthesis — Key concepts: ${topInsights}`;
              }
            })()}
          </p>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-[9px] text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wide flex-shrink-0">
            Explore:
          </span>
          <p className="text-[10px] text-slate-700 dark:text-relic-ghost leading-relaxed">
            {(() => {
              const connectedInsights = insights
                .filter((i) => connections.some((c) => c.from === i.id || c.to === i.id))
                .slice(0, 2);

              if (connections.length > 0 && connectedInsights.length > 0) {
                const titles = connectedInsights
                  .map((i) => (i.title.length > 30 ? i.title.substring(0, 27) + '...' : i.title))
                  .join(' ↔ ');
                return `${connections.length} semantic connections — ${viewMode === 'tree' ? 'Tree view' : 'List view'} — Click to explore: ${titles}`;
              } else {
                const topInsight = insights[0];
                return `${viewMode === 'tree' ? 'Tree view active' : 'List view active'} — Click "${topInsight.title.substring(0, 40)}..." to ${topInsight.metrics.length > 0 ? `see ${topInsight.metrics.length} metrics` : 'explore deeper'}`;
              }
            })()}
          </p>
        </div>
      </div>
    </div>
  );
}
