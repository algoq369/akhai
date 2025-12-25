'use client'

import { useState, useEffect } from 'react'

interface Topic {
  id: string
  name: string
  description: string | null
  category: string | null
  created_at: number
  query_count?: number
  color?: string
  pinned?: boolean
  ai_instructions?: string
}

interface RelatedQuery {
  id: string
  query: string
  flow: string
  created_at: number
}

interface TopicsPanelProps {
  isOpen: boolean
  onClose: () => void
}

const CATEGORY_COLORS: Record<string, string> = {
  technology: 'bg-relic-ghost text-relic-slate border border-relic-mist',
  finance: 'bg-relic-ghost text-relic-slate border border-relic-mist',
  science: 'bg-relic-ghost text-relic-slate border border-relic-mist',
  business: 'bg-relic-ghost text-relic-slate border border-relic-mist',
  health: 'bg-relic-ghost text-relic-slate border border-relic-mist',
  education: 'bg-relic-ghost text-relic-slate border border-relic-mist',
  other: 'bg-relic-ghost text-relic-slate border border-relic-mist',
}

export default function TopicsPanel({ isOpen, onClose }: TopicsPanelProps) {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<string | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [relatedQueries, setRelatedQueries] = useState<RelatedQuery[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)

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

  const fetchTopicDetail = async (topicId: string) => {
    setLoadingDetail(true)
    try {
      const res = await fetch(`/api/side-canal/topics/${topicId}`)
      if (res.ok) {
        const data = await res.json()
        setRelatedQueries(data.queries || [])
      }
    } catch (error) {
      console.error('Failed to fetch topic detail:', error)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleTopicClick = (topic: Topic) => {
    setSelectedTopic(topic)
    fetchTopicDetail(topic.id)
  }

  const handleBack = () => {
    setSelectedTopic(null)
    setRelatedQueries([])
  }

  const filteredTopics = filter
    ? topics.filter(t => t.category === filter)
    : topics

  const categories = [...new Set(topics.map(t => t.category || 'other'))]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-relic-void/20 backdrop-blur-sm">
      <div className="bg-relic-white border border-relic-mist shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-relic-mist">
          <div className="flex items-center gap-3">
            {selectedTopic && (
              <button
                onClick={handleBack}
                className="text-xs text-relic-silver hover:text-relic-slate transition-colors"
              >
                ← back
              </button>
            )}
            <div>
              <h2 className="text-lg font-medium text-relic-slate">
                {selectedTopic ? selectedTopic.name : 'Your Topics'}
              </h2>
              <p className="text-xs text-relic-silver">
                {selectedTopic 
                  ? `${selectedTopic.category || 'other'} · ${relatedQueries.length} related queries`
                  : 'Topics extracted from your conversations'
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-relic-silver hover:text-relic-slate transition-colors text-lg"
          >
            ×
          </button>
        </div>

        {/* Content */}
        {selectedTopic ? (
          /* Topic Detail View */
          <div className="animate-slide-in">
            {/* Topic Info */}
            <div className="p-4 border-b border-relic-mist bg-relic-ghost/20">
              {selectedTopic.description && (
                <p className="text-sm text-relic-slate mb-3">{selectedTopic.description}</p>
              )}
              <div className="flex items-center gap-4 text-[10px] text-relic-silver">
                <span className={`px-2 py-0.5 ${CATEGORY_COLORS[selectedTopic.category || 'other']}`}>
                  {selectedTopic.category || 'other'}
                </span>
                {selectedTopic.pinned && (
                  <span className="text-relic-slate">📌 Pinned</span>
                )}
                <span>
                  Created {new Date(selectedTopic.created_at * 1000).toLocaleDateString()}
                </span>
              </div>
              {selectedTopic.ai_instructions && (
                <div className="mt-3 p-2 bg-relic-white border border-relic-mist">
                  <span className="text-[9px] uppercase tracking-wider text-relic-silver">AI Instructions</span>
                  <p className="text-xs text-relic-slate mt-1">{selectedTopic.ai_instructions}</p>
                </div>
              )}
            </div>

            {/* Related Queries */}
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              <h3 className="text-xs uppercase tracking-wider text-relic-silver mb-3">Related Conversations</h3>
              {loadingDetail ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-relic-mist border-t-relic-slate rounded-full animate-spin" />
                </div>
              ) : relatedQueries.length === 0 ? (
                <p className="text-sm text-relic-silver text-center py-8">
                  No related conversations found
                </p>
              ) : (
                <div className="space-y-2">
                  {relatedQueries.map((q) => (
                    <a
                      key={q.id}
                      href={`/?continue=${q.id}`}
                      className="block p-3 bg-relic-ghost/30 border border-relic-mist/50 hover:border-relic-slate/30 hover:bg-relic-ghost transition-all"
                    >
                      <p className="text-sm text-relic-slate mb-1 line-clamp-2">{q.query}</p>
                      <div className="flex items-center gap-3 text-[10px] text-relic-silver">
                        <span className="font-mono">{q.flow}</span>
                        <span>·</span>
                        <span>{new Date(q.created_at * 1000).toLocaleDateString()}</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Topics List View */
          <>
            {/* Filters */}
            {categories.length > 1 && (
              <div className="flex gap-2 p-4 border-b border-relic-mist overflow-x-auto">
                <button
                  onClick={() => setFilter(null)}
                  className={`px-3 py-1 text-xs transition-colors ${
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
                    className={`px-3 py-1 text-xs transition-colors ${
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
                    <button
                      key={topic.id}
                      onClick={() => handleTopicClick(topic)}
                      className="p-4 bg-relic-ghost/30 border border-relic-mist/50 hover:border-relic-slate/30 hover:bg-relic-ghost transition-all text-left group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {topic.pinned && <span className="text-sm">📌</span>}
                            <h3 className="text-sm font-medium text-relic-slate group-hover:text-relic-void transition-colors">
                              {topic.name}
                            </h3>
                            <span className={`px-2 py-0.5 text-[10px] ${
                              CATEGORY_COLORS[topic.category || 'other']
                            }`}>
                              {topic.category || 'other'}
                            </span>
                          </div>
                          {topic.description && (
                            <p className="text-xs text-relic-silver mt-1 line-clamp-2">
                              {topic.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {topic.query_count !== undefined && topic.query_count > 0 && (
                            <span className="text-[10px] text-relic-silver">
                              {topic.query_count} queries
                            </span>
                          )}
                          <span className="text-relic-silver group-hover:text-relic-slate transition-colors">
                            →
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

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
