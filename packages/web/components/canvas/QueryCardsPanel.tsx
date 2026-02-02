'use client'

/**
 * QUERY CARDS PANEL
 * 
 * Displays conversation history as expandable cards.
 * Preview mode by default, expand on click for full content.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface QueryCard {
  id: string
  query: string
  response: string
  timestamp: Date
  methodology?: string
  sefirah?: string
  guardWarnings?: string[]
}

interface QueryCardItemProps {
  card: QueryCard
  isExpanded: boolean
  onToggle: () => void
  onSelect: () => void
  isSelected: boolean
}

function QueryCardItem({ card, isExpanded, onToggle, onSelect, isSelected }: QueryCardItemProps) {
  const previewLength = 120
  const queryPreview = card.query.length > 60 ? card.query.slice(0, 60) + '...' : card.query
  const responsePreview = card.response.length > previewLength 
    ? card.response.slice(0, previewLength) + '...' 
    : card.response

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-lg overflow-hidden transition-all cursor-pointer ${
        isSelected 
          ? 'border-purple-400 bg-purple-50/50' 
          : 'border-relic-mist hover:border-relic-slate/30 bg-white'
      }`}
      onClick={onSelect}
    >
      {/* Card Header */}
      <div className="px-3 py-2 bg-relic-ghost/30 border-b border-relic-mist">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[8px] text-purple-500 font-medium">Q</span>
            <span className="text-[10px] text-relic-void font-medium truncate max-w-[200px]">
              {queryPreview}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {card.methodology && (
              <span className="text-[7px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded">
                {card.methodology}
              </span>
            )}
            {card.sefirah && (
              <span className="text-[7px] px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded">
                {card.sefirah}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Response Preview/Full */}
      <div className="px-3 py-2">
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              key="full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[10px] text-relic-slate leading-relaxed whitespace-pre-wrap"
            >
              {card.response}
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[10px] text-relic-silver leading-relaxed"
            >
              {responsePreview}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Guard Warnings */}
        {card.guardWarnings && card.guardWarnings.length > 0 && (
          <div className="mt-2 pt-2 border-t border-relic-mist">
            {card.guardWarnings.map((warning, idx) => (
              <div key={idx} className="flex items-center gap-1 text-[8px] text-red-500">
                <span>⚠</span>
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}

        {/* Timestamp & Expand Toggle */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-relic-mist/50">
          <span className="text-[8px] text-relic-silver">
            {card.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggle()
            }}
            className="text-[8px] text-purple-500 hover:text-purple-700"
          >
            {isExpanded ? '▲ Collapse' : '▼ Expand'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

interface QueryCardsPanelProps {
  cards: QueryCard[]
  onCardSelect?: (cardId: string) => void
  selectedCardId?: string | null
}

export function QueryCardsPanel({ cards, onCardSelect, selectedCardId }: QueryCardsPanelProps) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  const toggleExpand = (cardId: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev)
      if (next.has(cardId)) {
        next.delete(cardId)
      } else {
        next.add(cardId)
      }
      return next
    })
  }

  return (
    <div className="p-3 space-y-2">
      {cards.length === 0 ? (
        <div className="text-center py-8 text-[10px] text-relic-silver">
          No queries yet. Start a conversation!
        </div>
      ) : (
        cards.map((card) => (
          <QueryCardItem
            key={card.id}
            card={card}
            isExpanded={expandedCards.has(card.id)}
            onToggle={() => toggleExpand(card.id)}
            onSelect={() => onCardSelect?.(card.id)}
            isSelected={selectedCardId === card.id}
          />
        ))
      )}
    </div>
  )
}

export default QueryCardsPanel
