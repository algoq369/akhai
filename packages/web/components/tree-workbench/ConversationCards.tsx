'use client'

/**
 * Conversation Cards
 *
 * Horizontal scroll of topic cards grouped by dominant Sephirah.
 */

import { useState, useEffect } from 'react'
import { Sefirah, SEPHIROTH_METADATA } from '@/lib/ascent-tracker'

const SEFIRAH_COLORS: Record<number, string> = {
  [Sefirah.MALKUTH]: '#92400e',
  [Sefirah.YESOD]: '#94a3b8',
  [Sefirah.HOD]: '#eab308',
  [Sefirah.NETZACH]: '#f97316',
  [Sefirah.TIFERET]: '#22c55e',
  [Sefirah.GEVURAH]: '#dc2626',
  [Sefirah.CHESED]: '#06b6d4',
  [Sefirah.BINAH]: '#3b82f6',
  [Sefirah.CHOKMAH]: '#4f46e5',
  [Sefirah.KETHER]: '#9333ea',
  [Sefirah.DAAT]: '#06b6d4'
}

interface Conversation {
  id: string
  query: string
  dominantSefirah: Sefirah
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
  const [selectedSefirah, setSelectedSefirah] = useState<Sefirah | null>(null)

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      const res = await fetch(`/api/history?limit=${limit}`)
      const data = await res.json()

      // Map queries to conversations with dominant Sefirah
      const mapped: Conversation[] = (data.queries || []).map((q: any) => ({
        id: q.id,
        query: q.query,
        dominantSefirah: extractDominantSefirah(q),
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

  // Extract dominant Sefirah from query metadata (simplified heuristic)
  const extractDominantSefirah = (query: any): Sefirah => {
    const text = (query.query || '').toLowerCase()

    // Simple keyword-based heuristic
    if (text.includes('how') || text.includes('implement')) return Sefirah.YESOD
    if (text.includes('analyze') || text.includes('compare')) return Sefirah.HOD
    if (text.includes('create') || text.includes('imagine')) return Sefirah.NETZACH
    if (text.includes('understand') || text.includes('pattern')) return Sefirah.BINAH
    if (text.includes('why') || text.includes('principle')) return Sefirah.CHOKMAH
    if (text.includes('what if') || text.includes('expand')) return Sefirah.CHESED
    if (text.includes('critique') || text.includes('limit')) return Sefirah.GEVURAH

    return Sefirah.TIFERET // Default to Tiferet (balance)
  }

  // Group conversations by dominant Sefirah
  const groupedBySefirah = conversations.reduce((acc, conv) => {
    const key = conv.dominantSefirah
    if (!acc[key]) acc[key] = []
    acc[key].push(conv)
    return acc
  }, {} as Record<Sefirah, Conversation[]>)

  // Filter by selected Sefirah
  const filteredConversations = selectedSefirah
    ? conversations.filter(c => c.dominantSefirah === selectedSefirah)
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
      {/* Sefirah Filter */}
      <div className="flex items-center gap-2 px-4 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedSefirah(null)}
          className={`px-2 py-1 text-[9px] font-mono rounded whitespace-nowrap
            ${selectedSefirah === null
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
              : 'text-relic-slate hover:bg-relic-ghost dark:hover:bg-relic-slate/10'
            }`}
        >
          All ({conversations.length})
        </button>
        {Object.entries(groupedBySefirah).map(([sefirahStr, convs]) => {
          const sefirah = parseInt(sefirahStr) as Sefirah
          return (
            <button
              key={sefirah}
              onClick={() => setSelectedSefirah(sefirah)}
              className={`px-2 py-1 text-[9px] font-mono rounded whitespace-nowrap flex items-center gap-1
                ${selectedSefirah === sefirah
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : 'text-relic-slate hover:bg-relic-ghost dark:hover:bg-relic-slate/10'
                }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: SEFIRAH_COLORS[sefirah] }}
              />
              {SEPHIROTH_METADATA[sefirah]?.name} ({convs.length})
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
                  style={{ backgroundColor: SEFIRAH_COLORS[conv.dominantSefirah] }}
                />
                <span className="text-[9px] font-mono text-relic-slate">
                  {SEPHIROTH_METADATA[conv.dominantSefirah]?.name}
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
