'use client';

import { useRef } from 'react';
import {
  QueryHistoryItem,
  TopicCluster,
  ViewMode,
  SortBy,
  TimeFilter,
} from './MindMapHistoryView.types';
import { formatDate } from './MindMapHistoryView.utils';
import { ExpandedClusterView, ClusterGridCard, ClusterListItem } from './MindMapHistoryView.cards';

// Suppress unused import — formatDate kept for potential future use in sections
void formatDate;

interface ToolbarSectionProps {
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  timeFilter: TimeFilter;
  setTimeFilter: (v: TimeFilter) => void;
  showTopicFilter: boolean;
  setShowTopicFilter: (v: boolean) => void;
  setShowFilters: (v: boolean) => void;
  filterTopic: string | null;
  setFilterTopic: (v: string | null) => void;
  topicNames: string[];
  clusters: TopicCluster[];
  showFilters: boolean;
  sortBy: SortBy;
  setSortBy: (v: SortBy) => void;
  sortAsc: boolean;
  setSortAsc: (v: boolean) => void;
  filteredClusters: TopicCluster[];
  totalQueries: number;
  totalCost: number;
}

export function ToolbarSection({
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  timeFilter,
  setTimeFilter,
  showTopicFilter,
  setShowTopicFilter,
  setShowFilters,
  filterTopic,
  setFilterTopic,
  topicNames,
  clusters,
  showFilters,
  sortBy,
  setSortBy,
  sortAsc,
  setSortAsc,
  filteredClusters,
  totalQueries,
  totalCost,
}: ToolbarSectionProps) {
  return (
    <div
      className="flex-none bg-white/60 dark:bg-[#18181b]/60 backdrop-blur-md border-b border-slate-100 dark:border-[#334155]"
      style={{ position: 'relative', zIndex: 30 }}
    >
      <div className="px-4 py-2">
        <div className="flex items-center justify-between gap-2">
          {/* View mode toggle */}
          <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-[#334155]/50 rounded p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2 py-1 rounded text-[9px] font-medium tracking-wider uppercase transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-[#334155] shadow-sm text-slate-700 dark:text-white'
                  : 'text-slate-400 dark:text-[#64748b] hover:text-slate-600 dark:hover:text-[#94a3b8]'
              }`}
            >
              GRID
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2 py-1 rounded text-[9px] font-medium tracking-wider uppercase transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-[#334155] shadow-sm text-slate-700 dark:text-white'
                  : 'text-slate-400 dark:text-[#64748b] hover:text-slate-600 dark:hover:text-[#94a3b8]'
              }`}
            >
              LIST
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="search queries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 max-w-sm px-3 py-1.5 bg-slate-100 dark:bg-[#334155]/50 border-0 rounded text-[10px] text-slate-600 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#64748b] focus:outline-none focus:ring-1 focus:ring-slate-400/30 dark:focus:ring-[#64748b]/30"
          />

          {/* Time filter */}
          <div className="flex items-center bg-slate-100 dark:bg-[#334155]/50 rounded p-0.5">
            {(['all', 'today', 'week', 'month'] as TimeFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-2 py-1 text-[9px] font-medium tracking-wider uppercase rounded transition-all ${
                  timeFilter === filter
                    ? 'bg-white dark:bg-[#334155] shadow-sm text-slate-700 dark:text-white'
                    : 'text-slate-400 dark:text-[#64748b] hover:text-slate-600 dark:hover:text-[#94a3b8]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Topic filter */}
          <div className="relative">
            <button
              onClick={() => {
                setShowTopicFilter(!showTopicFilter);
                setShowFilters(false);
              }}
              className={`flex items-center gap-1 px-2 py-1.5 rounded text-[9px] font-medium tracking-wider uppercase transition-all ${
                filterTopic
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-100 dark:bg-[#334155]/50 text-slate-500 dark:text-[#94a3b8] hover:bg-slate-200 dark:hover:bg-[#334155]'
              }`}
            >
              {filterTopic || 'TOPICS'}
              <span
                className={`text-[8px] transition-transform inline-block ${showTopicFilter ? 'rotate-180' : ''}`}
              >
                ▾
              </span>
            </button>

            {showTopicFilter && (
              <div className="absolute right-0 mt-1 w-48 max-h-64 overflow-y-auto bg-white dark:bg-[#18181b] rounded-lg shadow-lg border border-slate-100 dark:border-[#334155] py-1 z-50">
                <button
                  onClick={() => {
                    setFilterTopic(null);
                    setShowTopicFilter(false);
                  }}
                  className={`w-full flex items-center px-2.5 py-1.5 text-[10px] hover:bg-slate-50 dark:hover:bg-[#334155]/30 ${
                    !filterTopic
                      ? 'text-slate-700 dark:text-white font-medium'
                      : 'text-slate-500 dark:text-[#94a3b8]'
                  }`}
                >
                  All Topics ({clusters.length})
                </button>
                <div className="h-px bg-slate-100 dark:bg-[#334155] my-1" />
                {topicNames.map((topic) => {
                  const cluster = clusters.find((c) => c.topic === topic);
                  return (
                    <button
                      key={topic}
                      onClick={() => {
                        setFilterTopic(topic);
                        setShowTopicFilter(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] hover:bg-slate-50 dark:hover:bg-[#334155]/30 ${
                        filterTopic === topic
                          ? 'text-slate-700 dark:text-white font-medium'
                          : 'text-slate-500 dark:text-[#94a3b8]'
                      }`}
                    >
                      <span className="truncate">{topic}</span>
                      <span className="text-slate-400 dark:text-[#64748b] ml-2">
                        {cluster?.queries.length || 0}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sort */}
          <div className="relative">
            <button
              onClick={() => {
                setShowFilters(!showFilters);
                setShowTopicFilter(false);
              }}
              className="flex items-center gap-1 px-2 py-1.5 bg-slate-100 dark:bg-[#334155]/50 rounded text-[9px] font-medium tracking-wider uppercase text-slate-500 dark:text-[#94a3b8] hover:bg-slate-200 dark:hover:bg-[#334155] transition-all"
            >
              {sortBy}
              <span
                className={`text-[8px] transition-transform inline-block ${showFilters ? 'rotate-180' : ''}`}
              >
                ▾
              </span>
            </button>

            {showFilters && (
              <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-[#18181b] rounded-lg shadow-lg border border-slate-100 dark:border-[#334155] py-1 z-50">
                {(['recent', 'queries', 'cost', 'name'] as SortBy[]).map((sort) => (
                  <button
                    key={sort}
                    onClick={() => {
                      if (sortBy === sort) {
                        setSortAsc(!sortAsc);
                      } else {
                        setSortBy(sort);
                        setSortAsc(false);
                      }
                      setShowFilters(false);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] text-slate-600 dark:text-[#94a3b8] hover:bg-slate-50 dark:hover:bg-[#334155]/30"
                  >
                    <span className="uppercase tracking-wider">{sort}</span>
                    {sortBy === sort && <span className="text-[9px]">{sortAsc ? '↑' : '↓'}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 mt-1.5 text-[9px] text-slate-400 dark:text-[#64748b] tracking-wider uppercase">
          <span>
            {filterTopic
              ? `${filteredClusters.reduce((sum, c) => sum + c.queries.length, 0)} queries`
              : `${totalQueries} queries`}
          </span>
          <span>{filterTopic ? `1/${clusters.length} topics` : `${clusters.length} topics`}</span>
          <span>${totalCost.toFixed(4)}</span>
        </div>
      </div>
    </div>
  );
}

interface DailySummary {
  count: number;
  tokens: number;
  cost: number;
  methods: [string, number][];
}

interface MainContentSectionProps {
  loading: boolean;
  dailySummary: DailySummary;
  filteredClusters: TopicCluster[];
  searchQuery: string;
  viewMode: ViewMode;
  expandedCluster: string | null;
  setExpandedCluster: (v: string | null) => void;
  selectedTopic: string | null;
  setSelectedTopic: (v: string | null) => void;
  setClickedQuery: (v: { query: QueryHistoryItem; x: number; y: number } | null) => void;
  handleClusterHover: (e: React.MouseEvent, cluster: TopicCluster) => void;
  handleClusterHoverLeave: () => void;
  handleQueryClick: (e: React.MouseEvent, query: QueryHistoryItem) => void;
  handleQueryContextMenu: (e: React.MouseEvent, query: QueryHistoryItem) => void;
  handleQueryMouseEnter: (e: React.MouseEvent, query: QueryHistoryItem) => void;
  handleQueryMouseLeave: () => void;
}

export function MainContentSection({
  loading,
  dailySummary,
  filteredClusters,
  searchQuery,
  viewMode,
  expandedCluster,
  setExpandedCluster,
  selectedTopic,
  setSelectedTopic,
  setClickedQuery,
  handleClusterHover,
  handleClusterHoverLeave,
  handleQueryClick,
  handleQueryContextMenu,
  handleQueryMouseEnter,
  handleQueryMouseLeave,
}: MainContentSectionProps) {
  return (
    <main className="flex-1 overflow-y-auto px-4 py-4">
      {/* Daily summary banner */}
      {!loading && dailySummary.count > 0 && (
        <div className="mb-3 px-3 py-2 bg-slate-50 dark:bg-[#334155]/20 border border-slate-200 dark:border-[#334155] rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-[9px] tracking-wider uppercase text-slate-500 dark:text-[#94a3b8] font-medium">
              TODAY
            </span>
            <span className="text-[10px] text-slate-600 dark:text-[#94a3b8]">
              {dailySummary.count} queries
            </span>
            <span className="text-[10px] text-slate-400 dark:text-[#64748b]">
              {dailySummary.tokens.toLocaleString()} tok
            </span>
            <span className="text-[10px] text-slate-400 dark:text-[#64748b]">
              ${dailySummary.cost.toFixed(4)}
            </span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-4 h-4 border-2 border-slate-200 dark:border-[#334155] border-t-slate-500 dark:border-t-[#94a3b8] rounded-full animate-spin" />
        </div>
      ) : filteredClusters.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-[11px] text-slate-300 dark:text-[#334155] leading-relaxed mb-4 select-none">
            {'┌─────────────┐'}
            <br />
            {'│             │'}
            <br />
            {'│   ○  ○  ○   │'}
            <br />
            {'│             │'}
            <br />
            {'│  ─────────  │'}
            <br />
            {'│  ─────────  │'}
            <br />
            {'│  ────────   │'}
            <br />
            {'│             │'}
            <br />
            {'└─────────────┘'}
          </div>
          <p className="text-[10px] tracking-wider uppercase text-slate-400 dark:text-[#64748b] mb-1">
            {searchQuery ? 'No matching queries' : 'No conversations yet'}
          </p>
          <p className="text-[9px] text-slate-300 dark:text-[#334155]">
            {searchQuery
              ? 'Try a different search term'
              : 'Start a conversation to see your history here'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        expandedCluster ? (
          (() => {
            const cluster = filteredClusters.find((c) => c.topic === expandedCluster);
            if (!cluster) {
              setExpandedCluster(null);
              return null;
            }
            return (
              <ExpandedClusterView
                cluster={cluster}
                onCollapse={() => setExpandedCluster(null)}
                onQueryClick={handleQueryClick}
                onQueryContextMenu={handleQueryContextMenu}
                onQueryMouseEnter={handleQueryMouseEnter}
                onQueryMouseLeave={handleQueryMouseLeave}
              />
            );
          })()
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {filteredClusters.map((cluster) => (
              <ClusterGridCard
                key={cluster.topic}
                cluster={cluster}
                onExpand={setExpandedCluster}
                onContextMenu={(e, query) => setClickedQuery({ query, x: e.clientX, y: e.clientY })}
                onClusterHover={handleClusterHover}
                onClusterHoverLeave={handleClusterHoverLeave}
              />
            ))}
          </div>
        )
      ) : (
        /* List View */
        <div className="space-y-1">
          {filteredClusters.map((cluster) => (
            <ClusterListItem
              key={cluster.topic}
              cluster={cluster}
              isExpanded={selectedTopic === cluster.topic}
              onToggle={(topic) => setSelectedTopic(selectedTopic === topic ? null : topic)}
              onClusterHover={handleClusterHover}
              onClusterHoverLeave={handleClusterHoverLeave}
              onQueryClick={handleQueryClick}
              onQueryContextMenu={handleQueryContextMenu}
              onQueryMouseEnter={handleQueryMouseEnter}
              onQueryMouseLeave={handleQueryMouseLeave}
            />
          ))}
        </div>
      )}
    </main>
  );
}
