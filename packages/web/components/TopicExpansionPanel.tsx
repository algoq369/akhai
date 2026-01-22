'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PaperAirplaneIcon } from '@heroicons/react/24/outline'

interface TopicInsight {
  text: string
  confidence: number
}

interface TopicMetrics {
  queryCount: number
  connectionCount: number
  lastActivity: string
  firstCreated: string
}

interface AISuggestion {
  type: 'question' | 'connection' | 'research' | 'action'
  content: string
  reasoning?: string
  targetTopic?: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface TopicExpansionPanelProps {
  topicId: string
  topicName: string
  topicDescription?: string
  category?: string
  relatedTopics?: string[]
  onClose: () => void
  onQueryAction?: (query: string) => void
}

/**
 * Topic Expansion Panel - Center Modal
 *
 * Dashboard-style sections (always visible):
 * - Insights (AI-generated key insights)
 * - Metrics (queries, connections, activity)
 * - AI Suggestions (questions, connections, research, actions)
 * - Chat (topic-scoped conversation)
 */
export function TopicExpansionPanel({
  topicId,
  topicName,
  topicDescription,
  category,
  relatedTopics = [],
  onClose,
  onQueryAction,
}: TopicExpansionPanelProps) {
  const [insights, setInsights] = useState<TopicInsight[]>([])
  const [metrics, setMetrics] = useState<TopicMetrics | null>(null)
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')

  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [isChatLoading, setIsChatLoading] = useState(false)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // Load suggestions on mount
  useEffect(() => {
    loadSuggestions()
    loadMetrics()
  }, [topicId])

  const loadSuggestions = async () => {
    setIsLoadingSuggestions(true)
    try {
      // Check cache first
      const cached = getCachedSuggestions(topicId)
      if (cached) {
        setSuggestions(cached.suggestions)
        setInsights(cached.insights || [])
        setIsLoadingSuggestions(false)
        return
      }

      // Fetch from API
      const response = await fetch('/api/mindmap/topic-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId,
          topicName,
          topicDescription,
          category,
          relatedTopics,
        }),
      })

      if (!response.ok) throw new Error('Failed to load suggestions')

      const data = await response.json()

      // Flatten suggestions into single array with types
      const allSuggestions: AISuggestion[] = [
        ...data.suggestions.deeperQuestions.map((q: any) => ({
          type: 'question' as const,
          content: q.question,
          reasoning: q.reasoning,
        })),
        ...data.suggestions.connections.map((c: any) => ({
          type: 'connection' as const,
          content: c.relationship,
          targetTopic: c.targetTopic,
        })),
        ...data.suggestions.researchDirections.map((r: any) => ({
          type: 'research' as const,
          content: r.direction,
          reasoning: r.why,
        })),
        ...data.suggestions.practicalActions.map((a: any) => ({
          type: 'action' as const,
          content: a.action,
          reasoning: a.outcome,
        })),
      ]

      setSuggestions(allSuggestions)
      setInsights(data.insights.map((text: string) => ({ text, confidence: data.confidence || 0.8 })))

      // Cache for 5 minutes
      cacheSuggestions(topicId, allSuggestions, data.insights)
    } catch (error) {
      console.error('Failed to load suggestions:', error)
    } finally {
      setIsLoadingSuggestions(false)
    }
  }

  const loadMetrics = () => {
    // TODO: Load from database/store
    setMetrics({
      queryCount: 0,
      connectionCount: relatedTopics.length,
      lastActivity: 'Just now',
      firstCreated: 'Today',
    })
  }

  const handleSuggestionClick = (suggestion: AISuggestion) => {
    switch (suggestion.type) {
      case 'question':
        // Send question to chat
        setChatInput(suggestion.content)
        setTimeout(() => handleChatSubmit(suggestion.content), 100)
        break

      case 'connection':
        // Navigate to connected topic or show connection info
        console.log('Navigate to:', suggestion.targetTopic)
        break

      case 'research':
        // Open in main query interface
        if (onQueryAction) {
          onQueryAction(suggestion.content)
          onClose()
        }
        break

      case 'action':
        // Send action to chat for guidance
        setChatInput(`How do I: ${suggestion.content}`)
        setTimeout(() => handleChatSubmit(`How do I: ${suggestion.content}`), 100)
        break
    }
  }

  const handleChatSubmit = async (inputText?: string) => {
    const text = inputText || chatInput.trim()
    if (!text || isChatLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    }

    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setIsChatLoading(true)

    try {
      const response = await fetch('/api/simple-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: text,
          methodology: 'direct',
          conversationHistory: chatMessages,
          topicContext: {
            topicId,
            topicName,
            topicDescription,
            relatedTopics,
            insights: insights.map(i => i.text),
          },
        }),
      })

      if (!response.ok) throw new Error('Query failed')

      const data = await response.json()

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || data.content || 'No response',
        timestamp: Date.now(),
      }

      setChatMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your message.',
        timestamp: Date.now(),
      }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsChatLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleChatSubmit()
    }
  }

  // Symbol mapping for suggestions
  const getSuggestionSymbol = (type: AISuggestion['type']): string => {
    switch (type) {
      case 'question': return '?'
      case 'connection': return '↔'
      case 'research': return '→'
      case 'action': return '⚡'
    }
  }

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-2xl h-[70vh] bg-white dark:bg-relic-void border border-relic-mist dark:border-relic-slate/30 rounded-lg shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-none bg-white dark:bg-relic-void border-b border-relic-mist dark:border-relic-slate/30 px-4 py-3">
            <button
              onClick={onClose}
              className="text-[9px] text-relic-silver hover:text-relic-void dark:hover:text-white transition-colors"
            >
              ← close
            </button>
            <h3 className="text-sm font-mono text-relic-void dark:text-white mt-2">
              {topicName}
            </h3>
            {category && (
              <span className="text-[9px] text-relic-silver uppercase tracking-wider">
                {category}
              </span>
            )}
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Section 1 - Insights */}
          <div className="px-4 py-3 border-b border-relic-mist dark:border-relic-slate/30">
            <div className="text-[10px] text-relic-slate dark:text-relic-ghost uppercase tracking-[0.2em] mb-2">
              ▸ INSIGHTS
            </div>
            <div className="ml-4 space-y-1.5">
              {isLoadingSuggestions && (
                <div className="text-[9px] text-relic-silver">Loading insights...</div>
              )}
              {!isLoadingSuggestions && insights.length === 0 && (
                <div className="text-[9px] text-relic-silver">No insights available yet.</div>
              )}
              {insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-2 text-[9px]">
                  <span className="text-relic-silver">●</span>
                  <div className="flex-1">
                    <p className="text-relic-void dark:text-white leading-snug">
                      {insight.text}
                    </p>
                    <span className="text-relic-silver">
                      {Math.round(insight.confidence * 100)}% confidence
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2 - Metrics */}
          {metrics && (
            <div className="px-4 py-3 border-b border-relic-mist dark:border-relic-slate/30">
              <div className="text-[10px] text-relic-slate dark:text-relic-ghost uppercase tracking-[0.2em] mb-2">
                ▸ METRICS
              </div>
              <div className="ml-4 space-y-1">
                <div className="flex items-center gap-4">
                  <span className="text-[9px] text-relic-silver w-20">queries</span>
                  <span className="text-[9px] font-mono text-relic-void dark:text-white">
                    {metrics.queryCount}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[9px] text-relic-silver w-20">connections</span>
                  <span className="text-[9px] font-mono text-relic-void dark:text-white">
                    {metrics.connectionCount}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[9px] text-relic-silver w-20">last activity</span>
                  <span className="text-[9px] text-relic-silver">
                    {metrics.lastActivity}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Section 3 - AI Suggestions */}
          <div className="px-4 py-3 border-b border-relic-mist dark:border-relic-slate/30">
            <div className="text-[10px] text-relic-slate dark:text-relic-ghost uppercase tracking-[0.2em] mb-2">
              ▸ AI SUGGESTIONS
            </div>
            <div className="ml-4 space-y-1">
              {isLoadingSuggestions && (
                <div className="text-[9px] text-relic-silver">Generating suggestions...</div>
              )}
              {!isLoadingSuggestions && suggestions.length === 0 && (
                <div className="text-[9px] text-relic-silver">No suggestions available.</div>
              )}
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left flex items-start gap-2 text-[9px] hover:text-relic-void dark:hover:text-white text-relic-slate dark:text-relic-ghost transition-colors"
                >
                  <span>{getSuggestionSymbol(suggestion.type)}</span>
                  <span className="flex-1 leading-snug">{suggestion.content}</span>
                </button>
              ))}
            </div>
          </div>

            {/* Section 4 - Chat */}
            <div className="px-4 py-3">
              <div className="text-[10px] text-relic-slate dark:text-relic-ghost uppercase tracking-[0.2em] mb-2">
                ▸ CHAT
              </div>
              <div className="ml-4 space-y-2 mb-2">
              {chatMessages.length === 0 && (
                <div className="text-[9px] text-relic-silver">
                  Ask about {topicName}...
                </div>
              )}
              {chatMessages.map((msg) => (
                <div key={msg.id} className="text-[9px] leading-snug">
                  <span className="text-relic-silver">
                    {msg.role === 'user' ? 'you' : 'ai'}:
                  </span>
                  <p className="text-relic-void dark:text-white ml-2 mt-0.5">
                    {msg.content}
                  </p>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex gap-1 ml-2">
                  <div className="w-1 h-1 bg-relic-slate rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1 h-1 bg-relic-slate rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1 h-1 bg-relic-slate rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
                <div ref={chatEndRef} />
              </div>
              <div className="ml-4 flex gap-2">
                <textarea
                  ref={inputRef}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="ask about this topic..."
                  className="flex-1 px-2 py-1.5 text-[9px] font-mono bg-relic-ghost dark:bg-relic-slate/20 border border-relic-mist dark:border-relic-slate/30 rounded text-relic-void dark:text-white placeholder:text-relic-silver resize-none"
                  rows={1}
                />
                <button
                  onClick={() => handleChatSubmit()}
                  disabled={!chatInput.trim() || isChatLoading}
                  className="px-2 py-1 bg-relic-void dark:bg-white text-white dark:text-relic-void rounded hover:bg-relic-slate dark:hover:bg-relic-ghost transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

// Cache utilities
interface SuggestionCache {
  suggestions: AISuggestion[]
  insights: TopicInsight[]
  timestamp: number
  ttl: number
}

function getCachedSuggestions(topicId: string): SuggestionCache | null {
  if (typeof window === 'undefined') return null

  const cached = localStorage.getItem(`suggestions_${topicId}`)
  if (!cached) return null

  const data: SuggestionCache = JSON.parse(cached)
  if (Date.now() - data.timestamp > data.ttl) {
    localStorage.removeItem(`suggestions_${topicId}`)
    return null
  }

  return data
}

function cacheSuggestions(topicId: string, suggestions: AISuggestion[], insights: TopicInsight[]) {
  if (typeof window === 'undefined') return

  const cache: SuggestionCache = {
    suggestions,
    insights,
    timestamp: Date.now(),
    ttl: 300000, // 5 minutes
  }

  localStorage.setItem(`suggestions_${topicId}`, JSON.stringify(cache))
}
