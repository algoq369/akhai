'use client'

/**
 * CONFIG HISTORY PANEL
 * 
 * Reusable sidebar panel showing configuration history
 * Can be collapsed/expanded, shows saved configs with actions
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sefirah } from '@/lib/ascent-tracker'
import { useSefirotStore } from '@/lib/stores/sefirot-store'

// ═══════════════════════════════════════════════════════════
// AI LABELS
// ═══════════════════════════════════════════════════════════

const AI_LABELS: Record<number, string> = {
  [Sefirah.KETHER]: 'meta-cognition',
  [Sefirah.CHOKMAH]: 'first-principles',
  [Sefirah.BINAH]: 'pattern-recognition',
  [Sefirah.DAAT]: 'emergent-insight',
  [Sefirah.CHESED]: 'expansion',
  [Sefirah.GEVURAH]: 'critical-analysis',
  [Sefirah.TIFERET]: 'synthesis',
  [Sefirah.NETZACH]: 'persistence',
  [Sefirah.HOD]: 'communication',
  [Sefirah.YESOD]: 'foundation',
  [Sefirah.MALKUTH]: 'manifestation',
}

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export interface ConfigHistory {
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

interface ConfigHistoryPanelProps {
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  position?: 'left' | 'right'
  className?: string
}

// ═══════════════════════════════════════════════════════════
// SAMPLE DATA (Replace with actual store/API)
// ═══════════════════════════════════════════════════════════

const SAMPLE_HISTORY: ConfigHistory[] = [
  {
    id: '1',
    name: 'Deep Research v2',
    date: 'Jan 29',
    weights: {
      [Sefirah.KETHER]: 0.5, [Sefirah.CHOKMAH]: 0.85, [Sefirah.BINAH]: 0.7,
      [Sefirah.DAAT]: 0.95, [Sefirah.CHESED]: 0.6, [Sefirah.GEVURAH]: 0.75,
      [Sefirah.TIFERET]: 0.5, [Sefirah.NETZACH]: 0.6, [Sefirah.HOD]: 0.8,
      [Sefirah.YESOD]: 0.8, [Sefirah.MALKUTH]: 0.85,
    },
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
    weights: {
      [Sefirah.KETHER]: 0.8, [Sefirah.CHOKMAH]: 0.7, [Sefirah.BINAH]: 0.4,
      [Sefirah.DAAT]: 0.9, [Sefirah.CHESED]: 0.95, [Sefirah.GEVURAH]: 0.3,
      [Sefirah.TIFERET]: 0.85, [Sefirah.NETZACH]: 0.9, [Sefirah.HOD]: 0.5,
      [Sefirah.YESOD]: 0.6, [Sefirah.MALKUTH]: 0.7,
    },
    testCount: 7,
    tests: []
  },
  {
    id: '3',
    name: 'Code Analysis',
    date: 'Jan 27',
    weights: {
      [Sefirah.KETHER]: 0.3, [Sefirah.CHOKMAH]: 0.9, [Sefirah.BINAH]: 0.85,
      [Sefirah.DAAT]: 0.4, [Sefirah.CHESED]: 0.3, [Sefirah.GEVURAH]: 0.95,
      [Sefirah.TIFERET]: 0.5, [Sefirah.NETZACH]: 0.3, [Sefirah.HOD]: 0.9,
      [Sefirah.YESOD]: 0.85, [Sefirah.MALKUTH]: 0.9,
    },
    testCount: 12,
    tests: []
  },
]

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

export function ConfigHistoryPanel({
  collapsed = false,
  onCollapsedChange,
  position = 'right',
  className = ''
}: ConfigHistoryPanelProps) {
  const { setWeight } = useSefirotStore()
  const [isCollapsed, setIsCollapsed] = useState(collapsed)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [configHistory, setConfigHistory] = useState<ConfigHistory[]>(SAMPLE_HISTORY)

  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    onCollapsedChange?.(newState)
  }

  const loadConfig = (config: ConfigHistory) => {
    Object.entries(config.weights).forEach(([sefirah, weight]) => {
      setWeight(parseInt(sefirah) as Sefirah, weight)
    })
  }

  const copyConfig = (config: ConfigHistory) => {
    navigator.clipboard.writeText(JSON.stringify(config.weights, null, 2))
  }

  const deleteConfig = (id: string) => {
    setConfigHistory(configHistory.filter(c => c.id !== id))
  }

  // Collapsed state - show toggle button only
  if (isCollapsed) {
    return (
      <div className={`fixed ${position === 'right' ? 'right-0' : 'left-0'} top-1/2 -translate-y-1/2 z-40 ${className}`}>
        <button
          onClick={toggleCollapse}
          className="bg-white border border-neutral-200 px-2 py-4 text-[10px] font-mono text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 transition-colors shadow-sm"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        >
          CONFIG HISTORY ▸
        </button>
      </div>
    )
  }

  return (
    <div className={`fixed ${position === 'right' ? 'right-0' : 'left-0'} top-0 h-full w-72 bg-white border-l border-neutral-200 z-40 flex flex-col shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
        <div>
          <h3 className="text-[10px] uppercase tracking-widest text-neutral-400">Config History</h3>
          <span className="text-[9px] text-neutral-300">{configHistory.length} saved</span>
        </div>
        <button
          onClick={toggleCollapse}
          className="text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          <span className="text-xs">✕</span>
        </button>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {configHistory.map((config) => (
          <div
            key={config.id}
            className="border border-neutral-200 rounded-lg overflow-hidden bg-white"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-3 py-2 bg-neutral-50 cursor-pointer hover:bg-neutral-100 transition-colors"
              onClick={() => setExpandedId(expandedId === config.id ? null : config.id)}
            >
              <div>
                <span className="text-xs font-medium text-neutral-700 block">{config.name}</span>
                <span className="text-[9px] text-neutral-400">{config.date} · {config.testCount} tests</span>
              </div>
              <span className="text-[10px] text-neutral-300">
                {expandedId === config.id ? '▾' : '▸'}
              </span>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
              {expandedId === config.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-neutral-100"
                >
                  {/* Weights Preview */}
                  <div className="px-3 py-2 bg-white">
                    <div className="text-[8px] uppercase tracking-wider text-neutral-400 mb-2">
                      Layer Weights
                    </div>
                    <div className="space-y-1">
                      {Object.entries(config.weights).slice(0, 6).map(([sefirah, weight]) => (
                        <div key={sefirah} className="flex items-center justify-between text-[9px]">
                          <span className="text-neutral-500 truncate">
                            {AI_LABELS[parseInt(sefirah)]?.slice(0, 15)}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1 bg-neutral-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-neutral-400 rounded-full"
                                style={{ width: `${weight * 100}%` }}
                              />
                            </div>
                            <span className="text-neutral-600 font-medium w-8 text-right">
                              {Math.round(weight * 100)}%
                            </span>
                          </div>
                        </div>
                      ))}
                      {Object.entries(config.weights).length > 6 && (
                        <div className="text-[8px] text-neutral-300 text-center mt-1">
                          +{Object.entries(config.weights).length - 6} more layers
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tests Preview */}
                  {config.tests.length > 0 && (
                    <div className="px-3 py-2 border-t border-neutral-100">
                      <div className="text-[8px] uppercase tracking-wider text-neutral-400 mb-1">
                        Recent Tests
                      </div>
                      <div className="space-y-1">
                        {config.tests.slice(0, 2).map((test) => (
                          <div key={test.id} className="text-[9px] text-neutral-500 truncate">
                            <span className="text-neutral-300">{test.timestamp}</span>
                            <span className="mx-1">·</span>
                            {test.query}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1 px-3 py-2 border-t border-neutral-100 bg-neutral-50">
                    <button
                      onClick={() => loadConfig(config)}
                      className="flex-1 px-2 py-1.5 text-[9px] text-neutral-600 hover:text-white hover:bg-neutral-900 rounded border border-neutral-200 hover:border-neutral-900 transition-colors"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => copyConfig(config)}
                      className="px-2 py-1.5 text-[9px] text-neutral-500 hover:text-neutral-700 hover:bg-white rounded border border-transparent hover:border-neutral-200 transition-colors"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => deleteConfig(config.id)}
                      className="px-2 py-1.5 text-[9px] text-red-400 hover:text-red-600 hover:bg-white rounded border border-transparent hover:border-red-200 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-neutral-200">
        <button className="w-full px-3 py-2 text-[10px] font-mono text-neutral-500 border border-dashed border-neutral-300 rounded hover:border-neutral-400 hover:text-neutral-700 transition-colors">
          + Save Current Config
        </button>
      </div>
    </div>
  )
}

export default ConfigHistoryPanel
