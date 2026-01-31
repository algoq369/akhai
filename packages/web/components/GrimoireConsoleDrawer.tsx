'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronUpIcon } from '@heroicons/react/24/outline'
import { useSefirotStore } from '@/lib/stores/sefirot-store'
import { useSettingsStore } from '@/lib/stores/settings-store'
import { SEPHIROTH_METADATA, Sefirah } from '@/lib/ascent-tracker'
import { SEVEN_LENSES } from '@/lib/instinct-mode'
import { SimpleSefirotTree } from './SimpleSefirotTree'

interface GrimoireConsoleDrawerProps {
  grimoireId: string
  methodology: string
  onMethodologyChange: (methodology: string) => void
  gnosticMetadata?: any
}

type DrawerTab = 'methodology' | 'sefirot' | 'lenses' | 'insights' | 'closed'

/**
 * Grimoire Console Drawer
 *
 * Bottom drawer for grimoire conversation page with four consoles:
 * - Methodology: Select reasoning approach
 * - Sefirot Tree: Full interactive Tree of Life visualization
 * - Hermetic Lenses: 7 esoteric perspectives
 * - Insights: Gnostic intelligence feedback
 *
 * Features:
 * - Slides up from bottom with Framer Motion
 * - Toggle buttons always visible
 * - Max height 60vh for scrollability
 * - State persisted via Zustand stores
 */
export function GrimoireConsoleDrawer({ grimoireId, methodology, onMethodologyChange, gnosticMetadata }: GrimoireConsoleDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>('methodology')
  const isOpen = activeTab !== 'closed'

  return (
    <div className="relative flex-shrink-0">
      {/* Toggle Bar - Always Visible */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 border-t-2 border-slate-200 dark:border-slate-700 shadow-sm min-h-[48px]">
        {/* Console Label */}
        <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-2">
          Console:
        </span>

        <button
          onClick={() => setActiveTab(activeTab === 'methodology' ? 'closed' : 'methodology')}
          className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded transition-colors border ${
            activeTab === 'methodology'
              ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-50 hover:border-slate-400 dark:hover:bg-slate-600'
          }`}
        >
          ◎ Methodology
        </button>
        <button
          onClick={() => setActiveTab(activeTab === 'sefirot' ? 'closed' : 'sefirot')}
          className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded transition-colors border ${
            activeTab === 'sefirot'
              ? 'bg-purple-500 text-white border-purple-500'
              : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-50 hover:border-slate-400 dark:hover:bg-slate-600'
          }`}
        >
          ✦ AI Config
        </button>
        <button
          onClick={() => setActiveTab(activeTab === 'lenses' ? 'closed' : 'lenses')}
          className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded transition-colors border ${
            activeTab === 'lenses'
              ? 'bg-cyan-500 text-white border-cyan-500'
              : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-50 hover:border-slate-400 dark:hover:bg-slate-600'
          }`}
        >
          ◉ Hermetic Lenses
        </button>
        <button
          onClick={() => setActiveTab(activeTab === 'insights' ? 'closed' : 'insights')}
          className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded transition-colors border ${
            activeTab === 'insights'
              ? 'bg-green-500 text-white border-green-500'
              : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-50 hover:border-slate-400 dark:hover:bg-slate-600'
          }`}
        >
          ◈ Insights
        </button>
        <div className="flex-1"></div>
        {isOpen && (
          <button
            onClick={() => setActiveTab('closed')}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <ChevronUpIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Drawer Content - Slides Up */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="overflow-hidden border-t border-slate-300 dark:border-slate-600"
          >
            <div className="bg-white dark:bg-slate-900 max-h-[60vh] overflow-y-auto">
              {activeTab === 'methodology' && <MethodologyTab currentMethodology={methodology} onMethodologyChange={onMethodologyChange} />}
              {activeTab === 'sefirot' && <SimpleSefirotTree />}
              {activeTab === 'lenses' && <HermeticLensesFull />}
              {activeTab === 'insights' && <InsightsTab gnosticMetadata={gnosticMetadata} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Full Hermetic Lenses Component
 *
 * 7 esoteric perspectives for AI reasoning
 */
function HermeticLensesFull() {
  const { settings, setInstinctConfig } = useSettingsStore()
  const activeLenses = settings.instinctConfig.activeLenses || []

  const toggleLens = (lensId: string) => {
    const newLenses = activeLenses.includes(lensId)
      ? activeLenses.filter(id => id !== lensId)
      : [...activeLenses, lensId]

    setInstinctConfig({
      activeLenses: newLenses
    })
  }

  // Lens colors based on their esoteric meanings
  const LENS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
    exoteric: { bg: 'bg-slate-50 dark:bg-slate-800', border: 'border-slate-300 dark:border-slate-600', text: 'text-slate-600 dark:text-slate-300' },
    esoteric: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-300 dark:border-purple-700', text: 'text-purple-600 dark:text-purple-400' },
    gnostic: { bg: 'bg-cyan-50 dark:bg-cyan-900/20', border: 'border-cyan-300 dark:border-cyan-700', text: 'text-cyan-600 dark:text-cyan-400' },
    hermetic: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-300 dark:border-amber-700', text: 'text-amber-600 dark:text-amber-400' },
    kabbalistic: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-400 dark:border-purple-600', text: 'text-purple-700 dark:text-purple-300' },
    alchemical: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-300 dark:border-red-700', text: 'text-red-600 dark:text-red-400' },
    prophetic: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-300 dark:border-green-700', text: 'text-green-600 dark:text-green-400' },
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h3 className="text-sm font-mono text-slate-700 dark:text-slate-300 mb-2">
          Hermetic Lenses - 7 Perspectives
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Enable esoteric lenses to view knowledge through different philosophical traditions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SEVEN_LENSES.map(lens => {
          const isActive = activeLenses.includes(lens.id)
          const colors = LENS_COLORS[lens.id] || LENS_COLORS.exoteric

          return (
            <button
              key={lens.id}
              onClick={() => toggleLens(lens.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                isActive
                  ? `${colors.bg} ${colors.border} shadow-md`
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{lens.symbol}</span>
                <span className={`text-sm font-mono font-semibold ${
                  isActive ? colors.text : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {lens.name}
                </span>
                <span className="ml-auto text-lg">
                  {isActive ? '●' : '○'}
                </span>
              </div>
              <p className={`text-xs ${
                isActive ? colors.text : 'text-slate-600 dark:text-slate-400'
              }`}>
                {lens.description}
              </p>
            </button>
          )
        })}
      </div>

      {/* Active Lenses Summary */}
      {activeLenses.length > 0 && (
        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <p className="text-[10px] text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
            Active Lenses ({activeLenses.length}/7)
          </p>
          <div className="flex flex-wrap gap-2">
            {activeLenses.map(lensId => {
              const lens = SEVEN_LENSES.find(l => l.id === lensId)
              if (!lens) return null
              const colors = LENS_COLORS[lensId]
              return (
                <span
                  key={lensId}
                  className={`px-2 py-1 rounded text-[9px] font-mono ${colors.bg} ${colors.border} ${colors.text} border`}
                >
                  {lens.symbol} {lens.name}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Methodology Tab Component
 *
 * Allows selection of AI reasoning methodology for grimoire conversations
 */
interface MethodologyTabProps {
  currentMethodology: string
  onMethodologyChange: (methodology: string) => void
}

function MethodologyTab({ currentMethodology, onMethodologyChange }: MethodologyTabProps) {
  const methodologies = [
    { id: 'auto', symbol: '◎', name: 'Auto', description: 'Smart routing based on query complexity' },
    { id: 'direct', symbol: '→', name: 'Direct', description: 'Single AI call, instant response' },
    { id: 'cod', symbol: '⋯', name: 'Chain of Draft', description: 'Iterative refinement process' },
    { id: 'bot', symbol: '◇', name: 'Buffer of Thoughts', description: 'Template-based reasoning' },
    { id: 'react', symbol: '⟳', name: 'ReAct', description: 'Tools: search, calculator, etc.' },
    { id: 'pot', symbol: '△', name: 'Program of Thought', description: 'Code-based computation' },
    { id: 'gtp', symbol: '◯', name: 'GTP Consensus', description: 'Multi-AI agreement synthesis' },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-sm font-mono text-slate-700 dark:text-slate-300 mb-2">
          Reasoning Methodology
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Select how the AI processes your questions in this grimoire
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {methodologies.map(method => (
          <button
            key={method.id}
            onClick={() => onMethodologyChange(method.id)}
            className={`p-3 rounded border-2 text-left transition-all ${
              currentMethodology === method.id
                ? 'bg-purple-50 border-purple-500 dark:bg-purple-900/20 dark:border-purple-400'
                : 'bg-white border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{method.symbol}</span>
              <span className={`font-mono font-semibold text-sm ${
                currentMethodology === method.id
                  ? 'text-purple-700 dark:text-purple-300'
                  : 'text-slate-700 dark:text-slate-300'
              }`}>
                {method.name}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">{method.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * Insights Tab Component
 *
 * Displays gnostic intelligence feedback (Anti-Qliphoth, Ascent, Da'at)
 */
interface InsightsTabProps {
  gnosticMetadata?: any
}

function InsightsTab({ gnosticMetadata }: InsightsTabProps) {
  if (!gnosticMetadata) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No insights available yet. Send a message to generate AI reasoning feedback.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      {/* Anti-Qliphoth Shield */}
      {gnosticMetadata.antiQliphothShield && (
        <div>
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
            Anti-Qliphoth Shield
          </h4>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-3">
            <p className="text-xs text-green-700 dark:text-green-300">
              ✓ No hollow knowledge detected
            </p>
          </div>
        </div>
      )}

      {/* Ascent Tracker */}
      {gnosticMetadata.ascentState && (
        <div>
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
            Ascent Progress
          </h4>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all"
                style={{ width: `${(gnosticMetadata.ascentState.currentLevel / 11) * 100}%` }}
              />
            </div>
            <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
              Level {gnosticMetadata.ascentState.currentLevel}/11
            </span>
          </div>
        </div>
      )}

      {/* Da'at Insights */}
      {gnosticMetadata.daatInsights && (
        <div>
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
            Emergent Insights
          </h4>
          <ul className="space-y-1">
            {gnosticMetadata.daatInsights.map((insight: string, i: number) => (
              <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                <span>•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
