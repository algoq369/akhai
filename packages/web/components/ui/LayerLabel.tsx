'use client'

/**
 * LayerLabel Component
 *
 * Displays AI layer or anti-pattern names with optional Kabbalistic origin info.
 * Origin visibility controlled by showLayerOrigins setting.
 */

import { Sefirah } from '@/lib/ascent-tracker'
import { useSettingsStore } from '@/lib/stores/settings-store'
import { AI_LAYERS, ANTI_PATTERNS, type AILayer, type AntiPattern } from '@/lib/ai-terminology'

interface LayerLabelProps {
  layerId: Sefirah | number
  type?: 'layer' | 'anti-pattern'
  size?: 'sm' | 'md' | 'lg'
  showWeight?: boolean
  weight?: number
  showSymbol?: boolean
  className?: string
}

export function LayerLabel({
  layerId,
  type = 'layer',
  size = 'md',
  showWeight = false,
  weight,
  showSymbol = false,
  className = ''
}: LayerLabelProps) {
  const { settings } = useSettingsStore()
  const showOrigins = settings.appearance.showLayerOrigins

  // Get the appropriate data based on type
  const data: AILayer | AntiPattern | null = type === 'layer'
    ? AI_LAYERS[layerId as Sefirah]
    : ANTI_PATTERNS[layerId]

  if (!data) return null

  // Size classes
  const sizeClasses = {
    sm: {
      name: 'text-[9px]',
      weight: 'text-[8px]',
      origin: 'text-[7px]',
      symbol: 'text-[10px]'
    },
    md: {
      name: 'text-[11px]',
      weight: 'text-[9px]',
      origin: 'text-[8px]',
      symbol: 'text-[12px]'
    },
    lg: {
      name: 'text-[13px]',
      weight: 'text-[10px]',
      origin: 'text-[9px]',
      symbol: 'text-[14px]'
    }
  }

  const sizes = sizeClasses[size]
  const layer = type === 'layer' ? (data as AILayer) : null
  const antiPattern = type === 'anti-pattern' ? (data as AntiPattern) : null

  return (
    <div className={`font-mono ${className}`}>
      {/* Primary Row: Symbol + Name + Weight */}
      <div className="flex items-center gap-2">
        {/* Symbol */}
        {showSymbol && layer && (
          <span
            className={sizes.symbol}
            style={{ color: layer.color }}
          >
            {layer.symbol}
          </span>
        )}

        {/* Name */}
        <span className={`${sizes.name} text-relic-void dark:text-white`}>
          {data.name}
        </span>

        {/* Weight */}
        {showWeight && weight !== undefined && (
          <span className={`${sizes.weight} text-relic-silver`}>
            {Math.round(weight * 100)}%
          </span>
        )}
      </div>

      {/* Secondary Row: Origin info (if enabled) */}
      {showOrigins && data.origin && (
        <div className={`${sizes.origin} text-relic-silver mt-0.5 ml-${showSymbol ? '5' : '0'}`}>
          <span className="text-relic-slate dark:text-relic-ghost">
            {data.origin.term}
          </span>
          <span className="mx-1">·</span>
          <span>{data.origin.meaning}</span>
        </div>
      )}
    </div>
  )
}

/**
 * Compact inline version for use in tables/lists
 */
interface LayerLabelInlineProps {
  layerId: Sefirah | number
  type?: 'layer' | 'anti-pattern'
  className?: string
}

export function LayerLabelInline({
  layerId,
  type = 'layer',
  className = ''
}: LayerLabelInlineProps) {
  const { settings } = useSettingsStore()
  const showOrigins = settings.appearance.showLayerOrigins

  const data: AILayer | AntiPattern | null = type === 'layer'
    ? AI_LAYERS[layerId as Sefirah]
    : ANTI_PATTERNS[layerId]

  if (!data) return null

  const layer = type === 'layer' ? (data as AILayer) : null

  return (
    <span className={`font-mono text-[10px] ${className}`}>
      {layer && (
        <span style={{ color: layer.color }} className="mr-1">
          {layer.symbol}
        </span>
      )}
      <span className="text-relic-void dark:text-white">{data.name}</span>
      {showOrigins && (
        <span className="text-relic-silver ml-1">
          ({data.origin.term})
        </span>
      )}
    </span>
  )
}

/**
 * Badge version for status displays
 */
interface LayerBadgeProps {
  layerId: Sefirah | number
  type?: 'layer' | 'anti-pattern'
  active?: boolean
  className?: string
}

export function LayerBadge({
  layerId,
  type = 'layer',
  active = true,
  className = ''
}: LayerBadgeProps) {
  const data: AILayer | AntiPattern | null = type === 'layer'
    ? AI_LAYERS[layerId as Sefirah]
    : ANTI_PATTERNS[layerId]

  if (!data) return null

  const layer = type === 'layer' ? (data as AILayer) : null
  const bgColor = layer ? layer.color : '#94a3b8'

  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[9px]
        ${active ? 'text-white' : 'text-relic-silver bg-relic-ghost dark:bg-relic-slate/20'}
        ${className}
      `}
      style={active ? { backgroundColor: bgColor } : undefined}
    >
      {layer && <span>{layer.symbol}</span>}
      <span>{data.short}</span>
    </span>
  )
}

export default LayerLabel
