'use client'

import { useState } from 'react'

interface GuardWarningProps {
  guardResult: {
    issues: string[]
    sanityViolations: string[]
    scores: {
      hype: number
      echo: number
      drift: number
      fact: number
    }
  }
  originalQuery: string
  onRefine: (refinedQuery?: string) => void
  onPivot: (pivotQuery?: string) => void
  onContinue: () => void
  isLoadingSuggestions?: boolean
  refineSuggestions?: string[]
  pivotSuggestions?: string[]
}

export default function GuardWarning({
  guardResult,
  originalQuery,
  onRefine,
  onPivot,
  onContinue,
  isLoadingSuggestions,
  refineSuggestions,
  pivotSuggestions,
}: GuardWarningProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null)
  const [showingMode, setShowingMode] = useState<'main' | 'refine' | 'pivot'>('main')

  const hasSanityIssues = guardResult.issues.includes('sanity')
  const hasOtherIssues = guardResult.issues.filter(i => i !== 'sanity').length > 0

  const handleRefineClick = () => {
    if (refineSuggestions && refineSuggestions.length > 0) {
      // Already have suggestions, show them
      setShowingMode('refine')
    } else {
      // Need to generate suggestions
      setShowingMode('refine')
      onRefine()
    }
  }

  const handlePivotClick = () => {
    if (pivotSuggestions && pivotSuggestions.length > 0) {
      // Already have suggestions, show them
      setShowingMode('pivot')
    } else {
      // Need to generate suggestions
      setShowingMode('pivot')
      onPivot()
    }
  }

  const handleSubmitSuggestion = () => {
    if (selectedSuggestion) {
      if (showingMode === 'refine') {
        onRefine(selectedSuggestion)
      } else {
        onPivot(selectedSuggestion)
      }
    }
  }

  const handleBack = () => {
    setShowingMode('main')
    setSelectedSuggestion(null)
  }

  // Main warning view
  if (showingMode === 'main') {
    return (
      <div className="mt-4 mb-6 bg-relic-ghost/30 border-l-2 border-relic-slate/30 p-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">⚠️</span>
          <h3 className="text-sm font-medium text-relic-void">Reality Check</h3>
        </div>

        {/* Violations */}
        {hasSanityIssues && guardResult.sanityViolations.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-relic-slate mb-2">Sanity violations detected:</p>
            <ul className="space-y-1">
              {guardResult.sanityViolations.map((violation, i) => (
                <li key={i} className="text-xs text-relic-void font-light flex items-start gap-2">
                  <span className="text-relic-silver">→</span>
                  <span>{violation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Other issues */}
        {hasOtherIssues && (
          <div className="mb-4">
            <p className="text-xs text-relic-slate mb-2">Other issues:</p>
            <div className="flex flex-wrap gap-2">
              {guardResult.issues.filter(i => i !== 'sanity').map((issue, i) => (
                <span key={i} className="text-xs px-2 py-1 bg-relic-mist/50 text-relic-slate rounded">
                  {issue}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Details toggle */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-relic-silver hover:text-relic-slate mb-4"
        >
          {showDetails ? '− hide details' : '+ show details'}
        </button>

        {/* Detailed scores */}
        {showDetails && (
          <div className="mb-4 p-3 bg-relic-white/50 border border-relic-mist animate-fade-in">
            <p className="text-[10px] uppercase tracking-widest text-relic-silver mb-2">Scores</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-relic-slate">Hype:</span>
                <span className="ml-2 text-relic-void">{guardResult.scores.hype}</span>
              </div>
              <div>
                <span className="text-relic-slate">Echo:</span>
                <span className="ml-2 text-relic-void">{guardResult.scores.echo}%</span>
              </div>
              <div>
                <span className="text-relic-slate">Drift:</span>
                <span className="ml-2 text-relic-void">{guardResult.scores.drift}%</span>
              </div>
              <div>
                <span className="text-relic-slate">Fact:</span>
                <span className="ml-2 text-relic-void">{guardResult.scores.fact}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action prompt */}
        <p className="text-xs text-relic-slate mb-3">Choose an action:</p>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefineClick}
            className="relic-button text-xs px-4 py-2"
          >
            Refine
          </button>
          <button
            onClick={onContinue}
            className="relic-button-primary text-xs px-4 py-2"
          >
            Continue
          </button>
          <button
            onClick={handlePivotClick}
            className="relic-button text-xs px-4 py-2"
          >
            Pivot
          </button>
        </div>
      </div>
    )
  }

  // Refine/Pivot suggestions view
  const currentSuggestions = showingMode === 'refine' ? refineSuggestions : pivotSuggestions
  const modeLabel = showingMode === 'refine' ? 'Refinements' : 'Alternative Approaches'

  return (
    <div className="mt-4 mb-6 bg-relic-ghost/30 border-l-2 border-relic-slate/30 p-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">⚠️</span>
        <h3 className="text-sm font-medium text-relic-void">{modeLabel}</h3>
      </div>

      {/* Loading state */}
      {isLoadingSuggestions && (
        <div className="py-8 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-relic-mist border-t-relic-slate"></div>
          <p className="text-xs text-relic-silver mt-3">Generating suggestions...</p>
        </div>
      )}

      {/* Suggestions */}
      {!isLoadingSuggestions && currentSuggestions && currentSuggestions.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-relic-slate mb-3">Pick a {showingMode === 'refine' ? 'refined' : 'different'} question:</p>
          <div className="space-y-3">
            {currentSuggestions.map((suggestion, i) => (
              <label
                key={i}
                className="flex items-start gap-3 p-3 bg-relic-white/50 border border-relic-mist hover:border-relic-silver hover:bg-relic-ghost/50 cursor-pointer transition-colors"
              >
                <input
                  type="radio"
                  name="suggestion"
                  value={suggestion}
                  checked={selectedSuggestion === suggestion}
                  onChange={() => setSelectedSuggestion(suggestion)}
                  className="mt-0.5 h-4 w-4 text-relic-void border-relic-mist focus:ring-relic-slate"
                />
                <span className="text-xs text-relic-void flex-1">{suggestion}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {!isLoadingSuggestions && (!currentSuggestions || currentSuggestions.length === 0) && (
        <div className="mb-4 p-3 bg-relic-mist/30 border border-relic-mist">
          <p className="text-xs text-relic-slate">
            Unable to generate suggestions. Please try rephrasing your question manually.
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        {currentSuggestions && currentSuggestions.length > 0 && (
          <button
            onClick={handleSubmitSuggestion}
            disabled={!selectedSuggestion}
            className="relic-button-primary text-xs px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Selected
          </button>
        )}
        <button
          onClick={handleBack}
          className="relic-button text-xs px-4 py-2"
        >
          Back
        </button>
      </div>
    </div>
  )
}
