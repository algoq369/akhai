'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Layer, LAYER_METADATA } from '@/lib/layer-registry'
import { useLayerStore } from '@/lib/stores/layer-store'
import { PRESET_NAMES, getPresetWeights, type PresetName } from '@/lib/layer-presets'

/**
 * AI COMPUTATIONAL LAYERS CONSOLE (COMPACT)
 * Minimalist AI Processing Layer configuration - 11 layer weights
 */

type ProcessingMode = 'weighted' | 'parallel' | 'adaptive'

const LAYER_SYMBOLS: Record<number, string> = {
  [Layer.EMBEDDING]: '⊕', [Layer.EXECUTOR]: '◐', [Layer.CLASSIFIER]: '⬡',
  [Layer.GENERATIVE]: '◉', [Layer.ATTENTION]: '✡', [Layer.DISCRIMINATOR]: '⚗',
  [Layer.EXPANSION]: '◯', [Layer.ENCODER]: '⊙', [Layer.REASONING]: '☿',
  [Layer.META_CORE]: '◈', [Layer.SYNTHESIS]: '◬'
}

const LAYER_COLORS: Record<number, string> = {
  [Layer.EMBEDDING]: '#92400e', [Layer.EXECUTOR]: '#94a3b8', [Layer.CLASSIFIER]: '#eab308',
  [Layer.GENERATIVE]: '#f97316', [Layer.ATTENTION]: '#22c55e', [Layer.DISCRIMINATOR]: '#dc2626',
  [Layer.EXPANSION]: '#06b6d4', [Layer.ENCODER]: '#3b82f6', [Layer.REASONING]: '#4f46e5',
  [Layer.META_CORE]: '#9333ea', [Layer.SYNTHESIS]: '#06b6d4'
}

// Use shared presets from lib/layer-presets.ts
const PRESETS = PRESET_NAMES.map(name => ({
  name,
  weights: getPresetWeights(name)
}))

interface LayerConsoleProps {
  isOpen?: boolean
  onToggle?: () => void
  onConfigChange?: (config: { layers: Record<number, number>; processingMode?: ProcessingMode }) => void
}

export default function LayerConsole({ isOpen, onToggle, onConfigChange }: LayerConsoleProps) {
  const {
    weights, processingMode, activePreset,
    setWeight, setProcessingMode, applyPreset: applyPresetStore
  } = useLayerStore()

  const [internalExpanded, setInternalExpanded] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const isExpanded = isOpen !== undefined ? isOpen : internalExpanded
  const toggleExpanded = () => onToggle ? onToggle() : setInternalExpanded(!internalExpanded)

  useEffect(() => {
    onConfigChange?.({ layers: weights, processingMode })
  }, [weights, processingMode, onConfigChange])

  const updateWeight = (id: number, weight: number) => setWeight(id, weight)

  const applyPreset = (preset: typeof PRESETS[0]) => {
    applyPresetStore(preset.weights as Record<number, number>, preset.name)
    setValidationError(null)
  }

  const validateAndSave = async () => {
    const activeCount = Object.values(weights).filter(w => w > 0).length
    if (activeCount === 0) {
      setValidationError('At least one layer must be active')
      return
    }
    setValidationError(null)
    try {
      await fetch('/api/tree-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: activePreset || 'Custom', layerWeights: weights, processingMode, isActive: true })
      })
    } catch (e) { console.error('Save failed:', e) }
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const mod = navigator.platform.includes('Mac') ? e.metaKey : e.ctrlKey
      if (mod && e.key === 'k') { e.preventDefault(); toggleExpanded() }
      if (!isExpanded) return
      if (mod && e.key === 's') { e.preventDefault(); validateAndSave() }
      if (e.key === 'Escape') toggleExpanded()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isExpanded, weights, processingMode])

  const isDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches

  return (
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-relic-void/20 backdrop-blur-sm font-mono"
          onClick={(e) => e.target === e.currentTarget && toggleExpanded()}
        >
          <div
            className="w-full max-w-xl bg-relic-white dark:bg-relic-void/95 border-t border-relic-mist dark:border-relic-slate/30 p-2 max-h-[60vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-relic-mist/30 dark:border-relic-slate/20">
              <h2 className="text-[9px] uppercase tracking-[0.2em] text-relic-silver">
                ◇ AI COMPUTATIONAL LAYERS
              </h2>
              <button onClick={toggleExpanded} className="text-[8px] text-relic-silver hover:text-relic-void dark:hover:text-white">
                [close]
              </button>
            </div>

            {/* Presets + Mode Row */}
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-relic-mist/30 dark:border-relic-slate/20">
              <div className="flex gap-4">
                {PRESETS.map((p) => (
                  <span
                    key={p.name}
                    onClick={() => applyPreset(p)}
                    className="text-[8px] cursor-pointer"
                    style={{ color: activePreset === p.name ? (isDark ? '#fff' : '#18181b') : '#94a3b8' }}
                  >
                    {activePreset === p.name ? '●' : '○'} {p.name.toLowerCase()}
                  </span>
                ))}
              </div>
              <div className="flex gap-3">
                {(['weighted', 'parallel', 'adaptive'] as ProcessingMode[]).map((m) => (
                  <span
                    key={m}
                    onClick={() => setProcessingMode(m)}
                    className="text-[8px] cursor-pointer"
                    style={{ color: processingMode === m ? (isDark ? '#fff' : '#18181b') : '#94a3b8' }}
                  >
                    {processingMode === m ? '●' : '○'} {m}
                  </span>
                ))}
              </div>
            </div>

            {/* Layers Grid */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mb-2">
              {Object.values(LAYER_METADATA).map((s) => {
                const w = weights[s.level] || 0.5
                const pct = Math.round(w * 100)
                return (
                  <div key={s.level} className="flex items-center gap-2">
                    <span className="text-[10px]" style={{ color: LAYER_COLORS[s.level] }}>
                      {LAYER_SYMBOLS[s.level]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[8px] text-relic-void dark:text-white truncate block">
                        {s.aiRole}
                      </span>
                      <span className="text-[7px] text-relic-silver">{s.name}</span>
                    </div>
                    <span
                      onClick={() => updateWeight(s.level, w > 0.1 ? 0 : 0.5)}
                      className="text-[8px] cursor-pointer"
                      style={{ color: w > 0.1 ? (isDark ? '#fff' : '#18181b') : '#94a3b8' }}
                    >
                      {w > 0.1 ? '●' : '○'}
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={pct}
                      onChange={(e) => updateWeight(s.level, parseInt(e.target.value || '0') / 100)}
                      className="w-10 text-[8px] text-center bg-transparent border-b border-transparent focus:border-relic-mist/30 text-relic-void dark:text-white outline-none"
                    />
                    <span className="text-[7px] text-relic-silver">%</span>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-1 border-t border-relic-mist/30 dark:border-relic-slate/20">
              <span className="text-[8px] text-relic-silver">
                {Object.values(weights).filter(w => w > 0.1).length}/11 active | {processingMode}
              </span>
              <div className="flex gap-3">
                <span
                  onClick={validateAndSave}
                  className={`text-[8px] cursor-pointer ${validationError ? 'text-relic-silver' : 'text-relic-void dark:text-white hover:text-relic-slate'}`}
                >
                  [save]
                </span>
                <span onClick={toggleExpanded} className="text-[8px] cursor-pointer text-relic-silver hover:text-relic-void dark:hover:text-white">
                  [esc]
                </span>
              </div>
            </div>
            {validationError && <div className="mt-1 text-[7px] text-red-600">{validationError}</div>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
