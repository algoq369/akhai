'use client'

/**
 * AntipatternBadge Component
 * Displays comprehensive anti-pattern detection with:
 * - Detection summary with trigger patterns
 * - Impact explanation (why it matters)
 * - Before/after purification comparison
 * - Layer configuration recommendations
 * - Educational content about the antipattern type
 *
 * Design: Code Relic aesthetic (grey/amber, professional, no emojis)
 */

import { useState } from 'react'
import { ChevronDown, ChevronRight, AlertTriangle, ArrowUp, ArrowDown, Info } from 'lucide-react'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface LayerAdjustment {
  layerNode: string  // Layer name (e.g., "Encoder", "Embedding")
  currentWeight: number
  suggestedWeight: number
  rationale: string
  impact: 'reduce' | 'increase' | 'maintain'
}

interface PillarRebalance {
  current: { left: number; middle: number; right: number }
  suggested: { left: number; middle: number; right: number }
  shifts: Array<{ pillar: 'left' | 'middle' | 'right'; direction: 'increase' | 'decrease'; amount: number }>
}

interface AuditExplanation {
  whatWasDetected: string
  whyItMatters: string
  howToFix: string
}

interface PurificationComparison {
  before: string
  after: string
  transformations: Array<{
    type: 'replace' | 'remove' | 'qualify'
    pattern: string
    replacement: string
  }>
}

interface AntipatternEducation {
  name: string
  description: string
  commonCauses: string[]
  aiManifestation: string
}

interface AntipatternCritique {
  severity: number
  triggers: {
    patterns: string[]
    count: number
  }
  audit: {
    layerAdjustments: LayerAdjustment[]
    pillarRebalance?: PillarRebalance
    explanation: AuditExplanation
    confidence: number
    priority: 'low' | 'medium' | 'high' | 'critical'
  }
  purificationActions: PurificationComparison | null
  antipatternEducation: AntipatternEducation
}

interface AntipatternBadgeProps {
  antipatternType: string
  severity: number
  critique: AntipatternCritique | null
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function AntipatternBadge({
  antipatternType,
  severity,
  critique
}: AntipatternBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Don't show if no critique data
  if (!critique) {
    return (
      <div className="mt-3 px-3 py-2 bg-amber-50 border border-amber-200/50 rounded-md">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span className="text-xs text-amber-800">
            Detected <span className="font-semibold capitalize">{antipatternType}</span> pattern (severity: {(severity * 100).toFixed(0)}%)
          </span>
        </div>
      </div>
    )
  }

  const { triggers, audit, purificationActions, antipatternEducation } = critique
  const severityPercent = (severity * 100).toFixed(0)
  const confidencePercent = (audit.confidence * 100).toFixed(0)

  // Priority colors
  const priorityColors = {
    low: 'text-slate-600 bg-slate-100',
    medium: 'text-amber-600 bg-amber-100',
    high: 'text-orange-600 bg-orange-100',
    critical: 'text-red-600 bg-red-100'
  }

  return (
    <div className="mt-3 border border-amber-200/50 rounded-lg overflow-hidden bg-white">
      {/* Collapsed Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 bg-amber-50 hover:bg-amber-100/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-amber-900 capitalize">
                {antipatternType} Pattern Detected
              </span>
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${priorityColors[audit.priority]}`}>
                {audit.priority.toUpperCase()}
              </span>
            </div>
            <span className="text-xs text-amber-700">
              Severity: {severityPercent}% • Confidence: {confidencePercent}% • {triggers.count} trigger{triggers.count > 1 ? 's' : ''}
            </span>
          </div>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-amber-600 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-5 h-5 text-amber-600 flex-shrink-0" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 py-4 space-y-4 border-t border-amber-200/30">

          {/* ═══════════════════════════════════════════════════ */}
          {/* SECTION 1: What Was Detected */}
          {/* ═══════════════════════════════════════════════════ */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              What Was Detected
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed mb-2">
              {audit.explanation.whatWasDetected}
            </p>
            {triggers.patterns.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {triggers.patterns.slice(0, 5).map((pattern, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 text-xs font-mono bg-slate-100 text-slate-700 rounded border border-slate-200"
                  >
                    {pattern}
                  </span>
                ))}
                {triggers.patterns.length > 5 && (
                  <span className="px-2 py-1 text-xs text-slate-500">
                    +{triggers.patterns.length - 5} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════ */}
          {/* SECTION 2: Why This Matters */}
          {/* ═══════════════════════════════════════════════════ */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Why This Matters
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed">
              {audit.explanation.whyItMatters}
            </p>
          </div>

          {/* ═══════════════════════════════════════════════════ */}
          {/* SECTION 3: Before/After Comparison (if available) */}
          {/* ═══════════════════════════════════════════════════ */}
          {purificationActions && (
            <div>
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Before/After Purification
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Before */}
                <div className="border border-red-200 rounded-md bg-red-50/30 p-3">
                  <div className="text-xs font-medium text-red-700 mb-1.5">BEFORE (Original)</div>
                  <p className="text-xs text-slate-700 font-mono leading-relaxed whitespace-pre-wrap">
                    {purificationActions.before}
                  </p>
                </div>
                {/* After */}
                <div className="border border-green-200 rounded-md bg-green-50/30 p-3">
                  <div className="text-xs font-medium text-green-700 mb-1.5">AFTER (Purified)</div>
                  <p className="text-xs text-slate-700 font-mono leading-relaxed whitespace-pre-wrap">
                    {purificationActions.after}
                  </p>
                </div>
              </div>
              {purificationActions.transformations.length > 0 && (
                <div className="mt-2 text-xs text-slate-600">
                  <span className="font-medium">Transformations:</span>{' '}
                  {purificationActions.transformations.map(t => t.type).join(', ')}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════ */}
          {/* SECTION 4: Recommended Layer Adjustments */}
          {/* ═══════════════════════════════════════════════════ */}
          {audit.layerAdjustments.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Recommended Layer Adjustments
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed mb-3">
                {audit.explanation.howToFix}
              </p>
              <div className="space-y-2">
                {audit.layerAdjustments.map((adj, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-2.5 bg-slate-50 border border-slate-200/50 rounded-md"
                  >
                    {/* Impact Icon */}
                    <div className="mt-0.5">
                      {adj.impact === 'increase' && (
                        <ArrowUp className="w-4 h-4 text-green-600" />
                      )}
                      {adj.impact === 'reduce' && (
                        <ArrowDown className="w-4 h-4 text-red-600" />
                      )}
                      {adj.impact === 'maintain' && (
                        <div className="w-4 h-4 rounded-full border-2 border-slate-400" />
                      )}
                    </div>

                    {/* Adjustment Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-sm font-semibold text-slate-900">
                          {adj.layerNode}
                        </span>
                        <span className="text-xs text-slate-600">
                          {(adj.currentWeight * 100).toFixed(0)}% → {(adj.suggestedWeight * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {adj.rationale}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pillar Rebalance Summary (if available) */}
              {audit.pillarRebalance && audit.pillarRebalance.shifts.length > 0 && (
                <div className="mt-3 p-3 bg-purple-50/50 border border-purple-200/50 rounded-md">
                  <div className="text-xs font-semibold text-purple-900 mb-2">
                    Pillar Balance Shifts
                  </div>
                  <div className="flex gap-3 text-xs">
                    {audit.pillarRebalance.shifts.map((shift, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <span className="capitalize text-slate-700">{shift.pillar}:</span>
                        <span className={shift.direction === 'increase' ? 'text-green-600' : 'text-red-600'}>
                          {shift.direction === 'increase' ? '+' : '-'}{(shift.amount * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════ */}
          {/* SECTION 5: Educational Content */}
          {/* ═══════════════════════════════════════════════════ */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-start gap-2 mb-2">
              <Info className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Learn More: {antipatternEducation.name}
              </h4>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed mb-3">
              {antipatternEducation.description}
            </p>

            <div className="space-y-2">
              <div>
                <div className="text-xs font-medium text-slate-600 mb-1">Common Causes:</div>
                <ul className="space-y-0.5 pl-4">
                  {antipatternEducation.commonCauses.map((cause, idx) => (
                    <li key={idx} className="text-xs text-slate-700 list-disc">
                      {cause}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="text-xs font-medium text-slate-600 mb-1">AI Manifestation:</div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {antipatternEducation.aiManifestation}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
