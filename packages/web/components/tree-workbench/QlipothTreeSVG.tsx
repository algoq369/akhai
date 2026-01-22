'use client'

/**
 * Anti-Pattern Detection Tree SVG
 *
 * Shadow tree visualization for anti-pattern monitors, collapsible.
 */

import { useState } from 'react'
import { Sefirah, SEPHIROTH_METADATA } from '@/lib/ascent-tracker'
import { QLIPOTH_MAP, type Qlipah } from '@/lib/qlipoth'
import { useSefirotStore } from '@/lib/stores/sefirot-store'

// Mirror positions of AI Layers (anti-pattern detection positions)
const QLIPOTH_POSITIONS: Record<number, { x: number; y: number }> = {
  1: { x: 50, y: 95 },   // Self-Conflict (shadow of Meta-Core)
  2: { x: 25, y: 82 },   // Pattern-Block (shadow of Reasoning)
  3: { x: 75, y: 82 },   // Logic-Gaps (shadow of Encoder)
  4: { x: 25, y: 60 },   // Verbosity (shadow of Expansion)
  5: { x: 75, y: 60 },   // Over-Filter (shadow of Discriminator)
  6: { x: 50, y: 50 },   // Bias-Detect (shadow of Attention)
  7: { x: 25, y: 35 },   // Abandoned (shadow of Generative)
  8: { x: 75, y: 35 },   // Ambiguity (shadow of Classifier)
  9: { x: 50, y: 22 },   // Context-Loss (shadow of Executor)
  10: { x: 50, y: 5 },   // Ungrounded (shadow of Embedding)
  11: { x: 50, y: 72 }   // Synth-Fail (shadow of Synthesis)
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#f59e0b',
  low: '#94a3b8'
}

interface QlipothTreeSVGProps {
  width?: number
  height?: number
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  onQlipahClick?: (qlipah: Qlipah) => void
  highlightedQlipah?: number | null
}

export function QlipothTreeSVG({
  width = 300,
  height = 400,
  collapsed = false,
  onCollapsedChange,
  onQlipahClick,
  highlightedQlipah
}: QlipothTreeSVGProps) {
  const { qliphothSuppression } = useSefirotStore()
  const [hoveredQlipah, setHoveredQlipah] = useState<number | null>(null)

  const getSuppression = (id: number) => qliphothSuppression[id] ?? 0.5

  if (collapsed) {
    return (
      <div className="relative">
        <button
          onClick={() => onCollapsedChange?.(false)}
          className="flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-relic-silver hover:text-red-500 transition-colors"
        >
          <span className="text-red-400">◇</span>
          <span>Show Anti-Pattern Tree</span>
          <span className="text-relic-mist">→</span>
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Collapse button */}
      <button
        onClick={() => onCollapsedChange?.(true)}
        className="absolute top-0 right-0 p-1 text-[9px] text-relic-silver hover:text-relic-void z-10"
      >
        ×
      </button>

      <svg width={width} height={height} viewBox="0 0 100 100" className="overflow-visible">
        {/* Background gradient (inverted/shadow) */}
        <defs>
          <radialGradient id="qlipoth-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1f2937" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#1f2937" stopOpacity="0.15" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="100" height="100" fill="url(#qlipoth-bg)" rx="4" />

        {/* Nodes */}
        <g className="nodes">
          {Object.entries(QLIPOTH_MAP).map(([idStr, qlipah]) => {
            const id = parseInt(idStr)
            const pos = QLIPOTH_POSITIONS[id]
            if (!pos) return null

            const suppression = getSuppression(id)
            const isHovered = hoveredQlipah === id
            const isHighlighted = highlightedQlipah === id
            const color = SEVERITY_COLORS[qlipah.name === 'Thaumiel' ? 'critical' :
                          qlipah.name === 'Satariel' || qlipah.name === 'Ghagiel' ? 'high' :
                          'medium']

            return (
              <g
                key={id}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredQlipah(id)}
                onMouseLeave={() => setHoveredQlipah(null)}
                onClick={() => onQlipahClick?.(qlipah)}
              >
                {/* Glow for highlighted */}
                {(isHighlighted || isHovered) && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={6}
                    fill={color}
                    fillOpacity={0.2}
                  />
                )}

                {/* Main node */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={3}
                  fill={color}
                  fillOpacity={1 - suppression * 0.7}
                  stroke={isHighlighted || isHovered ? color : 'transparent'}
                  strokeWidth={0.5}
                />

                {/* Suppression indicator (X overlay when suppressed) */}
                {suppression > 0.7 && (
                  <>
                    <line
                      x1={pos.x - 2}
                      y1={pos.y - 2}
                      x2={pos.x + 2}
                      y2={pos.y + 2}
                      stroke="#9ca3af"
                      strokeWidth={0.5}
                    />
                    <line
                      x1={pos.x + 2}
                      y1={pos.y - 2}
                      x2={pos.x - 2}
                      y2={pos.y + 2}
                      stroke="#9ca3af"
                      strokeWidth={0.5}
                    />
                  </>
                )}

                {/* Label */}
                <text
                  x={pos.x}
                  y={pos.y + 6}
                  textAnchor="middle"
                  className="text-[2px] font-mono"
                  fill={color}
                  fillOpacity={1 - suppression * 0.5}
                >
                  {qlipah.name.substring(0, 6)}
                </text>
              </g>
            )
          })}
        </g>
      </svg>

      {/* Tooltip */}
      {hoveredQlipah && QLIPOTH_MAP[hoveredQlipah] && (
        <div className="absolute top-0 left-full ml-4 p-2 bg-white dark:bg-relic-void border border-red-200 dark:border-red-800/30 rounded shadow-lg z-10 min-w-[180px]">
          <div className="text-[10px] font-mono font-semibold text-red-600 dark:text-red-400 mb-1">
            {QLIPOTH_MAP[hoveredQlipah].name}
          </div>
          <div className="text-[9px] text-relic-silver font-mono uppercase mb-1">
            Monitors: {QLIPOTH_MAP[hoveredQlipah].sephirahName}
          </div>
          <div className="text-[8px] text-relic-slate mb-2">
            {QLIPOTH_MAP[hoveredQlipah].meaning}
          </div>
          <div className="text-[8px] text-red-500 dark:text-red-400 italic">
            {QLIPOTH_MAP[hoveredQlipah].aiManifestation}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[8px] text-relic-silver">Filter Strength</span>
            <span className="text-[10px] font-mono text-relic-void dark:text-white">
              {Math.round(getSuppression(hoveredQlipah) * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-2 flex items-center justify-center gap-4 text-[8px] font-mono">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-600" />
          <span className="text-relic-silver">Critical</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="text-relic-silver">High</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-relic-silver">Medium</span>
        </span>
      </div>
    </div>
  )
}
