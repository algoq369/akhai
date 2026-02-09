'use client'

/**
 * AI CONFIG PAGE - UNIFIED & OPTIMIZED v2
 * 
 * Tab 1: Configuration
 *   - Ultra-compact number inputs for layers
 *   - Configuration console with tree visual
 *   - Original dual trees with colorful orbs
 * 
 * Tab 2: History
 *   - Descent tree history from training
 *   - Chat history connection
 */

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { Layer, LAYER_METADATA } from '@/lib/layer-registry'
import { useLayerStore } from '@/lib/stores/layer-store'

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const NODE_COLORS: Record<number, string> = {
  [Layer.META_CORE]: '#a78bfa',
  [Layer.REASONING]: '#818cf8',
  [Layer.ENCODER]: '#6366f1',
  [Layer.SYNTHESIS]: '#22d3ee',
  [Layer.EXPANSION]: '#34d399',
  [Layer.DISCRIMINATOR]: '#f87171',
  [Layer.ATTENTION]: '#fbbf24',
  [Layer.GENERATIVE]: '#fb923c',
  [Layer.CLASSIFIER]: '#facc15',
  [Layer.EXECUTOR]: '#a3a3a3',
  [Layer.EMBEDDING]: '#78716c',
}

const AI_LABELS: Record<number, { name: string; concept: string }> = {
  [Layer.META_CORE]: { name: 'meta-cognition', concept: 'unified awareness' },
  [Layer.REASONING]: { name: 'reasoning', concept: 'problem decomposition' },
  [Layer.ENCODER]: { name: 'knowledge', concept: 'fact retrieval' },
  [Layer.SYNTHESIS]: { name: 'verification', concept: 'self-checking' },
  [Layer.EXPANSION]: { name: 'expansion', concept: 'creative exploration' },
  [Layer.DISCRIMINATOR]: { name: 'critical-analysis', concept: 'rigorous evaluation' },
  [Layer.ATTENTION]: { name: 'synthesis', concept: 'balanced integration' },
  [Layer.GENERATIVE]: { name: 'persistence', concept: 'iterative refinement' },
  [Layer.CLASSIFIER]: { name: 'communication', concept: 'clear articulation' },
  [Layer.EXECUTOR]: { name: 'foundation', concept: 'grounded knowledge' },
  [Layer.EMBEDDING]: { name: 'manifestation', concept: 'concrete output' },
}

const CRITICAL_LAYERS = [Layer.REASONING, Layer.ENCODER, Layer.SYNTHESIS]

const ALL_LAYERS = [
  Layer.META_CORE, Layer.REASONING, Layer.ENCODER, Layer.SYNTHESIS,
  Layer.EXPANSION, Layer.DISCRIMINATOR, Layer.ATTENTION,
  Layer.GENERATIVE, Layer.CLASSIFIER, Layer.EXECUTOR, Layer.EMBEDDING
]

const PRESETS = [
  { id: 'fast', name: 'fast', weights: { [Layer.REASONING]: 0.4, [Layer.ENCODER]: 0.5, [Layer.SYNTHESIS]: 0.3, [Layer.META_CORE]: 0.4, [Layer.EXPANSION]: 0.3, [Layer.DISCRIMINATOR]: 0.5, [Layer.ATTENTION]: 0.5, [Layer.GENERATIVE]: 0.4, [Layer.CLASSIFIER]: 0.6, [Layer.EXECUTOR]: 0.5, [Layer.EMBEDDING]: 0.7 } },
  { id: 'balanced', name: 'balanced', weights: { [Layer.REASONING]: 0.6, [Layer.ENCODER]: 0.6, [Layer.SYNTHESIS]: 0.6, [Layer.META_CORE]: 0.5, [Layer.EXPANSION]: 0.6, [Layer.DISCRIMINATOR]: 0.6, [Layer.ATTENTION]: 0.7, [Layer.GENERATIVE]: 0.6, [Layer.CLASSIFIER]: 0.6, [Layer.EXECUTOR]: 0.6, [Layer.EMBEDDING]: 0.6 } },
  { id: 'thorough', name: 'thorough', weights: { [Layer.REASONING]: 0.85, [Layer.ENCODER]: 0.8, [Layer.SYNTHESIS]: 0.9, [Layer.META_CORE]: 0.6, [Layer.EXPANSION]: 0.5, [Layer.DISCRIMINATOR]: 0.85, [Layer.ATTENTION]: 0.7, [Layer.GENERATIVE]: 0.7, [Layer.CLASSIFIER]: 0.75, [Layer.EXECUTOR]: 0.8, [Layer.EMBEDDING]: 0.75 } },
  { id: 'creative', name: 'creative', weights: { [Layer.REASONING]: 0.6, [Layer.ENCODER]: 0.5, [Layer.SYNTHESIS]: 0.4, [Layer.META_CORE]: 0.7, [Layer.EXPANSION]: 0.9, [Layer.DISCRIMINATOR]: 0.3, [Layer.ATTENTION]: 0.8, [Layer.GENERATIVE]: 0.85, [Layer.CLASSIFIER]: 0.5, [Layer.EXECUTOR]: 0.55, [Layer.EMBEDDING]: 0.65 } },
]

// Tree positions for full tree
const TREE_POSITIONS: Record<number, { x: number; y: number }> = {
  [Layer.META_CORE]: { x: 250, y: 40 },
  [Layer.REASONING]: { x: 380, y: 110 },
  [Layer.ENCODER]: { x: 120, y: 110 },
  [Layer.SYNTHESIS]: { x: 250, y: 170 },
  [Layer.EXPANSION]: { x: 380, y: 240 },
  [Layer.DISCRIMINATOR]: { x: 120, y: 240 },
  [Layer.ATTENTION]: { x: 250, y: 310 },
  [Layer.GENERATIVE]: { x: 380, y: 380 },
  [Layer.CLASSIFIER]: { x: 120, y: 380 },
  [Layer.EXECUTOR]: { x: 250, y: 450 },
  [Layer.EMBEDDING]: { x: 250, y: 530 },
}

const TREE_PATHS: [Layer, Layer][] = [
  [Layer.META_CORE, Layer.REASONING], [Layer.META_CORE, Layer.ENCODER],
  [Layer.META_CORE, Layer.ATTENTION], [Layer.REASONING, Layer.ENCODER],
  [Layer.REASONING, Layer.EXPANSION], [Layer.REASONING, Layer.ATTENTION],
  [Layer.ENCODER, Layer.DISCRIMINATOR], [Layer.ENCODER, Layer.ATTENTION],
  [Layer.EXPANSION, Layer.DISCRIMINATOR], [Layer.EXPANSION, Layer.ATTENTION],
  [Layer.DISCRIMINATOR, Layer.ATTENTION], [Layer.ATTENTION, Layer.GENERATIVE],
  [Layer.ATTENTION, Layer.CLASSIFIER], [Layer.ATTENTION, Layer.EXECUTOR],
  [Layer.GENERATIVE, Layer.CLASSIFIER], [Layer.GENERATIVE, Layer.EXECUTOR],
  [Layer.CLASSIFIER, Layer.EXECUTOR], [Layer.EXECUTOR, Layer.EMBEDDING],
]

// Antipatterns data
const ANTIPATTERN_DATA = [
  { id: 1, name: 'dual contradictions', severity: 'critical', x: 380, y: 40 },
  { id: 2, name: 'hiding sources', severity: 'high', x: 120, y: 40 },
  { id: 3, name: 'blocking truth', severity: 'critical', x: 250, y: 110 },
  { id: 4, name: 'drift away', severity: 'high', x: 380, y: 170 },
  { id: 5, name: 'repetitive echo', severity: 'medium', x: 120, y: 170 },
  { id: 6, name: 'arrogant tone', severity: 'medium', x: 250, y: 240 },
  { id: 7, name: 'info overload', severity: 'medium', x: 380, y: 310 },
  { id: 8, name: 'over-confidence', severity: 'high', x: 120, y: 310 },
  { id: 9, name: 'hallucinated facts', severity: 'critical', x: 250, y: 380 },
  { id: 10, name: 'false certainty', severity: 'high', x: 380, y: 450 },
  { id: 11, name: 'verbose padding', severity: 'medium', x: 120, y: 450 },
  { id: 12, name: 'superficial output', severity: 'high', x: 250, y: 520 },
]

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function AIConfigUnified() {
  const router = useRouter()
  const { weights, setWeight } = useLayerStore()
  
  const [activeTab, setActiveTab] = useState<'config' | 'history'>('config')
  const [activePreset, setActivePreset] = useState<string>('balanced')
  const [selectedNode, setSelectedNode] = useState<Layer | null>(null)
  const [hoveredNode, setHoveredNode] = useState<Layer | null>(null)
  const [historyFilter, setHistoryFilter] = useState<'all' | 'training' | 'chat'>('all')
  const [selectedHistory, setSelectedHistory] = useState<string | null>(null)

  const getWeight = (layer: Layer): number => weights[layer] ?? 0.5

  const applyPreset = (presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId)
    if (preset) {
      setActivePreset(presetId)
      Object.entries(preset.weights).forEach(([layer, weight]) => {
        setWeight(parseInt(layer) as Layer, weight)
      })
    }
  }

  const handleWeightChange = (layer: Layer, value: number) => {
    const clamped = Math.max(0, Math.min(100, value))
    setWeight(layer, clamped / 100)
    setActivePreset('custom')
  }

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
      <div className="bg-white border-b border-relic-mist px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/')} className="p-1 hover:bg-relic-ghost rounded">
              <ArrowLeftIcon className="w-4 h-4 text-relic-slate" />
            </button>
            <div>
              <h1 className="text-[9px] uppercase tracking-widest text-relic-silver">AI Reasoning Architecture</h1>
              <h2 className="text-base font-medium text-relic-void">AI Computational Config</h2>
            </div>
          </div>
          <button className="px-2 py-1 text-[8px] border border-relic-mist rounded hover:bg-relic-ghost">
            Save ⌘S
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-relic-mist">
        <div className="max-w-7xl mx-auto px-4 flex gap-4">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-1.5 text-[8px] uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'config' ? 'border-purple-500 text-relic-void' : 'border-transparent text-relic-slate'
            }`}
          >
            ◆ Configuration
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-1.5 text-[8px] uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'history' ? 'border-purple-500 text-relic-void' : 'border-transparent text-relic-slate'
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
        <div className="max-w-7xl mx-auto px-4 py-3">
          
          {/* Configuration Console + Tree Visual */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            
            {/* LEFT: Compact Layer Controls */}
            <div className="bg-white border border-relic-mist rounded p-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[8px] uppercase tracking-wider text-relic-silver">Layer Weights</span>
                <div className="flex gap-1">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => applyPreset(preset.id)}
                      className={`px-1.5 py-0.5 text-[7px] rounded transition-all ${
                        activePreset === preset.id
                          ? 'bg-relic-void text-white'
                          : 'bg-relic-ghost text-relic-slate hover:bg-relic-mist'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Compact number inputs grid */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                {ALL_LAYERS.map((layer) => {
                  const isCritical = CRITICAL_LAYERS.includes(layer)
                  const color = NODE_COLORS[layer]
                  const weight = Math.round(getWeight(layer) * 100)
                  return (
                    <div key={layer} className="flex items-center gap-1">
                      {isCritical && <span className="text-amber-500 text-[6px]">★</span>}
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-[7px] text-relic-slate flex-1 truncate">{AI_LABELS[layer].name}</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={weight}
                        onChange={(e) => handleWeightChange(layer, parseInt(e.target.value) || 0)}
                        className="w-8 h-4 text-[8px] text-center border border-relic-mist rounded 
                                 focus:outline-none focus:border-purple-400 bg-white"
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* CENTER + RIGHT: Configuration Tree Visual */}
            <div className="col-span-2 bg-white border border-relic-mist rounded p-2">
              <div className="text-[8px] uppercase tracking-wider text-relic-silver mb-1">Configuration Tree</div>
              <svg viewBox="0 0 500 280" className="w-full h-48">
                {/* Paths */}
                {TREE_PATHS.map(([from, to], idx) => {
                  const fromPos = TREE_POSITIONS[from]
                  const toPos = TREE_POSITIONS[to]
                  const avgWeight = ((weights[from] ?? 0.5) + (weights[to] ?? 0.5)) / 2
                  return (
                    <line
                      key={idx}
                      x1={fromPos.x}
                      y1={fromPos.y * 0.5}
                      x2={toPos.x}
                      y2={toPos.y * 0.5}
                      stroke="#e5e7eb"
                      strokeWidth={0.5 + avgWeight}
                      opacity={0.4 + avgWeight * 0.3}
                    />
                  )
                })}
                {/* Nodes */}
                {ALL_LAYERS.map((layer) => {
                  const pos = TREE_POSITIONS[layer]
                  const weight = getWeight(layer)
                  const color = NODE_COLORS[layer]
                  const label = AI_LABELS[layer]
                  const isCritical = CRITICAL_LAYERS.includes(layer)
                  const isSelected = selectedNode === layer
                  const radius = 10 + weight * 6
                  
                  return (
                    <g
                      key={layer}
                      className="cursor-pointer"
                      onClick={() => setSelectedNode(isSelected ? null : layer)}
                    >
                      {/* Outer glow */}
                      <circle
                        cx={pos.x}
                        cy={pos.y * 0.5}
                        r={radius + 4}
                        fill={color}
                        opacity={isSelected ? 0.25 : 0.1}
                      />
                      {/* Main circle */}
                      <circle
                        cx={pos.x}
                        cy={pos.y * 0.5}
                        r={radius}
                        fill="white"
                        stroke={color}
                        strokeWidth={isCritical ? 2 : 1}
                      />
                      {/* Inner fill */}
                      <circle
                        cx={pos.x}
                        cy={pos.y * 0.5}
                        r={radius * weight * 0.7}
                        fill={color}
                        opacity={0.4}
                      />
                      {/* Percentage */}
                      <text x={pos.x} y={pos.y * 0.5 + 3} textAnchor="middle" fontSize="7" fill="#374151">
                        {Math.round(weight * 100)}
                      </text>
                      {/* Label below */}
                      <text x={pos.x} y={pos.y * 0.5 + radius + 8} textAnchor="middle" fontSize="6" fill="#9ca3af">
                        {label.name}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
          </div>

          {/* Dual Advanced Trees with Original Colorful Orbs */}
          <div className="grid grid-cols-2 gap-3">
            
            {/* LEFT: AI Processing Layers - Original Style */}
            <div className="bg-white border border-relic-mist rounded p-3">
              <div className="text-center text-[9px] uppercase tracking-wider text-relic-slate mb-2">
                AI Processing Layers
              </div>
              <svg viewBox="0 0 500 580" className="w-full">
                {/* Connection Paths with pillar colors */}
                {TREE_PATHS.map(([from, to], idx) => {
                  const fromPos = TREE_POSITIONS[from]
                  const toPos = TREE_POSITIONS[to]
                  const fromMeta = LAYER_METADATA[from]
                  const toMeta = LAYER_METADATA[to]
                  const avgWeight = ((weights[from] ?? 0.5) + (weights[to] ?? 0.5)) / 2
                  
                  let strokeColor = '#cbd5e1'
                  if (fromMeta?.pillar === toMeta?.pillar) {
                    if (fromMeta?.pillar === 'left') strokeColor = '#ef4444'
                    else if (fromMeta?.pillar === 'right') strokeColor = '#3b82f6'
                    else if (fromMeta?.pillar === 'middle') strokeColor = '#a855f7'
                  }
                  
                  return (
                    <motion.line
                      key={idx}
                      x1={fromPos.x}
                      y1={fromPos.y}
                      x2={toPos.x}
                      y2={toPos.y}
                      stroke={strokeColor}
                      strokeWidth={1.5 + avgWeight}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.3 + avgWeight * 0.4 }}
                      transition={{ duration: 0.5, delay: idx * 0.02 }}
                    />
                  )
                })}
                
                {/* Nodes with colorful orbs */}
                {ALL_LAYERS.map((layer) => {
                  const pos = TREE_POSITIONS[layer]
                  const weight = getWeight(layer)
                  const color = NODE_COLORS[layer]
                  const label = AI_LABELS[layer]
                  const isCritical = CRITICAL_LAYERS.includes(layer)
                  const isSelected = selectedNode === layer
                  const isHovered = hoveredNode === layer
                  const radius = 16 + weight * 10
                  
                  return (
                    <g
                      key={layer}
                      className="cursor-pointer"
                      onClick={() => setSelectedNode(isSelected ? null : layer)}
                      onMouseEnter={() => setHoveredNode(layer)}
                      onMouseLeave={() => setHoveredNode(null)}
                    >
                      {/* Outer glow pulse */}
                      <motion.circle
                        cx={pos.x}
                        cy={pos.y}
                        r={radius + 12}
                        fill={color}
                        initial={{ opacity: 0.05 }}
                        animate={{ opacity: isHovered ? 0.15 : 0.05, scale: isHovered ? 1.1 : 1 }}
                        transition={{ duration: 0.3 }}
                      />
                      
                      {/* Second glow layer */}
                      <motion.circle
                        cx={pos.x}
                        cy={pos.y}
                        r={radius + 6}
                        fill={color}
                        opacity={0.15}
                        animate={{ opacity: [0.1, 0.2, 0.1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      />
                      
                      {/* Selection ring */}
                      {isSelected && (
                        <motion.circle
                          cx={pos.x}
                          cy={pos.y}
                          r={radius + 4}
                          fill="none"
                          stroke={color}
                          strokeWidth="2"
                          strokeDasharray="4 2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.8 }}
                        />
                      )}
                      
                      {/* Main orb - gradient effect */}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={radius}
                        fill="white"
                        stroke={color}
                        strokeWidth={isSelected ? 3 : isCritical ? 2 : 1.5}
                      />
                      
                      {/* Inner colored fill based on weight */}
                      <motion.circle
                        cx={pos.x}
                        cy={pos.y}
                        r={radius * 0.75}
                        fill={color}
                        initial={{ opacity: 0.2 }}
                        animate={{ opacity: 0.2 + weight * 0.4 }}
                      />
                      
                      {/* Center highlight */}
                      <circle
                        cx={pos.x - radius * 0.2}
                        cy={pos.y - radius * 0.2}
                        r={radius * 0.15}
                        fill="white"
                        opacity={0.5}
                      />
                      
                      {/* Percentage text */}
                      <text
                        x={pos.x}
                        y={pos.y + 4}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="600"
                        fill="#374151"
                      >
                        {Math.round(weight * 100)}%
                      </text>
                      
                      {/* Label above */}
                      <text
                        x={pos.x}
                        y={pos.y - radius - 8}
                        textAnchor="middle"
                        fontSize="8"
                        fill="#6b7280"
                      >
                        {label.name}
                      </text>
                      
                      {/* Concept below */}
                      <text
                        x={pos.x}
                        y={pos.y + radius + 12}
                        textAnchor="middle"
                        fontSize="6"
                        fill="#9ca3af"
                        fontStyle="italic"
                      >
                        {label.concept}
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

            {/* RIGHT: Anti-Pattern Monitors - Original Style */}
            <div className="bg-white border border-relic-mist rounded p-3">
              <div className="text-center text-[9px] uppercase tracking-wider text-red-400 mb-2">
                Anti-Pattern Monitors
              </div>
              <svg viewBox="0 0 500 580" className="w-full">
                {ANTIPATTERN_DATA.map((node) => {
                  const isCritical = node.severity === 'critical'
                  const isHigh = node.severity === 'high'
                  const radius = isCritical ? 24 : isHigh ? 20 : 16
                  const color = isCritical ? '#ef4444' : isHigh ? '#f97316' : '#fbbf24'
                  
                  return (
                    <g key={node.id}>
                      {/* Outer warning glow for critical */}
                      {isCritical && (
                        <motion.circle
                          cx={node.x}
                          cy={node.y}
                          r={radius + 16}
                          fill={color}
                          opacity={0.1}
                          animate={{ opacity: [0.05, 0.15, 0.05], scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                      
                      {/* Second glow */}
                      <circle cx={node.x} cy={node.y} r={radius + 8} fill={color} opacity={0.12} />
                      
                      {/* Main circle */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={radius}
                        fill="white"
                        stroke={color}
                        strokeWidth={isCritical ? 2.5 : 1.5}
                      />
                      
                      {/* Inner fill */}
                      <circle cx={node.x} cy={node.y} r={radius * 0.5} fill={color} opacity={0.4} />
                      
                      {/* Center dot */}
                      <circle cx={node.x} cy={node.y} r={3} fill={color} />
                      
                      {/* Label */}
                      <text x={node.x} y={node.y - radius - 8} textAnchor="middle" fontSize="8" fill="#6b7280">
                        {node.name}
                      </text>
                      
                      {/* Severity */}
                      <text x={node.x} y={node.y + radius + 12} textAnchor="middle" fontSize="7" fill={color} fontWeight="500">
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
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Filter Bar */}
          <div className="bg-white border border-relic-mist rounded p-2 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[7px] uppercase tracking-wider text-relic-silver">Filter</span>
                <div className="flex gap-1">
                  {['all', 'training', 'chat'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setHistoryFilter(filter as typeof historyFilter)}
                      className={`px-1.5 py-0.5 text-[7px] rounded transition-all ${
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
              <button className="text-[7px] text-purple-500 hover:text-purple-700">
                Connect Chat History →
              </button>
            </div>
          </div>

          {/* History Grid */}
          <div className="grid grid-cols-3 gap-3">
            {/* History List */}
            <div className="bg-white border border-relic-mist rounded p-2">
              <div className="text-[7px] uppercase tracking-wider text-relic-silver mb-2">Descent Tree History</div>
              <div className="space-y-1.5">
                {filteredHistory.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedHistory(item.id)}
                    className={`w-full text-left p-1.5 rounded border transition-all ${
                      selectedHistory === item.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-relic-mist hover:border-relic-slate'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[8px] font-medium text-relic-void">{item.name}</span>
                      <span className={`text-[6px] px-1 py-0.5 rounded ${
                        item.type === 'training' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {item.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[7px] text-relic-silver">
                      <span>{item.date}</span>
                      <span>·</span>
                      <span>{item.patterns} patterns</span>
                      <span>·</span>
                      <span className={item.score >= 80 ? 'text-green-600' : item.score >= 60 ? 'text-amber-600' : 'text-red-600'}>
                        {item.score}%
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected History Preview */}
            <div className="col-span-2 bg-white border border-relic-mist rounded p-2">
              {selectedHistory ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[7px] uppercase tracking-wider text-relic-silver">Tree Visualization</div>
                    <div className="flex gap-1">
                      <button className="px-1.5 py-0.5 text-[7px] bg-relic-ghost text-relic-slate rounded hover:bg-relic-mist">
                        Load Config
                      </button>
                      <button className="px-1.5 py-0.5 text-[7px] bg-relic-ghost text-relic-slate rounded hover:bg-relic-mist">
                        Compare
                      </button>
                    </div>
                  </div>
                  
                  <svg viewBox="0 0 500 250" className="w-full h-40 bg-relic-ghost/30 rounded">
                    {ANTIPATTERN_DATA.slice(0, 8).map((node) => {
                      const color = node.severity === 'critical' ? '#ef4444' : node.severity === 'high' ? '#f97316' : '#fbbf24'
                      const radius = node.severity === 'critical' ? 16 : node.severity === 'high' ? 14 : 12
                      return (
                        <g key={node.id}>
                          <circle cx={node.x} cy={node.y * 0.45 + 20} r={radius + 4} fill={color} opacity={0.15} />
                          <circle cx={node.x} cy={node.y * 0.45 + 20} r={radius} fill="white" stroke={color} strokeWidth="1.5" />
                          <circle cx={node.x} cy={node.y * 0.45 + 20} r={radius * 0.4} fill={color} opacity={0.5} />
                          <text x={node.x} y={node.y * 0.45} textAnchor="middle" fontSize="6" fill="#6b7280">{node.name}</text>
                        </g>
                      )
                    })}
                  </svg>

                  <div className="grid grid-cols-4 gap-1.5 mt-2">
                    {[
                      { label: 'Patterns', value: '5', color: 'text-red-500' },
                      { label: 'Quality', value: '72%', color: 'text-amber-500' },
                      { label: 'Messages', value: '23', color: 'text-blue-500' },
                      { label: 'Duration', value: '45m', color: 'text-green-500' },
                    ].map((stat) => (
                      <div key={stat.label} className="text-center p-1.5 bg-relic-ghost/50 rounded">
                        <div className={`text-sm font-medium ${stat.color}`}>{stat.value}</div>
                        <div className="text-[6px] text-relic-silver uppercase">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-48 flex items-center justify-center text-[8px] text-relic-silver">
                  Select a history item to view its descent tree
                </div>
              )}
            </div>
          </div>

          {/* Linked Chat Sessions */}
          <div className="mt-3 bg-white border border-relic-mist rounded p-2">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[7px] uppercase tracking-wider text-relic-silver">Linked Chat Sessions</div>
              <button className="text-[7px] text-purple-500 hover:text-purple-700">+ Link New</button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { name: 'Philosophy Deep Dive', date: 'Jan 29', trees: 3 },
                { name: 'Code Review Session', date: 'Jan 28', trees: 2 },
                { name: 'Research Analysis', date: 'Jan 27', trees: 5 },
                { name: 'Creative Writing', date: 'Jan 26', trees: 1 },
              ].map((session, idx) => (
                <div key={idx} className="p-1.5 border border-relic-mist rounded hover:border-purple-300 cursor-pointer">
                  <div className="text-[8px] font-medium text-relic-void mb-0.5">{session.name}</div>
                  <div className="flex items-center gap-1.5 text-[6px] text-relic-silver">
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
                       rounded shadow-lg p-3 w-64 z-50"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: NODE_COLORS[selectedNode] }} />
                <span className="text-[9px] font-medium text-relic-void">{AI_LABELS[selectedNode].name}</span>
              </div>
              <button onClick={() => setSelectedNode(null)} className="text-relic-silver hover:text-relic-slate text-[10px]">✕</button>
            </div>
            <p className="text-[7px] text-relic-silver mb-2 italic">{AI_LABELS[selectedNode].concept}</p>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(getWeight(selectedNode) * 100)}
                onChange={(e) => handleWeightChange(selectedNode, parseInt(e.target.value))}
                className="flex-1 h-1 bg-relic-ghost rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${NODE_COLORS[selectedNode]} 0%, ${NODE_COLORS[selectedNode]} ${getWeight(selectedNode) * 100}%, #e5e7eb ${getWeight(selectedNode) * 100}%, #e5e7eb 100%)`,
                }}
              />
              <input
                type="number"
                min="0"
                max="100"
                value={Math.round(getWeight(selectedNode) * 100)}
                onChange={(e) => handleWeightChange(selectedNode, parseInt(e.target.value) || 0)}
                className="w-10 h-5 text-[9px] text-center border border-relic-mist rounded"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
