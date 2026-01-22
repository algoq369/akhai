'use client'

import { useState } from 'react'

interface CodeBlockWithCopyProps {
  code: string
  language?: string
  className?: string
}

/**
 * Code Block with Copy Button
 * Displays code with syntax highlighting and a copy button
 */
export function CodeBlockWithCopy({ code, language, className = '' }: CodeBlockWithCopyProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className={`relative group ${className}`}>
      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 px-2 py-1 bg-relic-void/80 dark:bg-white/10 hover:bg-relic-void dark:hover:bg-white/20 text-relic-white dark:text-white text-xs font-mono rounded opacity-0 group-hover:opacity-100 transition-opacity z-10"
        aria-label="Copy code"
      >
        {copied ? (
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Copied
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            Copy
          </span>
        )}
      </button>

      {/* Language label */}
      {language && (
        <div className="absolute top-2 left-2 px-2 py-1 bg-relic-void/80 dark:bg-white/10 text-relic-white dark:text-white text-[10px] font-mono rounded uppercase">
          {language}
        </div>
      )}

      {/* Code content */}
      <pre className="bg-relic-ghost dark:bg-relic-void/50 border border-relic-mist dark:border-relic-slate/30 rounded p-4 overflow-x-auto">
        <code className="text-xs font-mono text-relic-void dark:text-relic-ghost">
          {code}
        </code>
      </pre>
    </div>
  )
}

/**
 * Inline Code with Copy
 * For small code snippets with copy functionality
 */
export function InlineCodeWithCopy({ code, className = '' }: { code: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <span className={`inline-flex items-center gap-1 group ${className}`}>
      <code className="px-1.5 py-0.5 bg-relic-ghost dark:bg-relic-void/50 text-relic-void dark:text-relic-ghost text-xs font-mono rounded">
        {code}
      </code>
      <button
        onClick={handleCopy}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-relic-ghost dark:hover:bg-relic-void/50 rounded"
        aria-label="Copy"
      >
        {copied ? (
          <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-3 h-3 text-relic-silver dark:text-relic-ghost" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
    </span>
  )
}
