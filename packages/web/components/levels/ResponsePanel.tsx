'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import type { Level } from '@/lib/stores/levels-store'

/**
 * RESPONSE PANEL
 *
 * Left column of each LevelContainer. Displays formatted AI response
 * with expand/collapse, connection points, and metrics footer.
 *
 * ┌──────────────────────────┐
 * │ Response        ⟨expand⟩ │
 * ├──────────────────────────┤
 * │  Formatted markdown      │
 * │  response text           │
 * │  (truncated / expanded)  │
 * ├──────────────────────────┤
 * │ confidence: 87% · ...    │
 * └──────────────────────────┘
 */

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface ResponsePanelProps {
  level: Level
  onStartConnection?: (elementId: string, elementType: 'response') => void
  onCompleteConnection?: (elementId: string, elementType: 'response') => void
  connectionMode?: boolean
}

// ═══════════════════════════════════════════════════════════════════
// MARKDOWN FORMATTER (lightweight, no heavy deps)
// ═══════════════════════════════════════════════════════════════════

function formatResponse(text: string): React.ReactNode {
  if (!text) return null

  const paragraphs = text.split(/\n\n+/)

  return paragraphs.map((para, pIdx) => {
    // Process inline formatting within each paragraph
    const lines = para.split('\n')

    const formattedLines = lines.map((line, lIdx) => {
      // Headers: strip # prefix, render bold
      const headerMatch = line.match(/^(#{1,6})\s+(.+)/)
      if (headerMatch) {
        return (
          <span key={lIdx} className="block font-semibold text-neutral-800 mt-2 mb-1">
            {processInline(headerMatch[2])}
          </span>
        )
      }

      // Bullet points
      if (/^[-*•]\s/.test(line)) {
        return (
          <span key={lIdx} className="block pl-3 before:content-['·'] before:absolute before:left-0 before:text-neutral-400 relative">
            {processInline(line.replace(/^[-*•]\s+/, ''))}
          </span>
        )
      }

      // Numbered list items
      const numMatch = line.match(/^(\d+)[.)]\s+(.+)/)
      if (numMatch) {
        return (
          <span key={lIdx} className="block pl-3">
            <span className="text-neutral-400 font-mono text-[11px]">{numMatch[1]}.</span>{' '}
            {processInline(numMatch[2])}
          </span>
        )
      }

      // Regular line
      if (line.trim()) {
        return (
          <span key={lIdx} className="block">
            {processInline(line)}
          </span>
        )
      }

      return null
    })

    return (
      <p key={pIdx} className="mb-2 last:mb-0">
        {formattedLines}
      </p>
    )
  })
}

/**
 * Process inline markdown: **bold**, `code`
 */
function processInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let remaining = text
  let keyCounter = 0

  while (remaining.length > 0) {
    // Bold: **text**
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/)
    // Code: `text`
    const codeMatch = remaining.match(/`([^`]+)`/)

    // Find the earliest match
    const boldIdx = boldMatch?.index ?? Infinity
    const codeIdx = codeMatch?.index ?? Infinity

    if (boldIdx === Infinity && codeIdx === Infinity) {
      // No more matches
      parts.push(remaining)
      break
    }

    if (boldIdx <= codeIdx && boldMatch) {
      // Bold comes first
      if (boldIdx > 0) parts.push(remaining.slice(0, boldIdx))
      parts.push(
        <strong key={`b-${keyCounter++}`} className="font-semibold text-neutral-800">
          {boldMatch[1]}
        </strong>
      )
      remaining = remaining.slice(boldIdx + boldMatch[0].length)
    } else if (codeMatch) {
      // Code comes first
      if (codeIdx > 0) parts.push(remaining.slice(0, codeIdx))
      parts.push(
        <code
          key={`c-${keyCounter++}`}
          className="px-1 py-0.5 bg-neutral-100 rounded text-[12px] font-mono text-neutral-600"
        >
          {codeMatch[1]}
        </code>
      )
      remaining = remaining.slice(codeIdx + codeMatch[0].length)
    }
  }

  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : <>{parts}</>
}

// ═══════════════════════════════════════════════════════════════════
// LOADING DOTS
// ═══════════════════════════════════════════════════════════════════

function LoadingDots() {
  return (
    <div className="flex items-center justify-center gap-1.5 py-8">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-neutral-300"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function ResponsePanel({
  level,
  onStartConnection,
  onCompleteConnection,
  connectionMode,
}: ResponsePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const hasResponse = level.response && level.response.trim().length > 0
  const isLoading = level.response === ''
  const formatted = useMemo(
    () => (hasResponse ? formatResponse(level.response) : null),
    [level.response, hasResponse]
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="h-full flex flex-col"
    >
      {/* ── Header ── */}
      <div className="px-3 py-2 flex items-center justify-between border-b border-neutral-50">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-mono">
            Response
          </span>
          {/* Connection dot */}
          {(onStartConnection || onCompleteConnection) && (
            <button
              onClick={() => {
                if (connectionMode && onCompleteConnection) {
                  onCompleteConnection(`response-${level.id}`, 'response')
                } else if (onStartConnection) {
                  onStartConnection(`response-${level.id}`, 'response')
                }
              }}
              className={`
                w-2 h-2 rounded-full border transition-all duration-200
                ${connectionMode
                  ? 'border-purple-400 bg-purple-100 shadow-[0_0_4px_rgba(168,85,247,0.4)] hover:bg-purple-200'
                  : 'border-neutral-300 bg-white hover:border-neutral-400'
                }
              `}
              title={connectionMode ? 'Connect here' : 'Start connection'}
            />
          )}
        </div>

        {/* Expand/collapse toggle */}
        {hasResponse && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[9px] font-mono text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            {isExpanded ? 'collapse' : 'expand'}
          </button>
        )}
      </div>

      {/* ── Body ── */}
      <div className="px-3 py-3 flex-1 overflow-y-auto relative">
        {/* Loading state */}
        {isLoading && <LoadingDots />}

        {/* Empty state */}
        {!isLoading && !hasResponse && (
          <div className="flex items-center justify-center h-full">
            <span className="text-[10px] text-neutral-300 italic">
              Awaiting response...
            </span>
          </div>
        )}

        {/* Response content */}
        {hasResponse && (
          <>
            <div
              className={`
                text-[13px] text-neutral-700 leading-relaxed
                transition-all duration-300 overflow-hidden
                ${isExpanded ? 'max-h-none' : 'max-h-[200px]'}
              `}
            >
              {formatted}
            </div>

            {/* Gradient fade overlay when collapsed */}
            {!isExpanded && (
              <div
                className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
                style={{
                  background: 'linear-gradient(transparent 0%, white 100%)',
                }}
              />
            )}
          </>
        )}
      </div>

      {/* ── Metrics footer ── */}
      {hasResponse && (
        <div className="px-3 py-2 border-t border-neutral-50 flex items-center gap-1">
          {/* Connection dot for metrics */}
          {(onStartConnection || onCompleteConnection) && (
            <button
              onClick={() => {
                if (connectionMode && onCompleteConnection) {
                  onCompleteConnection(`metrics-${level.id}`, 'response')
                } else if (onStartConnection) {
                  onStartConnection(`metrics-${level.id}`, 'response')
                }
              }}
              className={`
                w-2 h-2 rounded-full border mr-1.5 transition-all duration-200
                ${connectionMode
                  ? 'border-purple-400 bg-purple-100'
                  : 'border-neutral-300 bg-white hover:border-neutral-400'
                }
              `}
              title="Connect metrics"
            />
          )}

          <span className="text-[9px] text-neutral-400 font-mono">
            confidence: {level.confidence}%
          </span>
          <span className="text-[9px] text-neutral-300">·</span>
          <span className="text-[9px] text-neutral-400 font-mono">
            data points: {level.dataPoints}
          </span>
          <span className="text-[9px] text-neutral-300">·</span>
          <span className="text-[9px] text-neutral-400 font-mono">
            connections: {level.semanticConnections}
          </span>
        </div>
      )}
    </motion.div>
  )
}
