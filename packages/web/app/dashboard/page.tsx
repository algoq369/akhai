'use client'

import { useEffect, useState } from 'react'
import { useDashboardStore } from '@/lib/stores/dashboard-store'
import StatCard from '@/components/StatCard'
import ProviderCard from '@/components/ProviderCard'
import RecentQueriesList from '@/components/RecentQueriesList'

interface User {
  id: string;
  username: string;
  email: string | null;
  avatar_url: string | null;
  auth_provider: string;
  isAdmin: boolean;
}

export default function DashboardPage() {
  const { stats, loading, error, fetchStats } = useDashboardStore()
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Check authentication and admin status
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/session')
        const data = await res.json()
        setUser(data.user)
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setAuthLoading(false)
      }
    }
    checkAuth()
  }, [])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 10000)
    return () => clearInterval(interval)
  }, [fetchStats])

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-relic-white matrix-grid flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-relic-mist border-t-relic-slate mx-auto"></div>
          <p className="text-relic-silver mt-4 text-xs">loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-relic-white matrix-grid flex items-center justify-center">
        <div className="bg-relic-ghost border border-relic-mist p-6">
          <h3 className="text-relic-void font-medium mb-2 text-sm">Error</h3>
          <p className="text-relic-silver text-xs">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-relic-white matrix-grid">
      {/* Header */}
      <header className="border-b border-relic-mist/50">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <a href="/" className="text-[10px] uppercase tracking-[0.3em] text-relic-silver hover:text-relic-slate">← akhai</a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Title */}
        <div className="mb-10">
          <h1 className="text-2xl font-light text-relic-void mb-1">dashboard</h1>
          <p className="text-relic-silver text-xs">monitor akhai usage and performance</p>
        </div>

        {/* Stats Grid - Basic stats for all users */}
        <div className={`grid grid-cols-1 md:grid-cols-2 ${user?.isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-3 mb-6`}>
          <StatCard
            title="Queries Today"
            value={stats?.queriesToday || 0}
          />
          <StatCard
            title="Queries This Month"
            value={stats?.queriesThisMonth || 0}
          />
          {/* Admin-only: Token and Cost stats */}
          {user?.isAdmin && (
            <>
              <StatCard
                title="Total Tokens"
                value={stats?.totalTokens?.toLocaleString() || '0'}
              />
              <StatCard
                title="Total Cost"
                value={`$${stats?.totalCost.toFixed(2) || '0.00'}`}
              />
            </>
          )}
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          <div className="bg-relic-ghost/30 border border-relic-mist p-4">
            <h2 className="relic-label mb-3">performance</h2>
            <div className="flex items-center justify-between">
              <span className="text-xs text-relic-silver">avg response time</span>
              <span className="text-xl font-medium text-relic-void font-mono">
                {stats?.avgResponseTime || 0}s
              </span>
            </div>
          </div>

          <div className="bg-relic-ghost/30 border border-relic-mist p-4">
            <h2 className="relic-label mb-3">success rate</h2>
            <div className="flex items-center justify-between">
              <span className="text-xs text-relic-silver">completed queries</span>
              <span className="text-xl font-medium text-relic-void font-mono">
                {(stats?.queriesToday || 0) > 0 ? '100%' : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Provider Status - Admin Only */}
        {user?.isAdmin && (
          <div className="bg-relic-ghost/30 border border-relic-mist p-4 mb-6">
            <h2 className="relic-label mb-3">provider status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <ProviderCard
                name="Anthropic"
                status={stats?.providers.anthropic.status || 'inactive'}
                model="Claude Sonnet 4"
                queriesCount={stats?.providers.anthropic.queries}
                totalCost={stats?.providers.anthropic.cost}
              />
              <ProviderCard
                name="DeepSeek"
                status={stats?.providers.deepseek.status || 'inactive'}
                model="deepseek-chat"
                queriesCount={stats?.providers.deepseek.queries}
                totalCost={stats?.providers.deepseek.cost}
              />
              <ProviderCard
                name="Grok (xAI)"
                status={stats?.providers.xai.status || 'inactive'}
                model="grok-3"
                queriesCount={stats?.providers.xai.queries}
                totalCost={stats?.providers.xai.cost}
              />
              <ProviderCard
                name="Mistral AI"
                status={stats?.providers.mistral?.status || 'inactive'}
                model="mistral-small-latest"
                queriesCount={stats?.providers.mistral?.queries || 0}
                totalCost={stats?.providers.mistral?.cost || 0}
              />
            </div>
          </div>
        )}

        {/* Recent Queries */}
        <div className="bg-relic-ghost/30 border border-relic-mist p-4">
          <h2 className="relic-label mb-3">recent queries</h2>
          <RecentQueriesList />
        </div>
      </div>
    </div>
  )
}
