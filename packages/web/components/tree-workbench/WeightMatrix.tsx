'use client'

/**
 * Layer Weight Matrix
 *
 * 11-row grid with sliders for each AI processing layer weight configuration.
 */

import { Sefirah, SEPHIROTH_METADATA } from '@/lib/ascent-tracker'
import { useSefirotStore } from '@/lib/stores/sefirot-store'

const SEFIRAH_COLORS: Record<number, string> = {
  [Sefirah.MALKUTH]: '#92400e',
  [Sefirah.YESOD]: '#94a3b8',
  [Sefirah.HOD]: '#eab308',
  [Sefirah.NETZACH]: '#f97316',
  [Sefirah.TIFERET]: '#22c55e',
  [Sefirah.GEVURAH]: '#dc2626',
  [Sefirah.CHESED]: '#06b6d4',
  [Sefirah.BINAH]: '#3b82f6',
  [Sefirah.CHOKMAH]: '#4f46e5',
  [Sefirah.KETHER]: '#9333ea',
  [Sefirah.DAAT]: '#06b6d4'
}

const SEFIRAH_SYMBOLS: Record<number, string> = {
  [Sefirah.MALKUTH]: '⊕',
  [Sefirah.YESOD]: '◐',
  [Sefirah.HOD]: '⬡',
  [Sefirah.NETZACH]: '◉',
  [Sefirah.TIFERET]: '✡',
  [Sefirah.GEVURAH]: '⚗',
  [Sefirah.CHESED]: '◯',
  [Sefirah.BINAH]: '⊙',
  [Sefirah.CHOKMAH]: '☿',
  [Sefirah.KETHER]: '◈',
  [Sefirah.DAAT]: '◬'
}

interface WeightMatrixProps {
  compact?: boolean
  showLabels?: boolean
  onChange?: (weights: Record<number, number>) => void
}

export function WeightMatrix({ compact = false, showLabels = true, onChange }: WeightMatrixProps) {
  const { weights, setWeight, activePreset } = useSefirotStore()

  const handleWeightChange = (sefirah: number, value: number) => {
    setWeight(sefirah, value)
    onChange?.({ ...weights, [sefirah]: value })
  }

  const sefirotOrder = [
    Sefirah.KETHER,
    Sefirah.CHOKMAH,
    Sefirah.BINAH,
    Sefirah.DAAT,
    Sefirah.CHESED,
    Sefirah.GEVURAH,
    Sefirah.TIFERET,
    Sefirah.NETZACH,
    Sefirah.HOD,
    Sefirah.YESOD,
    Sefirah.MALKUTH
  ]

  return (
    <div className="space-y-1">
      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between mb-3 px-2">
          <h4 className="text-[10px] uppercase tracking-[0.15em] text-relic-slate font-mono">
            Layer Weights
          </h4>
          {activePreset && (
            <span className="text-[9px] text-purple-600 font-mono">
              {activePreset}
            </span>
          )}
        </div>
      )}

      {/* Grid */}
      <div className={`grid ${compact ? 'gap-1' : 'gap-2'}`}>
        {sefirotOrder.map(sefirah => {
          const meta = SEPHIROTH_METADATA[sefirah]
          const weight = weights[sefirah] ?? 0.5
          const percentage = Math.round(weight * 100)

          return (
            <div
              key={sefirah}
              className={`flex items-center gap-2 ${compact ? 'px-1' : 'px-2 py-1'} rounded hover:bg-relic-ghost dark:hover:bg-relic-slate/10 transition-colors`}
            >
              {/* Symbol */}
              <span
                className={`${compact ? 'text-[10px]' : 'text-sm'} w-5 text-center`}
                style={{ color: SEFIRAH_COLORS[sefirah] }}
              >
                {SEFIRAH_SYMBOLS[sefirah]}
              </span>

              {/* Name */}
              {showLabels && (
                <div className={`${compact ? 'w-16' : 'w-24'} flex-shrink-0`}>
                  <div className={`${compact ? 'text-[9px]' : 'text-[11px]'} font-mono text-relic-void dark:text-white truncate`}>
                    {meta.name}
                  </div>
                  {!compact && (
                    <div className="text-[8px] text-relic-silver truncate">
                      {meta.aiRole?.split('•')[0]?.trim() || ''}
                    </div>
                  )}
                </div>
              )}

              {/* Slider */}
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={percentage}
                  onChange={e => handleWeightChange(sefirah, parseInt(e.target.value) / 100)}
                  className="flex-1 h-1 bg-relic-mist dark:bg-relic-slate/30 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-3
                    [&::-webkit-slider-thumb]:h-3
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:cursor-pointer"
                  style={{
                    // @ts-ignore - CSS custom property
                    '--slider-color': SEFIRAH_COLORS[sefirah],
                    backgroundImage: `linear-gradient(to right, ${SEFIRAH_COLORS[sefirah]} ${percentage}%, transparent ${percentage}%)`
                  }}
                />
                <span className={`${compact ? 'text-[9px] w-8' : 'text-[10px] w-10'} font-mono text-relic-slate text-right`}>
                  {percentage}%
                </span>
              </div>

              {/* Toggle */}
              <button
                onClick={() => handleWeightChange(sefirah, weight > 0.1 ? 0 : 0.5)}
                className={`${compact ? 'text-[9px]' : 'text-[10px]'} w-4 text-center`}
                style={{ color: weight > 0.1 ? SEFIRAH_COLORS[sefirah] : '#94a3b8' }}
              >
                {weight > 0.1 ? '●' : '○'}
              </button>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      {!compact && (
        <div className="mt-3 pt-3 border-t border-relic-mist dark:border-relic-slate/20 px-2">
          <div className="flex items-center justify-between text-[9px] font-mono text-relic-silver">
            <span>{Object.values(weights).filter(w => w > 0.1).length}/11 active</span>
            <span>avg: {Math.round(Object.values(weights).reduce((a, b) => a + b, 0) / 11 * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  )
}
