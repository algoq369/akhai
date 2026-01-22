'use client'

import { useEffect, useState } from 'react'
import { useDashboardStore } from '@/lib/stores/dashboard-store'
import DarkModeToggle from '@/components/DarkModeToggle'

// Force dynamic rendering to avoid prerender errors
export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  const { stats, loading, error, fetchStats } = useDashboardStore()
  const [enabledProviders, setEnabledProviders] = useState<Record<string, boolean>>({
    anthropic: true,
    deepseek: true,
    xai: true,
    mistral: true,
  })
  const [enabledMethods, setEnabledMethods] = useState<Record<string, boolean>>({
    auto: true,
    direct: true,
    cod: true,
    bot: true,
    react: true,
    pot: true,
    gtp: true,
  })
  const [enabledFeatures, setEnabledFeatures] = useState<Record<string, boolean>>({
    guard: true,
    suggestions: true,
    sidecanal: true,
    realtime: true,
    warnings: true,
  })

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 10000)
    return () => clearInterval(interval)
  }, [fetchStats])

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-white dark:bg-relic-void flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-slate-200 dark:border-relic-slate/30 border-t-slate-600 dark:border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  const providers = [
    { key: 'anthropic', name: 'Anthropic Claude', model: 'claude-opus-4-5-20251101', active: stats?.providers?.anthropic?.status === 'active' },
    { key: 'deepseek', name: 'DeepSeek', model: 'deepseek-chat', active: stats?.providers?.deepseek?.status === 'active' },
    { key: 'xai', name: 'Grok', model: 'grok-3', active: stats?.providers?.xai?.status === 'active' },
    { key: 'mistral', name: 'Mistral AI', model: 'mistral-small-latest', active: stats?.providers?.mistral?.status === 'active' },
  ]

  const methodologies = [
    { key: 'auto', name: 'Auto', desc: 'Smart routing' },
    { key: 'direct', name: 'Direct', desc: 'Single AI instant' },
    { key: 'cod', name: 'Chain of Draft', desc: 'Iterative refinement' },
    { key: 'bot', name: 'Buffer of Thoughts', desc: 'Context reasoning' },
    { key: 'react', name: 'ReAct', desc: 'Search & calculate' },
    { key: 'pot', name: 'Program of Thought', desc: 'Code computation' },
    { key: 'gtp', name: 'GTP Consensus', desc: 'Multi-AI agreement' },
  ]

  const features = [
    { key: 'guard', name: 'Grounding Guard', desc: 'Anti-hallucination' },
    { key: 'suggestions', name: 'Smart Suggestions', desc: 'Query recommendations' },
    { key: 'sidecanal', name: 'Side Canal', desc: 'Topic extraction' },
    { key: 'realtime', name: 'Real-time Data', desc: 'Live prices & news' },
    { key: 'warnings', name: 'Interactive Warnings', desc: 'Quality alerts' },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-relic-void">
      {/* Header */}
      <header className="border-b border-slate-100 dark:border-relic-slate/30">
        <div className="max-w-xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-[10px] text-slate-400 dark:text-relic-ghost hover:text-slate-600 dark:hover:text-white">← akhai</a>
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

        {/* Providers */}
        <Section title="AI Providers">
          {providers.map((p) => (
            <ToggleRow
              key={p.key}
              label={p.name}
              sublabel={p.model}
              active={p.active}
              enabled={enabledProviders[p.key]}
              onToggle={() => setEnabledProviders(prev => ({ ...prev, [p.key]: !prev[p.key] }))}
            />
          ))}
        </Section>

        {/* Methodologies */}
        <Section title="Methodologies">
          {methodologies.map((m) => (
            <ToggleRow
              key={m.key}
              label={m.name}
              sublabel={m.desc}
              active={true}
              enabled={enabledMethods[m.key]}
              onToggle={() => setEnabledMethods(prev => ({ ...prev, [m.key]: !prev[m.key] }))}
            />
          ))}
        </Section>

        {/* Features */}
        <Section title="Features">
          {features.map((f) => (
            <ToggleRow
              key={f.key}
              label={f.name}
              sublabel={f.desc}
              active={true}
              enabled={enabledFeatures[f.key]}
              onToggle={() => setEnabledFeatures(prev => ({ ...prev, [f.key]: !prev[f.key] }))}
            />
          ))}
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-relic-ghost mb-3">{title}</h2>
      <div className="divide-y divide-slate-100 dark:divide-relic-slate/30">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-slate-600 dark:text-relic-silver">{label}</span>
      <span className="text-sm text-slate-900 dark:text-white font-mono">{value}</span>
    </div>
  )
}

function ToggleRow({
  label,
  sublabel,
  active,
  enabled,
  onToggle
}: {
  label: string
  sublabel: string
  active: boolean
  enabled: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-2.5">
        <span className={`w-1.5 h-1.5 rounded-full ${active && enabled ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-relic-slate/50'}`} />
        <div>
          <span className="text-sm text-slate-700 dark:text-relic-silver">{label}</span>
          <span className="text-xs text-slate-400 dark:text-relic-ghost ml-2">{sublabel}</span>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-8 h-[18px] rounded-full transition-colors ${
          enabled ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-relic-slate/50'
        }`}
      >
        <span className={`absolute top-0.5 w-[14px] h-[14px] bg-white rounded-full shadow-sm transition-transform ${
          enabled ? 'translate-x-[14px]' : 'translate-x-0.5'
        }`} />
      </button>
    </div>
  )
}
