'use client'

import { useState } from 'react'
import { Implementation } from '@/lib/implementation-tracker'
import { useImplementationStore } from '@/lib/stores/implementation-store'

interface ValidationPromptProps {
  implementation: Implementation
  onComplete?: () => void
}

export function ValidationPrompt({ implementation, onComplete }: ValidationPromptProps) {
  const [feedback, setFeedback] = useState('')
  const { validate, reject } = useImplementationStore()

  const handleValidate = async () => {
    await validate(implementation.id, feedback || 'Validated and approved')
    onComplete?.()
  }

  const handleReject = async () => {
    await reject(implementation.id, feedback || 'Needs revision')
    onComplete?.()
  }

  return (
    <div className="bg-relic-void dark:bg-zinc-900 border border-relic-mist dark:border-zinc-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 bg-amber-500 animate-pulse" />
        <span className="text-[10px] uppercase tracking-wider text-amber-500">
          VALIDATION REQUIRED
        </span>
      </div>

      <div className="text-relic-void dark:text-zinc-100 font-medium mb-1">
        {implementation.featureName}
      </div>

      <div className="text-[10px] uppercase text-relic-silver dark:text-zinc-600 mb-2">
        {implementation.featureType}
      </div>

      <div className="text-relic-slate dark:text-zinc-400 text-sm mb-4">
        {implementation.description}
      </div>

      <div className="text-[10px] text-relic-silver dark:text-zinc-500 mb-4 font-mono">
        Files: {implementation.filesCreated.length} created, {implementation.filesModified.length} modified
        {implementation.linesAdded > 0 && ` | +${implementation.linesAdded} lines`}
      </div>

      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Optional feedback..."
        className="w-full bg-relic-ghost dark:bg-zinc-800 border border-relic-mist dark:border-zinc-700 p-2 text-sm text-relic-void dark:text-zinc-300 mb-3 resize-none h-16 focus:outline-none focus:border-relic-slate dark:focus:border-zinc-500"
      />

      <div className="flex gap-2">
        <button
          onClick={handleValidate}
          className="flex-1 bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-600/30 px-4 py-2 text-[10px] uppercase tracking-wider hover:bg-emerald-600/30 transition-colors"
        >
          ✓ VALIDATE
        </button>
        <button
          onClick={handleReject}
          className="flex-1 bg-red-600/20 text-red-600 dark:text-red-400 border border-red-600/30 px-4 py-2 text-[10px] uppercase tracking-wider hover:bg-red-600/30 transition-colors"
        >
          ✕ REJECT
        </button>
      </div>
    </div>
  )
}
