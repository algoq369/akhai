'use client'

/**
 * Tree Chat Interface
 *
 * Conversational interface for talking to the Tree of Life
 * Users can ask questions, request explanations, and configure the tree via natural language
 */

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TreeChatMessage {
  role: 'user' | 'tree'
  content: string
  timestamp: number
  configChanges?: any
}

interface TreeChatInterfaceProps {
  isOpen?: boolean
  onToggle?: () => void
  currentConfig?: any
}

export default function TreeChatInterface({
  isOpen = false,
  onToggle,
  currentConfig,
}: TreeChatInterfaceProps) {
  const [messages, setMessages] = useState<TreeChatMessage[]>([
    {
      role: 'tree',
      content: 'Greetings. I am the Tree of Life. Ask me about Sephiroth, Qliphoth, or how to configure your cognitive patterns. What would you like to know?',
      timestamp: Date.now(),
    },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || sending) return

    const userMessage: TreeChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setSending(true)

    try {
      const response = await fetch('/api/tree-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          currentConfig,
        }),
      })

      const data = await response.json()

      const treeMessage: TreeChatMessage = {
        role: 'tree',
        content: data.message || 'I did not understand that. Please rephrase your question.',
        timestamp: Date.now(),
        configChanges: data.configChanges,
      }

      setMessages((prev) => [...prev, treeMessage])
    } catch (error) {
      console.error('Tree chat error:', error)
      const errorMessage: TreeChatMessage = {
        role: 'tree',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Quick action buttons
  const quickActions = [
    'Explain current config',
    'What is Satariel?',
    'What is Binah?',
    'Increase compassion',
    'Make me more analytical',
    'Balance all nodes',
  ]

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 px-4 py-2 text-xs font-mono border border-relic-mist bg-white hover:bg-relic-ghost transition-colors shadow-lg z-40"
      >
        ▸ Talk to Tree
      </button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-0 right-0 w-96 h-[500px] bg-white border-t border-l border-relic-mist z-50 flex flex-col shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-relic-mist bg-relic-ghost">
        <div className="flex items-center gap-2 text-[9px] font-mono">
          <span className="text-purple-600">◆</span>
          <span className="text-relic-slate uppercase tracking-[0.2em]">▸ TREE DIALOGUE</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMessages(messages.slice(0, 1))}
            className="text-[9px] text-relic-silver hover:text-relic-void"
            title="Clear conversation"
          >
            Clear
          </button>
          <span className="text-relic-mist">│</span>
          <button
            onClick={onToggle}
            className="text-[9px] text-relic-silver hover:text-relic-void"
          >
            {isOpen ? '─' : '◻'}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 text-[10px] font-mono">
        {messages.map((msg, idx) => (
          <div key={idx} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
            <div className={`inline-block max-w-[80%] p-2 rounded ${msg.role === 'user' ? 'bg-purple-50 border border-purple-200' : 'bg-relic-ghost border border-relic-mist'}`}>
              <div className="text-[8px] text-relic-silver uppercase mb-0.5">
                {msg.role === 'user' ? 'You' : 'Tree'}
              </div>
              <div className={`text-relic-void leading-relaxed ${msg.role === 'tree' ? 'whitespace-pre-wrap' : ''}`}>
                {msg.content}
              </div>
              {msg.configChanges && msg.configChanges.length > 0 && (
                <div className="mt-2 pt-2 border-t border-purple-200 text-[9px] text-purple-700">
                  <span className="font-semibold">Configuration changes detected:</span>
                  <ul className="mt-1 space-y-0.5 list-disc list-inside">
                    {msg.configChanges.map((change: any, cIdx: number) => (
                      <li key={cIdx}>
                        {change.type} {change.node}: {change.action} to {(change.value * 100).toFixed(0)}%
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}

        {sending && (
          <div className="text-left">
            <div className="inline-block max-w-[80%] p-2 rounded bg-relic-ghost border border-relic-mist">
              <div className="text-[8px] text-relic-silver uppercase mb-0.5">Tree</div>
              <div className="text-relic-slate italic">Thinking...</div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="p-2 border-t border-relic-mist bg-relic-ghost">
        <div className="flex flex-wrap gap-1">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => setInput(action)}
              className="text-[8px] font-mono px-1.5 py-0.5 border border-relic-mist bg-white hover:bg-relic-ghost transition-colors"
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-2 border-t border-relic-mist">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask the tree... (e.g., 'What is Binah?' or 'Increase compassion')"
            className="flex-1 text-[10px] font-mono border border-relic-mist px-2 py-1 focus:outline-none focus:border-purple-300 bg-white"
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="px-2 py-1 text-[9px] font-mono bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
