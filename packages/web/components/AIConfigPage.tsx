'use client'

/**
 * AI CONFIG PAGE - COMPACT MERGED VIEW
 * 
 * Combines:
 * - Quick Settings (top 3 critical layers)
 * - AI Processing Layers tree (left)
 * - Anti-Pattern Monitors tree (right)
 * 
 * All in one compact, scrollable view
 */

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { Sefirah, SEPHIROTH_METADATA } from '@/lib/ascent-tracker'
import { useSefirotStore } from '@/lib/stores/sefirot-store'

// ═══════════════════════════════════════════════════════════
// AI LAYER LABELS
// ═══════════════════════════════════════════════════════════

const AI_LABELS: Record<number, { primary: string; concept: string }> = {
  [Sefirah.KETHER]: { primary: 'meta-cognition', concept: 'unified awareness' },
  [Sefirah.CHOKMAH]: { primary: 'first-principles', concept: 'foundational reasoning' },
  [Sefirah.BINAH]: { primary: 'pattern-recognition', concept: 'structural analysis' },
  [Sefirah.DAAT]: { primary: 'emergent-insight', concept: 'hidden connections' },
  [Sefirah.CHESED]: { primary: 'expansion', concept: 'creative exploration' },
  [Sefirah.GEVURAH]: { primary: 'critical-analysis', concept: 'rigorous evaluation' },
  [Sefirah.TIFERET]: { primary: 'synthesis', concept: 'balanced integration' },
  [Sefirah.NETZACH]: { primary: 'persistence', concept: 'iterative refinement' },
  [Sefirah.HOD]: { primary: 'communication', concept: 'clear articulation' },
  [Sefirah.YESOD]: { primary: 'foundation', concept: 'grounded knowledge' },
  [Sefirah.MALKUTH]: { primary: 'manifestation', concept: 'concrete output' },
}

// Anti-pattern labels
const QLIPHOTH_DATA = [
  { id: 1, name: 'dual contradictions', concept: 'self-contradiction', severity: 'critical', x: 200, y: 40 },
  { id: 2, name: 'hiding sources', concept: 'opaque reasoning', severity: 'high', x: 100, y: 80 },
  { id: 3, name: 'blocking truth', concept: 'evasive response', severity: 'critical', x: 150, y: 120 },
  { id: 4, name: 'drift away', concept: 'topic wandering', severity: 'high', x: 200, y: 160 },
  { id: 5, name: 'repetitive echo', concept: 'circular logic', severity: 'medium', x: 100, y: 180 },
  { id: 6, name: 'arrogant tone', concept: 'dismissive tone', severity: 'medium', x: 150, y: 220 },
  { id: 7, name: 'info overload', concept: 'drowning in data', severity: 'medium', x: 200, y: 260 },
  { id: 8, name: 'over-confidence', concept: 'blind certainty', severity: 'high', x: 100, y: 280 },
  { id: 9, name: 'hallucinated facts', concept: 'fabrication', severity: 'critical', x: 150, y: 320 },
  { id: 10, name: 'false certainty', concept: 'opinion as fact', severity: 'high', x: 200, y: 360 },
  { id: 11, name: 'verbose padding', concept: 'empty words', severity: 'medium', x: 100, y: 380 },
  { id: 12, name: 'superficial output', concept: 'surface level', severity: 'high', x: 150, y: 420 },
]

// ═══════════════════════════════════════════════════════════
// TREE POSITIONS (Compact)
// ═══════════════════════════════════════════════════════════

const TREE_POSITIONS: Record<number, { x: number; y: number }> = {
  [Sefirah.KETHER]: { x: 140, y: 25 },
  [Sefirah.CHOKMAH]: { x: 210, y: 65 },
  [Sefirah.BINAH]: { x: 70, y: 65 },
  [Sefirah.DAAT]: { x: 140, y: 100 },
  [Sefirah.CHESED]: { x: 210, y: 140 },
  [Sefirah.GEVURAH]: { x: 70, y: 140 },
  [Sefirah.TIFERET]: { x: 140, y: 175 },
  [Sefirah.NETZACH]: { x: 210, y: 215 },
  [Sefirah.HOD]: { x: 70, y: 215 },
  [Sefirah.YESOD]: { x: 140, y: 255 },
  [Sefirah.MALKUTH]: { x: 140, y: 310 },
}

const QLIPHOTH_POSITIONS: Record<number, { x: number; y: number }> = {
  1: { x: 200, y: 25 },   // dual contradictions
  2: { x: 100, y: 25 },   // hiding sources
  3: { x: 150, y: 65 },   // blocking truth
  4: { x: 220, y: 100 },  // drift away
  5: { x: 80, y: 100 },   // repetitive echo
  6: { x: 150, y: 140 },  // arrogant tone
  7: { x: 220, y: 175 },  // info overload
  8: { x: 80, y: 175 },   // over-confidence
  9: { x: 150, y: 215 },  // hallucinated facts
  10: { x: 220, y: 255 }, // false certainty
  11: { x: 80, y: 255 },  // verbose padding
  12: { x: 150, y: 310 }, // superficial output
}

const TREE_PATHS: [Sefirah, Sefirah][] = [
  [Sefirah.KETHER, Sefirah.CHOKMAH],
  [Sefirah.KETHER, Sefirah.BINAH],
  [Sefirah.KETHER, Sefirah.TIFERET],
  [Sefirah.CHOKMAH, Sefirah.BINAH],
  [Sefirah.CHOKMAH, Sefirah.CHESED],
  [Sefirah.BINAH, Sefirah.GEVURAH],
  [Sefirah.CHESED, Sefirah.GEVURAH],
  [Sefirah.CHESED, Sefirah.TIFERET],
  [Sefirah.GEVURAH, Sefirah.TIFERET],
  [Sefirah.TIFERET, Sefirah.NETZACH],
  [Sefirah.TIFERET, Sefirah.HOD],
  [Sefirah.TIFERET, Sefirah.YESOD],
  [Sefirah.NETZACH, Sefirah.HOD],
  [Sefirah.NETZACH, Sefirah.YESOD],
  [Sefirah.HOD, Sefirah.YESOD],
  [Sefirah.YESOD, Sefirah.MALKUTH],
]

const NODE_COLORS: Record<number, string> = {
  [Sefirah.KETHER]: '#a78bfa',
  [Sefirah.CHOKMAH]: '#818cf8',
  [Sefirah.BINAH]: '#6366f1',
  [Sefirah.DAAT]: '#22d3ee',
  [Sefirah.CHESED]: '#34d399',
  [Sefirah.GEVURAH]: '#f87171',
  [Sefirah.TIFERET]: '#fbbf24',
  [Sefirah.NETZACH]: '#fb923c',
  [Sefirah.HOD]: '#facc15',
  [Sefirah.YESOD]: '#a3a3a3',
  [Sefirah.MALKUTH]: '#78716c',
}

// ═══════════════════════════════════════════════════════════
// PRESETS
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

// Critical layers (Top 3 for Quick Config)
// Maps to: knowledge (BINAH), reasoning (CHOKMAH), verification (DAAT)
const CRITICAL_LAYERS = [
  { id: Sefirah.BINAH, name: 'knowledge', concept: 'retrieves facts and expertise', min: 'focused', max: 'broad' },
  { id: Sefirah.CHOKMAH, name: 'reasoning', concept: 'breaks problems into steps', min: 'shallow', max: 'deep' },
  { id: Sefirah.DAAT, name: 'verification', concept: 'checks for errors', min: 'minimal', max: 'thorough' },
]

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

export function AIConfigPage() {
  const router = useRouter()
  const { weights, setWeight } = useSefirotStore()
  
  // State
  const [activePreset, setActivePreset] = useState<string>('balanced')
  const [showAllLayers, setShowAllLayers] = useState(false)
  const [selectedNode, setSelectedNode] = useState<Sefirah | null>(null)
  const [hoveredNode, setHoveredNode] = useState<Sefirah | null>(null)

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

  // Get weight for a layer
  const getWeight = (sefirah: Sefirah): number => {
    return weights[sefirah] ?? 0.5
  }

  return (
    <div className="min-h-screen bg-neutral-50 font-mono">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="p-1.5 hover:bg-neutral-100 rounded transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4 text-neutral-400" />
              </button>
              <div>
                <h1 className="text-[10px] uppercase tracking-widest text-neutral-400">AI Computational Config</h1>
                <p className="text-xs text-neutral-600">Configure processing layers for optimal responses</p>
              </div>
            </div>
            <button className="px-3 py-1.5 text-[10px] border border-neutral-200 rounded hover:bg-neutral-50 transition-colors">
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Quick Settings Card */}
        <div className="bg-white border border-neutral-200 rounded-lg p-4 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Quick Settings</h2>
              <p className="text-[9px] text-neutral-300">Top 3 impact layers</p>
            </div>
            <div className="flex items-center gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset)}
                  className={`px-2 py-1 text-[9px] rounded border transition-all ${
                    activePreset === preset.id
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
              {activePreset === 'custom' && (
                <span className="px-2 py-1 text-[9px] text-neutral-400 border border-dashed border-neutral-300 rounded">
                  custom
                </span>
              )}
            </div>
          </div>

          {/* Critical Layers Sliders */}
          <div className="grid grid-cols-3 gap-6">
            {CRITICAL_LAYERS.map((layer) => {
              const weight = getWeight(layer.id)
              const color = NODE_COLORS[layer.id]
              
              return (
                <div key={layer.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-500 text-[10px]">★</span>
                      <span className="text-xs font-medium text-neutral-700">{layer.name}</span>
                    </div>
                    <span className="text-xs font-medium text-neutral-900 tabular-nums">
                      {Math.round(weight * 100)}%
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] text-neutral-400 w-12">{layer.min}</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round(weight * 100)}
                      onChange={(e) => handleWeightChange(layer.id, parseInt(e.target.value) / 100)}
                      className="flex-1 h-1 bg-neutral-100 rounded-full appearance-none cursor-pointer
                               [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
                               [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full 
                               [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
                               [&::-webkit-slider-thumb]:shadow-sm"
                      style={{
                        background: `linear-gradient(to right, ${color} 0%, ${color} ${weight * 100}%, #f5f5f5 ${weight * 100}%, #f5f5f5 100%)`,
                      }}
                    />
                    <span className="text-[8px] text-neutral-400 w-12 text-right">{layer.max}</span>
                  </div>
                  
                  <p className="text-[9px] text-neutral-400">{layer.concept}</p>
                </div>
              )
            })}
          </div>

          {/* Expand All Layers */}
          <button
            onClick={() => setShowAllLayers(!showAllLayers)}
            className="w-full mt-4 py-2 text-[9px] text-neutral-500 border border-neutral-200 rounded 
                       hover:bg-neutral-50 hover:border-neutral-300 transition-colors flex items-center justify-center gap-2"
          >
            <span className="uppercase tracking-wider">
              {showAllLayers ? 'Hide' : 'Show'} all 11 layers
            </span>
            <span>{showAllLayers ? '▴' : '▾'}</span>
          </button>

          {/* All Layers (Expanded) */}
          <AnimatePresence>
            {showAllLayers && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-4 mt-4 border-t border-neutral-100">
                  <div className="grid grid-cols-4 gap-3">
                    {Object.entries(TREE_POSITIONS).map(([sefirahStr]) => {
                      const sefirah = parseInt(sefirahStr) as Sefirah
                      const weight = getWeight(sefirah)
                      const color = NODE_COLORS[sefirah]
                      const label = AI_LABELS[sefirah]
                      const isCritical = CRITICAL_LAYERS.some(l => l.id === sefirah)
                      
                      return (
                        <div key={sefirah} className="flex items-center gap-2 py-1">
                          <div 
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className={`text-[9px] w-24 truncate ${isCritical ? 'font-medium' : ''}`}>
                            {label?.primary}
                            {isCritical && <span className="text-amber-500 ml-0.5">★</span>}
                          </span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={Math.round(weight * 100)}
                            onChange={(e) => handleWeightChange(sefirah, parseInt(e.target.value) / 100)}
                            className="flex-1 h-1 bg-neutral-100 rounded-full appearance-none cursor-pointer"
                            style={{
                              background: `linear-gradient(to right, ${color}80 0%, ${color}80 ${weight * 100}%, #f5f5f5 ${weight * 100}%, #f5f5f5 100%)`,
                            }}
                          />
                          <span className="text-[9px] text-neutral-500 tabular-nums w-8 text-right">
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

        {/* Trees Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Left: AI Processing Layers */}
          <div className="bg-white border border-neutral-200 rounded-lg p-3">
            <div className="text-center text-[10px] font-mono mb-2 text-neutral-500 uppercase tracking-wider">
              AI Processing Layers
            </div>
            
            <svg viewBox="0 0 280 340" className="w-full max-w-[280px] mx-auto">
              {/* Paths */}
              {TREE_PATHS.map(([from, to], idx) => {
                const fromPos = TREE_POSITIONS[from]
                const toPos = TREE_POSITIONS[to]
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
                    strokeWidth={1 + avgWeight}
                    strokeOpacity={0.3 + avgWeight * 0.4}
                  />
                )
              })}

              {/* Nodes */}
              {Object.entries(TREE_POSITIONS).map(([sefirahStr, pos]) => {
                const sefirah = parseInt(sefirahStr) as Sefirah
                const weight = weights[sefirah] ?? 0.5
                const color = NODE_COLORS[sefirah]
                const isSelected = selectedNode === sefirah
                const isHovered = hoveredNode === sefirah
                const radius = 14 + weight * 6
                const label = AI_LABELS[sefirah]

                return (
                  <g
                    key={sefirah}
                    className="cursor-pointer"
                    onClick={() => setSelectedNode(selectedNode === sefirah ? null : sefirah)}
                    onMouseEnter={() => setHoveredNode(sefirah)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    {/* Selection ring */}
                    {isSelected && (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={radius + 3}
                        fill="none"
                        stroke={color}
                        strokeWidth="1.5"
                        strokeDasharray="3 2"
                      />
                    )}
                    
                    {/* Main circle */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={radius}
                      fill="white"
                      stroke={color}
                      strokeWidth={isSelected ? 2 : 1}
                    />

                    {/* Inner fill */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={radius * weight * 0.8}
                      fill={color}
                      fillOpacity={0.25 + weight * 0.3}
                    />

                    {/* Percentage */}
                    <text
                      x={pos.x}
                      y={pos.y + 3}
                      textAnchor="middle"
                      fontSize="8"
                      fill={weight > 0.5 ? '#374151' : '#9ca3af'}
                      fontWeight="500"
                    >
                      {Math.round(weight * 100)}%
                    </text>

                    {/* Label (on hover or always for key nodes) */}
                    {(isHovered || isSelected || weight > 0.7) && (
                      <text
                        x={pos.x}
                        y={pos.y - radius - 4}
                        textAnchor="middle"
                        fontSize="7"
                        fill="#6b7280"
                      >
                        {label?.primary}
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>

            {/* Legend */}
            <div className="flex items-center justify-center gap-3 mt-2 text-[8px] text-neutral-400">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Active
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Developing
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" /> Planned
              </span>
            </div>
          </div>

          {/* Right: Anti-Pattern Monitors */}
          <div className="bg-white border border-neutral-200 rounded-lg p-3">
            <div className="text-center text-[10px] font-mono mb-2 text-red-400 uppercase tracking-wider">
              Anti-Pattern Monitors
            </div>
            
            <svg viewBox="0 0 280 340" className="w-full max-w-[280px] mx-auto">
              {/* Qliphoth nodes */}
              {QLIPHOTH_DATA.map((node) => {
                const pos = QLIPHOTH_POSITIONS[node.id]
                const isCritical = node.severity === 'critical'
                const isHigh = node.severity === 'high'
                const radius = isCritical ? 18 : isHigh ? 15 : 12
                const baseColor = isCritical ? '#ef4444' : isHigh ? '#f97316' : '#fbbf24'
                
                return (
                  <g key={node.id}>
                    {/* Outer glow for critical */}
                    {isCritical && (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={radius + 8}
                        fill={baseColor}
                        fillOpacity={0.1}
                      />
                    )}
                    
                    {/* Main circle */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={radius}
                      fill="white"
                      stroke={baseColor}
                      strokeWidth={isCritical ? 2 : 1}
                    />

                    {/* Inner dot */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={radius * 0.4}
                      fill={baseColor}
                      fillOpacity={0.5}
                    />

                    {/* Label */}
                    <text
                      x={pos.x}
                      y={pos.y - radius - 4}
                      textAnchor="middle"
                      fontSize="6"
                      fill="#6b7280"
                    >
                      {node.name}
                    </text>

                    {/* Severity badge */}
                    <text
                      x={pos.x}
                      y={pos.y + radius + 10}
                      textAnchor="middle"
                      fontSize="5"
                      fill={baseColor}
                      textTransform="uppercase"
                    >
                      {node.severity}
                    </text>
                  </g>
                )
              })}
            </svg>

            {/* Legend */}
            <div className="flex items-center justify-center gap-3 mt-2 text-[8px] text-neutral-400">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Critical
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> High
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Medium
              </span>
            </div>
          </div>
        </div>

        {/* Node Editor (when selected) */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white border border-neutral-200 
                         rounded-lg shadow-lg p-4 w-80 z-50"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: NODE_COLORS[selectedNode] }}
                  />
                  <span className="text-sm font-medium text-neutral-700">
                    {AI_LABELS[selectedNode]?.primary}
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedNode(null)}
                  className="text-neutral-400 hover:text-neutral-600 text-xs"
                >
                  ✕
                </button>
              </div>
              <p className="text-[10px] text-neutral-400 mb-3">{AI_LABELS[selectedNode]?.concept}</p>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round((weights[selectedNode] ?? 0.5) * 100)}
                  onChange={(e) => handleWeightChange(selectedNode, parseInt(e.target.value) / 100)}
                  className="flex-1 h-1.5 bg-neutral-100 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${NODE_COLORS[selectedNode]} 0%, ${NODE_COLORS[selectedNode]} ${(weights[selectedNode] ?? 0.5) * 100}%, #f5f5f5 ${(weights[selectedNode] ?? 0.5) * 100}%, #f5f5f5 100%)`,
                  }}
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={Math.round((weights[selectedNode] ?? 0.5) * 100)}
                  onChange={(e) => handleWeightChange(selectedNode, parseInt(e.target.value) / 100)}
                  className="w-14 px-2 py-1 text-xs text-center border border-neutral-200 rounded bg-white"
                />
                <span className="text-[10px] text-neutral-400">%</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default AIConfigPage
