'use client';

import { StatCard, ActivityItem, ActionCard } from './ProfileHelpers';

interface ConsoleTabProps {
  stats: any;
}

export default function ConsoleTab({ stats }: ConsoleTabProps) {
  return (
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
  );
}
