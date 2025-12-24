'use client'

import { useState } from 'react'
import type { GroundingAlert as AlertType } from '@akhai/core'

interface Props {
  alert: AlertType
  onRefine: () => void
  onContinue: () => void
  onPivot: () => void
  onDismiss: () => void
}

export function GroundingAlert({ alert, onRefine, onContinue, onPivot, onDismiss }: Props) {
  const [expanded, setExpanded] = useState(false)

  // Geometric symbols for each type
  const symbols: Record<string, string> = {
    hype: '△',
    echo: '◯',
    drift: '◇',
    factuality: '□',
  }

  // Severity border colors
  const severityBorder: Record<string, string> = {
    info: 'border-l-relic-silver',
    warning: 'border-l-relic-slate',
    critical: 'border-l-relic-void',
  }

  return (
    <div className="animate-fade-in my-6">
      <div className={`bg-relic-ghost/50 border-l-2 ${severityBorder[alert.severity]} p-6`}>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <span className="text-2xl text-relic-silver font-light">
              {symbols[alert.type]}
            </span>
            <div>
              <span className="text-xs uppercase tracking-widest text-relic-silver">
                {alert.type}
              </span>
              <p className="text-sm text-relic-slate mt-1 max-w-md">
                {alert.message}
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-relic-silver hover:text-relic-slate transition-colors text-xl"
          >
            ×
          </button>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 text-xs text-relic-silver hover:text-relic-slate transition-colors"
        >
          {expanded ? '− collapse' : '+ details'}
        </button>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-4 pl-10 space-y-4 animate-fade-in">
            {alert.evidence && alert.evidence.length > 0 && (
              <div>
                <span className="text-xs uppercase tracking-widest text-relic-silver">
                  evidence
                </span>
                <ul className="mt-2 space-y-1">
                  {alert.evidence.map((e, i) => (
                    <li key={i} className="text-xs text-relic-slate font-light">
                      → {e}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Confidence bar */}
            <div className="flex items-center gap-4">
              <span className="text-xs uppercase tracking-widest text-relic-silver">
                confidence
              </span>
              <div className="flex-1 max-w-32 h-px bg-relic-mist relative">
                <div
                  className="absolute left-0 top-0 h-full bg-relic-slate"
                  style={{ width: `${(alert.confidence || 0.5) * 100}%` }}
                />
              </div>
              <span className="text-xs text-relic-silver">
                {Math.round((alert.confidence || 0.5) * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-6 flex items-center gap-3">
          <button onClick={onRefine} className="relic-button">
            refine
          </button>
          <button onClick={onContinue} className="relic-button">
            continue
          </button>
          <button onClick={onPivot} className="relic-button">
            pivot
          </button>
        </div>
      </div>
    </div>
  )
}
