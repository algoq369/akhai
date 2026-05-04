'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  QueryHistoryItem,
  TopicCluster,
  ViewMode,
  SortBy,
  TimeFilter,
} from './MindMapHistoryView.types';
import { extractTopic, normalizeTopic } from './MindMapHistoryView.utils';
import { HoverTooltip, ClusterInsightTooltip, ClickPopup } from './MindMapHistoryView.portals';
import { createClusterHoverHandlers } from './MindMapHistoryView.handlers';
import { ToolbarSection, MainContentSection } from './MindMapHistoryView.sections';

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
    e.stopPropagation();
    const x = e.clientX,
      y = e.clientY;
    setClusterInsight(null);
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
    setClusterInsight(null);
    setClickedQuery(
      clickedQuery?.query.id === query.id ? null : { query, x: e.clientX, y: e.clientY }
    );
  };

  const rawClusterHover = createClusterHoverHandlers(
    clusterInsightCache,
    clusterHoverTimeout,
    setClusterInsight
  );
  const handleClusterHover = (e: React.MouseEvent, cluster: TopicCluster) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setHoveredQuery(null);
    rawClusterHover.handleClusterHover(e, cluster);
  };
  const handleClusterHoverLeave = rawClusterHover.handleClusterHoverLeave;

  return (
    <div
      className="flex flex-col h-full font-mono bg-gradient-to-b from-slate-50 to-white dark:from-[#18181b] dark:to-[#18181b] overflow-hidden"
      onClick={() => setClickedQuery(null)}
    >
      {/* Toolbar — z-index above cards */}
      <ToolbarSection
        viewMode={viewMode}
        setViewMode={setViewMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        timeFilter={timeFilter}
        setTimeFilter={setTimeFilter}
        showTopicFilter={showTopicFilter}
        setShowTopicFilter={setShowTopicFilter}
        setShowFilters={setShowFilters}
        filterTopic={filterTopic}
        setFilterTopic={setFilterTopic}
        topicNames={topicNames}
        clusters={clusters}
        showFilters={showFilters}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortAsc={sortAsc}
        setSortAsc={setSortAsc}
        filteredClusters={filteredClusters}
        totalQueries={totalQueries}
        totalCost={totalCost}
      />

      {/* Main content */}
      <MainContentSection
        loading={loading}
        dailySummary={dailySummary}
        filteredClusters={filteredClusters}
        searchQuery={searchQuery}
        viewMode={viewMode}
        expandedCluster={expandedCluster}
        setExpandedCluster={setExpandedCluster}
        selectedTopic={selectedTopic}
        setSelectedTopic={setSelectedTopic}
        setClickedQuery={setClickedQuery}
        handleClusterHover={handleClusterHover}
        handleClusterHoverLeave={handleClusterHoverLeave}
        handleQueryClick={handleQueryClick}
        handleQueryContextMenu={handleQueryContextMenu}
        handleQueryMouseEnter={handleQueryMouseEnter}
        handleQueryMouseLeave={handleQueryMouseLeave}
      />

      {/* Hover tooltip — portal to escape overflow:hidden */}
      {hoveredQuery && !clickedQuery && !clusterInsight && (
        <HoverTooltip
          hoveredQuery={hoveredQuery}
          hoverHideTimeout={hoverHideTimeout}
          setHoveredQuery={() => setHoveredQuery(null)}
          onContinueToChat={onContinueToChat}
        />
      )}

      {/* Cluster insight tooltip — portal */}
      {clusterInsight && !hoveredQuery && !clickedQuery && (
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
