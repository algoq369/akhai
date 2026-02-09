'use client'

/**
 * Layer Configuration Console
 *
 * Settings-style console for AI layer weight configuration.
 * Matches the minimal, monospace aesthetic of /settings page.
 */

import { useState } from 'react'
import { useLayerStore } from '@/lib/stores/layer-store'
import { useSettingsStore } from '@/lib/stores/settings-store'
import { Layer, LAYER_METADATA } from '@/lib/layer-registry'
import { AI_LAYERS, MODEL_CONFIGS, type ModelConfigName } from '@/lib/ai-terminology'
import { PRESET_NAMES, getPresetWeights, type PresetName } from '@/lib/layer-presets'

interface LayerConfigConsoleProps {
  onTest?: (query: string) => Promise<void>
  testResult?: string | null
  className?: string
}

export default function LayerConfigConsole({ onTest, testResult, className = '' }: LayerConfigConsoleProps) {
  const { weights, activePreset, applyPreset, setWeight, processingMode, setProcessingMode } = useLayerStore()
  const { settings } = useSettingsStore()
  const showOrigins = settings.appearance.showLayerOrigins

  const [showWeights, setShowWeights] = useState(false)
  const [showPresets, setShowPresets] = useState(false)
  const [testQuery, setTestQuery] = useState('')
  const [isTestRunning, setIsTestRunning] = useState(false)

  // Find dominant layer (highest weight)
  const dominantLayer = Object.entries(weights).reduce(
    (max, [id, weight]) => (weight > max.weight ? { id: parseInt(id) as Layer, weight } : max),
    { id: Layer.EMBEDDING, weight: 0 }
  )

  const handlePresetClick = (name: PresetName) => {
    const presetWeights = getPresetWeights(name)
    applyPreset(presetWeights, name)
  }

  const handleRunTest = async () => {
    if (!testQuery.trim() || !onTest) return
    setIsTestRunning(true)
    try {
      await onTest(testQuery.trim())
    } finally {
      setIsTestRunning(false)
    }
  }

  // Layer order for display (top to bottom: meta-core to embedding)
  const layerOrder = [
    Layer.META_CORE, Layer.REASONING, Layer.ENCODER, Layer.SYNTHESIS,
    Layer.EXPANSION, Layer.DISCRIMINATOR, Layer.ATTENTION,
    Layer.GENERATIVE, Layer.CLASSIFIER, Layer.EXECUTOR, Layer.EMBEDDING
  ]

  return (
    <div className={`bg-white dark:bg-relic-void/50 border border-relic-mist dark:border-relic-slate/30 p-6 font-mono ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="text-relic-void dark:text-white text-sm mb-2 tracking-wide">◇ CONFIGURATION</div>
        <div className="text-relic-mist dark:text-relic-slate text-[10px]">─────────────────────────────────────────</div>
      </div>

      {/* MODEL CONFIG */}
      <section className="mb-5">
        <div className="text-relic-slate dark:text-relic-ghost text-[10px] uppercase tracking-[0.2em] mb-2">▸ MODEL CONFIG</div>
        <div className="ml-4 flex gap-4">
          {PRESET_NAMES.map((name) => (
            <span
              key={name}
              onClick={() => handlePresetClick(name)}
              className="text-[9px] cursor-pointer transition-colors"
              style={{ color: activePreset === name ? '#18181b' : '#94a3b8' }}
            >
              {activePreset === name ? '●' : '○'} {name}
            </span>
          ))}
        </div>
      </section>

      {/* PROCESSING MODE */}
      <section className="mb-5">
        <div className="text-relic-slate dark:text-relic-ghost text-[10px] uppercase tracking-[0.2em] mb-2">▸ PROCESSING</div>
        <div className="ml-4 flex gap-4">
          {(['weighted', 'parallel', 'adaptive'] as const).map((mode) => (
            <span
              key={mode}
              onClick={() => setProcessingMode(mode)}
              className="text-[9px] cursor-pointer transition-colors"
              style={{ color: processingMode === mode ? '#18181b' : '#94a3b8' }}
            >
              {processingMode === mode ? '●' : '○'} {mode}
            </span>
          ))}
        </div>
      </section>

      {/* SELECTED (Dominant Layer) */}
      <section className="mb-5">
        <div className="text-relic-slate dark:text-relic-ghost text-[10px] uppercase tracking-[0.2em] mb-2">▸ PRIMARY LAYER</div>
        <div className="ml-4">
          <div className="flex items-center gap-3">
            <span
              className="text-[12px]"
              style={{ color: AI_LAYERS[dominantLayer.id]?.color || '#94a3b8' }}
            >
              {AI_LAYERS[dominantLayer.id]?.symbol}
            </span>
            <span className="text-[10px] text-relic-void dark:text-white">
              {AI_LAYERS[dominantLayer.id]?.name}
            </span>
            {/* Weight bar */}
            <div className="flex-1 max-w-[120px] h-1.5 bg-relic-mist dark:bg-relic-slate/30 rounded overflow-hidden">
              <div
                className="h-full rounded transition-all duration-300"
                style={{
                  width: `${dominantLayer.weight * 100}%`,
                  backgroundColor: AI_LAYERS[dominantLayer.id]?.color || '#94a3b8'
                }}
              />
            </div>
            <span className="text-[9px] text-relic-silver">
              {Math.round(dominantLayer.weight * 100)}%
            </span>
          </div>
          {/* Origin info if enabled */}
          {showOrigins && AI_LAYERS[dominantLayer.id]?.origin && (
            <div className="text-[8px] text-relic-silver mt-1 ml-5">
              {AI_LAYERS[dominantLayer.id].origin.term} · {AI_LAYERS[dominantLayer.id].origin.meaning}
            </div>
          )}
        </div>
      </section>

      {/* LAYER WEIGHTS (Expandable) */}
      <section className="mb-5">
        <button
          onClick={() => setShowWeights(!showWeights)}
          className="text-relic-slate dark:text-relic-ghost text-[10px] uppercase tracking-[0.2em] flex items-center gap-1 hover:text-relic-void dark:hover:text-white transition-colors"
        >
          {showWeights ? '▾' : '▸'} LAYER WEIGHTS
          <span className="text-relic-mist dark:text-relic-slate ml-2">
            ({Object.values(weights).filter(w => w > 0.1).length}/11 active)
          </span>
        </button>

        {showWeights && (
          <div className="ml-4 mt-3 space-y-2">
            {layerOrder.map((layerNode) => {
              const layer = AI_LAYERS[layerNode]
              const weight = weights[layerNode] ?? 0.5
              const pct = Math.round(weight * 100)

              return (
                <div key={layerNode} className="flex items-center gap-2">
                  <span
                    className="text-[10px] w-4"
                    style={{ color: layer?.color || '#94a3b8' }}
                  >
                    {layer?.symbol}
                  </span>
                  <span className="text-[9px] text-relic-slate dark:text-relic-ghost w-32 truncate">
                    {layer?.short}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={pct}
                    onChange={(e) => setWeight(layerNode, parseInt(e.target.value) / 100)}
                    className="flex-1 h-1 bg-relic-mist dark:bg-relic-slate/30 rounded appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:w-2.5
                      [&::-webkit-slider-thumb]:h-2.5
                      [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:cursor-pointer"
                    style={{
                      backgroundImage: `linear-gradient(to right, ${layer?.color || '#94a3b8'} ${pct}%, transparent ${pct}%)`
                    }}
                  />
                  <span className="text-[8px] text-relic-silver w-8 text-right">{pct}%</span>
                  <span
                    onClick={() => setWeight(layerNode, weight > 0.1 ? 0 : 0.5)}
                    className="text-[9px] cursor-pointer"
                    style={{ color: weight > 0.1 ? (layer?.color || '#94a3b8') : '#94a3b8' }}
                  >
                    {weight > 0.1 ? '●' : '○'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* TEST */}
      {onTest && (
        <section className="mb-5">
          <div className="text-relic-slate dark:text-relic-ghost text-[10px] uppercase tracking-[0.2em] mb-2">▸ TEST</div>
          <div className="ml-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRunTest()}
                placeholder="Enter test query..."
                className="flex-1 px-2 py-1.5 text-[9px] bg-relic-ghost dark:bg-relic-slate/10 border border-relic-mist dark:border-relic-slate/30 rounded outline-none focus:border-purple-400 font-mono"
              />
              <button
                onClick={handleRunTest}
                disabled={isTestRunning || !testQuery.trim()}
                className={`px-3 py-1.5 text-[9px] rounded transition-colors ${
                  isTestRunning || !testQuery.trim()
                    ? 'bg-relic-mist text-relic-silver cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {isTestRunning ? '...' : 'run'}
              </button>
            </div>
            {testResult && (
              <div className="mt-2 p-2 bg-relic-ghost dark:bg-relic-slate/10 rounded text-[9px] text-relic-slate dark:text-relic-ghost max-h-24 overflow-y-auto">
                {testResult}
              </div>
            )}
          </div>
        </section>
      )}

      {/* PRESETS (Expandable) */}
      <section>
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="text-relic-slate dark:text-relic-ghost text-[10px] uppercase tracking-[0.2em] flex items-center gap-1 hover:text-relic-void dark:hover:text-white transition-colors"
        >
          {showPresets ? '▾' : '▸'} PRESETS
        </button>

        {showPresets && (
          <div className="ml-4 mt-3 space-y-2">
            {PRESET_NAMES.map((name) => {
              const config = MODEL_CONFIGS[name as ModelConfigName]
              return (
                <div
                  key={name}
                  onClick={() => handlePresetClick(name)}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                    activePreset === name
                      ? 'bg-purple-50 dark:bg-purple-900/20'
                      : 'hover:bg-relic-ghost dark:hover:bg-relic-slate/10'
                  }`}
                >
                  <span className={`text-[10px] ${activePreset === name ? 'text-purple-600' : 'text-relic-silver'}`}>
                    {config?.icon || '○'}
                  </span>
                  <div>
                    <span className={`text-[10px] ${activePreset === name ? 'text-purple-700 dark:text-purple-300' : 'text-relic-slate'}`}>
                      {name}
                    </span>
                    <p className="text-[8px] text-relic-silver">
                      {config?.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-relic-mist dark:border-relic-slate/30">
        <div className="text-relic-mist dark:text-relic-slate text-[10px] mb-1">─────────────────────────────────────────</div>
        <div className="flex items-center justify-between text-[8px] text-relic-silver">
          <span>{Object.values(weights).filter(w => w > 0.1).length}/11 active · {processingMode}</span>
          <span>{activePreset || 'custom'}</span>
        </div>
      </div>
    </div>
  )
}
