'use client'

/**
 * Hermetic Console
 *
 * Settings-style console for toggling 7 Hermetic Laws
 * Similar to instinct console but for Hermetic law activation
 */

import { useState, useEffect } from 'react'

interface HermeticConsoleProps {
  onLawsChange?: (activeLaws: Record<string, boolean>) => void
}

const HERMETIC_LAWS = [
  { key: 'mentalism', name: 'MENT', full: 'Mentalism', shortcut: '1', description: 'All is mind; thoughts create reality' },
  { key: 'correspondence', name: 'CORR', full: 'Correspondence', shortcut: '2', description: 'As above, so below; macro/micro patterns' },
  { key: 'vibration', name: 'VIBR', full: 'Vibration', shortcut: '3', description: 'Everything moves and vibrates' },
  { key: 'polarity', name: 'POLAR', full: 'Polarity', shortcut: '4', description: 'Everything has opposites' },
  { key: 'rhythm', name: 'RHYTH', full: 'Rhythm', shortcut: '5', description: 'Everything flows in cycles' },
  { key: 'causeEffect', name: 'CAUSE', full: 'Cause & Effect', shortcut: '6', description: 'Every cause has an effect' },
  { key: 'gender', name: 'GEND', full: 'Gender', shortcut: '7', description: 'Creative and receptive principles' },
]

export default function HermeticConsole({ onLawsChange }: HermeticConsoleProps) {
  const [activeLaws, setActiveLaws] = useState<Record<string, boolean>>({
    mentalism: true,
    correspondence: true,
    vibration: true,
    polarity: true,
    rhythm: true,
    causeEffect: true,
    gender: true,
  })

  const toggleLaw = (lawKey: string) => {
    setActiveLaws((prev) => {
      const updated = { ...prev, [lawKey]: !prev[lawKey] }
      if (onLawsChange) {
        onLawsChange(updated)
      }
      return updated
    })
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return

      const law = HERMETIC_LAWS.find((l) => l.shortcut === e.key)
      if (law) {
        toggleLaw(law.key)
        e.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  return (
    <div className="border-y border-relic-mist bg-white py-2 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center gap-6 text-[9px] font-mono">
          {/* Section Label */}
          <div className="flex items-center gap-2">
            <span className="text-relic-silver uppercase tracking-[0.2em]">▸ HERMETIC LAWS</span>
          </div>

          {/* Law Toggles */}
          {HERMETIC_LAWS.map((law, idx) => (
            <div key={law.key} className="flex items-center gap-2">
              {idx > 0 && <span className="text-relic-mist">│</span>}

              <button
                onClick={() => toggleLaw(law.key)}
                className="flex items-center gap-1 hover:text-relic-void transition-colors group"
                title={`${law.full}: ${law.description}`}
              >
                <span className={activeLaws[law.key] ? 'text-purple-600' : 'text-relic-silver'}>
                  {activeLaws[law.key] ? '◆' : '◇'}
                </span>
                <span
                  className={`uppercase tracking-wider ${activeLaws[law.key] ? 'text-relic-void' : 'text-relic-silver'}`}
                >
                  {law.name}
                </span>
                <kbd className="text-[7px] text-relic-silver ml-0.5 group-hover:text-relic-void">
                  {law.shortcut}
                </kbd>
              </button>
            </div>
          ))}

          {/* Active Count */}
          <div className="flex items-center gap-2 ml-4">
            <span className="text-relic-mist">│</span>
            <span className="text-relic-silver">
              {Object.values(activeLaws).filter(Boolean).length}/7 active
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
