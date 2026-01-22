'use client'

/**
 * TopicNode - Settings-style minimalist node for AkhAI Mind Map
 *
 * Design: Clean white cards, no shadows
 * - White background
 * - Light grey border (subtle)
 * - Small colored left border by category
 * - Neutral grey text
 */

import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { Node } from '@xyflow/react'

// Category colors for left border (subtle)
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

export interface TopicNodeData {
  label: string
  category?: string
  queryCount?: number
  description?: string
  color?: string
  connectionCount?: number
  [key: string]: unknown
}

export type TopicNodeType = Node<TopicNodeData, 'topic'>

interface TopicNodeComponentProps {
  data: TopicNodeData
  selected?: boolean
}

function TopicNodeComponent({ data, selected }: TopicNodeComponentProps) {
  const category = data.category?.toLowerCase() || 'default'
  const categoryColor = data.color || CATEGORY_COLORS[category] || CATEGORY_COLORS.default

  return (
    <>
      {/* Connection handles - minimal */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-1 !h-1 !bg-neutral-300 !border-0"
      />

      <div
        className="cursor-pointer bg-white border border-neutral-200 transition-colors hover:border-neutral-300"
        style={{
          width: '150px',
          minHeight: '50px',
          borderLeft: `2px solid ${categoryColor}`,
          padding: '8px 10px',
        }}
      >
        {/* Title */}
        <div className="text-xs text-neutral-700 font-normal leading-snug mb-1">
          {data.label}
        </div>

        {/* Metadata */}
        <div className="text-[10px] text-neutral-400">
          {data.queryCount || 0} queries
          {data.connectionCount !== undefined && data.connectionCount > 0 && (
            <span> · {data.connectionCount} links</span>
          )}
        </div>

        {/* Category */}
        {data.category && (
          <div className="text-[9px] text-neutral-400 mt-1">
            {data.category}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-1 !h-1 !bg-neutral-300 !border-0"
      />
    </>
  )
}

// Memoize to prevent unnecessary re-renders
export const TopicNode = memo(TopicNodeComponent)
export default TopicNode
