'use client'

/**
 * AI CONFIG PAGE - UNIFIED & OPTIMIZED
 * 
 * Tab 1: AI Computational Config
 *   - Compact Settings bar (top)
 *   - Configuration tree visual
 *   - Dual advanced trees (Processing Layers + Anti-Pattern Monitors)
 * 
 * Tab 2: History
 *   - Descent tree history from training
 *   - Chat history connection
 *   - Previous trees from conversations
 */

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { Sefirah, SEPHIROTH_METADATA } from '@/lib/ascent-tracker'
import { useSefirotStore } from '@/lib/stores/sefirot-store'

// ═══════════════════════════════════════════════════════════════════════════
// SHARED CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

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

const AI_LABELS: Record<number, { name: string; concept: string }> = {
  [Sefirah.KETHER]: { name: 'meta-cognition', concept: 'unified awareness' },
  [Sefirah.CHOKMAH]: { name: 'reasoning', concept: 'problem decomposition' },
  [Sefirah.BINAH]: { name: 'knowledge', concept: 'fact retrieval' },
  [Sefirah.DAAT]: { name: 'verification', concept: 'self-checking' },
  [Sefirah.CHESED]: { name: 'expansion', concept: 'creative exploration' },
  [Sefirah.GEVURAH]: { name: 'critical-analysis', concept: 'rigorous evaluation' },
  [Sefirah.TIFERET]: { name: 'synthesis', concept: 'balanced integration' },
  [Sefirah.NETZACH]: { name: 'persistence', concept: 'iterative refinement' },
  [Sefirah.HOD]: { name: 'communication', concept: 'clear articulation' },
  [Sefirah.YESOD]: { name: 'foundation', concept: 'grounded knowledge' },
  [Sefirah.MALKUTH]: { name: 'manifestation', concept: 'concrete output' },
}

// Layer extremities for sliders
const LAYER_EXTREMITIES: Record<number, { min: string; max: string }> = {
  [Sefirah.KETHER]: { min: 'surface', max: 'deep' },
  [Sefirah.CHOKMAH]: { min: 'shallow', max: 'deep' },
  [Sefirah.BINAH]: { min: 'focused', max: 'broad' },
  [Sefirah.DAAT]: { min: 'minimal', max: 'thorough' },
  [Sefirah.CHESED]: { min: 'constrained', max: 'expansive' },
  [Sefirah.GEVURAH]: { min: 'lenient', max: 'strict' },
  [Sefirah.TIFERET]: { min: 'partial', max: 'unified' },
  [Sefirah.NETZACH]: { min: 'quick', max: 'persistent' },
  [Sefirah.HOD]: { min: 'terse', max: 'eloquent' },
  [Sefirah.YESOD]: { min: 'intuitive', max: 'grounded' },
  [Sefirah.MALKUTH]: { min: 'abstract', max: 'concrete' },
}

// Critical layers (starred)
const CRITICAL_LAYERS = [Sefirah.CHOKMAH, Sefirah.BINAH, Sefirah.DAAT]

// All layers in processing order
const ALL_LAYERS = [
  Sefirah.KETHER, Sefirah.CHOKMAH, Sefirah.BINAH, Sefirah.DAAT,
  Sefirah.CHESED, Sefirah.GEVURAH, Sefirah.TIFERET,
  Sefirah.NETZACH, Sefirah.HOD, Sefirah.YESOD, Sefirah.MALKUTH
]

// Presets
const PRESETS = [
  { id: 'fast', name: 'fast', weights: { [Sefirah.CHOKMAH]: 0.4, [Sefirah.BINAH]: 0.5, [Sefirah.DAAT]: 0.3 } },
  { id: 'balanced', name: 'balanced', weights: { [Sefirah.CHOKMAH]: 0.6, [Sefirah.BINAH]: 0.6, [Sefirah.DAAT]: 0.6 } },
  { id: 'thorough', name: 'thorough', weights: { [Sefirah.CHOKMAH]: 0.85, [Sefirah.BINAH]: 0.8, [Sefirah.DAAT]: 0.9 } },
  { id: 'creative', name: 'creative', weights: { [Sefirah.CHOKMAH]: 0.6, [Sefirah.BINAH]: 0.5, [Sefirah.DAAT]: 0.4 } },
]

// Tree positions
const TREE_POSITIONS: Record<number, { x: number; y: number }> = {
  [Sefirah.KETHER]: { x: 225, y: 30 },
  [Sefirah.CHOKMAH]: { x: 340, y: 90 },
  [Sefirah.BINAH]: { x: 110, y: 90 },
  [Sefirah.DAAT]: { x: 225, y: 140 },
  [Sefirah.CHESED]: { x: 340, y: 200 },
  [Sefirah.GEVURAH]: { x: 110, y: 200 },
  [Sefirah.TIFERET]: { x: 225, y: 260 },
  [Sefirah.NETZACH]: { x: 340, y: 320 },
  [Sefirah.HOD]: { x: 110, y: 320 },
  [Sefirah.YESOD]: { x: 225, y: 380 },
  [Sefirah.MALKUTH]: { x: 225, y: 450 },
}

const TREE_PATHS: [Sefirah, Sefirah][] = [
  [Sefirah.KETHER, Sefirah.CHOKMAH], [Sefirah.KETHER, Sefirah.BINAH],
  [Sefirah.KETHER, Sefirah.TIFERET], [Sefirah.CHOKMAH, Sefirah.BINAH],
  [Sefirah.CHOKMAH, Sefirah.CHESED], [Sefirah.BINAH, Sefirah.GEVURAH],
  [Sefirah.CHESED, Sefirah.GEVURAH], [Sefirah.CHESED, Sefirah.TIFERET],
  [Sefirah.GEVURAH, Sefirah.TIFERET], [Sefirah.TIFERET, Sefirah.NETZACH],
  [Sefirah.TIFERET, Sefirah.HOD], [Sefirah.TIFERET, Sefirah.YESOD],
  [Sefirah.NETZACH, Sefirah.HOD], [Sefirah.NETZACH, Sefirah.YESOD],
  [Sefirah.HOD, Sefirah.YESOD], [Sefirah.YESOD, Sefirah.MALKUTH],
]

// Qliphoth data
const QLIPHOTH_DATA = [
  { id: 1, name: 'dual contradictions', severity: 'critical', x: 300, y: 40 },
  { id: 2, name: 'hiding sources', severity: 'high', x: 150, y: 40 },
  { id: 3, name: 'blocking truth', severity: 'critical', x: 225, y: 100 },
  { id: 4, name: 'drift away', severity: 'high', x: 340, y: 150 },
  { id: 5, name: 'repetitive echo', severity: 'medium', x: 110, y: 150 },
  { id: 6, name: 'arrogant tone', severity: 'medium', x: 225, y: 200 },
  { id: 7, name: 'info overload', severity: 'medium', x: 340, y: 260 },
  { id: 8, name: 'over-confidence', severity: 'high', x: 110, y: 260 },
  { id: 9, name: 'hallucinated facts', severity: 'critical', x: 225, y: 320 },
  { id: 10, name: 'false certainty', severity: 'high', x: 340, y: 380 },
  { id: 11, name: 'verbose padding', severity: 'medium', x: 110, y: 380 },
  { id: 12, name: 'superficial output', severity: 'high', x: 225, y: 440 },
]

// ═══════════════════════════════════════════════════════════════════════════
// REUSABLE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

/** Compact Slider Component */
function CompactSlider({ 
  layer, 
  weight, 
  onChange,
  showStar = false,
  compact = false 
}: { 
  layer: Sefirah
  weight: number
  onChange: (value: number) => void
  showStar?: boolean
  compact?: boolean
}) {
  const label = AI_LABELS[layer]
  const extremities = LAYER_EXTREMITIES[layer]
  const color = NODE_COLORS[layer]
  
  return (
    <div className={`flex items-center gap-2 ${compact ? 'py-0.5' : 'py-1'}`}>
      {showStar && <span className="text-amber-500 text-[8px]">★</span>}
      <span className={`${compact ? 'text-[8px] w-20' : 'text-[9px] w-16'} font-medium text-relic-void truncate`}>
        {label.name}
      </span>
      <span className="text-[7px] text-relic-silver w-12 text-right">{extremities.min}</span>
      <input
        type="range"
        min="0"
        max="100"
        value={Math.round(weight * 100)}
        onChange={(e) => onChange(parseInt(e.target.value) / 100)}
        className="flex-1 h-1 bg-relic-ghost rounded-full appearance-none cursor-pointer min-w-[60px]
                 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2
                 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full
                 [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white
                 [&::-webkit-slider-thumb]:shadow-sm"
        style={{
          background: `linear-gradient(to right, ${color} 0%, ${color} ${weight * 100}%, #e5e7eb ${weight * 100}%, #e5e7eb 100%)`,
        }}
      />
      <span className="text-[7px] text-relic-silver w-12">{extremities.max}</span>
      <span className="text-[9px] font-medium text-relic-void tabular-nums w-8 text-right">
        {Math.round(weight * 100)}%
      </span>
    </div>
  )
}

/** Processing Flow Visual */
function ProcessingFlowVisual({ weights }: { weights: Record<number, number> }) {
  const phases = [
    { name: 'INPUT', layers: [Sefirah.MALKUTH, Sefirah.YESOD] },
    { name: 'UNDERSTANDING', layers: [Sefirah.HOD, Sefirah.NETZACH] },
    { name: 'REASONING', layers: [Sefirah.TIFERET, Sefirah.GEVURAH, Sefirah.CHESED] },
    { name: 'SYNTHESIS', layers: [Sefirah.DAAT, Sefirah.BINAH, Sefirah.CHOKMAH] },
    { name: 'OUTPUT', layers: [Sefirah.KETHER] },
  ]
  
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[8px] uppercase tracking-wider text-relic-silver mb-1">Processing Flow</div>
      {phases.map((phase) => (
        <div key={phase.name} className="flex items-center gap-2">
          <span className="text-[7px] text-relic-silver w-20 uppercase">{phase.name}</span>
          <div className="flex gap-1">
            {phase.layers.map((layer) => {
              const weight = weights[layer] ?? 0.5
              return (
                <div
                  key={layer}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[7px] font-medium border"
                  style={{
                    backgroundColor: `${NODE_COLORS[layer]}${Math.round(weight * 60 + 20).toString(16)}`,
                    borderColor: NODE_COLORS[layer],
                    color: weight > 0.5 ? '#1f2937' : '#6b7280'
                  }}
                >
                  {Math.round(weight * 100)}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function AIConfigPageUnified() {
  const router = useRouter()
  const { weights, setWeight } = useSefirotStore()
  
  // UI State
  const [activeTab, setActiveTab] = useState<'config' | 'history'>('config')
  const [activePreset, setActivePreset] = useState<string>('balanced')
  const [showAllLayers, setShowAllLayers] = useState(false)
  const [selectedNode, setSelectedNode] = useState<Sefirah | null>(null)
  const [hoveredNode, setHoveredNode] = useState<Sefirah | null>(null)
  
  // History State
  const [historyFilter, setHistoryFilter] = useState<'all' | 'training' | 'chat'>('all')
  const [selectedHistory, setSelectedHistory] = useState<string | null>(null)

  // Get weight helper
  const getWeight = (layer: Sefirah): number => weights[layer] ?? 0.5

  // Apply preset
  const applyPreset = (presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId)
    if (preset) {
      setActivePreset(presetId)
      Object.entries(preset.weights).forEach(([layer, weight]) => {
        setWeight(parseInt(layer) as Sefirah, weight)
      })
    }
  }

  // Handle weight change
  const handleWeightChange = (layer: Sefirah, value: number) => {
    setWeight(layer, value)
    setActivePreset('custom')
  }

  // Mock history data
  const historyData = useMemo(() => [
    { id: '1', type: 'training', name: 'Deep Research Session', date: 'Jan 30', patterns: 3, score: 87 },
    { id: '2', type: 'chat', name: 'Philosophy Discussion', date: 'Jan 29', patterns: 5, score: 72 },
    { id: '3', type: 'training', name: 'Code Analysis', date: 'Jan 28', patterns: 2, score: 94 },
    { id: '4', type: 'chat', name: 'Creative Writing', date: 'Jan 27', patterns: 7, score: 65 },
    { id: '5', type: 'training', name: 'Data Synthesis', date: 'Jan 26', patterns: 4, score: 81 },
  ], [])

  const filteredHistory = historyFilter === 'all' 
    ? historyData 
    : historyData.filter(h => h.type === historyFilter)

  return (
    <div className="min-h-screen bg-relic-ghost/30 font-mono">
      {/* Header */}
      <div className="bg-white border-b border-relic-mist px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/')} className="p-1.5 hover:bg-relic-ghost rounded">
              <ArrowLeftIcon className="w-4 h-4 text-relic-slate" />
            </button>
            <div>
              <h1 className="text-[10px] uppercase tracking-widest text-relic-silver">AI Reasoning Architecture</h1>
              <h2 className="text-lg font-medium text-relic-void">AI Computational Config</h2>
            </div>
          </div>
          <button className="px-3 py-1.5 text-[9px] border border-relic-mist rounded hover:bg-relic-ghost">
            Save ⌘S
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-relic-mist">
        <div className="max-w-7xl mx-auto px-4 flex gap-6">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-2 text-[9px] uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'config' 
                ? 'border-purple-500 text-relic-void' 
                : 'border-transparent text-relic-slate hover:text-relic-void'
            }`}
          >
            ◆ Configuration
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 text-[9px] uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'history' 
                ? 'border-purple-500 text-relic-void' 
                : 'border-transparent text-relic-slate hover:text-relic-void'
            }`}
          >
            ◇ History
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: CONFIGURATION */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'config' && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Settings Bar */}
          <div className="bg-white border border-relic-mist rounded-lg p-3 mb-4">
            <div className="flex items-start gap-6">
              {/* Left: Settings Label */}
              <div className="flex-shrink-0 pt-1">
                <span className="text-[8px] uppercase tracking-wider text-relic-silver">Settings</span>
              </div>

              {/* Middle: Critical Layer Sliders */}
              <div className="flex-1 space-y-1">
                {CRITICAL_LAYERS.map((layer) => (
                  <CompactSlider
                    key={layer}
                    layer={layer}
                    weight={getWeight(layer)}
                    onChange={(v) => handleWeightChange(layer, v)}
                    showStar
                  />
                ))}
              </div>

              {/* Right: Presets + Expand */}
              <div className="flex-shrink-0 flex flex-col items-end gap-2">
                <div className="flex gap-1">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => applyPreset(preset.id)}
                      className={`px-2 py-1 text-[8px] rounded transition-all ${
                        activePreset === preset.id
                          ? 'bg-relic-void text-white'
                          : 'bg-relic-ghost text-relic-slate hover:bg-relic-mist'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowAllLayers(!showAllLayers)}
                  className="text-[8px] text-relic-silver hover:text-relic-slate flex items-center gap-1"
                >
                  <span>{showAllLayers ? '▴' : '▾'}</span>
                  <span>all layers</span>
                </button>
              </div>
            </div>

            {/* Expanded All Layers */}
            <AnimatePresence>
              {showAllLayers && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 mt-3 border-t border-relic-mist grid grid-cols-2 gap-x-6 gap-y-0">
                    {ALL_LAYERS.filter(l => !CRITICAL_LAYERS.includes(l)).map((layer) => (
                      <CompactSlider
                        key={layer}
                        layer={layer}
                        weight={getWeight(layer)}
                        onChange={(v) => handleWeightChange(layer, v)}
                        compact
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Configuration Tree + Processing Flow */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            {/* Processing Flow (Left) */}
            <div className="bg-white border border-relic-mist rounded-lg p-3">
              <ProcessingFlowVisual weights={weights} />
            </div>

            {/* Configuration Tree (Right - spans 3 cols) */}
            <div className="col-span-3 bg-white border border-relic-mist rounded-lg p-3">
              <div className="text-[8px] uppercase tracking-wider text-relic-silver mb-2">Configuration Tree</div>
              <svg viewBox="0 0 450 200" className="w-full h-32">
                {/* Simplified tree connections */}
                {TREE_PATHS.slice(0, 8).map(([from, to], idx) => {
                  const fromPos = TREE_POSITIONS[from]
                  const toPos = TREE_POSITIONS[to]
                  return (
                    <line
                      key={idx}
                      x1={fromPos.x}
                      y1={fromPos.y * 0.4}
                      x2={toPos.x}
                      y2={toPos.y * 0.4}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                    />
                  )
                })}
                {/* Nodes */}
                {ALL_LAYERS.slice(0, 7).map((layer) => {
                  const pos = TREE_POSITIONS[layer]
                  const weight = getWeight(layer)
                  const color = NODE_COLORS[layer]
                  const isCritical = CRITICAL_LAYERS.includes(layer)
                  return (
                    <g key={layer}>
                      <circle
                        cx={pos.x}
                        cy={pos.y * 0.4}
                        r={isCritical ? 12 : 8}
                        fill="white"
                        stroke={color}
                        strokeWidth={isCritical ? 2 : 1}
                      />
                      <circle
                        cx={pos.x}
                        cy={pos.y * 0.4}
                        r={(isCritical ? 10 : 6) * weight}
                        fill={color}
                        opacity={0.4}
                      />
                      <text
                        x={pos.x}
                        y={pos.y * 0.4 + 3}
                        textAnchor="middle"
                        fontSize="7"
                        fill="#374151"
                      >
                        {Math.round(weight * 100)}%
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
          </div>

          {/* Dual Advanced Trees */}
          <div className="grid grid-cols-2 gap-4">
            {/* LEFT: AI Processing Layers */}
            <div className="bg-white border border-relic-mist rounded-lg p-3">
              <div className="text-center text-[9px] uppercase tracking-wider text-relic-slate mb-2">
                AI Processing Layers
              </div>
              <svg viewBox="0 0 450 500" className="w-full">
                {/* Paths */}
                {TREE_PATHS.map(([from, to], idx) => {
                  const fromPos = TREE_POSITIONS[from]
                  const toPos = TREE_POSITIONS[to]
                  const avgWeight = ((weights[from] ?? 0.5) + (weights[to] ?? 0.5)) / 2
                  return (
                    <motion.line
                      key={idx}
                      x1={fromPos.x}
                      y1={fromPos.y}
                      x2={toPos.x}
                      y2={toPos.y}
                      stroke="#cbd5e1"
                      strokeWidth={1 + avgWeight}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.3 + avgWeight * 0.4 }}
                    />
                  )
                })}
                {/* Nodes */}
                {ALL_LAYERS.map((layer) => {
                  const pos = TREE_POSITIONS[layer]
                  const weight = getWeight(layer)
                  const color = NODE_COLORS[layer]
                  const label = AI_LABELS[layer]
                  const isSelected = selectedNode === layer
                  const isHovered = hoveredNode === layer
                  const radius = 18 + weight * 8
                  
                  return (
                    <g
                      key={layer}
                      className="cursor-pointer"
                      onClick={() => setSelectedNode(isSelected ? null : layer)}
                      onMouseEnter={() => setHoveredNode(layer)}
                      onMouseLeave={() => setHoveredNode(null)}
                    >
                      {/* Outer glow */}
                      <motion.circle
                        cx={pos.x}
                        cy={pos.y}
                        r={radius + 6}
                        fill={color}
                        initial={{ opacity: 0.1 }}
                        animate={{ opacity: isHovered ? 0.2 : 0.1 }}
                      />
                      {/* Selection ring */}
                      {isSelected && (
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={radius + 4}
                          fill="none"
                          stroke={color}
                          strokeWidth="2"
                          strokeDasharray="4 2"
                        />
                      )}
                      {/* Main circle */}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={radius}
                        fill="white"
                        stroke={color}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                      />
                      {/* Inner fill */}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={radius * weight * 0.7}
                        fill={color}
                        opacity={0.3 + weight * 0.3}
                      />
                      {/* Percentage */}
                      <text
                        x={pos.x}
                        y={pos.y + 3}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="500"
                        fill="#374151"
                      >
                        {Math.round(weight * 100)}%
                      </text>
                      {/* Label */}
                      <text
                        x={pos.x}
                        y={pos.y - radius - 6}
                        textAnchor="middle"
                        fontSize="8"
                        fill="#6b7280"
                      >
                        {label.name}
                      </text>
                    </g>
                  )
                })}
              </svg>
              {/* Legend */}
              <div className="flex justify-center gap-4 mt-2 text-[7px] text-relic-silver">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Active</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Developing</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-neutral-300" /> Planned</span>
              </div>
            </div>

            {/* RIGHT: Anti-Pattern Monitors */}
            <div className="bg-white border border-relic-mist rounded-lg p-3">
              <div className="text-center text-[9px] uppercase tracking-wider text-red-400 mb-2">
                Anti-Pattern Monitors
              </div>
              <svg viewBox="0 0 450 500" className="w-full">
                {QLIPHOTH_DATA.map((node) => {
                  const isCritical = node.severity === 'critical'
                  const isHigh = node.severity === 'high'
                  const radius = isCritical ? 22 : isHigh ? 18 : 14
                  const color = isCritical ? '#ef4444' : isHigh ? '#f97316' : '#fbbf24'
                  
                  return (
                    <g key={node.id}>
                      {/* Outer glow */}
                      {isCritical && (
                        <circle cx={node.x} cy={node.y} r={radius + 12} fill={color} opacity={0.1} />
                      )}
                      <circle cx={node.x} cy={node.y} r={radius + 6} fill={color} opacity={0.15} />
                      {/* Main circle */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={radius}
                        fill="white"
                        stroke={color}
                        strokeWidth={isCritical ? 2 : 1.5}
                      />
                      {/* Inner dot */}
                      <circle cx={node.x} cy={node.y} r={radius * 0.4} fill={color} opacity={0.5} />
                      {/* Label */}
                      <text x={node.x} y={node.y - radius - 6} textAnchor="middle" fontSize="7" fill="#6b7280">
                        {node.name}
                      </text>
                      {/* Severity */}
                      <text x={node.x} y={node.y + radius + 12} textAnchor="middle" fontSize="6" fill={color}>
                        {node.severity}
                      </text>
                    </g>
                  )
                })}
              </svg>
              {/* Legend */}
              <div className="flex justify-center gap-4 mt-2 text-[7px] text-relic-silver">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Critical</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> High</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Medium</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: HISTORY */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Filter Bar */}
          <div className="bg-white border border-relic-mist rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-[8px] uppercase tracking-wider text-relic-silver">Filter</span>
                <div className="flex gap-1">
                  {['all', 'training', 'chat'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setHistoryFilter(filter as typeof historyFilter)}
                      className={`px-2 py-1 text-[8px] rounded transition-all ${
                        historyFilter === filter
                          ? 'bg-relic-void text-white'
                          : 'bg-relic-ghost text-relic-slate hover:bg-relic-mist'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
              <button className="text-[8px] text-purple-500 hover:text-purple-700">
                Connect Chat History →
              </button>
            </div>
          </div>

          {/* History Grid */}
          <div className="grid grid-cols-3 gap-4">
            {/* History List */}
            <div className="col-span-1 bg-white border border-relic-mist rounded-lg p-3">
              <div className="text-[8px] uppercase tracking-wider text-relic-silver mb-3">
                Descent Tree History
              </div>
              <div className="space-y-2">
                {filteredHistory.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedHistory(item.id)}
                    className={`w-full text-left p-2 rounded border transition-all ${
                      selectedHistory === item.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-relic-mist hover:border-relic-slate'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-medium text-relic-void">{item.name}</span>
                      <span className={`text-[7px] px-1.5 py-0.5 rounded ${
                        item.type === 'training' 
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {item.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[8px] text-relic-silver">
                      <span>{item.date}</span>
                      <span>·</span>
                      <span>{item.patterns} patterns</span>
                      <span>·</span>
                      <span className={item.score >= 80 ? 'text-green-600' : item.score >= 60 ? 'text-amber-600' : 'text-red-600'}>
                        {item.score}% quality
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected History Preview */}
            <div className="col-span-2 bg-white border border-relic-mist rounded-lg p-3">
              {selectedHistory ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[8px] uppercase tracking-wider text-relic-silver">
                      Tree Visualization
                    </div>
                    <div className="flex gap-2">
                      <button className="px-2 py-1 text-[8px] bg-relic-ghost text-relic-slate rounded hover:bg-relic-mist">
                        Load Config
                      </button>
                      <button className="px-2 py-1 text-[8px] bg-relic-ghost text-relic-slate rounded hover:bg-relic-mist">
                        Compare
                      </button>
                    </div>
                  </div>
                  
                  {/* Tree Preview */}
                  <svg viewBox="0 0 450 400" className="w-full h-64 bg-relic-ghost/30 rounded">
                    {QLIPHOTH_DATA.slice(0, 6).map((node) => {
                      const severity = node.severity
                      const color = severity === 'critical' ? '#ef4444' : severity === 'high' ? '#f97316' : '#fbbf24'
                      return (
                        <g key={node.id}>
                          <circle cx={node.x} cy={node.y + 50} r={16} fill="white" stroke={color} strokeWidth="1.5" />
                          <circle cx={node.x} cy={node.y + 50} r={6} fill={color} opacity={0.5} />
                          <text x={node.x} y={node.y + 30} textAnchor="middle" fontSize="7" fill="#6b7280">
                            {node.name}
                          </text>
                        </g>
                      )
                    })}
                  </svg>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {[
                      { label: 'Patterns Detected', value: '5', color: 'text-red-500' },
                      { label: 'Quality Score', value: '72%', color: 'text-amber-500' },
                      { label: 'Messages Analyzed', value: '23', color: 'text-blue-500' },
                      { label: 'Duration', value: '45m', color: 'text-green-500' },
                    ].map((stat) => (
                      <div key={stat.label} className="text-center p-2 bg-relic-ghost/50 rounded">
                        <div className={`text-sm font-medium ${stat.color}`}>{stat.value}</div>
                        <div className="text-[7px] text-relic-silver uppercase">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-64 flex items-center justify-center text-[9px] text-relic-silver">
                  Select a history item to view its descent tree
                </div>
              )}
            </div>
          </div>

          {/* Chat History Connection */}
          <div className="mt-4 bg-white border border-relic-mist rounded-lg p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[8px] uppercase tracking-wider text-relic-silver">
                Linked Chat Sessions
              </div>
              <button className="text-[8px] text-purple-500 hover:text-purple-700">
                + Link New Session
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { name: 'Philosophy Deep Dive', date: 'Jan 29', trees: 3 },
                { name: 'Code Review Session', date: 'Jan 28', trees: 2 },
                { name: 'Research Analysis', date: 'Jan 27', trees: 5 },
                { name: 'Creative Writing', date: 'Jan 26', trees: 1 },
              ].map((session, idx) => (
                <div key={idx} className="p-2 border border-relic-mist rounded hover:border-purple-300 cursor-pointer">
                  <div className="text-[9px] font-medium text-relic-void mb-1">{session.name}</div>
                  <div className="flex items-center gap-2 text-[7px] text-relic-silver">
                    <span>{session.date}</span>
                    <span>·</span>
                    <span>{session.trees} trees</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Node Editor Popup */}
      <AnimatePresence>
        {selectedNode && activeTab === 'config' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white border border-relic-mist 
                       rounded-lg shadow-lg p-4 w-80 z-50"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: NODE_COLORS[selectedNode] }} />
                <span className="text-sm font-medium text-relic-void">{AI_LABELS[selectedNode].name}</span>
              </div>
              <button onClick={() => setSelectedNode(null)} className="text-relic-silver hover:text-relic-slate text-xs">✕</button>
            </div>
            <p className="text-[9px] text-relic-silver mb-3">{AI_LABELS[selectedNode].concept}</p>
            <CompactSlider
              layer={selectedNode}
              weight={getWeight(selectedNode)}
              onChange={(v) => handleWeightChange(selectedNode, v)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
