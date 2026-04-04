'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Squares2X2Icon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  FolderIcon,
  ChevronDownIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { TopicGridView, TopicListView, TopicDetailModal } from './HistoryViews';

interface QueryHistoryItem {
  id: string;
  query: string;
  flow: string;
  status: string;
  created_at: number;
  tokens_used: number;
  cost: number;
}

interface TopicCluster {
  topic: string;
  queries: QueryHistoryItem[];
  totalCost: number;
  totalTokens: number;
  lastActivity: number;
}

type ViewMode = 'grid' | 'list';
type TimeFilter = 'all' | 'today' | 'week' | 'month';

const PAGE_SIZE = 50;

export default function HistoryPage() {
  const router = useRouter();
  const [queries, setQueries] = useState<QueryHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  // Load dark mode preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('akhai-dark-mode');
      if (saved) setDarkMode(saved === 'true');
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    if (typeof window !== 'undefined') {
      localStorage.setItem('akhai-dark-mode', String(newValue));
    }
  };

  // Fetch with pagination
  const fetchQueries = async (reset: boolean = false) => {
    const currentOffset = reset ? 0 : offset;
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const res = await fetch(`/api/history?limit=${PAGE_SIZE}&offset=${currentOffset}`);
      const data = await res.json();
      const newQueries = data.queries || [];

      console.log(
        '[History] API returned:',
        newQueries.length,
        'conversations (offset:',
        currentOffset,
        ')'
      );

      if (reset) {
        setQueries(newQueries);
        setOffset(PAGE_SIZE);
      } else {
        setQueries((prev) => [...prev, ...newQueries]);
        setOffset((prev) => prev + PAGE_SIZE);
      }

      setHasMore(newQueries.length === PAGE_SIZE);
    } catch (error) {
      console.error('[History] Fetch failed:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchQueries(true);
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

  // Log filter counts
  useEffect(() => {
    console.log('[History] After time filter:', filteredByTime.length);
    console.log('[History] After search filter:', filteredBySearch.length);
  }, [filteredByTime.length, filteredBySearch.length]);

  // Cluster queries by topic
  const clusters = useMemo((): TopicCluster[] => {
    if (filteredBySearch.length === 0) return [];

    const clusterMap = new Map<string, QueryHistoryItem[]>();

    filteredBySearch.forEach((query) => {
      const words = query.query
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(' ')
        .filter(
          (w) =>
            w.length > 3 &&
            ![
              'what',
              'how',
              'why',
              'when',
              'where',
              'which',
              'that',
              'this',
              'with',
              'from',
              'about',
              'would',
              'could',
              'should',
              'have',
              'been',
              'were',
              'your',
              'them',
              'they',
              'will',
              'more',
              'some',
            ].includes(w)
        )
        .slice(0, 2)
        .join(' ');

      const topic = words || 'General';

      if (!clusterMap.has(topic)) {
        clusterMap.set(topic, []);
      }
      clusterMap.get(topic)!.push(query);
    });

    const result = Array.from(clusterMap.entries()).map(([topic, queries]) => ({
      topic: topic.charAt(0).toUpperCase() + topic.slice(1),
      queries: queries.sort((a, b) => b.created_at - a.created_at),
      totalCost: queries.reduce((sum, q) => sum + (q.cost || 0), 0),
      totalTokens: queries.reduce((sum, q) => sum + (q.tokens_used || 0), 0),
      lastActivity: Math.max(...queries.map((q) => q.created_at)),
    }));

    // Sort by most recent
    result.sort((a, b) => b.lastActivity - a.lastActivity);

    return result;
  }, [filteredBySearch]);

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp * 1000);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp * 1000);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const handleQueryClick = (queryId: string) => {
    router.push(`/?continue=${queryId}`);
  };

  // Stats
  const totalQueries = filteredBySearch.length;
  const totalCost = filteredBySearch.reduce((sum, q) => sum + (q.cost || 0), 0);
  const totalTokens = filteredBySearch.reduce((sum, q) => sum + (q.tokens_used || 0), 0);

  return (
    <div
      className={`min-h-screen ${darkMode ? 'bg-relic-void' : 'bg-gradient-to-b from-slate-50 to-white'}`}
    >
      {/* Header */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-md border-b ${
          darkMode ? 'bg-relic-void/80 border-relic-slate/30' : 'bg-white/80 border-slate-200/50'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a
                href="/"
                className={`text-[9px] uppercase tracking-[0.3em] transition-colors ${
                  darkMode
                    ? 'text-relic-ghost/60 hover:text-white'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                ← akhai
              </a>
              <div className={`h-3 w-px ${darkMode ? 'bg-relic-slate/30' : 'bg-slate-200'}`} />
              <h1 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-slate-700'}`}>
                History
              </h1>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              {/* Dark mode toggle */}
              <button
                onClick={toggleDarkMode}
                className={`p-1.5 rounded transition-all ${
                  darkMode
                    ? 'text-relic-ghost hover:text-white'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>

              {/* View mode toggle */}
              <div
                className={`flex items-center gap-1 rounded-md p-0.5 ${
                  darkMode ? 'bg-relic-slate/30' : 'bg-slate-100'
                }`}
              >
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded transition-all ${
                    viewMode === 'grid'
                      ? darkMode
                        ? 'bg-relic-slate text-white shadow-sm'
                        : 'bg-white shadow-sm text-slate-700'
                      : darkMode
                        ? 'text-relic-ghost hover:text-white'
                        : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Squares2X2Icon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded transition-all ${
                    viewMode === 'list'
                      ? darkMode
                        ? 'bg-relic-slate text-white shadow-sm'
                        : 'bg-white shadow-sm text-slate-700'
                      : darkMode
                        ? 'text-relic-ghost hover:text-white'
                        : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <ListBulletIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div
        className={`sticky top-[49px] z-30 backdrop-blur-md border-b ${
          darkMode ? 'bg-relic-void/60 border-relic-slate/20' : 'bg-white/60 border-slate-100'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 py-2">
          <div className="flex items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <MagnifyingGlassIcon
                className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${
                  darkMode ? 'text-relic-ghost/50' : 'text-slate-400'
                }`}
              />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 border-0 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/30 ${
                  darkMode
                    ? 'bg-relic-slate/30 text-white placeholder:text-relic-ghost/50'
                    : 'bg-slate-100 text-slate-600 placeholder:text-slate-400'
                }`}
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              {/* Time filter */}
              <div
                className={`flex items-center rounded-md p-0.5 ${
                  darkMode ? 'bg-relic-slate/30' : 'bg-slate-100'
                }`}
              >
                {(['all', 'today', 'week', 'month'] as TimeFilter[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTimeFilter(filter)}
                    className={`px-2 py-1 text-[9px] font-medium rounded transition-all capitalize ${
                      timeFilter === filter
                        ? darkMode
                          ? 'bg-relic-slate text-white shadow-sm'
                          : 'bg-white shadow-sm text-slate-700'
                        : darkMode
                          ? 'text-relic-ghost hover:text-white'
                          : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div
            className={`flex items-center gap-4 mt-2 text-[9px] ${
              darkMode ? 'text-relic-ghost/60' : 'text-slate-400'
            }`}
          >
            <span className="flex items-center gap-1">
              <DocumentTextIcon className="w-3 h-3" />
              {totalQueries} conversations
            </span>
            <span className="flex items-center gap-1">
              <FolderIcon className="w-3 h-3" />
              {clusters.length} topics
            </span>
            <span className="flex items-center gap-1">
              <CurrencyDollarIcon className="w-3 h-3" />${totalCost.toFixed(4)}
            </span>
            {hasMore && (
              <button
                onClick={() => fetchQueries(false)}
                disabled={loadingMore}
                className={`ml-auto px-2 py-0.5 rounded text-[8px] transition-colors ${
                  darkMode
                    ? 'bg-relic-slate/30 text-relic-ghost hover:bg-relic-slate/50'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                {loadingMore ? 'Loading...' : 'Load more'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div
              className={`w-5 h-5 border-2 rounded-full animate-spin ${
                darkMode
                  ? 'border-relic-slate border-t-white'
                  : 'border-slate-200 border-t-slate-500'
              }`}
            />
          </div>
        ) : clusters.length === 0 ? (
          <div
            className={`text-center py-16 ${darkMode ? 'text-relic-ghost/60' : 'text-slate-400'}`}
          >
            <DocumentTextIcon className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-xs">No conversations found</p>
          </div>
        ) : viewMode === 'grid' ? (
          <TopicGridView
            clusters={clusters}
            selectedTopic={selectedTopic}
            setSelectedTopic={setSelectedTopic}
            formatDate={formatDate}
            darkMode={darkMode}
          />
        ) : (
          <TopicListView
            clusters={clusters}
            selectedTopic={selectedTopic}
            setSelectedTopic={setSelectedTopic}
            formatDate={formatDate}
            formatTime={formatTime}
            handleQueryClick={handleQueryClick}
          />
        )}

        {/* Expanded topic detail - Grid view */}
        {viewMode === 'grid' && selectedTopic && (
          <TopicDetailModal
            clusters={clusters}
            selectedTopic={selectedTopic}
            setSelectedTopic={setSelectedTopic}
            formatDate={formatDate}
            formatTime={formatTime}
            handleQueryClick={handleQueryClick}
          />
        )}
      </main>
    </div>
  );
}
