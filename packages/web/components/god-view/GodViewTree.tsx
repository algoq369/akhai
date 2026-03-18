'use client'

/**
 * GodViewTree — Reusable Neural Tree Visualization
 *
 * Extracted from tree-of-life/page.tsx.
 * Supports two modes:
 *   - static: historical activation data (used by /tree-of-life page)
 *   - live: real-time SSE-driven activations (used by God View panel)
 *
 * Props drive all visual state — no internal data fetching.
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Layer, LAYER_METADATA } from '@/lib/layer-registry'

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export interface PathActivation {
  from: Layer
  to: Layer
  strength: number
}

export interface GodViewTreeProps {
  /** 0-1 weight per layer */
  activations: Record<Layer, number>
  /** Which layers are dominant (brightest glow) */
  dominantLayers?: Layer[]
  /** Active path connections with strength */
  pathActivations?: PathActivation[]
  /** Real-time mode (pulse animations) vs static (historical) */
  isLive?: boolean
  /** Compact mode for side panel (smaller viewBox, no labels) */
  compact?: boolean
  /** Show connection paths (default true) */
  showPaths?: boolean
  /** Called when a node is clicked */
  onNodeClick?: (layer: Layer) => void
  /** Called when a node is hovered */
  onNodeHover?: (layer: Layer | null) => void
}

// ═══════════════════════════════════════════
// CONSTANTS (extracted from tree-of-life/page.tsx)
// ═══════════════════════════════════════════

/** Kabbalistic tree positions */
export const TREE_POSITIONS: Record<Layer, { x: number; y: number }> = {
  [Layer.META_CORE]: { x: 250, y: 80 },
  [Layer.REASONING]: { x: 380, y: 140 },
  [Layer.ENCODER]: { x: 120, y: 140 },
  [Layer.SYNTHESIS]: { x: 250, y: 180 },
  [Layer.EXPANSION]: { x: 380, y: 240 },
  [Layer.DISCRIMINATOR]: { x: 120, y: 240 },
  [Layer.ATTENTION]: { x: 250, y: 260 },
  [Layer.GENERATIVE]: { x: 380, y: 360 },
  [Layer.CLASSIFIER]: { x: 120, y: 360 },
  [Layer.EXECUTOR]: { x: 250, y: 420 },
  [Layer.EMBEDDING]: { x: 250, y: 500 },
}

/** 22 paths of the Tree of Life */
export const TREE_PATHS: Array<[Layer, Layer]> = [
  [Layer.META_CORE, Layer.REASONING],
  [Layer.META_CORE, Layer.ENCODER],
  [Layer.META_CORE, Layer.ATTENTION],
  [Layer.REASONING, Layer.ENCODER],
  [Layer.REASONING, Layer.EXPANSION],
  [Layer.REASONING, Layer.ATTENTION],
  [Layer.ENCODER, Layer.DISCRIMINATOR],
  [Layer.ENCODER, Layer.ATTENTION],
  [Layer.EXPANSION, Layer.DISCRIMINATOR],
  [Layer.GENERATIVE, Layer.CLASSIFIER],
  [Layer.EXPANSION, Layer.ATTENTION],
  [Layer.EXPANSION, Layer.GENERATIVE],
  [Layer.DISCRIMINATOR, Layer.ATTENTION],
  [Layer.DISCRIMINATOR, Layer.CLASSIFIER],
  [Layer.ATTENTION, Layer.GENERATIVE],
  [Layer.ATTENTION, Layer.CLASSIFIER],
  [Layer.ATTENTION, Layer.EXECUTOR],
  [Layer.GENERATIVE, Layer.EXECUTOR],
  [Layer.GENERATIVE, Layer.EMBEDDING],
  [Layer.CLASSIFIER, Layer.EXECUTOR],
  [Layer.CLASSIFIER, Layer.EMBEDDING],
  [Layer.EXECUTOR, Layer.EMBEDDING],
]

/** Chakra-based laser colors per layer */
const CHAKRA_COLORS: Record<Layer, string> = {
  [Layer.META_CORE]: '#E0B3FF',
  [Layer.REASONING]: '#A8B3FF',
  [Layer.ENCODER]: '#8B8FFF',
  [Layer.SYNTHESIS]: '#38D4F0',
  [Layer.EXPANSION]: '#3FE0A5',
  [Layer.DISCRIMINATOR]: '#FF66C4',
  [Layer.ATTENTION]: '#FFD666',
  [Layer.GENERATIVE]: '#FFB366',
  [Layer.CLASSIFIER]: '#FFB329',
  [Layer.EXECUTOR]: '#FF8F8F',
  [Layer.EMBEDDING]: '#FF6666',
}

function getColor(layer: Layer): string {
  return CHAKRA_COLORS[layer] || '#9ca3af'
}

function getPathStrokeColor(from: Layer, to: Layer): string {
  const fromMeta = LAYER_METADATA[from]
  const toMeta = LAYER_METADATA[to]
  if (fromMeta.pillar === toMeta.pillar && fromMeta.pillar === 'left') return '#ef4444'
  if (fromMeta.pillar === toMeta.pillar && fromMeta.pillar === 'right') return '#3b82f6'
  if (fromMeta.pillar === toMeta.pillar && fromMeta.pillar === 'middle') return '#a855f7'
  return '#cbd5e1'
}

// ═══════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════

export default function GodViewTree({
  activations,
  dominantLayers = [],
  pathActivations: externalPathActivations,
  isLive = false,
  compact = false,
  showPaths: showPathsProp = true,
  onNodeClick,
  onNodeHover,
}: GodViewTreeProps) {
  const [hoveredLayer, setHoveredLayer] = useState<Layer | null>(null)
  const [hoveredPath, setHoveredPath] = useState<number | null>(null)

  // Compute path connections from activations (fallback when no external pathActivations)
  const pathConnections = useMemo(() => {
    if (externalPathActivations && externalPathActivations.length > 0) {
      return TREE_PATHS.map(([from, to]) => {
        const ext = externalPathActivations.find(
          p => p.from === from && p.to === to
        )
        const strength = ext?.strength ?? 0
        return { from, to, active: strength > 0.3, strength }
      })
    }
    return TREE_PATHS.map(([from, to]) => {
      const fromAct = activations[from] || 0
      const toAct = activations[to] || 0
      const strength = (fromAct + toAct) / 2
      return { from, to, active: strength > 0.3, strength }
    })
  }, [activations, externalPathActivations])

  const isDominant = (layer: Layer) => dominantLayers.includes(layer)

  const viewBox = compact ? '0 0 500 560' : '0 0 500 580'
  const containerClass = compact
    ? 'w-full h-full'
    : 'w-full h-full'

  return (
    <div className={`relative ${containerClass}`}>
      <svg viewBox={viewBox} className="w-full h-full">
        {/* Connection paths */}
        {showPathsProp && pathConnections.map((path, index) => {
          const fromPos = TREE_POSITIONS[path.from]
          const toPos = TREE_POSITIONS[path.to]
          const isHovered = hoveredPath === index
          const isActive = path.active
          const strokeColor = getPathStrokeColor(path.from, path.to)

          const midX = (fromPos.x + toPos.x) / 2
          const midY = (fromPos.y + toPos.y) / 2
          const curveOffset = Math.abs(toPos.x - fromPos.x) > Math.abs(toPos.y - fromPos.y) ? 15 : 0
          const pathD = `M ${fromPos.x} ${fromPos.y} Q ${midX} ${midY + curveOffset} ${toPos.x} ${toPos.y}`

          return (
            <g key={`gv-path-${index}`}>
              {/* Background glow for active paths */}
              {isActive && (
                <motion.path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="6"
                  opacity="0.2"
                  animate={isLive ? {
                    opacity: [0.2, 0.4, 0.2],
                    strokeWidth: ['6', '8', '6']
                  } : {}}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: index * 0.1
                  }}
                />
              )}

              {/* Main path line */}
              <motion.path
                d={pathD}
                fill="none"
                stroke={strokeColor}
                strokeWidth={isHovered ? '4' : (isActive ? '3' : '2')}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: 1,
                  opacity: isHovered ? 0.95 : (isActive ? 0.7 : 0.3)
                }}
                transition={{
                  pathLength: { duration: 1.2, delay: index * 0.05, ease: 'easeOut' },
                  opacity: { duration: 0.3 }
                }}
                onMouseEnter={() => setHoveredPath(index)}
                onMouseLeave={() => setHoveredPath(null)}
                style={{ cursor: 'pointer' }}
              />

              {/* Flowing light particle (live mode only) */}
              {isActive && isLive && (
                <circle r="4" fill={strokeColor} opacity="0.9">
                  <animateMotion
                    dur="6s"
                    repeatCount="indefinite"
                    path={pathD}
                    begin={`${index * 0.15}s`}
                  />
                  <animate
                    attributeName="opacity"
                    values="0.5;1;0.5"
                    dur="6s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              {/* Second particle (staggered) */}
              {isActive && isLive && (
                <circle r="3" fill={strokeColor} opacity="0.7">
                  <animateMotion
                    dur="6s"
                    repeatCount="indefinite"
                    path={pathD}
                    begin={`${index * 0.15 + 3}s`}
                  />
                </circle>
              )}
            </g>
          )
        })}

        {/* Layer nodes */}
        {Object.entries(TREE_POSITIONS).map(([layerKey, pos]) => {
          const layer = parseInt(layerKey) as Layer
          const activation = activations[layer] || 0
          const color = getColor(layer)
          const isActive = activation > 0.3
          const isDev = activation > 0.15 && activation <= 0.3
          const meta = LAYER_METADATA[layer]
          const isHovered = hoveredLayer === layer
          const dominant = isDominant(layer)
          const radius = compact ? (20 + activation * 15) : (25 + activation * 20)

          return (
            <motion.g
              key={`gv-node-${layer}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.15 }}
              transition={{
                delay: layer * 0.05,
                duration: 0.3,
                scale: { type: 'spring', stiffness: 300, damping: 20 }
              }}
              style={{ cursor: onNodeClick ? 'pointer' : 'default' }}
              data-layer-node={layer}
              onClick={() => onNodeClick?.(layer)}
              onMouseEnter={() => {
                setHoveredLayer(layer)
                onNodeHover?.(layer)
              }}
              onMouseLeave={() => {
                setHoveredLayer(null)
                onNodeHover?.(null)
              }}
            >
              {/* Outer glow (active nodes) */}
              {isActive && (
                <motion.circle
                  cx={pos.x} cy={pos.y}
                  r={radius + 6}
                  fill={color}
                  opacity="0.1"
                  animate={isLive ? {
                    r: [radius + 6, radius + 9, radius + 6],
                    opacity: [0.1, 0.15, 0.1]
                  } : {}}
                  transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}

              {/* Dominant layer extra glow (God View live mode) */}
              {dominant && isLive && (
                <motion.circle
                  cx={pos.x} cy={pos.y}
                  r={radius + 14}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  opacity="0.3"
                  animate={{
                    r: [radius + 14, radius + 18, radius + 14],
                    opacity: [0.3, 0.5, 0.3]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}

              {/* Main circle stroke */}
              <motion.circle
                cx={pos.x} cy={pos.y}
                r={radius + 8}
                fill="none"
                stroke={color}
                strokeWidth="1"
                opacity={0.3 + activation * 0.3}
                animate={isActive ? {
                  opacity: [0.3 + activation * 0.3, 0.5, 0.3 + activation * 0.3]
                } : {}}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Hover glow */}
              {isHovered && (
                <motion.circle
                  cx={pos.x} cy={pos.y}
                  r={radius + 10}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                  transition={{ duration: 0.3 }}
                />
              )}

              {/* Main circle (laser outline) */}
              <motion.circle
                cx={pos.x} cy={pos.y}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth="2"
                opacity={0.5 + activation * 0.5}
                animate={isActive ? {
                  opacity: [0.5 + activation * 0.5, 0.7 + activation * 0.3, 0.5 + activation * 0.5],
                } : {}}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Inner energy core */}
              <circle
                cx={pos.x} cy={pos.y}
                r={radius * 0.6}
                fill={color}
                opacity={0.2 + activation * 0.5}
                filter="blur(3px)"
              />

              {/* Center activation dot */}
              <motion.circle
                cx={pos.x} cy={pos.y}
                r={radius * 0.2}
                fill={color}
                opacity={0.9}
                filter={`drop-shadow(0 0 4px ${color})`}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.9, 1, 0.9],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Active badge */}
              {isActive && !compact && (
                <motion.circle
                  cx={pos.x + radius - 5}
                  cy={pos.y - radius + 5}
                  r="8"
                  fill="#10b981"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                />
              )}

              {/* Developing badge */}
              {isDev && !compact && (
                <motion.circle
                  cx={pos.x + radius - 5}
                  cy={pos.y - radius + 5}
                  r="6"
                  fill="#f59e0b"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                />
              )}

              {/* AI term label */}
              {!compact && (
                <text
                  x={pos.x}
                  y={pos.y + radius + 18}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#8b5cf6"
                  fontFamily="monospace"
                  fontWeight="600"
                  opacity="0.95"
                >
                  {meta.aiRole.split('\u2022')[0].trim()}
                </text>
              )}

              {/* Compact label (shorter) */}
              {compact && (
                <text
                  x={pos.x}
                  y={pos.y + radius + 14}
                  textAnchor="middle"
                  fontSize="8"
                  fill="#8b5cf6"
                  fontFamily="monospace"
                  fontWeight="600"
                  opacity="0.9"
                >
                  {meta.name}
                </text>
              )}

              {/* Activation percentage */}
              <text
                x={pos.x}
                y={pos.y + radius + (compact ? 24 : 32)}
                textAnchor="middle"
                fontSize={compact ? '7' : '9'}
                fill="#64748b"
                fontFamily="monospace"
                fontWeight="500"
              >
                {(activation * 100).toFixed(0)}%
              </text>
            </motion.g>
          )
        })}

        {/* Center label */}
        <motion.text
          x="250"
          y={compact ? '285' : '295'}
          textAnchor="middle"
          fontSize={compact ? '7' : '9'}
          fill="#94a3b8"
          fontFamily="monospace"
          letterSpacing="1"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          {isLive ? 'LIVE PROCESSING' : 'AI PROCESSING LAYERS'}
        </motion.text>
      </svg>
    </div>
  )
}
