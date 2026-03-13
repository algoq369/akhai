'use client'

/**
 * Tree Configuration Modal - Compact 3-Slider View
 *
 * Simple AI config popup: Reasoning, Attention, Generative sliders.
 * Preset buttons. 'advanced →' links to /tree-of-life full page.
 * Triggered by ✦ button in footer and methodology frame.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useLayerStore } from '@/lib/stores/layer-store'
import { LAYER_PRESETS, type PresetName } from '@/lib/layer-presets'
import { Layer } from '@/lib/layer-registry'

interface TreeConfigurationModalProps {
  isOpen: boolean
  onClose: () => void
}

const SLIDER_CONFIG = [
  { layer: Layer.REASONING, label: 'Reasoning', left: 'surface', right: 'deep analysis', color: '#4f46e5' },
  { layer: Layer.ATTENTION, label: 'Attention', left: 'broad', right: 'laser focus', color: '#22c55e' },
  { layer: Layer.GENERATIVE, label: 'Generative', left: 'factual', right: 'creative', color: '#f97316' },
] as const

const PRESETS: { key: PresetName; label: string }[] = [
  { key: 'analytical', label: 'analytical' },
  { key: 'creative', label: 'creative' },
  { key: 'balanced', label: 'balanced' },
  { key: 'deep', label: 'thorough' },
]

export default function TreeConfigurationModal({ isOpen, onClose }: TreeConfigurationModalProps) {
  const weights = useLayerStore((s) => s.weights)
  const activePreset = useLayerStore((s) => s.activePreset)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.12 }}
            className="w-full max-w-[420px] bg-white border border-neutral-200 shadow-lg mx-4 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                AI CONFIG
              </span>
              <button
                onClick={onClose}
                className="font-mono text-[10px] text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                [x]
              </button>
            </div>

            {/* Sliders */}
            <div className="space-y-5 mb-6">
              {SLIDER_CONFIG.map(({ layer, label, left, right, color }) => {
                const value = Math.round((weights[layer] ?? 0.5) * 100)
                return (
                  <div key={layer}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-700">
                        {label}
                      </span>
                      <span className="font-mono text-[10px] tabular-nums" style={{ color }}>
                        {value}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={value}
                      onChange={(e) => {
                        useLayerStore.getState().setWeight(layer, Number(e.target.value) / 100)
                      }}
                      className="w-full h-1 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${color} ${value}%, #e2e8f0 ${value}%)`,
                        accentColor: color,
                      }}
                    />
                    <div className="flex justify-between mt-0.5">
                      <span className="font-mono text-[8px] text-neutral-400">{left}</span>
                      <span className="font-mono text-[8px] text-neutral-400">{right}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Presets */}
            <div className="grid grid-cols-4 gap-1.5 mb-5">
              {PRESETS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => {
                    useLayerStore.getState().applyPreset({ ...LAYER_PRESETS[key] }, key)
                  }}
                  className={`py-1.5 font-mono text-[9px] uppercase tracking-[0.1em] border transition-all ${
                    activePreset === key
                      ? 'border-neutral-800 text-neutral-800 bg-neutral-50'
                      : 'border-neutral-200 text-neutral-400 hover:border-neutral-400 hover:text-neutral-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Advanced link */}
            <button
              onClick={() => { window.location.href = '/tree-of-life?mode=advanced' }}
              className="font-mono text-[9px] text-neutral-400 hover:text-neutral-700 transition-colors uppercase tracking-[0.15em]"
            >
              advanced &rarr;
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
