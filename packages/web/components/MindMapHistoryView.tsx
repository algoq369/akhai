'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  QueryHistoryItem,
  TopicCluster,
  ViewMode,
  SortBy,
  TimeFilter,
} from './MindMapHistoryView.types';
import { extractTopic, normalizeTopic, formatDate } from './MindMapHistoryView.utils';
import { HoverTooltip, ClusterInsightTooltip, ClickPopup } from './MindMapHistoryView.portals';
import { ExpandedClusterView, ClusterGridCard, ClusterListItem } from './MindMapHistoryView.cards';

interface MindMapHistoryViewProps {
  onClose?: () => void;
  onTopicExpand?: (topicId: string) => void;
  onContinueToChat?: (query: string) => void;
}

export default function MindMapHistoryView({
  onClose,
  onTopicExpand,
  onContinueToChat,
}: MindMapHistoryViewProps) {
  const [queries, setQueries] = useState<QueryHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [sortAsc, setSortAsc] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showTopicFilter, setShowTopicFilter] = useState(false);
  const [filterTopic, setFilterTopic] = useState<string | null>(null);
  const [hoveredQuery, setHoveredQuery] = useState<{
    query: QueryHistoryItem;
    x: number;
    y: number;
  } | null>(null);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const [clickedQuery, setClickedQuery] = useState<{
    query: QueryHistoryItem;
    x: number;
    y: number;
  } | null>(null);
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);
  const [clusterInsight, setClusterInsight] = useState<{
    topic: string;
    text: string;
    x: number;
    y: number;
  } | null>(null);
  const clusterInsightCache = useRef<Record<string, string>>({});
  const clusterHoverTimeout = useRef<NodeJS.Timeout | null>(null);

  // Suppress unused-var lint for onTopicExpand (kept for future use)
  void onTopicExpand;

  useEffect(() => {
    fetch('/api/history')
      .then((res) => res.json())
      .then((data) => {
        setQueries(data.queries || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Filter by time
  const filteredByTime = useMemo(() => {
    if (timeFilter === 'all') return queries;

    const now = Date.now() / 1000;
    const cutoffs: Record<TimeFilter, number> = {
      all: 0,
      today: now - 86400,
      week: now - 604800,
      month: now - 2592000,
    };

    return queries.filter((q) => q.created_at > cutoffs[timeFilter]);
  }, [queries, timeFilter]);

  // Filter by search
  const filteredBySearch = useMemo(() => {
    if (!searchQuery.trim()) return filteredByTime;
    const lower = searchQuery.toLowerCase();
    return filteredByTime.filter(
      (q) => q.query.toLowerCase().includes(lower) || q.flow.toLowerCase().includes(lower)
    );
  }, [filteredByTime, searchQuery]);

  // Cluster queries by topic
  const clusters = useMemo((): TopicCluster[] => {
    if (filteredBySearch.length === 0) return [];

    const clusterMap = new Map<string, { display: string; queries: QueryHistoryItem[] }>();

    filteredBySearch.forEach((query) => {
      const rawTopic = extractTopic(query.query);
      const normalizedKey = normalizeTopic(rawTopic);

      const displayTopic = rawTopic
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ')
        .slice(0, 60);

      if (!clusterMap.has(normalizedKey)) {
        clusterMap.set(normalizedKey, { display: displayTopic, queries: [] });
      }
      clusterMap.get(normalizedKey)!.queries.push(query);
    });

    const allClusters = Array.from(clusterMap.entries()).map(([_key, cluster]) => ({
      topic: cluster.display,
      queries: cluster.queries.sort((a, b) => b.created_at - a.created_at),
      totalCost: cluster.queries.reduce((sum, q) => sum + (q.cost || 0), 0),
      totalTokens: cluster.queries.reduce((sum, q) => sum + (q.tokens_used || 0), 0),
      lastActivity: Math.max(...cluster.queries.map((q) => q.created_at)),
    }));

    const MAX_CLUSTER_SIZE = 50;
    const result = allClusters.filter((cluster) => cluster.queries.length <= MAX_CLUSTER_SIZE);

    switch (sortBy) {
      case 'recent':
        result.sort((a, b) =>
          sortAsc ? a.lastActivity - b.lastActivity : b.lastActivity - a.lastActivity
        );
        break;
      case 'queries':
        result.sort((a, b) =>
          sortAsc ? a.queries.length - b.queries.length : b.queries.length - a.queries.length
        );
        break;
      case 'cost':
        result.sort((a, b) => (sortAsc ? a.totalCost - b.totalCost : b.totalCost - a.totalCost));
        break;
      case 'name':
        result.sort((a, b) =>
          sortAsc ? a.topic.localeCompare(b.topic) : b.topic.localeCompare(a.topic)
        );
        break;
    }

    return result;
  }, [filteredBySearch, sortBy, sortAsc]);

  const topicNames = useMemo(() => {
    return clusters.map((c) => c.topic).sort();
  }, [clusters]);

  const filteredClusters = useMemo(() => {
    if (!filterTopic) return clusters;
    return clusters.filter((c) => c.topic === filterTopic);
  }, [clusters, filterTopic]);

  // Stats
  const totalQueries = filteredBySearch.length;
  const totalCost = filteredBySearch.reduce((sum, q) => sum + (q.cost || 0), 0);

  // Daily summary
  const dailySummary = useMemo(() => {
    const now = Date.now() / 1000;
    const todayStart = now - 86400;
    const todayQueries = queries.filter((q) => q.created_at > todayStart);
    const todayTokens = todayQueries.reduce((sum, q) => sum + (q.tokens_used || 0), 0);
    const todayCost = todayQueries.reduce((sum, q) => sum + (q.cost || 0), 0);
    const methodBreakdown = new Map<string, number>();
    todayQueries.forEach((q) => {
      methodBreakdown.set(q.flow, (methodBreakdown.get(q.flow) || 0) + 1);
    });
    return {
      count: todayQueries.length,
      tokens: todayTokens,
      cost: todayCost,
      methods: Array.from(methodBreakdown.entries()).sort((a, b) => b[1] - a[1]),
    };
  }, [queries]);

  // Hover/click handlers for query rows
  const handleQueryMouseEnter = (e: React.MouseEvent, query: QueryHistoryItem) => {
    const x = e.clientX,
      y = e.clientY;
    hoverTimeout.current = setTimeout(() => setHoveredQuery({ query, x, y }), 150);
  };
  const hoverHideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleQueryMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverHideTimeout.current = setTimeout(() => setHoveredQuery(null), 300);
  };
  const handleQueryClick = (e: React.MouseEvent, query: QueryHistoryItem) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setHoveredQuery(null);
    // Close mindmap modal first, then navigate
    onClose?.();
    setTimeout(() => {
      window.location.href = `/?continue=${query.id}`;
    }, 150);
  };
  const handleQueryContextMenu = (e: React.MouseEvent, query: QueryHistoryItem) => {
    e.preventDefault();
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setHoveredQuery(null);
    setClickedQuery(
      clickedQuery?.query.id === query.id ? null : { query, x: e.clientX, y: e.clientY }
    );
  };

  const handleClusterHover = (e: React.MouseEvent, cluster: TopicCluster) => {
    const x = e.clientX,
      y = e.clientY;
    if (clusterHoverTimeout.current) clearTimeout(clusterHoverTimeout.current);
    clusterHoverTimeout.current = setTimeout(async () => {
      // Check cache first
      if (clusterInsightCache.current[cluster.topic]) {
        setClusterInsight({
          topic: cluster.topic,
          text: clusterInsightCache.current[cluster.topic],
          x,
          y,
        });
        return;
      }
      setClusterInsight({ topic: cluster.topic, text: '...', x, y });
      try {
        const queryTexts = cluster.queries
          .slice(0, 3)
          .map((q) => q.query)
          .join('; ');
        const res = await fetch('/api/quick-query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `In 2 sentences (max 30 words), summarize what the user explored about: ${cluster.topic}. Queries: ${queryTexts}`,
          }),
        });
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        const text = data.response || data.text || data.result || 'No insight available';
        clusterInsightCache.current[cluster.topic] = text;
        setClusterInsight({ topic: cluster.topic, text, x, y });
      } catch {
        clusterInsightCache.current[cluster.topic] = 'Could not generate insight';
        setClusterInsight({ topic: cluster.topic, text: 'Could not generate insight', x, y });
      }
    }, 400);
  };
  const handleClusterHoverLeave = () => {
    if (clusterHoverTimeout.current) clearTimeout(clusterHoverTimeout.current);
    setClusterInsight(null);
  };

  return (
    <div
      className="flex flex-col h-full font-mono bg-gradient-to-b from-slate-50 to-white dark:from-[#18181b] dark:to-[#18181b] overflow-hidden"
      onClick={() => setClickedQuery(null)}
    >
      {/* Toolbar — z-index above cards */}
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

      {/* Main content */}
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
                  onContextMenu={(e, query) =>
                    setClickedQuery({ query, x: e.clientX, y: e.clientY })
                  }
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

      {/* Hover tooltip — portal to escape overflow:hidden */}
      {hoveredQuery && (
        <HoverTooltip
          hoveredQuery={hoveredQuery}
          hoverHideTimeout={hoverHideTimeout}
          setHoveredQuery={() => setHoveredQuery(null)}
          onContinueToChat={onContinueToChat}
        />
      )}

      {/* Cluster insight tooltip — portal */}
      {clusterInsight && (
        <ClusterInsightTooltip
          clusterInsight={clusterInsight}
          clusterHoverTimeout={clusterHoverTimeout}
          setClusterInsight={() => setClusterInsight(null)}
          filteredClusters={filteredClusters}
          onContinueToChat={onContinueToChat}
        />
      )}

      {/* Click popup — portal to escape overflow:hidden */}
      {clickedQuery && (
        <ClickPopup
          clickedQuery={clickedQuery}
          setClickedQuery={() => setClickedQuery(null)}
          onContinueToChat={onContinueToChat}
          onClose={onClose}
        />
      )}
    </div>
  );
}
