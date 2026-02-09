'use client'

/**
 * WORKBENCH CONSOLE - AI COMPUTATIONAL CONFIG
 * 
 * Features:
 * - Left: Interconnected Tree Visualization (processing flow)
 * - Right: Quick Config (top 3 layers) + Config History
 * - Bottom: Presets + Expand All Layers
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLayerStore } from '@/lib/stores/layer-store'
import { Layer } from '@/lib/layer-registry'

// ═══════════════════════════════════════════════════════════
// AI LAYERS & CONFIG
// ═══════════════════════════════════════════════════════════

interface AILayer {
  id: number
  name: string
  description: string
  phase: 'input' | 'understanding' | 'reasoning' | 'output'
  extremes: { low: string; high: string }
  critical: boolean
  color: string
}

const AI_LAYERS: AILayer[] = [
  { id: Layer.EMBEDDING, name: 'reception', description: 'input parsing', phase: 'input', extremes: { low: 'basic', high: 'detailed' }, critical: false, color: '#78716c' },
  { id: Layer.EXECUTOR, name: 'comprehension', description: 'semantic encoding', phase: 'input', extremes: { low: 'surface', high: 'deep' }, critical: false, color: '#a3a3a3' },
  { id: Layer.CLASSIFIER, name: 'context', description: 'relationship mapping', phase: 'understanding', extremes: { low: 'narrow', high: 'wide' }, critical: false, color: '#facc15' },
  { id: Layer.ENCODER, name: 'knowledge', description: 'retrieves facts and expertise', phase: 'understanding', extremes: { low: 'focused', high: 'broad' }, critical: true, color: '#6366f1' },
  { id: Layer.REASONING, name: 'reasoning', description: 'breaks problems into steps', phase: 'reasoning', extremes: { low: 'shallow', high: 'deep' }, critical: true, color: '#818cf8' },
  { id: Layer.EXPANSION, name: 'expansion', description: 'explores alternatives', phase: 'reasoning', extremes: { low: 'constrained', high: 'expansive' }, critical: false, color: '#34d399' },
  { id: Layer.DISCRIMINATOR, name: 'analysis', description: 'evaluates and limits', phase: 'reasoning', extremes: { low: 'lenient', high: 'strict' }, critical: false, color: '#f87171' },
  { id: Layer.ATTENTION, name: 'synthesis', description: 'combines insights', phase: 'reasoning', extremes: { low: 'simple', high: 'complex' }, critical: false, color: '#fbbf24' },
  { id: Layer.SYNTHESIS, name: 'verification', description: 'checks for errors', phase: 'output', extremes: { low: 'minimal', high: 'thorough' }, critical: true, color: '#22d3ee' },
  { id: Layer.GENERATIVE, name: 'articulation', description: 'crafts response', phase: 'output', extremes: { low: 'concise', high: 'verbose' }, critical: false, color: '#fb923c' },
  { id: Layer.META_CORE, name: 'output', description: 'final delivery', phase: 'output', extremes: { low: 'minimal', high: 'complete' }, critical: false, color: '#a78bfa' },
]

const CRITICAL_LAYERS = AI_LAYERS.filter(l => l.critical)

// Tree positions for visualization (top-to-bottom flow)
const TREE_POSITIONS: Record<number, { x: number; y: number }> = {
  [Layer.EMBEDDING]: { x: 100, y: 30 },   // reception (top - input)
  [Layer.EXECUTOR]: { x: 100, y: 70 },     // comprehension
  [Layer.CLASSIFIER]: { x: 60, y: 110 },       // context (left)
  [Layer.ENCODER]: { x: 140, y: 110 },    // knowledge (right) ★
  [Layer.REASONING]: { x: 100, y: 155 },  // reasoning (center) ★
  [Layer.EXPANSION]: { x: 50, y: 195 },    // expansion (left)
  [Layer.DISCRIMINATOR]: { x: 150, y: 195 },  // analysis (right)
  [Layer.ATTENTION]: { x: 100, y: 235 },  // synthesis (center)
  [Layer.SYNTHESIS]: { x: 100, y: 280 },     // verification ★
  [Layer.GENERATIVE]: { x: 100, y: 320 },  // articulation
  [Layer.META_CORE]: { x: 100, y: 360 },   // output (bottom)
}

// Tree connections (processing flow)
const TREE_PATHS: [number, number][] = [
  [Layer.EMBEDDING, Layer.EXECUTOR],      // reception → comprehension
  [Layer.EXECUTOR, Layer.CLASSIFIER],          // comprehension → context
  [Layer.EXECUTOR, Layer.ENCODER],        // comprehension → knowledge
  [Layer.CLASSIFIER, Layer.REASONING],        // context → reasoning
  [Layer.ENCODER, Layer.REASONING],      // knowledge → reasoning
  [Layer.REASONING, Layer.EXPANSION],     // reasoning → expansion
  [Layer.REASONING, Layer.DISCRIMINATOR],    // reasoning → analysis
  [Layer.EXPANSION, Layer.ATTENTION],     // expansion → synthesis
  [Layer.DISCRIMINATOR, Layer.ATTENTION],    // analysis → synthesis
  [Layer.ATTENTION, Layer.SYNTHESIS],       // synthesis → verification
  [Layer.SYNTHESIS, Layer.GENERATIVE],       // verification → articulation
  [Layer.GENERATIVE, Layer.META_CORE],     // articulation → output
]

const PRESETS = [
  { id: 'fast', name: 'fast', weights: { [Layer.REASONING]: 0.4, [Layer.ENCODER]: 0.5, [Layer.SYNTHESIS]: 0.4 } },
  { id: 'balanced', name: 'balanced', weights: { [Layer.REASONING]: 0.7, [Layer.ENCODER]: 0.7, [Layer.SYNTHESIS]: 0.7 } },
  { id: 'thorough', name: 'thorough', weights: { [Layer.REASONING]: 0.9, [Layer.ENCODER]: 0.85, [Layer.SYNTHESIS]: 0.9 } },
  { id: 'creative', name: 'creative', weights: { [Layer.REASONING]: 0.7, [Layer.ENCODER]: 0.6, [Layer.SYNTHESIS]: 0.5 } },
]

interface ConfigHistory {
  id: string
  name: string
  date: string
  testCount: number
}

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

export function WorkbenchConsole() {
  const { weights, setWeight } = useLayerStore()
  const [activePreset, setActivePreset] = useState('balanced')
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [testQuery, setTestQuery] = useState('')
  const [isTestOpen, setIsTestOpen] = useState(false)
  const [hoveredNode, setHoveredNode] = useState<number | null>(null)
  const [selectedNode, setSelectedNode] = useState<number | null>(null)
  
  const [configHistory] = useState<ConfigHistory[]>([
    { id: '1', name: 'Deep Research', date: 'Jan 29', testCount: 3 },
    { id: '2', name: 'Creative Session', date: 'Jan 28', testCount: 7 },
  ])

  const getWeight = (id: number) => weights[id] ?? 0.5
  const getLayer = (id: number) => AI_LAYERS.find(l => l.id === id)
  
  const handleWeightChange = (id: number, value: number) => {
    setWeight(id, value)
    setActivePreset('custom')
  }

  const applyPreset = (presetId: string) => {
    setActivePreset(presetId)
    const preset = PRESETS.find(p => p.id === presetId)
    if (preset) {
      Object.entries(preset.weights).forEach(([id, weight]) => {
        setWeight(parseInt(id), weight)
      })
    }
  }

  return (
    <div className="bg-white font-mono text-xs">
      {/* Header */}
      <div className="border-b border-neutral-100 px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-neutral-400">AI Computational Config</div>
          <div className="text-neutral-500 mt-0.5">configure processing layers for optimal responses</div>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-[10px] border border-neutral-200 rounded hover:bg-neutral-50">
            Save
          </button>
          <span className="text-neutral-300">⌘S</span>
        </div>
      </div>

      {/* Main Content - Two Columns */}
      <div className="flex">
        {/* Left: Tree Visualization */}
        <div className="w-[240px] border-r border-neutral-100 p-3">
          <div className="text-[9px] uppercase tracking-wider text-neutral-400 mb-2 text-center">
            Processing Flow
          </div>
          
          <svg viewBox="0 0 200 400" className="w-full">
            {/* Connection Paths */}
            {TREE_PATHS.map(([from, to], idx) => {
              const fromPos = TREE_POSITIONS[from]
              const toPos = TREE_POSITIONS[to]
              const fromWeight = getWeight(from)
              const toWeight = getWeight(to)
              const avgWeight = (fromWeight + toWeight) / 2
              
              return (
                <line
                  key={idx}
                  x1={fromPos.x}
                  y1={fromPos.y}
                  x2={toPos.x}
                  y2={toPos.y}
                  stroke="#e5e7eb"
                  strokeWidth={1 + avgWeight * 1.5}
                  strokeOpacity={0.5 + avgWeight * 0.3}
                />
              )
            })}

            {/* Flow arrows (subtle) */}
            <defs>
              <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#d4d4d4" />
              </marker>
            </defs>

            {/* Nodes */}
            {AI_LAYERS.map((layer) => {
              const pos = TREE_POSITIONS[layer.id]
              if (!pos) return null
              
              const weight = getWeight(layer.id)
              const isHovered = hoveredNode === layer.id
              const isSelected = selectedNode === layer.id
              const radius = 10 + weight * 6
              
              return (
                <g
                  key={layer.id}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredNode(layer.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => setSelectedNode(selectedNode === layer.id ? null : layer.id)}
                >
                  {/* Selection ring */}
                  {isSelected && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={radius + 4}
                      fill="none"
                      stroke={layer.color}
                      strokeWidth="1.5"
                      strokeDasharray="3 2"
                    />
                  )}
                  
                  {/* Hover glow */}
                  {isHovered && !isSelected && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={radius + 3}
                      fill={layer.color}
                      fillOpacity={0.15}
                    />
                  )}

                  {/* Critical indicator */}
                  {layer.critical && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={radius + 2}
                      fill="none"
                      stroke={layer.color}
                      strokeWidth="1"
                      strokeOpacity={0.5}
                    />
                  )}

                  {/* Main circle */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={radius}
                    fill="white"
                    stroke={layer.color}
                    strokeWidth={layer.critical ? 2 : 1.5}
                  />

                  {/* Inner fill based on weight */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={radius * weight}
                    fill={layer.color}
                    fillOpacity={0.3 + weight * 0.4}
                  />

                  {/* Percentage */}
                  <text
                    x={pos.x}
                    y={pos.y + 3}
                    textAnchor="middle"
                    fontSize="7"
                    fill="#374151"
                    fontWeight="500"
                  >
                    {Math.round(weight * 100)}%
                  </text>

                  {/* Label (always show for critical, on hover for others) */}
                  {(layer.critical || isHovered || isSelected) && (
                    <text
                      x={pos.x > 100 ? pos.x + radius + 4 : pos.x - radius - 4}
                      y={pos.y + 3}
                      textAnchor={pos.x > 100 ? 'start' : 'end'}
                      fontSize="7"
                      fill={layer.critical ? '#374151' : '#9ca3af'}
                      fontWeight={layer.critical ? '600' : '400'}
                    >
                      {layer.name}{layer.critical && ' ★'}
                    </text>
                  )}
                </g>
              )
            })}

            {/* Phase labels */}
            <text x="10" y="15" fontSize="6" fill="#d4d4d4" className="uppercase">input</text>
            <text x="10" y="100" fontSize="6" fill="#d4d4d4" className="uppercase">understanding</text>
            <text x="10" y="175" fontSize="6" fill="#d4d4d4" className="uppercase">reasoning</text>
            <text x="10" y="300" fontSize="6" fill="#d4d4d4" className="uppercase">output</text>
          </svg>

          {/* Selected Node Editor */}
          <AnimatePresence>
            {selectedNode && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="mt-2 p-2 border border-neutral-200 rounded bg-neutral-50"
              >
                {(() => {
                  const layer = getLayer(selectedNode)
                  if (!layer) return null
                  const weight = getWeight(selectedNode)
                  return (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-medium" style={{ color: layer.color }}>
                          {layer.name}
                        </span>
                        <span className="text-[9px] text-neutral-400">{Math.round(weight * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={Math.round(weight * 100)}
                        onChange={(e) => handleWeightChange(selectedNode, parseInt(e.target.value) / 100)}
                        className="w-full h-1 bg-neutral-200 rounded appearance-none cursor-pointer
                                 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 
                                 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full 
                                 [&::-webkit-slider-thumb]:bg-neutral-700"
                      />
                      <div className="flex justify-between text-[8px] text-neutral-400 mt-0.5">
                        <span>{layer.extremes.low}</span>
                        <span>{layer.extremes.high}</span>
                      </div>
                    </>
                  )
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Quick Settings + History */}
        <div className="flex-1 p-4">
          {/* Quick Settings */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] uppercase tracking-wider text-neutral-400">Quick Settings</div>
              <div className="text-[9px] text-neutral-300">top 3 impact layers</div>
            </div>

            <div className="space-y-4">
              {CRITICAL_LAYERS.map((layer) => {
                const weight = getWeight(layer.id)
                return (
                  <div key={layer.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-400">★</span>
                        <span className="font-medium text-neutral-700">{layer.name}</span>
                      </div>
                      <span className="text-neutral-700 tabular-nums">{Math.round(weight * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] text-neutral-400 w-16 text-right">{layer.extremes.low}</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={Math.round(weight * 100)}
                        onChange={(e) => handleWeightChange(layer.id, parseInt(e.target.value) / 100)}
                        className="flex-1 h-1 bg-neutral-100 rounded-full appearance-none cursor-pointer
                                 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
                                 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full 
                                 [&::-webkit-slider-thumb]:bg-neutral-700 [&::-webkit-slider-thumb]:border-2
                                 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow"
                        style={{
                          background: `linear-gradient(to right, ${layer.color}60 0%, ${layer.color}60 ${weight * 100}%, #f5f5f5 ${weight * 100}%, #f5f5f5 100%)`,
                        }}
                      />
                      <span className="text-[9px] text-neutral-400 w-16">{layer.extremes.high}</span>
                    </div>
                    <div className="text-[9px] text-neutral-400 mt-0.5 ml-5">{layer.description}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Presets */}
          <div className="mb-6">
            <div className="text-[10px] uppercase tracking-wider text-neutral-400 mb-2">Presets</div>
            <div className="flex gap-1.5">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset.id)}
                  className={`px-2.5 py-1 text-[10px] rounded border transition-all ${
                    activePreset === preset.id
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
              {activePreset === 'custom' && (
                <span className="px-2.5 py-1 text-[10px] text-neutral-400 border border-dashed border-neutral-300 rounded">
                  custom
                </span>
              )}
            </div>
          </div>

          {/* Show All Layers Button */}
          <button
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[10px] text-neutral-500 
                     border border-neutral-200 rounded hover:bg-neutral-50 transition-colors mb-6"
          >
            <span className="uppercase tracking-wider">Show All 11 Layers</span>
            <span className="w-4 h-4 rounded-full border border-neutral-300 flex items-center justify-center">
              {isAdvancedOpen ? '−' : '+'}
            </span>
          </button>

          {/* Advanced: All Layers */}
          <AnimatePresence>
            {isAdvancedOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-6"
              >
                <div className="border border-neutral-200 rounded p-3">
                  {(['input', 'understanding', 'reasoning', 'output'] as const).map((phase) => {
                    const phaseLayers = AI_LAYERS.filter(l => l.phase === phase)
                    return (
                      <div key={phase} className="mb-3 last:mb-0">
                        <div className="text-[8px] uppercase tracking-wider text-neutral-300 mb-1.5">{phase}</div>
                        <div className="space-y-1.5">
                          {phaseLayers.map((layer) => {
                            const weight = getWeight(layer.id)
                            return (
                              <div key={layer.id} className="flex items-center gap-2">
                                <div 
                                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: layer.color }}
                                />
                                <span className={`text-[10px] w-24 truncate ${layer.critical ? 'font-medium text-neutral-700' : 'text-neutral-500'}`}>
                                  {layer.name}{layer.critical && ' ★'}
                                </span>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={Math.round(weight * 100)}
                                  onChange={(e) => handleWeightChange(layer.id, parseInt(e.target.value) / 100)}
                                  className="flex-1 h-1 bg-neutral-100 rounded-full appearance-none cursor-pointer
                                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 
                                           [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full
                                           [&::-webkit-slider-thumb]:bg-neutral-600"
                                />
                                <span className="text-[9px] text-neutral-500 tabular-nums w-8 text-right">
                                  {Math.round(weight * 100)}%
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Config History */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] uppercase tracking-wider text-neutral-400">Configuration History</div>
              <div className="text-[9px] text-neutral-300">{configHistory.length} saved</div>
            </div>
            <div className="space-y-1.5">
              {configHistory.map((config) => (
                <div 
                  key={config.id}
                  className="flex items-center justify-between px-3 py-2 border border-neutral-200 rounded hover:bg-neutral-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-neutral-700">{config.name}</span>
                    <span className="text-neutral-400">{config.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-400">{config.testCount} tests</span>
                    <span className="text-neutral-300">›</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Test Query */}
      <div className="border-t border-neutral-100">
        <button
          onClick={() => setIsTestOpen(!isTestOpen)}
          className="w-full px-4 py-2 flex items-center justify-between text-[10px] text-neutral-500 hover:bg-neutral-50"
        >
          <span className="uppercase tracking-wider">Test Query</span>
          <span>{isTestOpen ? '▴' : '▾'}</span>
        </button>
        <AnimatePresence>
          {isTestOpen && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3 flex gap-2">
                <input
                  type="text"
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                  placeholder="Enter test query..."
                  className="flex-1 px-3 py-2 text-xs border border-neutral-200 rounded bg-white placeholder:text-neutral-400"
                />
                <button className="px-4 py-2 text-[10px] bg-neutral-900 text-white rounded hover:bg-neutral-800">
                  Run
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default WorkbenchConsole
