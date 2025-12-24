'use client'

import type { GroundingAlert } from '@akhai/core'

interface Props {
  alerts: GroundingAlert[]
  onSelect: (alert: GroundingAlert) => void
}

export function GroundingHistory({ alerts, onSelect }: Props) {
  if (alerts.length === 0) return null

  const symbols: Record<string, string> = {
    hype: '△',
    echo: '◯',
    drift: '◇',
    factuality: '□',
  }

  return (
    <div className="border-t border-relic-mist py-6">
      <h3 className="text-xs uppercase tracking-widest text-relic-silver mb-4">
        alert history
      </h3>
      <div className="space-y-1">
        {alerts.map((alert, i) => (
          <button
            key={i}
            onClick={() => onSelect(alert)}
            className="w-full flex items-center gap-3 p-3 hover:bg-relic-ghost/50 transition-colors text-left"
          >
            <span className="text-relic-silver">{symbols[alert.type]}</span>
            <span className="text-xs text-relic-slate flex-1 truncate">{alert.message}</span>
            <span className="text-xs text-relic-silver/50">{alert.severity}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
