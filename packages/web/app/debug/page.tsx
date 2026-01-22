'use client'

import { useState, useEffect } from 'react'
import DarkModeToggle from '@/components/DarkModeToggle'

// Force dynamic rendering to avoid prerender errors
export const dynamic = 'force-dynamic'

interface LogEntry {
  timestamp: string
  level: string
  component: string
  message: string
  data?: any
}

interface DebugData {
  status: string
  timestamp: string
  total: number
  logs: LogEntry[]
  summary: {
    errors: number
    warnings: number
    guardTriggers: number
  }
  environment: {
    hasAnthropicKey: boolean
    hasDeepseekKey: boolean
    hasMistralKey: boolean
    hasXaiKey: boolean
    nodeEnv: string
  }
}

export default function DebugPage() {
  const [data, setData] = useState<DebugData | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [filter, setFilter] = useState<string>('ALL')

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/debug')
      const json = await res.json()
      setData(json)
    } catch (e) {
      console.error('Failed to fetch logs:', e)
    }
  }

  const clearLogs = async () => {
    await fetch('/api/debug', { method: 'DELETE' })
    fetchLogs()
  }

  useEffect(() => {
    fetchLogs()
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 2000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const levelColors: Record<string, string> = {
    DEBUG: 'text-cyan-600',
    INFO: 'text-gray-600',
    WARN: 'text-yellow-600',
    ERROR: 'text-red-600',
    SUCCESS: 'text-green-600',
  }

  const filteredLogs =
    data?.logs.filter(
      log => filter === 'ALL' || log.level === filter || log.component.includes(filter)
    ) || []

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6 font-mono text-sm">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">◊ AkhAI Debug Dashboard</h1>
            <p className="text-gray-400 text-sm">Real-time system monitoring</p>
          </div>
          <div className="flex gap-3 items-center">
            <DarkModeToggle />
            <a
              href="/"
              className="px-4 py-2 bg-gray-700 text-white text-sm hover:bg-gray-600 rounded"
            >
              ← Back to App
            </a>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded">
            <p className="text-gray-400 text-xs uppercase mb-1">Total Logs</p>
            <p className="text-2xl font-bold">{data?.total || 0}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded">
            <p className="text-gray-400 text-xs uppercase mb-1">Errors</p>
            <p className="text-2xl font-bold text-red-500">{data?.summary.errors || 0}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded">
            <p className="text-gray-400 text-xs uppercase mb-1">Warnings</p>
            <p className="text-2xl font-bold text-yellow-500">{data?.summary.warnings || 0}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded">
            <p className="text-gray-400 text-xs uppercase mb-1">Guard Triggers</p>
            <p className="text-2xl font-bold text-orange-500">
              {data?.summary.guardTriggers || 0}
            </p>
          </div>
        </div>

        {/* API Keys Status */}
        <div className="bg-gray-800 p-4 rounded mb-6">
          <p className="text-gray-400 text-xs uppercase mb-3">API Keys Status</p>
          <div className="flex gap-4 flex-wrap">
            <span
              className={data?.environment.hasAnthropicKey ? 'text-green-500' : 'text-red-500'}
            >
              {data?.environment.hasAnthropicKey ? '✅' : '❌'} Anthropic
            </span>
            <span className={data?.environment.hasDeepseekKey ? 'text-green-500' : 'text-red-500'}>
              {data?.environment.hasDeepseekKey ? '✅' : '❌'} DeepSeek
            </span>
            <span className={data?.environment.hasMistralKey ? 'text-green-500' : 'text-red-500'}>
              {data?.environment.hasMistralKey ? '✅' : '❌'} Mistral
            </span>
            <span className={data?.environment.hasXaiKey ? 'text-green-500' : 'text-red-500'}>
              {data?.environment.hasXaiKey ? '✅' : '❌'} xAI
            </span>
            <span className="text-gray-400">| Env: {data?.environment.nodeEnv}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 px-3 py-2 text-sm rounded"
            >
              <option value="ALL">All Logs</option>
              <option value="ERROR">Errors Only</option>
              <option value="WARN">Warnings Only</option>
              <option value="GUARD">Grounding Guard</option>
              <option value="QUERY">Query Flow</option>
              <option value="API">API Calls</option>
              <option value="METHOD">Methodology</option>
              <option value="REALTIME">Real-time Data</option>
            </select>
            <button
              onClick={fetchLogs}
              className="px-4 py-2 bg-blue-600 text-white text-sm hover:bg-blue-700 rounded"
            >
              🔄 Refresh
            </button>
            <button
              onClick={clearLogs}
              className="px-4 py-2 bg-red-600 text-white text-sm hover:bg-red-700 rounded"
            >
              🗑️ Clear Logs
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh (2s)
          </label>
        </div>

        {/* Logs Table */}
        <div className="bg-gray-800 rounded overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left w-24">Time</th>
                  <th className="px-4 py-2 text-left w-20">Level</th>
                  <th className="px-4 py-2 text-left w-40">Component</th>
                  <th className="px-4 py-2 text-left">Message</th>
                  <th className="px-4 py-2 text-left w-48">Data</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, i) => (
                  <tr key={i} className="border-t border-gray-700 hover:bg-gray-750">
                    <td className="px-4 py-2 text-gray-400 text-xs">
                      {log.timestamp.split('T')[1]?.split('.')[0] || log.timestamp}
                    </td>
                    <td className={`px-4 py-2 font-bold ${levelColors[log.level] || 'text-gray-400'}`}>
                      {log.level}
                    </td>
                    <td className="px-4 py-2 text-gray-300 text-xs">{log.component}</td>
                    <td className="px-4 py-2">{log.message}</td>
                    <td className="px-4 py-2 text-gray-400 text-xs">
                      {log.data ? <pre className="text-xs overflow-auto max-w-xs">{JSON.stringify(log.data)}</pre> : '—'}
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No logs yet. Try making a query or click a test button below!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Test Queries Section */}
        <div className="bg-gray-800 p-6 rounded">
          <h2 className="text-lg font-bold mb-4">🧪 Quick Test Queries</h2>
          <p className="text-gray-400 text-sm mb-4">
            Click to test different scenarios (logs will appear above in real-time):
          </p>
          <div className="grid grid-cols-2 gap-3">
            <TestButton query="2+2" description="Simple math (should use direct)" />
            <TestButton query="btc price" description="Real-time data (CoinGecko)" />
            <TestButton
              query="Calculate compound interest on $10000 at 5% for 3 years"
              description="Math problem (should use PoT)"
            />
            <TestButton
              query="This is AMAZING and REVOLUTIONARY and UNPRECEDENTED and INCREDIBLE"
              description="Hype test (should trigger Guard)"
            />
            <TestButton
              query="Tell me about AI. Tell me about AI. Tell me about AI."
              description="Echo test (should trigger Guard)"
            />
            <TestButton
              query="What is quantum computing? Explain step by step"
              description="Step-by-step (should use CoD)"
            />
            <TestButton
              query="Search for the latest news about OpenAI"
              description="Search request (should use ReAct)"
            />
            <TestButton
              query="ETH price"
              description="Ethereum price (real-time)"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function TestButton({ query, description }: { query: string; description: string }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const runTest = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/simple-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, methodology: 'auto' }),
      })
      const data = await res.json()
      if (data.error) {
        setResult('❌ ' + data.error)
      } else {
        const method = data.methodologyUsed || data.methodology || 'unknown'
        const latency = data.metrics?.latency || 0
        const tokens = data.metrics?.tokens || 0
        setResult('✅ ' + method + ' | ' + latency + 'ms | ' + tokens + ' tok')
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Unknown'
      setResult('❌ Error: ' + errorMsg)
    }
    setLoading(false)
  }

  return (
    <div className="bg-gray-700 p-3 rounded">
      <button
        onClick={runTest}
        disabled={loading}
        className="w-full text-left hover:bg-gray-600 p-2 rounded transition disabled:opacity-50"
      >
        <p className="text-white text-sm font-medium mb-1">
          {query.length > 60 ? query.slice(0, 60) + '...' : query}
        </p>
        <p className="text-gray-400 text-xs">{description}</p>
        {loading && <p className="text-blue-400 text-xs mt-2">⏳ Running...</p>}
        {result && <p className="text-green-400 text-xs mt-2">{result}</p>}
      </button>
    </div>
  )
}
