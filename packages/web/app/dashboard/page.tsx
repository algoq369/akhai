'use client';

import { useEffect } from 'react';
import { MODELS, ADVISORS } from '@/lib/models';
import { useDashboardStore } from '@/lib/stores/dashboard-store';
import DarkModeToggle from '@/components/DarkModeToggle';

// Force dynamic rendering to avoid prerender errors
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const { stats, loading, error, fetchStats } = useDashboardStore();

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-white dark:bg-relic-void flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-slate-200 dark:border-relic-slate/30 border-t-slate-600 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-white dark:bg-relic-void">
      {/* Header */}
      <header className="border-b border-slate-100 dark:border-relic-slate/30">
        <div className="max-w-xl mx-auto px-6 py-4 flex items-center justify-between">
          <a
            href="/"
            className="text-[10px] text-slate-400 dark:text-relic-ghost hover:text-slate-600 dark:hover:text-white"
          >
            ← akhai
          </a>
          <DarkModeToggle />
        </div>
      </header>

      <div className="max-w-xl mx-auto px-6 py-8">
        {/* Title */}
        <h1 className="text-base font-medium text-slate-900 dark:text-white mb-8">Settings</h1>

        {/* Stats */}
        <Section title="Usage">
          <Row label="Queries today" value={stats?.queriesToday || 0} />
          <Row label="Queries this month" value={stats?.queriesThisMonth || 0} />
          <Row label="Total tokens" value={(stats?.totalTokens || 0).toLocaleString()} />
          <Row label="Total cost" value={`$${(stats?.totalCost || 0).toFixed(2)}`} />
        </Section>

      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-relic-ghost mb-3">
        {title}
      </h2>
      <div className="divide-y divide-slate-100 dark:divide-relic-slate/30">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-slate-600 dark:text-relic-silver">{label}</span>
      <span className="text-sm text-slate-900 dark:text-white font-mono">{value}</span>
    </div>
  );
}

