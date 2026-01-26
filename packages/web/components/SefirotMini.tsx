'use client'

/**
 * SEFIROT MINI
 *
 * Compact Tree of Life visualization for response footers
 *
 * Shows only active Sephiroth as glowing dots.
 * Hover reveals full tree. Click expands to full SefirotNeuralNetwork.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Sefirah, SEPHIROTH_METADATA } from '@/lib/ascent-tracker'

interface SefirotMiniProps {
  /** Activation levels for each Sefirah (0-1) */
  activations: Record<Sefirah, number>

  /** Optional: Current user ascent level */
  userLevel?: Sefirah

  /** Optional: Click handler to expand to full view */
  onExpand?: () => void

  /** Optional: Additional CSS classes */
  className?: string
}

export default function SefirotMini({
  activations,
  userLevel,
  onExpand,
  className = '',
}: SefirotMiniProps) {
  // 🔍 DIAGNOSTIC: Log what SefirotMini receives
  console.log('🌳 COMPONENT: SefirotMini rendered with:', {
    activations,
    userLevel,
    activationKeys: Object.keys(activations),
    activationValues: Object.values(activations),
    hasActivations: Object.keys(activations).length > 0,
  })

  const [isHovered, setIsHovered] = useState(false)
  const [selectedSefirah, setSelectedSefirah] = useState<Sefirah | null>(null)

  // Calculate valuable metadata
  const activeCount = Object.values(activations).filter(v => v > 0.05).length
  const totalCount = Object.keys(activations).length

  // Find dominant Sefirah
  const dominantSefirah = (Object.entries(activations) as unknown as Array<[Sefirah, number]>)
    .reduce((max, [sefirah, activation]) =>
      activation > max[1] ? [sefirah, activation] : max
    , [Sefirah.MALKUTH, 0] as [Sefirah, number])[0]

  // Calculate pillar balance
  const pillarActivations = Object.entries(activations).reduce((acc, [sefirah, activation]) => {
    const pillar = SEPHIROTH_METADATA[sefirah as unknown as Sefirah].pillar
    acc[pillar] = (acc[pillar] || 0) + (activation as number)
    return acc
  }, {} as Record<string, number>)

  const totalActivation = Object.values(pillarActivations).reduce((sum, val) => sum + val, 0)
  const pillarBalance = totalActivation > 0 ? {
    left: ((pillarActivations.left || 0) / totalActivation * 100).toFixed(0),
    right: ((pillarActivations.right || 0) / totalActivation * 100).toFixed(0),
    middle: ((pillarActivations.middle || 0) / totalActivation * 100).toFixed(0),
  } : { left: '0', right: '0', middle: '0' }

  // Layout positions for compact view (relative positioning)
  const positions: Record<Sefirah, { x: number; y: number }> = {
    [Sefirah.KETHER]: { x: 50, y: 5 },
    [Sefirah.CHOKMAH]: { x: 75, y: 20 },
    [Sefirah.BINAH]: { x: 25, y: 20 },
    [Sefirah.DAAT]: { x: 50, y: 30 },
    [Sefirah.CHESED]: { x: 75, y: 40 },
    [Sefirah.GEVURAH]: { x: 25, y: 40 },
    [Sefirah.TIFERET]: { x: 50, y: 50 },
    [Sefirah.NETZACH]: { x: 75, y: 65 },
    [Sefirah.HOD]: { x: 25, y: 65 },
    [Sefirah.YESOD]: { x: 50, y: 80 },
    [Sefirah.MALKUTH]: { x: 50, y: 95 },
  }

  // Get color based on pillar
  const getColor = (sefirah: Sefirah): string => {
    const metadata = SEPHIROTH_METADATA[sefirah]
    switch (metadata.pillar) {
      case 'left':
        return 'rgb(239, 68, 68)' // Red (Severity)
      case 'right':
        return 'rgb(59, 130, 246)' // Blue (Mercy)
      case 'middle':
        return 'rgb(168, 85, 247)' // Purple (Equilibrium)
      default:
        return 'rgb(156, 163, 175)' // Gray
    }
  }

  // Get glow intensity based on activation - Proportional to smaller dots
  const getGlow = (sefirah: Sefirah): number => {
    const activation = activations[sefirah] || 0
    return activation * 15 // Max 15px blur for 4-10px dots (reduced from 50px)
  }

  // Determine dot size based on activation - Reverted to original compact size
  const getDotSize = (sefirah: Sefirah): number => {
    const activation = activations[sefirah] || 0
    const baseSize = 4 // Reverted from 20px to 4px
    const maxSize = 10 // Reverted from 28px to 10px
    return baseSize + activation * (maxSize - baseSize)
  }

  // Define all 22 traditional paths of the Tree of Life
  const paths: Array<[Sefirah, Sefirah]> = [
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
    // From Chesed
    [Sefirah.CHESED, Sefirah.TIFERET],
    [Sefirah.CHESED, Sefirah.NETZACH],
    // From Gevurah
    [Sefirah.GEVURAH, Sefirah.TIFERET],
    [Sefirah.GEVURAH, Sefirah.HOD],
    // From Tiferet (central pillar)
    [Sefirah.TIFERET, Sefirah.NETZACH],
    [Sefirah.TIFERET, Sefirah.HOD],
    [Sefirah.TIFERET, Sefirah.YESOD],
    // From Netzach
    [Sefirah.NETZACH, Sefirah.YESOD],
    [Sefirah.NETZACH, Sefirah.MALKUTH],
    // From Hod
    [Sefirah.HOD, Sefirah.YESOD],
    [Sefirah.HOD, Sefirah.MALKUTH],
    // Final path
    [Sefirah.YESOD, Sefirah.MALKUTH],
  ]

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setSelectedSefirah(null)
      }}
    >
      {/* Compact View - Idea Factory Style */}
      <div
        className="relative w-48 h-36 cursor-pointer group"
        onClick={() => {
          window.location.href = '/tree-of-life'
        }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          style={{ filter: 'drop-shadow(0 0 6px rgba(168, 85, 247, 0.15))' }}
        >
          {/* All 22 Traditional Paths - Always visible */}
          {paths.map(([from, to], index) => {
            const fromPos = positions[from]
            const toPos = positions[to]

            // Determine path color based on pillars
            let strokeColor = 'rgba(156, 163, 175, 0.3)' // Default grey
            const fromMeta = SEPHIROTH_METADATA[from]
            const toMeta = SEPHIROTH_METADATA[to]

            // If both on same pillar, use pillar color
            if (fromMeta.pillar === toMeta.pillar) {
              if (fromMeta.pillar === 'left') strokeColor = 'rgba(239, 68, 68, 0.25)' // Red
              else if (fromMeta.pillar === 'right') strokeColor = 'rgba(59, 130, 246, 0.25)' // Blue
              else if (fromMeta.pillar === 'middle') strokeColor = 'rgba(168, 85, 247, 0.25)' // Purple
            }

            return (
              <line
                key={`path-${index}`}
                x1={fromPos.x}
                y1={fromPos.y}
                x2={toPos.x}
                y2={toPos.y}
                stroke={strokeColor}
                strokeWidth="1.5"
                opacity={isHovered ? 0.6 : 0.4}
                className="transition-opacity duration-300"
              />
            )
          })}

          {/* Sephiroth dots - Enhanced visibility */}
          {(Object.keys(positions) as unknown as Sefirah[]).map((sefirah) => {
            const activation = activations[sefirah] || 0
            if (activation < 0.05 && !isHovered) return null // Don't show inactive unless hovered

            const pos = positions[sefirah]
            const color = getColor(sefirah)
            const glow = getGlow(sefirah)
            const size = getDotSize(sefirah)
            const isUserLevel = userLevel === sefirah
            const isSelected = selectedSefirah === sefirah

            return (
              <motion.g
                key={sefirah}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3, delay: sefirah * 0.05 }}
                onMouseEnter={() => setSelectedSefirah(sefirah)}
                className="cursor-pointer"
              >
                {/* Outer glow layer (subtle) - Proportional to smaller dots */}
                {activation > 0.1 && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={size + 3}
                    fill={color}
                    opacity={activation * 0.2}
                    filter={`blur(${glow}px)`}
                  />
                )}

                {/* Inner glow layer (brighter) - Proportional to smaller dots */}
                {activation > 0.1 && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={size + 2}
                    fill={color}
                    opacity={activation * 0.5}
                    filter={`blur(${glow * 0.5}px)`}
                  />
                )}

                {/* Main dot with subtle shadow - DAY 10: Enhanced for 20px */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={size}
                  fill={activation > 0.05 ? color : 'rgba(156, 163, 175, 0.3)'}
                  opacity={activation > 0.05 ? 0.85 + activation * 0.15 : 0.3}
                  stroke={isUserLevel ? '#fbbf24' : isSelected ? '#ffffff' : 'none'}
                  strokeWidth={isUserLevel ? 2 : 1.5}
                  className="transition-all duration-200"
                  style={{
                    filter: activation > 0.05 ? 'drop-shadow(0 0 4px rgba(0,0,0,0.3))' : 'none'
                  }}
                />

                {/* User level indicator - Adjusted for smaller dots */}
                {isUserLevel && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={size + 2}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="1.5"
                    opacity="0.7"
                  >
                    <animate
                      attributeName="r"
                      values={`${size + 2};${size + 4};${size + 2}`}
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.7;0.4;0.7"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
              </motion.g>
            )
          })}
        </svg>

        {/* Expand hint */}
        {onExpand && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] text-relic-silver uppercase tracking-[0.2em] pointer-events-none"
          >
            click to expand
          </motion.div>
        )}
      </div>

      {/* White Minimalist Tooltip on hover */}
      <AnimatePresence>
        {selectedSefirah && isHovered && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute -top-24 left-1/2 -translate-x-1/2 bg-white rounded-lg px-4 py-3 shadow-md z-50 min-w-[240px]"
          >
            {/* Hebrew + English Name */}
            <div className="text-[11px] font-mono text-relic-void font-semibold mb-1">
              {SEPHIROTH_METADATA[selectedSefirah].hebrewName} • {SEPHIROTH_METADATA[selectedSefirah].name}
            </div>

            {/* Meaning/Attribute */}
            <div className="text-[9px] text-relic-slate mb-2">
              {SEPHIROTH_METADATA[selectedSefirah].meaning.split(' - ')[0]}
            </div>

            {/* AI Role */}
            <div className="text-[9px] text-relic-silver italic mb-2">
              {SEPHIROTH_METADATA[selectedSefirah].aiRole}
            </div>

            {/* AI Computational Correlation */}
            <div className="text-[8px] text-relic-silver mb-2 font-mono border-l-2 border-purple-500/50 pl-2">
              {SEPHIROTH_METADATA[selectedSefirah].aiRole}
            </div>

            {/* Activation Percentage with visual bar */}
            <div className="space-y-1">
              <div className="text-[9px] text-relic-slate font-mono">
                Activation: {((activations[selectedSefirah] || 0) * 100).toFixed(0)}%
              </div>
              <div className="w-full h-1 bg-relic-mist/20 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${((activations[selectedSefirah] || 0) * 100).toFixed(0)}%`,
                    backgroundColor: getColor(selectedSefirah),
                    opacity: 0.7
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Footer with Metadata */}
      <div className="text-center mt-3 space-y-2">
        <div className="text-[10px] text-relic-silver uppercase tracking-[0.25em] font-semibold">
          tree of life • 22 paths
        </div>

        {/* Active Sephiroth Count */}
        <div className="text-[9px] text-relic-mist font-mono">
          {activeCount} / {totalCount} sephiroth active
        </div>

        {/* Dominant Sefirah */}
        <div className="text-[9px] font-mono">
          <span className="text-relic-silver">dominant: </span>
          <span className="text-relic-ghost font-semibold">
            {SEPHIROTH_METADATA[dominantSefirah].name}
          </span>
          <span className="text-relic-mist ml-1">
            ({(activations[dominantSefirah] * 100).toFixed(0)}%)
          </span>
        </div>

        {/* Pillar Balance - Computational Interpretation */}
        <div className="flex justify-center gap-4 text-[8px] font-mono">
          <div>
            <span className="text-red-400">constraint</span>
            <span className="text-relic-mist ml-1">{pillarBalance.left}%</span>
          </div>
          <div>
            <span className="text-blue-400">expansion</span>
            <span className="text-relic-mist ml-1">{pillarBalance.right}%</span>
          </div>
          <div>
            <span className="text-purple-400">synthesis</span>
            <span className="text-relic-mist ml-1">{pillarBalance.middle}%</span>
          </div>
        </div>

        {/* Ascent Level */}
        {userLevel && (
          <div className="text-[9px] text-relic-mist mt-1 font-mono">
            ascent level {userLevel} / 10
          </div>
        )}

        {/* Click for full analysis hint */}
        <div className="text-[8px] text-relic-silver/60 uppercase tracking-[0.2em] mt-2">
          click for full analysis
        </div>
      </div>
    </div>
  )
}
