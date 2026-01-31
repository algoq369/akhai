'use client'

/**
 * QUICK CONFIG - Console Style
 * 
 * Minimalist configuration for the 3 most critical AI processing layers
 * Raw text, compact, single-column console dashboard approach
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AILayer, 
  AI_LAYER_METADATA, 
  AI_PRESETS,
  CRITICAL_LAYERS,
  PROCESSING_ORDER,
  isCriticalLayer,
  type AIPreset 
} from '@/lib/ai-layers'
import { useSefirotStore } from '@/lib/stores/sefirot-store'

// Slider extremity labels for each critical layer
const SLIDER_LABELS: Record<AILayer, { low: string; high: string }> = {
  [AILayer.REASONING]: { low: 'shallow', high: 'deep' },
  [AILayer.KNOWLEDGE_RECALL]: { low: 'focused', high: 'broad' },
  [AILayer.VERIFICATION]: { low: 'minimal', high: 'thorough' },
  // Defaults for other layers
  [AILayer.RECEPTION]: { low: 'basic', high: 'detailed' },
  [AILayer.COMPREHENSION]: { low: 'surface', high: 'deep' },
  [AILayer.CONTEXT_BUILDING]: { low: 'narrow', high: 'wide' },
  [AILayer.EXPANSION]: { low: 'constrained', high: 'expansive' },
  [AILayer.CRITICAL_ANALYSIS]: { low: 'lenient', high: 'strict' },
  [AILayer.SYNTHESIS]: { low: 'simple', high: 'complex' },
  [AILayer.ARTICULATION]: { low: 'concise', high: 'verbose' },
  [AILayer.OUTPUT]: { low: 'minimal', high: 'complete' },
}

// Short descriptions for each layer
const LAYER_DESCRIPTIONS: Record<AILayer, string> = {
  [AILayer.REASONING]: 'breaks problems into steps, works through logic',
  [AILayer.KNOWLEDGE_RECALL]: 'retrieves relevant facts and domain expertise',
  [AILayer.VERIFICATION]: 'checks for errors and hallucinations',
  [AILayer.RECEPTION]: 'parses and normalizes input',
  [AILayer.COMPREHENSION]: 'understands meaning and context',
  [AILayer.CONTEXT_BUILDING]: 'maps relationships between concepts',
  [AILayer.EXPANSION]: 'explores alternatives and possibilities',
  [AILayer.CRITICAL_ANALYSIS]: 'evaluates and identifies limitations',
  [AILayer.SYNTHESIS]: 'combines insights into coherent output',
  [AILayer.ARTICULATION]: 'crafts clear response text',
  [AILayer.OUTPUT]: 'delivers final formatted response',
}

interface QuickConfigProps {
  onExpandAdvanced?: () => void
  className?: string
}

export function QuickConfig({ onExpandAdvanced, className = '' }: QuickConfigProps) {
  const { weights, setWeight } = useSefirotStore()
  const [activePreset, setActivePreset] = useState<string>('balanced')
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)

  const handlePresetSelect = (preset: AIPreset) => {
    setActivePreset(preset.id)
    Object.entries(preset.weights).forEach(([layer, weight]) => {
      setWeight(parseInt(layer), weight)
    })
  }

  const handleWeightChange = (layer: AILayer, value: number) => {
    setWeight(layer, value)
    setActivePreset('custom')
  }

  const getWeight = (layer: AILayer): number => weights[layer] ?? 0.5

  return (
    <div className={`font-mono text-xs ${className}`}>
      {/* Quick Settings Header */}
      <div className="flex items-baseline justify-between mb-4">
        <span className="text-[10px] uppercase tracking-widest text-neutral-400">
          quick settings
        </span>
        <span className="text-[10px] text-neutral-300">top 3 impact layers</span>
      </div>

      {/* Critical Layers - Compact Console Style */}
      <div className="space-y-5 mb-6">
        {CRITICAL_LAYERS.map((layerId) => {
          const layer = AI_LAYER_METADATA[layerId]
          const weight = getWeight(layerId)
          const labels = SLIDER_LABELS[layerId]
          const description = LAYER_DESCRIPTIONS[layerId]
          
          return (
            <div key={layerId}>
              {/* Layer name and value */}
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-neutral-400">•</span>
                <span className="text-neutral-700">{layer.name}</span>
                <span className="flex-1 border-b border-dotted border-neutral-200 mx-2" />
                <span className="text-neutral-900 tabular-nums">{Math.round(weight * 100)}%</span>
              </div>
              
              {/* Slider with extremity labels */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] text-neutral-400 w-14 text-right">{labels.low}</span>
                <div className="flex-1 relative">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(weight * 100)}
                    onChange={(e) => handleWeightChange(layerId, parseInt(e.target.value) / 100)}
                    className="w-full h-1 bg-neutral-100 rounded-full appearance-none cursor-pointer
                             [&::-webkit-slider-thumb]:appearance-none 
                             [&::-webkit-slider-thumb]:w-2.5 
                             [&::-webkit-slider-thumb]:h-2.5 
                             [&::-webkit-slider-thumb]:rounded-full 
                             [&::-webkit-slider-thumb]:bg-neutral-800
                             [&::-webkit-slider-thumb]:border-2
                             [&::-webkit-slider-thumb]:border-white
                             [&::-webkit-slider-thumb]:shadow-sm
                             [&::-webkit-slider-thumb]:cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${layer.color} 0%, ${layer.color} ${weight * 100}%, #f5f5f5 ${weight * 100}%, #f5f5f5 100%)`,
                    }}
                  />
                </div>
                <span className="text-[9px] text-neutral-400 w-14">{labels.high}</span>
              </div>
              
              {/* Description */}
              <p className="text-[10px] text-neutral-400 pl-4">{description}</p>
            </div>
          )
        })}
      </div>

      {/* Presets - Compact Row */}
      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-widest text-neutral-400 mb-2">presets</div>
        <div className="flex gap-1">
          {AI_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetSelect(preset)}
              className={`px-2 py-1 text-[10px] rounded transition-all ${
                activePreset === preset.id
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              {preset.name}
            </button>
          ))}
          {activePreset === 'custom' && (
            <span className="px-2 py-1 text-[10px] text-neutral-400 border border-dashed border-neutral-200 rounded">
              custom
            </span>
          )}
        </div>
      </div>

      {/* Expand to All Layers */}
      <button
        onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
        className="w-full flex items-center justify-between py-2 text-[10px] text-neutral-400 
                   border-t border-neutral-100 hover:text-neutral-600 transition-colors"
      >
        <span className="uppercase tracking-wider">
          {isAdvancedOpen ? 'hide' : 'show'} all 11 layers
        </span>
        <span>{isAdvancedOpen ? '▴' : '▾'}</span>
      </button>

      {/* Advanced: All Layers */}
      <AnimatePresence>
        {isAdvancedOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3">
              {(['input', 'understanding', 'reasoning', 'output'] as const).map((phase) => {
                const phaseLayers = PROCESSING_ORDER
                  .map(id => AI_LAYER_METADATA[id])
                  .filter(l => l.phase === phase)
                
                return (
                  <div key={phase} className="mb-3">
                    <div className="text-[9px] uppercase tracking-wider text-neutral-300 mb-1.5 border-b border-neutral-50 pb-1">
                      {phase}
                    </div>
                    <div className="space-y-1.5">
                      {phaseLayers.map((layer) => {
                        const weight = getWeight(layer.id)
                        const isCritical = isCriticalLayer(layer.id)
                        const labels = SLIDER_LABELS[layer.id]
                        
                        return (
                          <div key={layer.id} className="flex items-center gap-2">
                            <span className={`w-24 truncate text-[10px] ${isCritical ? 'text-neutral-700' : 'text-neutral-500'}`}>
                              {isCritical && '★ '}{layer.name}
                            </span>
                            <span className="text-[8px] text-neutral-300 w-12 text-right">{labels.low}</span>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={Math.round(weight * 100)}
                              onChange={(e) => handleWeightChange(layer.id, parseInt(e.target.value) / 100)}
                              className="flex-1 h-0.5 bg-neutral-100 rounded-full appearance-none cursor-pointer
                                       [&::-webkit-slider-thumb]:appearance-none 
                                       [&::-webkit-slider-thumb]:w-2 
                                       [&::-webkit-slider-thumb]:h-2 
                                       [&::-webkit-slider-thumb]:rounded-full 
                                       [&::-webkit-slider-thumb]:bg-neutral-600"
                              style={{
                                background: `linear-gradient(to right, ${layer.color}80 0%, ${layer.color}80 ${weight * 100}%, #f5f5f5 ${weight * 100}%, #f5f5f5 100%)`,
                              }}
                            />
                            <span className="text-[8px] text-neutral-300 w-12">{labels.high}</span>
                            <span className="text-[10px] text-neutral-500 tabular-nums w-8 text-right">
                              {Math.round(weight * 100)}%
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default QuickConfig
