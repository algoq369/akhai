'use client'

/**
 * Tree Configuration Modal - Compact Grid Style
 * 
 * Minimalist two-column grid layout.
 * Monospace typography, no decorations.
 * Triggered by footer "sefirot tree" button.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useSefirotStore } from '@/lib/stores/sefirot-store'
import { SEFIROT_PRESETS, type PresetName } from '@/lib/sefirot-presets'

interface TreeConfigurationModalProps {
  isOpen: boolean
  onClose: () => void
}

const LAYERS = [
  { id: 10, label: 'meta-cognition' },
  { id: 9, label: 'first principles' },
  { id: 8, label: 'pattern recognition' },
  { id: 11, label: 'emergent insight' },
  { id: 7, label: 'expansion' },
  { id: 6, label: 'critical analysis' },
  { id: 5, label: 'synthesis' },
  { id: 4, label: 'persistence' },
  { id: 3, label: 'communication' },
  { id: 2, label: 'foundation' },
  { id: 1, label: 'manifestation' },
]

export default function TreeConfigurationModal({ isOpen, onClose }: TreeConfigurationModalProps) {
  const router = useRouter()
  const { weights, setWeight, applyPreset, activePreset: storePreset } = useSefirotStore()
  const [activePreset, setActivePreset] = useState<PresetName | null>(storePreset as PresetName | null)

  const getPercentage = (level: number) => Math.round((weights[level] || 0.5) * 100)

  const handlePreset = (name: PresetName) => {
    const presetWeights = SEFIROT_PRESETS[name]
    if (presetWeights) {
      applyPreset(presetWeights as Record<number, number>, name)
      setActivePreset(name)
    }
  }

  const handleValueChange = (level: number, value: string) => {
    const val = parseInt(value)
    if (!isNaN(val) && val >= 0 && val <= 100) {
      setWeight(level, val / 100)
      setActivePreset(null)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/10"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.12 }}
            className="w-full max-w-md bg-white border border-neutral-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
              <div className="font-mono text-xs text-neutral-500">
                ai computational tree
              </div>
              <button
                onClick={onClose}
                className="font-mono text-xs text-neutral-400 hover:text-neutral-600"
              >
                [x]
              </button>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-4 px-4 py-2 border-b border-neutral-100 font-mono text-[10px]">
              <span className="text-neutral-400">preset:</span>
              {(['analytical', 'creative', 'balanced', 'deep'] as PresetName[]).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePreset(p)}
                  className={`transition-colors ${
                    activePreset === p 
                      ? 'text-neutral-900' 
                      : 'text-neutral-400 hover:text-neutral-600'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Grid */}
            <div className="p-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-[11px]">
                {LAYERS.map((layer) => (
                  <div key={layer.id} className="flex items-center justify-between py-1">
                    <span className="text-neutral-500 truncate pr-2">
                      {layer.label}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={getPercentage(layer.id)}
                        onChange={(e) => handleValueChange(layer.id, e.target.value)}
                        className="w-10 px-1 py-0.5 text-right text-neutral-700 bg-transparent border-b border-neutral-200 focus:border-neutral-400 focus:outline-none"
                      />
                      <span className="text-neutral-300 text-[9px]">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-neutral-100 font-mono text-[10px] text-neutral-400">
              <span>11 layers</span>
              <button
                onClick={() => { onClose(); router.push('/tree-of-life') }}
                className="hover:text-neutral-600 transition-colors"
              >
                advanced
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
