'use client'

/**
 * KABBALISTIC TERM COMPONENT
 *
 * PRODUCTION RULE: ALL Kabbalistic terms MUST use this component.
 *
 * This ensures every term is explained with Hebrew + English + Meaning.
 *
 * Usage:
 *   <KT term="kether" />          → "Kether (כֶּתֶר - Crown)"
 *   <KT term="malkuth" compact /> → "Malkuth - Kingdom"
 *
 * @module KabbalisticTerm
 */

import React from 'react'
import {
  type KabbalisticTermKey,
  formatKabbalisticTerm,
  getTermData,
} from '@/lib/kabbalistic-terms'

interface KabbalisticTermProps {
  /** The term key */
  term: KabbalisticTermKey
  /** Display format */
  format?: 'full' | 'compact' | 'inline'
  /** Show tooltip on hover */
  showTooltip?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * KabbalisticTerm Component
 * Displays Kabbalistic terms with full explanation
 */
export function KabbalisticTerm({
  term,
  format = 'full',
  showTooltip = true,
  className = '',
}: KabbalisticTermProps) {
  const data = getTermData(term)
  const display = formatKabbalisticTerm(term, format)

  const tooltipText = showTooltip
    ? `${data.hebrew} (${data.meaning})\n${data.fullMeaning}${'aiRole' in data ? `\n\nAI Role: ${data.aiRole}` : ''}`
    : undefined

  return (
    <span
      className={`kabbalistic-term ${className}`}
      title={tooltipText}
      data-term={term}
    >
      {display}
    </span>
  )
}

/**
 * Shorthand: <KT term="kether" />
 */
export function KT({
  t,
  f = 'full',
  ...props
}: {
  t: KabbalisticTermKey
  f?: KabbalisticTermProps['format']
} & Omit<KabbalisticTermProps, 'term' | 'format'>) {
  return <KabbalisticTerm term={t} format={f} {...props} />
}

/**
 * SefirotPath Component
 * Auto-explains paths like "Kether → Malkuth"
 */
export function SefirotPath({ path, className = '' }: { path: string; className?: string }) {
  // Parse path and add explanations
  const parts = path.split(/([→↔\-])/).map((part, i) => {
    const trimmed = part.trim()

    // If it's an arrow, return as-is
    if (['→', '↔', '-'].includes(trimmed)) {
      return (
        <span key={i} className="mx-1">
          {trimmed}
        </span>
      )
    }

    // Try to match Sefirot name
    const sefirotMap: Record<string, KabbalisticTermKey> = {
      'Kether': 'kether',
      'Chokmah': 'chokmah',
      'Binah': 'binah',
      'Chesed': 'chesed',
      'Gevurah': 'gevurah',
      'Tiferet': 'tiferet',
      'Netzach': 'netzach',
      'Hod': 'hod',
      'Yesod': 'yesod',
      'Malkuth': 'malkuth',
      "Da'at": 'daat',
    }

    const termKey = sefirotMap[trimmed]

    if (termKey) {
      return <KT key={i} t={termKey} f="inline" />
    }

    // Not a Sefirah, return as-is
    return <span key={i}>{part}</span>
  })

  return <span className={`sefirot-path ${className}`}>{parts}</span>
}

/**
 * Inline explained term (minimal, for text flow)
 */
export function ExplainedTerm({
  term,
  children,
}: {
  term: KabbalisticTermKey
  children?: React.ReactNode
}) {
  const data = getTermData(term)

  return (
    <span
      className="explained-term"
      title={`${data.hebrew} - ${data.fullMeaning}`}
      data-term={term}
    >
      {children || data.english}
      <span className="text-relic-silver text-[9px] ml-1">({data.meaning})</span>
    </span>
  )
}

export default KabbalisticTerm
