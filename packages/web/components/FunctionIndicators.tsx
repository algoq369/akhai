'use client'

import { useState } from 'react'

interface FunctionIndicatorsProps {
  currentMethodology: string
  onMethodologyChange?: (methodId: string) => void
  showGuard?: boolean
}

interface Methodology {
  id: string
  name: string
  shortName: string
  color: string
  glowColor: string
  description: string
  speed: number
  depth: number
  cost: number
  bestFor: string
}

const METHODOLOGIES: Methodology[] = [
  {
    id: 'direct',
    name: 'Direct',
    shortName: 'DIRECT',
    color: '#EF4444',
    glowColor: 'rgba(239, 68, 68, 0.5)',
    description: 'Fast, concise responses',
    speed: 5,
    depth: 2,
    cost: 1,
    bestFor: 'Quick facts'
  },
  {
    id: 'cod',
    name: 'CoD',
    shortName: 'COD',
    color: '#F97316',
    glowColor: 'rgba(249, 115, 22, 0.5)',
    description: 'Draft → Reflect → Refine',
    speed: 3,
    depth: 4,
    cost: 2,
    bestFor: 'Writing, creative'
  },
  {
    id: 'bot',
    name: 'BoT',
    shortName: 'BOT',
    color: '#EAB308',
    glowColor: 'rgba(234, 179, 8, 0.5)',
    description: 'Structured reasoning buffer',
    speed: 3,
    depth: 4,
    cost: 2,
    bestFor: 'Analysis'
  },
  {
    id: 'react',
    name: 'ReAct',
    shortName: 'REACT',
    color: '#22C55E',
    glowColor: 'rgba(34, 197, 94, 0.5)',
    description: 'Reason + Act iteratively',
    speed: 2,
    depth: 5,
    cost: 3,
    bestFor: 'Research'
  },
  {
    id: 'pot',
    name: 'PoT',
    shortName: 'POT',
    color: '#3B82F6',
    glowColor: 'rgba(59, 130, 246, 0.5)',
    description: 'Code-like logical steps',
    speed: 2,
    depth: 5,
    cost: 3,
    bestFor: 'Math, logic'
  },
  {
    id: 'gtp',
    name: 'GTP',
    shortName: 'GTP',
    color: '#6366F1',
    glowColor: 'rgba(99, 102, 241, 0.5)',
    description: 'Multi-perspective synthesis',
    speed: 1,
    depth: 5,
    cost: 4,
    bestFor: 'Decisions'
  },
  {
    id: 'auto',
    name: 'Auto',
    shortName: 'AUTO',
    color: '#8B5CF6',
    glowColor: 'rgba(139, 92, 246, 0.5)',
    description: 'AI selects best method',
    speed: 4,
    depth: 4,
    cost: 2,
    bestFor: 'General use'
  }
]

// Metric dots renderer - inline display
function MetricDots({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className="inline-flex gap-[2px]">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={i < value ? 'text-slate-700' : 'text-slate-300'}
        >
          ●
        </span>
      ))}
    </span>
  )
}

export default function FunctionIndicators({ currentMethodology, onMethodologyChange, showGuard = true }: FunctionIndicatorsProps) {
  const [hoveredMethod, setHoveredMethod] = useState<string | null>(null)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)

  const handleMouseEnter = (methodId: string) => {
    const timeout = setTimeout(() => {
      setHoveredMethod(methodId)
    }, 200) // 200ms delay to prevent flicker
    setHoverTimeout(timeout)
  }

  const handleMouseLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
    }
    setHoveredMethod(null)
  }

  const handleDotClick = (methodId: string) => {
    if (onMethodologyChange && methodId !== currentMethodology) {
      onMethodologyChange(methodId)
    }
  }

  return (
    <div className="relative px-6 py-3">
      {/* Center: Methodology Dots */}
      <div className="flex items-center justify-center gap-4">
        {METHODOLOGIES.map((method) => {
          const isActive = currentMethodology === method.id
          const isHovered = hoveredMethod === method.id

          return (
            <div
              key={method.id}
              className="relative"
              onMouseEnter={() => handleMouseEnter(method.id)}
              onMouseLeave={handleMouseLeave}
            >
              {/* Just the Dot - No Labels */}
              <div className="relative">
                <div
                  onClick={() => handleDotClick(method.id)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    isActive ? 'animate-pulse' : ''
                  }`}
                  style={{
                    backgroundColor: isActive ? method.color : '#cbd5e1',
                    boxShadow: isActive
                      ? `0 0 6px ${method.glowColor}, 0 0 10px ${method.glowColor}`
                      : 'none'
                  }}
                />

              {/* Ring animation on active */}
              {isActive && (
                <div
                  className="absolute inset-0 rounded-full animate-ping opacity-75"
                  style={{ backgroundColor: method.color }}
                />
              )}
            </div>

            {/* Raw Text Hover - No Background (News Notification Style) */}
            {isHovered && (
              <div
                className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap animate-fade-in"
              >
                <div className="text-[10px]">
                  <span className="text-slate-500 font-medium uppercase">{method.name}</span>
                  <span className="mx-1 text-slate-400">·</span>
                  <span className="text-slate-600">{method.description}</span>
                </div>
              </div>
            )}
          </div>
        )
      })}
      </div>

      {/* Right: Guard Active Indicator - Absolute positioned */}
      {showGuard && (
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-blink-green" />
          <span className="text-[9px] uppercase tracking-widest text-relic-silver font-medium">guard active</span>
        </div>
      )}
    </div>
  )
}
