'use client'

/**
 * Model Configuration Panel
 *
 * Lists available model configurations, allows creating new ones, and import/export.
 */

import { useState } from 'react'
import { useLayerStore } from '@/lib/stores/layer-store'
import { PRESET_NAMES, getPresetWeights, type PresetName } from '@/lib/layer-presets'

interface SavedConfig {
  id: string
  name: string
  weights: Record<number, number>
  createdAt: number
}

interface PresetPanelProps {
  onPresetSelect?: (name: string) => void
}

export function PresetPanel({ onPresetSelect }: PresetPanelProps) {
  const { weights, activePreset, applyPreset } = useLayerStore()
  const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>([])
  const [newConfigName, setNewConfigName] = useState('')
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importData, setImportData] = useState('')

  const handlePresetClick = (name: PresetName) => {
    const presetWeights = getPresetWeights(name)
    applyPreset(presetWeights, name)
    onPresetSelect?.(name)
  }

  const handleSaveConfig = () => {
    if (!newConfigName.trim()) return

    const config: SavedConfig = {
      id: Date.now().toString(),
      name: newConfigName.trim(),
      weights: { ...weights },
      createdAt: Date.now()
    }

    setSavedConfigs(prev => [...prev, config])
    setNewConfigName('')
    setShowSaveForm(false)

    // Also save to localStorage
    const existing = localStorage.getItem('akhai-tree-configs')
    const configs = existing ? JSON.parse(existing) : []
    configs.push(config)
    localStorage.setItem('akhai-tree-configs', JSON.stringify(configs))
  }

  const handleLoadConfig = (config: SavedConfig) => {
    applyPreset(config.weights, config.name)
    onPresetSelect?.(config.name)
  }

  const handleDeleteConfig = (id: string) => {
    setSavedConfigs(prev => prev.filter(c => c.id !== id))

    const existing = localStorage.getItem('akhai-tree-configs')
    if (existing) {
      const configs = JSON.parse(existing).filter((c: SavedConfig) => c.id !== id)
      localStorage.setItem('akhai-tree-configs', JSON.stringify(configs))
    }
  }

  const handleExport = () => {
    const exportData = {
      weights,
      name: activePreset || 'Custom',
      exportedAt: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `model-config-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    try {
      const data = JSON.parse(importData)
      if (data.weights) {
        applyPreset(data.weights, data.name || 'Imported')
        setShowImport(false)
        setImportData('')
      }
    } catch {
      alert('Invalid configuration data')
    }
  }

  // Load saved configs on mount
  useState(() => {
    const existing = localStorage.getItem('akhai-tree-configs')
    if (existing) {
      setSavedConfigs(JSON.parse(existing))
    }
  })

  return (
    <div className="h-full flex flex-col bg-white dark:bg-relic-void/95 border-r border-relic-mist dark:border-relic-slate/20">
      {/* Header */}
      <div className="p-4 border-b border-relic-mist dark:border-relic-slate/20">
        <h3 className="text-[10px] uppercase tracking-[0.2em] text-relic-slate font-mono">
          Model Configs
        </h3>
      </div>

      {/* Built-in Presets */}
      <div className="p-4 border-b border-relic-mist dark:border-relic-slate/20">
        <div className="text-[9px] uppercase tracking-wider text-relic-silver mb-3">
          Built-in
        </div>
        <div className="space-y-1">
          {PRESET_NAMES.map(name => (
            <button
              key={name}
              onClick={() => handlePresetClick(name)}
              className={`w-full text-left px-3 py-2 text-[11px] font-mono transition-colors rounded
                ${activePreset === name
                  ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                  : 'text-relic-slate hover:bg-relic-ghost dark:hover:bg-relic-slate/10'
                }`}
            >
              <span className="mr-2">{activePreset === name ? '◉' : '○'}</span>
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Saved Configurations */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[9px] uppercase tracking-wider text-relic-silver">
            Saved
          </div>
          <button
            onClick={() => setShowSaveForm(true)}
            className="text-[9px] text-purple-600 hover:text-purple-800 font-mono"
          >
            + New
          </button>
        </div>

        {showSaveForm && (
          <div className="mb-3 p-2 bg-relic-ghost dark:bg-relic-slate/10 rounded">
            <input
              type="text"
              value={newConfigName}
              onChange={e => setNewConfigName(e.target.value)}
              placeholder="Config name..."
              className="w-full px-2 py-1 text-[11px] font-mono bg-white dark:bg-relic-void border border-relic-mist dark:border-relic-slate/30 rounded outline-none focus:border-purple-400"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSaveConfig}
                className="flex-1 px-2 py-1 text-[9px] bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Save
              </button>
              <button
                onClick={() => setShowSaveForm(false)}
                className="px-2 py-1 text-[9px] text-relic-slate hover:text-relic-void"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {savedConfigs.length === 0 ? (
          <div className="text-[10px] text-relic-silver italic">
            No saved configurations
          </div>
        ) : (
          <div className="space-y-1">
            {savedConfigs.map(config => (
              <div
                key={config.id}
                className="group flex items-center justify-between px-3 py-2 text-[11px] font-mono text-relic-slate hover:bg-relic-ghost dark:hover:bg-relic-slate/10 rounded cursor-pointer"
                onClick={() => handleLoadConfig(config)}
              >
                <span className="truncate">{config.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteConfig(config.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-[9px]"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Import/Export */}
      <div className="p-4 border-t border-relic-mist dark:border-relic-slate/20">
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex-1 px-2 py-1.5 text-[9px] font-mono text-relic-slate border border-relic-mist dark:border-relic-slate/30 rounded hover:bg-relic-ghost dark:hover:bg-relic-slate/10"
          >
            Export
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex-1 px-2 py-1.5 text-[9px] font-mono text-relic-slate border border-relic-mist dark:border-relic-slate/30 rounded hover:bg-relic-ghost dark:hover:bg-relic-slate/10"
          >
            Import
          </button>
        </div>

        {showImport && (
          <div className="mt-3">
            <textarea
              value={importData}
              onChange={e => setImportData(e.target.value)}
              placeholder="Paste JSON config..."
              className="w-full h-20 px-2 py-1 text-[10px] font-mono bg-white dark:bg-relic-void border border-relic-mist dark:border-relic-slate/30 rounded outline-none focus:border-purple-400 resize-none"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleImport}
                className="flex-1 px-2 py-1 text-[9px] bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Import
              </button>
              <button
                onClick={() => {
                  setShowImport(false)
                  setImportData('')
                }}
                className="px-2 py-1 text-[9px] text-relic-slate hover:text-relic-void"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
