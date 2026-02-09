'use client'

import { useState } from 'react'
import { Message } from '@/lib/chat-store'

/**
 * INTELLIGENCE BADGE COMPONENT
 *
 * Displays Intelligence Fusion metadata from responses:
 * - Methodology badge with Layers-aware reason
 * - Confidence score visual
 * - Guard status indicator (green/yellow/red)
 * - Active Instinct lenses as tags
 * - Expandable Intelligence Details panel
 */

interface IntelligenceBadgeProps {
  intelligence: Message['intelligence']
  methodology?: string
  selectionReason?: string
  className?: string
}

// Lens symbols for display - 7 Hermetic Lenses
const LENS_SYMBOLS: Record<string, { symbol: string; color: string; name: string }> = {
  exoteric: { symbol: '◯', color: '#fbbf24', name: 'Exoteric (outer/literal)' },
  mesoteric: { symbol: '◎', color: '#c084fc', name: 'Mesoteric (middle/symbolic)' },
  esoteric: { symbol: '●', color: '#22d3ee', name: 'Esoteric (inner/mystical)' },
  hermetic: { symbol: '☿', color: '#fb923c', name: 'Hermetic (alchemical)' },
  orphic: { symbol: '♪', color: '#facc15', name: 'Orphic (musical/harmonic)' },
  prophetic: { symbol: '◈', color: '#60a5fa', name: 'Prophetic (visionary)' },
  initiatic: { symbol: '△', color: '#f87171', name: 'Initiatic (transformative)' },
}

// Methodology display names
const METHODOLOGY_NAMES: Record<string, string> = {
  direct: 'Direct',
  cod: 'Chain of Draft',
  bot: 'Buffer of Thoughts',
  react: 'ReAct',
  pot: 'Program of Thought',
  gtp: 'Generative Thoughts',
  auto: 'Auto',
}

// Guard status colors
const GUARD_COLORS = {
  proceed: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  warn: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  block: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
}

export function IntelligenceBadge({
  intelligence,
  methodology,
  selectionReason,
  className = ''
}: IntelligenceBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!intelligence) return null

  const {
    analysis,
    methodologySelection,
    guard,
    instinct,
    processing,
    timing,
  } = intelligence

  const guardStatus = guard?.recommendation || 'proceed'
  const guardColors = GUARD_COLORS[guardStatus]
  const confidence = methodologySelection?.confidence ?? 0
  const selectedMethod = methodologySelection?.selected || methodology || 'direct'

  return (
    <div className={`font-mono text-[10px] ${className}`}>
      {/* Compact Badge Row - Subtle Footer */}
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Methodology Badge with Confidence */}
        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-relic-ghost dark:bg-relic-void/40 border border-relic-mist/50 dark:border-relic-slate/30 rounded">
          <span className="text-relic-slate dark:text-relic-ghost font-medium">
            {METHODOLOGY_NAMES[selectedMethod] || selectedMethod}
          </span>
          <span className="text-relic-mist dark:text-relic-slate">|</span>
          <span className="text-relic-silver">
            {Math.round(confidence * 100)}%
          </span>
        </div>

        {/* Guard Status Indicator */}
        <div
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${
            guardStatus === 'proceed'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/30'
              : guardStatus === 'warn'
              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/30'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30'
          }`}
          title={`Guard: ${guardStatus}${guard?.reasons?.length ? ` - ${guard.reasons.join(', ')}` : ''}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${
            guardStatus === 'proceed' ? 'bg-green-500' :
            guardStatus === 'warn' ? 'bg-amber-500' : 'bg-red-500'
          }`} />
          <span className={`${
            guardStatus === 'proceed' ? 'text-green-700 dark:text-green-400' :
            guardStatus === 'warn' ? 'text-amber-700 dark:text-amber-400' :
            'text-red-700 dark:text-red-400'
          }`}>
            {guardStatus === 'proceed' ? '✓' : guardStatus === 'warn' ? '⚠' : '✕'}
          </span>
        </div>

        {/* Complexity Badge - Only show if significant */}
        {analysis && analysis.complexity > 0.3 && (
          <div
            className="px-1.5 py-0.5 bg-relic-ghost dark:bg-relic-void/40 border border-relic-mist/50 dark:border-relic-slate/30 rounded text-relic-silver"
            title={`Query type: ${analysis.queryType}`}
          >
            {Math.round(analysis.complexity * 100)}%
          </div>
        )}

        {/* Thinking Budget - Only show if extended */}
        {processing && processing.extendedThinkingBudget > 3000 && (
          <div
            className="px-1.5 py-0.5 bg-relic-ghost dark:bg-relic-void/40 border border-relic-mist/50 dark:border-relic-slate/30 rounded text-relic-silver"
            title="Extended thinking token budget"
          >
            {(processing.extendedThinkingBudget / 1000).toFixed(0)}K
          </div>
        )}

        {/* Timing - Subtle */}
        {timing && (
          <span className="text-relic-mist dark:text-relic-silver/50 ml-auto">
            {timing.fusionMs}ms
          </span>
        )}

        {/* Expand Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-1 py-0.5 text-relic-mist hover:text-relic-slate dark:hover:text-relic-ghost transition-colors"
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {/* Active Lenses - Inline */}
      {instinct?.enabled && instinct.activeLenses.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 mt-1.5">
          {instinct.activeLenses.map(lensId => {
            const lens = LENS_SYMBOLS[lensId]
            if (!lens) return null
            return (
              <span
                key={lensId}
                className="text-[9px] text-relic-silver"
                title={lens.name}
              >
                {lens.symbol}
              </span>
            )
          })}
        </div>
      )}

      {/* Selection Reason (if provided) */}
      {selectionReason && (
        <div className="text-relic-mist text-[9px] mt-1 italic">
          {selectionReason}
        </div>
      )}

      {/* Expanded Details Panel */}
      {isExpanded && (
        <div className="mt-2 p-3 bg-relic-ghost/50 dark:bg-relic-void/30 border border-relic-mist/30 dark:border-relic-slate/20 rounded space-y-3">
          {/* Query Analysis */}
          {analysis && (
            <div>
              <div className="text-relic-silver uppercase tracking-wider text-[8px] mb-1">
                Query Analysis
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="text-relic-silver">Type:</span>{' '}
                  <span className="text-relic-slate dark:text-relic-ghost">{analysis.queryType}</span>
                </div>
                <div>
                  <span className="text-relic-silver">Complexity:</span>{' '}
                  <span className="text-relic-slate dark:text-relic-ghost">{Math.round(analysis.complexity * 100)}%</span>
                </div>
              </div>
              {analysis.keywords?.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {analysis.keywords.slice(0, 8).map((kw, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 bg-relic-ghost dark:bg-relic-void/40 border border-relic-mist/50 dark:border-relic-slate/30 rounded text-relic-silver text-[9px]"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Methodology Alternatives */}
          {methodologySelection?.alternatives && methodologySelection.alternatives.length > 0 && (
            <div>
              <div className="text-relic-silver uppercase tracking-wider text-[8px] mb-1">
                Methodology Alternatives
              </div>
              <div className="space-y-1">
                {methodologySelection.alternatives.slice(0, 4).map((alt, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px]">
                    <span className="text-relic-silver w-20">
                      {METHODOLOGY_NAMES[alt.methodology] || alt.methodology}
                    </span>
                    <div className="flex-1 h-1 bg-relic-mist dark:bg-relic-slate/30 rounded overflow-hidden">
                      <div
                        className="h-full bg-relic-slate dark:bg-relic-ghost"
                        style={{ width: `${Math.max(alt.score * 100, 5)}%` }}
                      />
                    </div>
                    <span className="text-relic-silver w-10 text-right">
                      {Math.round(alt.score * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Guard Details */}
          {guard && (
            <div>
              <div className="text-relic-silver uppercase tracking-wider text-[8px] mb-1">
                Guard Assessment
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className={`px-1.5 py-0.5 rounded ${
                  guardStatus === 'proceed'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : guardStatus === 'warn'
                    ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                }`}>
                  {guardStatus.toUpperCase()}
                </span>
                {guard.reasons?.length > 0 && (
                  <span className="text-relic-silver">
                    {guard.reasons.join(' • ')}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Processing Info */}
          {processing && (
            <div>
              <div className="text-relic-silver uppercase tracking-wider text-[8px] mb-1">
                Processing
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div>
                  <span className="text-relic-silver">Mode:</span>{' '}
                  <span className="text-relic-slate dark:text-relic-ghost">{processing.mode}</span>
                </div>
                <div>
                  <span className="text-relic-silver">Think:</span>{' '}
                  <span className="text-relic-slate dark:text-relic-ghost">{processing.extendedThinkingBudget.toLocaleString()} tokens</span>
                </div>
                {timing && (
                  <div>
                    <span className="text-relic-silver">Fusion:</span>{' '}
                    <span className="text-relic-slate dark:text-relic-ghost">{timing.fusionMs}ms</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default IntelligenceBadge
