'use client'

/**
 * Tree Configuration Panel - Inline Borderless 3-Slider
 *
 * Matches InstinctModeConsole style: no box, no backdrop, no border.
 * Unfolds inline below the ✦ button. Pure raw text + sliders.
 * 'advanced →' links to /tree-of-life full page.
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
  { layer: Layer.REASONING, label: 'reasoning', left: 'surface', right: 'deep analysis', color: '#4f46e5' },
  { layer: Layer.ATTENTION, label: 'attention', left: 'broad', right: 'laser focus', color: '#22c55e' },
  { layer: Layer.GENERATIVE, label: 'generative', left: 'factual', right: 'creative', color: '#f97316' },
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
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="w-full max-w-2xl font-mono text-[9px] mt-1 px-4 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-500 uppercase tracking-[0.15em] text-[8px]">
              ai config
            </span>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-500 transition-colors text-[8px]"
            >
              [x]
            </button>
          </div>

          {/* Sliders */}
          <div className="space-y-2.5 mb-3">
            {SLIDER_CONFIG.map(({ layer, label, left, right, color }) => {
              const value = Math.round((weights[layer] ?? 0.5) * 100)
              return (
                <div key={layer}>
                  <div className="flex items-baseline gap-1.5 mb-0.5">
                    <span
                      className="uppercase tracking-[0.1em] text-[8px] min-w-[60px]"
                      style={{ color }}
                    >
                      {label}
                    </span>
                    <span className="text-[8px] tabular-nums" style={{ color, opacity: 0.7 }}>
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
                    className="w-full h-px appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${color} ${value}%, #d4d4d8 ${value}%)`,
                      accentColor: color,
                    }}
                  />
                  <div className="flex justify-between">
                    <span className="text-zinc-500 text-[7px]" style={{ opacity: 0.6 }}>{left}</span>
                    <span className="text-zinc-500 text-[7px]" style={{ opacity: 0.6 }}>{right}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Presets */}
          <div className="flex items-center gap-3 mb-2">
            {PRESETS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => {
                  useLayerStore.getState().applyPreset({ ...LAYER_PRESETS[key] }, key)
                }}
                className="transition-colors text-[8px] uppercase tracking-[0.1em]"
                style={{
                  color: activePreset === key ? '#18181b' : '#a1a1aa',
                  fontWeight: activePreset === key ? 600 : 400,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Advanced link */}
          <button
            onClick={() => { window.location.href = '/tree-of-life?mode=advanced' }}
            className="text-zinc-400 hover:text-zinc-500 transition-colors text-[7px] uppercase tracking-[0.1em]"
          >
            advanced &rarr;
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
