'use client'

/**
 * ASCII Sefirot Tree Component
 *
 * Clean white minimalist style matching Settings page.
 * Uses box-drawing characters with light grey lines.
 * No colors, no glows, just clean typography.
 */

import { useSefirotStore } from '@/lib/stores/sefirot-store'
import { SEPHIROTH_METADATA, Sefirah } from '@/lib/ascent-tracker'

export function ASCIISefirotTree() {
  const { weights, setWeight } = useSefirotStore()

  // Helper to get percentage for display
  const getPercentage = (level: number) => {
    return Math.round((weights[level] || 0.5) * 100)
  }

  // Helper to render sefirah node with inline input
  const renderNode = (level: number) => {
    const meta = SEPHIROTH_METADATA[level as Sefirah]
    const aiParts = meta.aiComputation.split('•').map((s: string) => s.trim())
    const aiName = aiParts[0] || 'Unknown'
    const percentage = getPercentage(level)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value)
      if (!isNaN(val) && val >= 0 && val <= 100) {
        setWeight(level, val / 100)
      }
    }

    return (
      <div className="inline-block text-center min-w-[80px]">
        {/* AI Computation Name */}
        <div className="text-[11px] text-neutral-700">
          {aiName}
        </div>

        {/* Sefirah Name */}
        <div className="text-[9px] text-neutral-400">{meta.name}</div>

        {/* Inline Number Input */}
        <div className="flex items-center justify-center gap-1 mt-1">
          <input
            type="number"
            min="0"
            max="100"
            value={percentage}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur()
              }
            }}
            className="w-12 px-1 py-0.5 text-[11px] text-center text-neutral-600 bg-neutral-50 border border-neutral-200 rounded focus:outline-none focus:border-neutral-400 transition-colors"
          />
          <span className="text-[10px] text-neutral-400">%</span>
        </div>
      </div>
    )
  }

  // Line style - light grey
  const lineClass = 'text-neutral-200'

  return (
    <div className="text-[11px] leading-tight select-none py-2">
      <div className="flex flex-col items-center space-y-1">
        {/* Kether - Top */}
        {renderNode(10)}

        {/* Vertical line */}
        <div className={lineClass}>│</div>

        {/* Branch to supernal triad */}
        <div className={lineClass}>┌───────────┼───────────┐</div>

        {/* Binah and Chokmah */}
        <div className="flex justify-center gap-16">
          {renderNode(8)}
          {renderNode(9)}
        </div>

        {/* Lines from supernal to Da'at */}
        <div className="flex justify-center items-center gap-16">
          <div className={lineClass}>│</div>
          <div className={lineClass}>│</div>
        </div>
        <div className={lineClass}>└───────────┬───────────┘</div>

        {/* Da'at - Hidden knowledge */}
        <div className={lineClass}>│</div>
        {renderNode(11)}

        {/* Vertical line */}
        <div className={lineClass}>│</div>

        {/* Branch to ethical triad */}
        <div className={lineClass}>┌───────────┼───────────┐</div>

        {/* Gevurah and Chesed */}
        <div className="flex justify-center gap-16">
          {renderNode(6)}
          {renderNode(7)}
        </div>

        {/* Lines to Tiferet */}
        <div className="flex justify-center items-center gap-16">
          <div className={lineClass}>│</div>
          <div className={lineClass}>│</div>
        </div>
        <div className={lineClass}>└───────────┬───────────┘</div>

        {/* Tiferet - Heart center */}
        <div className={lineClass}>│</div>
        {renderNode(5)}

        {/* Vertical line */}
        <div className={lineClass}>│</div>

        {/* Branch to astral triad */}
        <div className={lineClass}>┌───────────┼───────────┐</div>

        {/* Hod and Netzach */}
        <div className="flex justify-center gap-16">
          {renderNode(3)}
          {renderNode(4)}
        </div>

        {/* Lines to Yesod */}
        <div className="flex justify-center items-center gap-16">
          <div className={lineClass}>│</div>
          <div className={lineClass}>│</div>
        </div>
        <div className={lineClass}>└───────────┬───────────┘</div>

        {/* Yesod - Foundation */}
        <div className={lineClass}>│</div>
        {renderNode(2)}

        {/* Final line to Malkuth */}
        <div className={lineClass}>│</div>

        {/* Malkuth - Bottom */}
        {renderNode(1)}
      </div>
    </div>
  )
}
