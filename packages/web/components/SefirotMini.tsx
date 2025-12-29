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
  const [isHovered, setIsHovered] = useState(false)
  const [selectedSefirah, setSelectedSefirah] = useState<Sefirah | null>(null)

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

  // Get glow intensity based on activation
  const getGlow = (sefirah: Sefirah): number => {
    const activation = activations[sefirah] || 0
    return activation * 20 // Max 20px blur
  }

  // Determine dot size based on activation
  const getDotSize = (sefirah: Sefirah): number => {
    const activation = activations[sefirah] || 0
    const baseSize = 4
    const maxSize = 12
    return baseSize + activation * (maxSize - baseSize)
  }

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setSelectedSefirah(null)
      }}
    >
      {/* Compact View */}
      <div
        className="relative w-48 h-32 cursor-pointer group"
        onClick={onExpand}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          style={{ filter: 'drop-shadow(0 0 4px rgba(168, 85, 247, 0.2))' }}
        >
          {/* Connection lines (faint) */}
          {isHovered && (
            <>
              {/* Middle Pillar */}
              <line
                x1={positions[Sefirah.KETHER].x}
                y1={positions[Sefirah.KETHER].y}
                x2={positions[Sefirah.TIFERET].x}
                y2={positions[Sefirah.TIFERET].y}
                stroke="rgba(168, 85, 247, 0.2)"
                strokeWidth="0.3"
              />
              <line
                x1={positions[Sefirah.TIFERET].x}
                y1={positions[Sefirah.TIFERET].y}
                x2={positions[Sefirah.YESOD].x}
                y2={positions[Sefirah.YESOD].y}
                stroke="rgba(168, 85, 247, 0.2)"
                strokeWidth="0.3"
              />
              <line
                x1={positions[Sefirah.YESOD].x}
                y1={positions[Sefirah.YESOD].y}
                x2={positions[Sefirah.MALKUTH].x}
                y2={positions[Sefirah.MALKUTH].y}
                stroke="rgba(168, 85, 247, 0.2)"
                strokeWidth="0.3"
              />

              {/* Left Pillar */}
              <line
                x1={positions[Sefirah.BINAH].x}
                y1={positions[Sefirah.BINAH].y}
                x2={positions[Sefirah.GEVURAH].x}
                y2={positions[Sefirah.GEVURAH].y}
                stroke="rgba(239, 68, 68, 0.2)"
                strokeWidth="0.3"
              />
              <line
                x1={positions[Sefirah.GEVURAH].x}
                y1={positions[Sefirah.GEVURAH].y}
                x2={positions[Sefirah.HOD].x}
                y2={positions[Sefirah.HOD].y}
                stroke="rgba(239, 68, 68, 0.2)"
                strokeWidth="0.3"
              />

              {/* Right Pillar */}
              <line
                x1={positions[Sefirah.CHOKMAH].x}
                y1={positions[Sefirah.CHOKMAH].y}
                x2={positions[Sefirah.CHESED].x}
                y2={positions[Sefirah.CHESED].y}
                stroke="rgba(59, 130, 246, 0.2)"
                strokeWidth="0.3"
              />
              <line
                x1={positions[Sefirah.CHESED].x}
                y1={positions[Sefirah.CHESED].y}
                x2={positions[Sefirah.NETZACH].x}
                y2={positions[Sefirah.NETZACH].y}
                stroke="rgba(59, 130, 246, 0.2)"
                strokeWidth="0.3"
              />
            </>
          )}

          {/* Sephiroth dots */}
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
                transition={{ duration: 0.3, delay: sefirah * 0.05 }}
                onMouseEnter={() => setSelectedSefirah(sefirah)}
              >
                {/* Glow effect */}
                {activation > 0.1 && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={size + 2}
                    fill={color}
                    opacity={activation * 0.3}
                    filter={`blur(${glow}px)`}
                  />
                )}

                {/* Main dot */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={size}
                  fill={activation > 0.05 ? color : 'rgba(156, 163, 175, 0.3)'}
                  opacity={activation > 0.05 ? 0.8 + activation * 0.2 : 0.3}
                  stroke={isUserLevel ? '#fbbf24' : isSelected ? '#ffffff' : 'none'}
                  strokeWidth={isUserLevel ? 0.8 : 0.5}
                  className="transition-all duration-200"
                />

                {/* User level indicator */}
                {isUserLevel && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={size + 2}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="0.5"
                    opacity="0.6"
                  >
                    <animate
                      attributeName="r"
                      values={`${size + 2};${size + 4};${size + 2}`}
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.6;0.3;0.6"
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          className="absolute bottom-0 right-0 text-[9px] text-zinc-500 uppercase tracking-wider"
        >
          Click to expand
        </motion.div>
      </div>

      {/* Tooltip on hover */}
      <AnimatePresence>
        {selectedSefirah && isHovered && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute -top-16 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl z-50 min-w-[200px]"
          >
            <div className="text-xs font-bold text-zinc-100 mb-1">
              {SEPHIROTH_METADATA[selectedSefirah].name}
            </div>
            <div className="text-[10px] text-zinc-400 mb-1">
              {SEPHIROTH_METADATA[selectedSefirah].hebrewName} - {SEPHIROTH_METADATA[selectedSefirah].meaning}
            </div>
            <div className="text-[9px] text-zinc-500">
              {SEPHIROTH_METADATA[selectedSefirah].aiRole}
            </div>
            <div className="text-[10px] text-purple-400 mt-1">
              Activation: {((activations[selectedSefirah] || 0) * 100).toFixed(0)}%
            </div>

            {/* Arrow */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 border-b border-r border-zinc-700 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer label */}
      <div className="text-center mt-2">
        <div className="text-[9px] text-zinc-600 uppercase tracking-widest">
          Sephirothic Activation
        </div>
        {userLevel && (
          <div className="text-[8px] text-amber-400/60 mt-0.5">
            Current Level: {SEPHIROTH_METADATA[userLevel].name}
          </div>
        )}
      </div>
    </div>
  )
}
