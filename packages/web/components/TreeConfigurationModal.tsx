'use client'

/**
 * Tree Configuration Panel - Centered Ghost Panel
 *
 * Floating borderless config: no box, no shadow, just content on near-white.
 * Centered on screen with subtle backdrop. Scale + fade animation.
 * 'advanced →' links to /tree-of-life full page.
 */

import { useMemo } from 'react'
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

// ═══════════════════════════════════════════
// ARCHETYPE NAMING — pure client-side logic
// ═══════════════════════════════════════════

interface Archetype { name: string; symbol: string; color: string }

function generateConfigName(r: number, a: number, g: number): Archetype | null {
  // All high
  if (r > 75 && a > 75 && g > 75) return { name: 'The Sovereign', symbol: '◊', color: '#18181b' }
  // All low
  if (r < 40 && a < 40 && g < 40) return { name: 'The Seeker', symbol: '◬', color: '#94a3b8' }
  // All balanced (within 35-65 range)
  if (r >= 35 && r <= 65 && a >= 35 && a <= 65 && g >= 35 && g <= 65) return null // matches standard balanced

  // Dual combos
  if (r > 70 && a > 70) return { name: 'The Architect', symbol: '⊙', color: '#4f46e5' }
  if (r > 70 && g > 70) return { name: 'The Alchemist', symbol: '☿', color: '#7c3aed' }
  if (a > 70 && g > 70) return { name: 'The Oracle', symbol: '✡', color: '#22c55e' }

  // Single dominant
  if (r > 75 && r > a && r > g) return { name: 'The Discerner', symbol: '◇', color: '#4f46e5' }
  if (a > 75 && a > r && a > g) return { name: 'The Sentinel', symbol: '▣', color: '#22c55e' }
  if (g > 75 && g > r && g > a) return { name: 'The Visionary', symbol: '◈', color: '#f97316' }

  // Fallback: custom but no strong archetype
  const max = Math.max(r, a, g)
  if (max === r) return { name: 'The Discerner', symbol: '◇', color: '#4f46e5' }
  if (max === a) return { name: 'The Sentinel', symbol: '▣', color: '#22c55e' }
  return { name: 'The Visionary', symbol: '◈', color: '#f97316' }
}

export default function TreeConfigurationModal({ isOpen, onClose }: TreeConfigurationModalProps) {
  const weights = useLayerStore((s) => s.weights)
  const activePreset = useLayerStore((s) => s.activePreset)

  const archetype = useMemo(() => {
    if (activePreset) return null // standard preset active, no custom name
    const r = Math.round((weights[Layer.REASONING] ?? 0.5) * 100)
    const a = Math.round((weights[Layer.ATTENTION] ?? 0.5) * 100)
    const g = Math.round((weights[Layer.GENERATIVE] ?? 0.5) * 100)
    return generateConfigName(r, a, g)
  }, [weights, activePreset])

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
            maxWidth: 300,
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
          <div className="flex items-center gap-4 mb-3 flex-wrap">
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

            {/* Custom archetype name */}
            {archetype && (
              <span
                className="text-[10px] tracking-[0.1em] font-semibold transition-colors"
                style={{
                  color: archetype.color,
                  textShadow: `0 0 8px ${archetype.color}33`,
                }}
              >
                {archetype.symbol} {archetype.name}
              </span>
            )}
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
