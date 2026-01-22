'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Squares2X2Icon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  FolderIcon,
  ChevronDownIcon
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

export default function HistoryPage() {
  const router = useRouter()
  const [queries, setQueries] = useState<QueryHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortBy>('recent')
  const [sortAsc, setSortAsc] = useState(false)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/history')
      .then(res => res.json())
      .then(data => {
        const queries = data.queries || []
        console.log('[History] API returned:', queries.length, 'conversations')
        setQueries(queries)
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

  // Log filter counts
  useEffect(() => {
    console.log('[History] After time filter:', filteredByTime.length)
    console.log('[History] After search filter:', filteredBySearch.length)
  }, [filteredByTime.length, filteredBySearch.length])

  // Cluster queries by topic
  const clusters = useMemo((): TopicCluster[] => {
    if (filteredBySearch.length === 0) return []

    const clusterMap = new Map<string, QueryHistoryItem[]>()

    filteredBySearch.forEach((query) => {
      const words = query.query
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(' ')
        .filter(w => w.length > 3 && !['what', 'how', 'why', 'when', 'where', 'which', 'that', 'this', 'with', 'from', 'about', 'would', 'could', 'should', 'have', 'been', 'were', 'your', 'them', 'they', 'will', 'more', 'some'].includes(w))
        .slice(0, 2)
        .join(' ')

      const topic = words || 'General'

      if (!clusterMap.has(topic)) {
        clusterMap.set(topic, [])
      }
      clusterMap.get(topic)!.push(query)
    })

    const result = Array.from(clusterMap.entries()).map(([topic, queries]) => ({
      topic: topic.charAt(0).toUpperCase() + topic.slice(1),
      queries: queries.sort((a, b) => b.created_at - a.created_at),
      totalCost: queries.reduce((sum, q) => sum + (q.cost || 0), 0),
      totalTokens: queries.reduce((sum, q) => sum + (q.tokens_used || 0), 0),
      lastActivity: Math.max(...queries.map(q => q.created_at)),
    }))

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
    router.push(`/?continue=${queryId}`)
  }

  // Stats
  const totalQueries = filteredBySearch.length
  const totalCost = filteredBySearch.reduce((sum, q) => sum + (q.cost || 0), 0)
  const totalTokens = filteredBySearch.reduce((sum, q) => sum + (q.tokens_used || 0), 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="/" className="text-[9px] uppercase tracking-[0.3em] text-slate-400 hover:text-slate-600 transition-colors">
                ← akhai
              </a>
              <div className="h-3 w-px bg-slate-200" />
              <h1 className="text-sm font-medium text-slate-700">History</h1>
            </div>
            
            {/* View mode toggle */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-md p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Squares2X2Icon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <ListBulletIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="sticky top-[49px] z-30 bg-white/60 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-2">
          <div className="flex items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-100 border-0 rounded-md text-xs text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              {/* Time filter */}
              <div className="flex items-center bg-slate-100 rounded-md p-0.5">
                {(['all', 'today', 'week', 'month'] as TimeFilter[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTimeFilter(filter)}
                    className={`px-2 py-1 text-[9px] font-medium rounded transition-all capitalize ${
                      timeFilter === filter 
                        ? 'bg-white shadow-sm text-slate-700' 
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
          <div className="flex items-center gap-4 mt-2 text-[9px] text-slate-400">
            <span className="flex items-center gap-1">
              <DocumentTextIcon className="w-3 h-3" />
              {totalQueries} conversations
            </span>
            <span className="flex items-center gap-1">
              <FolderIcon className="w-3 h-3" />
              {clusters.length} topics
            </span>
            <span className="flex items-center gap-1">
              <CurrencyDollarIcon className="w-3 h-3" />
              ${totalCost.toFixed(4)}
            </span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
          </div>
        ) : clusters.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <DocumentTextIcon className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-xs">No conversations found</p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View - Compact cards */
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {clusters.map((cluster) => (
              <button
                key={cluster.topic}
                onClick={() => setSelectedTopic(selectedTopic === cluster.topic ? null : cluster.topic)}
                className={`group relative bg-white rounded-xl border transition-all duration-200 text-left overflow-hidden ${
                  selectedTopic === cluster.topic 
                    ? 'border-blue-400 shadow-md scale-[1.02]' 
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
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
                  <h3 className="text-[10px] font-medium text-slate-700 truncate">
                    {cluster.topic}
                  </h3>
                  <div className="flex items-center justify-between text-[8px] text-slate-400 mt-0.5">
                    <span>{formatDate(cluster.lastActivity)}</span>
                    <span>${cluster.totalCost.toFixed(4)}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* List View - Compact */
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
          <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setSelectedTopic(null)}>
            <div 
              className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[70vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const cluster = clusters.find(c => c.topic === selectedTopic)
                if (!cluster) return null
                
                return (
                  <>
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
                              <span>{formatDate(query.created_at)} {formatTime(query.created_at)}</span>
                              <span className="uppercase font-medium" style={{ color: METHODOLOGY_COLORS[query.flow] }}>{query.flow}</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-[9px] text-slate-500">{(query.tokens_used || 0).toLocaleString()} tok</div>
                            <div className="text-[8px] text-slate-400">${(query.cost || 0).toFixed(4)}</div>
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
