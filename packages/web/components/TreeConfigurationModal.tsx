'use client'

/**
 * Tree Configuration Panel - Centered Ghost Panel
 *
 * Floating borderless config: no box, no shadow, just content on near-white.
 * Centered on screen with subtle backdrop. Scale + fade animation.
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
      {isOpen && (<>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="fixed inset-0 z-50 bg-black/10"
          onClick={onClose}
        />

        {/* Ghost panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, x: '-50%', y: '-50%' }}
          animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
          exit={{ opacity: 0, scale: 0.95, x: '-50%', y: '-50%' }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="fixed z-50 font-mono"
          style={{
            top: '50%',
            left: '50%',
            width: '100%',
            maxWidth: 440,
            padding: 24,
            backgroundColor: 'rgba(255, 255, 255, 0.97)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <span className="text-[12px] uppercase tracking-[0.15em] text-zinc-400">
              ai config
            </span>
            <button
              onClick={onClose}
              className="text-[11px] text-zinc-400 hover:text-zinc-500 transition-colors"
            >
              [x]
            </button>
          </div>

          {/* Sliders */}
          <div className="space-y-4 mb-5">
            {SLIDER_CONFIG.map(({ layer, label, left, right, color }) => {
              const value = Math.round((weights[layer] ?? 0.5) * 100)
              return (
                <div key={layer}>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span
                      className="uppercase tracking-[0.1em] text-[11px] min-w-[70px]"
                      style={{ color }}
                    >
                      {label}
                    </span>
                    <span className="text-[12px] font-semibold tabular-nums" style={{ color }}>
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
                  <div className="flex justify-between mt-0.5">
                    <span className="text-zinc-500 text-[9px]" style={{ opacity: 0.6 }}>{left}</span>
                    <span className="text-zinc-500 text-[9px]" style={{ opacity: 0.6 }}>{right}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Presets */}
          <div className="flex items-center gap-4 mb-3">
            {PRESETS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => {
                  useLayerStore.getState().applyPreset({ ...LAYER_PRESETS[key] }, key)
                }}
                className="transition-colors text-[10px] uppercase tracking-[0.1em]"
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
            className="text-[10px] text-zinc-400 hover:text-zinc-500 transition-colors uppercase tracking-[0.1em]"
          >
            advanced &rarr;
          </button>
        </motion.div>
      </>)}
    </AnimatePresence>
  )
}
