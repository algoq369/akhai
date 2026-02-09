'use client'

import { motion } from 'framer-motion'
import type { Level } from '@/lib/stores/levels-store'

/**
 * LEVEL PROGRESS BAR
 *
 * Vertical navigation bar fixed on far left of screen.
 * Shows L1, L2, L3... for each conversation level.
 * Click to scroll to that level.
 *
 * Visual:
 * ┌────┐
 * │ L3 │ ○  (future/empty)
 * │────│
 * │ L2 │ ●  (current)
 * │────│
 * │ L1 │ ●  (completed)
 * └────┘
 */

interface LevelProgressBarProps {
  /** Array of levels from store */
  levels: Level[]
  /** Currently active level ID */
  currentLevelId: string | null
  /** Callback when a level is clicked */
  onLevelClick: (levelId: string) => void
}

export default function LevelProgressBar({
  levels,
  currentLevelId,
  onLevelClick
}: LevelProgressBarProps) {
  if (levels.length === 0) {
    return null
  }

  // Find current level index
  const currentIndex = levels.findIndex((l) => l.id === currentLevelId)

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed left-0 top-1/2 -translate-y-1/2 z-40 w-12 bg-white dark:bg-relic-void border-r border-neutral-200 dark:border-relic-slate/30 shadow-sm"
    >
      {/* Level items - reversed so L1 is at bottom */}
      <div className="flex flex-col-reverse">
        {levels.map((level, index) => {
          const isCurrent = level.id === currentLevelId
          const isCompleted = currentIndex >= 0 ? index < currentIndex : false
          const isFuture = currentIndex >= 0 ? index > currentIndex : false

          return (
            <button
              key={level.id}
              onClick={() => onLevelClick(level.id)}
              className={`
                group flex items-center justify-between px-2 py-2
                border-t border-neutral-100 dark:border-relic-slate/20
                first:border-t-0 last:border-b last:border-neutral-100 dark:last:border-relic-slate/20
                hover:bg-neutral-50 dark:hover:bg-relic-slate/10
                transition-colors duration-150
              `}
              title={`Level ${level.number}: ${level.query.slice(0, 50)}${level.query.length > 50 ? '...' : ''}`}
            >
              {/* Level label */}
              <span
                className={`
                  font-mono text-[10px] uppercase tracking-wide
                  ${isCurrent
                    ? 'text-purple-600 dark:text-purple-400 font-semibold'
                    : isCompleted
                      ? 'text-neutral-700 dark:text-neutral-300'
                      : 'text-neutral-400 dark:text-neutral-500'
                  }
                `}
              >
                L{level.number}
              </span>

              {/* Circle indicator - 8px diameter */}
              <div
                className={`
                  w-2 h-2 rounded-full transition-all duration-200
                  ${isCurrent
                    ? 'bg-purple-500'
                    : isCompleted
                      ? 'bg-neutral-700 dark:bg-neutral-300'
                      : 'bg-neutral-300 dark:bg-neutral-600'
                  }
                  ${isCurrent ? 'ring-2 ring-purple-200 dark:ring-purple-800' : ''}
                `}
              />
            </button>
          )
        })}
      </div>

      {/* Footer with level count */}
      <div className="px-2 py-1.5 border-t border-neutral-200 dark:border-relic-slate/30 bg-neutral-50 dark:bg-relic-slate/10">
        <span className="font-mono text-[8px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
          {levels.length}/{levels.length}
        </span>
      </div>
    </motion.div>
  )
}

/**
 * Compact horizontal version for embedding in headers/footers
 */
export function LevelProgressBarCompact({
  levels,
  currentLevelId,
  onLevelClick
}: LevelProgressBarProps) {
  if (levels.length === 0) {
    return null
  }

  const currentIndex = levels.findIndex((l) => l.id === currentLevelId)

  return (
    <div className="flex items-center gap-1.5">
      {levels.map((level, index) => {
        const isCurrent = level.id === currentLevelId
        const isCompleted = currentIndex >= 0 ? index < currentIndex : false

        return (
          <button
            key={level.id}
            onClick={() => onLevelClick(level.id)}
            className={`
              w-2 h-2 rounded-full transition-all duration-200
              ${isCurrent
                ? 'bg-purple-500 scale-125 ring-2 ring-purple-200 dark:ring-purple-800'
                : isCompleted
                  ? 'bg-neutral-700 dark:bg-neutral-300'
                  : 'bg-neutral-300 dark:bg-neutral-600'
              }
              hover:scale-110
            `}
            title={`L${level.number}`}
          />
        )
      })}
    </div>
  )
}
