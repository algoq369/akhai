'use client'

/**
 * MindMapNode - Draggable card component for SimpleMindMap
 *
 * Settings-style minimalist design:
 * - White card with subtle border
 * - Category-colored left border
 * - Framer Motion drag with throttling
 */

import { memo, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'

// Category colors for left border
const CATEGORY_COLORS: Record<string, string> = {
  technology: '#6366F1',
  business: '#10B981',
  finance: '#F59E0B',
  science: '#8B5CF6',
  education: '#EC4899',
  health: '#EF4444',
  environment: '#059669',
  psychology: '#A855F7',
  infrastructure: '#0EA5E9',
  regulation: '#F97316',
  engineering: '#0D9488',
  social: '#D946EF',
  other: '#64748B',
  default: '#a3a3a3'
}

export interface MindMapNodeData {
  id: string
  name: string
  description?: string | null
  category?: string | null
  queryCount?: number
  color?: string
  x?: number
  y?: number
  fx?: number | null // Fixed x for D3
  fy?: number | null // Fixed y for D3
}

interface MindMapNodeProps {
  node: MindMapNodeData
  selected: boolean
  onSelect: (id: string) => void
  onDragStart: (id: string) => void
  onDrag: (id: string, x: number, y: number) => void
  onDragEnd: (id: string) => void
  containerRef: React.RefObject<HTMLDivElement | null>
}

function MindMapNodeComponent({
  node,
  selected,
  onSelect,
  onDragStart,
  onDrag,
  onDragEnd,
  containerRef
}: MindMapNodeProps) {
  const category = node.category?.toLowerCase() || 'default'
  const categoryColor = node.color || CATEGORY_COLORS[category] || CATEGORY_COLORS.default
  const lastUpdateRef = useRef(0)

  // Throttled drag handler (16ms = 60fps)
  const handleDrag = useCallback((_: any, info: { point: { x: number; y: number } }) => {
    const now = Date.now()
    if (now - lastUpdateRef.current < 16) return
    lastUpdateRef.current = now

    // Get container bounds for coordinate transformation
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const x = info.point.x - rect.left
    const y = info.point.y - rect.top

    onDrag(node.id, x, y)
  }, [node.id, onDrag, containerRef])

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      onDragStart={() => onDragStart(node.id)}
      onDrag={handleDrag}
      onDragEnd={() => onDragEnd(node.id)}
      onClick={() => onSelect(node.id)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        absolute cursor-grab active:cursor-grabbing
        bg-white border transition-colors
        ${selected ? 'border-neutral-400' : 'border-neutral-200 hover:border-neutral-300'}
      `}
      style={{
        left: node.x ?? 0,
        top: node.y ?? 0,
        width: 160,
        minHeight: 54,
        borderLeft: `3px solid ${categoryColor}`,
        transform: 'translate(-50%, -50%)', // Center on position
        zIndex: selected ? 10 : 1,
      }}
    >
      <div className="p-2">
        {/* Title */}
        <div className="text-xs text-neutral-700 font-normal leading-snug mb-1 truncate">
          {node.name}
        </div>

        {/* Metadata */}
        <div className="text-[10px] text-neutral-400 flex items-center gap-1">
          <span>{node.queryCount || 0} queries</span>
          {node.category && (
            <>
              <span className="text-neutral-300">·</span>
              <span className="truncate">{node.category}</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Memoize to prevent unnecessary re-renders
export const MindMapNode = memo(MindMapNodeComponent)
export default MindMapNode
