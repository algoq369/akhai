'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Squares2X2Icon, 
  ListBulletIcon, 
  FunnelIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  CalendarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  FolderIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline'

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
}

export default function MindMapHistoryView({ onClose, onTopicExpand }: MindMapHistoryViewProps) {
  const router = useRouter()
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

    // Pattern 1: Extract quoted topic - "about 'Topic'" or 'about "Topic"'
    const quotedMatch = text.match(/about\s+[\"']([^\"']+)[\"']/i)
    if (quotedMatch && quotedMatch[1].length > 2) {
      return quotedMatch[1].trim()
    }

    // Pattern 2: Extract topic after "about" (at end of sentence)
    const aboutMatch = text.match(/about\s+(.+?)(?:\?|\.|\!|$)/i)
    if (aboutMatch && aboutMatch[1].length > 3) {
      // Clean up the extracted topic
      let topic = aboutMatch[1].trim()
      // Remove trailing common words
      topic = topic.replace(/\s+(please|thanks|thank you|now|today|quickly|briefly)$/i, '')
      if (topic.length > 3) return topic
    }

    // Pattern 3: "What is/are X", "Explain X", "Define X", "Tell me about X"
    const whatIsMatch = text.match(/(?:what\s+(?:is|are)|explain|define|describe|tell\s+me\s+about)\s+(.+?)(?:\?|\.|\!|$)/i)
    if (whatIsMatch && whatIsMatch[1].length > 2) {
      let topic = whatIsMatch[1].trim()
      // Remove articles at start
      topic = topic.replace(/^(?:the|a|an)\s+/i, '')
      if (topic.length > 2) return topic
    }

    // Pattern 4: "How does X work", "How to X"
    const howMatch = text.match(/how\s+(?:does|do|can|to)\s+(.+?)(?:\?|\.|\!|$)/i)
    if (howMatch && howMatch[1].length > 3) {
      return howMatch[1].trim()
    }

    // Pattern 5: Fall back to extracting meaningful content words
    // Skip common command/question prefixes
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

    // Take up to 4 meaningful words
    if (words.length > 0) {
      return words.slice(0, 4).join(' ')
    }

    return 'General'
  }

  // Normalize topic for grouping (handles slight variations)
  const normalizeTopic = (topic: string): string => {
    return topic
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 50) // Limit length for grouping
  }

  // Cluster queries by topic
  const clusters = useMemo((): TopicCluster[] => {
    if (filteredBySearch.length === 0) return []

    const clusterMap = new Map<string, { display: string, queries: QueryHistoryItem[] }>()

    filteredBySearch.forEach((query) => {
      const rawTopic = extractTopic(query.query)
      const normalizedKey = normalizeTopic(rawTopic)

      // Capitalize first letter of each word for display
      const displayTopic = rawTopic
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ')
        .slice(0, 60) // Limit display length

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

    // Filter out oversized clusters (likely catch-all buckets with poor topic extraction)
    // Topics with more than 50 queries are excluded as they're too generic
    const MAX_CLUSTER_SIZE = 50
    const result = allClusters.filter(cluster => cluster.queries.length <= MAX_CLUSTER_SIZE)

    // Sort clusters
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

  // Get unique topic names for filter dropdown
  const topicNames = useMemo(() => {
    return clusters.map(c => c.topic).sort()
  }, [clusters])

  // Filter clusters by selected topic
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
    if (diffDays < 7) return `${diffDays} days ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp * 1000)
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const handleQueryClick = (queryId: string) => {
    // Close the MindMap modal first
    if (onClose) {
      onClose()
    }
    // Then navigate to continue the conversation
    router.push(`/?continue=${queryId}`)
  }

  // Stats
  const totalQueries = filteredBySearch.length
  const totalCost = filteredBySearch.reduce((sum, q) => sum + (q.cost || 0), 0)
  const totalTokens = filteredBySearch.reduce((sum, q) => sum + (q.tokens_used || 0), 0)

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-white dark:from-relic-void dark:to-relic-void/90 overflow-hidden">
      {/* Toolbar with view mode toggle */}
      <div className="flex-none bg-white/60 dark:bg-relic-void/60 backdrop-blur-md border-b border-slate-100 dark:border-relic-slate/30">
        <div className="px-6 py-2">
          <div className="flex items-center justify-between gap-3 mb-2">
            {/* View mode toggle - moved to top */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-relic-slate/20 rounded-md p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-relic-slate shadow-sm text-slate-700 dark:text-white' : 'text-slate-400 dark:text-relic-ghost hover:text-slate-600 dark:hover:text-white'}`}
              >
                <Squares2X2Icon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-white dark:bg-relic-slate shadow-sm text-slate-700 dark:text-white' : 'text-slate-400 dark:text-relic-ghost hover:text-slate-600 dark:hover:text-white'}`}
              >
                <ListBulletIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-relic-ghost" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-relic-slate/20 border-0 rounded-md text-xs text-slate-600 dark:text-white placeholder:text-slate-400 dark:placeholder:text-relic-silver focus:outline-none focus:ring-1 focus:ring-blue-500/30 dark:focus:ring-relic-ghost/30"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              {/* Time filter */}
              <div className="flex items-center bg-slate-100 dark:bg-relic-slate/20 rounded-md p-0.5">
                {(['all', 'today', 'week', 'month'] as TimeFilter[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTimeFilter(filter)}
                    className={`px-2 py-1 text-[9px] font-medium rounded transition-all capitalize ${
                      timeFilter === filter
                        ? 'bg-white dark:bg-relic-slate shadow-sm text-slate-700 dark:text-white'
                        : 'text-slate-400 dark:text-relic-ghost hover:text-slate-600 dark:hover:text-white'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Topic filter dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowTopicFilter(!showTopicFilter)}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[9px] font-medium transition-all ${
                    filterTopic
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'bg-slate-100 dark:bg-relic-slate/20 text-slate-500 dark:text-relic-ghost hover:bg-slate-200 dark:hover:bg-relic-slate/30'
                  }`}
                >
                  <FolderIcon className="w-3 h-3" />
                  {filterTopic || 'All Topics'}
                  <ChevronDownIcon className={`w-2.5 h-2.5 transition-transform ${showTopicFilter ? 'rotate-180' : ''}`} />
                </button>

                {showTopicFilter && (
                  <div className="absolute right-0 mt-1 w-48 max-h-64 overflow-y-auto bg-white dark:bg-relic-void rounded-lg shadow-lg border border-slate-100 dark:border-relic-slate/30 py-1 z-50">
                    <button
                      onClick={() => {
                        setFilterTopic(null)
                        setShowTopicFilter(false)
                      }}
                      className={`w-full flex items-center px-2.5 py-1.5 text-[10px] hover:bg-slate-50 dark:hover:bg-relic-slate/20 ${
                        !filterTopic ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-600 dark:text-relic-ghost'
                      }`}
                    >
                      All Topics ({clusters.length})
                    </button>
                    <div className="h-px bg-slate-100 dark:bg-relic-slate/30 my-1" />
                    {topicNames.map((topic) => {
                      const cluster = clusters.find(c => c.topic === topic)
                      return (
                        <button
                          key={topic}
                          onClick={() => {
                            setFilterTopic(topic)
                            setShowTopicFilter(false)
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] hover:bg-slate-50 dark:hover:bg-relic-slate/20 ${
                            filterTopic === topic ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-600 dark:text-relic-ghost'
                          }`}
                        >
                          <span className="truncate">{topic}</span>
                          <span className="text-slate-400 dark:text-relic-silver ml-2">{cluster?.queries.length || 0}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Sort dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-100 dark:bg-relic-slate/20 rounded-md text-[9px] font-medium text-slate-500 dark:text-relic-ghost hover:bg-slate-200 dark:hover:bg-relic-slate/30 transition-all"
                >
                  <FunnelIcon className="w-3 h-3" />
                  {sortBy}
                  <ChevronDownIcon className={`w-2.5 h-2.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>

                {showFilters && (
                  <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-relic-void rounded-lg shadow-lg border border-slate-100 dark:border-relic-slate/30 py-1 z-50">
                    {(['recent', 'queries', 'cost', 'name'] as SortBy[]).map((sort) => (
                      <button
                        key={sort}
                        onClick={() => {
                          if (sortBy === sort) {
                            setSortAsc(!sortAsc)
                          } else {
                            setSortBy(sort)
                            setSortAsc(false)
                          }
                          setShowFilters(false)
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] text-slate-600 dark:text-relic-ghost hover:bg-slate-50 dark:hover:bg-relic-slate/20"
                      >
                        <span className="capitalize">{sort}</span>
                        {sortBy === sort && (sortAsc ? <ArrowUpIcon className="w-2.5 h-2.5" /> : <ArrowDownIcon className="w-2.5 h-2.5" />)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-4 mt-2 text-[9px] text-slate-400 dark:text-relic-ghost">
            <span className="flex items-center gap-1">
              <DocumentTextIcon className="w-3 h-3" />
              {filterTopic
                ? `${filteredClusters.reduce((sum, c) => sum + c.queries.length, 0)} conversations`
                : `${totalQueries} conversations`
              }
            </span>
            <span className="flex items-center gap-1">
              <FolderIcon className="w-3 h-3" />
              {filterTopic
                ? `1 of ${clusters.length} topics`
                : `${clusters.length} topics`
              }
            </span>
            <span className="flex items-center gap-1">
              <CurrencyDollarIcon className="w-3 h-3" />
              ${totalCost.toFixed(4)}
            </span>
          </div>
        </div>
      </div>

      {/* Main content - scrollable */}
      <main className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 border-slate-200 dark:border-relic-slate border-t-slate-500 dark:border-t-relic-ghost rounded-full animate-spin" />
          </div>
        ) : filteredClusters.length === 0 ? (
          <div className="text-center py-16 text-slate-400 dark:text-relic-ghost">
            <DocumentTextIcon className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-xs">No conversations found</p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View - Compact cards */
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredClusters.map((cluster) => (
              <div
                key={cluster.topic}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedTopic(selectedTopic === cluster.topic ? null : cluster.topic)}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedTopic(selectedTopic === cluster.topic ? null : cluster.topic)}
                className={`group relative bg-white dark:bg-relic-void/50 rounded-xl border transition-all duration-200 text-left overflow-hidden cursor-pointer ${
                  selectedTopic === cluster.topic
                    ? 'border-blue-400 dark:border-blue-500 shadow-md scale-[1.02]'
                    : 'border-slate-200 dark:border-relic-slate/30 hover:border-slate-300 dark:hover:border-relic-ghost hover:shadow-sm'
                }`}
              >
                {/* Preview area */}
                <div className="aspect-[4/3] bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-relic-slate/20 dark:to-relic-slate/10 flex items-center justify-center p-3 relative overflow-hidden">
                  {/* Document stack */}
                  <div className="relative w-full h-full">
                    {cluster.queries.slice(0, 3).map((q, i) => (
                      <div
                        key={q.id}
                        className="absolute bg-white dark:bg-relic-void rounded shadow-sm border border-slate-200/80 dark:border-relic-slate/30 p-1.5"
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
                        <p className="text-[6px] text-slate-500 dark:text-relic-ghost line-clamp-2 pl-1.5 leading-tight">
                          {q.query}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Count badge */}
                  <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-slate-700/80 dark:bg-relic-slate/80 rounded text-[7px] text-white font-medium">
                    {cluster.queries.length}
                  </div>
                </div>

                {/* Info */}
                <div className="p-2 border-t border-slate-100 dark:border-relic-slate/30">
                  <h3 className="text-[10px] font-medium text-slate-700 dark:text-white truncate">
                    {cluster.topic}
                  </h3>
                  <div className="flex items-center justify-between text-[8px] text-slate-400 dark:text-relic-ghost mt-0.5">
                    <span>{formatDate(cluster.lastActivity)}</span>
                    <span>${cluster.totalCost.toFixed(4)}</span>
                  </div>
                  {onTopicExpand && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onTopicExpand(cluster.topic)
                      }}
                      className="mt-1.5 w-full py-1 px-2 text-[8px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                    >
                      Explore Topic →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View - Compact */
          <div className="space-y-1.5">
            {filteredClusters.map((cluster) => (
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
                    style={{ backgroundColor: METHODOLOGY_COLORS[cluster.queries[0]?.flow] || '#8B5CF6' }}
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

                  <ChevronDownIcon className={`w-4 h-4 text-slate-400 transition-transform ${selectedTopic === cluster.topic ? 'rotate-180' : ''}`} />
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
        )}

        {/* Expanded topic detail - Grid view */}
        {viewMode === 'grid' && selectedTopic && (
          <div className="fixed inset-0 z-50 bg-black/20 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setSelectedTopic(null)}>
            <div
              className="bg-white dark:bg-relic-void rounded-xl shadow-xl max-w-lg w-full max-h-[70vh] overflow-hidden border border-slate-200 dark:border-relic-slate/30"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const cluster = clusters.find(c => c.topic === selectedTopic)
                if (!cluster) return null

                return (
                  <>
                    <div className="p-4 border-b border-slate-100 dark:border-relic-slate/30">
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-medium text-slate-700 dark:text-white">{cluster.topic}</h2>
                        <button
                          onClick={() => setSelectedTopic(null)}
                          className="text-slate-400 dark:text-relic-ghost hover:text-slate-600 dark:hover:text-white text-sm"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-[9px] text-slate-400 dark:text-relic-ghost mt-0.5">
                        {cluster.queries.length} conversations · ${cluster.totalCost.toFixed(4)}
                      </p>
                    </div>

                    <div className="overflow-y-auto max-h-[55vh]">
                      {cluster.queries.map((query) => (
                        <button
                          key={query.id}
                          onClick={() => handleQueryClick(query.id)}
                          className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-relic-slate/20 transition-colors border-b border-slate-100 dark:border-relic-slate/30 last:border-0"
                        >
                          <div
                            className="w-1 h-8 rounded-full"
                            style={{ backgroundColor: METHODOLOGY_COLORS[query.flow] || '#8B5CF6' }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-600 dark:text-relic-ghost">{query.query}</p>
                            <p className="text-[8px] text-slate-400 dark:text-relic-ghost flex items-center gap-1.5 mt-0.5">
                              <CalendarIcon className="w-2.5 h-2.5" />
                              <span>{formatDate(query.created_at)} {formatTime(query.created_at)}</span>
                              <span className="uppercase font-medium" style={{ color: METHODOLOGY_COLORS[query.flow] }}>{query.flow}</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-[9px] text-slate-500 dark:text-relic-ghost">{(query.tokens_used || 0).toLocaleString()} tok</div>
                            <div className="text-[8px] text-slate-400 dark:text-relic-ghost">${(query.cost || 0).toFixed(4)}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
