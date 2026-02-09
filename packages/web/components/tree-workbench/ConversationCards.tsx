'use client'

/**
 * Conversation Cards
 *
 * Horizontal scroll of topic cards grouped by dominant Sephirah.
 */

import { useState, useEffect } from 'react'
import { Layer, LAYER_METADATA } from '@/lib/layer-registry'

const LAYER_COLORS: Record<number, string> = {
  [Layer.EMBEDDING]: '#92400e',
  [Layer.EXECUTOR]: '#94a3b8',
  [Layer.CLASSIFIER]: '#eab308',
  [Layer.GENERATIVE]: '#f97316',
  [Layer.ATTENTION]: '#22c55e',
  [Layer.DISCRIMINATOR]: '#dc2626',
  [Layer.EXPANSION]: '#06b6d4',
  [Layer.ENCODER]: '#3b82f6',
  [Layer.REASONING]: '#4f46e5',
  [Layer.META_CORE]: '#9333ea',
  [Layer.SYNTHESIS]: '#06b6d4'
}

interface Conversation {
  id: string
  query: string
  dominantLayer: Layer
  methodology: string
  timestamp: number
  tokensUsed?: number
}

interface ConversationCardsProps {
  onCardClick?: (conversation: Conversation) => void
  limit?: number
}

export function ConversationCards({ onCardClick, limit = 20 }: ConversationCardsProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLayer, setSelectedLayer] = useState<Layer | null>(null)

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      const res = await fetch(`/api/history?limit=${limit}`)
      const data = await res.json()

      // Map queries to conversations with dominant Layer
      const mapped: Conversation[] = (data.queries || []).map((q: any) => ({
        id: q.id,
        query: q.query,
        dominantLayer: extractDominantLayer(q),
        methodology: q.flow || 'direct',
        timestamp: q.created_at * 1000,
        tokensUsed: q.tokens_used
      }))

      setConversations(mapped)
    } catch (err) {
      console.error('Failed to fetch conversations:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Extract dominant Layer from query metadata (simplified heuristic)
  const extractDominantLayer = (query: any): Layer => {
    const text = (query.query || '').toLowerCase()

    // Simple keyword-based heuristic
    if (text.includes('how') || text.includes('implement')) return Layer.EXECUTOR
    if (text.includes('analyze') || text.includes('compare')) return Layer.CLASSIFIER
    if (text.includes('create') || text.includes('imagine')) return Layer.GENERATIVE
    if (text.includes('understand') || text.includes('pattern')) return Layer.ENCODER
    if (text.includes('why') || text.includes('principle')) return Layer.REASONING
    if (text.includes('what if') || text.includes('expand')) return Layer.EXPANSION
    if (text.includes('critique') || text.includes('limit')) return Layer.DISCRIMINATOR

    return Layer.ATTENTION // Default to Attention (balance)
  }

  // Group conversations by dominant Layer
  const groupedByLayer = conversations.reduce((acc, conv) => {
    const key = conv.dominantLayer
    if (!acc[key]) acc[key] = []
    acc[key].push(conv)
    return acc
  }, {} as Record<Layer, Conversation[]>)

  // Filter by selected Layer
  const filteredConversations = selectedLayer
    ? conversations.filter(c => c.dominantLayer === selectedLayer)
    : conversations

  if (isLoading) {
    return (
      <div className="p-4 text-center text-[11px] text-relic-silver">
        Loading conversations...
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-[11px] text-relic-silver italic">
        No conversations yet
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Layer Filter */}
      <div className="flex items-center gap-2 px-4 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedLayer(null)}
          className={`px-2 py-1 text-[9px] font-mono rounded whitespace-nowrap
            ${selectedLayer === null
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
              : 'text-relic-slate hover:bg-relic-ghost dark:hover:bg-relic-slate/10'
            }`}
        >
          All ({conversations.length})
        </button>
        {Object.entries(groupedByLayer).map(([layerNodeStr, convs]) => {
          const layerNode = parseInt(layerNodeStr) as Layer
          return (
            <button
              key={layerNode}
              onClick={() => setSelectedLayer(layerNode)}
              className={`px-2 py-1 text-[9px] font-mono rounded whitespace-nowrap flex items-center gap-1
                ${selectedLayer === layerNode
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : 'text-relic-slate hover:bg-relic-ghost dark:hover:bg-relic-slate/10'
                }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: LAYER_COLORS[layerNode] }}
              />
              {LAYER_METADATA[layerNode]?.name} ({convs.length})
            </button>
          )
        })}
      </div>

      {/* Horizontal Scroll Cards */}
      <div className="flex gap-3 overflow-x-auto px-4 pb-4 -mx-4">
        {filteredConversations.map(conv => (
          <div
            key={conv.id}
            onClick={() => onCardClick?.(conv)}
            className="flex-shrink-0 w-64 p-3 bg-white dark:bg-relic-slate/10 border border-relic-mist dark:border-relic-slate/20 rounded-lg cursor-pointer hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: LAYER_COLORS[conv.dominantLayer] }}
                />
                <span className="text-[9px] font-mono text-relic-slate">
                  {LAYER_METADATA[conv.dominantLayer]?.name}
                </span>
              </div>
              <span className="text-[8px] text-relic-silver">
                {conv.methodology}
              </span>
            </div>

            {/* Query */}
            <div className="text-[11px] text-relic-void dark:text-white line-clamp-2 mb-2">
              {conv.query}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-[8px] text-relic-silver">
              <span>
                {new Date(conv.timestamp).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              {conv.tokensUsed && (
                <span>{conv.tokensUsed.toLocaleString()} tokens</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
