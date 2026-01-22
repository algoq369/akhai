'use client'

/**
 * MindMapMiniChat - Left-side collapsible mini chat for Mind Map
 *
 * Settings-style minimalist design:
 * - Simple ◇ diamond sigil when collapsed
 * - Clean white expanded chat
 * - No borders on input, just underline
 */

import { useState, useCallback, useRef, useEffect } from 'react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface MindMapMiniChatProps {
  selectedTopic?: {
    id: string
    label: string
    category?: string
    description?: string
  } | null
  suggestionsCount?: number
  connectionsCount?: number
  onClose?: () => void
  className?: string
  externalMessage?: string | null
}

export function MindMapMiniChat({
  selectedTopic,
  suggestionsCount = 0,
  connectionsCount = 0,
  externalMessage,
}: MindMapMiniChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Ask me anything about your knowledge graph.',
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pendingMessageRef = useRef<string | null>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle external messages
  useEffect(() => {
    if (externalMessage) {
      setIsOpen(true)
      pendingMessageRef.current = externalMessage
    }
  }, [externalMessage])

  // Update context when topic changes
  useEffect(() => {
    if (selectedTopic && isOpen) {
      setMessages(prev => {
        if (prev.some(m => m.content.includes(selectedTopic.label))) return prev
        return [
          ...prev,
          {
            role: 'assistant',
            content: `Viewing: ${selectedTopic.label}`,
          },
        ]
      })
    }
  }, [selectedTopic?.id, isOpen])

  const sendMessage = useCallback(async (messageText?: string) => {
    const text = messageText || input.trim()
    if (!text || isLoading) return

    setMessages(prev => [...prev, { role: 'user', content: text }])
    setInput('')
    setIsLoading(true)

    try {
      const context = selectedTopic
        ? `User is viewing Mind Map topic "${selectedTopic.label}" (${selectedTopic.category || 'uncategorized'}). ${connectionsCount} connections, ${suggestionsCount} suggestions.`
        : `User is viewing Mind Map with ${suggestionsCount} suggestions.`

      const response = await fetch('/api/simple-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: text,
          methodology: 'direct',
          conversationHistory: messages.slice(-4).map(m => ({
            role: m.role,
            content: m.content,
          })),
          systemContext: context,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error('Mini chat API error:', response.status, errorText)
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: `Unable to process request (${response.status}). Please try again.` },
        ])
        return
      }

      const data = await response.json()
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.response || data.error || 'No response received.',
        },
      ])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Mini chat error:', errorMessage, error)
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `Connection error: ${errorMessage}` },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, messages, selectedTopic, connectionsCount, suggestionsCount])

  // Process pending external message
  useEffect(() => {
    if (pendingMessageRef.current && !isLoading) {
      const msg = pendingMessageRef.current
      pendingMessageRef.current = null
      sendMessage(msg)
    }
  }, [externalMessage, isLoading, sendMessage])

  return (
    <div
      className="fixed left-4 bottom-20 bg-white border border-neutral-200 transition-all duration-200"
      style={{
        width: isOpen ? '260px' : '36px',
        height: isOpen ? 'auto' : '36px',
        maxHeight: isOpen ? '360px' : '36px',
        zIndex: 100,
        overflow: 'hidden',
      }}
    >
      {/* Collapsed: Simple diamond sigil */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-9 h-9 flex items-center justify-center text-neutral-400 hover:text-neutral-600 transition-colors"
          title="Open Mind Map Chat"
        >
          ◇
        </button>
      )}

      {/* Expanded: Clean chat */}
      {isOpen && (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-3 py-2 border-b border-neutral-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">◇</span>
              <span className="text-xs text-neutral-500">assistant</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-neutral-400 hover:text-neutral-600 text-sm transition-colors"
            >
              −
            </button>
          </div>

          {/* Context line */}
          {selectedTopic && (
            <div className="px-3 py-1.5 border-b border-neutral-100 text-[10px] text-neutral-400">
              {selectedTopic.label} · {suggestionsCount} suggestions · {connectionsCount} links
            </div>
          )}

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto px-3 py-2"
            style={{ minHeight: '140px', maxHeight: '200px' }}
          >
            {messages.map((msg, i) => (
              <div
                key={`msg-${msg.role}-${i}-${msg.content.slice(0, 10)}`}
                className={`mb-2 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'text-neutral-700 bg-neutral-50 px-2 py-1'
                    : 'text-neutral-500'
                }`}
              >
                {msg.content}
              </div>
            ))}
            {isLoading && (
              <div className="text-xs text-neutral-400">...</div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input - underline style */}
          <div className="px-3 py-2 border-t border-neutral-100">
            <input
              type="text"
              placeholder="message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              disabled={isLoading}
              className="w-full bg-transparent border-none border-b border-neutral-200 text-xs text-neutral-600 pb-1 focus:outline-none focus:border-neutral-400 placeholder-neutral-400 transition-colors"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default MindMapMiniChat
