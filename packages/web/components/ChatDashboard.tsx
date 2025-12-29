'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { SparklesIcon, BellIcon, MoonIcon, SunIcon, CpuChipIcon, LinkIcon, ChartBarIcon, TagIcon } from '@heroicons/react/24/outline'

interface ChatDashboardProps {
  userId: string | null
  currentMethodology: string
  legendMode: boolean
  darkMode?: boolean
  sideCanalEnabled?: boolean
  newsNotificationsEnabled?: boolean
  realtimeDataEnabled?: boolean
  contextInjectionEnabled?: boolean
  autoMethodologyEnabled?: boolean
  onMethodologyChange: (methodology: string, option: 'same' | 'side' | 'new') => void
  onGuardToggle: (feature: 'suggestions' | 'bias' | 'hype' | 'echo' | 'drift' | 'factuality', enabled: boolean) => void
  onLegendModeToggle: (enabled: boolean) => void
  onDarkModeToggle?: (enabled: boolean) => void
  onSideCanalToggle?: (enabled: boolean) => void
  onNewsNotificationsToggle?: (enabled: boolean) => void
  onRealtimeDataToggle?: (enabled: boolean) => void
  onContextInjectionToggle?: (enabled: boolean) => void
  onAutoMethodologyToggle?: (enabled: boolean) => void
  onClose: () => void
  isCompact?: boolean
}

interface LiveTopic {
  id: string
  name: string
  category: string | null
  created_at: number
  queryId?: string
}

// Modern Status Indicator with Dot
function StatusIndicator({
  label,
  enabled,
  onChange,
  color = 'emerald'
}: {
  label: string
  enabled: boolean
  onChange: (enabled: boolean) => void
  color?: 'emerald' | 'violet' | 'cyan' | 'amber' | 'rose'
}) {
  const colorClasses = {
    emerald: enabled ? 'bg-emerald-500' : 'bg-gray-300',
    violet: enabled ? 'bg-violet-500' : 'bg-gray-300',
    cyan: enabled ? 'bg-cyan-500' : 'bg-gray-300',
    amber: enabled ? 'bg-amber-500' : 'bg-gray-300',
    rose: enabled ? 'bg-rose-500' : 'bg-gray-300',
  }

  return (
    <button
      onClick={() => onChange(!enabled)}
      className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors rounded"
    >
      <span className="text-xs text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-gray-500 uppercase">{enabled ? 'ON' : 'OFF'}</span>
        <div className={`w-2 h-2 rounded-full ${colorClasses[color]} ${enabled ? 'animate-pulse shadow-sm' : ''}`} />
      </div>
    </button>
  )
}

// Modern Toggle Switch
function ToggleSwitch({
  enabled,
  onChange,
  label,
  icon: Icon
}: {
  enabled: boolean
  onChange: (enabled: boolean) => void
  label: string
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors w-full rounded"
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        <span className="text-xs text-gray-700">{label}</span>
      </div>
      <div className={`w-10 h-5 rounded-full transition-colors relative ${
        enabled ? 'bg-gray-900' : 'bg-gray-300'
      }`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
          enabled ? 'right-0.5' : 'left-0.5'
        }`} />
      </div>
    </button>
  )
}

export default function ChatDashboard({
  userId,
  currentMethodology,
  legendMode,
  darkMode = false,
  sideCanalEnabled = true,
  newsNotificationsEnabled = true,
  realtimeDataEnabled = true,
  contextInjectionEnabled = true,
  autoMethodologyEnabled = true,
  onGuardToggle,
  onLegendModeToggle,
  onDarkModeToggle,
  onSideCanalToggle,
  onNewsNotificationsToggle,
  onRealtimeDataToggle,
  onContextInjectionToggle,
  onAutoMethodologyToggle,
  isCompact = false
}: ChatDashboardProps) {
  const router = useRouter()
  const [topics, setTopics] = useState<LiveTopic[]>([])
  const [stats, setStats] = useState({ totalTopics: 0, totalConnections: 0 })

  // Guard states
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('guard_suggestions') !== 'false'
    }
    return true
  })
  const [biasEnabled, setBiasEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('guard_bias') !== 'false'
    }
    return true
  })
  const [hypeEnabled, setHypeEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('guard_hype') !== 'false'
    }
    return true
  })
  const [echoEnabled, setEchoEnabled] = useState(true)
  const [driftEnabled, setDriftEnabled] = useState(true)
  const [factualityEnabled, setFactualityEnabled] = useState(true)

  const fetchDashboardData = useCallback(async () => {
    if (!userId) return
    try {
      const topicsRes = await fetch('/api/dashboard/live-topics')
      if (topicsRes.ok) {
        const data = await topicsRes.json()
        setTopics(data.topics || [])
        setStats({
          totalTopics: data.totalTopics || 0,
          totalConnections: data.totalConnections || 0
        })
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error)
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      fetchDashboardData()
    }
  }, [userId, fetchDashboardData])

  const handleGuardChange = (feature: 'suggestions' | 'bias' | 'hype' | 'echo' | 'drift' | 'factuality', enabled: boolean) => {
    if (feature === 'suggestions') {
      setSuggestionsEnabled(enabled)
      localStorage.setItem('guard_suggestions', String(enabled))
    }
    if (feature === 'bias') {
      setBiasEnabled(enabled)
      localStorage.setItem('guard_bias', String(enabled))
    }
    if (feature === 'hype') {
      setHypeEnabled(enabled)
      localStorage.setItem('guard_hype', String(enabled))
    }
    if (feature === 'echo') setEchoEnabled(enabled)
    if (feature === 'drift') setDriftEnabled(enabled)
    if (feature === 'factuality') setFactualityEnabled(enabled)
    onGuardToggle(feature, enabled)
  }

  if (!userId) return null

  // Only show during active chat
  if (!isCompact) return null

  return (
    <div className="fixed bottom-4 left-4 z-50 w-72">
      {/* Modern Control Panel */}
      <div className="bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Controls</span>
            <select
              className="text-xs font-mono text-gray-700 bg-white border border-gray-300 rounded px-2 py-1 outline-none cursor-pointer hover:border-gray-400 transition-colors"
              value={currentMethodology}
              onChange={(e) => {/* handle methodology change */}}
            >
              <option value="auto">auto</option>
              <option value="cod">cod</option>
              <option value="bot">bot</option>
              <option value="react">react</option>
              <option value="pot">pot</option>
              <option value="gtp">gtp</option>
            </select>
          </div>
        </div>

        {/* Core Features Section */}
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">Core Features</h3>
          <div className="space-y-1">
            <ToggleSwitch
              enabled={legendMode}
              onChange={onLegendModeToggle}
              label="Instinct Mode"
              icon={SparklesIcon}
            />
            {onDarkModeToggle && (
              <ToggleSwitch
                enabled={darkMode}
                onChange={onDarkModeToggle}
                label="Dark Mode"
                icon={darkMode ? MoonIcon : SunIcon}
              />
            )}
            {onAutoMethodologyToggle && (
              <ToggleSwitch
                enabled={autoMethodologyEnabled}
                onChange={onAutoMethodologyToggle}
                label="Auto Methodology"
                icon={CpuChipIcon}
              />
            )}
          </div>
        </div>

        {/* Grounding Guard Section */}
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">Grounding Guard</h3>
          <div className="space-y-1">
            <StatusIndicator
              label="Suggestions"
              enabled={suggestionsEnabled}
              onChange={(enabled) => handleGuardChange('suggestions', enabled)}
              color="emerald"
            />
            <StatusIndicator
              label="Bias Detector"
              enabled={biasEnabled}
              onChange={(enabled) => handleGuardChange('bias', enabled)}
              color="violet"
            />
            <StatusIndicator
              label="Hype Detector"
              enabled={hypeEnabled}
              onChange={(enabled) => handleGuardChange('hype', enabled)}
              color="cyan"
            />
            <StatusIndicator
              label="Echo Detector"
              enabled={echoEnabled}
              onChange={(enabled) => handleGuardChange('echo', enabled)}
              color="amber"
            />
            <StatusIndicator
              label="Drift Detector"
              enabled={driftEnabled}
              onChange={(enabled) => handleGuardChange('drift', enabled)}
              color="rose"
            />
            <StatusIndicator
              label="Factuality Check"
              enabled={factualityEnabled}
              onChange={(enabled) => handleGuardChange('factuality', enabled)}
              color="rose"
            />
          </div>
        </div>

        {/* Intelligence Section */}
        <div className="px-4 py-3">
          <h3 className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">Intelligence</h3>
          <div className="space-y-1">
            {onSideCanalToggle && (
              <ToggleSwitch
                enabled={sideCanalEnabled}
                onChange={onSideCanalToggle}
                label="Side Canal (Topics)"
                icon={TagIcon}
              />
            )}
            {onContextInjectionToggle && (
              <ToggleSwitch
                enabled={contextInjectionEnabled}
                onChange={onContextInjectionToggle}
                label="Context Injection"
                icon={LinkIcon}
              />
            )}
            {onRealtimeDataToggle && (
              <ToggleSwitch
                enabled={realtimeDataEnabled}
                onChange={onRealtimeDataToggle}
                label="Real-time Data"
                icon={ChartBarIcon}
              />
            )}
            {onNewsNotificationsToggle && (
              <ToggleSwitch
                enabled={newsNotificationsEnabled}
                onChange={onNewsNotificationsToggle}
                label="News Notifications"
                icon={BellIcon}
              />
            )}
          </div>
        </div>

        {/* Footer Status */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
            <span>{stats.totalTopics} topics tracked</span>
            {legendMode && (
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-amber-600 font-semibold">INSTINCT</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
