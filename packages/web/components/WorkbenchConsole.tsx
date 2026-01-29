'use client'

/**
 * WORKBENCH CONSOLE
 * 
 * Console-style AI model configuration interface
 * Inspired by VS Code settings, Raycast, Linear
 * 
 * Design principles:
 * - Single column, max-w-2xl
 * - Monospace typography throughout
 * - Minimal chrome, background-based separation
 * - Collapsible sections with native <details>
 * - Inline number inputs with visual progress bars
 */

import { useState, useMemo } from 'react'
import { useSefirotStore } from '@/lib/stores/sefirot-store'
import { Sefirah } from '@/lib/ascent-tracker'

// ═══════════════════════════════════════════════════════════════
// AI COMPUTATIONAL LABELS
// ═══════════════════════════════════════════════════════════════

const AI_LAYERS: { id: Sefirah; name: string; concept: string }[] = [
  { id: Sefirah.KETHER, name: 'meta-cognition', concept: 'consciousness itself' },
  { id: Sefirah.CHOKMAH, name: 'first-principles', concept: 'fundamental wisdom' },
  { id: Sefirah.BINAH, name: 'pattern-recognition', concept: 'deep structure' },
  { id: Sefirah.DAAT, name: 'emergent-insight', concept: 'hidden knowledge' },
  { id: Sefirah.CHESED, name: 'expansion', concept: 'growth potential' },
  { id: Sefirah.GEVURAH, name: 'critical-analysis', concept: 'limitations' },
  { id: Sefirah.TIFERET, name: 'synthesis', concept: 'integration' },
  { id: Sefirah.NETZACH, name: 'persistence', concept: 'creative drive' },
  { id: Sefirah.HOD, name: 'communication', concept: 'logical clarity' },
  { id: Sefirah.YESOD, name: 'foundation', concept: 'procedural base' },
  { id: Sefirah.MALKUTH, name: 'manifestation', concept: 'factual output' },
]

const ANTI_PATTERNS: { id: string; name: string; severity: 'critical' | 'high' | 'medium' | 'low' }[] = [
  { id: 'hallucinated-facts', name: 'hallucinated-facts', severity: 'critical' },
  { id: 'dual-contradictions', name: 'dual-contradictions', severity: 'critical' },
  { id: 'hiding-sources', name: 'hiding-sources', severity: 'high' },
  { id: 'false-certainty', name: 'false-certainty', severity: 'high' },
  { id: 'blocking-truth', name: 'blocking-truth', severity: 'high' },
  { id: 'over-confidence', name: 'over-confidence', severity: 'high' },
  { id: 'superficial-output', name: 'superficial-output', severity: 'high' },
  { id: 'drift-away', name: 'drift-away', severity: 'medium' },
  { id: 'repetitive-echo', name: 'repetitive-echo', severity: 'medium' },
  { id: 'arrogant-tone', name: 'arrogant-tone', severity: 'medium' },
  { id: 'info-overload', name: 'info-overload', severity: 'medium' },
  { id: 'verbose-padding', name: 'verbose-padding', severity: 'medium' },
]

const PRESETS = [
  { id: 'analytical', label: 'analytical' },
  { id: 'creative', label: 'creative' },
  { id: 'balanced', label: 'balanced' },
  { id: 'deep', label: 'deep' },
]

// ═══════════════════════════════════════════════════════════════
// MINI COMPONENTS
// ═══════════════════════════════════════════════════════════════

function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const percentage = (value / max) * 100
  return (
    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
      <div 
        className="h-full bg-zinc-500 transition-all duration-200"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

function SeverityBadge({ severity }: { severity: 'critical' | 'high' | 'medium' | 'low' }) {
  const colors = {
    critical: 'text-red-400',
    high: 'text-orange-400',
    medium: 'text-amber-400',
    low: 'text-zinc-500',
  }
  return (
    <span className={`text-[9px] uppercase tracking-wider ${colors[severity]}`}>
      {severity}
    </span>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function WorkbenchConsole() {
  const { weights, setWeight, applyPreset, qliphothSuppression, setQliphothSuppression } = useSefirotStore()
  const [activePreset, setActivePreset] = useState<string>('deep')
  const [testQuery, setTestQuery] = useState('')
  const [isRunning, setIsRunning] = useState(false)

  // Calculate active counts
  const activeLayerCount = AI_LAYERS.filter(l => (weights[l.id] ?? 0.5) > 0.3).length
  const activeFilterCount = ANTI_PATTERNS.filter(p => (qliphothSuppression[p.id] ?? 0.5) > 0.3).length

  // Handle preset change
  const handlePresetChange = (presetId: string) => {
    setActivePreset(presetId)
    applyPreset(presetId as 'analytical' | 'creative' | 'balanced' | 'deep')
  }

  // Handle layer weight change
  const handleLayerChange = (id: Sefirah, value: number) => {
    setWeight(id, value / 100)
  }

  // Handle filter change
  const handleFilterChange = (id: string, value: number) => {
    setQliphothSuppression(id, value / 100)
  }

  // Export config as JSON
  const exportConfig = () => {
    const config = {
      preset: activePreset,
      layers: AI_LAYERS.reduce((acc, l) => {
        acc[l.name] = Math.round((weights[l.id] ?? 0.5) * 100)
        return acc
      }, {} as Record<string, number>),
      filters: ANTI_PATTERNS.reduce((acc, p) => {
        acc[p.name] = Math.round((qliphothSuppression[p.id] ?? 0.5) * 100)
        return acc
      }, {} as Record<string, number>),
    }
    navigator.clipboard.writeText(JSON.stringify(config, null, 2))
  }

  // Run test query
  const handleRunTest = async () => {
    if (!testQuery.trim()) return
    setIsRunning(true)
    // TODO: Implement actual test
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRunning(false)
  }

  // Generate JSON preview
  const configJson = useMemo(() => {
    return JSON.stringify({
      preset: activePreset,
      layers: AI_LAYERS.reduce((acc, l) => {
        acc[l.name] = Math.round((weights[l.id] ?? 0.5) * 100)
        return acc
      }, {} as Record<string, number>),
    }, null, 2)
  }, [weights, activePreset])

  return (
    <div className="bg-zinc-950 text-zinc-100 font-mono text-sm min-h-screen">
      <div className="max-w-2xl mx-auto p-6">
        
        {/* ═══════════════════════════════════════════════════════════
            HEADER
        ═══════════════════════════════════════════════════════════ */}
        <header className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <div>
            <h1 className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-1">
              Model Configuration
            </h1>
            <p className="text-[10px] text-zinc-600">
              AI Processing Layers & Anti-Pattern Detection
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={exportConfig}
              className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1 rounded hover:bg-white/5"
            >
              Export ↗
            </button>
          </div>
        </header>

        {/* ═══════════════════════════════════════════════════════════
            PRESET SELECTOR
        ═══════════════════════════════════════════════════════════ */}
        <section className="mb-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-6">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 w-16">
              Preset
            </span>
            <div className="flex items-center gap-4">
              {PRESETS.map(preset => (
                <label 
                  key={preset.id}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <input
                    type="radio"
                    name="preset"
                    value={preset.id}
                    checked={activePreset === preset.id}
                    onChange={() => handlePresetChange(preset.id)}
                    className="sr-only"
                  />
                  <span className={`w-2 h-2 rounded-full border transition-colors ${
                    activePreset === preset.id 
                      ? 'bg-zinc-100 border-zinc-100' 
                      : 'border-zinc-600 group-hover:border-zinc-400'
                  }`} />
                  <span className={`text-xs transition-colors ${
                    activePreset === preset.id 
                      ? 'text-zinc-100' 
                      : 'text-zinc-500 group-hover:text-zinc-300'
                  }`}>
                    {preset.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            AI PROCESSING LAYERS
        ═══════════════════════════════════════════════════════════ */}
        <details open className="mb-4 group">
          <summary className="flex items-center justify-between cursor-pointer py-2 hover:bg-white/5 -mx-2 px-2 rounded transition-colors">
            <div className="flex items-center gap-2">
              <span className="text-zinc-600 text-[10px] group-open:rotate-90 transition-transform">▶</span>
              <span className="text-[10px] uppercase tracking-wider text-zinc-400">
                AI Processing Layers
              </span>
            </div>
            <span className="text-[9px] text-zinc-600">
              {activeLayerCount} active
            </span>
          </summary>
          
          <div className="mt-3 space-y-1">
            {AI_LAYERS.map(layer => {
              const value = Math.round((weights[layer.id] ?? 0.5) * 100)
              return (
                <div 
                  key={layer.id}
                  className="flex items-center gap-3 py-1.5 hover:bg-white/5 -mx-2 px-2 rounded transition-colors group/row"
                >
                  {/* Label */}
                  <span className="text-xs text-zinc-400 w-44 truncate group-hover/row:text-zinc-200 transition-colors">
                    {layer.name}
                  </span>
                  
                  {/* Dotted line filler */}
                  <span className="flex-1 border-b border-dotted border-zinc-800" />
                  
                  {/* Value input */}
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={value}
                    onChange={(e) => handleLayerChange(layer.id, parseInt(e.target.value) || 0)}
                    className="w-10 bg-transparent text-right text-xs text-zinc-300 
                               focus:outline-none focus:text-zinc-100
                               [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  
                  {/* Progress bar */}
                  <div className="w-24">
                    <ProgressBar value={value} />
                  </div>
                </div>
              )
            })}
          </div>
        </details>

        {/* ═══════════════════════════════════════════════════════════
            ANTI-PATTERN FILTERS
        ═══════════════════════════════════════════════════════════ */}
        <details className="mb-4 group">
          <summary className="flex items-center justify-between cursor-pointer py-2 hover:bg-white/5 -mx-2 px-2 rounded transition-colors">
            <div className="flex items-center gap-2">
              <span className="text-zinc-600 text-[10px] group-open:rotate-90 transition-transform">▶</span>
              <span className="text-[10px] uppercase tracking-wider text-zinc-400">
                Anti-Pattern Filters
              </span>
            </div>
            <span className="text-[9px] text-zinc-600">
              {activeFilterCount} active
            </span>
          </summary>
          
          <div className="mt-3 space-y-1">
            {ANTI_PATTERNS.map(pattern => {
              const value = Math.round((qliphothSuppression[pattern.id] ?? 0.5) * 100)
              return (
                <div 
                  key={pattern.id}
                  className="flex items-center gap-3 py-1.5 hover:bg-white/5 -mx-2 px-2 rounded transition-colors group/row"
                >
                  {/* Label */}
                  <span className="text-xs text-zinc-400 w-44 truncate group-hover/row:text-zinc-200 transition-colors">
                    {pattern.name}
                  </span>
                  
                  {/* Dotted line filler */}
                  <span className="flex-1 border-b border-dotted border-zinc-800" />
                  
                  {/* Severity badge */}
                  <SeverityBadge severity={pattern.severity} />
                  
                  {/* Value input */}
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={value}
                    onChange={(e) => handleFilterChange(pattern.id, parseInt(e.target.value) || 0)}
                    className="w-10 bg-transparent text-right text-xs text-zinc-300 
                               focus:outline-none focus:text-zinc-100
                               [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  
                  {/* Progress bar */}
                  <div className="w-20">
                    <ProgressBar value={value} />
                  </div>
                </div>
              )
            })}
          </div>
        </details>

        {/* ═══════════════════════════════════════════════════════════
            TEST QUERY
        ═══════════════════════════════════════════════════════════ */}
        <details className="mb-4 group">
          <summary className="flex items-center justify-between cursor-pointer py-2 hover:bg-white/5 -mx-2 px-2 rounded transition-colors">
            <div className="flex items-center gap-2">
              <span className="text-zinc-600 text-[10px] group-open:rotate-90 transition-transform">▶</span>
              <span className="text-[10px] uppercase tracking-wider text-zinc-400">
                Test Query
              </span>
            </div>
          </summary>
          
          <div className="mt-3">
            <textarea
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              placeholder="Enter a test query to see how the model responds..."
              className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded px-3 py-2 
                         text-xs text-zinc-300 placeholder:text-zinc-600
                         focus:outline-none focus:border-zinc-600 resize-none"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleRunTest}
                disabled={isRunning || !testQuery.trim()}
                className="text-[10px] uppercase tracking-wider px-4 py-1.5 
                           bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50
                           rounded transition-colors"
              >
                {isRunning ? 'Running...' : 'Run Test'}
              </button>
            </div>
          </div>
        </details>

        {/* ═══════════════════════════════════════════════════════════
            RAW CONFIG (JSON)
        ═══════════════════════════════════════════════════════════ */}
        <details className="mb-4 group">
          <summary className="flex items-center justify-between cursor-pointer py-2 hover:bg-white/5 -mx-2 px-2 rounded transition-colors">
            <div className="flex items-center gap-2">
              <span className="text-zinc-600 text-[10px] group-open:rotate-90 transition-transform">▶</span>
              <span className="text-[10px] uppercase tracking-wider text-zinc-400">
                Raw Config (JSON)
              </span>
            </div>
          </summary>
          
          <div className="mt-3">
            <pre className="bg-zinc-900 border border-zinc-800 rounded p-3 
                           text-[10px] text-zinc-400 overflow-x-auto">
              {configJson}
            </pre>
          </div>
        </details>

        {/* ═══════════════════════════════════════════════════════════
            FOOTER
        ═══════════════════════════════════════════════════════════ */}
        <footer className="mt-8 pt-4 border-t border-white/10 text-center">
          <p className="text-[9px] text-zinc-600">
            ⌘K to search • Changes auto-save
          </p>
        </footer>

      </div>
    </div>
  )
}
