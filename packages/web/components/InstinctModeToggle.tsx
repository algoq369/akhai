'use client'

import { useSettingsStore } from '@/lib/stores/settings-store'

export function InstinctModeToggle() {
  const { settings, setInstinctMode } = useSettingsStore()
  const instinctMode = settings.instinctMode

  return (
    <button
      onClick={() => setInstinctMode(!instinctMode)}
      className={
        instinctMode
          ? 'flex items-center gap-2 px-3 py-1.5 font-mono text-xs transition-all text-amber-400 bg-amber-950/30 border border-amber-800/50'
          : 'flex items-center gap-2 px-3 py-1.5 font-mono text-xs transition-all text-zinc-500 hover:text-zinc-300 border border-transparent'
      }
    >
      <span
        className={
          instinctMode
            ? 'w-2 h-2 rounded-full transition-all bg-amber-400 shadow-lg shadow-amber-500/50'
            : 'w-2 h-2 rounded-full transition-all bg-zinc-600'
        }
      />
      <span className="uppercase tracking-wider">
        {instinctMode ? '⚡ instinct' : '○ standard'}
      </span>
    </button>
  )
}
