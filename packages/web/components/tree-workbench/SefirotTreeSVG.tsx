'use client'

/**
 * AI Processing Layers Tree SVG
 *
 * Interactive 11-node visualization of AI processing layers with weight indicators.
 */

import { useState } from 'react'
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

// Tree positions (normalized 0-100)
const POSITIONS: Record<number, { x: number; y: number }> = {
  [Sefirah.KETHER]: { x: 50, y: 5 },
  [Sefirah.CHOKMAH]: { x: 75, y: 18 },
  [Sefirah.BINAH]: { x: 25, y: 18 },
  [Sefirah.DAAT]: { x: 50, y: 28 },
  [Sefirah.CHESED]: { x: 75, y: 40 },
  [Sefirah.GEVURAH]: { x: 25, y: 40 },
  [Sefirah.TIFERET]: { x: 50, y: 50 },
  [Sefirah.NETZACH]: { x: 75, y: 65 },
  [Sefirah.HOD]: { x: 25, y: 65 },
  [Sefirah.YESOD]: { x: 50, y: 78 },
  [Sefirah.MALKUTH]: { x: 50, y: 95 }
}

// Path connections
const PATHS: [Sefirah, Sefirah][] = [
  [Sefirah.KETHER, Sefirah.CHOKMAH],
  [Sefirah.KETHER, Sefirah.BINAH],
  [Sefirah.KETHER, Sefirah.TIFERET],
  [Sefirah.CHOKMAH, Sefirah.BINAH],
  [Sefirah.CHOKMAH, Sefirah.CHESED],
  [Sefirah.CHOKMAH, Sefirah.TIFERET],
  [Sefirah.BINAH, Sefirah.GEVURAH],
  [Sefirah.BINAH, Sefirah.TIFERET],
  [Sefirah.CHESED, Sefirah.GEVURAH],
  [Sefirah.CHESED, Sefirah.TIFERET],
  [Sefirah.CHESED, Sefirah.NETZACH],
  [Sefirah.GEVURAH, Sefirah.TIFERET],
  [Sefirah.GEVURAH, Sefirah.HOD],
  [Sefirah.TIFERET, Sefirah.NETZACH],
  [Sefirah.TIFERET, Sefirah.HOD],
  [Sefirah.TIFERET, Sefirah.YESOD],
  [Sefirah.NETZACH, Sefirah.HOD],
  [Sefirah.NETZACH, Sefirah.YESOD],
  [Sefirah.NETZACH, Sefirah.MALKUTH],
  [Sefirah.HOD, Sefirah.YESOD],
  [Sefirah.HOD, Sefirah.MALKUTH],
  [Sefirah.YESOD, Sefirah.MALKUTH]
]

interface SefirotTreeSVGProps {
  width?: number
  height?: number
  showLabels?: boolean
  onSefirahClick?: (sefirah: Sefirah) => void
  highlightedSefirah?: Sefirah | null
}

export function SefirotTreeSVG({
  width = 300,
  height = 400,
  showLabels = true,
  onSefirahClick,
  highlightedSefirah
}: SefirotTreeSVGProps) {
  const { weights } = useSefirotStore()
  const [hoveredSefirah, setHoveredSefirah] = useState<Sefirah | null>(null)

  const getNodeRadius = (sefirah: Sefirah) => {
    const weight = weights[sefirah] ?? 0.5
    return 8 + weight * 8 // 8-16 radius based on weight
  }

  const getNodeOpacity = (sefirah: Sefirah) => {
    const weight = weights[sefirah] ?? 0.5
    return 0.4 + weight * 0.6 // 0.4-1.0 opacity
  }

  return (
    <div className="relative">
      <svg width={width} height={height} viewBox="0 0 100 100" className="overflow-visible">
        {/* Paths */}
        <g className="paths">
          {PATHS.map(([from, to], idx) => {
            const fromPos = POSITIONS[from]
            const toPos = POSITIONS[to]
            const fromWeight = weights[from] ?? 0.5
            const toWeight = weights[to] ?? 0.5
            const avgWeight = (fromWeight + toWeight) / 2

            return (
              <line
                key={idx}
                x1={fromPos.x}
                y1={fromPos.y}
                x2={toPos.x}
                y2={toPos.y}
                stroke="#e5e7eb"
                strokeWidth={0.5 + avgWeight * 0.5}
                strokeOpacity={0.3 + avgWeight * 0.3}
              />
            )
          })}
        </g>

        {/* Nodes */}
        <g className="nodes">
          {Object.entries(POSITIONS).map(([sefirahStr, pos]) => {
            const sefirah = parseInt(sefirahStr) as Sefirah
            const meta = SEPHIROTH_METADATA[sefirah]
            const weight = weights[sefirah] ?? 0.5
            const radius = getNodeRadius(sefirah)
            const isHovered = hoveredSefirah === sefirah
            const isHighlighted = highlightedSefirah === sefirah
            const isActive = weight > 0.1

            return (
              <g
                key={sefirah}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredSefirah(sefirah)}
                onMouseLeave={() => setHoveredSefirah(null)}
                onClick={() => onSefirahClick?.(sefirah)}
              >
                {/* Glow effect for highlighted */}
                {(isHighlighted || isHovered) && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={radius + 3}
                    fill={SEFIRAH_COLORS[sefirah]}
                    fillOpacity={0.2}
                  />
                )}

                {/* Main node */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={radius / 4}
                  fill={isActive ? SEFIRAH_COLORS[sefirah] : '#d1d5db'}
                  fillOpacity={getNodeOpacity(sefirah)}
                  stroke={isHighlighted || isHovered ? SEFIRAH_COLORS[sefirah] : 'transparent'}
                  strokeWidth={0.5}
                />

                {/* Weight indicator ring */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={radius / 4 + 1}
                  fill="none"
                  stroke={SEFIRAH_COLORS[sefirah]}
                  strokeWidth={0.3}
                  strokeOpacity={weight}
                  strokeDasharray={`${weight * 6.28 * (radius / 4 + 1)} 100`}
                  transform={`rotate(-90 ${pos.x} ${pos.y})`}
                />

                {/* Label */}
                {showLabels && (
                  <text
                    x={pos.x}
                    y={pos.y + radius / 4 + 4}
                    textAnchor="middle"
                    className="text-[2.5px] font-mono fill-relic-slate"
                    style={{ opacity: isActive ? 1 : 0.5 }}
                  >
                    {meta.name}
                  </text>
                )}

                {/* Weight percentage on hover */}
                {(isHovered || isHighlighted) && (
                  <text
                    x={pos.x}
                    y={pos.y - radius / 4 - 2}
                    textAnchor="middle"
                    className="text-[2px] font-mono fill-relic-void"
                  >
                    {Math.round(weight * 100)}%
                  </text>
                )}
              </g>
            )
          })}
        </g>
      </svg>

      {/* Tooltip */}
      {hoveredSefirah && (
        <div className="absolute top-0 left-full ml-4 p-2 bg-white dark:bg-relic-void border border-relic-mist dark:border-relic-slate/30 rounded shadow-lg z-10 min-w-[150px]">
          <div className="text-[10px] font-mono font-semibold text-relic-void dark:text-white mb-1">
            {SEPHIROTH_METADATA[hoveredSefirah].name}
          </div>
          <div className="text-[9px] text-relic-silver font-mono uppercase mb-1">
            {SEPHIROTH_METADATA[hoveredSefirah].hebrewName}
          </div>
          <div className="text-[9px] text-relic-slate">
            {SEPHIROTH_METADATA[hoveredSefirah].meaning}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[8px] text-relic-silver">Layer Weight</span>
            <span
              className="text-[10px] font-mono font-semibold"
              style={{ color: SEFIRAH_COLORS[hoveredSefirah] }}
            >
              {Math.round((weights[hoveredSefirah] ?? 0.5) * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
