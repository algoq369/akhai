'use client'

/**
 * MindMapConnection - SVG curved path between nodes
 *
 * Settings-style minimalist design:
 * - Light grey stroke
 * - Bezier curve for organic look
 * - Animated path drawing
 */

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'

export interface ConnectionData {
  id: string
  from: string
  to: string
  type?: string
  strength?: number
}

interface MindMapConnectionProps {
  connection: ConnectionData
  fromPos: { x: number; y: number } | null
  toPos: { x: number; y: number } | null
  selected?: boolean
}

function MindMapConnectionComponent({
  connection,
  fromPos,
  toPos,
  selected = false
}: MindMapConnectionProps) {
  // Calculate bezier path
  const pathD = useMemo(() => {
    if (!fromPos || !toPos) return ''

    const dx = toPos.x - fromPos.x
    const dy = toPos.y - fromPos.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    // Control point offset based on distance
    const offset = Math.min(dist * 0.3, 80)

    // Create smooth bezier curve
    const cx1 = fromPos.x + offset
    const cy1 = fromPos.y
    const cx2 = toPos.x - offset
    const cy2 = toPos.y

    return `M ${fromPos.x} ${fromPos.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${toPos.x} ${toPos.y}`
  }, [fromPos, toPos])

  if (!pathD) return null

  // Stroke color based on strength
  const strokeOpacity = connection.strength ? 0.2 + (connection.strength * 0.4) : 0.3

  return (
    <motion.path
      d={pathD}
      stroke={selected ? '#a3a3a3' : '#d4d4d4'}
      strokeWidth={selected ? 2 : 1.5}
      strokeOpacity={strokeOpacity}
      fill="none"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    />
  )
}

// Memoize to prevent unnecessary re-renders
export const MindMapConnection = memo(MindMapConnectionComponent)
export default MindMapConnection
