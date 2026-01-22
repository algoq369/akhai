'use client'

import { useEffect } from 'react'
import { useImplementationStore } from '@/lib/stores/implementation-store'

export function ImplementationProgress() {
  const { progress, all, fetchAll, isLoading } = useImplementationStore()

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  if (isLoading || !progress) {
    return <div className="text-relic-silver dark:text-zinc-500 text-sm">Loading...</div>
  }

  const completionRate = progress.total > 0
    ? Math.round((progress.validated / progress.total) * 100)
    : 0

  return (
    <div className="bg-relic-white dark:bg-zinc-900 border border-relic-mist dark:border-zinc-700 p-4">
      <div className="text-[10px] uppercase tracking-wider text-relic-silver dark:text-zinc-500 mb-3">
        IMPLEMENTATION PROGRESS
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-relic-ghost dark:bg-zinc-800 mb-3">
        <div
          className="h-full bg-emerald-600 transition-all duration-500"
          style={{ width: completionRate + '%' }}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="text-center">
          <div className="text-xl font-mono text-emerald-600 dark:text-emerald-400">{progress.validated}</div>
          <div className="text-[9px] text-relic-silver dark:text-zinc-500 uppercase">Validated</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-mono text-amber-600 dark:text-amber-400">{progress.pending}</div>
          <div className="text-[9px] text-relic-silver dark:text-zinc-500 uppercase">Pending</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-mono text-blue-600 dark:text-blue-400">{progress.testing}</div>
          <div className="text-[9px] text-relic-silver dark:text-zinc-500 uppercase">Testing</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-mono text-red-600 dark:text-red-400">{progress.reverted}</div>
          <div className="text-[9px] text-relic-silver dark:text-zinc-500 uppercase">Reverted</div>
        </div>
      </div>

      {/* Recent Implementations */}
      <div className="text-[10px] uppercase tracking-wider text-relic-silver dark:text-zinc-500 mb-2">
        RECENT
      </div>
      <div className="space-y-1 max-h-40 overflow-auto">
        {all.slice(0, 10).map((impl) => (
          <div
            key={impl.id}
            className="flex items-center justify-between text-[11px] py-1 border-b border-relic-mist dark:border-zinc-800"
          >
            <span className="text-relic-void dark:text-zinc-300 truncate flex-1">{impl.featureName}</span>
            <span className={
              impl.status === 'validated' ? 'text-emerald-600 dark:text-emerald-500' :
              impl.status === 'pending' ? 'text-amber-600 dark:text-amber-500' :
              impl.status === 'testing' ? 'text-blue-600 dark:text-blue-500' :
              'text-red-600 dark:text-red-500'
            }>
              {impl.status.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
