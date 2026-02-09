'use client'

import { motion } from 'framer-motion'
import type { Level } from '@/lib/stores/levels-store'

/**
 * LEVEL CONTAINER
 *
 * Primary layout component for each conversation level.
 * Each query creates one LevelContainer with a 3-column grid layout:
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │ L1 · "User's query text here..."              methodology   │
 * ├──────────────┬───────────────────┬──────────────────────────┤
 * │  Response    │ AI Computational  │   Trees Compact          │
 * │  Panel       │ Panel             │   (Ascent + Descent)     │
 * │  (left ~40%) │ (center ~35%)     │   (right ~25%)           │
 * └──────────────┴───────────────────┴──────────────────────────┘
 */

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface ConnectionMode {
  active: boolean
  from?: {
    levelId: string
    elementId: string
    elementType: string
  }
}

interface LevelContainerProps {
  level: Level
  isCurrentLevel: boolean
  onStartConnection?: (levelId: string, elementId: string, elementType: string) => void
  onCompleteConnection?: (levelId: string, elementId: string, elementType: string) => void
  connectionMode?: ConnectionMode
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function formatTimestamp(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const mins = Math.floor(diff / 60000)

  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`

  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ═══════════════════════════════════════════════════════════════════
// CONNECTION DOT
// ═══════════════════════════════════════════════════════════════════

function ConnectionDot({
  side,
  levelId,
  connectionMode,
  onStartConnection,
  onCompleteConnection,
}: {
  side: 'left' | 'right'
  levelId: string
  connectionMode?: ConnectionMode
  onStartConnection?: (levelId: string, elementId: string, elementType: string) => void
  onCompleteConnection?: (levelId: string, elementId: string, elementType: string) => void
}) {
  const isActive = connectionMode?.active ?? false
  const isSource = isActive && connectionMode?.from?.levelId === levelId

  function handleClick() {
    if (isActive && !isSource && onCompleteConnection) {
      onCompleteConnection(levelId, `level-${levelId}`, 'response')
    } else if (!isActive && onStartConnection) {
      onStartConnection(levelId, `level-${levelId}`, 'response')
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`
        absolute ${side === 'left' ? '-left-1.5' : '-right-1.5'} top-1/2 -translate-y-1/2
        w-3 h-3 rounded-full border-2 transition-all duration-200
        ${isActive && !isSource
          ? 'border-purple-400 bg-purple-100 shadow-[0_0_6px_rgba(168,85,247,0.4)] cursor-pointer hover:bg-purple-200'
          : isSource
            ? 'border-purple-500 bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]'
            : 'border-neutral-300 bg-white hover:border-neutral-400 cursor-pointer'
        }
        z-10
      `}
      title={isActive && !isSource ? 'Connect here' : 'Start connection'}
    />
  )
}

// ═══════════════════════════════════════════════════════════════════
// PLACEHOLDER COLUMN
// ═══════════════════════════════════════════════════════════════════

function PlaceholderColumn({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <span className="text-[10px] text-neutral-300 uppercase tracking-wider font-mono">
        {label}
      </span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function LevelContainer({
  level,
  isCurrentLevel,
  onStartConnection,
  onCompleteConnection,
  connectionMode,
}: LevelContainerProps) {
  return (
    <motion.div
      id={`level-${level.id}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`
        relative bg-white border rounded-lg overflow-hidden mb-4 mx-4
        transition-colors duration-150
        ${isCurrentLevel
          ? 'border-neutral-200 border-l-2 border-l-purple-500'
          : 'border-neutral-200 hover:border-neutral-300'
        }
      `}
    >
      {/* Connection dots on left/right edges */}
      <ConnectionDot
        side="left"
        levelId={level.id}
        connectionMode={connectionMode}
        onStartConnection={onStartConnection}
        onCompleteConnection={onCompleteConnection}
      />
      <ConnectionDot
        side="right"
        levelId={level.id}
        connectionMode={connectionMode}
        onStartConnection={onStartConnection}
        onCompleteConnection={onCompleteConnection}
      />

      {/* ── Header ── */}
      <div className="px-4 py-3 border-b border-neutral-100 flex items-center gap-3">
        {/* Level badge with pulse on current */}
        <span className="relative inline-flex items-center justify-center w-7 h-7 rounded-full bg-neutral-100">
          {isCurrentLevel && (
            <motion.span
              className="absolute inset-0 rounded-full bg-purple-100"
              animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
          <span
            className={`
              relative z-10 text-[11px] font-mono font-medium
              ${isCurrentLevel ? 'text-purple-600' : 'text-neutral-500'}
            `}
          >
            L{level.number}
          </span>
        </span>

        {/* Separator dot */}
        <span className="text-neutral-300 text-[10px]">·</span>

        {/* Query text - truncated single line */}
        <span className="flex-1 text-sm font-medium text-neutral-800 truncate min-w-0">
          {level.query}
        </span>

        {/* Methodology badge */}
        <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-mono whitespace-nowrap">
          {level.methodology}
        </span>

        {/* Timestamp */}
        <span className="text-[10px] text-neutral-400 font-mono whitespace-nowrap">
          {formatTimestamp(level.timestamp)}
        </span>
      </div>

      {/* ── Three-column body (CSS grid) ── */}
      <div className="grid grid-cols-[2fr_1.5fr_1fr] min-h-[200px]">
        {/* Left: Response Panel */}
        <div className="border-r border-neutral-100">
          <PlaceholderColumn label="ResponsePanel" />
        </div>

        {/* Center: AI Computational Panel */}
        <div className="border-r border-neutral-100">
          <PlaceholderColumn label="AIComputationalPanel" />
        </div>

        {/* Right: Trees Compact */}
        <div>
          <PlaceholderColumn label="TreesCompact" />
        </div>
      </div>
    </motion.div>
  )
}
