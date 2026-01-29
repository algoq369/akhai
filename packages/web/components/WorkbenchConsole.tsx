'use client'

/**
 * WORKBENCH CONSOLE
 * 
 * Compact AI model configuration interface
 * - Left: Interactive Ascent Tree (configurable)
 * - Right: Presets + Configuration History
 * - Bottom: Test Playground
 * 
 * White minimalist design, monospace typography
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSefirotStore } from '@/lib/stores/sefirot-store'
import { Sefirah, SEPHIROTH_METADATA } from '@/lib/ascent-tracker'

// ═══════════════════════════════════════════════════════════
// AI LABELS (Computational Terms)
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

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface ConfigHistory {
  id: string
  name: string
  date: string
  weights: Record<number, number>
  testCount: number
  tests: TestResult[]
}

interface TestResult {
  id: string
  query: string
  timestamp: string
  response?: string
}

interface Preset {
  id: string
  name: string
  weights: Record<number, number>
}

// ═══════════════════════════════════════════════════════════
// PRESETS
// ═══════════════════════════════════════════════════════════

const PRESETS: Preset[] = [
  {
    id: 'analytical',
    name: 'analytical',
    weights: {
      [Sefirah.KETHER]: 0.3, [Sefirah.CHOKMAH]: 0.9, [Sefirah.BINAH]: 0.85,
      [Sefirah.DAAT]: 0.4, [Sefirah.CHESED]: 0.3, [Sefirah.GEVURAH]: 0.95,
      [Sefirah.TIFERET]: 0.5, [Sefirah.NETZACH]: 0.3, [Sefirah.HOD]: 0.9,
      [Sefirah.YESOD]: 0.85, [Sefirah.MALKUTH]: 0.9,
    }
  },
  {
    id: 'creative',
    name: 'creative',
    weights: {
      [Sefirah.KETHER]: 0.8, [Sefirah.CHOKMAH]: 0.7, [Sefirah.BINAH]: 0.4,
      [Sefirah.DAAT]: 0.9, [Sefirah.CHESED]: 0.95, [Sefirah.GEVURAH]: 0.3,
      [Sefirah.TIFERET]: 0.85, [Sefirah.NETZACH]: 0.9, [Sefirah.HOD]: 0.5,
      [Sefirah.YESOD]: 0.6, [Sefirah.MALKUTH]: 0.7,
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
    id: 'deep',
    name: 'deep',
    weights: {
      [Sefirah.KETHER]: 0.5, [Sefirah.CHOKMAH]: 0.85, [Sefirah.BINAH]: 0.7,
      [Sefirah.DAAT]: 0.95, [Sefirah.CHESED]: 0.6, [Sefirah.GEVURAH]: 0.75,
      [Sefirah.TIFERET]: 0.5, [Sefirah.NETZACH]: 0.6, [Sefirah.HOD]: 0.8,
      [Sefirah.YESOD]: 0.8, [Sefirah.MALKUTH]: 0.85,
    }
  },
]

// ═══════════════════════════════════════════════════════════
// TREE POSITIONS
// ═══════════════════════════════════════════════════════════

const TREE_POSITIONS: Record<number, { x: number; y: number }> = {
  [Sefirah.KETHER]: { x: 120, y: 30 },
  [Sefirah.CHOKMAH]: { x: 180, y: 70 },
  [Sefirah.BINAH]: { x: 60, y: 70 },
  [Sefirah.DAAT]: { x: 120, y: 100 },
  [Sefirah.CHESED]: { x: 180, y: 140 },
  [Sefirah.GEVURAH]: { x: 60, y: 140 },
  [Sefirah.TIFERET]: { x: 120, y: 170 },
  [Sefirah.NETZACH]: { x: 180, y: 210 },
  [Sefirah.HOD]: { x: 60, y: 210 },
  [Sefirah.YESOD]: { x: 120, y: 250 },
  [Sefirah.MALKUTH]: { x: 120, y: 300 },
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

// ═══════════════════════════════════════════════════════════
// COLORS
// ═══════════════════════════════════════════════════════════

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
// COMPONENT
// ═══════════════════════════════════════════════════════════

export function WorkbenchConsole() {
  const { weights, setWeight, applyPreset } = useSefirotStore()
  
  // State
  const [activePreset, setActivePreset] = useState<string>('balanced')
  const [selectedNode, setSelectedNode] = useState<Sefirah | null>(null)
  const [hoveredNode, setHoveredNode] = useState<Sefirah | null>(null)
  const [testQuery, setTestQuery] = useState('')
  const [isTestExpanded, setIsTestExpanded] = useState(false)
  const [configHistory, setConfigHistory] = useState<ConfigHistory[]>([
    {
      id: '1',
      name: 'Deep Research v2',
      date: 'Jan 29',
      weights: PRESETS[3].weights,
      testCount: 3,
      tests: [
        { id: '1a', query: 'Explain quantum entanglement', timestamp: '10:30' },
        { id: '1b', query: 'Compare neural architectures', timestamp: '10:45' },
      ]
    },
    {
      id: '2', 
      name: 'Creative Writing',
      date: 'Jan 28',
      weights: PRESETS[1].weights,
      testCount: 7,
      tests: []
    },
    {
      id: '3',
      name: 'Code Analysis',
      date: 'Jan 27',
      weights: PRESETS[0].weights,
      testCount: 12,
      tests: []
    },
  ])
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null)

  // Apply preset
  const handlePresetSelect = (preset: Preset) => {
    setActivePreset(preset.id)
    Object.entries(preset.weights).forEach(([sefirah, weight]) => {
      setWeight(parseInt(sefirah) as Sefirah, weight)
    })
  }

  // Handle node click for editing
  const handleNodeClick = (sefirah: Sefirah) => {
    setSelectedNode(selectedNode === sefirah ? null : sefirah)
  }

  // Handle weight change
  const handleWeightChange = (sefirah: Sefirah, value: number) => {
    setWeight(sefirah, value)
    setActivePreset('custom')
  }

  // Save current config to history
  const saveConfig = () => {
    const newConfig: ConfigHistory = {
      id: Date.now().toString(),
      name: `Config ${configHistory.length + 1}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weights: { ...weights },
      testCount: 0,
      tests: []
    }
    setConfigHistory([newConfig, ...configHistory])
  }

  // Load config from history
  const loadConfig = (config: ConfigHistory) => {
    Object.entries(config.weights).forEach(([sefirah, weight]) => {
      setWeight(parseInt(sefirah) as Sefirah, weight)
    })
    setActivePreset('custom')
  }

  // Copy config
  const copyConfig = (config: ConfigHistory) => {
    navigator.clipboard.writeText(JSON.stringify(config.weights, null, 2))
  }

  // Delete config
  const deleteConfig = (id: string) => {
    setConfigHistory(configHistory.filter(c => c.id !== id))
  }

  // Run test
  const runTest = async () => {
    if (!testQuery.trim()) return
    // TODO: Implement actual test API call
    console.log('Testing with query:', testQuery)
  }

  return (
    <div className="bg-white min-h-screen font-mono text-sm">
      {/* Header */}
      <div className="border-b border-neutral-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xs uppercase tracking-widest text-neutral-400">Model Configuration</h1>
            <h2 className="text-lg text-neutral-900 mt-0.5">Workbench</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={saveConfig}
              className="px-3 py-1.5 text-xs border border-neutral-200 rounded hover:bg-neutral-50 transition-colors"
            >
              Save Config
            </button>
            <span className="text-xs text-neutral-400">⌘S</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Left: Tree Visualization */}
        <div className="w-[320px] border-r border-neutral-200 p-4">
          <div className="text-[10px] uppercase tracking-wider text-neutral-400 mb-3">
            AI Processing Layers
          </div>
          
          {/* SVG Tree */}
          <svg viewBox="0 0 240 340" className="w-full">
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
                  strokeOpacity={0.4 + avgWeight * 0.4}
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
              const radius = 12 + weight * 8
              const label = AI_LABELS[sefirah]

              return (
                <g
                  key={sefirah}
                  className="cursor-pointer"
                  onClick={() => handleNodeClick(sefirah)}
                  onMouseEnter={() => setHoveredNode(sefirah)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
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
                  
                  {/* Hover glow */}
                  {isHovered && !isSelected && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={radius + 3}
                      fill={color}
                      fillOpacity={0.15}
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

                  {/* Inner fill based on weight */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={radius * weight}
                    fill={color}
                    fillOpacity={0.3 + weight * 0.4}
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

                  {/* Label (on hover or select) */}
                  {(isHovered || isSelected) && (
                    <text
                      x={pos.x}
                      y={pos.y - radius - 6}
                      textAnchor="middle"
                      fontSize="8"
                      fill="#374151"
                      fontWeight="500"
                    >
                      {label?.primary}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-3 text-[9px] text-neutral-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" /> Active
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Developing
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-neutral-300" /> Low
            </span>
          </div>

          {/* Selected Node Editor */}
          <AnimatePresence>
            {selectedNode && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-4 p-3 border border-neutral-200 rounded-lg bg-neutral-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-neutral-700">
                    {AI_LABELS[selectedNode]?.primary}
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    {AI_LABELS[selectedNode]?.concept}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round((weights[selectedNode] ?? 0.5) * 100)}
                    onChange={(e) => handleWeightChange(selectedNode, parseInt(e.target.value) / 100)}
                    className="flex-1 h-1 bg-neutral-200 rounded-full appearance-none cursor-pointer
                             [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
                             [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full 
                             [&::-webkit-slider-thumb]:bg-neutral-900"
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

        {/* Right: Presets + History */}
        <div className="flex-1 p-4">
          {/* Presets */}
          <div className="mb-6">
            <div className="text-[10px] uppercase tracking-wider text-neutral-400 mb-2">
              Presets
            </div>
            <div className="flex gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset)}
                  className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                    activePreset === preset.id
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
              {activePreset === 'custom' && (
                <span className="px-3 py-1.5 text-xs text-neutral-400 border border-dashed border-neutral-300 rounded">
                  custom
                </span>
              )}
            </div>
          </div>

          {/* Configuration History */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] uppercase tracking-wider text-neutral-400">
                Configuration History
              </div>
              <span className="text-[10px] text-neutral-300">{configHistory.length} saved</span>
            </div>
            
            <div className="space-y-2">
              {configHistory.map((config) => (
                <div
                  key={config.id}
                  className="border border-neutral-200 rounded-lg overflow-hidden"
                >
                  {/* Header */}
                  <div
                    className="flex items-center justify-between px-3 py-2 bg-neutral-50 cursor-pointer hover:bg-neutral-100 transition-colors"
                    onClick={() => setExpandedHistory(expandedHistory === config.id ? null : config.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-neutral-700">{config.name}</span>
                      <span className="text-[10px] text-neutral-400">{config.date}</span>
                      <span className="text-[10px] text-neutral-300">·</span>
                      <span className="text-[10px] text-neutral-400">{config.testCount} tests</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-neutral-300">
                        {expandedHistory === config.id ? '▾' : '▸'}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {expandedHistory === config.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-neutral-200"
                      >
                        {/* Weights Preview */}
                        <div className="px-3 py-2 bg-white">
                          <div className="text-[9px] uppercase tracking-wider text-neutral-400 mb-2">
                            Layer Weights
                          </div>
                          <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-[10px]">
                            {Object.entries(config.weights).slice(0, 9).map(([sefirah, weight]) => (
                              <div key={sefirah} className="flex items-center justify-between">
                                <span className="text-neutral-500 truncate">
                                  {AI_LABELS[parseInt(sefirah)]?.primary.slice(0, 12)}
                                </span>
                                <span className="text-neutral-700 font-medium">
                                  {Math.round(weight * 100)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Tests Preview */}
                        {config.tests.length > 0 && (
                          <div className="px-3 py-2 border-t border-neutral-100">
                            <div className="text-[9px] uppercase tracking-wider text-neutral-400 mb-2">
                              Recent Tests
                            </div>
                            <div className="space-y-1">
                              {config.tests.slice(0, 3).map((test) => (
                                <div key={test.id} className="text-[10px] text-neutral-600 truncate">
                                  <span className="text-neutral-400">{test.timestamp}</span>
                                  <span className="mx-2">·</span>
                                  {test.query}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 px-3 py-2 border-t border-neutral-100 bg-neutral-50">
                          <button
                            onClick={() => loadConfig(config)}
                            className="px-2 py-1 text-[10px] text-neutral-600 hover:text-neutral-900 hover:bg-white rounded border border-transparent hover:border-neutral-200 transition-colors"
                          >
                            Load
                          </button>
                          <button
                            onClick={() => copyConfig(config)}
                            className="px-2 py-1 text-[10px] text-neutral-600 hover:text-neutral-900 hover:bg-white rounded border border-transparent hover:border-neutral-200 transition-colors"
                          >
                            Copy
                          </button>
                          <button
                            onClick={() => deleteConfig(config.id)}
                            className="px-2 py-1 text-[10px] text-red-500 hover:text-red-600 hover:bg-white rounded border border-transparent hover:border-red-200 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Test Playground */}
      <div className="border-t border-neutral-200">
        <button
          onClick={() => setIsTestExpanded(!isTestExpanded)}
          className="w-full px-6 py-2 flex items-center justify-between text-xs text-neutral-500 hover:bg-neutral-50 transition-colors"
        >
          <span className="uppercase tracking-wider">Test Playground</span>
          <span>{isTestExpanded ? '▾' : '▸'}</span>
        </button>
        
        <AnimatePresence>
          {isTestExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 pb-4"
            >
              <div className="flex gap-3">
                <input
                  type="text"
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                  placeholder="Enter test query..."
                  className="flex-1 px-3 py-2 text-sm border border-neutral-200 rounded bg-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400"
                />
                <button
                  onClick={runTest}
                  disabled={!testQuery.trim()}
                  className="px-4 py-2 text-xs bg-neutral-900 text-white rounded hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Run Test
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
