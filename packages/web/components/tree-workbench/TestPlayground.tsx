'use client'

/**
 * Test Playground
 *
 * Query input, run test, show response preview and processing report.
 */

import { useState } from 'react'
import { useLayerStore } from '@/lib/stores/layer-store'
import { formatGnosticAnnotation, formatCompactAnnotation, type AntipatternReport } from '@/lib/antipattern'

interface TestResult {
  response: string
  methodology: string
  dominantLayer: string
  activations: Record<number, number>
  blendedActivations?: Record<number, number>
  processingTime: number
  tokensUsed: number
  cost: number
  antipatternReport?: AntipatternReport
}

interface TestPlaygroundProps {
  onTestComplete?: (result: TestResult) => void
}

export function TestPlayground({ onTestComplete }: TestPlaygroundProps) {
  const { weights, processingMode, showProcessingAnnotation } = useLayerStore()
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showFullResponse, setShowFullResponse] = useState(false)
  const [showAnnotation, setShowAnnotation] = useState(false)

  const runTest = async () => {
    if (!query.trim()) return

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/tree-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          weights,
          processingMode
        })
      })

      if (!res.ok) {
        throw new Error(`Test failed: ${res.statusText}`)
      }

      const data = await res.json()

      const testResult: TestResult = {
        response: data.response || '',
        methodology: data.methodology || 'direct',
        dominantLayer: data.gnostic?.layersProcessing?.dominant || 'Unknown',
        activations: data.gnostic?.layersProcessing?.activations || {},
        blendedActivations: data.gnostic?.layersProcessing?.blendedActivations,
        processingTime: data.metrics?.latency || 0,
        tokensUsed: data.metrics?.tokens || 0,
        cost: data.metrics?.cost || 0,
        antipatternReport: data.antipatternReport
      }

      setResult(testResult)
      onTestComplete?.(testResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test failed')
    } finally {
      setIsLoading(false)
    }
  }

  const truncateResponse = (text: string, maxLength: number = 500) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-relic-void/95 border-l border-relic-mist dark:border-relic-slate/20">
      {/* Header */}
      <div className="p-4 border-b border-relic-mist dark:border-relic-slate/20">
        <h3 className="text-[10px] uppercase tracking-[0.2em] text-relic-slate font-mono">
          Test Playground
        </h3>
      </div>

      {/* Query Input */}
      <div className="p-4 border-b border-relic-mist dark:border-relic-slate/20">
        <textarea
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Enter a test query..."
          className="w-full h-24 px-3 py-2 text-[12px] font-mono bg-relic-ghost dark:bg-relic-slate/10 border border-relic-mist dark:border-relic-slate/30 rounded outline-none focus:border-purple-400 resize-none"
        />
        <button
          onClick={runTest}
          disabled={isLoading || !query.trim()}
          className={`mt-2 w-full px-4 py-2 text-[11px] font-mono rounded transition-colors
            ${isLoading || !query.trim()
              ? 'bg-relic-mist text-relic-silver cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
        >
          {isLoading ? 'Running...' : 'Run Test'}
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded text-[11px] text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 bg-relic-ghost dark:bg-relic-slate/10 rounded text-center">
                <div className="text-[9px] uppercase text-relic-silver">Primary Layer</div>
                <div className="text-[11px] font-mono text-purple-600 dark:text-purple-400">
                  {result.dominantLayer}
                </div>
              </div>
              <div className="p-2 bg-relic-ghost dark:bg-relic-slate/10 rounded text-center">
                <div className="text-[9px] uppercase text-relic-silver">Method</div>
                <div className="text-[11px] font-mono text-relic-void dark:text-white">
                  {result.methodology}
                </div>
              </div>
              <div className="p-2 bg-relic-ghost dark:bg-relic-slate/10 rounded text-center">
                <div className="text-[9px] uppercase text-relic-silver">Time</div>
                <div className="text-[11px] font-mono text-relic-void dark:text-white">
                  {(result.processingTime / 1000).toFixed(1)}s
                </div>
              </div>
            </div>

            {/* Cost/Tokens */}
            <div className="flex items-center justify-between text-[9px] font-mono text-relic-silver px-1">
              <span>{result.tokensUsed.toLocaleString()} tokens</span>
              <span>${result.cost.toFixed(4)}</span>
            </div>

            {/* Response Preview */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] uppercase tracking-wider text-relic-silver">
                  Response
                </span>
                <button
                  onClick={() => setShowFullResponse(!showFullResponse)}
                  className="text-[9px] text-purple-600 hover:text-purple-800 font-mono"
                >
                  {showFullResponse ? 'Collapse' : 'Expand'}
                </button>
              </div>
              <div className="p-3 bg-relic-ghost dark:bg-relic-slate/10 rounded text-[11px] font-mono text-relic-void dark:text-white whitespace-pre-wrap">
                {showFullResponse ? result.response : truncateResponse(result.response)}
              </div>
            </div>

            {/* Layer Activity */}
            <div>
              <span className="text-[9px] uppercase tracking-wider text-relic-silver block mb-2">
                Layer Activity
              </span>
              <div className="grid grid-cols-4 gap-1">
                {Object.entries(result.activations).map(([layer, activation]) => (
                  <div
                    key={layer}
                    className="p-1 bg-relic-ghost dark:bg-relic-slate/10 rounded text-center"
                  >
                    <div className="text-[8px] text-relic-silver">{layer}</div>
                    <div className="text-[10px] font-mono text-relic-void dark:text-white">
                      {Math.round((activation as number) * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Processing Report */}
            {showProcessingAnnotation && result.antipatternReport && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] uppercase tracking-wider text-relic-silver">
                    Processing Report
                  </span>
                  <button
                    onClick={() => setShowAnnotation(!showAnnotation)}
                    className="text-[9px] text-purple-600 hover:text-purple-800 font-mono"
                  >
                    {showAnnotation ? 'Hide' : 'Show'}
                  </button>
                </div>

                {/* Compact View */}
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded text-[10px] font-mono text-purple-700 dark:text-purple-300">
                  {formatCompactAnnotation(result.antipatternReport)}
                </div>

                {/* Full Annotation */}
                {showAnnotation && (
                  <div className="mt-2 p-3 bg-relic-ghost dark:bg-relic-slate/10 rounded text-[10px] font-mono whitespace-pre-wrap text-relic-void dark:text-white">
                    {formatGnosticAnnotation(result.antipatternReport)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!result && !error && !isLoading && (
          <div className="text-center text-[11px] text-relic-silver italic py-8">
            Enter a query and click &quot;Run Test&quot; to see results
          </div>
        )}
      </div>
    </div>
  )
}
