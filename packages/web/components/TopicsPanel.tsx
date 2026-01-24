'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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

interface RelatedTopic {
  id: string
  name: string
  category: string | null
  relevance: number
}

interface TopicsPanelProps {
  isOpen: boolean
  onClose: () => void
  onOpenMindMap?: () => void
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

export default function TopicsPanel({ isOpen, onClose, onOpenMindMap }: TopicsPanelProps) {
  const router = useRouter()
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [relatedQueries, setRelatedQueries] = useState<RelatedQuery[]>([])
  const [relatedTopics, setRelatedTopics] = useState<RelatedTopic[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)
  
  // Tool modes
  const [legendMode, setLegendMode] = useState(false)
  const [auditMode, setAuditMode] = useState(false)
  const [suggestionMode, setSuggestionMode] = useState(true)
  
  // Load legend mode from localStorage
  useEffect(() => {
    try {
      const savedLegendMode = localStorage.getItem('legendMode') === 'true'
      setLegendMode(savedLegendMode)
    } catch (e) {}
  }, [])

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
      
      // Find related topics by category
      const topic = topics.find(t => t.id === topicId)
      if (topic) {
        const related = topics
          .filter(t => t.id !== topicId && t.category === topic.category)
          .slice(0, 5)
          .map(t => ({
            id: t.id,
            name: t.name,
            category: t.category,
            relevance: 0.8
          }))
        setRelatedTopics(related)
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
    setRelatedTopics([])
  }
  
  const handleViewInMindMap = () => {
    if (onOpenMindMap) {
      onClose()
      onOpenMindMap()
    }
  }
  
  const toggleLegendMode = () => {
    const newValue = !legendMode
    setLegendMode(newValue)
    localStorage.setItem('legendMode', newValue ? 'true' : 'false')
  }
  
  const handleContinueWithTopic = (topicName: string) => {
    // Navigate to main chat with topic context
    router.push(`/?topic=${encodeURIComponent(topicName)}`)
    onClose()
  }

  const filteredTopics = topics

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-relic-void/30 backdrop-blur-md">
      <div className="bg-gradient-to-br from-white via-gray-50/90 to-gray-100/70 border border-white/50 shadow-2xl ring-1 ring-black/5 w-full max-w-3xl max-h-[80vh] overflow-hidden animate-fade-in rounded-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-relic-mist/50 bg-white/50">
          <div className="flex items-center gap-3">
            {selectedTopic && (
              <button
                onClick={handleBack}
                className="text-xs text-relic-slate hover:text-relic-void transition-colors font-medium"
              >
                ← back
              </button>
            )}
            <div>
              <h2 className="text-lg font-medium text-relic-void">
                {selectedTopic ? selectedTopic.name : 'Your Topics'}
              </h2>
              <p className="text-xs text-relic-slate">
                {selectedTopic 
                  ? `${selectedTopic.category || 'other'} · ${relatedQueries.length} related queries`
                  : 'Topics extracted from your conversations'
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-relic-slate hover:text-relic-void transition-colors text-xl font-light w-8 h-8 flex items-center justify-center hover:bg-relic-ghost/50 rounded-full"
          >
            ×
          </button>
        </div>

        {/* Content */}
        {selectedTopic ? (
          /* Topic Detail View */
          <div className="animate-slide-in">
            {/* Topic Dashboard Toolbar */}
            <div className="p-3 border-b border-relic-mist/30 bg-relic-ghost/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* View in Mind Map */}
                  <button
                    onClick={handleViewInMindMap}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] bg-white border border-relic-mist hover:border-relic-slate hover:bg-relic-ghost transition-all"
                  >
                    <span>🗺️</span>
                    <span>Mind Map</span>
                  </button>
                  
                  {/* Continue with Topic */}
                  <button
                    onClick={() => handleContinueWithTopic(selectedTopic.name)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] bg-relic-slate text-white hover:bg-relic-void transition-all"
                  >
                    <span>💬</span>
                    <span>Continue Chat</span>
                  </button>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Legend Mode Toggle */}
                  <label className="flex items-center gap-1.5 text-[10px] text-relic-slate cursor-pointer">
                    <span>⚡ Legend</span>
                    <button
                      onClick={toggleLegendMode}
                      className={`w-8 h-4 rounded-full transition-colors relative ${
                        legendMode ? 'bg-relic-slate' : 'bg-relic-mist'
                      }`}
                    >
                      <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                        legendMode ? 'right-0.5' : 'left-0.5'
                      }`} />
                    </button>
                  </label>
                  
                  {/* Audit Mode Toggle */}
                  <label className="flex items-center gap-1.5 text-[10px] text-relic-slate cursor-pointer">
                    <span>🔍 Audit</span>
                    <button
                      onClick={() => setAuditMode(!auditMode)}
                      className={`w-8 h-4 rounded-full transition-colors relative ${
                        auditMode ? 'bg-relic-slate' : 'bg-relic-mist'
                      }`}
                    >
                      <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                        auditMode ? 'right-0.5' : 'left-0.5'
                      }`} />
                    </button>
                  </label>
                  
                  {/* Suggestion Mode Toggle */}
                  <label className="flex items-center gap-1.5 text-[10px] text-relic-slate cursor-pointer">
                    <span>💡 Suggest</span>
                    <button
                      onClick={() => setSuggestionMode(!suggestionMode)}
                      className={`w-8 h-4 rounded-full transition-colors relative ${
                        suggestionMode ? 'bg-relic-slate' : 'bg-relic-mist'
                      }`}
                    >
                      <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                        suggestionMode ? 'right-0.5' : 'left-0.5'
                      }`} />
                    </button>
                  </label>
                </div>
              </div>
              
              {/* Mode indicators */}
              {(legendMode || auditMode) && (
                <div className="mt-2 flex items-center gap-2 text-[9px]">
                  {legendMode && (
                    <span className="px-2 py-0.5 bg-relic-slate text-white">LEGEND MODE ACTIVE</span>
                  )}
                  {auditMode && (
                    <span className="px-2 py-0.5 bg-amber-500 text-white">AUDIT MODE ACTIVE</span>
                  )}
                </div>
              )}
            </div>
            
            {/* Topic Info */}
            <div className="p-5 border-b border-relic-mist/30 bg-white/40">
              {selectedTopic.description && (
                <p className="text-sm text-relic-void mb-3">{selectedTopic.description}</p>
              )}
              <div className="flex items-center gap-4 text-[10px] text-relic-slate">
                <span className={`px-2 py-0.5 font-medium ${CATEGORY_COLORS[selectedTopic.category || 'other']}`}>
                  {selectedTopic.category || 'other'}
                </span>
                {selectedTopic.pinned && (
                  <span className="text-relic-void">📌 Pinned</span>
                )}
                <span>
                  Created {new Date(selectedTopic.created_at * 1000).toLocaleDateString()}
                </span>
              </div>
              {selectedTopic.ai_instructions && (
                <div className="mt-3 p-3 bg-white/70 border border-relic-mist/30 rounded-sm">
                  <span className="text-[9px] uppercase tracking-wider text-relic-slate font-medium">AI Instructions</span>
                  <p className="text-xs text-relic-void mt-1">{selectedTopic.ai_instructions}</p>
                </div>
              )}
            </div>
            
            {/* Discover Related Topics */}
            {relatedTopics.length > 0 && (
              <div className="p-4 border-b border-relic-mist/30 bg-white/30">
                <h3 className="text-xs uppercase tracking-wider text-relic-slate mb-3 font-medium">Discover Related Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {relatedTopics.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => {
                        const fullTopic = topics.find(t => t.id === topic.id)
                        if (fullTopic) handleTopicClick(fullTopic)
                      }}
                      className="px-3 py-1.5 text-[10px] bg-white border border-relic-mist hover:border-relic-slate hover:bg-relic-ghost transition-all"
                    >
                      {topic.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Related Queries */}
            <div className="p-4 overflow-y-auto max-h-[40vh]">
              <h3 className="text-xs uppercase tracking-wider text-relic-slate mb-3 font-medium">Related Conversations</h3>
              {loadingDetail ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-relic-mist border-t-relic-slate rounded-full animate-spin" />
                </div>
              ) : relatedQueries.length === 0 ? (
                <p className="text-sm text-relic-slate text-center py-8">
                  No related conversations found
                </p>
              ) : (
                <div className="space-y-2">
                  {relatedQueries.map((q) => (
                    <a
                      key={q.id}
                      href={`/?continue=${q.id}`}
                      className="block p-3 bg-white/70 border border-relic-mist/30 hover:border-relic-slate/40 hover:bg-white hover:shadow-md transition-all rounded-sm"
                    >
                      <p className="text-sm text-relic-void mb-1 line-clamp-2">{q.query}</p>
                      <div className="flex items-center gap-3 text-[10px] text-relic-slate">
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
            {/* Topics List */}
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-relic-mist border-t-relic-slate rounded-full animate-spin" />
                </div>
              ) : filteredTopics.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-relic-slate text-sm">No topics yet</p>
                  <p className="text-relic-slate/60 text-xs mt-1">
                    Topics will be extracted from your conversations
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredTopics.map(topic => (
                    <button
                      key={topic.id}
                      onClick={() => handleTopicClick(topic)}
                      className="p-4 bg-white/70 border border-relic-mist/30 hover:border-relic-slate/40 hover:bg-white hover:shadow-md transition-all text-left group rounded-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {topic.pinned && <span className="text-sm">📌</span>}
                            <h3 className="text-sm font-medium text-relic-void group-hover:text-relic-void transition-colors">
                              {topic.name}
                            </h3>
                            <span className={`px-2 py-0.5 text-[10px] font-medium ${
                              CATEGORY_COLORS[topic.category || 'other']
                            }`}>
                              {topic.category || 'other'}
                            </span>
                          </div>
                          {topic.description && (
                            <p className="text-xs text-relic-slate mt-1.5 line-clamp-2">
                              {topic.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {topic.query_count !== undefined && topic.query_count > 0 && (
                            <span className="text-[10px] text-relic-slate font-medium">
                              {topic.query_count} queries
                            </span>
                          )}
                          <span className="text-relic-slate group-hover:text-relic-void transition-colors">
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
        <div className="p-4 border-t border-relic-mist/30 bg-white/40">
          <p className="text-[10px] text-relic-slate text-center">
            Topics help AkhAI remember context across conversations
          </p>
        </div>
      </div>
    </div>
  )
}
