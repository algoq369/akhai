'use client'

/**
 * ASCII Layers Tree Component
 *
 * Clean white minimalist style matching Settings page.
 * Uses box-drawing characters with light grey lines.
 * No colors, no glows, just clean typography.
 */

import { useLayerStore } from '@/lib/stores/layer-store'
import { LAYER_METADATA, Layer } from '@/lib/layer-registry'

export function ASCIILayersTree() {
  const { weights, setWeight } = useLayerStore()

  // Helper to get percentage for display
  const getPercentage = (level: number) => {
    return Math.round((weights[level] || 0.5) * 100)
  }

  // Helper to render layerNode node with inline input
  const renderNode = (level: number) => {
    const meta = LAYER_METADATA[level as Layer]
    const aiParts = meta.aiRole.split('•').map((s: string) => s.trim())
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

        {/* Layer Name */}
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
        {/* Meta-Core - Top */}
        {renderNode(10)}

        {/* Vertical line */}
        <div className={lineClass}>│</div>

        {/* Branch to supernal triad */}
        <div className={lineClass}>┌───────────┼───────────┐</div>

        {/* Encoder and Reasoning */}
        <div className="flex justify-center gap-16">
          {renderNode(8)}
          {renderNode(9)}
        </div>

        {/* Lines from supernal to Synthesis */}
        <div className="flex justify-center items-center gap-16">
          <div className={lineClass}>│</div>
          <div className={lineClass}>│</div>
        </div>
        <div className={lineClass}>└───────────┬───────────┘</div>

        {/* Synthesis - Hidden knowledge */}
        <div className={lineClass}>│</div>
        {renderNode(11)}

        {/* Vertical line */}
        <div className={lineClass}>│</div>

        {/* Branch to ethical triad */}
        <div className={lineClass}>┌───────────┼───────────┐</div>

        {/* Discriminator and Expansion */}
        <div className="flex justify-center gap-16">
          {renderNode(6)}
          {renderNode(7)}
        </div>

        {/* Lines to Attention */}
        <div className="flex justify-center items-center gap-16">
          <div className={lineClass}>│</div>
          <div className={lineClass}>│</div>
        </div>
        <div className={lineClass}>└───────────┬───────────┘</div>

        {/* Attention - Heart center */}
        <div className={lineClass}>│</div>
        {renderNode(5)}

        {/* Vertical line */}
        <div className={lineClass}>│</div>

        {/* Branch to astral triad */}
        <div className={lineClass}>┌───────────┼───────────┐</div>

        {/* Classifier and Generative */}
        <div className="flex justify-center gap-16">
          {renderNode(3)}
          {renderNode(4)}
        </div>

        {/* Lines to Executor */}
        <div className="flex justify-center items-center gap-16">
          <div className={lineClass}>│</div>
          <div className={lineClass}>│</div>
        </div>
        <div className={lineClass}>└───────────┬───────────┘</div>

        {/* Executor - Foundation */}
        <div className={lineClass}>│</div>
        {renderNode(2)}

        {/* Final line to Embedding */}
        <div className={lineClass}>│</div>

        {/* Embedding - Bottom */}
        {renderNode(1)}
      </div>
    </div>
  )
}
