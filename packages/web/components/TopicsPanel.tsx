'use client'

import { useState, useEffect } from 'react'

interface Topic {
  id: string
  name: string
  description: string | null
  category: string | null
  created_at: number
  query_count?: number
}

interface TopicsPanelProps {
  isOpen: boolean
  onClose: () => void
}

const CATEGORY_COLORS: Record<string, string> = {
  technology: 'bg-blue-100 text-blue-700',
  finance: 'bg-green-100 text-green-700',
  science: 'bg-purple-100 text-purple-700',
  business: 'bg-yellow-100 text-yellow-700',
  health: 'bg-red-100 text-red-700',
  education: 'bg-indigo-100 text-indigo-700',
  other: 'bg-gray-100 text-gray-600',
}

export default function TopicsPanel({ isOpen, onClose }: TopicsPanelProps) {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchTopics()
    }
  }, [isOpen])

  const fetchTopics = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/side-canal/topics')
      if (res.ok) {
        const data = await res.json()
        setTopics(data.topics || [])
      }
    } catch (error) {
      console.error('Failed to fetch topics:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTopics = filter
    ? topics.filter(t => t.category === filter)
    : topics

  const categories = [...new Set(topics.map(t => t.category || 'other'))]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-relic-white border border-relic-mist rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-relic-mist">
          <div>
            <h2 className="text-lg font-medium text-relic-slate">Your Topics</h2>
            <p className="text-xs text-relic-silver">Topics extracted from your conversations</p>
          </div>
          <button
            onClick={onClose}
            className="text-relic-silver hover:text-relic-slate transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Filters */}
        {categories.length > 1 && (
          <div className="flex gap-2 p-4 border-b border-relic-mist overflow-x-auto">
            <button
              onClick={() => setFilter(null)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                filter === null
                  ? 'bg-relic-slate text-white'
                  : 'bg-relic-ghost text-relic-silver hover:text-relic-slate'
              }`}
            >
              All ({topics.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  filter === cat
                    ? 'bg-relic-slate text-white'
                    : 'bg-relic-ghost text-relic-silver hover:text-relic-slate'
                }`}
              >
                {cat} ({topics.filter(t => (t.category || 'other') === cat).length})
              </button>
            ))}
          </div>
        )}

        {/* Topics List */}
        <div className="p-4 overflow-y-auto max-h-[50vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-relic-mist border-t-relic-slate rounded-full animate-spin" />
            </div>
          ) : filteredTopics.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-relic-silver text-sm">No topics yet</p>
              <p className="text-relic-silver/60 text-xs mt-1">
                Topics will be extracted from your conversations
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredTopics.map(topic => (
                <div
                  key={topic.id}
                  className="p-3 bg-relic-ghost/30 border border-relic-mist/50 rounded-lg hover:border-relic-slate/20 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-relic-slate">
                          {topic.name}
                        </h3>
                        <span className={`px-2 py-0.5 text-[10px] rounded-full ${
                          CATEGORY_COLORS[topic.category || 'other']
                        }`}>
                          {topic.category || 'other'}
                        </span>
                      </div>
                      {topic.description && (
                        <p className="text-xs text-relic-silver mt-1">
                          {topic.description}
                        </p>
                      )}
                    </div>
                    {topic.query_count !== undefined && topic.query_count > 0 && (
                      <span className="text-[10px] text-relic-silver">
                        {topic.query_count} queries
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-relic-mist bg-relic-ghost/20">
          <p className="text-[10px] text-relic-silver text-center">
            Topics help AkhAI remember context across conversations
          </p>
        </div>
      </div>
    </div>
  )
}

