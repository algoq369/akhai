'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SefirotMini from '@/components/SefirotMini'
import SuggestionToast from '@/components/SuggestionToast'
import TopicsPanel from '@/components/TopicsPanel'
import { useSettingsStore } from '@/lib/stores/settings-store'
import DarkModeToggle from '@/components/DarkModeToggle'

// Force dynamic rendering to avoid prerender errors
export const dynamic = 'force-dynamic'

interface Transaction {
  id: string
  amount: number
  currency: string
  pay_currency: string | null
  status: string
  created_at: number
  payment_type: 'crypto' | 'stripe' | 'btcpay'
}

interface SocialConnection {
  platform: 'x' | 'telegram' | 'github' | 'reddit' | 'mastodon' | 'youtube'
  user_id: string
  username: string
  access_token?: string
  refresh_token?: string
  expires_at?: number
  connected_at: number
}

interface UserProfile {
  id: string
  github_username?: string
  github_email?: string
  wallet_address?: string
  created_at: number
  last_login: number
  social_connections?: SocialConnection[]
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'profile' | 'transactions' | 'development' | 'settings' | 'console'>('profile')
  const [showTopicsPanel, setShowTopicsPanel] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [oauthMessage, setOauthMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [oauthLoading, setOauthLoading] = useState(false)
  const { settings, updateAppearance, updateMethodology, updateFeatures, updatePrivacy, clearAllData } = useSettingsStore()

  useEffect(() => {
    // Check URL params for tab selection and OAuth messages
    const params = new URLSearchParams(window.location.search)
    const tabParam = params.get('tab')
    if (tabParam === 'development' || tabParam === 'transactions' || tabParam === 'profile' || tabParam === 'settings' || tabParam === 'console') {
      setActiveTab(tabParam as any)
    }

    // Check for OAuth callback messages
    const connected = params.get('connected')
    const username = params.get('username')
    const error = params.get('error')

    if (connected && username) {
      setOauthMessage({
        type: 'success',
        text: `Successfully connected ${connected.toUpperCase()} account: @${username}`
      })
      // Set to settings tab to show the new connection
      setActiveTab('settings')
      // Clear URL params
      window.history.replaceState({}, '', '/profile?tab=settings')
      // Auto-hide after 10 seconds
      setTimeout(() => setOauthMessage(null), 10000)

      // Refetch profile to show new connection
      fetch('/api/profile')
        .then(res => res.json())
        .then(data => setUser(data.user))
        .catch(err => console.error('Failed to refetch profile:', err))
    } else if (error) {
      setOauthMessage({
        type: 'error',
        text: `Connection failed: ${decodeURIComponent(error)}`
      })
      setActiveTab('settings')
      window.history.replaceState({}, '', '/profile?tab=settings')
      setTimeout(() => setOauthMessage(null), 10000)
    }
  }, [])

  // Listen for OAuth success messages from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) return

      if (event.data && event.data.type === 'oauth-success') {
        const { platform, username } = event.data
        setOauthMessage({
          type: 'success',
          text: `Successfully connected ${platform.toUpperCase()} account${username ? ` as @${username}` : ''}`
        })
        setTimeout(() => setOauthMessage(null), 5000)

        // Reload profile data to show new connection
        window.location.reload()
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  useEffect(() => {
    // Check session via API instead of manually parsing cookies
    const loadProfile = async () => {
      try {
        // First check if user is logged in
        const sessionRes = await fetch('/api/auth/session')
        const sessionData = await sessionRes.json()

        if (!sessionData.user) {
          // Not logged in, redirect to home
          console.log('[Profile] No active session, redirecting to home')
          router.push('/')
          return
        }

        // User is logged in, fetch profile data
        const [profileRes, transactionsRes, statsRes] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/profile/transactions'),
          fetch('/api/profile/stats')
        ])

        if (profileRes.ok) {
          const profileData = await profileRes.json()
          setUser(profileData.user)
        } else if (profileRes.status === 401) {
          // Unauthorized, redirect to home
          router.push('/')
          return
        }

        if (transactionsRes.ok) {
          const transactionsData = await transactionsRes.json()
          setTransactions(transactionsData.transactions || [])
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData)
        }
      } catch (error) {
        console.error('[Profile] Failed to load profile:', error)
        // On error, redirect to home
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [router])

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'confirmed':
        return 'text-green-600 bg-green-50'
      case 'pending':
      case 'waiting':
        return 'text-amber-600 bg-amber-50'
      case 'failed':
      case 'expired':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-slate-600 bg-slate-50'
    }
  }

  /**
   * Handle connecting a social account
   */
  const handleConnectSocial = async (platform: 'x' | 'telegram' | 'reddit' | 'mastodon' | 'youtube') => {
    // Prevent duplicate calls
    if (oauthLoading) {
      console.log('[Profile] OAuth already in progress, ignoring duplicate call')
      return
    }

    setOauthLoading(true)
    try {
      if (platform === 'x') {
        // Twitter OAuth flow
        const response = await fetch('/api/auth/social/x/connect')
        const data = await response.json()

        if (!response.ok) {
          setOauthMessage({
            type: 'error',
            text: data.message || 'Failed to initiate Twitter OAuth'
          })
          setTimeout(() => setOauthMessage(null), 5000)
          setOauthLoading(false)
          return
        }

        console.log('[Profile] Redirecting to OAuth:', data.authUrl)

        // Use full-page redirect instead of popup (Twitter blocks popups)
        window.location.href = data.authUrl
        // Keep loading state during redirect
      } else {
        // Other platforms not yet implemented
        setOauthMessage({
          type: 'error',
          text: `${platform.toUpperCase()} integration coming soon`
        })
        setTimeout(() => setOauthMessage(null), 3000)
        setOauthLoading(false)
      }
    } catch (error) {
      console.error('[Profile] Failed to connect social:', error)
      setOauthMessage({
        type: 'error',
        text: 'Failed to connect account'
      })
      setTimeout(() => setOauthMessage(null), 5000)
      setOauthLoading(false)
    }
  }

  /**
   * Handle disconnecting a social account
   */
  const handleDisconnectSocial = async (platform: 'x' | 'telegram' | 'github' | 'reddit' | 'mastodon' | 'youtube') => {
    if (!confirm(`Are you sure you want to disconnect your ${platform.toUpperCase()} account?`)) {
      return
    }

    try {
      const response = await fetch(`/api/auth/social/disconnect?platform=${platform}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        setOauthMessage({
          type: 'error',
          text: data.error || 'Failed to disconnect account'
        })
        setTimeout(() => setOauthMessage(null), 5000)
        return
      }

      // Update user state to remove the connection
      setUser(prev => {
        if (!prev) return null
        return {
          ...prev,
          social_connections: prev.social_connections?.filter(c => c.platform !== platform)
        }
      })

      setOauthMessage({
        type: 'success',
        text: `Successfully disconnected ${platform.toUpperCase()} account`
      })
      setTimeout(() => setOauthMessage(null), 3000)
    } catch (error) {
      console.error('[Profile] Failed to disconnect social:', error)
      setOauthMessage({
        type: 'error',
        text: 'Failed to disconnect account'
      })
      setTimeout(() => setOauthMessage(null), 5000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-relic-void dark:to-relic-void/90 flex items-center justify-center">
        <div className="text-sm text-slate-400 dark:text-relic-ghost">Loading profile...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-relic-void dark:to-relic-void/90 flex items-center justify-center">
        <div className="text-center">
          <div className="text-sm text-slate-400 dark:text-relic-ghost mb-4">Please log in to view your profile</div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-slate-700 dark:bg-relic-slate text-white text-sm rounded-md hover:bg-slate-800 dark:hover:bg-relic-slate/80 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-relic-void dark:to-relic-void/90">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-relic-slate/30 bg-white/80 dark:bg-relic-void/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm font-mono text-slate-400 dark:text-relic-ghost hover:text-slate-600 dark:hover:text-white transition-colors">
              ← back
            </a>
            <h1 className="text-base font-light tracking-wide text-slate-700 dark:text-white">
              Profile
            </h1>
          </div>
          <DarkModeToggle />
        </div>
      </header>

      {/* OAuth Message Notification */}
      {oauthMessage && (
        <div className={`max-w-4xl mx-auto px-6 pt-4`}>
          <div className={`px-4 py-3 rounded-md text-[10px] ${
            oauthMessage.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center justify-between">
              <span>{oauthMessage.text}</span>
              <button
                onClick={() => setOauthMessage(null)}
                className="ml-4 text-[8px] opacity-60 hover:opacity-100 transition-opacity"
              >
                dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-slate-200 dark:border-relic-slate/30">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-1 text-sm font-mono transition-colors ${
              activeTab === 'profile'
                ? 'text-slate-700 dark:text-white border-b-2 border-slate-700 dark:border-white'
                : 'text-slate-400 dark:text-relic-ghost hover:text-slate-600 dark:hover:text-white'
            }`}
          >
            Profile Details
          </button>
          <button
            onClick={() => setActiveTab('development')}
            className={`pb-3 px-1 text-sm font-mono transition-colors ${
              activeTab === 'development'
                ? 'text-slate-700 dark:text-white border-b-2 border-slate-700 dark:border-white'
                : 'text-slate-400 dark:text-relic-ghost hover:text-slate-600 dark:hover:text-white'
            }`}
          >
            Development
            {stats && (
              <span className="ml-2 px-1.5 py-0.5 text-[9px] bg-relic-ghost dark:bg-relic-slate/20 text-relic-slate dark:text-relic-ghost border border-relic-mist dark:border-relic-slate/30">
                L{stats.developmentLevel}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`pb-3 px-1 text-sm font-mono transition-colors ${
              activeTab === 'transactions'
                ? 'text-slate-700 dark:text-white border-b-2 border-slate-700 dark:border-white'
                : 'text-slate-400 dark:text-relic-ghost hover:text-slate-600 dark:hover:text-white'
            }`}
          >
            Transaction History
            {transactions.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-slate-100 dark:bg-relic-slate/20 text-slate-600 dark:text-relic-ghost rounded-full">
                {transactions.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 px-1 text-sm font-mono transition-colors ${
              activeTab === 'settings'
                ? 'text-slate-700 dark:text-white border-b-2 border-slate-700 dark:border-white'
                : 'text-slate-400 dark:text-relic-ghost hover:text-slate-600 dark:hover:text-white'
            }`}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveTab('console')}
            className={`pb-3 px-1 text-sm font-mono transition-colors ${
              activeTab === 'console'
                ? 'text-slate-700 dark:text-white border-b-2 border-slate-700 dark:border-white'
                : 'text-slate-400 dark:text-relic-ghost hover:text-slate-600 dark:hover:text-white'
            }`}
          >
            Console
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white dark:bg-relic-void/50 border border-relic-mist dark:border-relic-slate/30 p-4 space-y-4">
            <div>
              <div className="text-[9px] uppercase tracking-[0.2em] text-relic-silver dark:text-relic-ghost mb-1">user id</div>
              <div className="text-[10px] font-mono text-relic-slate dark:text-relic-ghost">{user.id}</div>
            </div>

            {user.github_username && (
              <div>
                <div className="text-[9px] uppercase tracking-[0.2em] text-relic-silver dark:text-relic-ghost mb-1">github</div>
                <div className="text-[10px] text-relic-slate dark:text-relic-ghost">@{user.github_username}</div>
                {user.github_email && (
                  <div className="text-[9px] text-relic-silver dark:text-relic-ghost mt-1">{user.github_email}</div>
                )}
              </div>
            )}

            {user.wallet_address && (
              <div>
                <div className="text-[9px] uppercase tracking-[0.2em] text-relic-silver dark:text-relic-ghost mb-1">wallet</div>
                <div className="text-[9px] font-mono text-relic-slate dark:text-relic-ghost break-all bg-relic-ghost dark:bg-relic-slate/20 p-2">
                  {user.wallet_address}
                </div>
              </div>
            )}

            <div className="flex gap-6 pt-3 border-t border-relic-mist dark:border-relic-slate/30">
              <div>
                <div className="text-[9px] uppercase tracking-wider text-relic-silver dark:text-relic-ghost mb-1">joined</div>
                <div className="text-[10px] text-relic-slate dark:text-relic-ghost">{formatDate(user.created_at)}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wider text-relic-silver dark:text-relic-ghost mb-1">last seen</div>
                <div className="text-[10px] text-relic-slate dark:text-relic-ghost">{formatDate(user.last_login)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div>
            {transactions.length === 0 ? (
              <div className="bg-white dark:bg-relic-void/50 border border-relic-mist dark:border-relic-slate/30 p-8 text-center">
                <div className="text-[9px] text-relic-silver dark:text-relic-ghost uppercase tracking-wider mb-2">no transactions yet</div>
                <p className="text-[9px] text-relic-mist dark:text-relic-slate">
                  your payment history will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-white dark:bg-relic-void/50 border border-relic-mist dark:border-relic-slate/30 p-4 hover:border-relic-slate dark:hover:border-relic-ghost transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-[10px] font-mono text-relic-slate dark:text-relic-ghost">
                          {tx.payment_type === 'crypto' && '₿'}
                          {tx.payment_type === 'btcpay' && '⚡'}
                          {tx.payment_type === 'stripe' && '💳'}
                          <span className="ml-2">{tx.payment_type.toUpperCase()}</span>
                        </div>
                        <div className={`px-2 py-1 text-[9px] font-mono ${getStatusColor(tx.status)}`}>
                          {tx.status}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-mono text-relic-slate dark:text-relic-ghost">
                          {tx.amount} {tx.currency}
                        </div>
                        {tx.pay_currency && (
                          <div className="text-[9px] text-relic-silver dark:text-relic-ghost mt-0.5">
                            via {tx.pay_currency}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-relic-silver dark:text-relic-ghost">
                      <div className="font-mono">{tx.id}</div>
                      <div>{formatDate(tx.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Development Tab */}
        {activeTab === 'development' && stats && (
          <div className="space-y-4">
            {/* Development Level */}
            <div className="bg-white dark:bg-relic-void/50 border border-relic-mist dark:border-relic-slate/30 p-4">
              <div className="text-[10px] text-relic-silver dark:text-relic-ghost uppercase tracking-[0.2em] mb-3">development level</div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-light text-relic-slate dark:text-white">L{stats.developmentLevel}</span>
                  <span className="text-[10px] text-relic-silver dark:text-relic-ghost">
                    {stats.stats.total_points} / {stats.pointsForNextLevel} pts
                  </span>
                </div>
                <div className="text-relic-silver dark:text-relic-ghost text-sm">
                  {stats.developmentLevel >= 10 ? '◊' :
                   stats.developmentLevel >= 7 ? '◊' :
                   stats.developmentLevel >= 5 ? '◊' :
                   stats.developmentLevel >= 3 ? '•' : '·'}
                </div>
              </div>
              <div className="w-full bg-relic-ghost dark:bg-relic-slate/20 h-[2px]">
                <div
                  className="bg-relic-slate dark:bg-relic-ghost h-[2px] transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (stats.stats.total_points / stats.pointsForNextLevel) * 100)}%`
                  }}
                />
              </div>
            </div>

            {/* Token Consumption */}
            <div className="bg-white dark:bg-relic-void/50 border border-relic-mist dark:border-relic-slate/30 p-4">
              <div className="text-[10px] text-relic-silver dark:text-relic-ghost uppercase tracking-[0.2em] mb-3">token consumption</div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="text-[9px] text-relic-mist dark:text-relic-slate uppercase tracking-wider mb-1">queries</div>
                  <div className="text-sm font-mono text-relic-slate dark:text-white">{stats.stats.queries_completed}</div>
                </div>
                <div>
                  <div className="text-[9px] text-relic-mist dark:text-relic-slate uppercase tracking-wider mb-1">tokens</div>
                  <div className="text-sm font-mono text-relic-slate dark:text-white">{stats.stats.tokens_consumed.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[9px] text-relic-mist dark:text-relic-slate uppercase tracking-wider mb-1">cost</div>
                  <div className="text-sm font-mono text-relic-slate dark:text-white">${stats.stats.cost_spent.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Methodology Usage */}
            <div className="bg-white dark:bg-relic-void/50 border border-relic-mist dark:border-relic-slate/30 p-4">
              <div className="text-[10px] text-relic-silver dark:text-relic-ghost uppercase tracking-[0.2em] mb-3">methodology usage</div>
              <div className="space-y-2">
                {stats.methodologyStats.map((method: any) => (
                  <div key={method.methodology} className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="font-mono text-relic-slate dark:text-white uppercase w-12">{method.methodology}</span>
                      <div className="flex-1 bg-relic-ghost dark:bg-relic-slate/20 h-[1px]">
                        <div
                          className="bg-relic-slate dark:bg-relic-ghost h-[1px] transition-all duration-500"
                          style={{
                            width: `${(method.count / stats.stats.queries_completed) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-relic-silver dark:text-relic-ghost font-mono ml-3">
                      <span>{method.count}</span>
                      <span>{method.tokens.toLocaleString()}</span>
                      <span>${method.cost.toFixed(3)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Points System */}
            <div className="bg-relic-ghost dark:bg-relic-slate/20 border border-relic-mist dark:border-relic-slate/30 p-4">
              <div className="text-[10px] text-relic-silver dark:text-relic-ghost uppercase tracking-[0.2em] mb-2">points system</div>
              <div className="text-[10px] text-relic-silver dark:text-relic-ghost leading-relaxed space-y-1">
                <div>• 1 pt per query</div>
                <div>• bonus for advanced methods</div>
                <div>• tournaments coming soon</div>
              </div>
            </div>

            {/* Recent Activity */}
            {stats.recentActivity && stats.recentActivity.length > 0 && (
              <div className="bg-white dark:bg-relic-void/50 border border-relic-mist dark:border-relic-slate/30 p-4">
                <div className="text-[10px] text-relic-silver dark:text-relic-ghost uppercase tracking-[0.2em] mb-3">recent 30d</div>
                <div className="space-y-1">
                  {stats.recentActivity.slice(0, 10).map((activity: any) => (
                    <div key={activity.date} className="flex items-center justify-between text-[9px] font-mono">
                      <span className="text-relic-slate dark:text-white">{activity.date}</span>
                      <div className="flex items-center gap-3 text-relic-silver dark:text-relic-ghost">
                        <span>{activity.queries}q</span>
                        <span>{activity.tokens.toLocaleString()}t</span>
                        <span>${activity.cost.toFixed(3)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mini Visualizations */}
            <div className="grid grid-cols-2 gap-4">
              {/* Mini Sefirot */}
              <div className="bg-white dark:bg-relic-void/50 border border-relic-mist dark:border-relic-slate/30 p-4 relative group">
                <div className="flex items-center justify-center min-h-[180px]">
                  <SefirotMini
                    activations={{
                      1: stats.developmentLevel >= 1 ? 1 : 0,
                      2: stats.developmentLevel >= 2 ? 0.8 : 0,
                      3: stats.developmentLevel >= 3 ? 0.6 : 0,
                      4: stats.developmentLevel >= 4 ? 0.6 : 0,
                      5: stats.developmentLevel >= 5 ? 0.4 : 0,
                      6: stats.developmentLevel >= 6 ? 0.4 : 0,
                      7: stats.developmentLevel >= 7 ? 0.2 : 0,
                      8: stats.developmentLevel >= 8 ? 0.8 : 0,
                      9: stats.developmentLevel >= 9 ? 0.8 : 0,
                      10: stats.developmentLevel >= 10 ? 1 : 0,
                      11: 0, // Da'at
                    }}
                    userLevel={stats.developmentLevel}
                    onExpand={() => {
                      // TODO: Open full Sefirot visualization
                      console.log('[Profile] Expand Sefirot visualization')
                    }}
                  />
                </div>
              </div>

              {/* Mini Topics Map */}
              <div className="bg-white dark:bg-relic-void/50 border border-relic-mist dark:border-relic-slate/30 p-4">
                <div className="text-[10px] text-relic-silver dark:text-relic-ghost uppercase tracking-[0.2em] mb-3">topics map</div>
                <button
                  onClick={() => setShowTopicsPanel(true)}
                  className="w-full h-32 border border-relic-mist dark:border-relic-slate/30 hover:border-relic-slate dark:hover:border-relic-ghost transition-colors flex flex-col items-center justify-center gap-2"
                >
                  <div className="text-2xl text-relic-silver dark:text-relic-ghost">○</div>
                  <div className="text-[9px] text-relic-silver dark:text-relic-ghost">view topics</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-relic-void/50 border border-relic-mist dark:border-relic-slate/30 p-8 font-mono">
            {/* Header */}
            <div className="mb-10">
              <div className="text-relic-void dark:text-white text-sm mb-2 tracking-wide">◇ SETTINGS</div>
              <div className="text-relic-mist dark:text-relic-slate text-[10px]">─────────────────────────────────────────</div>
            </div>

            {/* APPEARANCE */}
            <section className="mb-8">
              <div className="text-relic-slate dark:text-relic-ghost text-[10px] uppercase tracking-[0.2em] mb-3">▸ APPEARANCE</div>

              <div className="ml-4 space-y-2.5">
                {/* Font Size */}
                <div className="flex items-center gap-4">
                  <span className="text-relic-silver dark:text-relic-ghost text-[9px] w-20">font size</span>
                  <div className="flex gap-2.5">
                    {(['sm', 'md', 'lg'] as const).map((size) => (
                      <span
                        key={size}
                        onClick={() => updateAppearance('fontSize', size)}
                        className="text-[9px] cursor-pointer transition-colors"
                        style={{ color: settings.appearance.fontSize === size ? (document.documentElement.classList.contains('dark') ? '#ffffff' : '#18181b') : '#94a3b8' }}
                      >
                        {settings.appearance.fontSize === size ? '●' : '○'} {size}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Compact */}
                <div className="flex items-center gap-4">
                  <span className="text-relic-silver dark:text-relic-ghost text-[9px] w-20">compact</span>
                  <span
                    onClick={() => updateAppearance('compactView', !settings.appearance.compactView)}
                    className="text-[9px] cursor-pointer hover:text-relic-void dark:hover:text-white transition-colors text-relic-slate dark:text-relic-ghost"
                  >
                    [{settings.appearance.compactView ? '●' : '○'}] {settings.appearance.compactView ? 'on' : 'off'}
                  </span>
                </div>
              </div>
            </section>

            {/* METHODOLOGY */}
            <section className="mb-8">
              <div className="text-relic-slate text-[10px] uppercase tracking-[0.2em] mb-3">▸ METHODOLOGY</div>

              <div className="ml-4 space-y-2.5">
                {/* Default Method */}
                <div className="flex items-start gap-4">
                  <span className="text-relic-silver text-[9px] w-20 pt-0.5">default</span>
                  <div className="flex flex-wrap gap-2">
                    {(['auto', 'direct', 'cod', 'bot', 'react', 'pot', 'gtp'] as const).map((method) => (
                      <span
                        key={method}
                        onClick={() => updateMethodology('defaultMethod', method)}
                        className="text-[9px] cursor-pointer transition-colors"
                        style={{ color: settings.methodology.defaultMethod === method ? '#18181b' : '#94a3b8' }}
                      >
                        {settings.methodology.defaultMethod === method ? '●' : '○'} {method}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Auto-route */}
                <div className="flex items-center gap-4">
                  <span className="text-relic-silver text-[9px] w-20">auto-route</span>
                  <span
                    onClick={() => updateMethodology('autoRoute', !settings.methodology.autoRoute)}
                    className="text-[9px] cursor-pointer hover:text-relic-void transition-colors text-relic-slate"
                  >
                    [{settings.methodology.autoRoute ? '●' : '○'}] {settings.methodology.autoRoute ? 'on' : 'off'}
                  </span>
                </div>

                {/* Indicator */}
                <div className="flex items-center gap-4">
                  <span className="text-relic-silver text-[9px] w-20">indicator</span>
                  <span
                    onClick={() => updateMethodology('showIndicator', !settings.methodology.showIndicator)}
                    className="text-[9px] cursor-pointer hover:text-relic-void transition-colors text-relic-slate"
                  >
                    [{settings.methodology.showIndicator ? '●' : '○'}] {settings.methodology.showIndicator ? 'show' : 'hide'}
                  </span>
                </div>
              </div>
            </section>

            {/* FEATURES */}
            <section className="mb-8">
              <div className="text-relic-slate text-[10px] uppercase tracking-[0.2em] mb-3">▸ FEATURES</div>

              <div className="ml-4 space-y-2.5">
                {/* Depth */}
                <div className="flex items-center gap-4">
                  <span className="text-relic-silver text-[9px] w-20">depth</span>
                  <div className="flex items-center gap-5">
                    <span
                      onClick={() => updateFeatures('depth', !settings.features.depth)}
                      className="text-[9px] cursor-pointer hover:text-relic-void transition-colors text-relic-slate"
                    >
                      [{settings.features.depth ? '●' : '○'}] {settings.features.depth ? 'on' : 'off'}
                    </span>
                    {settings.features.depth && (
                      <div className="flex gap-2.5 items-center">
                        <span className="text-relic-silver text-[9px]">density:</span>
                        {(['min', 'std', 'max'] as const).map((density) => (
                          <span
                            key={density}
                            onClick={() => updateFeatures('depthDensity', density)}
                            className="text-[9px] cursor-pointer transition-colors"
                            style={{ color: settings.features.depthDensity === density ? '#18181b' : '#94a3b8' }}
                          >
                            {settings.features.depthDensity === density ? '●' : '○'} {density}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Side Canal */}
                <div className="flex items-center gap-4">
                  <span className="text-relic-silver text-[9px] w-20">side canal</span>
                  <span
                    onClick={() => updateFeatures('sideCanal', !settings.features.sideCanal)}
                    className="text-[9px] cursor-pointer hover:text-relic-void transition-colors text-relic-slate"
                  >
                    [{settings.features.sideCanal ? '●' : '○'}] {settings.features.sideCanal ? 'on' : 'off'}
                  </span>
                </div>

                {/* Mind Map */}
                <div className="flex items-center gap-4">
                  <span className="text-relic-silver text-[9px] w-20">mind map</span>
                  <span
                    onClick={() => updateFeatures('mindMap', !settings.features.mindMap)}
                    className="text-[9px] cursor-pointer hover:text-relic-void transition-colors text-relic-slate"
                  >
                    [{settings.features.mindMap ? '●' : '○'}] {settings.features.mindMap ? 'on' : 'off'}
                  </span>
                </div>

                {/* Quickchat */}
                <div className="flex items-center gap-4">
                  <span className="text-relic-silver text-[9px] w-20">quickchat</span>
                  <span className="text-relic-mist text-[9px]">⌘⇧Q</span>
                </div>
              </div>
            </section>

            {/* AI MODEL */}
            <section className="mb-8">
              <div className="text-relic-slate dark:text-relic-ghost text-[10px] uppercase tracking-[0.2em] mb-3">▸ AI MODEL</div>

              <div className="ml-4 space-y-2.5">
                {/* Primary Model */}
                <div className="flex items-start gap-4">
                  <span className="text-relic-silver dark:text-relic-ghost text-[9px] w-20 pt-0.5">primary</span>
                  <div className="flex gap-3">
                    {[
                      { id: 'claude-opus-4-5-20251101', label: 'opus 4.5', cost: '$0.075/q' },
                      { id: 'claude-3-5-haiku-20241022', label: 'haiku', cost: '$0.007/q' }
                    ].map((model) => (
                      <span
                        key={model.id}
                        onClick={() => {
                          // Update model config via settings store
                          const newConfig = { ...settings.modelConfig, motherBase: model.id }
                          // Save to localStorage directly for now
                          localStorage.setItem('akhai-primary-model', model.id)
                        }}
                        className="text-[9px] cursor-pointer transition-colors group"
                        style={{ color: (settings.modelConfig?.motherBase || 'claude-opus-4-5-20251101') === model.id ? (document.documentElement.classList.contains('dark') ? '#ffffff' : '#18181b') : '#94a3b8' }}
                      >
                        {(settings.modelConfig?.motherBase || 'claude-opus-4-5-20251101') === model.id ? '●' : '○'} {model.label}
                        <span className="text-relic-silver/50 ml-1">{model.cost}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Legend Mode */}
                <div className="flex items-center gap-4">
                  <span className="text-relic-silver dark:text-relic-ghost text-[9px] w-20">legend mode</span>
                  <span
                    onClick={() => {
                      const current = localStorage.getItem('legendMode') === 'true'
                      localStorage.setItem('legendMode', String(!current))
                      window.location.reload()
                    }}
                    className="text-[9px] cursor-pointer hover:text-relic-void dark:hover:text-white transition-colors text-relic-slate dark:text-relic-ghost"
                  >
                    [{localStorage.getItem('legendMode') === 'true' ? '●' : '○'}] {localStorage.getItem('legendMode') === 'true' ? 'on' : 'off'}
                    <span className="text-relic-silver/50 ml-2">premium R&D features</span>
                  </span>
                </div>
              </div>
            </section>

            {/* PRIVACY */}
            <section className="mb-8">
              <div className="text-relic-slate text-[10px] uppercase tracking-[0.2em] mb-3">▸ PRIVACY</div>

              <div className="ml-4 space-y-2.5">
                {/* History */}
                <div className="flex items-center gap-4">
                  <span className="text-relic-silver text-[9px] w-20">history</span>
                  <span
                    onClick={() => updatePrivacy('saveHistory', !settings.privacy.saveHistory)}
                    className="text-[9px] cursor-pointer hover:text-relic-void transition-colors text-relic-slate"
                  >
                    [{settings.privacy.saveHistory ? '●' : '○'}] {settings.privacy.saveHistory ? 'save' : 'off'}
                  </span>
                </div>

                {/* Analytics */}
                <div className="flex items-center gap-4">
                  <span className="text-relic-silver text-[9px] w-20">analytics</span>
                  <span
                    onClick={() => updatePrivacy('analytics', !settings.privacy.analytics)}
                    className="text-[9px] cursor-pointer hover:text-relic-void transition-colors text-relic-slate"
                  >
                    [{settings.privacy.analytics ? '●' : '○'}] {settings.privacy.analytics ? 'on' : 'off'}
                  </span>
                </div>

                {/* Clear all data */}
                <div className="flex items-center gap-4">
                  <span className="text-relic-silver text-[9px] w-20"></span>
                  <span
                    onClick={() => {
                      if (confirm('Clear all data? This cannot be undone.')) {
                        clearAllData()
                      }
                    }}
                    className="text-relic-silver text-[9px] cursor-pointer hover:text-relic-void transition-colors"
                  >
                    ▹ clear all data
                  </span>
                </div>
              </div>
            </section>

            {/* SOCIAL CONNECTORS */}
            <section className="mb-8">
              <div className="text-relic-slate text-[10px] uppercase tracking-[0.2em] mb-3">▸ SOCIAL CONNECTORS</div>
              <div className="ml-4 space-y-3">
                <div className="text-relic-silver text-[9px] mb-2">
                  Connect social accounts to enable intelligence analysis of threads, videos, and content
                </div>

                {/* X (Twitter) */}
                <div className="py-2 border-b border-relic-mist">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                      <span className="text-relic-slate text-[10px] font-medium">X (Twitter)</span>
                      <span className="text-relic-silver text-[9px]">
                        {user.social_connections?.find(c => c.platform === 'x')?.username
                          ? `@${user.social_connections.find(c => c.platform === 'x')?.username}`
                          : 'No connection needed'}
                      </span>
                    </div>
                    <span className="text-[9px] text-relic-silver">
                      ✓ URL analysis works
                    </span>
                  </div>
                  <div className="text-[8px] text-relic-silver/70 ml-0">
                    Note: X OAuth requires Twitter Basic tier ($100/mo). URL fetching works without connection.
                  </div>
                </div>

                {/* Telegram */}
                <div className="flex items-center justify-between py-2 border-b border-relic-mist">
                  <div className="flex items-center gap-3">
                    <span className="text-relic-slate text-[10px] font-medium">Telegram</span>
                    <span className="text-relic-silver text-[9px]">Not connected</span>
                  </div>
                  <button
                    onClick={() => {
                      // TODO: Telegram bot auth
                      console.log('[Profile] Connect Telegram')
                    }}
                    className="text-[9px] text-relic-silver hover:text-relic-void transition-colors"
                  >
                    ● connect
                  </button>
                </div>

                {/* GitHub */}
                <div className="flex items-center justify-between py-2 border-b border-relic-mist">
                  <div className="flex items-center gap-3">
                    <span className="text-relic-slate text-[10px] font-medium">GitHub</span>
                    <span className="text-relic-silver text-[9px]">
                      {user.github_username ? `@${user.github_username}` : 'Not connected'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (user.github_username) {
                        // Disconnect
                        console.log('[Profile] Disconnect GitHub')
                      } else {
                        // Connect via OAuth
                        window.location.href = '/api/auth/github'
                      }
                    }}
                    className="text-[9px] text-relic-silver hover:text-relic-void transition-colors"
                  >
                    {user.github_username ? '○ disconnect' : '● connect'}
                  </button>
                </div>

                {/* Reddit */}
                <div className="flex items-center justify-between py-2 border-b border-relic-mist">
                  <div className="flex items-center gap-3">
                    <span className="text-relic-slate text-[10px] font-medium">Reddit</span>
                    <span className="text-relic-silver text-[9px]">Not connected</span>
                  </div>
                  <button
                    onClick={() => {
                      console.log('[Profile] Connect Reddit')
                    }}
                    className="text-[9px] text-relic-silver hover:text-relic-void transition-colors"
                  >
                    ● connect
                  </button>
                </div>

                {/* Mastodon */}
                <div className="flex items-center justify-between py-2 border-b border-relic-mist">
                  <div className="flex items-center gap-3">
                    <span className="text-relic-slate text-[10px] font-medium">Mastodon</span>
                    <span className="text-relic-silver text-[9px]">Not connected</span>
                  </div>
                  <button
                    onClick={() => {
                      console.log('[Profile] Connect Mastodon')
                    }}
                    className="text-[9px] text-relic-silver hover:text-relic-void transition-colors"
                  >
                    ● connect
                  </button>
                </div>

                {/* YouTube */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <span className="text-relic-slate text-[10px] font-medium">YouTube</span>
                    <span className="text-relic-silver text-[9px]">Not connected</span>
                  </div>
                  <button
                    onClick={() => {
                      console.log('[Profile] Connect YouTube')
                    }}
                    className="text-[9px] text-relic-silver hover:text-relic-void transition-colors"
                  >
                    ● connect
                  </button>
                </div>
              </div>
            </section>

            {/* ACCOUNT */}
            <section className="mb-8">
              <div className="text-relic-slate text-[10px] uppercase tracking-[0.2em] mb-3">▸ ACCOUNT</div>

              <div className="ml-4 space-y-2.5">
                {/* Tier */}
                <div className="flex items-center gap-4">
                  <span className="text-relic-silver text-[9px] w-20">tier</span>
                  <span className="text-relic-void text-[9px] font-medium">{settings.account.tier}</span>
                </div>

                {/* Queries */}
                <div className="flex items-center gap-4">
                  <span className="text-relic-silver text-[9px] w-20">queries</span>
                  <span className="text-relic-slate text-[9px]">{settings.account.queriesUsedToday} today</span>
                </div>

                {/* Tokens */}
                <div className="flex items-center gap-4">
                  <span className="text-relic-silver text-[9px] w-20">tokens</span>
                  <span className="text-relic-slate text-[9px]">{settings.account.tokensUsed.toLocaleString()} used</span>
                </div>

                {/* Upgrade */}
                <div className="flex items-center gap-4">
                  <span className="text-relic-silver text-[9px] w-20"></span>
                  <a
                    href="/pricing"
                    className="text-relic-silver text-[9px] cursor-pointer hover:text-relic-void transition-colors"
                  >
                    ▹ upgrade to pro
                  </a>
                </div>
              </div>
            </section>

            {/* Footer */}
            <div className="mt-12 pt-5 border-t border-relic-mist">
              <div className="text-relic-mist text-[10px] mb-1.5">─────────────────────────────────────────</div>
              <div className="text-relic-silver text-[9px]">◈ powered by akhai intelligence</div>
            </div>
          </div>
        )}

        {/* Console Tab */}
        {activeTab === 'console' && (
          <div>
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-16 mb-12 pb-10 border-b border-relic-mist">
              <StatCard title="TOTAL QUERIES" value={stats?.stats?.queries_completed || 0} subtitle="This month" />
              <StatCard title="ACTIVE SESSIONS" value="0" subtitle="Currently running" />
              <StatCard title="API CALLS" value={stats?.stats?.queries_completed || 0} subtitle="Last 24 hours" />
            </div>

            {/* Recent Activity */}
            <div className="mb-12 pb-10 border-b border-relic-mist">
              <h2 className="text-sm font-mono text-relic-void mb-5">Recent Activity</h2>
              <div className="space-y-3">
                {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                  stats.recentActivity.slice(0, 5).map((activity: any) => (
                    <ActivityItem
                      key={activity.date}
                      action={`${activity.queries} queries executed`}
                      time={activity.date}
                      status="success"
                    />
                  ))
                ) : (
                  <ActivityItem
                    action="Query executed"
                    time="No recent activity"
                    status="idle"
                  />
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-sm font-mono text-relic-void mb-5">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-x-16 gap-y-5">
                <ActionCard
                  title="Start New Query"
                  description="Run a query with akhai sovereign intelligence"
                  href="/"
                />
                <ActionCard
                  title="View Documentation"
                  description="Learn about methodologies and features"
                  href="/philosophy"
                />
                <ActionCard
                  title="Transaction History"
                  description="Review your payment history"
                  href="/profile?tab=transactions"
                />
                <ActionCard
                  title="Development Stats"
                  description="Check your usage analytics"
                  href="/profile?tab=development"
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Topics Panel */}
      <TopicsPanel
        isOpen={showTopicsPanel}
        onClose={() => setShowTopicsPanel(false)}
        onOpenMindMap={() => {
          // TODO: Phase 3 - Mind Map integration
          console.log('[Profile] Mind Map requested from TopicsPanel')
        }}
      />

      {/* Suggestion Toast */}
      {suggestions.length > 0 && (
        <SuggestionToast
          suggestions={suggestions}
          onRemoveSuggestion={(id) => {
            setSuggestions(prev => prev.filter(s => s.id !== id))
          }}
          onSuggestionClick={(suggestion) => {
            // Open topics panel when suggestion clicked
            setShowTopicsPanel(true)
          }}
        />
      )}
    </div>
  )
}

// Console Tab Components
function StatCard({ title, value, subtitle }: { title: string; value: string | number; subtitle: string }) {
  return (
    <div>
      <div className="text-[9px] font-mono text-relic-silver uppercase tracking-wider mb-2">
        {title}
      </div>
      <div className="text-3xl font-mono text-relic-void mb-1 tracking-tight leading-none">{value}</div>
      <div className="text-[11px] font-mono text-relic-slate">{subtitle}</div>
    </div>
  )
}

function ActivityItem({
  action,
  time,
  status,
}: {
  action: string
  time: string
  status: 'idle' | 'success' | 'error'
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-relic-silver font-mono text-xs mt-0.5">·</div>
      <div className="flex-1">
        <div className="text-xs font-mono text-relic-void">{action}</div>
        <div className="text-[11px] font-mono text-relic-slate mt-0.5">{time}</div>
      </div>
    </div>
  )
}

function ActionCard({
  title,
  description,
  href,
}: {
  title: string
  description: string
  href: string
}) {
  return (
    <a
      href={href}
      className="block border-b border-relic-mist pb-3 hover:border-relic-slate transition-colors"
    >
      <h3 className="text-xs font-mono text-relic-void mb-1.5">{title}</h3>
      <p className="text-[11px] font-mono text-relic-slate leading-relaxed">{description}</p>
    </a>
  )
}
