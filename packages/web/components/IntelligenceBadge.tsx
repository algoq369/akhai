'use client'

import { useState } from 'react'
import { Message } from '@/lib/chat-store'

/**
 * INTELLIGENCE BADGE COMPONENT
 *
 * Displays Intelligence Fusion metadata from responses:
 * - Methodology badge with Sefirot-aware reason
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

// Lens symbols for display
const LENS_SYMBOLS: Record<string, { symbol: string; color: string; name: string }> = {
  exoteric: { symbol: '◯', color: '#fbbf24', name: 'Exoteric' },
  esoteric: { symbol: '◉', color: '#c084fc', name: 'Esoteric' },
  gnostic: { symbol: '⊙', color: '#22d3ee', name: 'Gnostic' },
  hermetic: { symbol: '☿', color: '#fb923c', name: 'Hermetic' },
  kabbalistic: { symbol: '✡', color: '#facc15', name: 'Kabbalistic' },
  alchemical: { symbol: '⚗', color: '#f87171', name: 'Alchemical' },
  prophetic: { symbol: '◈', color: '#60a5fa', name: 'Prophetic' },
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
    <div className={`font-mono text-xs ${className}`}>
      {/* Compact Badge Row */}
      <div className="flex flex-wrap items-center gap-2 mb-1">
        {/* Methodology Badge with Confidence */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-zinc-800/60 border border-zinc-700/50 rounded">
          <span className="text-cyan-400 font-medium">
            {METHODOLOGY_NAMES[selectedMethod] || selectedMethod}
          </span>
          <span className="text-zinc-500">|</span>
          <span className="text-zinc-400">
            {Math.round(confidence * 100)}%
          </span>
        </div>

        {/* Guard Status Indicator */}
        <div
          className={`flex items-center gap-1 px-2 py-0.5 rounded border ${guardColors.bg} ${guardColors.border}`}
          title={`Guard: ${guardStatus}${guard?.reasons?.length ? ` - ${guard.reasons.join(', ')}` : ''}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${
            guardStatus === 'proceed' ? 'bg-emerald-400' :
            guardStatus === 'warn' ? 'bg-amber-400' : 'bg-red-400'
          }`} />
          <span className={guardColors.text}>
            {guardStatus === 'proceed' ? 'OK' : guardStatus.toUpperCase()}
          </span>
        </div>

        {/* Complexity Badge */}
        {analysis && (
          <div
            className="px-2 py-0.5 bg-purple-500/15 border border-purple-500/25 rounded text-purple-300"
            title={`Query type: ${analysis.queryType}`}
          >
            {Math.round(analysis.complexity * 100)}% complex
          </div>
        )}

        {/* Thinking Budget */}
        {processing && (
          <div
            className="px-2 py-0.5 bg-blue-500/15 border border-blue-500/25 rounded text-blue-300"
            title="Extended thinking token budget"
          >
            {(processing.extendedThinkingBudget / 1000).toFixed(0)}K think
          </div>
        )}

        {/* Expand Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-2 py-0.5 bg-zinc-700/50 hover:bg-zinc-700 border border-zinc-600/50 rounded text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {isExpanded ? '▼' : '▶'} Details
        </button>
      </div>

      {/* Active Lenses */}
      {instinct?.enabled && instinct.activeLenses.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 mb-2">
          <span className="text-zinc-500 mr-1">Lenses:</span>
          {instinct.activeLenses.map(lensId => {
            const lens = LENS_SYMBOLS[lensId]
            if (!lens) return null
            return (
              <span
                key={lensId}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px]"
                style={{
                  backgroundColor: `${lens.color}15`,
                  border: `1px solid ${lens.color}30`,
                  color: lens.color
                }}
                title={lens.name}
              >
                <span>{lens.symbol}</span>
                <span>{lens.name}</span>
              </span>
            )
          })}
        </div>
      )}

      {/* Selection Reason (if provided) */}
      {selectionReason && (
        <div className="text-zinc-500 text-[10px] mb-2 italic">
          {selectionReason}
        </div>
      )}

      {/* Expanded Details Panel */}
      {isExpanded && (
        <div className="mt-2 p-3 bg-zinc-900/80 border border-zinc-700/50 rounded-lg space-y-3">
          {/* Query Analysis */}
          {analysis && (
            <div>
              <div className="text-zinc-400 uppercase tracking-wider text-[10px] mb-1">
                Query Analysis
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-zinc-500">Type:</span>{' '}
                  <span className="text-cyan-300">{analysis.queryType}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Complexity:</span>{' '}
                  <span className="text-purple-300">{Math.round(analysis.complexity * 100)}%</span>
                </div>
              </div>
              {analysis.keywords?.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {analysis.keywords.slice(0, 8).map((kw, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-400 text-[10px]"
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
              <div className="text-zinc-400 uppercase tracking-wider text-[10px] mb-1">
                Methodology Alternatives
              </div>
              <div className="space-y-1">
                {methodologySelection.alternatives.slice(0, 4).map((alt, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px]">
                    <span className="text-zinc-500 w-20">
                      {METHODOLOGY_NAMES[alt.methodology] || alt.methodology}
                    </span>
                    <div className="flex-1 h-1.5 bg-zinc-800 rounded overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-zinc-600 to-zinc-500"
                        style={{ width: `${Math.max(alt.score * 100, 5)}%` }}
                      />
                    </div>
                    <span className="text-zinc-500 w-10 text-right">
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
              <div className="text-zinc-400 uppercase tracking-wider text-[10px] mb-1">
                Guard Assessment
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className={`px-2 py-0.5 rounded ${guardColors.bg} ${guardColors.text}`}>
                  {guardStatus.toUpperCase()}
                </span>
                {guard.reasons?.length > 0 && (
                  <span className="text-zinc-500">
                    {guard.reasons.join(' • ')}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Processing Info */}
          {processing && (
            <div>
              <div className="text-zinc-400 uppercase tracking-wider text-[10px] mb-1">
                Processing
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div>
                  <span className="text-zinc-500">Mode:</span>{' '}
                  <span className="text-blue-300">{processing.mode}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Think:</span>{' '}
                  <span className="text-blue-300">{processing.extendedThinkingBudget.toLocaleString()} tokens</span>
                </div>
                {timing && (
                  <div>
                    <span className="text-zinc-500">Fusion:</span>{' '}
                    <span className="text-emerald-300">{timing.fusionMs}ms</span>
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
