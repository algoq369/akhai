'use client'

import { motion } from 'framer-motion'
import type { Level } from '@/lib/stores/levels-store'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface TreesCompactProps {
  level: Level
  onStartConnection?: (elementId: string, elementType: 'layer') => void
  onCompleteConnection?: (elementId: string, elementType: 'layer') => void
  connectionMode?: boolean
}

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const LAYER_NAMES: Record<number, string> = {
  10: 'meta-cognition',
  9: 'first-principles',
  8: 'pattern-recognition',
  11: 'emergence',
  7: 'expansion',
  6: 'critical-analysis',
  5: 'synthesis',
  4: 'persistence',
  3: 'communication',
  2: 'foundation',
  1: 'manifestation',
}

const NODE_COLORS: Record<number, string> = {
  10: '#a78bfa', // Meta-Core - meta-cognition
  9: '#818cf8', // Reasoning - first-principles
  8: '#6366f1', // Encoder - pattern-recognition
  11: '#22d3ee', // Synthesis - emergent-insight
  7: '#34d399', // Expansion - expansion
  6: '#f87171', // Discriminator - critical-analysis
  5: '#fbbf24', // Attention - synthesis
  4: '#fb923c', // Generative - persistence
  3: '#facc15', // Classifier - communication
  2: '#a3a3a3', // Executor - foundation
  1: '#78716c', // Embedding - manifestation
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#fbbf24',
  low: '#22c55e',
}

const ANTIPATTERN_DATA = [
  { id: 'thaumiel', name: 'dual contradictions', severity: 'critical' },
  { id: 'ghagiel', name: 'blocking intent', severity: 'high' },
  { id: 'satariel', name: 'hiding sources', severity: 'high' },
  { id: 'synthesis-shadow', name: 'hallucination', severity: 'critical' },
  { id: 'instability', name: 'info overload', severity: 'medium' },
  { id: 'golachab', name: 'over-confidence', severity: 'high' },
  { id: 'vanity', name: 'arrogant tone', severity: 'medium' },
  { id: 'harab', name: 'repetitive echo', severity: 'medium' },
  { id: 'toxicity', name: 'deception', severity: 'high' },
  { id: 'gamaliel', name: 'verbose padding', severity: 'medium' },
  { id: 'manipulation', name: 'superficial output', severity: 'high' },
] as const

const TREE_POSITIONS = [
  { id: 10, x: 0, y: 0 },
  { id: 9, x: -20, y: 30 },
  { id: 8, x: 20, y: 30 },
  { id: 11, x: 0, y: 60 },
  { id: 7, x: -20, y: 90 },
  { id: 6, x: 20, y: 90 },
  { id: 5, x: 0, y: 120 },
  { id: 4, x: -20, y: 150 },
  { id: 3, x: 20, y: 150 },
  { id: 2, x: 0, y: 180 },
  { id: 1, x: 0, y: 210 },
]

// Connection lines between tree nodes (shared by both trees)
const CONNECTIONS = [
  [0, 0, -20, 30],
  [0, 0, 20, 30],
  [-20, 30, 0, 60],
  [20, 30, 0, 60],
  [0, 60, -20, 90],
  [0, 60, 20, 90],
  [-20, 90, 0, 120],
  [20, 90, 0, 120],
  [0, 120, -20, 150],
  [0, 120, 20, 150],
  [-20, 150, 0, 180],
  [20, 150, 0, 180],
  [0, 180, 0, 210],
]

// ═══════════════════════════════════════════════════════════════════
// SVG GLOW FILTER
// ═══════════════════════════════════════════════════════════════════

function GlowDefs() {
  return (
    <defs>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  )
}

// ═══════════════════════════════════════════════════════════════════
// CONNECTION LINES
// ═══════════════════════════════════════════════════════════════════

function TreeConnections() {
  return (
    <g
      stroke="#e5e7eb"
      strokeWidth="1"
      fill="none"
      className="dark:stroke-neutral-700"
    >
      {CONNECTIONS.map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
      ))}
    </g>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function TreesCompact({
  level,
  onStartConnection,
  onCompleteConnection,
  connectionMode,
}: TreesCompactProps) {
  const { activeLayerWeights, detectedAntiPatterns } = level

  // Determine node state from weight
  const getNodeState = (id: number): 'active' | 'developing' | 'inactive' => {
    const weight = activeLayerWeights[id] || 0
    if (weight > 0.5) return 'active'
    if (weight >= 0.2) return 'developing'
    return 'inactive'
  }

  const isAntiPatternDetected = (id: string) =>
    detectedAntiPatterns.includes(id)

  // Find dominant layer
  const entries = Object.entries(activeLayerWeights)
  const dominantEntry =
    entries.length > 0
      ? entries.sort(([, a], [, b]) => b - a)[0]
      : null

  const antiPatternCount = detectedAntiPatterns.length

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
      {/* Header */}
      <div className="flex border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex-1 px-2 py-1.5 text-center">
          <span className="text-[8px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Ascent
          </span>
        </div>
        <div className="flex-1 border-l border-neutral-100 px-2 py-1.5 text-center dark:border-neutral-800">
          <span className="text-[8px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Descent
          </span>
        </div>
      </div>

      {/* Trees */}
      <div className="flex min-h-0 flex-1">
        {/* Ascent Tree */}
        <div className="flex-1 p-2">
          <svg viewBox="-40 -10 80 240" className="h-full w-full">
            <GlowDefs />
            <TreeConnections />

            {TREE_POSITIONS.map((pos) => {
              const state = getNodeState(pos.id)
              const color = NODE_COLORS[pos.id] || '#a3a3a3'

              return (
                <motion.g
                  key={pos.id}
                  className="cursor-pointer"
                  onClick={() => {
                    if (connectionMode && onCompleteConnection) {
                      onCompleteConnection(`layer-${pos.id}`, 'layer')
                    } else if (!connectionMode && onStartConnection) {
                      onStartConnection(`layer-${pos.id}`, 'layer')
                    }
                  }}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {state === 'active' && (
                    <motion.circle
                      cx={pos.x}
                      cy={pos.y}
                      r="9"
                      fill="none"
                      stroke={color}
                      strokeWidth="0.5"
                      opacity="0.4"
                      animate={{ r: [9, 12, 9], opacity: [0.4, 0, 0.4] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  )}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={state === 'active' ? 6 : state === 'developing' ? 5 : 4}
                    fill={
                      state === 'inactive'
                        ? '#f3f4f6'
                        : state === 'developing'
                          ? color
                          : color
                    }
                    stroke={
                      state === 'inactive' ? '#d4d4d8' : color
                    }
                    strokeWidth="1"
                    opacity={state === 'developing' ? 0.5 : 1}
                    filter={state === 'active' ? 'url(#glow)' : undefined}
                    className={
                      state === 'inactive'
                        ? 'dark:fill-neutral-800 dark:stroke-neutral-600'
                        : ''
                    }
                  />
                  <title>
                    L{pos.id} {LAYER_NAMES[pos.id]} (
                    {Math.round((activeLayerWeights[pos.id] || 0) * 100)}%)
                  </title>
                </motion.g>
              )
            })}
          </svg>
        </div>

        {/* Descent Tree */}
        <div className="flex-1 border-l border-neutral-100 p-2 dark:border-neutral-800">
          <svg viewBox="-40 -10 80 240" className="h-full w-full">
            <GlowDefs />
            <TreeConnections />

            {ANTIPATTERN_DATA.map((pattern, idx) => {
              const pos = TREE_POSITIONS[idx] || { x: 0, y: idx * 20 }
              const isDetected = isAntiPatternDetected(pattern.id)
              const severityColor =
                SEVERITY_COLORS[pattern.severity] || '#fbbf24'

              return (
                <motion.g
                  key={pattern.id}
                  className="cursor-pointer"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isDetected && (
                    <motion.circle
                      cx={pos.x}
                      cy={pos.y}
                      r="9"
                      fill="none"
                      stroke={severityColor}
                      strokeWidth="0.5"
                      opacity="0.4"
                      animate={{ opacity: [0.4, 0.8, 0.4] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  )}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isDetected ? 6 : 4}
                    fill={isDetected ? severityColor : '#1a1a1a'}
                    stroke={
                      isDetected ? severityColor : severityColor
                    }
                    strokeWidth="1"
                    opacity={isDetected ? 1 : 0.3}
                    filter={isDetected ? 'url(#glow)' : undefined}
                    className={
                      isDetected
                        ? ''
                        : 'dark:fill-neutral-900 dark:stroke-neutral-700'
                    }
                  />
                  <title>
                    {pattern.name} [{pattern.severity}]
                  </title>
                </motion.g>
              )
            })}
          </svg>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="border-t border-neutral-100 px-2 py-1.5 text-[9px] text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
        {dominantEntry && (
          <div>
            L{dominantEntry[0]} {LAYER_NAMES[parseInt(dominantEntry[0])]} dominant
          </div>
        )}
        {antiPatternCount === 0 ? (
          <div className="text-emerald-600 dark:text-emerald-500">
            No anti-patterns
          </div>
        ) : (
          <div className="text-amber-600 dark:text-amber-500">
            {antiPatternCount} anti-pattern{antiPatternCount > 1 ? 's' : ''}{' '}
            detected
          </div>
        )}
      </div>
    </div>
  )
}

export default TreesCompact
