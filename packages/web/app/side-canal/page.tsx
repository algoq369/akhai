'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  MapPinIcon,
  LinkIcon,
  SparklesIcon,
  ChartBarIcon,
  ClockIcon,
  ArrowPathIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline'
import { MapPinIcon as MapPinIconSolid } from '@heroicons/react/24/solid'

interface Topic {
  id: string
  name: string
  description: string | null
  category: string | null
  created_at: number
  updated_at: number
  query_count?: number
  color?: string
  pinned?: boolean
  ai_instructions?: string | null
}

interface TopicRelationship {
  from_id: string
  from_name: string
  to_id: string
  to_name: string
  type: string
  strength: number
}

interface TopicStats {
  total_topics: number
  total_connections: number
  categories: Record<string, number>
  recent_activity: number
}

export default function SideCanalPage() {
  const router = useRouter()
  const [topics, setTopics] = useState<Topic[]>([])
  const [allTopics, setAllTopics] = useState<Topic[]>([])
  const [relationships, setRelationships] = useState<TopicRelationship[]>([])
  const [stats, setStats] = useState<TopicStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Filters and search
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [filterPinned, setFilterPinned] = useState(false)
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'queries'>('recent')

  // Selected topic
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchQuery, filterCategory, filterPinned, sortBy, allTopics])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch topics
      const topicsRes = await fetch('/api/side-canal/topics')
      if (topicsRes.ok) {
        const topicsData = await topicsRes.json()
        setAllTopics(topicsData.topics || [])
      }

      // Fetch relationships
      const relsRes = await fetch('/api/side-canal/relationships')
      if (relsRes.ok) {
        const relsData = await relsRes.json()
        setRelationships(relsData.relationships || [])
      }

      // Calculate stats
      calculateStats(topicsData.topics || [], relsData.relationships || [])
    } catch (error) {
      console.error('Failed to fetch Side Canal data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (topics: Topic[], rels: TopicRelationship[]) => {
    const categories: Record<string, number> = {}
    topics.forEach(t => {
      const cat = t.category || 'other'
      categories[cat] = (categories[cat] || 0) + 1
    })

    const recentActivity = topics.filter(t => {
      const dayAgo = Date.now() / 1000 - 86400
      return t.updated_at > dayAgo
    }).length

    setStats({
      total_topics: topics.length,
      total_connections: rels.length,
      categories,
      recent_activity: recentActivity
    })
  }

  const applyFilters = () => {
    let filtered = [...allTopics]

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(query) ||
        (t.description?.toLowerCase().includes(query))
      )
    }

    // Category filter
    if (filterCategory) {
      filtered = filtered.filter(t => t.category === filterCategory)
    }

    // Pinned filter
    if (filterPinned) {
      filtered = filtered.filter(t => t.pinned)
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      } else if (sortBy === 'queries') {
        return (b.query_count || 0) - (a.query_count || 0)
      } else {
        return b.updated_at - a.updated_at
      }
    })

    setTopics(filtered)
  }

  const togglePin = async (topicId: string) => {
    const topic = allTopics.find(t => t.id === topicId)
    if (!topic) return

    try {
      const res = await fetch(`/api/mindmap/topics/${topicId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned: !topic.pinned })
      })

      if (res.ok) {
        const updated = allTopics.map(t =>
          t.id === topicId ? { ...t, pinned: !t.pinned } : t
        )
        setAllTopics(updated)
      }
    } catch (error) {
      console.error('Failed to toggle pin:', error)
    }
  }

  const categories = Array.from(new Set(allTopics.map(t => t.category).filter(Boolean))) as string[]

  const getCategoryColor = (category: string | null): string => {
    const colors: Record<string, string> = {
      'technology': 'bg-blue-100 text-blue-700 border-blue-200',
      'business': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'research': 'bg-violet-100 text-violet-700 border-violet-200',
      'personal': 'bg-amber-100 text-amber-700 border-amber-200',
      'science': 'bg-cyan-100 text-cyan-700 border-cyan-200',
      'finance': 'bg-green-100 text-green-700 border-green-200',
      'health': 'bg-pink-100 text-pink-700 border-pink-200',
      'education': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    }
    return colors[category?.toLowerCase() || 'other'] || 'bg-relic-ghost text-relic-slate border-relic-mist'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-relic-white via-relic-ghost/30 to-relic-ghost/60 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-relic-mist border-t-relic-slate rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-relic-silver">Loading Side Canal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-relic-white via-relic-ghost/30 to-relic-ghost/60">
      {/* Header */}
      <div className="bg-white border-b border-relic-mist">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-mono text-relic-void mb-2">Side Canal</h1>
              <p className="text-sm text-relic-silver max-w-2xl">
                Autonomous context intelligence system tracking topics, relationships, and insights across your conversations
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-relic-slate text-white text-sm rounded hover:bg-relic-void transition-colors"
            >
              Back to Chat
            </button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="bg-relic-ghost/50 border border-relic-mist rounded p-4">
                <div className="flex items-center gap-2 text-relic-silver text-xs uppercase tracking-wider mb-2">
                  <SparklesIcon className="w-4 h-4" />
                  <span>Topics</span>
                </div>
                <div className="text-2xl font-mono text-relic-void">{stats.total_topics}</div>
              </div>
              <div className="bg-relic-ghost/50 border border-relic-mist rounded p-4">
                <div className="flex items-center gap-2 text-relic-silver text-xs uppercase tracking-wider mb-2">
                  <LinkIcon className="w-4 h-4" />
                  <span>Connections</span>
                </div>
                <div className="text-2xl font-mono text-relic-void">{stats.total_connections}</div>
              </div>
              <div className="bg-relic-ghost/50 border border-relic-mist rounded p-4">
                <div className="flex items-center gap-2 text-relic-silver text-xs uppercase tracking-wider mb-2">
                  <FunnelIcon className="w-4 h-4" />
                  <span>Categories</span>
                </div>
                <div className="text-2xl font-mono text-relic-void">{Object.keys(stats.categories).length}</div>
              </div>
              <div className="bg-relic-ghost/50 border border-relic-mist rounded p-4">
                <div className="flex items-center gap-2 text-relic-silver text-xs uppercase tracking-wider mb-2">
                  <ClockIcon className="w-4 h-4" />
                  <span>Active 24h</span>
                </div>
                <div className="text-2xl font-mono text-relic-void">{stats.recent_activity}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-relic-mist">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="flex-1 max-w-md relative">
              <MagnifyingGlassIcon className="w-4 h-4 text-relic-silver absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-relic-ghost border border-relic-mist rounded text-sm text-relic-void placeholder-relic-silver focus:outline-none focus:border-relic-slate transition-colors"
              />
            </div>

            {/* Filters */}
            <button
              onClick={() => setFilterPinned(!filterPinned)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-all ${
                filterPinned
                  ? 'bg-relic-slate text-white'
                  : 'bg-relic-ghost border border-relic-mist text-relic-slate hover:bg-white'
              }`}
            >
              {filterPinned ? <MapPinIconSolid className="w-3.5 h-3.5" /> : <MapPinIcon className="w-3.5 h-3.5" />}
              <span>Pinned</span>
            </button>

            {categories.length > 0 && (
              <select
                value={filterCategory || ''}
                onChange={(e) => setFilterCategory(e.target.value || null)}
                className="px-3 py-2 bg-relic-ghost border border-relic-mist rounded text-xs text-relic-slate cursor-pointer focus:outline-none focus:border-relic-slate transition-colors"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-relic-ghost border border-relic-mist rounded text-xs text-relic-slate cursor-pointer focus:outline-none focus:border-relic-slate transition-colors"
            >
              <option value="recent">Most Recent</option>
              <option value="name">Name (A-Z)</option>
              <option value="queries">Most Queries</option>
            </select>

            <button
              onClick={fetchData}
              className="flex items-center gap-1.5 px-3 py-2 bg-relic-ghost border border-relic-mist rounded text-xs text-relic-slate hover:bg-white transition-colors"
            >
              <ArrowPathIcon className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {topics.length === 0 ? (
          <div className="text-center py-16">
            <SparklesIcon className="w-16 h-16 text-relic-mist mx-auto mb-4" />
            <h3 className="text-lg text-relic-slate mb-2">No topics found</h3>
            <p className="text-sm text-relic-silver">
              {allTopics.length === 0
                ? 'Start conversations to build your knowledge graph'
                : 'Try adjusting your filters or search query'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.map((topic) => (
              <div
                key={topic.id}
                className="bg-white border border-relic-mist rounded-lg p-5 hover:shadow-lg transition-all group cursor-pointer"
                onClick={() => setSelectedTopic(topic)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-relic-void mb-2 group-hover:text-relic-slate transition-colors">
                      {topic.name}
                    </h3>
                    {topic.category && (
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${getCategoryColor(topic.category)}`}>
                        {topic.category}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      togglePin(topic.id)
                    }}
                    className="p-1 hover:bg-relic-ghost rounded transition-colors"
                  >
                    {topic.pinned ? (
                      <MapPinIconSolid className="w-4 h-4 text-relic-slate" />
                    ) : (
                      <MapPinIcon className="w-4 h-4 text-relic-silver" />
                    )}
                  </button>
                </div>

                {topic.description && (
                  <p className="text-xs text-relic-silver mb-3 line-clamp-2">{topic.description}</p>
                )}

                <div className="flex items-center gap-4 text-[10px] text-relic-silver">
                  <span className="flex items-center gap-1">
                    <ChartBarIcon className="w-3 h-3" />
                    {topic.query_count || 0} queries
                  </span>
                  <span className="flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" />
                    {new Date(topic.updated_at * 1000).toLocaleDateString()}
                  </span>
                </div>

                {topic.ai_instructions && (
                  <div className="mt-3 pt-3 border-t border-relic-mist/50">
                    <div className="flex items-center gap-1 text-[9px] text-relic-silver uppercase tracking-wider mb-1">
                      <LightBulbIcon className="w-3 h-3" />
                      <span>AI Instructions</span>
                    </div>
                    <p className="text-[10px] text-relic-slate line-clamp-2">{topic.ai_instructions}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
