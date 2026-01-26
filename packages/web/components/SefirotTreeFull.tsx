'use client'

import { motion } from 'framer-motion'
import { Sefirah, SEPHIROTH_METADATA } from '@/lib/ascent-tracker'

interface SefirotTreeFullProps {
  activations: Record<Sefirah, number>
  selectedSefirah?: Sefirah | null
  hoveredSefirah?: Sefirah | null
  onSefirahClick?: (sefirah: Sefirah) => void
  onSefirahHover?: (sefirah: Sefirah | null) => void
  compact?: boolean // If true, reduce to 80% size
  showLabels?: boolean // Always show labels vs hover only
  showPaths?: boolean // Show connection paths
  className?: string
}

/**
 * SefirotTreeFull - Full Tree of Life Visualization
 *
 * Complete Sephiroth tree with:
 * - 11 nodes with 10-layer glow system
 * - 22 connecting paths with animations
 * - AI computation labels
 * - Chakra-based colors
 * - Interactive hover/click states
 *
 * Extracted from tree-of-life page for reusability.
 */
export function SefirotTreeFull({
  activations,
  selectedSefirah = null,
  hoveredSefirah = null,
  onSefirahClick,
  onSefirahHover,
  compact = false,
  showLabels = true,
  showPaths = true,
  className = ''
}: SefirotTreeFullProps) {
  // Tree of Life hierarchical positions (Kabbalistic structure)
  const treePositions: Record<Sefirah, { x: number; y: number }> = {
    // Top - Crown
    [Sefirah.KETHER]: { x: 250, y: 80 },

    // Second row - Supernal Triangle
    [Sefirah.CHOKMAH]: { x: 380, y: 140 },
    [Sefirah.BINAH]: { x: 120, y: 140 },

    // Hidden - Da'at (between supernal and lower)
    [Sefirah.DAAT]: { x: 250, y: 180 },

    // Third row - Ethical Triangle
    [Sefirah.CHESED]: { x: 380, y: 240 },
    [Sefirah.GEVURAH]: { x: 120, y: 240 },
    [Sefirah.TIFERET]: { x: 250, y: 260 },

    // Fourth row - Astral Triangle
    [Sefirah.NETZACH]: { x: 380, y: 360 },
    [Sefirah.HOD]: { x: 120, y: 360 },

    // Fifth row - Foundation
    [Sefirah.YESOD]: { x: 250, y: 420 },

    // Bottom - Kingdom
    [Sefirah.MALKUTH]: { x: 250, y: 500 },
  }

  // Connection paths (22 paths of the Tree of Life)
  const treePaths: Array<[Sefirah, Sefirah]> = [
    // From Kether
    [Sefirah.KETHER, Sefirah.CHOKMAH],
    [Sefirah.KETHER, Sefirah.BINAH],
    [Sefirah.KETHER, Sefirah.TIFERET],
    // Supernal Triangle
    [Sefirah.CHOKMAH, Sefirah.BINAH],
    // From Chokmah
    [Sefirah.CHOKMAH, Sefirah.CHESED],
    [Sefirah.CHOKMAH, Sefirah.TIFERET],
    // From Binah
    [Sefirah.BINAH, Sefirah.GEVURAH],
    [Sefirah.BINAH, Sefirah.TIFERET],
    // Horizontal connections
    [Sefirah.CHESED, Sefirah.GEVURAH],
    [Sefirah.NETZACH, Sefirah.HOD],
    // From Chesed & Gevurah
    [Sefirah.CHESED, Sefirah.TIFERET],
    [Sefirah.CHESED, Sefirah.NETZACH],
    [Sefirah.GEVURAH, Sefirah.TIFERET],
    [Sefirah.GEVURAH, Sefirah.HOD],
    // From Tiferet
    [Sefirah.TIFERET, Sefirah.NETZACH],
    [Sefirah.TIFERET, Sefirah.HOD],
    [Sefirah.TIFERET, Sefirah.YESOD],
    // From Netzach & Hod
    [Sefirah.NETZACH, Sefirah.YESOD],
    [Sefirah.NETZACH, Sefirah.MALKUTH],
    [Sefirah.HOD, Sefirah.YESOD],
    [Sefirah.HOD, Sefirah.MALKUTH],
    // Final path
    [Sefirah.YESOD, Sefirah.MALKUTH],
  ]

  // Chakra-based colors for each Sefirah
  const getColor = (sefirah: Sefirah): string => {
    const chakraColors: Record<Sefirah, string> = {
      [Sefirah.KETHER]: '#E0B3FF',    // Crown Chakra - Brilliant Violet
      [Sefirah.CHOKMAH]: '#A8B3FF',   // Third Eye - Bright Indigo
      [Sefirah.BINAH]: '#8B8FFF',     // Third Eye - Vibrant Indigo
      [Sefirah.DAAT]: '#38D4F0',      // Throat - Bright Cyan
      [Sefirah.CHESED]: '#3FE0A5',    // Heart - Vibrant Emerald
      [Sefirah.GEVURAH]: '#FF66C4',   // Heart - Bright Magenta
      [Sefirah.TIFERET]: '#FFD666',   // Solar Plexus - Bright Gold
      [Sefirah.NETZACH]: '#FFB366',   // Sacral - Bright Orange
      [Sefirah.HOD]: '#FFB329',       // Sacral - Vibrant Amber
      [Sefirah.YESOD]: '#FF8F8F',     // Root/Sacral - Bright Red-Orange
      [Sefirah.MALKUTH]: '#FF6666',   // Root Chakra - Vibrant Ruby
    }
    return chakraColors[sefirah] || '#9ca3af'
  }

  // Generate path connections with metadata
  const pathConnections = treePaths.map(([from, to]) => {
    const fromMeta = SEPHIROTH_METADATA[from]
    const toMeta = SEPHIROTH_METADATA[to]
    const fromActivation = activations[from] || 0
    const toActivation = activations[to] || 0
    const active = fromActivation > 0.3 && toActivation > 0.3

    return {
      from,
      to,
      active,
      fromMeta,
      toMeta
    }
  })

  // Scale factor for compact mode
  const scale = compact ? 0.8 : 1
  const viewBoxWidth = 500 * scale
  const viewBoxHeight = 650 * scale

  return (
    <div className={`w-full ${compact ? 'h-[520px]' : 'h-[650px]'} ${className}`}>
      <svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} className="w-full h-full">
        {/* Connection paths (22 paths) */}
        {showPaths && pathConnections.map((path, index) => {
          const fromPos = treePositions[path.from]
          const toPos = treePositions[path.to]
          const isActive = path.active

          // Color based on pillar connection
          let strokeColor = '#cbd5e1' // Default grey
          if (path.fromMeta.pillar === path.toMeta.pillar && path.fromMeta.pillar === 'left') {
            strokeColor = '#ef4444' // Red for Severity pillar
          } else if (path.fromMeta.pillar === path.toMeta.pillar && path.fromMeta.pillar === 'right') {
            strokeColor = '#3b82f6' // Blue for Mercy pillar
          } else if (path.fromMeta.pillar === path.toMeta.pillar && path.fromMeta.pillar === 'middle') {
            strokeColor = '#a855f7' // Purple for Balance pillar
          }

          // Calculate quadratic Bezier curve path
          const midX = (fromPos.x + toPos.x) / 2
          const midY = (fromPos.y + toPos.y) / 2
          const curveOffset = Math.abs(toPos.x - fromPos.x) > Math.abs(toPos.y - fromPos.y) ? 15 : 0
          const pathD = `M ${fromPos.x * scale} ${fromPos.y * scale} Q ${midX * scale} ${(midY + curveOffset) * scale} ${toPos.x * scale} ${toPos.y * scale}`

          return (
            <g key={`path-${index}`}>
              {/* Background glow path (pulsing) */}
              {isActive && (
                <motion.path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={6 * scale}
                  opacity="0.2"
                  animate={{
                    opacity: [0.2, 0.4, 0.2],
                    strokeWidth: [6 * scale, 8 * scale, 6 * scale]
                  }}
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
                strokeWidth={isActive ? (3 * scale) : (2 * scale)}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: 1,
                  opacity: isActive ? 0.7 : 0.3
                }}
                transition={{
                  pathLength: { duration: 1.2, delay: index * 0.05, ease: "easeOut" },
                  opacity: { duration: 0.3 }
                }}
              />

              {/* Flowing light particle 1 */}
              {isActive && (
                <circle r={4 * scale} fill={strokeColor} opacity="0.9">
                  <animateMotion
                    dur="3s"
                    repeatCount="indefinite"
                    path={pathD}
                    begin={`${index * 0.15}s`}
                  />
                  <animate
                    attributeName="opacity"
                    values="0.5;1;0.5"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              {/* Flowing light particle 2 */}
              {isActive && (
                <circle r={3 * scale} fill={strokeColor} opacity="0.7">
                  <animateMotion
                    dur="3s"
                    repeatCount="indefinite"
                    path={pathD}
                    begin={`${index * 0.15 + 1.5}s`}
                  />
                </circle>
              )}
            </g>
          )
        })}

        {/* Sephiroth nodes */}
        {Object.entries(treePositions).map(([sefirahKey, pos]) => {
          const sefirah = parseInt(sefirahKey) as Sefirah
          const activation = activations[sefirah] || 0
          const color = getColor(sefirah)
          const isActive = activation > 0.3
          const isDeveloping = activation > 0.15 && activation <= 0.3
          const meta = SEPHIROTH_METADATA[sefirah]
          const isSelected = selectedSefirah === sefirah
          const isHovered = hoveredSefirah === sefirah

          // Size based on activation
          const radius = (25 + activation * 20) * scale

          // Scaled positions
          const scaledX = pos.x * scale
          const scaledY = pos.y * scale

          return (
            <motion.g
              key={`node-${sefirah}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
              }}
              whileHover={{ scale: 1.15 }}
              transition={{
                delay: sefirah * 0.05,
                duration: 0.3,
                scale: { type: "spring", stiffness: 300, damping: 20 }
              }}
              style={{ cursor: onSefirahClick ? 'pointer' : 'default' }}
              onClick={() => onSefirahClick?.(sefirah)}
              onMouseEnter={() => onSefirahHover?.(sefirah)}
              onMouseLeave={() => onSefirahHover?.(null)}
            >
              {/* Layer 1: Animated outer glow for active nodes */}
              {isActive && (
                <motion.circle
                  cx={scaledX}
                  cy={scaledY}
                  r={radius + 8 * scale}
                  fill={color}
                  opacity="0.15"
                  animate={{
                    r: [radius + 8 * scale, radius + 12 * scale, radius + 8 * scale],
                    opacity: [0.15, 0.25, 0.15]
                  }}
                  transition={{
                    duration: 4.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}

              {/* Layer 2: Outer energy glow */}
              <motion.circle
                cx={scaledX}
                cy={scaledY}
                r={radius + 16 * scale}
                fill="none"
                stroke={color}
                strokeWidth={2 * scale}
                opacity={0.4 + activation * 0.4}
                filter={`drop-shadow(0 0 ${8 * scale}px ${color})`}
                animate={isActive ? {
                  opacity: [0.4 + activation * 0.4, 0.7, 0.4 + activation * 0.4],
                  r: [radius + 16 * scale, radius + 20 * scale, radius + 16 * scale]
                } : {}}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />

              {/* Layer 3: Middle glow ring */}
              <motion.circle
                cx={scaledX}
                cy={scaledY}
                r={radius + 8 * scale}
                fill="none"
                stroke={color}
                strokeWidth={1.5 * scale}
                opacity={0.5 + activation * 0.3}
                filter="blur(1px)"
                animate={{
                  opacity: [0.5, 0.7, 0.5],
                }}
                transition={{
                  duration: 3.75,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.3
                }}
              />

              {/* Layer 4: Hover enhancement glow */}
              {isHovered && (
                <motion.circle
                  cx={scaledX}
                  cy={scaledY}
                  r={radius + 10 * scale}
                  fill="none"
                  stroke={color}
                  strokeWidth={2 * scale}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                  transition={{ duration: 0.3 }}
                />
              )}

              {/* Layer 5: Selection glow */}
              {isSelected && (
                <motion.circle
                  cx={scaledX}
                  cy={scaledY}
                  r={radius + 8 * scale}
                  fill="none"
                  stroke={color}
                  strokeWidth={2.5 * scale}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  transition={{ duration: 0.3 }}
                />
              )}

              {/* Layer 7: Main lighting circle (laser-style outline) */}
              <motion.circle
                cx={scaledX}
                cy={scaledY}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={isSelected ? (3 * scale) : (2 * scale)}
                opacity={0.5 + activation * 0.5}
                className="transition-all duration-200"
                animate={isActive ? {
                  opacity: [0.5 + activation * 0.5, 0.7 + activation * 0.3, 0.5 + activation * 0.5],
                } : {}}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />

              {/* Layer 8: Inner energy core */}
              <circle
                cx={scaledX}
                cy={scaledY}
                r={radius * 0.6}
                fill={color}
                opacity={0.2 + activation * 0.5}
                filter="blur(3px)"
                className="transition-all duration-200"
              />

              {/* Layer 9: Center activation dot - BRIGHTEST */}
              <motion.circle
                cx={scaledX}
                cy={scaledY}
                r={radius * 0.2}
                fill={color}
                opacity={0.9}
                filter={`drop-shadow(0 0 ${4 * scale}px ${color})`}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.9, 1, 0.9],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />

              {/* Layer 10: Status indicator badge with pulse animation */}
              {isActive && (
                <motion.g
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                >
                  <circle
                    cx={scaledX + radius - 5 * scale}
                    cy={scaledY - radius + 5 * scale}
                    r={8 * scale}
                    fill="#10b981"
                  />
                  <text
                    x={scaledX + radius - 5 * scale}
                    y={scaledY - radius + 7 * scale}
                    textAnchor="middle"
                    fontSize={8 * scale}
                    fill="white"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    ●
                  </text>
                </motion.g>
              )}

              {isDeveloping && (
                <motion.circle
                  cx={scaledX + radius - 5 * scale}
                  cy={scaledY - radius + 5 * scale}
                  r={6 * scale}
                  fill="#f59e0b"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                />
              )}

              {/* Labels - Always visible if showLabels is true */}
              {showLabels && (
                <>
                  {/* Hebrew name (top) */}
                  <text
                    x={scaledX}
                    y={scaledY + radius + 16 * scale}
                    textAnchor="middle"
                    fontSize={9 * scale}
                    fill="#94a3b8"
                    fontFamily="Arial, sans-serif"
                    opacity="0.7"
                  >
                    {meta.hebrewName}
                  </text>

                  {/* English name (middle) */}
                  <text
                    x={scaledX}
                    y={scaledY + radius + 28 * scale}
                    textAnchor="middle"
                    fontSize={11 * scale}
                    fill={isSelected ? "#18181b" : "#64748b"}
                    fontFamily="monospace"
                    fontWeight={isSelected ? "600" : "normal"}
                  >
                    {meta.name}
                  </text>

                  {/* AI Computational Layer (bottom) */}
                  <text
                    x={scaledX}
                    y={scaledY + radius + 40 * scale}
                    textAnchor="middle"
                    fontSize={8 * scale}
                    fill="#a855f7"
                    fontFamily="monospace"
                    fontWeight="500"
                    opacity="0.9"
                  >
                    {meta.aiRole.split('•')[0].trim()}
                  </text>

                  {/* Activation percentage (bottom-most) */}
                  <text
                    x={scaledX}
                    y={scaledY + radius + 52 * scale}
                    textAnchor="middle"
                    fontSize={9 * scale}
                    fill="#64748b"
                    fontFamily="monospace"
                    fontWeight="600"
                  >
                    {(activation * 100).toFixed(0)}%
                  </text>
                </>
              )}
            </motion.g>
          )
        })}
      </svg>
    </div>
  )
}
