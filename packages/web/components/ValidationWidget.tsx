'use client'

import { useEffect, useState } from 'react'
import { useImplementationStore } from '@/lib/stores/implementation-store'
import { ValidationPrompt } from './ValidationPrompt'

export function ValidationWidget() {
  const { pending, fetchPending } = useImplementationStore()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    fetchPending()
    const interval = setInterval(fetchPending, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [fetchPending])

  if (pending.length === 0) return null

  return (
    <div className="fixed bottom-20 left-6 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-amber-600/20 border border-amber-500/50 text-amber-600 dark:text-amber-400 px-3 py-2 text-[10px] uppercase tracking-wider flex items-center gap-2 hover:bg-amber-600/30 transition-colors"
      >
        <div className="w-2 h-2 bg-amber-500 animate-pulse" />
        {pending.length} PENDING VALIDATION
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="absolute bottom-12 left-0 w-96 max-h-[60vh] overflow-auto bg-relic-white dark:bg-zinc-950 border border-relic-mist dark:border-zinc-700 shadow-2xl">
          <div className="p-3 border-b border-relic-mist dark:border-zinc-800 flex justify-between items-center">
            <span className="text-[10px] uppercase tracking-wider text-relic-silver dark:text-zinc-400">
              PENDING VALIDATIONS
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-relic-silver dark:text-zinc-500 hover:text-relic-void dark:hover:text-zinc-300"
            >
              ✕
            </button>
          </div>
          <div className="space-y-3 p-3">
            {pending.map((impl) => (
              <ValidationPrompt
                key={impl.id}
                implementation={impl}
                onComplete={() => {
                  if (pending.length <= 1) setIsOpen(false)
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
