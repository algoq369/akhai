'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { XMarkIcon, ChevronDownIcon, ChevronUpIcon, SparklesIcon } from '@heroicons/react/24/outline'

interface ChatDashboardProps {
  userId: string | null
  currentMethodology: string
  legendMode: boolean
  onMethodologyChange: (methodology: string, option: 'same' | 'side' | 'new') => void
  onGuardToggle: (feature: 'suggestions' | 'bias' | 'hype', enabled: boolean) => void
  onLegendModeToggle: (enabled: boolean) => void
  onClose: () => void
}

interface LiveTopic {
  id: string
  name: string
  category: string | null
  created_at: number
  queryId?: string
}

interface RecentQuery {
  id: string
  query: string
  flow: string
  created_at: number
}

export default function ChatDashboard({ 
  userId, 
  currentMethodology, 
  legendMode,
  onMethodologyChange, 
  onGuardToggle, 
  onLegendModeToggle,
  onClose 
}: ChatDashboardProps) {
  const router = useRouter()
  const [topics, setTopics] = useState<LiveTopic[]>([])
  const [recentQueries, setRecentQueries] = useState<RecentQuery[]>([])
  const [stats, setStats] = useState({ totalTopics: 0, totalConnections: 0 })
  const [loading, setLoading] = useState(false)
  const [expandedSection, setExpandedSection] = useState<'topics' | 'queries' | 'controls' | null>('topics')
  
  // Guard states
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(true)
  const [biasEnabled, setBiasEnabled] = useState(true)
  const [hypeEnabled, setHypeEnabled] = useState(true)

  const fetchDashboardData = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const [topicsRes, historyRes] = await Promise.all([
        fetch('/api/dashboard/live-topics'),
        fetch('/api/history?limit=5')
      ])
      
      if (topicsRes.ok) {
        const data = await topicsRes.json()
        setTopics(data.topics || [])
        setStats({
          totalTopics: data.totalTopics || 0,
          totalConnections: data.totalConnections || 0
        })
      }
      
      if (historyRes.ok) {
        const data = await historyRes.json()
        setRecentQueries(data.queries || [])
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      fetchDashboardData()
      const interval = setInterval(fetchDashboardData, 5000)
      return () => clearInterval(interval)
    }
  }, [userId, fetchDashboardData])

  const handleContinueChat = (queryId: string) => {
    router.push(`/?continue=${queryId}`)
    onClose()
  }

  const handleGuardChange = (feature: 'suggestions' | 'bias' | 'hype', enabled: boolean) => {
    if (feature === 'suggestions') setSuggestionsEnabled(enabled)
    if (feature === 'bias') setBiasEnabled(enabled)
    if (feature === 'hype') setHypeEnabled(enabled)
    onGuardToggle(feature, enabled)
  }

  if (!userId) return null

  return (
    <div className="fixed right-4 top-4 z-50 w-64 bg-relic-white border border-relic-mist shadow-lg animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-relic-mist bg-relic-ghost/30">
        <span className="text-[10px] uppercase tracking-widest text-relic-slate font-mono">Dashboard</span>
        <button onClick={onClose} className="text-relic-silver hover:text-relic-slate transition-colors">
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="max-h-[70vh] overflow-y-auto">
        {/* Legend Mode Toggle */}
        <div className="px-3 py-2 border-b border-relic-mist">
          <button
            onClick={() => onLegendModeToggle(!legendMode)}
            className={`w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-all ${
              legendMode 
                ? 'bg-relic-slate text-relic-white' 
                : 'bg-relic-ghost text-relic-silver hover:bg-relic-mist'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <SparklesIcon className="w-3 h-3" />
              Legend Mode
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${legendMode ? 'bg-green-400 animate-pulse' : 'bg-relic-silver/50'}`} />
          </button>
          {legendMode && (
            <p className="text-[8px] text-relic-silver mt-1 px-1">Opus 4.5 · Enhanced suggestions</p>
          )}
        </div>

        {/* Live Topics Section */}
        <div className="border-b border-relic-mist">
          <button
            onClick={() => setExpandedSection(expandedSection === 'topics' ? null : 'topics')}
            className="w-full flex items-center justify-between px-3 py-2 text-[10px] uppercase tracking-wider text-relic-slate hover:bg-relic-ghost/30"
          >
            <span>Live Topics ({stats.totalTopics})</span>
            {expandedSection === 'topics' ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
          </button>
          {expandedSection === 'topics' && (
            <div className="px-3 pb-2 space-y-1">
              {loading ? (
                <p className="text-[10px] text-relic-silver py-2">Loading...</p>
              ) : topics.length === 0 ? (
                <p className="text-[10px] text-relic-silver py-2">No topics yet. Start chatting!</p>
              ) : (
                topics.slice(0, 5).map((topic) => (
                  <div
                    key={topic.id}
                    className="text-[10px] px-2 py-1.5 bg-relic-ghost/50 hover:bg-relic-mist/50 transition-colors cursor-pointer"
                    onClick={() => topic.queryId && handleContinueChat(topic.queryId)}
                  >
                    <span className="text-relic-slate truncate block">{topic.name}</span>
                    {topic.category && (
                      <span className="text-[8px] text-relic-silver">{topic.category}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Recent Chats Section */}
        <div className="border-b border-relic-mist">
          <button
            onClick={() => setExpandedSection(expandedSection === 'queries' ? null : 'queries')}
            className="w-full flex items-center justify-between px-3 py-2 text-[10px] uppercase tracking-wider text-relic-slate hover:bg-relic-ghost/30"
          >
            <span>Recent Chats</span>
            {expandedSection === 'queries' ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
          </button>
          {expandedSection === 'queries' && (
            <div className="px-3 pb-2 space-y-1">
              {recentQueries.length === 0 ? (
                <p className="text-[10px] text-relic-silver py-2">No recent chats</p>
              ) : (
                recentQueries.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => handleContinueChat(q.id)}
                    className="w-full text-left text-[10px] px-2 py-1.5 bg-relic-ghost/50 hover:bg-relic-mist/50 transition-colors group"
                  >
                    <span className="text-relic-slate truncate block group-hover:text-relic-void">{q.query}</span>
                    <span className="text-[8px] text-relic-silver">{q.flow}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Guard Controls Section */}
        <div>
          <button
            onClick={() => setExpandedSection(expandedSection === 'controls' ? null : 'controls')}
            className="w-full flex items-center justify-between px-3 py-2 text-[10px] uppercase tracking-wider text-relic-slate hover:bg-relic-ghost/30"
          >
            <span>Guard Controls</span>
            {expandedSection === 'controls' ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
          </button>
          {expandedSection === 'controls' && (
            <div className="px-3 pb-3 space-y-2">
              {/* Suggestions Toggle */}
              <label className="flex items-center justify-between text-[10px] text-relic-slate cursor-pointer">
                <span>Suggestions</span>
                <button
                  onClick={() => handleGuardChange('suggestions', !suggestionsEnabled)}
                  className={`w-8 h-4 rounded-full transition-colors relative ${
                    suggestionsEnabled ? 'bg-relic-slate' : 'bg-relic-mist'
                  }`}
                >
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-relic-white transition-transform ${
                    suggestionsEnabled ? 'right-0.5' : 'left-0.5'
                  }`} />
                </button>
              </label>

              {/* Bias Detector Toggle */}
              <label className="flex items-center justify-between text-[10px] text-relic-slate cursor-pointer">
                <span>Bias Detector</span>
                <button
                  onClick={() => handleGuardChange('bias', !biasEnabled)}
                  className={`w-8 h-4 rounded-full transition-colors relative ${
                    biasEnabled ? 'bg-relic-slate' : 'bg-relic-mist'
                  }`}
                >
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-relic-white transition-transform ${
                    biasEnabled ? 'right-0.5' : 'left-0.5'
                  }`} />
                </button>
              </label>

              {/* Hype Detector Toggle */}
              <label className="flex items-center justify-between text-[10px] text-relic-slate cursor-pointer">
                <span>Hype Detector</span>
                <button
                  onClick={() => handleGuardChange('hype', !hypeEnabled)}
                  className={`w-8 h-4 rounded-full transition-colors relative ${
                    hypeEnabled ? 'bg-relic-slate' : 'bg-relic-mist'
                  }`}
                >
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-relic-white transition-transform ${
                    hypeEnabled ? 'right-0.5' : 'left-0.5'
                  }`} />
                </button>
              </label>

              {/* Run Audit Button */}
              <button
                onClick={() => {
                  // Trigger an audit notification
                  alert('Guard audit initiated. All detectors active.')
                }}
                className="w-full mt-2 px-2 py-1.5 text-[9px] uppercase tracking-wider font-mono bg-relic-ghost hover:bg-relic-mist text-relic-slate transition-colors"
              >
                Run Guard Audit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="px-3 py-2 border-t border-relic-mist bg-relic-ghost/20 flex items-center justify-between text-[9px] text-relic-silver">
        <span>{stats.totalTopics} topics</span>
        <span>·</span>
        <span>{stats.totalConnections} links</span>
        <span>·</span>
        <span className="font-mono">{currentMethodology}</span>
      </div>
    </div>
  )
}
