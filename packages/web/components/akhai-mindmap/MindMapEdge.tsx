'use client'

/**
 * MindMapEdge - Light minimalist edge component for AkhAI Mind Map
 *
 * Design: Clean, minimal
 * - Light grey stroke (#d0d0d0)
 * - Thin line (1px)
 * - No arrows
 */

import { memo } from 'react'
import { EdgeProps, getBezierPath } from '@xyflow/react'

function MindMapEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <path
      id={id}
      className="react-flow__edge-path"
      d={edgePath}
      fill="none"
      stroke="#c0c0c0"
      strokeWidth={1}
      style={style}
    />
  )
}

export const MindMapEdge = memo(MindMapEdgeComponent)
export default MindMapEdge
