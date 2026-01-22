'use client'

import { useState } from 'react'
import ConfigSelector from '@/components/ConfigSelector'
import DiffViewer from '@/components/DiffViewer'
import { TEST_BATTERY, type TestQuery } from '@/lib/test-queries'

interface TreeConfiguration {
  id?: number
  name: string
  description?: string
  sephiroth_weights: Record<number, number>
  qliphoth_suppression?: Record<number, number>
  processing_mode: 'weighted' | 'parallel' | 'adaptive'
}

export default function CompareConfigsPage() {
  const [query, setQuery] = useState('')
  const [configA, setConfigA] = useState<TreeConfiguration | null>(null)
  const [configB, setConfigB] = useState<TreeConfiguration | null>(null)
  const [responseA, setResponseA] = useState<string | null>(null)
  const [responseB, setResponseB] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedTest, setSelectedTest] = useState<TestQuery | null>(null)

  const runComparison = async () => {
    if (!query || !configA || !configB) {
      alert('Please enter a query and select both configurations')
      return
    }

    setLoading(true)
    setResponseA(null)
    setResponseB(null)

    try {
      // Send query with config A
      const resA = await fetch('/api/simple-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          treeConfigOverride: configA
        })
      })
      const dataA = await resA.json()
      setResponseA(dataA.response || dataA.error || 'No response')

      // Send query with config B
      const resB = await fetch('/api/simple-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          treeConfigOverride: configB
        })
      })
      const dataB = await resB.json()
      setResponseB(dataB.response || dataB.error || 'No response')
    } catch (error) {
      console.error('Comparison error:', error)
      alert('Error running comparison. Check console for details.')
    } finally {
      setLoading(false)
    }
  }

  const loadTestQuery = (index: number) => {
    const test = TEST_BATTERY[index]
    if (test) {
      setQuery(test.query)
      setConfigA(test.configA as any)
      setConfigB(test.configB as any)
      setSelectedTest(test)
      setResponseA(null)
      setResponseB(null)
    }
  }

  return (
    <div className="min-h-screen bg-relic-ghost p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-relic-void mb-2">
            Tree Configuration A/B Testing
          </h1>
          <p className="text-relic-slate">
            Compare how different Sephiroth configurations affect AI responses
          </p>
        </div>

        {/* Quick Test Selector */}
        <div className="mb-6 p-4 bg-relic-white border border-relic-mist rounded">
          <label className="text-sm font-medium mb-2 block text-relic-void">
            Quick Test:
          </label>
          <select
            onChange={(e) => {
              if (e.target.value) {
                loadTestQuery(parseInt(e.target.value))
              }
            }}
            className="w-full p-2 border border-relic-mist rounded text-sm text-relic-void"
          >
            <option value="">Select a predefined test...</option>
            {TEST_BATTERY.map((test, i) => (
              <option key={test.id} value={i}>
                Test {test.id}: {test.description}
              </option>
            ))}
          </select>
        </div>

        {/* Expected Differences (if test selected) */}
        {selectedTest && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
            <h4 className="font-medium mb-2 text-sm text-blue-900">
              Expected Differences:
            </h4>
            <ul className="text-sm space-y-1 text-blue-800">
              {selectedTest.expectedDifferences.map((diff, i) => (
                <li key={i}>• {diff}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Query Input */}
        <div className="mb-6 p-4 bg-relic-white border border-relic-mist rounded">
          <label className="text-sm font-medium mb-2 block text-relic-void">
            Test Query:
          </label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full p-3 border border-relic-mist rounded text-sm text-relic-void resize-none focus:outline-none focus:border-relic-slate"
            rows={3}
            placeholder="Enter your test query here..."
          />
        </div>

        {/* Config Selectors */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <ConfigSelector
            value={configA}
            onChange={setConfigA}
            label="Configuration A"
          />
          <ConfigSelector
            value={configB}
            onChange={setConfigB}
            label="Configuration B"
          />
        </div>

        {/* Run Button */}
        <div className="mb-8 text-center">
          <button
            onClick={runComparison}
            disabled={loading || !query || !configA || !configB}
            className={`px-8 py-3 rounded font-medium uppercase tracking-wider transition-colors ${
              loading || !query || !configA || !configB
                ? 'bg-relic-ghost text-relic-silver cursor-not-allowed'
                : 'bg-relic-void text-relic-white hover:bg-relic-slate'
            }`}
          >
            {loading ? 'Running Comparison...' : 'Run Comparison'}
          </button>
        </div>

        {/* Results */}
        {(responseA || responseB) && (
          <>
            <div className="grid grid-cols-2 gap-6 mb-8">
              {/* Response A */}
              <div className="p-4 bg-relic-white border border-relic-mist rounded">
                <h3 className="text-sm font-medium mb-3 text-relic-void flex items-center justify-between">
                  <span>Configuration A Response</span>
                  {configA && (
                    <span className="text-xs font-normal text-relic-silver">
                      {configA.name}
                    </span>
                  )}
                </h3>
                <div className="text-sm text-relic-void whitespace-pre-wrap leading-relaxed">
                  {responseA || 'Loading...'}
                </div>
              </div>

              {/* Response B */}
              <div className="p-4 bg-relic-white border border-relic-mist rounded">
                <h3 className="text-sm font-medium mb-3 text-relic-void flex items-center justify-between">
                  <span>Configuration B Response</span>
                  {configB && (
                    <span className="text-xs font-normal text-relic-silver">
                      {configB.name}
                    </span>
                  )}
                </h3>
                <div className="text-sm text-relic-void whitespace-pre-wrap leading-relaxed">
                  {responseB || 'Loading...'}
                </div>
              </div>
            </div>

            {/* Diff Visualization */}
            {responseA && responseB && (
              <DiffViewer textA={responseA} textB={responseB} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
