'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import DarkModeToggle from '@/components/DarkModeToggle'

// Force dynamic rendering to avoid prerender errors
export const dynamic = 'force-dynamic'

interface NavItem {
  name: string
  href: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navigation: NavSection[] = [
  {
    title: 'BUILD',
    items: [
      { name: 'Dashboard', href: '/console' },
      { name: 'Workbench', href: '/console/workbench' },
      { name: 'Files', href: '/console/files' },
    ],
  },
  {
    title: 'ANALYTICS',
    items: [
      { name: 'Cost', href: '/console/cost' },
      { name: 'Logs', href: '/console/logs' },
      { name: 'Queries', href: '/console/queries' },
    ],
  },
  {
    title: 'MANAGE',
    items: [
      { name: 'API Keys', href: '/console/api-keys' },
      { name: 'Settings', href: '/console/settings' },
    ],
  },
]

export default function ConsolePage() {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-white dark:bg-relic-void flex">
      {/* Sidebar */}
      <aside className="w-56 border-r border-relic-mist dark:border-relic-slate/30 bg-white dark:bg-relic-void/50">
        <div className="px-5 py-5 border-b border-relic-mist dark:border-relic-slate/30">
          <div className="flex items-center justify-between mb-3">
            <Link href="/" className="block">
              <div className="flex items-center gap-2">
                <span className="text-relic-void dark:text-white font-mono text-sm">◊</span>
                <span className="text-relic-void dark:text-white font-mono text-xs">akhai</span>
              </div>
            </Link>
            <DarkModeToggle />
          </div>
        </div>

        <nav className="px-3 pb-6">
          {navigation.map((section) => (
            <div key={section.title} className="mb-6">
              <h3 className="px-2 mb-2 text-[9px] font-mono text-relic-silver dark:text-relic-ghost uppercase tracking-wider">
                {section.title}
              </h3>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`
                          block px-2 py-1.5 text-xs font-mono transition-colors
                          ${
                            isActive
                              ? 'text-relic-void dark:text-white'
                              : 'text-relic-slate dark:text-relic-silver hover:text-relic-void dark:hover:text-white'
                          }
                        `}
                      >
                        {item.name}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 bg-white dark:bg-relic-void">
        <div className="max-w-6xl">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-base font-mono text-relic-void dark:text-white mb-1">Dashboard</h1>
            <p className="text-xs font-mono text-relic-slate dark:text-relic-silver">
              Welcome to your akhai console
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-16 mb-12 pb-10 border-b border-relic-mist dark:border-relic-slate/30">
            <StatCard title="TOTAL QUERIES" value="0" subtitle="This month" />
            <StatCard title="ACTIVE SESSIONS" value="0" subtitle="Currently running" />
            <StatCard title="API CALLS" value="0" subtitle="Last 24 hours" />
          </div>

          {/* Recent Activity */}
          <div className="mb-12 pb-10 border-b border-relic-mist dark:border-relic-slate/30">
            <h2 className="text-sm font-mono text-relic-void dark:text-white mb-5">Recent Activity</h2>
            <div className="space-y-3">
              <ActivityItem
                action="Query executed"
                time="No recent activity"
                status="idle"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-sm font-mono text-relic-void dark:text-white mb-5">Quick Actions</h2>
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
                title="Manage API Keys"
                description="Configure your API credentials"
                href="/console/api-keys"
              />
              <ActionCard
                title="Check Logs"
                description="Review your query history and analytics"
                href="/console/logs"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <div>
      <div className="text-[9px] font-mono text-relic-silver dark:text-relic-ghost uppercase tracking-wider mb-2">
        {title}
      </div>
      <div className="text-3xl font-mono text-relic-void dark:text-white mb-1 tracking-tight leading-none">{value}</div>
      <div className="text-[11px] font-mono text-relic-slate dark:text-relic-silver">{subtitle}</div>
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
      <div className="text-relic-silver dark:text-relic-ghost font-mono text-xs mt-0.5">·</div>
      <div className="flex-1">
        <div className="text-xs font-mono text-relic-void dark:text-white">{action}</div>
        <div className="text-[11px] font-mono text-relic-slate dark:text-relic-silver mt-0.5">{time}</div>
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
    <Link
      href={href}
      className="block border-b border-relic-mist dark:border-relic-slate/30 pb-3 hover:border-relic-slate dark:hover:border-relic-ghost transition-colors"
    >
      <h3 className="text-xs font-mono text-relic-void dark:text-white mb-1.5">{title}</h3>
      <p className="text-[11px] font-mono text-relic-slate dark:text-relic-silver leading-relaxed">{description}</p>
    </Link>
  )
}
