'use client';

import { useEffect } from 'react';
import { useDashboardStore } from '@/lib/stores/dashboard-store';
import StatCard from '@/components/StatCard';
import ProviderCard from '@/components/ProviderCard';
import RecentQueriesList from '@/components/RecentQueriesList';
import { LiquidEther } from '@/components/ui/LiquidEther';
import { DecryptedTitle } from '@/components/ui/DecryptedText';

export default function DashboardPage() {
  const { stats, loading, error, fetchStats } = useDashboardStore();

  useEffect(() => {
    // Initial fetch
    fetchStats();

    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchStats, 5000);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading && !stats) {
    return (
      <>
        <LiquidEther />
        <div className="min-h-screen pt-16 flex items-center justify-center relative">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="text-gray-500 mt-4 text-sm">Loading dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <LiquidEther />
        <div className="min-h-screen pt-16 flex items-center justify-center relative">
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 backdrop-blur-sm">
            <h3 className="text-white font-semibold mb-2 text-sm">Error</h3>
            <p className="text-gray-400 text-sm">{error}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <LiquidEther />
      <div className="min-h-screen pt-16 relative">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <DecryptedTitle
              text="Dashboard"
              className="text-2xl font-bold text-white"
              speed={20}
            />
            <p className="text-gray-500 text-sm mt-1 font-light">
              Monitor your AkhAI usage and performance
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatCard
              title="Queries Today"
              value={stats?.queriesToday || 0}
            />
            <StatCard
              title="Queries This Month"
              value={stats?.queriesThisMonth || 0}
            />
            <StatCard
              title="Total Tokens"
              value={stats?.totalTokens?.toLocaleString() || '0'}
            />
            <StatCard
              title="Total Cost"
              value={`$${stats?.totalCost.toFixed(2) || '0.00'}`}
            />
          </div>

          {/* Performance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-800">
              <h2 className="text-sm font-medium text-gray-300 mb-3">
                Performance
              </h2>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Avg Response Time</span>
                <span className="text-xl font-semibold text-white font-mono">
                  {stats?.avgResponseTime || 0}s
                </span>
              </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-800">
              <h2 className="text-sm font-medium text-gray-300 mb-3">
                Success Rate
              </h2>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Completed Queries</span>
                <span className="text-xl font-semibold text-white font-mono">
                  {(stats?.queriesToday || 0) > 0 ? '100%' : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Provider Status */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-800 mb-6">
            <h2 className="text-sm font-medium text-gray-300 mb-3">
              Provider Status
            </h2>
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

          {/* Recent Queries */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-800">
            <h2 className="text-sm font-medium text-gray-300 mb-3">
              Recent Queries
            </h2>
            <RecentQueriesList />
          </div>
        </div>
      </div>
    </>
  );
}
