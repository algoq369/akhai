'use client';

/**
 * History Page — View Components
 *
 * Extracted from history/page.tsx:
 * - TopicGridView (grid of topic cards)
 * - TopicListView (expandable list of topic clusters)
 * - TopicDetailModal (modal for grid view expanded detail)
 */

import { CalendarIcon, ChevronDownIcon, FolderIcon } from '@heroicons/react/24/outline';

// ═══════════════════════════════════════════════════════════════════
// TYPES (shared with parent)
// ═══════════════════════════════════════════════════════════════════

export interface QueryHistoryItem {
  id: string;
  query: string;
  flow: string;
  status: string;
  created_at: number;
  tokens_used: number;
  cost: number;
}

export interface TopicCluster {
  topic: string;
  queries: QueryHistoryItem[];
  totalCost: number;
  totalTokens: number;
  lastActivity: number;
}

// Methodology colors
export const METHODOLOGY_COLORS: Record<string, string> = {
  direct: '#EF4444',
  cod: '#F97316',
  sc: '#EAB308',
  react: '#22C55E',
  pas: '#3B82F6',
  tot: '#6366F1',
  auto: '#8B5CF6',
};

// ═══════════════════════════════════════════════════════════════════
// GRID VIEW
// ═══════════════════════════════════════════════════════════════════

export function TopicGridView({
  clusters,
  selectedTopic,
  setSelectedTopic,
  formatDate,
  darkMode,
}: {
  clusters: TopicCluster[];
  selectedTopic: string | null;
  setSelectedTopic: (topic: string | null) => void;
  formatDate: (ts: number) => string;
  darkMode: boolean;
}) {
  return (
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {clusters.map((cluster) => (
        <button
          key={cluster.topic}
          onClick={() => setSelectedTopic(selectedTopic === cluster.topic ? null : cluster.topic)}
          className={`group relative rounded-xl border transition-all duration-200 text-left overflow-hidden ${
            selectedTopic === cluster.topic
              ? 'border-blue-400 shadow-md scale-[1.02]'
              : darkMode
                ? 'bg-relic-slate/20 border-relic-slate/30 hover:border-relic-slate/50 hover:shadow-sm'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
          }`}
        >
          {/* Preview area */}
          <div className="aspect-[4/3] bg-gradient-to-br from-slate-50 to-slate-100/50 flex items-center justify-center p-3 relative overflow-hidden">
            {/* Document stack */}
            <div className="relative w-full h-full">
              {cluster.queries.slice(0, 3).map((q, i) => (
                <div
                  key={q.id}
                  className="absolute bg-white rounded shadow-sm border border-slate-200/80 p-1.5"
                  style={{
                    width: '75%',
                    height: '65%',
                    left: `${12 + i * 4}%`,
                    top: `${18 + i * 4}%`,
                    transform: `rotate(${-1 + i * 1.5}deg)`,
                    zIndex: 3 - i,
                  }}
                >
                  <div
                    className="w-0.5 h-full absolute left-0 top-0 rounded-l"
                    style={{ backgroundColor: METHODOLOGY_COLORS[q.flow] || '#8B5CF6' }}
                  />
                  <p className="text-[6px] text-slate-500 line-clamp-2 pl-1.5 leading-tight">
                    {q.query}
                  </p>
                </div>
              ))}
            </div>

            {/* Count badge */}
            <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-slate-700/80 rounded text-[7px] text-white font-medium">
              {cluster.queries.length}
            </div>
          </div>

          {/* Info */}
          <div className="p-2 border-t border-slate-100">
            <h3 className="text-[10px] font-medium text-slate-700 truncate">{cluster.topic}</h3>
            <div className="flex items-center justify-between text-[8px] text-slate-400 mt-0.5">
              <span>{formatDate(cluster.lastActivity)}</span>
              <span>${cluster.totalCost.toFixed(4)}</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LIST VIEW
// ═══════════════════════════════════════════════════════════════════

export function TopicListView({
  clusters,
  selectedTopic,
  setSelectedTopic,
  formatDate,
  formatTime,
  handleQueryClick,
}: {
  clusters: TopicCluster[];
  selectedTopic: string | null;
  setSelectedTopic: (topic: string | null) => void;
  formatDate: (ts: number) => string;
  formatTime: (ts: number) => string;
  handleQueryClick: (queryId: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      {clusters.map((cluster) => (
        <div
          key={cluster.topic}
          className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:border-slate-300 transition-all"
        >
          <button
            onClick={() => setSelectedTopic(selectedTopic === cluster.topic ? null : cluster.topic)}
            className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-50 transition-colors"
          >
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center text-white"
              style={{
                backgroundColor: METHODOLOGY_COLORS[cluster.queries[0]?.flow] || '#8B5CF6',
              }}
            >
              <FolderIcon className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-medium text-slate-700">{cluster.topic}</h3>
              <p className="text-[9px] text-slate-400 truncate">
                {cluster.queries.length} queries · {formatDate(cluster.lastActivity)}
              </p>
            </div>

            <div className="text-right text-[9px] text-slate-400">
              <div>{cluster.totalTokens.toLocaleString()} tok</div>
              <div>${cluster.totalCost.toFixed(4)}</div>
            </div>

            <ChevronDownIcon
              className={`w-4 h-4 text-slate-400 transition-transform ${selectedTopic === cluster.topic ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Expanded queries */}
          {selectedTopic === cluster.topic && (
            <div className="border-t border-slate-100 bg-slate-50/50">
              {cluster.queries.map((query) => (
                <button
                  key={query.id}
                  onClick={() => handleQueryClick(query.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white transition-colors border-b border-slate-100 last:border-0"
                >
                  <div
                    className="w-0.5 h-6 rounded-full"
                    style={{ backgroundColor: METHODOLOGY_COLORS[query.flow] || '#8B5CF6' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-600 truncate">{query.query}</p>
                    <p className="text-[8px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span>{formatTime(query.created_at)}</span>
                      <span className="uppercase">{query.flow}</span>
                    </p>
                  </div>
                  <span className="text-[8px] text-slate-400">${(query.cost || 0).toFixed(4)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// DETAIL MODAL (grid view expanded)
// ═══════════════════════════════════════════════════════════════════

export function TopicDetailModal({
  clusters,
  selectedTopic,
  setSelectedTopic,
  formatDate,
  formatTime,
  handleQueryClick,
}: {
  clusters: TopicCluster[];
  selectedTopic: string;
  setSelectedTopic: (topic: string | null) => void;
  formatDate: (ts: number) => string;
  formatTime: (ts: number) => string;
  handleQueryClick: (queryId: string) => void;
}) {
  const cluster = clusters.find((c) => c.topic === selectedTopic);
  if (!cluster) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={() => setSelectedTopic(null)}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[70vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-700">{cluster.topic}</h2>
            <button
              onClick={() => setSelectedTopic(null)}
              className="text-slate-400 hover:text-slate-600 text-sm"
            >
              ✕
            </button>
          </div>
          <p className="text-[9px] text-slate-400 mt-0.5">
            {cluster.queries.length} conversations · ${cluster.totalCost.toFixed(4)}
          </p>
        </div>

        <div className="overflow-y-auto max-h-[55vh]">
          {cluster.queries.map((query) => (
            <button
              key={query.id}
              onClick={() => handleQueryClick(query.id)}
              className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
            >
              <div
                className="w-1 h-8 rounded-full"
                style={{ backgroundColor: METHODOLOGY_COLORS[query.flow] || '#8B5CF6' }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-600">{query.query}</p>
                <p className="text-[8px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <CalendarIcon className="w-2.5 h-2.5" />
                  <span>
                    {formatDate(query.created_at)} {formatTime(query.created_at)}
                  </span>
                  <span
                    className="uppercase font-medium"
                    style={{ color: METHODOLOGY_COLORS[query.flow] }}
                  >
                    {query.flow}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <div className="text-[9px] text-slate-500">
                  {(query.tokens_used || 0).toLocaleString()} tok
                </div>
                <div className="text-[8px] text-slate-400">${(query.cost || 0).toFixed(4)}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
