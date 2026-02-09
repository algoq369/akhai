'use client'

/**
 * TREES PANEL
 * 
 * Compact visualization of Ascent (Layers) and Descent (Antipatterns) trees.
 * Designed to fit within a draggable panel on the canvas.
 */

import { motion } from 'framer-motion'
import { Layer } from '@/lib/layer-registry'

// Node colors matching the main tree visualization
const NODE_COLORS: Record<number, string> = {
  [Layer.META_CORE]: '#a78bfa',
  [Layer.REASONING]: '#818cf8',
  [Layer.ENCODER]: '#6366f1',
  [Layer.SYNTHESIS]: '#22d3ee',
  [Layer.EXPANSION]: '#34d399',
  [Layer.DISCRIMINATOR]: '#f87171',
  [Layer.ATTENTION]: '#fbbf24',
  [Layer.GENERATIVE]: '#fb923c',
  [Layer.CLASSIFIER]: '#facc15',
  [Layer.EXECUTOR]: '#a3a3a3',
  [Layer.EMBEDDING]: '#78716c',
}

const AI_LABELS: Record<number, string> = {
  [Layer.META_CORE]: 'meta',
  [Layer.REASONING]: 'reason',
  [Layer.ENCODER]: 'know',
  [Layer.SYNTHESIS]: 'verify',
  [Layer.EXPANSION]: 'expand',
  [Layer.DISCRIMINATOR]: 'critic',
  [Layer.ATTENTION]: 'synth',
  [Layer.GENERATIVE]: 'persist',
  [Layer.CLASSIFIER]: 'comm',
  [Layer.EXECUTOR]: 'found',
  [Layer.EMBEDDING]: 'output',
}

// Compact tree positions
const TREE_POSITIONS: Record<number, { x: number; y: number }> = {
  [Layer.META_CORE]: { x: 75, y: 15 },
  [Layer.REASONING]: { x: 120, y: 45 },
  [Layer.ENCODER]: { x: 30, y: 45 },
  [Layer.SYNTHESIS]: { x: 75, y: 70 },
  [Layer.EXPANSION]: { x: 120, y: 100 },
  [Layer.DISCRIMINATOR]: { x: 30, y: 100 },
  [Layer.ATTENTION]: { x: 75, y: 130 },
  [Layer.GENERATIVE]: { x: 120, y: 160 },
  [Layer.CLASSIFIER]: { x: 30, y: 160 },
  [Layer.EXECUTOR]: { x: 75, y: 190 },
  [Layer.EMBEDDING]: { x: 75, y: 220 },
}

const TREE_PATHS: [Layer, Layer][] = [
  [Layer.META_CORE, Layer.REASONING], [Layer.META_CORE, Layer.ENCODER],
  [Layer.META_CORE, Layer.ATTENTION], [Layer.REASONING, Layer.ENCODER],
  [Layer.REASONING, Layer.EXPANSION], [Layer.ENCODER, Layer.DISCRIMINATOR],
  [Layer.EXPANSION, Layer.DISCRIMINATOR], [Layer.EXPANSION, Layer.ATTENTION],
  [Layer.DISCRIMINATOR, Layer.ATTENTION], [Layer.ATTENTION, Layer.GENERATIVE],
  [Layer.ATTENTION, Layer.CLASSIFIER], [Layer.ATTENTION, Layer.EXECUTOR],
  [Layer.GENERATIVE, Layer.CLASSIFIER], [Layer.GENERATIVE, Layer.EXECUTOR],
  [Layer.CLASSIFIER, Layer.EXECUTOR], [Layer.EXECUTOR, Layer.EMBEDDING],
]

const ALL_LAYERS = [
  Layer.META_CORE, Layer.REASONING, Layer.ENCODER, Layer.SYNTHESIS,
  Layer.EXPANSION, Layer.DISCRIMINATOR, Layer.ATTENTION,
  Layer.GENERATIVE, Layer.CLASSIFIER, Layer.EXECUTOR, Layer.EMBEDDING
]

// Antipatterns data for descent tree
const ANTIPATTERN_DATA = [
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
  const getWeight = (layer: Layer): number => weights[layer] ?? 0.5
  const viewBox = '0 0 150 260'
  const height = 480

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
                {/* Label - always show */}
                <text x={pos.x} y={pos.y - radius - 4} textAnchor="middle" fontSize="6" fill="#6b7280" fontWeight="500">
                  {AI_LABELS[layer]}
                </text>
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

  // Descent Tree (Antipatterns)
  return (
    <div className="p-2">
      <div className="text-center text-[8px] uppercase tracking-wider text-red-400 mb-1">
        Anti-Pattern Monitors
      </div>
      <svg viewBox={viewBox} className="w-full" style={{ height }}>
        {ANTIPATTERN_DATA.map((node) => {
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
              {/* Label - always show */}
              <text x={node.x} y={node.y - radius - 4} textAnchor="middle" fontSize="6" fill="#9ca3af" fontWeight="500">
                {node.name}
              </text>
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
