'use client'

/**
 * Tree Configuration Panel
 *
 * Interactive configuration UI for adjusting Layers and Antipatterns weights
 * Allows users to customize AI response style through tree manipulation
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LAYER_METADATA, Layer } from '@/lib/layer-registry'
import { ANTIPATTERN_METADATA } from '@/lib/antipattern-guard'
import { TreeConfiguration, QUICK_ADJUSTMENTS } from '@/lib/tree-configuration'

interface TreeConfigurationPanelProps {
  isOpen: boolean
  onClose: () => void
  onConfigChange?: (config: TreeConfiguration) => void
}

export default function TreeConfigurationPanel({
  isOpen,
  onClose,
  onConfigChange,
}: TreeConfigurationPanelProps) {
  const [configurations, setConfigurations] = useState<TreeConfiguration[]>([])
  const [activeConfig, setActiveConfig] = useState<TreeConfiguration | null>(null)
  const [editingConfig, setEditingConfig] = useState<TreeConfiguration | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Fetch configurations
  useEffect(() => {
    if (isOpen) {
      fetchConfigurations()
    }
  }, [isOpen])

  const fetchConfigurations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tree-config')
      const data = await response.json()
      setConfigurations(data.configurations || [])
      setActiveConfig(data.active || null)
      setEditingConfig(data.active || null)
    } catch (error) {
      console.error('Failed to fetch configurations:', error)
    } finally {
      setLoading(false)
    }
  }

  // Update Layer weight
  const updateLayerWeight = (layerNode: number, value: number) => {
    if (!editingConfig) return

    setEditingConfig({
      ...editingConfig,
      layer_weights: {
        ...editingConfig.layer_weights,
        [layerNode]: value / 100,
      },
    })
  }

  // Update Qliphah suppression
  const updateQliphahSuppression = (antipatternId: number, value: number) => {
    if (!editingConfig) return

    setEditingConfig({
      ...editingConfig,
      antipattern_suppression: {
        ...editingConfig.antipattern_suppression,
        [antipatternId]: value / 100,
      },
    })
  }

  // Load a configuration
  const loadConfiguration = async (configId: number) => {
    const config = configurations.find((c) => c.id === configId)
    if (config) {
      setEditingConfig(config)
    }
  }

  // Activate a configuration
  const activateConfiguration = async (configId: number) => {
    try {
      setSaving(true)
      const response = await fetch('/api/tree-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configId, action: 'activate' }),
      })

      if (response.ok) {
        await fetchConfigurations()
        if (onConfigChange && editingConfig) {
          onConfigChange(editingConfig)
        }
      }
    } catch (error) {
      console.error('Failed to activate configuration:', error)
    } finally {
      setSaving(false)
    }
  }

  // Save current editing config as new
  const saveAsNewConfiguration = async () => {
    if (!editingConfig) return

    const name = prompt('Enter configuration name:')
    if (!name) return

    const description = prompt('Enter description (optional):') || ''

    try {
      setSaving(true)
      const response = await fetch('/api/tree-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          layerWeights: editingConfig.layer_weights,
          antipatternSuppression: editingConfig.antipattern_suppression,
          pillarBalance: editingConfig.pillar_balance,
        }),
      })

      if (response.ok) {
        await fetchConfigurations()
      }
    } catch (error) {
      console.error('Failed to save configuration:', error)
    } finally {
      setSaving(false)
    }
  }

  // Apply quick adjustment
  const applyQuickAdjustment = (adjustmentKey: keyof typeof QUICK_ADJUSTMENTS) => {
    if (!editingConfig) return

    const adjustment = QUICK_ADJUSTMENTS[adjustmentKey]
    const newConfig = { ...editingConfig }

    // Use optional chaining and type checking
    const changes = adjustment.changes as {
      layerWeights?: Record<number, number>
      antipatternSuppression?: Record<number, number>
    }

    if (changes.layerWeights) {
      newConfig.layer_weights = {
        ...newConfig.layer_weights,
        ...changes.layerWeights,
      }
    }

    if (changes.antipatternSuppression) {
      newConfig.antipattern_suppression = {
        ...newConfig.antipattern_suppression,
        ...changes.antipatternSuppression,
      }
    }

    setEditingConfig(newConfig)
  }

  // Reset to default
  const resetToDefault = () => {
    const defaultConfig = configurations.find((c) => c.name === 'Balanced')
    if (defaultConfig) {
      setEditingConfig(defaultConfig)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: -320 }}
        animate={{ x: 0 }}
        exit={{ x: -320 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 bottom-0 w-80 bg-white border-r border-relic-mist z-50 overflow-y-auto shadow-xl"
      >
        {/* Header */}
        <div className="p-3 border-b border-relic-mist sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-mono font-semibold text-relic-void">Tree Configuration</h3>
            <button
              onClick={onClose}
              className="text-xs text-relic-silver hover:text-relic-void transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Persona Selector */}
          <select
            value={editingConfig?.id || ''}
            onChange={(e) => loadConfiguration(parseInt(e.target.value))}
            className="w-full text-xs font-mono border border-relic-mist p-1.5 bg-white focus:outline-none focus:border-relic-slate"
            disabled={loading}
          >
            <option value="">Select Persona...</option>
            {configurations.map((config) => (
              <option key={config.id} value={config.id}>
                {config.name}
                {config.id === activeConfig?.id && ' (Active)'}
              </option>
            ))}
          </select>

          {editingConfig && (
            <div className="text-[9px] text-relic-slate mt-1">{editingConfig.description}</div>
          )}
        </div>

        {loading ? (
          <div className="p-4 text-center text-xs text-relic-silver">Loading configurations...</div>
        ) : !editingConfig ? (
          <div className="p-4 text-center text-xs text-relic-silver">
            Select a configuration to begin
          </div>
        ) : (
          <>
            {/* Layers Weights */}
            <div className="p-3 border-b border-relic-mist">
              <div className="text-xs font-mono uppercase tracking-wider text-relic-slate mb-2">
                ▸ Layers Weights
              </div>
              <div className="space-y-2">
                {Object.entries(LAYER_METADATA).map(([key, meta]) => {
                  const layerNode = parseInt(key) as Layer
                  const weight = editingConfig.layer_weights[layerNode] || 0.5

                  return (
                    <div key={layerNode} className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-relic-void">{meta.name}</span>
                        <span className="text-relic-silver font-mono">
                          {(weight * 100).toFixed(0)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={weight * 100}
                        onChange={(e) => updateLayerWeight(layerNode, parseInt(e.target.value))}
                        className="w-full h-1 appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${weight * 100}%, #E8E8E8 ${weight * 100}%, #E8E8E8 100%)`,
                        }}
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Antipatterns Suppression */}
            <div className="p-3 border-b border-relic-mist">
              <div className="text-xs font-mono uppercase tracking-wider text-relic-slate mb-2">
                ▸ Antipatterns Suppression
              </div>
              <div className="space-y-2">
                {Object.entries(ANTIPATTERN_METADATA).map(([key, meta]) => {
                  const antipatternId = parseInt(key)
                  const suppression = editingConfig.antipattern_suppression[antipatternId] || 0.5

                  return (
                    <div key={antipatternId} className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-relic-void">{meta.name}</span>
                        <span className="text-relic-silver font-mono">
                          {(suppression * 100).toFixed(0)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={suppression * 100}
                        onChange={(e) =>
                          updateQliphahSuppression(antipatternId, parseInt(e.target.value))
                        }
                        className="w-full h-1 appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${suppression * 100}%, #E8E8E8 ${suppression * 100}%, #E8E8E8 100%)`,
                        }}
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Quick Adjustments */}
            <div className="p-3 border-b border-relic-mist">
              <div className="text-xs font-mono uppercase tracking-wider text-relic-slate mb-2">
                ▸ Quick Adjustments
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {Object.entries(QUICK_ADJUSTMENTS).map(([key, adj]) => (
                  <button
                    key={key}
                    onClick={() => applyQuickAdjustment(key as keyof typeof QUICK_ADJUSTMENTS)}
                    className="text-[9px] font-mono px-2 py-1.5 border border-relic-mist hover:bg-relic-ghost transition-colors text-left"
                    title={adj.description}
                  >
                    {adj.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Response Style Preview */}
            <div className="p-3 bg-relic-ghost border-b border-relic-mist">
              <div className="text-[9px] font-mono text-relic-slate mb-1 uppercase tracking-wider">
                ▸ Configuration Impact:
              </div>
              <div className="text-[10px] font-mono text-relic-void leading-relaxed">
                {getResponseStylePreview(editingConfig)}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-3 space-y-2 sticky bottom-0 bg-white border-t border-relic-mist">
              <button
                onClick={() => activateConfiguration(editingConfig.id)}
                disabled={saving || editingConfig.id === activeConfig?.id}
                className="w-full px-3 py-2 text-xs font-mono bg-relic-void text-white hover:bg-relic-slate transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving
                  ? 'Activating...'
                  : editingConfig.id === activeConfig?.id
                    ? 'Active Configuration'
                    : 'Activate Configuration'}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={saveAsNewConfiguration}
                  disabled={saving}
                  className="flex-1 px-3 py-1.5 text-xs font-mono border border-relic-mist hover:bg-relic-ghost transition-colors disabled:opacity-50"
                >
                  Save As New
                </button>
                <button
                  onClick={resetToDefault}
                  className="flex-1 px-3 py-1.5 text-xs font-mono border border-relic-mist hover:bg-relic-ghost transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * Generate response style preview based on configuration
 */
function getResponseStylePreview(config: TreeConfiguration): string {
  // Find top 3 Layers by weight
  const topLayers = Object.entries(config.layer_weights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([layerNode, weight]) => ({
      layerNode: parseInt(layerNode) as Layer,
      weight,
    }))

  const emphases = topLayers.map((s) => {
    const meta = LAYER_METADATA[s.layerNode]
    return `${meta.name} (${(s.weight * 100).toFixed(0)}%)`
  })

  // Find top suppressed Antipatterns
  const topSuppressed = Object.entries(config.antipattern_suppression)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([antipatternId, level]) => ({
      antipatternId: parseInt(antipatternId),
      level,
    }))

  const suppressions = topSuppressed
    .filter((q) => q.level > 0.6)
    .map((q) => {
      const meta = ANTIPATTERN_METADATA[q.antipatternId as keyof typeof ANTIPATTERN_METADATA]
      return meta ? `${meta.name} (${(q.level * 100).toFixed(0)}%)` : ''
    })
    .filter(Boolean)

  let preview = `Responses will emphasize: ${emphases.join(', ')}.`

  if (suppressions.length > 0) {
    preview += ` Actively suppressing: ${suppressions.join(', ')}.`
  }

  return preview
}
