'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, LightBulbIcon, LinkIcon, ChartBarIcon } from '@heroicons/react/24/outline'

interface Suggestion {
  topicId: string
  topicName: string
  reason: string
  relevance: number
  type?: 'insight' | 'connection' | 'pattern'
}

interface SuggestionToastProps {
  suggestions: Suggestion[]
  onRemoveSuggestion: (suggestionId: string) => void
  onSuggestionClick: (suggestion: Suggestion) => void
}

export default function SuggestionToast({
  suggestions,
  onRemoveSuggestion,
  onSuggestionClick,
}: SuggestionToastProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  // Auto-hide after 10 seconds if not interacted with
  useEffect(() => {
    if (suggestions.length > 0 && !isExpanded) {
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 10000)
      return () => clearTimeout(timer)
    }
  }, [suggestions.length, isExpanded])

  // Reset visibility when new suggestions arrive
  useEffect(() => {
    if (suggestions.length > 0) {
      setIsVisible(true)
    }
  }, [suggestions])

  if (!isVisible || suggestions.length === 0) {
    return null
  }

  const getIcon = (type?: string) => {
    switch (type) {
      case 'connection':
        return <LinkIcon className="h-4 w-4" />
      case 'pattern':
        return <ChartBarIcon className="h-4 w-4" />
      default:
        return <LightBulbIcon className="h-4 w-4" />
    }
  }

  return (
    <div className={`
      fixed bottom-20 right-4 z-50 transition-all duration-300 ease-out
      ${isExpanded ? 'w-80' : 'w-64'}
    `}>
      {/* Collapsed View - Single Toast */}
      {!isExpanded && (
        <div 
          className="bg-relic-white border border-relic-mist shadow-lg cursor-pointer hover:border-relic-slate transition-colors"
          onClick={() => setIsExpanded(true)}
        >
          <div className="flex items-center gap-3 p-3">
            <div className="text-amber-500">
              <LightBulbIcon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono text-relic-slate truncate">
                Side Canal
              </p>
              <p className="text-[10px] text-relic-silver">
                {suggestions.length} related topic{suggestions.length !== 1 ? 's' : ''} found
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsVisible(false)
              }}
              className="text-relic-silver hover:text-relic-slate p-1"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Expanded View - All Suggestions */}
      {isExpanded && (
        <div className="bg-relic-white border border-relic-mist shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-relic-mist">
            <div className="flex items-center gap-2">
              <span className="text-amber-500">
                <LightBulbIcon className="h-4 w-4" />
              </span>
              <span className="text-xs font-mono text-relic-slate">Side Canal</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded(false)}
                className="text-[10px] text-relic-silver hover:text-relic-slate px-2"
              >
                Collapse
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="text-relic-silver hover:text-relic-slate p-1"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Suggestions List */}
          <div className="max-h-64 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.topicId}
                className="flex items-start gap-3 p-3 border-b border-relic-ghost last:border-0 hover:bg-relic-ghost/50 cursor-pointer group transition-colors"
                onClick={() => onSuggestionClick(suggestion)}
              >
                <div className="text-relic-silver group-hover:text-relic-slate mt-0.5">
                  {getIcon(suggestion.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-relic-slate">
                    {suggestion.topicName}
                  </p>
                  <p className="text-[10px] text-relic-silver mt-0.5">
                    {suggestion.reason}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] text-relic-silver">
                      Relevance: {Math.round(suggestion.relevance * 100)}%
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveSuggestion(suggestion.topicId)
                  }}
                  className="text-relic-silver hover:text-relic-slate opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
