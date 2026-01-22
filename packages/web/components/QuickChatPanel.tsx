'use client'

import { useState, useRef, useEffect } from 'react'
import { XMarkIcon, PaperAirplaneIcon, ArrowUpTrayIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useQuickChatStore, QuickChatMessage } from '@/lib/stores/quick-chat-store'
import { AnimatePresence, motion } from 'framer-motion'

export default function QuickChatPanel() {
  const { isOpen, messages, isLoading, suggestions, close, addMessage, setLoading, clear, clearSuggestions } = useQuickChatStore()
  const [input, setInput] = useState('')
  const [user, setUser] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch user session and profile data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/auth/session')
        const data = await response.json()
        setUser(data.user)
      } catch (error) {
        console.error('[QuickChat] Failed to fetch user data:', error)
      }
    }

    if (isOpen) {
      fetchUserData()
    }
  }, [isOpen])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: QuickChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    }

    addMessage(userMessage)
    setInput('')
    setLoading(true)

    try {
      // Include user context in the query
      const userContext = user ? {
        userId: user.id,
        username: user.username,
        email: user.email,
        preferences: {
          // Add any user preferences from settings store if available
        }
      } : null

      const response = await fetch('/api/quick-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMessage.content,
          userContext,
        }),
      })

      if (!response.ok) throw new Error('Failed to get response')

      const data = await response.json()

      const assistantMessage: QuickChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.content || 'No response received.',
        timestamp: Date.now(),
      }

      addMessage(assistantMessage)
    } catch (error) {
      console.error('[QuickChat] Error:', error)
      const errorMessage: QuickChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now(),
      }
      addMessage(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handlePushToMain = () => {
    // TODO: Implement push to main chat functionality
    // This would copy the entire conversation to the main chat interface
    alert('Push to Main: Coming soon!')
  }

  const handleClear = () => {
    if (confirm('Clear all messages?')) {
      clear()
    }
  }

  const handleSuggestionClick = (suggestionText: string) => {
    setInput(suggestionText)
    clearSuggestions()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="fixed bottom-24 right-6 w-[360px] h-[420px] bg-white border border-relic-slate/20 flex flex-col z-50"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-relic-mist/50">
          <div className="text-[9px] font-mono tracking-[0.2em] text-relic-slate">
            q
          </div>
          <button
            onClick={close}
            className="text-relic-silver hover:text-relic-slate transition-colors"
            aria-label="Close"
          >
            <span className="text-[10px]">×</span>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-relic-silver text-[9px] font-mono">
              ▸ type your question
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`space-y-0.5 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
              >
                <div className="text-[8px] font-mono tracking-[0.1em] text-relic-silver">
                  {message.role === 'user' ? 'you' : 'akhai'}
                </div>
                <div
                  className={`inline-block px-2 py-1 text-[10px] leading-relaxed max-w-[90%] ${
                    message.role === 'user'
                      ? 'bg-relic-ghost/50 text-relic-void'
                      : 'text-relic-slate'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex items-center gap-1.5 text-[9px] text-relic-silver font-mono">
              <div className="w-2 h-2 border border-relic-mist border-t-relic-slate animate-spin" />
              <span>▸</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="border-t border-relic-mist/50 px-3 py-1.5 space-y-1">
            <div className="text-[7px] tracking-[0.2em] text-relic-silver mb-1">
              ▸ suggestions
            </div>
            <div className="flex flex-wrap gap-1">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion.text)}
                  className="px-1.5 py-0.5 text-[9px] hover:bg-relic-ghost text-relic-slate hover:text-relic-void transition-colors"
                  title={`${suggestion.type} • confidence: ${Math.round(suggestion.confidence * 100)}%`}
                >
                  · {suggestion.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-relic-mist/50 p-2 space-y-1.5">
          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePushToMain}
              className="flex-1 px-1.5 py-1 text-[8px] font-mono tracking-[0.1em] hover:bg-relic-ghost text-relic-slate hover:text-relic-void transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              disabled={messages.length === 0}
            >
              ▸ push
            </button>
            <button
              onClick={handleClear}
              className="px-1.5 py-1 text-[8px] font-mono tracking-[0.1em] hover:bg-relic-ghost text-relic-slate hover:text-relic-void transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              disabled={messages.length === 0}
              title="Clear all messages"
            >
              × clear
            </button>
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex items-center gap-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="type here"
              className="flex-1 px-2 py-1.5 text-[10px] font-mono bg-white border-0 border-b border-relic-mist/50 text-relic-void placeholder-relic-silver focus:outline-none focus:border-relic-slate transition-colors"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="px-2 py-1.5 text-[8px] font-mono tracking-[0.1em] hover:bg-relic-ghost text-relic-slate disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              disabled={!input.trim() || isLoading}
              aria-label="Send"
            >
              →
            </button>
          </form>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
