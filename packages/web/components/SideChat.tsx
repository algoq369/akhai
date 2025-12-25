'use client'

import { useState } from 'react'
import { XMarkIcon, MinusIcon } from '@heroicons/react/24/outline'
import { Message } from '@/lib/chat-store'
import GuardWarning from './GuardWarning'

interface SideChatProps {
  id: string
  methodology: string
  messages: Message[]
  onClose: () => void
  onMinimize: () => void
  onSendMessage: (query: string) => void
  isLoading: boolean
  guardSuggestions: Record<string, { refine?: string[]; pivot?: string[] }>
  onRefine: (refinedQuery?: string) => void
  onPivot: (pivotQuery?: string) => void
  onContinue: () => void
}

export default function SideChat({
  id,
  methodology,
  messages,
  onClose,
  onMinimize,
  onSendMessage,
  isLoading,
  guardSuggestions,
  onRefine,
  onPivot,
  onContinue
}: SideChatProps) {
  const [query, setQuery] = useState('')
  const [isMinimized, setIsMinimized] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim() && !isLoading) {
      onSendMessage(query.trim())
      setQuery('')
    }
  }

  const handleMinimize = () => {
    setIsMinimized(!isMinimized)
    onMinimize()
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 w-64 bg-relic-white border border-relic-mist shadow-lg z-40">
        <div className="flex items-center justify-between p-2 border-b border-relic-mist">
          <span className="text-xs font-mono text-relic-slate">{methodology}</span>
          <button
            onClick={handleMinimize}
            className="text-relic-silver hover:text-relic-slate"
          >
            <MinusIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed right-80 top-4 bottom-4 w-96 bg-relic-white border border-relic-mist shadow-lg z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-relic-mist">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-relic-slate">{methodology}</span>
          <span className="text-[10px] text-relic-silver">Side Chat</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleMinimize}
            className="text-relic-silver hover:text-relic-slate p-1"
          >
            <MinusIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="text-relic-silver hover:text-relic-slate p-1"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-relic-silver text-xs py-8">
            Start a conversation...
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="space-y-2">
              <div className={`text-xs font-mono ${
                message.role === 'user' ? 'text-relic-slate' : 'text-relic-silver'
              }`}>
                {message.role === 'user' ? 'You' : 'AkhAI'}:
              </div>
              <div className="text-sm text-relic-slate whitespace-pre-wrap">
                {message.content}
              </div>
              {message.guardResult && (
                <GuardWarning
                  guardResult={message.guardResult}
                  originalQuery={messages[messages.findIndex(m => m.id === message.id) - 1]?.content || ''}
                  refineSuggestions={guardSuggestions[message.id]?.refine}
                  pivotSuggestions={guardSuggestions[message.id]?.pivot}
                  onRefine={onRefine}
                  onPivot={onPivot}
                  onContinue={onContinue}
                />
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-relic-silver">
            <div className="w-3 h-3 border border-relic-mist border-t-relic-slate rounded-full animate-spin" />
            <span>thinking...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-relic-mist p-3">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a message..."
            className="w-full px-3 py-2 text-xs border border-relic-mist bg-relic-white focus:outline-none focus:border-relic-slate"
            disabled={isLoading}
          />
        </form>
      </div>
    </div>
  )
}

