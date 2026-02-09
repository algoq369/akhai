'use client'

import { useState } from 'react'
import { useSettingsStore } from '@/lib/stores/settings-store'
import { SEVEN_LENSES } from '@/lib/instinct-mode'
import SuperSaiyanIcon from '@/components/SuperSaiyanIcon'

/**
 * INSTINCT MODE CONSOLE
 *
 * Minimalist expandable console showing 7 Hermetic Lenses
 * Uses Layers colors for each lens
 * No backgrounds, no borders - pure raw text
 */

// Map each lens to its Layers color
const LENS_COLORS: Record<string, string> = {
  'exoteric': '#fbbf24',     // amber-400 - Embedding
  'esoteric': '#c084fc',     // purple-400 - Executor
  'gnostic': '#22d3ee',      // cyan-400 - Synthesis
  'hermetic': '#fb923c',     // orange-400 - Classifier
  'kabbalistic': '#facc15',  // yellow-400 - Attention
  'alchemical': '#f87171',   // red-400 - Discriminator
  'prophetic': '#60a5fa',    // blue-400 - Expansion
}

export function InstinctModeConsole() {
  const { settings, setInstinctMode, setInstinctConfig } = useSettingsStore()
  const { instinctMode, instinctConfig } = settings
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleLens = (lensId: string) => {
    const newActiveLenses = instinctConfig.activeLenses.includes(lensId)
      ? instinctConfig.activeLenses.filter(id => id !== lensId)
      : [...instinctConfig.activeLenses, lensId]

    setInstinctConfig({ activeLenses: newActiveLenses })
  }

  // Toggle all lenses - select all if not all active, deselect all if all active
  const toggleAllLenses = () => {
    const allLensIds = SEVEN_LENSES.map(lens => lens.id)
    const allActive = instinctConfig.activeLenses.length === 7

    // If all active, deselect all. If not all active, select all.
    setInstinctConfig({ activeLenses: allActive ? [] : allLensIds })
  }

  // Check if all 7 lenses are active
  const allLensesActive = instinctConfig.activeLenses.length === 7

  if (!instinctMode) {
    return null // Hidden when not active
  }

  return (
    <div className="w-full max-w-2xl font-mono text-[9px] mt-1 px-4">
      {/* Sigils Row - Always visible */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-400 transition-colors"
        >
          {SEVEN_LENSES.map((lens) => {
            const isActive = instinctConfig.activeLenses.includes(lens.id)
            const color = LENS_COLORS[lens.id]
            return (
              <span
                key={lens.id}
                className="text-[11px] cursor-pointer"
                style={{
                  color: isActive ? color : '#71717a',
                  opacity: isActive ? 1 : 0.4
                }}
              >
                {lens.symbol}
              </span>
            )
          })}
        </button>

        {/* Super Saiyan Icon - Toggle all 7 lenses */}
        <button
          onClick={toggleAllLenses}
          className="transition-opacity hover:opacity-80"
          title={allLensesActive ? "Deactivate all 7 hermetic lenses" : "Activate all 7 hermetic lenses"}
        >
          <SuperSaiyanIcon size={14} active={allLensesActive} />
        </button>
      </div>

      {/* Full Detailed Expansion - Right below sigils */}
      {isExpanded && (
        <div className="space-y-0 mt-1">
          {/* Header - minimal */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500 uppercase tracking-[0.15em] text-[8px]">hermetic lenses</span>
              <button
                onClick={toggleAllLenses}
                className="transition-opacity hover:opacity-80"
                title={allLensesActive ? "Deactivate all 7 hermetic lenses" : "Activate all 7 hermetic lenses"}
              >
                <SuperSaiyanIcon size={10} active={allLensesActive} />
              </button>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-zinc-400 hover:text-zinc-500 transition-colors text-[8px]"
            >
              ↑ collapse
            </button>
          </div>

          {/* Full detailed list with descriptions */}
          {SEVEN_LENSES.map((lens) => {
            const isActive = instinctConfig.activeLenses.includes(lens.id)
            const color = LENS_COLORS[lens.id]

            return (
              <button
                key={lens.id}
                onClick={() => toggleLens(lens.id)}
                className="w-full text-left py-0.5 hover:opacity-80 transition-opacity"
              >
                <div className="flex items-baseline gap-1.5">
                  {/* Symbol + Name */}
                  <span
                    className="text-[9px] font-mono"
                    style={{
                      color: isActive ? color : '#a1a1aa',
                      opacity: isActive ? 1 : 0.4
                    }}
                  >
                    {lens.symbol}
                  </span>
                  <span
                    className="uppercase tracking-[0.1em] text-[8px] font-mono min-w-[70px]"
                    style={{
                      color: isActive ? color : '#71717a',
                      opacity: isActive ? 1 : 0.5
                    }}
                  >
                    {lens.name}
                  </span>
                  {/* Description - raw text */}
                  <span className="text-zinc-500 text-[8px] flex-1" style={{ opacity: 0.6 }}>
                    {lens.description}
                  </span>
                  {/* Simple dot indicator */}
                  <span
                    className="text-[8px]"
                    style={{
                      color: isActive ? color : '#d4d4d8',
                      opacity: isActive ? 1 : 0.3
                    }}
                  >
                    {isActive ? '●' : '○'}
                  </span>
                </div>
              </button>
            )
          })}

          {/* Minimal counter */}
          <div className="text-right pt-0.5">
            <span className="text-zinc-400 text-[7px] font-mono">
              {instinctConfig.activeLenses.length}/7
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

