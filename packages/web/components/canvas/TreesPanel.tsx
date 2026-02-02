'use client'

/**
 * TREES PANEL
 * 
 * Compact visualization of Ascent (Sefirot) and Descent (Qliphoth) trees.
 * Designed to fit within a draggable panel on the canvas.
 */

import { motion } from 'framer-motion'
import { Sefirah } from '@/lib/ascent-tracker'

// Node colors matching the main tree visualization
const NODE_COLORS: Record<number, string> = {
  [Sefirah.KETHER]: '#a78bfa',
  [Sefirah.CHOKMAH]: '#818cf8',
  [Sefirah.BINAH]: '#6366f1',
  [Sefirah.DAAT]: '#22d3ee',
  [Sefirah.CHESED]: '#34d399',
  [Sefirah.GEVURAH]: '#f87171',
  [Sefirah.TIFERET]: '#fbbf24',
  [Sefirah.NETZACH]: '#fb923c',
  [Sefirah.HOD]: '#facc15',
  [Sefirah.YESOD]: '#a3a3a3',
  [Sefirah.MALKUTH]: '#78716c',
}

const AI_LABELS: Record<number, string> = {
  [Sefirah.KETHER]: 'meta',
  [Sefirah.CHOKMAH]: 'reason',
  [Sefirah.BINAH]: 'know',
  [Sefirah.DAAT]: 'verify',
  [Sefirah.CHESED]: 'expand',
  [Sefirah.GEVURAH]: 'critic',
  [Sefirah.TIFERET]: 'synth',
  [Sefirah.NETZACH]: 'persist',
  [Sefirah.HOD]: 'comm',
  [Sefirah.YESOD]: 'found',
  [Sefirah.MALKUTH]: 'output',
}

// Compact tree positions
const TREE_POSITIONS: Record<number, { x: number; y: number }> = {
  [Sefirah.KETHER]: { x: 75, y: 15 },
  [Sefirah.CHOKMAH]: { x: 120, y: 45 },
  [Sefirah.BINAH]: { x: 30, y: 45 },
  [Sefirah.DAAT]: { x: 75, y: 70 },
  [Sefirah.CHESED]: { x: 120, y: 100 },
  [Sefirah.GEVURAH]: { x: 30, y: 100 },
  [Sefirah.TIFERET]: { x: 75, y: 130 },
  [Sefirah.NETZACH]: { x: 120, y: 160 },
  [Sefirah.HOD]: { x: 30, y: 160 },
  [Sefirah.YESOD]: { x: 75, y: 190 },
  [Sefirah.MALKUTH]: { x: 75, y: 220 },
}

const TREE_PATHS: [Sefirah, Sefirah][] = [
  [Sefirah.KETHER, Sefirah.CHOKMAH], [Sefirah.KETHER, Sefirah.BINAH],
  [Sefirah.KETHER, Sefirah.TIFERET], [Sefirah.CHOKMAH, Sefirah.BINAH],
  [Sefirah.CHOKMAH, Sefirah.CHESED], [Sefirah.BINAH, Sefirah.GEVURAH],
  [Sefirah.CHESED, Sefirah.GEVURAH], [Sefirah.CHESED, Sefirah.TIFERET],
  [Sefirah.GEVURAH, Sefirah.TIFERET], [Sefirah.TIFERET, Sefirah.NETZACH],
  [Sefirah.TIFERET, Sefirah.HOD], [Sefirah.TIFERET, Sefirah.YESOD],
  [Sefirah.NETZACH, Sefirah.HOD], [Sefirah.NETZACH, Sefirah.YESOD],
  [Sefirah.HOD, Sefirah.YESOD], [Sefirah.YESOD, Sefirah.MALKUTH],
]

const ALL_LAYERS = [
  Sefirah.KETHER, Sefirah.CHOKMAH, Sefirah.BINAH, Sefirah.DAAT,
  Sefirah.CHESED, Sefirah.GEVURAH, Sefirah.TIFERET,
  Sefirah.NETZACH, Sefirah.HOD, Sefirah.YESOD, Sefirah.MALKUTH
]

// Qliphoth data for descent tree
const QLIPHOTH_DATA = [
  { id: 1, name: 'contradict', severity: 'critical', x: 110, y: 20 },
  { id: 2, name: 'hide src', severity: 'high', x: 40, y: 20 },
  { id: 3, name: 'block', severity: 'critical', x: 75, y: 55 },
  { id: 4, name: 'drift', severity: 'high', x: 120, y: 85 },
  { id: 5, name: 'echo', severity: 'medium', x: 30, y: 85 },
  { id: 6, name: 'arrogant', severity: 'medium', x: 75, y: 115 },
  { id: 7, name: 'overload', severity: 'medium', x: 120, y: 145 },
  { id: 8, name: 'overconf', severity: 'high', x: 30, y: 145 },
  { id: 9, name: 'hallucin', severity: 'critical', x: 75, y: 175 },
  { id: 10, name: 'false cert', severity: 'high', x: 120, y: 205 },
  { id: 11, name: 'verbose', severity: 'medium', x: 30, y: 205 },
  { id: 12, name: 'shallow', severity: 'high', x: 75, y: 235 },
]

interface TreesPanelProps {
  type: 'ascent' | 'descent'
  weights?: Record<number, number>
  onNodeClick?: (nodeId: number | string) => void
  compact?: boolean
}

export function TreesPanel({ type, weights = {}, onNodeClick, compact = false }: TreesPanelProps) {
  const getWeight = (layer: Sefirah): number => weights[layer] ?? 0.5
  const viewBox = compact ? '0 0 150 250' : '0 0 150 250'
  const height = compact ? 180 : 220

  if (type === 'ascent') {
    return (
      <div className="p-2">
        <div className="text-center text-[8px] uppercase tracking-wider text-relic-slate mb-1">
          AI Processing Layers
        </div>
        <svg viewBox={viewBox} className="w-full" style={{ height }}>
          {/* Paths */}
          {TREE_PATHS.map(([from, to], idx) => {
            const fromPos = TREE_POSITIONS[from]
            const toPos = TREE_POSITIONS[to]
            const avgWeight = ((weights[from] ?? 0.5) + (weights[to] ?? 0.5)) / 2
            return (
              <line
                key={idx}
                x1={fromPos.x}
                y1={fromPos.y}
                x2={toPos.x}
                y2={toPos.y}
                stroke="#cbd5e1"
                strokeWidth={0.5 + avgWeight}
                opacity={0.3 + avgWeight * 0.4}
              />
            )
          })}
          {/* Nodes */}
          {ALL_LAYERS.map((layer) => {
            const pos = TREE_POSITIONS[layer]
            const weight = getWeight(layer)
            const color = NODE_COLORS[layer]
            const radius = 8 + weight * 4
            
            return (
              <g
                key={layer}
                className="cursor-pointer"
                onClick={() => onNodeClick?.(layer)}
              >
                {/* Glow */}
                <circle cx={pos.x} cy={pos.y} r={radius + 3} fill={color} opacity={0.15} />
                {/* Main circle */}
                <circle cx={pos.x} cy={pos.y} r={radius} fill="white" stroke={color} strokeWidth="1.5" />
                {/* Inner fill */}
                <circle cx={pos.x} cy={pos.y} r={radius * weight * 0.6} fill={color} opacity={0.4} />
                {/* Percentage */}
                <text x={pos.x} y={pos.y + 2} textAnchor="middle" fontSize="6" fill="#374151" fontWeight="500">
                  {Math.round(weight * 100)}
                </text>
                {/* Label */}
                {!compact && (
                  <text x={pos.x} y={pos.y - radius - 3} textAnchor="middle" fontSize="5" fill="#9ca3af">
                    {AI_LABELS[layer]}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
        {/* Legend */}
        <div className="flex justify-center gap-2 mt-1 text-[6px] text-relic-silver">
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Active</span>
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Dev</span>
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-neutral-300" /> Plan</span>
        </div>
      </div>
    )
  }

  // Descent Tree (Qliphoth)
  return (
    <div className="p-2">
      <div className="text-center text-[8px] uppercase tracking-wider text-red-400 mb-1">
        Anti-Pattern Monitors
      </div>
      <svg viewBox={viewBox} className="w-full" style={{ height }}>
        {QLIPHOTH_DATA.map((node) => {
          const isCritical = node.severity === 'critical'
          const isHigh = node.severity === 'high'
          const radius = isCritical ? 10 : isHigh ? 8 : 6
          const color = isCritical ? '#ef4444' : isHigh ? '#f97316' : '#fbbf24'
          
          return (
            <g key={node.id} className="cursor-pointer" onClick={() => onNodeClick?.(node.id)}>
              {/* Glow */}
              {isCritical && <circle cx={node.x} cy={node.y} r={radius + 6} fill={color} opacity={0.1} />}
              <circle cx={node.x} cy={node.y} r={radius + 3} fill={color} opacity={0.15} />
              {/* Main circle */}
              <circle cx={node.x} cy={node.y} r={radius} fill="white" stroke={color} strokeWidth={isCritical ? 1.5 : 1} />
              {/* Inner dot */}
              <circle cx={node.x} cy={node.y} r={radius * 0.4} fill={color} opacity={0.5} />
              {/* Label */}
              {!compact && (
                <text x={node.x} y={node.y - radius - 3} textAnchor="middle" fontSize="5" fill="#9ca3af">
                  {node.name}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      {/* Legend */}
      <div className="flex justify-center gap-2 mt-1 text-[6px] text-relic-silver">
        <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Crit</span>
        <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> High</span>
        <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Med</span>
      </div>
    </div>
  )
}

export default TreesPanel
