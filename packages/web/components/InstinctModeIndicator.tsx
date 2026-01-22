'use client'

import { useSettingsStore } from '@/lib/stores/settings-store'
import { SEVEN_LENSES } from '@/lib/instinct-mode'

export function InstinctModeIndicator() {
  const { settings } = useSettingsStore()
  const { instinctMode, instinctConfig } = settings

  if (!instinctMode) return null

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="flex items-center gap-2 px-2 py-1 border-b border-relic-mist">
        <div className="flex items-center gap-1">
          {SEVEN_LENSES.map((lens) => (
            <span
              key={lens.id}
              className={
                instinctConfig.activeLenses.includes(lens.id)
                  ? 'text-xs transition-opacity text-relic-slate opacity-100'
                  : 'text-xs transition-opacity text-relic-silver opacity-30'
              }
              title={lens.name}
            >
              {lens.symbol}
            </span>
          ))}
        </div>
        <span className="text-relic-silver text-xs font-mono uppercase tracking-widest">
          instinct
        </span>
      </div>
    </div>
  )
}
