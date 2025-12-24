'use client'

import { useState, useEffect } from 'react'

interface Suggestion {
  topicId: string
  topicName: string
  reason: string
  relevance: number
}

interface SuggestionToastProps {
  suggestions: Suggestion[]
  onSuggestionClick: (suggestion: Suggestion) => void
  onDismiss: () => void
}

export default function SuggestionToast({
  suggestions,
  onSuggestionClick,
  onDismiss,
}: SuggestionToastProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (suggestions.length > 0) {
      setIsVisible(true)
      // Auto-dismiss after 10 seconds
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onDismiss, 300) // Wait for animation
      }, 10000)
      return () => clearTimeout(timer)
    }
  }, [suggestions, onDismiss])

  if (!isVisible || suggestions.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      <div className="bg-relic-white border-2 border-relic-slate/30 p-4 max-w-sm shadow-lg">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-sm font-mono text-relic-slate">Related Topics</h3>
          <button
            onClick={() => {
              setIsVisible(false)
              setTimeout(onDismiss, 300)
            }}
            className="text-relic-silver hover:text-relic-slate transition-colors"
          >
            ×
          </button>
        </div>

        <div className="space-y-2">
          {suggestions.slice(0, 3).map((suggestion) => (
            <button
              key={suggestion.topicId}
              onClick={() => onSuggestionClick(suggestion)}
              className="w-full text-left px-3 py-2 border border-relic-mist hover:border-relic-slate/50 hover:bg-relic-ghost/50 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-relic-slate group-hover:text-relic-slate">
                  {suggestion.topicName}
                </span>
                <span className="text-[10px] text-relic-silver">→</span>
              </div>
              <p className="text-[10px] text-relic-silver mt-1">{suggestion.reason}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

