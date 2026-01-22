/**
 * Loading Skeleton Components
 * Provides visual feedback during data loading
 */

export function MessageSkeleton() {
  return (
    <div className="animate-pulse space-y-3 py-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-relic-ghost dark:bg-relic-slate/20 rounded-full" />
        <div className="flex-1">
          <div className="h-4 bg-relic-ghost dark:bg-relic-slate/20 rounded w-24 mb-2" />
          <div className="h-3 bg-relic-ghost dark:bg-relic-slate/20 rounded w-32" />
        </div>
      </div>

      {/* Content lines */}
      <div className="space-y-2 pl-11">
        <div className="h-4 bg-relic-ghost dark:bg-relic-slate/20 rounded w-full" />
        <div className="h-4 bg-relic-ghost dark:bg-relic-slate/20 rounded w-11/12" />
        <div className="h-4 bg-relic-ghost dark:bg-relic-slate/20 rounded w-10/12" />
        <div className="h-4 bg-relic-ghost dark:bg-relic-slate/20 rounded w-9/12" />
      </div>
    </div>
  )
}

export function SefirotDashboardSkeleton() {
  return (
    <div className="animate-pulse p-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-6 bg-relic-ghost dark:bg-relic-slate/20 rounded w-48" />
        <div className="h-4 bg-relic-ghost dark:bg-relic-slate/20 rounded w-96" />
      </div>

      {/* Tree visualization */}
      <div className="flex justify-center py-12">
        <div className="relative w-64 h-96 bg-relic-ghost dark:bg-relic-slate/20 rounded-lg" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 bg-relic-ghost dark:bg-relic-slate/20 rounded space-y-2">
            <div className="h-4 bg-relic-ghost dark:bg-relic-slate/30 rounded w-24" />
            <div className="h-8 bg-relic-ghost dark:bg-relic-slate/30 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function MindMapSkeleton() {
  return (
    <div className="animate-pulse flex items-center justify-center w-full h-[600px]">
      <div className="relative w-full h-full bg-relic-ghost dark:bg-relic-slate/20 rounded-lg">
        {/* Fake nodes */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-32 h-32 bg-relic-ghost dark:bg-relic-slate/30 rounded-full" />
        </div>
        <div className="absolute top-1/4 left-1/4">
          <div className="w-24 h-24 bg-relic-ghost dark:bg-relic-slate/30 rounded-full" />
        </div>
        <div className="absolute top-3/4 right-1/4">
          <div className="w-24 h-24 bg-relic-ghost dark:bg-relic-slate/30 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="animate-pulse p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-8 bg-relic-ghost dark:bg-relic-slate/20 rounded w-48" />
        <div className="h-10 bg-relic-ghost dark:bg-relic-slate/20 rounded w-32" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-6 bg-relic-ghost dark:bg-relic-slate/20 rounded space-y-3">
            <div className="h-4 bg-relic-ghost dark:bg-relic-slate/30 rounded w-20" />
            <div className="h-10 bg-relic-ghost dark:bg-relic-slate/30 rounded w-24" />
            <div className="h-3 bg-relic-ghost dark:bg-relic-slate/30 rounded w-16" />
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="h-64 bg-relic-ghost dark:bg-relic-slate/20 rounded" />

      {/* Table */}
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-relic-ghost dark:bg-relic-slate/20 rounded" />
        ))}
      </div>
    </div>
  )
}

export function HistorySkeleton() {
  return (
    <div className="animate-pulse space-y-3 p-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-start gap-4 p-4 bg-relic-ghost dark:bg-relic-slate/20 rounded">
          <div className="w-12 h-12 bg-relic-ghost dark:bg-relic-slate/30 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-relic-ghost dark:bg-relic-slate/30 rounded w-3/4" />
            <div className="h-3 bg-relic-ghost dark:bg-relic-slate/30 rounded w-1/2" />
            <div className="h-3 bg-relic-ghost dark:bg-relic-slate/30 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function QueryLoadingSkeleton() {
  return (
    <div className="flex items-center gap-3 py-4 animate-pulse">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-relic-slate dark:bg-relic-ghost rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-relic-slate dark:bg-relic-ghost rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-relic-slate dark:bg-relic-ghost rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-xs text-relic-silver dark:text-relic-ghost font-mono">
        Processing...
      </span>
    </div>
  )
}
