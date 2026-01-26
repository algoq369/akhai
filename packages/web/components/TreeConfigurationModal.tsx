'use client'

/**
 * Model Configuration Modal
 *
 * Clean white minimalist style matching Settings page.
 * No shadows, no glows, just clean typography.
 * Triggered by footer "layer config" button.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ASCIISefirotTree } from './ASCIISefirotTree'
import { useSefirotStore } from '@/lib/stores/sefirot-store'
import { SEPHIROTH_METADATA } from '@/lib/ascent-tracker'
import { SEFIROT_PRESETS, PRESET_NAMES, type PresetName } from '@/lib/sefirot-presets'

// Use shared presets from lib/sefirot-presets.ts
const PRESETS = SEFIROT_PRESETS

interface TreeConfigurationModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function TreeConfigurationModal({ isOpen, onClose }: TreeConfigurationModalProps) {
  const router = useRouter()
  const [showGuide, setShowGuide] = useState(false)
  const { applyPreset } = useSefirotStore()

  const handlePreset = (name: PresetName) => {
    const weights = PRESETS[name]
    if (weights) {
      applyPreset(weights as Record<number, number>, name)
    }
  }

  const handleAdvancedConfig = () => {
    onClose()
    router.push('/tree-of-life')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - subtle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
            onClick={onClose}
          >
            {/* Modal - Clean white */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-white p-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-sm font-normal text-neutral-600">
                    AI Computational Tree
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1">
                    adjust layer weights
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-neutral-400 hover:text-neutral-600 text-lg transition-colors"
                >
                  ×
                </button>
              </div>

              {/* Divider */}
              <div className="h-px bg-neutral-200 mb-6" />

              {/* Presets */}
              <div className="flex gap-3 text-xs text-neutral-500 mb-6">
                <button
                  onClick={() => handlePreset('analytical')}
                  className="hover:text-neutral-800 transition-colors"
                >
                  analytical
                </button>
                <span className="text-neutral-300">·</span>
                <button
                  onClick={() => handlePreset('creative')}
                  className="hover:text-neutral-800 transition-colors"
                >
                  creative
                </button>
                <span className="text-neutral-300">·</span>
                <button
                  onClick={() => handlePreset('balanced')}
                  className="hover:text-neutral-800 transition-colors"
                >
                  balanced
                </button>
                <span className="text-neutral-300">·</span>
                <button
                  onClick={() => handlePreset('deep')}
                  className="hover:text-neutral-800 transition-colors"
                >
                  deep
                </button>
              </div>

              {/* Tree Content */}
              <div className="py-4">
                <ASCIISefirotTree />
              </div>

              {/* Legend Section */}
              <div className="mt-6 pt-4 border-t border-neutral-200">
                <button
                  onClick={() => setShowGuide(!showGuide)}
                  className="text-neutral-500 text-xs flex items-center gap-1 hover:text-neutral-700 transition-colors"
                >
                  {showGuide ? '▾' : '▸'} layer guide
                </button>

                {showGuide && (
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    {Object.entries(SEPHIROTH_METADATA).map(([key, meta]) => (
                      <div key={key} className="flex gap-2">
                        <span className="text-neutral-300">○</span>
                        <div>
                          <span className="text-neutral-700">{meta.name}</span>
                          <span className="text-neutral-400 ml-1 text-[10px]">{meta.hebrewName}</span>
                          <p className="text-neutral-400 text-[10px] mt-0.5">
                            {meta.aiRole.split('•')[0]?.trim()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Advanced Configuration Link */}
              <div className="mt-6 pt-4 border-t border-neutral-200">
                <button
                  onClick={handleAdvancedConfig}
                  className="text-xs text-neutral-500 hover:text-neutral-800 transition-colors flex items-center gap-1"
                >
                  Advanced Configuration <span className="text-neutral-300">→</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
