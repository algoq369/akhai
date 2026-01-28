'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChatBubbleLeftRightIcon, 
  PaperAirplaneIcon,
  XMarkIcon,
  SparklesIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline'

interface MiniChatProps {
  selectedNode?: { id: string; name: string; category?: string } | null
  onSendQuery: (query: string) => void
  isOpen: boolean
  onToggle: () => void
}

export default function MiniChat({ selectedNode, onSendQuery, isOpen, onToggle }: MiniChatProps) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (selectedNode) {
      setInput(`Tell me more about ${selectedNode.name}`)
    }
  }, [selectedNode])

  const quickActions = [
    { icon: SparklesIcon, label: 'Analyze', query: `Analyze ${selectedNode?.name || 'this topic'} in depth` },
    { icon: LinkIcon, label: 'Connect', query: `Find connections for ${selectedNode?.name || 'this topic'}` },
    { icon: MagnifyingGlassIcon, label: 'Explore', query: `Explore related topics to ${selectedNode?.name || 'this'}` },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      onSendQuery(input)
      setInput('')
    }
  }

  return (
    <div className="absolute bottom-4 left-4 z-50">
      {/* Toggle Button */}
      <motion.button
        onClick={onToggle}
        className={`p-3 rounded-full shadow-lg transition-all ${
          isOpen 
            ? 'bg-indigo-600 text-white' 
            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? <XMarkIcon className="w-5 h-5" /> : <ChatBubbleLeftRightIcon className="w-5 h-5" />}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="absolute bottom-16 left-0 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
              <div className="flex items-center gap-2">
                <LightBulbIcon className="w-4 h-4" />
                <h3 className="font-semibold text-sm">Quick Query</h3>
              </div>
              {selectedNode && (
                <p className="text-xs text-white/80 mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                  Context: {selectedNode.name}
                </p>
              )}
            </div>

            {/* Quick Actions */}
            {selectedNode && (
              <div className="p-2 border-b border-slate-200 dark:border-slate-700 flex gap-1.5">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => onSendQuery(action.query)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <action.icon className="w-3.5 h-3.5" />
                    {action.label}
                  </button>
                ))}
              </div>
            )}

            {/* Suggestions when no node selected */}
            {!selectedNode && (
              <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Try asking:</p>
                <div className="space-y-1.5">
                  {[
                    'What topics have I explored most?',
                    'Find connections between my ideas',
                    'Suggest new research directions'
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => onSendQuery(suggestion)}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything..."
                  className="flex-1 px-3 py-2.5 text-sm bg-slate-100 dark:bg-slate-700 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-200 placeholder-slate-400"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="p-2.5 bg-indigo-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-600 transition-colors"
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
