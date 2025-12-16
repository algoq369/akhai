'use client';

import { useEffect, useState } from 'react';
import { LiquidEther } from '@/components/ui/LiquidEther';
import { DecryptedTitle } from '@/components/ui/DecryptedText';
import { useDashboardStore } from '@/lib/stores/dashboard-store';
import { useSettingsStore } from '@/lib/stores/settings-store';
import Link from 'next/link';

interface RecentQuery {
  id: string;
  query: string;
  methodology: string;
  tokens_used: number;
  cost: number;
  created_at: string;
}

export default function ProfilePage() {
  const { stats, loading: statsLoading, fetchStats } = useDashboardStore();
  const { settings, loadSettings, updateApiKey, saveSettings } = useSettingsStore();
  const [recentQueries, setRecentQueries] = useState<RecentQuery[]>([]);
  const [loadingQueries, setLoadingQueries] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [keyValues, setKeyValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchStats();
    loadSettings();
    fetchRecentQueries();
  }, [fetchStats, loadSettings]);

  const fetchRecentQueries = async () => {
    try {
      const res = await fetch('/api/history?limit=5');
      const data = await res.json();
      setRecentQueries(data.queries || []);
    } catch (error) {
      console.error('Failed to fetch recent queries:', error);
    } finally {
      setLoadingQueries(false);
    }
  };

  const handleEditKey = (provider: string) => {
    setEditingKey(provider);
    setKeyValues({
      ...keyValues,
      [provider]: settings.apiKeys[provider as keyof typeof settings.apiKeys] || '',
    });
  };

  const handleSaveKey = async (provider: string) => {
    setSaving(true);
    updateApiKey(provider as any, keyValues[provider]);
    await saveSettings();
    setSaving(false);
    setSaveSuccess(true);
    setEditingKey(null);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setKeyValues({});
  };

  const maskApiKey = (key: string) => {
    if (!key || key.length < 8) return '••••••••';
    return `${key.substring(0, 4)}••••${key.substring(key.length - 4)}`;
  };

  const getProviderStatus = (provider: string): 'active' | 'inactive' | 'error' => {
    if (!stats) return 'inactive';
    const providerStats = stats.providers[provider as keyof typeof stats.providers];
    return providerStats?.status || 'inactive';
  };

  return (
    <>
      <LiquidEther />
      <div className="min-h-screen pt-16 relative">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-8">
            <DecryptedTitle
              text="Profile"
              className="text-3xl font-bold text-white"
              speed={20}
            />
            <p className="text-gray-500 text-sm mt-2 font-light">
              Manage your API keys, usage, and preferences
            </p>
          </div>

          {/* Success Message */}
          {saveSuccess && (
            <div className="mb-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
              <p className="text-white text-sm flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Settings saved successfully!
              </p>
            </div>
          )}

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Usage Overview */}
            <div className="lg:col-span-1 space-y-6">
              {/* Usage Stats Card */}
              <div className="bg-gradient-to-br from-gray-900/90 to-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800 shadow-xl">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Usage Overview
                </h2>
                {statsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                      <span className="text-gray-400 text-sm">Today</span>
                      <span className="text-2xl font-bold text-white font-mono">{stats?.queriesToday || 0}</span>
                    </div>
                    <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                      <span className="text-gray-400 text-sm">This Month</span>
                      <span className="text-2xl font-bold text-white font-mono">{stats?.queriesThisMonth || 0}</span>
                    </div>
                    <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                      <span className="text-gray-400 text-sm">Total Tokens</span>
                      <span className="text-lg font-bold text-white font-mono">{stats?.totalTokens?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Total Cost</span>
                      <span className="text-2xl font-bold text-white font-mono">${stats?.totalCost.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                )}
                <Link
                  href="/dashboard"
                  className="mt-6 block w-full text-center py-2 text-sm text-gray-400 hover:text-white border border-gray-800 rounded-lg hover:bg-gray-800 transition-all"
                >
                  View Full Dashboard →
                </Link>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-gradient-to-br from-gray-900/90 to-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800 shadow-xl">
                <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
                <div className="space-y-2">
                  <Link
                    href="/"
                    className="block w-full py-3 px-4 text-sm text-white bg-white/10 hover:bg-white/20 rounded-lg transition-all text-center font-medium"
                  >
                    New Query
                  </Link>
                  <Link
                    href="/history"
                    className="block w-full py-3 px-4 text-sm text-gray-300 hover:text-white border border-gray-800 hover:bg-gray-800 rounded-lg transition-all text-center"
                  >
                    View History
                  </Link>
                  <Link
                    href="/settings"
                    className="block w-full py-3 px-4 text-sm text-gray-300 hover:text-white border border-gray-800 hover:bg-gray-800 rounded-lg transition-all text-center"
                  >
                    Advanced Settings
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Column - API Keys & Recent Activity */}
            <div className="lg:col-span-2 space-y-6">
              {/* API Keys Management */}
              <div className="bg-gradient-to-br from-gray-900/90 to-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800 shadow-xl">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  API Keys
                </h2>
                <div className="space-y-3">
                  {[
                    { provider: 'anthropic', label: 'Anthropic (Mother Base)', required: true },
                    { provider: 'deepseek', label: 'DeepSeek (Advisor)', required: true },
                    { provider: 'xai', label: 'Grok / xAI (Advisor)', required: true },
                    { provider: 'mistral', label: 'Mistral AI (Advisor)', required: true },
                  ].map(({ provider, label, required }) => {
                    const isEditing = editingKey === provider;
                    const status = getProviderStatus(provider);
                    const key = settings.apiKeys[provider as keyof typeof settings.apiKeys];

                    return (
                      <div
                        key={provider}
                        className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-xl border border-gray-700"
                      >
                        {/* Status Indicator */}
                        <div className="flex-shrink-0">
                          <div className={`w-3 h-3 rounded-full ${status === 'active' ? 'bg-white' : 'bg-gray-600'}`} />
                        </div>

                        {/* Provider Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white">{label}</p>
                            {required && <span className="text-xs text-gray-500">Required</span>}
                          </div>
                          {isEditing ? (
                            <input
                              type="password"
                              value={keyValues[provider] || ''}
                              onChange={(e) =>
                                setKeyValues({ ...keyValues, [provider]: e.target.value })
                              }
                              placeholder={`Enter ${label} API key`}
                              className="mt-2 w-full px-3 py-2 text-sm text-white bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:border-gray-500"
                            />
                          ) : (
                            <p className="text-sm text-gray-400 font-mono mt-1">
                              {key ? maskApiKey(key) : 'Not configured'}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleSaveKey(provider)}
                                disabled={saving}
                                className="px-3 py-1 text-xs text-black bg-white rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-all"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-3 py-1 text-xs text-gray-400 hover:text-white border border-gray-700 rounded-lg hover:bg-gray-800 transition-all"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleEditKey(provider)}
                              className="px-3 py-1 text-xs text-gray-400 hover:text-white border border-gray-700 rounded-lg hover:bg-gray-800 transition-all"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  API keys are stored securely and never exposed. Use the test buttons in Settings to verify connectivity.
                </p>
              </div>

              {/* Recent Queries */}
              <div className="bg-gradient-to-br from-gray-900/90 to-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800 shadow-xl">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Recent Activity
                </h2>
                {loadingQueries ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                  </div>
                ) : recentQueries.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">No recent queries</p>
                ) : (
                  <div className="space-y-3">
                    {recentQueries.map((query) => (
                      <Link
                        key={query.id}
                        href={`/query/${query.id}`}
                        className="block p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-gray-600 hover:bg-gray-800 transition-all"
                      >
                        <p className="text-sm text-white line-clamp-2 mb-2">{query.query}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">
                            {new Date(query.created_at).toLocaleDateString()} · {query.methodology?.toUpperCase() || 'DIRECT'}
                          </span>
                          <div className="flex items-center gap-3 text-gray-500">
                            <span>{query.tokens_used?.toLocaleString() || 0} tokens</span>
                            <span>${query.cost?.toFixed(3) || '0.000'}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                <Link
                  href="/history"
                  className="mt-4 block w-full text-center py-2 text-sm text-gray-400 hover:text-white border border-gray-800 rounded-lg hover:bg-gray-800 transition-all"
                >
                  View All History →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
