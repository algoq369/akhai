'use client'

/**
 * AI Processing Layers Tree SVG
 *
 * Interactive 11-node visualization of AI processing layers with weight indicators.
 */

import { useState } from 'react'
import { Layer, LAYER_METADATA } from '@/lib/layer-registry'
import { AI_LAYER_NAMES } from '@/lib/ai-layer-names'
import { useLayerStore } from '@/lib/stores/layer-store'

const LAYER_COLORS: Record<number, string> = {
  [Layer.EMBEDDING]: '#92400e',
  [Layer.EXECUTOR]: '#94a3b8',
  [Layer.CLASSIFIER]: '#eab308',
  [Layer.GENERATIVE]: '#f97316',
  [Layer.ATTENTION]: '#22c55e',
  [Layer.DISCRIMINATOR]: '#dc2626',
  [Layer.EXPANSION]: '#06b6d4',
  [Layer.ENCODER]: '#3b82f6',
  [Layer.REASONING]: '#4f46e5',
  [Layer.META_CORE]: '#9333ea',
  [Layer.SYNTHESIS]: '#06b6d4'
}

// Tree positions (normalized 0-100)
const POSITIONS: Record<number, { x: number; y: number }> = {
  [Layer.META_CORE]: { x: 50, y: 5 },
  [Layer.REASONING]: { x: 75, y: 18 },
  [Layer.ENCODER]: { x: 25, y: 18 },
  [Layer.SYNTHESIS]: { x: 50, y: 28 },
  [Layer.EXPANSION]: { x: 75, y: 40 },
  [Layer.DISCRIMINATOR]: { x: 25, y: 40 },
  [Layer.ATTENTION]: { x: 50, y: 50 },
  [Layer.GENERATIVE]: { x: 75, y: 65 },
  [Layer.CLASSIFIER]: { x: 25, y: 65 },
  [Layer.EXECUTOR]: { x: 50, y: 78 },
  [Layer.EMBEDDING]: { x: 50, y: 95 }
}

// Path connections
const PATHS: [Layer, Layer][] = [
  [Layer.META_CORE, Layer.REASONING],
  [Layer.META_CORE, Layer.ENCODER],
  [Layer.META_CORE, Layer.ATTENTION],
  [Layer.REASONING, Layer.ENCODER],
  [Layer.REASONING, Layer.EXPANSION],
  [Layer.REASONING, Layer.ATTENTION],
  [Layer.ENCODER, Layer.DISCRIMINATOR],
  [Layer.ENCODER, Layer.ATTENTION],
  [Layer.EXPANSION, Layer.DISCRIMINATOR],
  [Layer.EXPANSION, Layer.ATTENTION],
  [Layer.EXPANSION, Layer.GENERATIVE],
  [Layer.DISCRIMINATOR, Layer.ATTENTION],
  [Layer.DISCRIMINATOR, Layer.CLASSIFIER],
  [Layer.ATTENTION, Layer.GENERATIVE],
  [Layer.ATTENTION, Layer.CLASSIFIER],
  [Layer.ATTENTION, Layer.EXECUTOR],
  [Layer.GENERATIVE, Layer.CLASSIFIER],
  [Layer.GENERATIVE, Layer.EXECUTOR],
  [Layer.GENERATIVE, Layer.EMBEDDING],
  [Layer.CLASSIFIER, Layer.EXECUTOR],
  [Layer.CLASSIFIER, Layer.EMBEDDING],
  [Layer.EXECUTOR, Layer.EMBEDDING]
]

interface LayerTreeSVGProps {
  width?: number
  height?: number
  showLabels?: boolean
  onLayerClick?: (layerNode: Layer) => void
  highlightedLayer?: Layer | null
}

export function LayerTreeSVG({
  width = 300,
  height = 400,
  showLabels = true,
  onLayerClick,
  highlightedLayer
}: LayerTreeSVGProps) {
  const { weights } = useLayerStore()
  const [hoveredLayer, setHoveredLayer] = useState<Layer | null>(null)

  const getNodeRadius = (layerNode: Layer) => {
    const weight = weights[layerNode] ?? 0.5
    return 8 + weight * 8 // 8-16 radius based on weight
  }

  const getNodeOpacity = (layerNode: Layer) => {
    const weight = weights[layerNode] ?? 0.5
    return 0.4 + weight * 0.6 // 0.4-1.0 opacity
  }

  return (
    <div className="relative">
      <svg width={width} height={height} viewBox="0 0 100 100" className="overflow-visible">
        {/* Paths */}
        <g className="paths">
          {PATHS.map(([from, to], idx) => {
            const fromPos = POSITIONS[from]
            const toPos = POSITIONS[to]
            const fromWeight = weights[from] ?? 0.5
            const toWeight = weights[to] ?? 0.5
            const avgWeight = (fromWeight + toWeight) / 2

            return (
              <line
                key={idx}
                x1={fromPos.x}
                y1={fromPos.y}
                x2={toPos.x}
                y2={toPos.y}
                stroke="#e5e7eb"
                strokeWidth={0.5 + avgWeight * 0.5}
                strokeOpacity={0.3 + avgWeight * 0.3}
              />
            )
          })}
        </g>

        {/* Nodes */}
        <g className="nodes">
          {Object.entries(POSITIONS).map(([layerNodeStr, pos]) => {
            const layerNode = parseInt(layerNodeStr) as Layer
            const meta = LAYER_METADATA[layerNode]
            const weight = weights[layerNode] ?? 0.5
            const radius = getNodeRadius(layerNode)
            const isHovered = hoveredLayer === layerNode
            const isHighlighted = highlightedLayer === layerNode
            const isActive = weight > 0.1

            return (
              <g
                key={layerNode}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredLayer(layerNode)}
                onMouseLeave={() => setHoveredLayer(null)}
                onClick={() => onLayerClick?.(layerNode)}
              >
                {/* Glow effect for highlighted */}
                {(isHighlighted || isHovered) && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={radius + 3}
                    fill={LAYER_COLORS[layerNode]}
                    fillOpacity={0.2}
                  />
                )}

                {/* Main node */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={radius / 4}
                  fill={isActive ? LAYER_COLORS[layerNode] : '#d1d5db'}
                  fillOpacity={getNodeOpacity(layerNode)}
                  stroke={isHighlighted || isHovered ? LAYER_COLORS[layerNode] : 'transparent'}
                  strokeWidth={0.5}
                />

                {/* Weight indicator ring */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={radius / 4 + 1}
                  fill="none"
                  stroke={LAYER_COLORS[layerNode]}
                  strokeWidth={0.3}
                  strokeOpacity={weight}
                  strokeDasharray={`${weight * 6.28 * (radius / 4 + 1)} 100`}
                  transform={`rotate(-90 ${pos.x} ${pos.y})`}
                />

                {/* Label */}
                {showLabels && (
                  <text
                    x={pos.x}
                    y={pos.y + radius / 4 + 4}
                    textAnchor="middle"
                    className="text-[2.5px] font-mono fill-relic-slate"
                    style={{ opacity: isActive ? 1 : 0.5 }}
                  >
                    {AI_LAYER_NAMES[layerNode]?.short || meta.name}
                  </text>
                )}

                {/* Weight percentage on hover */}
                {(isHovered || isHighlighted) && (
                  <text
                    x={pos.x}
                    y={pos.y - radius / 4 - 2}
                    textAnchor="middle"
                    className="text-[2px] font-mono fill-relic-void"
                  >
                    {Math.round(weight * 100)}%
                  </text>
                )}
              </g>
            )
          })}
        </g>
      </svg>

      {/* Tooltip */}
      {hoveredLayer && (
        <div className="absolute top-0 left-full ml-4 p-2 bg-white dark:bg-relic-void border border-relic-mist dark:border-relic-slate/30 rounded shadow-lg z-10 min-w-[150px]">
          <div className="text-[10px] font-mono font-semibold text-relic-void dark:text-white mb-1">
            {AI_LAYER_NAMES[hoveredLayer]?.name || LAYER_METADATA[hoveredLayer].name}
          </div>
          <div className="text-[9px] text-relic-slate">
            {AI_LAYER_NAMES[hoveredLayer]?.description || LAYER_METADATA[hoveredLayer].meaning}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[8px] text-relic-silver">Layer Weight</span>
            <span
              className="text-[10px] font-mono font-semibold"
              style={{ color: LAYER_COLORS[hoveredLayer] }}
            >
              {Math.round((weights[hoveredLayer] ?? 0.5) * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
