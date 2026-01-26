'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sefirah, SEPHIROTH_METADATA } from '@/lib/ascent-tracker'

interface SefirotMiniSelectorProps {
  selectedSefirah: Sefirah | null
  currentWeight: number  // 0.0-1.0
  onWeightChange: (sefirah: Sefirah, weight: number) => void
  onQuerySubmit?: (sefirah: Sefirah, query: string) => void
}

export default function SefirotMiniSelector({
  selectedSefirah,
  currentWeight,
  onWeightChange,
  onQuerySubmit
}: SefirotMiniSelectorProps) {
  const [query, setQuery] = useState('')
  const [isSending, setIsSending] = useState(false)

  // Empty state when no Sefirah selected
  if (!selectedSefirah) {
    return (
      <div className="fixed right-6 top-24 w-80 bg-white border border-relic-slate/20 rounded-lg p-4 shadow-lg z-40">
        <div className="text-[10px] text-relic-silver text-center font-mono">
          Click a Sefirah to configure
        </div>
      </div>
    )
  }

  const meta = SEPHIROTH_METADATA[selectedSefirah]
  const percentage = Math.round(currentWeight * 100)

  const handleSubmitQuery = async () => {
    if (!query.trim() || isSending) return

    setIsSending(true)
    try {
      await onQuerySubmit?.(selectedSefirah, query)
      setQuery('') // Clear after submit
    } catch (error) {
      console.error('Query error:', error)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={selectedSefirah}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.2 }}
        className="fixed right-6 top-24 w-80 bg-white border border-relic-slate/20 rounded-lg shadow-lg z-40"
      >
        {/* Header */}
        <div className="border-b border-relic-slate/20 px-4 py-3">
          <div className="flex items-center gap-2">
            <span
              className="text-[14px]"
              style={{ color: meta.color }}
            >
              {meta.hebrewName}
            </span>
            <div className="flex-1">
              <div
                className="text-[11px] font-mono uppercase tracking-[0.1em]"
                style={{ color: meta.color }}
              >
                {meta.name}
              </div>
              <div className="text-[9px] text-relic-slate">
                {meta.meaning}
              </div>
            </div>
          </div>
        </div>

        {/* Influence Slider */}
        <div className="px-4 py-3 border-b border-relic-slate/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] uppercase text-relic-silver tracking-wider">
              Influence
            </span>
            <span
              className="text-[10px] font-mono font-semibold"
              style={{ color: meta.color }}
            >
              {percentage}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={percentage}
            onChange={(e) => onWeightChange(selectedSefirah, parseInt(e.target.value) / 100)}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${meta.color} 0%, ${meta.color} ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`
            }}
          />
        </div>

        {/* Query Section */}
        <div className="px-4 py-3">
          <div className="text-[9px] uppercase text-relic-silver tracking-wider mb-2">
            Query this Sefirah
          </div>
          <div className="space-y-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmitQuery()}
              placeholder={`Ask ${meta.name}...`}
              disabled={isSending}
              className="w-full text-[10px] font-mono border border-relic-slate/20 px-3 py-2 rounded focus:outline-none focus:border-relic-slate disabled:bg-relic-ghost disabled:text-relic-silver"
            />
            <button
              onClick={handleSubmitQuery}
              disabled={isSending || !query.trim()}
              className="w-full px-3 py-2 text-[9px] font-mono uppercase tracking-wider bg-relic-void text-white hover:bg-relic-slate transition-colors disabled:bg-relic-mist disabled:cursor-not-allowed rounded"
            >
              {isSending ? 'Asking...' : `Ask ${meta.name}`}
            </button>
          </div>
        </div>

        {/* Description Footer */}
        <div className="px-4 py-2 bg-relic-ghost/50 text-[8px] text-relic-slate border-t border-relic-slate/10 rounded-b-lg">
          {meta.aiRole}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
