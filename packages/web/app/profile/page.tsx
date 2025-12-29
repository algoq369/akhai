'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: string
  username: string | null
  email: string | null
  avatar_url: string | null
  auth_provider: 'github' | 'wallet'
}

interface Stats {
  totalQueries: number
  totalTopics: number
  totalConnections: number
  totalTokens: number
  totalCost: number
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<Stats>({
    totalQueries: 0,
    totalTopics: 0,
    totalConnections: 0,
    totalTokens: 0,
    totalCost: 0
  })
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<'dashboard' | 'intelligence' | 'mindmap' | 'history' | 'idea-factory'>('dashboard')

  useEffect(() => {
    checkSession()
    fetchStats()
  }, [])

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session')
      const data = await response.json()
      if (!data.user) {
        router.push('/')
        return
      }
      setUser(data.user)
    } catch (error) {
      console.error('Session check error:', error)
      router.push('/')
    }
  }

  const fetchStats = async () => {
    try {
      setLoading(true)
      const [historyRes, topicsRes, mindmapRes] = await Promise.all([
        fetch('/api/history'),
        fetch('/api/side-canal/topics'),
        fetch('/api/mindmap/data')
      ])

      const historyData = historyRes.ok ? await historyRes.json() : { queries: [] }
      const topicsData = topicsRes.ok ? await topicsRes.json() : { topics: [] }
      const mindmapData = mindmapRes.ok ? await mindmapRes.json() : { nodes: [], links: [] }

      const totalTokens = historyData.queries?.reduce((sum: number, q: any) => sum + (q.tokens_used || 0), 0) || 0
      const totalCost = historyData.queries?.reduce((sum: number, q: any) => sum + (q.cost || 0), 0) || 0

      setStats({
        totalQueries: historyData.queries?.length || 0,
        totalTopics: topicsData.topics?.length || 0,
        totalConnections: mindmapData.links?.length || 0,
        totalTokens,
        totalCost
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/session', { method: 'POST' })
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-relic-white flex items-center justify-center">
        <p className="text-relic-silver">Loading...</p>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-relic-white">
      {/* Header */}
      <div className="border-b border-relic-mist bg-relic-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.username || 'User'}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-relic-mist flex items-center justify-center text-lg text-relic-slate">
                  {user.username?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-mono text-relic-slate">{user.username || 'Profile'}</h1>
                {user.email && (
                  <p className="text-sm text-relic-silver">{user.email}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="text-xs text-relic-silver hover:text-relic-slate transition-colors"
              >
                ← back to akhai
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-xs font-mono border border-relic-mist hover:bg-relic-ghost text-relic-slate transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <div className="flex gap-4 border-b border-relic-mist mb-8">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'intelligence', label: 'Intelligence & Robot Training' },
            { id: 'mindmap', label: 'Mind Map' },
            { id: 'history', label: 'History' },
            { id: 'idea-factory', label: 'Idea Factory' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`
                px-4 py-2 text-xs font-mono border-b-2 transition-colors
                ${activeSection === tab.id
                  ? 'border-relic-slate text-relic-slate'
                  : 'border-transparent text-relic-silver hover:text-relic-slate'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Sections */}
        {activeSection === 'dashboard' && (
          <div className="space-y-6">
            <h2 className="text-xl font-mono text-relic-slate mb-4">Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-4 bg-relic-ghost/50 border border-relic-mist">
                <p className="text-xs text-relic-silver mb-1">Total Queries</p>
                <p className="text-2xl font-mono text-relic-slate">{stats.totalQueries}</p>
              </div>
              <div className="p-4 bg-relic-ghost/50 border border-relic-mist">
                <p className="text-xs text-relic-silver mb-1">Topics</p>
                <p className="text-2xl font-mono text-relic-slate">{stats.totalTopics}</p>
              </div>
              <div className="p-4 bg-relic-ghost/50 border border-relic-mist">
                <p className="text-xs text-relic-silver mb-1">Connections</p>
                <p className="text-2xl font-mono text-relic-slate">{stats.totalConnections}</p>
              </div>
              <div className="p-4 bg-relic-ghost/50 border border-relic-mist">
                <p className="text-xs text-relic-silver mb-1">Tokens Used</p>
                <p className="text-2xl font-mono text-relic-slate">{stats.totalTokens.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-relic-ghost/50 border border-relic-mist">
                <p className="text-xs text-relic-silver mb-1">Total Cost</p>
                <p className="text-2xl font-mono text-relic-slate">${stats.totalCost.toFixed(4)}</p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'intelligence' && (
          <div className="space-y-6">
            <h2 className="text-xl font-mono text-relic-slate mb-4">Intelligence & Robot Training</h2>
            <div className="p-6 bg-relic-ghost/50 border border-relic-mist">
              <p className="text-sm text-relic-slate mb-4">
                Access your AI agent configurations, training sessions, and robot training data.
              </p>
              <Link
                href="/idea-factory?tab=customize"
                className="inline-block px-4 py-2 text-xs font-mono bg-relic-slate text-white hover:bg-relic-void transition-colors"
              >
                Go to Customize Agent →
              </Link>
            </div>
          </div>
        )}

        {activeSection === 'mindmap' && (
          <div className="space-y-6">
            <h2 className="text-xl font-mono text-relic-slate mb-4">Mind Map</h2>
            <div className="p-6 bg-relic-ghost/50 border border-relic-mist">
              <p className="text-sm text-relic-slate mb-4">
                Visualize your knowledge graph and topic connections.
              </p>
              <p className="text-xs text-relic-silver mb-2">
                <strong>Total Topics:</strong> {stats.totalTopics}
              </p>
              <p className="text-xs text-relic-silver mb-4">
                <strong>Total Connections:</strong> {stats.totalConnections}
              </p>
              <Link
                href="/"
                className="inline-block px-4 py-2 text-xs font-mono bg-relic-slate text-white hover:bg-relic-void transition-colors"
                onClick={(e) => {
                  e.preventDefault()
                  // Open mindmap from main page
                  window.location.href = '/'
                }}
              >
                Open Mind Map →
              </Link>
            </div>
          </div>
        )}

        {activeSection === 'history' && (
          <div className="space-y-6">
            <h2 className="text-xl font-mono text-relic-slate mb-4">History</h2>
            <div className="p-6 bg-relic-ghost/50 border border-relic-mist">
              <p className="text-sm text-relic-slate mb-4">
                View your complete conversation history and query logs.
              </p>
              <p className="text-xs text-relic-silver mb-2">
                <strong>Total Queries:</strong> {stats.totalQueries}
              </p>
              <Link
                href="/history"
                className="inline-block px-4 py-2 text-xs font-mono bg-relic-slate text-white hover:bg-relic-void transition-colors"
              >
                View Full History →
              </Link>
            </div>
          </div>
        )}

        {activeSection === 'idea-factory' && (
          <div className="space-y-6">
            <h2 className="text-xl font-mono text-relic-slate mb-4">Idea Factory</h2>
            <div className="p-6 bg-relic-ghost/50 border border-relic-mist">
              <p className="text-sm text-relic-slate mb-4">
                Access your innovations lab, agent customizations, and creative experiments.
              </p>
              <Link
                href="/idea-factory"
                className="inline-block px-4 py-2 text-xs font-mono bg-relic-slate text-white hover:bg-relic-void transition-colors"
              >
                Go to Idea Factory →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
