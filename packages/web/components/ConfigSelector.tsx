'use client'

import { useState, useEffect } from 'react'

interface TreeConfiguration {
  id?: number
  name: string
  description?: string
  layer_weights: Record<number, number>
  antipattern_suppression?: Record<number, number>
  processing_mode: 'weighted' | 'parallel' | 'adaptive'
}

interface ConfigSelectorProps {
  value: TreeConfiguration | null
  onChange: (config: TreeConfiguration) => void
  label: string
}

export default function ConfigSelector({ value, onChange, label }: ConfigSelectorProps) {
  const [configs, setConfigs] = useState<TreeConfiguration[]>([])
  const [customMode, setCustomMode] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load saved configurations from API
    async function loadConfigs() {
      try {
        const response = await fetch('/api/tree-config')
        if (response.ok) {
          const data = await response.json()
          setConfigs(data)
        }
      } catch (error) {
        console.error('Failed to load configurations:', error)
      } finally {
        setLoading(false)
      }
    }

    loadConfigs()
  }, [])

  return (
    <div className="border border-relic-mist rounded p-4 bg-relic-white">
      <label className="text-sm font-medium mb-2 block text-relic-void">
        {label}
      </label>

      {/* Preset selector */}
      <select
        onChange={(e) => {
          if (e.target.value === 'custom') {
            setCustomMode(true)
          } else if (e.target.value) {
            const config = configs.find(c => c.id === parseInt(e.target.value))
            if (config) {
              onChange(config)
              setCustomMode(false)
            }
          }
        }}
        className="w-full p-2 border border-relic-mist rounded text-sm text-relic-void bg-white focus:outline-none focus:border-relic-slate"
        disabled={loading}
      >
        <option value="">
          {loading ? 'Loading configurations...' : 'Select a configuration'}
        </option>
        {configs.map(c => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
        <option value="custom">Custom configuration...</option>
      </select>

      {/* Custom config editor (simplified for now) */}
      {customMode && (
        <div className="mt-4 p-3 bg-relic-ghost rounded">
          <p className="text-xs text-relic-slate mb-2">
            Custom configuration coming soon. For now, use the LayerConsole to create and save a configuration,
            then select it here.
          </p>
          <button
            onClick={() => setCustomMode(false)}
            className="text-xs text-relic-silver hover:text-relic-slate transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Show current config summary */}
      {value && !customMode && (
        <div className="mt-3 p-3 bg-relic-ghost rounded">
          <div className="space-y-1">
            {value.description && (
              <p className="text-xs text-relic-void">{value.description}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-relic-slate">
              <span>
                Mode: <span className="font-medium uppercase">{value.processing_mode}</span>
              </span>
              <span>
                Active Layers: {
                  Object.entries(value.layer_weights)
                    .filter(([_, w]) => w > 0.1)
                    .length
                }/11
              </span>
            </div>
            <div className="mt-2">
              <p className="text-[10px] text-relic-silver uppercase tracking-wider mb-1">
                Top 3 Layers:
              </p>
              <div className="flex gap-2">
                {Object.entries(value.layer_weights)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .slice(0, 3)
                  .map(([id, weight]) => (
                    <span
                      key={id}
                      className="text-[10px] px-2 py-0.5 bg-relic-white rounded text-relic-slate"
                    >
                      #{id}: {Math.round((weight as number) * 100)}%
                    </span>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
