'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'

interface QueryHistoryItem {
  id: string
  query: string
  flow: string
  status: string
  created_at: number
  tokens_used: number
  cost: number
}

interface TopicCluster {
  topic: string
  queries: QueryHistoryItem[]
  totalCost: number
  totalTokens: number
  lastActivity: number
}

type ViewMode = 'grid' | 'list'
type SortBy = 'recent' | 'queries' | 'cost' | 'name'
type TimeFilter = 'all' | 'today' | 'week' | 'month'

// Methodology colors
const METHODOLOGY_COLORS: Record<string, string> = {
  direct: '#EF4444',
  cod: '#F97316',
  bot: '#EAB308',
  react: '#22C55E',
  pot: '#3B82F6',
  gtp: '#6366F1',
  auto: '#8B5CF6',
}

interface MindMapHistoryViewProps {
  onClose?: () => void
  onTopicExpand?: (topicId: string) => void
  onContinueToChat?: (query: string) => void
}

export default function MindMapHistoryView({ onClose, onTopicExpand, onContinueToChat }: MindMapHistoryViewProps) {
  const [queries, setQueries] = useState<QueryHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortBy>('recent')
  const [sortAsc, setSortAsc] = useState(false)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showTopicFilter, setShowTopicFilter] = useState(false)
  const [filterTopic, setFilterTopic] = useState<string | null>(null)
  const [hoveredQuery, setHoveredQuery] = useState<{query: QueryHistoryItem, x: number, y: number} | null>(null)
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null)
  const [clickedQuery, setClickedQuery] = useState<{query: QueryHistoryItem, x: number, y: number} | null>(null)
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null)
  const [clusterInsight, setClusterInsight] = useState<{topic: string, text: string, x: number, y: number} | null>(null)
  const clusterInsightCache = useRef<Record<string, string>>({})
  const clusterHoverTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetch('/api/history')
      .then(res => res.json())
      .then(data => {
        setQueries(data.queries || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Filter by time
  const filteredByTime = useMemo(() => {
    if (timeFilter === 'all') return queries

    const now = Date.now() / 1000
    const cutoffs: Record<TimeFilter, number> = {
      all: 0,
      today: now - 86400,
      week: now - 604800,
      month: now - 2592000,
    }

    return queries.filter(q => q.created_at > cutoffs[timeFilter])
  }, [queries, timeFilter])

  // Filter by search
  const filteredBySearch = useMemo(() => {
    if (!searchQuery.trim()) return filteredByTime
    const lower = searchQuery.toLowerCase()
    return filteredByTime.filter(q =>
      q.query.toLowerCase().includes(lower) ||
      q.flow.toLowerCase().includes(lower)
    )
  }, [filteredByTime, searchQuery])

  // Extract meaningful topic from query text
  const extractTopic = (queryText: string): string => {
    const text = queryText.trim()

    const quotedMatch = text.match(/about\s+[\"']([^\"']+)[\"']/i)
    if (quotedMatch && quotedMatch[1].length > 2) {
      return quotedMatch[1].trim()
    }

    const aboutMatch = text.match(/about\s+(.+?)(?:\?|\.|\!|$)/i)
    if (aboutMatch && aboutMatch[1].length > 3) {
      let topic = aboutMatch[1].trim()
      topic = topic.replace(/\s+(please|thanks|thank you|now|today|quickly|briefly)$/i, '')
      if (topic.length > 3) return topic
    }

    const whatIsMatch = text.match(/(?:what\s+(?:is|are)|explain|define|describe|tell\s+me\s+about)\s+(.+?)(?:\?|\.|\!|$)/i)
    if (whatIsMatch && whatIsMatch[1].length > 2) {
      let topic = whatIsMatch[1].trim()
      topic = topic.replace(/^(?:the|a|an)\s+/i, '')
      if (topic.length > 2) return topic
    }

    const howMatch = text.match(/how\s+(?:does|do|can|to)\s+(.+?)(?:\?|\.|\!|$)/i)
    if (howMatch && howMatch[1].length > 3) {
      return howMatch[1].trim()
    }

    const skipPrefixes = [
      'give', 'exactly', 'brief', 'insights', 'provide', 'list', 'show', 'tell',
      'please', 'could', 'would', 'should', 'can', 'will', 'help', 'need',
      'want', 'looking', 'find', 'search', 'write', 'create', 'make', 'generate',
      'some', 'few', 'many', 'several', 'number', 'numbers', 'digit', 'digits'
    ]
    const skipWords = [
      'what', 'how', 'why', 'when', 'where', 'which', 'that', 'this', 'with',
      'from', 'about', 'would', 'could', 'should', 'have', 'been', 'were',
      'your', 'them', 'they', 'will', 'more', 'some', 'the', 'and', 'for',
      'are', 'was', 'is', 'be', 'has', 'had', 'not', 'but', 'or', 'if', 'so',
      'me', 'my', 'you', 'we', 'our', 'its', 'their', 'there', 'here', 'just'
    ]

    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !skipPrefixes.includes(w) && !skipWords.includes(w))

    if (words.length > 0) {
      return words.slice(0, 4).join(' ')
    }

    return 'General'
  }

  // Normalize topic for grouping
  const normalizeTopic = (topic: string): string => {
    return topic
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 50)
  }

  // Cluster queries by topic
  const clusters = useMemo((): TopicCluster[] => {
    if (filteredBySearch.length === 0) return []

    const clusterMap = new Map<string, { display: string, queries: QueryHistoryItem[] }>()

    filteredBySearch.forEach((query) => {
      const rawTopic = extractTopic(query.query)
      const normalizedKey = normalizeTopic(rawTopic)

      const displayTopic = rawTopic
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ')
        .slice(0, 60)

      if (!clusterMap.has(normalizedKey)) {
        clusterMap.set(normalizedKey, { display: displayTopic, queries: [] })
      }
      clusterMap.get(normalizedKey)!.queries.push(query)
    })

    const allClusters = Array.from(clusterMap.entries()).map(([_key, cluster]) => ({
      topic: cluster.display,
      queries: cluster.queries.sort((a, b) => b.created_at - a.created_at),
      totalCost: cluster.queries.reduce((sum, q) => sum + (q.cost || 0), 0),
      totalTokens: cluster.queries.reduce((sum, q) => sum + (q.tokens_used || 0), 0),
      lastActivity: Math.max(...cluster.queries.map(q => q.created_at)),
    }))

    const MAX_CLUSTER_SIZE = 50
    const result = allClusters.filter(cluster => cluster.queries.length <= MAX_CLUSTER_SIZE)

    switch (sortBy) {
      case 'recent':
        result.sort((a, b) => sortAsc ? a.lastActivity - b.lastActivity : b.lastActivity - a.lastActivity)
        break
      case 'queries':
        result.sort((a, b) => sortAsc ? a.queries.length - b.queries.length : b.queries.length - a.queries.length)
        break
      case 'cost':
        result.sort((a, b) => sortAsc ? a.totalCost - b.totalCost : b.totalCost - a.totalCost)
        break
      case 'name':
        result.sort((a, b) => sortAsc ? a.topic.localeCompare(b.topic) : b.topic.localeCompare(a.topic))
        break
    }

    return result
  }, [filteredBySearch, sortBy, sortAsc])

  const topicNames = useMemo(() => {
    return clusters.map(c => c.topic).sort()
  }, [clusters])

  const filteredClusters = useMemo(() => {
    if (!filterTopic) return clusters
    return clusters.filter(c => c.topic === filterTopic)
  }, [clusters, filterTopic])

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp * 1000)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp * 1000)
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  // Stats
  const totalQueries = filteredBySearch.length
  const totalCost = filteredBySearch.reduce((sum, q) => sum + (q.cost || 0), 0)

  // Daily summary
  const dailySummary = useMemo(() => {
    const now = Date.now() / 1000
    const todayStart = now - 86400
    const todayQueries = queries.filter(q => q.created_at > todayStart)
    const todayTokens = todayQueries.reduce((sum, q) => sum + (q.tokens_used || 0), 0)
    const todayCost = todayQueries.reduce((sum, q) => sum + (q.cost || 0), 0)
    const methodBreakdown = new Map<string, number>()
    todayQueries.forEach(q => {
      methodBreakdown.set(q.flow, (methodBreakdown.get(q.flow) || 0) + 1)
    })
    return {
      count: todayQueries.length,
      tokens: todayTokens,
      cost: todayCost,
      methods: Array.from(methodBreakdown.entries()).sort((a, b) => b[1] - a[1]),
    }
  }, [queries])

  // Hover/click handlers for query rows
  const handleQueryMouseEnter = (e: React.MouseEvent, query: QueryHistoryItem) => {
    const x = e.clientX, y = e.clientY
    hoverTimeout.current = setTimeout(() => setHoveredQuery({ query, x, y }), 150)
  }
  const handleQueryMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
    setHoveredQuery(null)
  }
  const handleQueryClick = (e: React.MouseEvent, query: QueryHistoryItem) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
    setHoveredQuery(null)
    // Regular click → navigate to conversation
    window.location.href = `/?q=${encodeURIComponent(query.query)}&ref=${query.id}`
  }
  const handleQueryContextMenu = (e: React.MouseEvent, query: QueryHistoryItem) => {
    e.preventDefault()
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
    setHoveredQuery(null)
    setClickedQuery(clickedQuery?.query.id === query.id ? null : { query, x: e.clientX, y: e.clientY })
  }

  const handleClusterHover = (e: React.MouseEvent, cluster: TopicCluster) => {
    const x = e.clientX, y = e.clientY
    if (clusterHoverTimeout.current) clearTimeout(clusterHoverTimeout.current)
    clusterHoverTimeout.current = setTimeout(async () => {
      // Check cache first
      if (clusterInsightCache.current[cluster.topic]) {
        setClusterInsight({ topic: cluster.topic, text: clusterInsightCache.current[cluster.topic], x, y })
        return
      }
      setClusterInsight({ topic: cluster.topic, text: '...', x, y })
      try {
        const queryTexts = cluster.queries.slice(0, 3).map(q => q.query).join('; ')
        const res = await fetch('/api/quick-query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: `In 2 sentences (max 30 words), summarize what the user explored about: ${cluster.topic}. Queries: ${queryTexts}` }),
        })
        if (!res.ok) throw new Error('API error')
        const data = await res.json()
        const text = data.response || data.text || data.result || 'No insight available'
        clusterInsightCache.current[cluster.topic] = text
        setClusterInsight({ topic: cluster.topic, text, x, y })
      } catch {
        clusterInsightCache.current[cluster.topic] = 'Could not generate insight'
        setClusterInsight({ topic: cluster.topic, text: 'Could not generate insight', x, y })
      }
    }, 400)
  }
  const handleClusterHoverLeave = () => {
    if (clusterHoverTimeout.current) clearTimeout(clusterHoverTimeout.current)
    setClusterInsight(null)
  }

  return (
    <div className="flex flex-col h-full font-mono bg-gradient-to-b from-slate-50 to-white dark:from-[#18181b] dark:to-[#18181b] overflow-hidden" onClick={() => setClickedQuery(null)}>
      {/* Toolbar — z-index above cards */}
      <div className="flex-none bg-white/60 dark:bg-[#18181b]/60 backdrop-blur-md border-b border-slate-100 dark:border-[#334155]" style={{ position: 'relative', zIndex: 30 }}>
        <div className="px-4 py-2">
          <div className="flex items-center justify-between gap-2">
            {/* View mode toggle */}
            <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-[#334155]/50 rounded p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2 py-1 rounded text-[9px] font-medium tracking-wider uppercase transition-all ${
                  viewMode === 'grid' ? 'bg-white dark:bg-[#334155] shadow-sm text-slate-700 dark:text-white' : 'text-slate-400 dark:text-[#64748b] hover:text-slate-600 dark:hover:text-[#94a3b8]'
                }`}
              >
                GRID
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-2 py-1 rounded text-[9px] font-medium tracking-wider uppercase transition-all ${
                  viewMode === 'list' ? 'bg-white dark:bg-[#334155] shadow-sm text-slate-700 dark:text-white' : 'text-slate-400 dark:text-[#64748b] hover:text-slate-600 dark:hover:text-[#94a3b8]'
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
                onClick={() => { setShowTopicFilter(!showTopicFilter); setShowFilters(false) }}
                className={`flex items-center gap-1 px-2 py-1.5 rounded text-[9px] font-medium tracking-wider uppercase transition-all ${
                  filterTopic
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-100 dark:bg-[#334155]/50 text-slate-500 dark:text-[#94a3b8] hover:bg-slate-200 dark:hover:bg-[#334155]'
                }`}
              >
                {filterTopic || 'TOPICS'}
                <span className={`text-[8px] transition-transform inline-block ${showTopicFilter ? 'rotate-180' : ''}`}>▾</span>
              </button>

              {showTopicFilter && (
                <div className="absolute right-0 mt-1 w-48 max-h-64 overflow-y-auto bg-white dark:bg-[#18181b] rounded-lg shadow-lg border border-slate-100 dark:border-[#334155] py-1 z-50">
                  <button
                    onClick={() => { setFilterTopic(null); setShowTopicFilter(false) }}
                    className={`w-full flex items-center px-2.5 py-1.5 text-[10px] hover:bg-slate-50 dark:hover:bg-[#334155]/30 ${
                      !filterTopic ? 'text-slate-700 dark:text-white font-medium' : 'text-slate-500 dark:text-[#94a3b8]'
                    }`}
                  >
                    All Topics ({clusters.length})
                  </button>
                  <div className="h-px bg-slate-100 dark:bg-[#334155] my-1" />
                  {topicNames.map((topic) => {
                    const cluster = clusters.find(c => c.topic === topic)
                    return (
                      <button
                        key={topic}
                        onClick={() => { setFilterTopic(topic); setShowTopicFilter(false) }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] hover:bg-slate-50 dark:hover:bg-[#334155]/30 ${
                          filterTopic === topic ? 'text-slate-700 dark:text-white font-medium' : 'text-slate-500 dark:text-[#94a3b8]'
                        }`}
                      >
                        <span className="truncate">{topic}</span>
                        <span className="text-slate-400 dark:text-[#64748b] ml-2">{cluster?.queries.length || 0}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Sort */}
            <div className="relative">
              <button
                onClick={() => { setShowFilters(!showFilters); setShowTopicFilter(false) }}
                className="flex items-center gap-1 px-2 py-1.5 bg-slate-100 dark:bg-[#334155]/50 rounded text-[9px] font-medium tracking-wider uppercase text-slate-500 dark:text-[#94a3b8] hover:bg-slate-200 dark:hover:bg-[#334155] transition-all"
              >
                {sortBy}
                <span className={`text-[8px] transition-transform inline-block ${showFilters ? 'rotate-180' : ''}`}>▾</span>
              </button>

              {showFilters && (
                <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-[#18181b] rounded-lg shadow-lg border border-slate-100 dark:border-[#334155] py-1 z-50">
                  {(['recent', 'queries', 'cost', 'name'] as SortBy[]).map((sort) => (
                    <button
                      key={sort}
                      onClick={() => {
                        if (sortBy === sort) { setSortAsc(!sortAsc) } else { setSortBy(sort); setSortAsc(false) }
                        setShowFilters(false)
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
                : `${totalQueries} queries`
              }
            </span>
            <span>
              {filterTopic
                ? `1/${clusters.length} topics`
                : `${clusters.length} topics`
              }
            </span>
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
              <span className="text-[9px] tracking-wider uppercase text-slate-500 dark:text-[#94a3b8] font-medium">TODAY</span>
              <span className="text-[10px] text-slate-600 dark:text-[#94a3b8]">{dailySummary.count} queries</span>
              <span className="text-[10px] text-slate-400 dark:text-[#64748b]">{dailySummary.tokens.toLocaleString()} tok</span>
              <span className="text-[10px] text-slate-400 dark:text-[#64748b]">${dailySummary.cost.toFixed(4)}</span>
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
              {'┌─────────────┐'}<br />
              {'│             │'}<br />
              {'│   ○  ○  ○   │'}<br />
              {'│             │'}<br />
              {'│  ─────────  │'}<br />
              {'│  ─────────  │'}<br />
              {'│  ────────   │'}<br />
              {'│             │'}<br />
              {'└─────────────┘'}
            </div>
            <p className="text-[10px] tracking-wider uppercase text-slate-400 dark:text-[#64748b] mb-1">
              {searchQuery ? 'No matching queries' : 'No conversations yet'}
            </p>
            <p className="text-[9px] text-slate-300 dark:text-[#334155]">
              {searchQuery ? 'Try a different search term' : 'Start a conversation to see your history here'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          expandedCluster ? (() => {
            const cluster = filteredClusters.find(c => c.topic === expandedCluster)
            if (!cluster) { setExpandedCluster(null); return null }
            return (
              <div className="bg-white dark:bg-[#18181b]/50 rounded-lg border border-slate-200 dark:border-[#334155] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-[#334155] bg-slate-50/50 dark:bg-[#334155]/10">
                  <div className="flex items-center gap-3">
                    <h2 className="text-[11px] font-semibold text-slate-700 dark:text-white">{cluster.topic}</h2>
                    <span className="text-[9px] text-slate-400 dark:text-[#64748b]">{cluster.queries.length} conversations</span>
                    <span className="text-[9px] text-slate-400 dark:text-[#64748b]">{cluster.totalTokens.toLocaleString()} tok</span>
                    <span className="text-[9px] text-slate-400 dark:text-[#64748b]">${cluster.totalCost.toFixed(4)}</span>
                  </div>
                  <button
                    onClick={() => setExpandedCluster(null)}
                    className="px-2 py-0.5 text-[9px] font-medium text-slate-500 dark:text-[#94a3b8] hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#334155]/30 rounded transition-colors"
                  >
                    ✕ close
                  </button>
                </div>
                <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
                  {cluster.queries.map((query) => (
                    <div
                      key={query.id}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); handleQueryClick(e, query) }}
                      onContextMenu={(e) => handleQueryContextMenu(e, query)}
                      onKeyDown={(e) => e.key === 'Enter' && handleQueryClick(e as any, query)}
                      onMouseEnter={(e) => handleQueryMouseEnter(e, query)}
                      onMouseLeave={handleQueryMouseLeave}
                      className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 dark:border-[#334155] last:border-0 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-[#334155]/20"
                    >
                      <div
                        className="w-0.5 h-8 rounded-full flex-shrink-0"
                        style={{ backgroundColor: METHODOLOGY_COLORS[query.flow] || '#8B5CF6' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-slate-700 dark:text-[#94a3b8] line-clamp-2">{query.query}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className="px-1 py-0.5 rounded text-[7px] font-semibold uppercase tracking-wider text-white"
                            style={{ backgroundColor: METHODOLOGY_COLORS[query.flow] || '#8B5CF6' }}
                          >{query.flow}</span>
                          <span className="text-[8px] text-slate-400 dark:text-[#64748b]">{formatDate(query.created_at)} {formatTime(query.created_at)}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-[9px] text-slate-500 dark:text-[#94a3b8]">{(query.tokens_used || 0).toLocaleString()} tok</div>
                        <div className="text-[8px] text-slate-400 dark:text-[#64748b]">${(query.cost || 0).toFixed(4)}</div>
                      </div>
                      <span className="text-[10px] text-slate-300 dark:text-[#64748b]">→</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })() : (
          <>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {filteredClusters.map((cluster) => (
                <div
                  key={cluster.topic}
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpandedCluster(cluster.topic)}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    const firstQ = cluster.queries[0]
                    if (firstQ) setClickedQuery({ query: firstQ, x: e.clientX, y: e.clientY })
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && setExpandedCluster(cluster.topic)}
                  onMouseEnter={(e) => handleClusterHover(e, cluster)}
                  onMouseLeave={handleClusterHoverLeave}
                  className={`group relative bg-white dark:bg-[#18181b]/50 rounded-lg border transition-all duration-200 text-left overflow-hidden cursor-pointer ${
                    'border-slate-200 dark:border-[#334155] hover:border-slate-300 dark:hover:border-[#64748b] hover:shadow-sm'
                  }`}
                >
                  {/* Preview area */}
                  <div className="aspect-[4/3] bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-[#334155]/20 dark:to-[#334155]/10 flex items-center justify-center p-2 relative overflow-hidden">
                    <div className="relative w-full h-full">
                      {cluster.queries.slice(0, 3).map((q, i) => (
                        <div
                          key={q.id}
                          className="absolute bg-white dark:bg-[#18181b] rounded shadow-sm border border-slate-200/80 dark:border-[#334155] p-1.5"
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
                          <p className="text-[6px] text-slate-500 dark:text-[#64748b] line-clamp-2 pl-1.5 leading-tight">
                            {q.query}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Count badge */}
                    <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-slate-700/80 dark:bg-[#334155]/80 rounded text-[7px] text-white font-medium">
                      {cluster.queries.length}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-2 border-t border-slate-100 dark:border-[#334155]">
                    <h3 className="text-[10px] font-medium text-slate-700 dark:text-white truncate">
                      {cluster.topic}
                    </h3>
                    <div className="flex items-center justify-between text-[8px] text-slate-400 dark:text-[#64748b] mt-0.5">
                      <span>{formatDate(cluster.lastActivity)}</span>
                      <span>${cluster.totalCost.toFixed(4)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
          )
        ) : (
          /* List View */
          <div className="space-y-1">
            {filteredClusters.map((cluster) => (
              <div
                key={cluster.topic}
                className="bg-white dark:bg-[#18181b]/50 rounded-lg border border-slate-200 dark:border-[#334155] overflow-hidden hover:border-slate-300 dark:hover:border-[#64748b] transition-all"
              >
                <button
                  onClick={() => setSelectedTopic(selectedTopic === cluster.topic ? null : cluster.topic)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-[#334155]/20 transition-colors"
                >
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold text-white"
                    style={{ backgroundColor: METHODOLOGY_COLORS[cluster.queries[0]?.flow] || '#8B5CF6' }}
                  >
                    {cluster.queries.length}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-[10px] font-medium text-slate-700 dark:text-white">{cluster.topic}</h3>
                    <p className="text-[9px] text-slate-400 dark:text-[#64748b] truncate">
                      {formatDate(cluster.lastActivity)}
                    </p>
                  </div>

                  <div className="text-right text-[9px] text-slate-400 dark:text-[#64748b]">
                    <div>{cluster.totalTokens.toLocaleString()} tok</div>
                    <div>${cluster.totalCost.toFixed(4)}</div>
                  </div>

                  <span className={`text-[10px] text-slate-400 dark:text-[#64748b] transition-transform inline-block ${selectedTopic === cluster.topic ? 'rotate-180' : ''}`}>▾</span>
                </button>

                {/* Expanded queries */}
                {selectedTopic === cluster.topic && (
                  <div className="border-t border-slate-100 dark:border-[#334155] bg-slate-50/50 dark:bg-[#334155]/10">
                    {cluster.queries.map((query) => (
                      <div
                        key={query.id}
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); handleQueryClick(e, query) }}
                        onContextMenu={(e) => handleQueryContextMenu(e, query)}
                        onKeyDown={(e) => e.key === 'Enter' && handleQueryClick(e as any, query)}
                        onMouseEnter={(e) => handleQueryMouseEnter(e, query)}
                        onMouseLeave={handleQueryMouseLeave}
                        className={`flex items-center gap-2 px-3 py-2 border-b border-slate-100 dark:border-[#334155] last:border-0 cursor-pointer transition-colors ${
                          'hover:bg-white dark:hover:bg-[#334155]/20'
                        }`}
                      >
                        <div
                          className="w-0.5 h-5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: METHODOLOGY_COLORS[query.flow] || '#8B5CF6' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-slate-600 dark:text-[#94a3b8] truncate">{query.query}</p>
                          <p className="text-[8px] text-slate-400 dark:text-[#64748b] flex items-center gap-1.5 mt-0.5">
                            <span>{formatTime(query.created_at)}</span>
                            <span className="uppercase tracking-wider">{query.flow}</span>
                          </p>
                        </div>
                        <span className="text-[8px] text-slate-400 dark:text-[#64748b]">${(query.cost || 0).toFixed(4)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Hover tooltip — portal to escape overflow:hidden */}
      {hoveredQuery && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            left: Math.min(hoveredQuery.x + 12, window.innerWidth - 320),
            top: Math.max(hoveredQuery.y - 80, 10),
            zIndex: 9999,
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '10px 14px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            maxWidth: 300,
            pointerEvents: 'none' as const,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <p style={{ fontSize: 11, color: '#1e293b', lineHeight: 1.5, marginBottom: 6 }}>
            {hoveredQuery.query.query.slice(0, 150)}{hoveredQuery.query.query.length > 150 ? '...' : ''}
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 9, color: '#94a3b8' }}>
            <span style={{
              padding: '1px 5px', borderRadius: 3,
              background: (METHODOLOGY_COLORS[hoveredQuery.query.flow] || '#8b5cf6') + '18',
              color: METHODOLOGY_COLORS[hoveredQuery.query.flow] || '#8b5cf6',
              fontWeight: 600, textTransform: 'uppercase' as const, fontSize: 8,
            }}>{hoveredQuery.query.flow}</span>
            <span>{(hoveredQuery.query.tokens_used || 0).toLocaleString()} tok</span>
            <span>${(hoveredQuery.query.cost || 0).toFixed(4)}</span>
          </div>
        </div>,
        document.body
      )}

      {/* Cluster insight tooltip — portal */}
      {clusterInsight && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            left: Math.min(clusterInsight.x + 12, window.innerWidth - 300),
            top: Math.max(clusterInsight.y - 100, 10),
            zIndex: 9999,
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '10px 14px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            maxWidth: 280,
            pointerEvents: 'none' as const,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#1e293b' }}>{clusterInsight.topic}</span>
          </div>
          <p style={{ fontSize: 9, color: '#64748b', lineHeight: 1.5 }}>
            {clusterInsight.text}
          </p>
        </div>,
        document.body
      )}

      {/* Click popup — portal to escape overflow:hidden */}
      {clickedQuery && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            left: clickedQuery.x - 90,
            top: clickedQuery.y - 20,
            zIndex: 9999,
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '6px 8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            display: 'flex',
            gap: 6,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <button
            onClick={() => { onContinueToChat?.(clickedQuery.query.query); setClickedQuery(null) }}
            style={{ fontSize: 9, padding: '5px 12px', border: '1px solid #e2e8f0', borderRadius: 5, background: 'white', cursor: 'pointer', color: '#64748b', fontFamily: 'inherit' }}
          >◇ analyse</button>
          <button
            onClick={() => { window.location.href = `/?q=${encodeURIComponent(clickedQuery.query.query)}&ref=${clickedQuery.query.id}` }}
            style={{ fontSize: 9, padding: '5px 12px', border: 'none', borderRadius: 5, background: '#1e293b', cursor: 'pointer', color: 'white', fontFamily: 'inherit' }}
          >→ continue</button>
        </div>,
        document.body
      )}
    </div>
  )
}
