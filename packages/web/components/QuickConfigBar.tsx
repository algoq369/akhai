'use client'

/**
 * QUICK CONFIG BAR
 * 
 * Compact horizontal configuration bar with:
 * - Top 3 critical layers (reasoning, knowledge, verification)
 * - Preset buttons (fast, balanced, thorough, creative)
 * - Expand button for all 11 layers
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sefirah } from '@/lib/ascent-tracker'
import { useSefirotStore } from '@/lib/stores/sefirot-store'

// ═══════════════════════════════════════════════════════════
// TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════

interface Preset {
  id: string
  name: string
  weights: Record<number, number>
}

const PRESETS: Preset[] = [
  {
    id: 'fast',
    name: 'fast',
    weights: {
      [Sefirah.KETHER]: 0.4, [Sefirah.CHOKMAH]: 0.5, [Sefirah.BINAH]: 0.6,
      [Sefirah.DAAT]: 0.4, [Sefirah.CHESED]: 0.3, [Sefirah.GEVURAH]: 0.5,
      [Sefirah.TIFERET]: 0.5, [Sefirah.NETZACH]: 0.4, [Sefirah.HOD]: 0.7,
      [Sefirah.YESOD]: 0.6, [Sefirah.MALKUTH]: 0.8,
    }
  },
  {
    id: 'balanced',
    name: 'balanced',
    weights: {
      [Sefirah.KETHER]: 0.5, [Sefirah.CHOKMAH]: 0.6, [Sefirah.BINAH]: 0.6,
      [Sefirah.DAAT]: 0.5, [Sefirah.CHESED]: 0.6, [Sefirah.GEVURAH]: 0.6,
      [Sefirah.TIFERET]: 0.7, [Sefirah.NETZACH]: 0.6, [Sefirah.HOD]: 0.6,
      [Sefirah.YESOD]: 0.6, [Sefirah.MALKUTH]: 0.6,
    }
  },
  {
    id: 'thorough',
    name: 'thorough',
    weights: {
      [Sefirah.KETHER]: 0.6, [Sefirah.CHOKMAH]: 0.85, [Sefirah.BINAH]: 0.8,
      [Sefirah.DAAT]: 0.7, [Sefirah.CHESED]: 0.5, [Sefirah.GEVURAH]: 0.85,
      [Sefirah.TIFERET]: 0.7, [Sefirah.NETZACH]: 0.7, [Sefirah.HOD]: 0.75,
      [Sefirah.YESOD]: 0.8, [Sefirah.MALKUTH]: 0.75,
    }
  },
  {
    id: 'creative',
    name: 'creative',
    weights: {
      [Sefirah.KETHER]: 0.7, [Sefirah.CHOKMAH]: 0.6, [Sefirah.BINAH]: 0.5,
      [Sefirah.DAAT]: 0.85, [Sefirah.CHESED]: 0.9, [Sefirah.GEVURAH]: 0.3,
      [Sefirah.TIFERET]: 0.8, [Sefirah.NETZACH]: 0.85, [Sefirah.HOD]: 0.5,
      [Sefirah.YESOD]: 0.55, [Sefirah.MALKUTH]: 0.65,
    }
  },
]

// Critical layers mapping (Top 3 most impactful)
const CRITICAL_LAYERS = [
  { 
    id: Sefirah.CHOKMAH, 
    name: 'reasoning', 
    concept: 'problem decomposition',
    color: '#818cf8',
    min: 'shallow',
    max: 'deep'
  },
  { 
    id: Sefirah.BINAH, 
    name: 'knowledge', 
    concept: 'fact retrieval',
    color: '#6366f1',
    min: 'focused',
    max: 'broad'
  },
  { 
    id: Sefirah.DAAT, 
    name: 'verification', 
    concept: 'self-checking',
    color: '#22d3ee',
    min: 'minimal',
    max: 'thorough'
  },
]

// All layers for expanded view
const ALL_LAYERS = [
  { id: Sefirah.KETHER, name: 'meta-cognition', color: '#a78bfa' },
  { id: Sefirah.CHOKMAH, name: 'reasoning', color: '#818cf8' },
  { id: Sefirah.BINAH, name: 'knowledge', color: '#6366f1' },
  { id: Sefirah.DAAT, name: 'verification', color: '#22d3ee' },
  { id: Sefirah.CHESED, name: 'expansion', color: '#34d399' },
  { id: Sefirah.GEVURAH, name: 'critical-analysis', color: '#f87171' },
  { id: Sefirah.TIFERET, name: 'synthesis', color: '#fbbf24' },
  { id: Sefirah.NETZACH, name: 'persistence', color: '#fb923c' },
  { id: Sefirah.HOD, name: 'communication', color: '#facc15' },
  { id: Sefirah.YESOD, name: 'foundation', color: '#a3a3a3' },
  { id: Sefirah.MALKUTH, name: 'manifestation', color: '#78716c' },
]

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

interface QuickConfigBarProps {
  className?: string
}

export function QuickConfigBar({ className = '' }: QuickConfigBarProps) {
  const { weights, setWeight } = useSefirotStore()
  const [activePreset, setActivePreset] = useState<string>('balanced')
  const [isExpanded, setIsExpanded] = useState(false)

  // Apply preset
  const handlePresetSelect = (preset: Preset) => {
    setActivePreset(preset.id)
    Object.entries(preset.weights).forEach(([sefirah, weight]) => {
      setWeight(parseInt(sefirah) as Sefirah, weight)
    })
  }

  // Handle weight change
  const handleWeightChange = (sefirah: Sefirah, value: number) => {
    setWeight(sefirah, value)
    setActivePreset('custom')
  }

  // Get weight
  const getWeight = (sefirah: Sefirah): number => {
    return weights[sefirah] ?? 0.5
  }

  return (
    <div className={`bg-white border border-relic-mist ${className}`}>
      {/* Main Config Row */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-6">
          {/* Quick Settings Label */}
          <div className="flex-shrink-0">
            <span className="text-[9px] uppercase tracking-wider text-relic-slate font-mono">Quick Settings</span>
          </div>

          {/* Critical Layers */}
          <div className="flex-1 flex items-center gap-6">
            {CRITICAL_LAYERS.map((layer) => {
              const weight = getWeight(layer.id)
              return (
                <div key={layer.id} className="flex items-center gap-2 flex-1 max-w-[200px]">
                  <div className="flex items-center gap-1.5 min-w-[80px]">
                    <span className="text-amber-500 text-[8px]">★</span>
                    <span className="text-[9px] font-medium text-relic-void">{layer.name}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-[7px] text-relic-silver w-10">{layer.min}</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round(weight * 100)}
                      onChange={(e) => handleWeightChange(layer.id, parseInt(e.target.value) / 100)}
                      className="flex-1 h-1 bg-relic-ghost rounded-full appearance-none cursor-pointer
                               [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 
                               [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full 
                               [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white
                               [&::-webkit-slider-thumb]:shadow-sm"
                      style={{
                        background: `linear-gradient(to right, ${layer.color} 0%, ${layer.color} ${weight * 100}%, #e5e7eb ${weight * 100}%, #e5e7eb 100%)`,
                      }}
                    />
                    <span className="text-[7px] text-relic-silver w-10 text-right">{layer.max}</span>
                  </div>
                  <span className="text-[9px] font-medium text-relic-void tabular-nums w-8">
                    {Math.round(weight * 100)}%
                  </span>
                </div>
              )
            })}
          </div>

          {/* Presets */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset)}
                className={`px-2 py-1 text-[8px] rounded border transition-all ${
                  activePreset === preset.id
                    ? 'bg-relic-void text-white border-relic-void'
                    : 'bg-white text-relic-slate border-relic-mist hover:border-relic-slate'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>

          {/* Expand Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2 py-1 text-[8px] text-relic-silver hover:text-relic-slate transition-colors"
          >
            <span>{isExpanded ? '▴' : '▾'}</span>
            <span>all layers</span>
          </button>
        </div>
      </div>

      {/* Expanded All Layers */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-relic-mist"
          >
            <div className="px-4 py-3 bg-relic-ghost/30">
              <div className="grid grid-cols-6 gap-3">
                {ALL_LAYERS.map((layer) => {
                  const weight = getWeight(layer.id)
                  const isCritical = CRITICAL_LAYERS.some(l => l.id === layer.id)
                  
                  return (
                    <div key={layer.id} className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: layer.color }}
                      />
                      <span className={`text-[8px] w-20 truncate ${isCritical ? 'font-medium' : 'text-relic-slate'}`}>
                        {layer.name}
                        {isCritical && <span className="text-amber-500 ml-0.5">★</span>}
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={Math.round(weight * 100)}
                        onChange={(e) => handleWeightChange(layer.id, parseInt(e.target.value) / 100)}
                        className="flex-1 h-0.5 bg-relic-mist rounded-full appearance-none cursor-pointer min-w-[40px]"
                        style={{
                          background: `linear-gradient(to right, ${layer.color}90 0%, ${layer.color}90 ${weight * 100}%, #e5e7eb ${weight * 100}%, #e5e7eb 100%)`,
                        }}
                      />
                      <span className="text-[8px] text-relic-slate tabular-nums w-6">
                        {Math.round(weight * 100)}%
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default QuickConfigBar
