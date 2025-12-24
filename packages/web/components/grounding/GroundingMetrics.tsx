'use client'

import type { GroundingAlert } from '@akhai/core'

interface Props {
  alert: GroundingAlert
}

export function GroundingMetrics({ alert }: Props) {
  return (
    <div className="bg-relic-ghost/30 p-4 font-mono">
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <span className="text-relic-silver uppercase tracking-widest">type</span>
          <p className="text-relic-slate mt-1">{alert.type}</p>
        </div>
        <div>
          <span className="text-relic-silver uppercase tracking-widest">severity</span>
          <p className="text-relic-slate mt-1">{alert.severity}</p>
        </div>
        <div>
          <span className="text-relic-silver uppercase tracking-widest">confidence</span>
          <p className="text-relic-slate mt-1">{Math.round((alert.confidence || 0) * 100)}%</p>
        </div>
        <div>
          <span className="text-relic-silver uppercase tracking-widest">evidence</span>
          <p className="text-relic-slate mt-1">{alert.evidence?.length || 0} items</p>
        </div>
      </div>
    </div>
  )
}
