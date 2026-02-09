'use client'

/**
 * Layer Detail Modal Component
 *
 * Compact centered popup that appears when clicking a Layer node on the /tree-of-life page.
 * Uses AI computational terminology instead of Kabbalistic terms.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { Layer, LAYER_METADATA } from '@/lib/layer-registry'

// AI Computational Labels
const AI_LABELS: Record<number, { primary: string; concept: string }> = {
  [Layer.META_CORE]: { primary: 'meta-cognition', concept: 'consciousness itself' },
  [Layer.REASONING]: { primary: 'first principles', concept: 'fundamental wisdom' },
  [Layer.ENCODER]: { primary: 'pattern recognition', concept: 'deep structure' },
  [Layer.SYNTHESIS]: { primary: 'emergent insight', concept: 'hidden knowledge' },
  [Layer.EXPANSION]: { primary: 'expansion', concept: 'growth potential' },
  [Layer.DISCRIMINATOR]: { primary: 'critical analysis', concept: 'limitations' },
  [Layer.ATTENTION]: { primary: 'synthesis', concept: 'integration' },
  [Layer.GENERATIVE]: { primary: 'persistence', concept: 'creative drive' },
  [Layer.CLASSIFIER]: { primary: 'communication', concept: 'logical clarity' },
  [Layer.EXECUTOR]: { primary: 'foundation', concept: 'procedural base' },
  [Layer.EMBEDDING]: { primary: 'manifestation', concept: 'factual output' },
}

interface LayerDetailModalProps {
  layerNode: Layer | null
  isOpen: boolean
  onClose: () => void
  lastQueryPerspective?: string
  currentWeight?: number
  onWeightChange?: (layerNode: Layer, weight: number) => void
}

export function LayerDetailModal({
  layerNode,
  isOpen,
  onClose,
  lastQueryPerspective,
  currentWeight = 0.5,
  onWeightChange
}: LayerDetailModalProps) {
  if (!layerNode) return null

  const meta = LAYER_METADATA[layerNode]
  const aiLabel = AI_LABELS[layerNode] || { primary: 'layer', concept: '' }
  const percentage = Math.round(currentWeight * 100)

  const handleWeightChange = (value: string) => {
    const num = parseInt(value) || 0
    const clamped = Math.max(0, Math.min(100, num))
    onWeightChange?.(layerNode, clamped / 100)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40"
            onClick={onClose}
          />

          {/* Modal - Centered */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-xs"
          >
            <div className="bg-white border border-slate-200 shadow-xl rounded-lg overflow-hidden">
              {/* Header - AI Computational Term */}
              <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                    <span className="text-[11px] font-mono font-semibold text-slate-800 uppercase tracking-wider">
                      {aiLabel.primary}
                    </span>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-[9px] text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">
                  {aiLabel.concept}
                </div>
              </div>

              {/* Content - Compact */}
              <div className="p-3 space-y-3">
                {/* AI Role */}
                <div>
                  <div className="text-[8px] uppercase text-slate-400 tracking-wider mb-1">
                    Function
                  </div>
                  <div className="text-[10px] text-slate-700 bg-slate-50 px-2 py-1.5 rounded border border-slate-100">
                    {meta.aiRole.split('•')[0].trim()}
                  </div>
                </div>

                {/* Influence - Number Input */}
                {onWeightChange && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[8px] uppercase text-slate-400 tracking-wider">
                      Weight
                    </span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={percentage}
                        onChange={(e) => handleWeightChange(e.target.value)}
                        className="w-12 text-[10px] font-mono text-right border border-slate-200 px-1.5 py-0.5 rounded focus:outline-none focus:border-slate-400"
                      />
                      <span className="text-[10px] text-slate-500">%</span>
                    </div>
                  </div>
                )}

                {/* Query Characteristics - Compact */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[8px] uppercase text-slate-400 tracking-wider mb-1.5">
                    Characteristics
                  </div>
                  <ul className="space-y-0.5">
                    {meta.queryCharacteristics.slice(0, 3).map((char, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[9px] text-slate-600">
                        <span className="text-purple-400 mt-0.5">▸</span>
                        <span className="leading-tight">{char}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Footer - Layer number */}
              <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 text-[8px] text-slate-400 flex items-center justify-between">
                <span>Layer {layerNode}</span>
                <span className="text-slate-300">{meta.pillar} pillar</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
