'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSideCanalStore, type RefinementType } from '@/lib/stores/side-canal-store'

interface LiveRefinementCanalProps {
  isVisible: boolean
  isLoading?: boolean
}

const TYPE_COLORS: Record<RefinementType, { bg: string; text: string }> = {
  refine: { bg: 'bg-indigo-500/15 dark:bg-indigo-400/20', text: 'text-indigo-600 dark:text-indigo-400' },
  enhance: { bg: 'bg-emerald-500/15 dark:bg-emerald-400/20', text: 'text-emerald-600 dark:text-emerald-400' },
  correct: { bg: 'bg-amber-500/15 dark:bg-amber-400/20', text: 'text-amber-600 dark:text-amber-400' },
  instruct: { bg: 'bg-slate-500/15 dark:bg-slate-400/20', text: 'text-slate-600 dark:text-slate-400' },
}

export default function LiveRefinementCanal({ isVisible, isLoading }: LiveRefinementCanalProps) {
  const [input, setInput] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const liveRefinements = useSideCanalStore((s) => s.liveRefinements)
  const addRefinement = useSideCanalStore((s) => s.addRefinement)
  const clearRefinements = useSideCanalStore((s) => s.clearRefinements)

  // Auto-scroll to bottom when new refinements added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [liveRefinements.length])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const trimmed = input.trim()
    if (!trimmed) return
    addRefinement(trimmed)
    setInput('')
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="max-w-3xl mx-auto px-6 mb-2"
        >
          <div className="border border-relic-mist/20 dark:border-relic-slate/20 rounded-md bg-white/50 dark:bg-relic-void/50 overflow-hidden">
            {/* Header toggle */}
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="w-full flex items-center justify-between px-3 py-1 text-[9px] font-mono uppercase tracking-wider text-relic-silver dark:text-relic-slate hover:text-relic-slate dark:hover:text-relic-silver transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <span className={`transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`}>&#9662;</span>
                live refinement
                {liveRefinements.length > 0 && (
                  <span className="text-indigo-500 dark:text-indigo-400">{liveRefinements.length}</span>
                )}
              </span>
              {liveRefinements.length > 0 && (
                <span
                  onClick={(e) => {
                    e.stopPropagation()
                    clearRefinements()
                  }}
                  className="text-[8px] text-relic-silver/60 hover:text-amber-500 dark:hover:text-amber-400 cursor-pointer transition-colors"
                >
                  clear
                </span>
              )}
            </button>

            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  {/* Scrollable refinement history */}
                  {liveRefinements.length > 0 && (
                    <div
                      ref={scrollRef}
                      className="max-h-[80px] overflow-y-auto px-3 py-1 space-y-0.5 scrollbar-thin"
                    >
                      {liveRefinements.map((r) => {
                        const colors = TYPE_COLORS[r.type]
                        return (
                          <div key={r.id} className="flex items-start gap-1.5 text-[10px] font-mono">
                            <span className={`inline-block px-1 py-0 rounded ${colors.bg} ${colors.text} text-[8px] leading-relaxed flex-shrink-0`}>
                              {r.type}
                            </span>
                            <span className="text-relic-slate dark:text-relic-silver leading-relaxed break-words">
                              {r.text}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Input */}
                  <form onSubmit={handleSubmit} className="px-3 pb-2 pt-1">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="refine &middot; enhance &middot; correct &middot; instruct..."
                      disabled={isLoading}
                      className="w-full text-[10px] font-mono bg-transparent border border-relic-mist/15 dark:border-relic-slate/15 rounded px-2 py-1 text-relic-void dark:text-relic-ghost placeholder:text-relic-silver/40 dark:placeholder:text-relic-slate/40 focus:outline-none focus:border-indigo-400/50 dark:focus:border-indigo-500/50 transition-colors disabled:opacity-40"
                    />
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
