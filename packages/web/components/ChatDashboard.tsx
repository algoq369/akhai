'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import MethodologySwitcher from './MethodologySwitcher'

interface ChatDashboardProps {
  userId: string | null
  currentMethodology: string
  onMethodologyChange: (methodology: string, option: 'same' | 'side' | 'new') => void
  onGuardToggle: (feature: 'suggestions' | 'bias' | 'hype', enabled: boolean) => void
}

interface LiveTopic {
  id: string
  name: string
  category: string | null
  created_at: number
  status: 'extracting' | 'extracted'
}

interface TopicStats {
  totalTopics: number
  totalRelationships: number
  recentTopics: LiveTopic[]
}

export default function ChatDashboard({ userId, currentMethodology, onMethodologyChange, onGuardToggle }: ChatDashboardProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [topics, setTopics] = useState<LiveTopic[]>([])
  const [stats, setStats] = useState<TopicStats>({ totalTopics: 0, totalRelationships: 0, recentTopics: [] })
  const [loading, setLoading] = useState(false)
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(true)
  const [biasDetectorEnabled, setBiasDetectorEnabled] = useState(true)
  const [hypeDetectorEnabled, setHypeDetectorEnabled] = useState(true)

  const fetchDashboardData = useCallback(async () => {
    if (!userId) return
    
    setLoading(true)
    try {
      const [topicsRes, statsRes] = await Promise.all([
        fetch('/api/dashboard/live-topics'),
        fetch('/api/dashboard/mindmap-preview')
      ])
      
      if (topicsRes.ok) {
        const topicsData = await topicsRes.json()
        setTopics(topicsData.topics || [])
      }
      
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.stats || { totalTopics: 0, totalRelationships: 0, recentTopics: [] })
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      fetchDashboardData()
      const interval = setInterval(fetchDashboardData, 3000) // Refresh every 3 seconds
      return () => clearInterval(interval)
    }
  }, [userId, fetchDashboardData])

  const handleGuardToggle = (feature: 'suggestions' | 'bias' | 'hype', enabled: boolean) => {
    if (feature === 'suggestions') setSuggestionsEnabled(enabled)
    if (feature === 'bias') setBiasDetectorEnabled(enabled)
    if (feature === 'hype') setHypeDetectorEnabled(enabled)
    onGuardToggle(feature, enabled)
  }

  if (!userId) return null

  return (
    <div className={`
      fixed right-0 top-0 h-full z-40 transition-all duration-300
      ${collapsed ? 'w-12' : 'w-80'}
      bg-relic-white border-l border-relic-mist
      flex flex-col
    `}>
      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 w-6 h-12 bg-relic-white border border-r-0 border-relic-mist flex items-center justify-center hover:bg-relic-ghost transition-colors"
      >
        {collapsed ? (
          <ChevronLeftIcon className="h-4 w-4 text-relic-slate" />
        ) : (
          <ChevronRightIcon className="h-4 w-4 text-relic-slate" />
        )}
      </button>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Header */}
          <div className="border-b border-relic-mist pb-3">
            <h3 className="text-xs uppercase tracking-widest text-relic-slate font-mono">Dashboard</h3>
          </div>

          {/* Methodology Switcher */}
          <div>
            <h4 className="text-[10px] uppercase tracking-widest text-relic-silver mb-2">Methodology</h4>
            <MethodologySwitcher
              currentMethodology={currentMethodology}
              onMethodologyChange={onMethodologyChange}
            />
          </div>

          {/* Guard Controls */}
          <div>
            <h4 className="text-[10px] uppercase tracking-widest text-relic-silver mb-2">Guard Controls</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-relic-slate cursor-pointer">
                <input
                  type="checkbox"
                  checked={suggestionsEnabled}
                  onChange={(e) => handleGuardToggle('suggestions', e.target.checked)}
                  className="w-3 h-3 border-relic-mist text-relic-slate focus:ring-relic-slate"
                />
                <span>Suggestions Active</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-relic-slate cursor-pointer">
                <input
                  type="checkbox"
                  checked={biasDetectorEnabled}
                  onChange={(e) => handleGuardToggle('bias', e.target.checked)}
                  className="w-3 h-3 border-relic-mist text-relic-slate focus:ring-relic-slate"
                />
                <span>Bias Detector</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-relic-slate cursor-pointer">
                <input
                  type="checkbox"
                  checked={hypeDetectorEnabled}
                  onChange={(e) => handleGuardToggle('hype', e.target.checked)}
                  className="w-3 h-3 border-relic-mist text-relic-slate focus:ring-relic-slate"
                />
                <span>Hype Detector</span>
              </label>
            </div>
          </div>

          {/* Live Topics */}
          <div>
            <h4 className="text-[10px] uppercase tracking-widest text-relic-silver mb-2">Live Topics</h4>
            {loading ? (
              <div className="text-xs text-relic-silver">Loading...</div>
            ) : topics.length === 0 ? (
              <div className="text-xs text-relic-silver">No topics yet</div>
            ) : (
              <div className="space-y-1">
                {topics.slice(0, 5).map((topic) => (
                  <div
                    key={topic.id}
                    className="text-xs text-relic-slate p-2 bg-relic-ghost/30 border border-relic-mist/50 hover:border-relic-slate/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{topic.name}</span>
                      {topic.status === 'extracting' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-relic-slate animate-pulse ml-2" />
                      )}
                    </div>
                    {topic.category && (
                      <span className="text-[10px] text-relic-silver mt-1 block">{topic.category}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Topic Stats */}
          <div>
            <h4 className="text-[10px] uppercase tracking-widest text-relic-silver mb-2">Stats</h4>
            <div className="space-y-1 text-xs text-relic-slate">
              <div>Topics: {stats.totalTopics}</div>
              <div>Connections: {stats.totalRelationships}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

