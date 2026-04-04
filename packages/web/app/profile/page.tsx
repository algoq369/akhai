'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SuggestionToast from '@/components/SuggestionToast';
import TopicsPanel from '@/components/TopicsPanel';
import { useSettingsStore } from '@/lib/stores/settings-store';
import DarkModeToggle from '@/components/DarkModeToggle';
import TransactionsTab from './TransactionsTab';
import DevelopmentTab from './DevelopmentTab';
import SettingsTab from './SettingsTab';
import ConsoleTab from './ConsoleTab';

// Force dynamic rendering to avoid prerender errors
export const dynamic = 'force-dynamic';

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  pay_currency: string | null;
  status: string;
  created_at: number;
  payment_type: 'crypto' | 'stripe' | 'btcpay';
}

interface SocialConnection {
  platform: 'x' | 'telegram' | 'github' | 'reddit' | 'mastodon' | 'youtube';
  user_id: string;
  username: string;
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  connected_at: number;
}

interface UserProfile {
  id: string;
  github_username?: string;
  github_email?: string;
  wallet_address?: string;
  created_at: number;
  last_login: number;
  social_connections?: SocialConnection[];
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'profile' | 'transactions' | 'development' | 'settings' | 'console'
  >('profile');
  const [showTopicsPanel, setShowTopicsPanel] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [oauthMessage, setOauthMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [oauthLoading, setOauthLoading] = useState(false);
  const {
    settings,
    updateAppearance,
    updateMethodology,
    updateFeatures,
    updatePrivacy,
    clearAllData,
  } = useSettingsStore();

  useEffect(() => {
    // Check URL params for tab selection and OAuth messages
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (
      tabParam === 'development' ||
      tabParam === 'transactions' ||
      tabParam === 'profile' ||
      tabParam === 'settings' ||
      tabParam === 'console'
    ) {
      setActiveTab(tabParam as any);
    }

    // Check for OAuth callback messages
    const connected = params.get('connected');
    const username = params.get('username');
    const error = params.get('error');

    if (connected && username) {
      setOauthMessage({
        type: 'success',
        text: `Successfully connected ${connected.toUpperCase()} account: @${username}`,
      });
      // Set to settings tab to show the new connection
      setActiveTab('settings');
      // Clear URL params
      window.history.replaceState({}, '', '/profile?tab=settings');
      // Auto-hide after 10 seconds
      setTimeout(() => setOauthMessage(null), 10000);

      // Refetch profile to show new connection
      fetch('/api/profile')
        .then((res) => res.json())
        .then((data) => setUser(data.user))
        .catch((err) => console.error('Failed to refetch profile:', err));
    } else if (error) {
      setOauthMessage({
        type: 'error',
        text: `Connection failed: ${decodeURIComponent(error)}`,
      });
      setActiveTab('settings');
      window.history.replaceState({}, '', '/profile?tab=settings');
      setTimeout(() => setOauthMessage(null), 10000);
    }
  }, []);

  // Listen for OAuth success messages from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) return;

      if (event.data && event.data.type === 'oauth-success') {
        const { platform, username } = event.data;
        setOauthMessage({
          type: 'success',
          text: `Successfully connected ${platform.toUpperCase()} account${username ? ` as @${username}` : ''}`,
        });
        setTimeout(() => setOauthMessage(null), 5000);

        // Reload profile data to show new connection
        window.location.reload();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    // Check session via API instead of manually parsing cookies
    const loadProfile = async () => {
      try {
        // First check if user is logged in
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();

        if (!sessionData.user) {
          // Not logged in, redirect to home
          console.log('[Profile] No active session, redirecting to home');
          router.push('/');
          return;
        }

        // User is logged in, fetch profile data
        const [profileRes, transactionsRes, statsRes] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/profile/transactions'),
          fetch('/api/profile/stats'),
        ]);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setUser(profileData.user);
        } else if (profileRes.status === 401) {
          // Unauthorized, redirect to home
          router.push('/');
          return;
        }

        if (transactionsRes.ok) {
          const transactionsData = await transactionsRes.json();
          setTransactions(transactionsData.transactions || []);
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      } catch (error) {
        console.error('[Profile] Failed to load profile:', error);
        // On error, redirect to home
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'confirmed':
        return 'text-green-600 bg-green-50';
      case 'pending':
      case 'waiting':
        return 'text-amber-600 bg-amber-50';
      case 'failed':
      case 'expired':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  /**
   * Handle connecting a social account
   */
  const handleConnectSocial = async (
    platform: 'x' | 'telegram' | 'reddit' | 'mastodon' | 'youtube'
  ) => {
    // Prevent duplicate calls
    if (oauthLoading) {
      console.log('[Profile] OAuth already in progress, ignoring duplicate call');
      return;
    }

    setOauthLoading(true);
    try {
      if (platform === 'x') {
        // Twitter OAuth flow
        const response = await fetch('/api/auth/social/x/connect');
        const data = await response.json();

        if (!response.ok) {
          setOauthMessage({
            type: 'error',
            text: data.message || 'Failed to initiate Twitter OAuth',
          });
          setTimeout(() => setOauthMessage(null), 5000);
          setOauthLoading(false);
          return;
        }

        console.log('[Profile] Redirecting to OAuth:', data.authUrl);

        // Use full-page redirect instead of popup (Twitter blocks popups)
        window.location.href = data.authUrl;
        // Keep loading state during redirect
      } else {
        // Other platforms not yet implemented
        setOauthMessage({
          type: 'error',
          text: `${platform.toUpperCase()} integration coming soon`,
        });
        setTimeout(() => setOauthMessage(null), 3000);
        setOauthLoading(false);
      }
    } catch (error) {
      console.error('[Profile] Failed to connect social:', error);
      setOauthMessage({
        type: 'error',
        text: 'Failed to connect account',
      });
      setTimeout(() => setOauthMessage(null), 5000);
      setOauthLoading(false);
    }
  };

  /**
   * Handle disconnecting a social account
   */
  const handleDisconnectSocial = async (
    platform: 'x' | 'telegram' | 'github' | 'reddit' | 'mastodon' | 'youtube'
  ) => {
    if (!confirm(`Are you sure you want to disconnect your ${platform.toUpperCase()} account?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/auth/social/disconnect?platform=${platform}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        setOauthMessage({
          type: 'error',
          text: data.error || 'Failed to disconnect account',
        });
        setTimeout(() => setOauthMessage(null), 5000);
        return;
      }

      // Update user state to remove the connection
      setUser((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          social_connections: prev.social_connections?.filter((c) => c.platform !== platform),
        };
      });

      setOauthMessage({
        type: 'success',
        text: `Successfully disconnected ${platform.toUpperCase()} account`,
      });
      setTimeout(() => setOauthMessage(null), 3000);
    } catch (error) {
      console.error('[Profile] Failed to disconnect social:', error);
      setOauthMessage({
        type: 'error',
        text: 'Failed to disconnect account',
      });
      setTimeout(() => setOauthMessage(null), 5000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-relic-void dark:to-relic-void/90 flex items-center justify-center">
        <div className="text-sm text-slate-400 dark:text-relic-ghost">Loading profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-relic-void dark:to-relic-void/90 flex items-center justify-center">
        <div className="text-center">
          <div className="text-sm text-slate-400 dark:text-relic-ghost mb-4">
            Please log in to view your profile
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-slate-700 dark:bg-relic-slate text-white text-sm rounded-md hover:bg-slate-800 dark:hover:bg-relic-slate/80 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-relic-void dark:to-relic-void/90">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-relic-slate/30 bg-white/80 dark:bg-relic-void/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-sm font-mono text-slate-400 dark:text-relic-ghost hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              ← back
            </button>
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
          <div
            className={`px-4 py-3 rounded-md text-[10px] ${
              oauthMessage.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}
          >
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
              <div className="text-[9px] uppercase tracking-[0.2em] text-relic-silver dark:text-relic-ghost mb-1">
                user id
              </div>
              <div className="text-[10px] font-mono text-relic-slate dark:text-relic-ghost">
                {user.id}
              </div>
            </div>

            {user.github_username && (
              <div>
                <div className="text-[9px] uppercase tracking-[0.2em] text-relic-silver dark:text-relic-ghost mb-1">
                  github
                </div>
                <div className="text-[10px] text-relic-slate dark:text-relic-ghost">
                  @{user.github_username}
                </div>
                {user.github_email && (
                  <div className="text-[9px] text-relic-silver dark:text-relic-ghost mt-1">
                    {user.github_email}
                  </div>
                )}
              </div>
            )}

            {user.wallet_address && (
              <div>
                <div className="text-[9px] uppercase tracking-[0.2em] text-relic-silver dark:text-relic-ghost mb-1">
                  wallet
                </div>
                <div className="text-[9px] font-mono text-relic-slate dark:text-relic-ghost break-all bg-relic-ghost dark:bg-relic-slate/20 p-2">
                  {user.wallet_address}
                </div>
              </div>
            )}

            <div className="flex gap-6 pt-3 border-t border-relic-mist dark:border-relic-slate/30">
              <div>
                <div className="text-[9px] uppercase tracking-wider text-relic-silver dark:text-relic-ghost mb-1">
                  joined
                </div>
                <div className="text-[10px] text-relic-slate dark:text-relic-ghost">
                  {formatDate(user.created_at)}
                </div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wider text-relic-silver dark:text-relic-ghost mb-1">
                  last seen
                </div>
                <div className="text-[10px] text-relic-slate dark:text-relic-ghost">
                  {formatDate(user.last_login)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <TransactionsTab
            transactions={transactions}
            formatDate={formatDate}
            getStatusColor={getStatusColor}
          />
        )}

        {/* Development Tab */}
        {activeTab === 'development' && stats && (
          <DevelopmentTab stats={stats} setShowTopicsPanel={setShowTopicsPanel} />
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <SettingsTab
            settings={settings}
            user={user}
            updateAppearance={updateAppearance}
            updateMethodology={updateMethodology}
            updateFeatures={updateFeatures}
            updatePrivacy={updatePrivacy}
            clearAllData={clearAllData}
          />
        )}

        {/* Console Tab */}
        {activeTab === 'console' && (
          <div>
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-16 mb-12 pb-10 border-b border-relic-mist">
              <StatCard
                title="TOTAL QUERIES"
                value={stats?.stats?.queries_completed || 0}
                subtitle="This month"
              />
              <StatCard title="ACTIVE SESSIONS" value="0" subtitle="Currently running" />
              <StatCard
                title="API CALLS"
                value={stats?.stats?.queries_completed || 0}
                subtitle="Last 24 hours"
              />
            </div>

            {/* Recent Activity */}
            <div className="mb-12 pb-10 border-b border-relic-mist">
              <h2 className="text-sm font-mono text-relic-void mb-5">Recent Activity</h2>
              <div className="space-y-3">
                {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                  stats.recentActivity
                    .slice(0, 5)
                    .map((activity: any) => (
                      <ActivityItem
                        key={activity.date}
                        action={`${activity.queries} queries executed`}
                        time={activity.date}
                        status="success"
                      />
                    ))
                ) : (
                  <ActivityItem action="Query executed" time="No recent activity" status="idle" />
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
          console.log('[Profile] Mind Map requested from TopicsPanel');
        }}
      />

      {/* Suggestion Toast */}
      {suggestions.length > 0 && (
        <SuggestionToast
          suggestions={suggestions}
          onRemoveSuggestion={(id) => {
            setSuggestions((prev) => prev.filter((s) => s.id !== id));
          }}
          onSuggestionClick={(suggestion) => {
            // Open topics panel when suggestion clicked
            setShowTopicsPanel(true);
          }}
        />
      )}
    </div>
  );
}

// Console Tab Components
function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle: string;
}) {
  return (
    <div>
      <div className="text-[9px] font-mono text-relic-silver uppercase tracking-wider mb-2">
        {title}
      </div>
      <div className="text-3xl font-mono text-relic-void mb-1 tracking-tight leading-none">
        {value}
      </div>
      <div className="text-[11px] font-mono text-relic-slate">{subtitle}</div>
    </div>
  );
}

function ActivityItem({
  action,
  time,
  status,
}: {
  action: string;
  time: string;
  status: 'idle' | 'success' | 'error';
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-relic-silver font-mono text-xs mt-0.5">·</div>
      <div className="flex-1">
        <div className="text-xs font-mono text-relic-void">{action}</div>
        <div className="text-[11px] font-mono text-relic-slate mt-0.5">{time}</div>
      </div>
    </div>
  );
}

function ActionCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="block border-b border-relic-mist pb-3 hover:border-relic-slate transition-colors"
    >
      <h3 className="text-xs font-mono text-relic-void mb-1.5">{title}</h3>
      <p className="text-[11px] font-mono text-relic-slate leading-relaxed">{description}</p>
    </a>
  );
}
