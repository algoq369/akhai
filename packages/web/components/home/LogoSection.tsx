'use client'

import { RefObject } from 'react'
import { METHODOLOGIES, METHODOLOGY_DETAILS } from '@/lib/methodology-data'

interface LogoSectionProps {
  methodology: string
  expandedMethodology: string | null
  setExpandedMethodology: (v: string | null) => void
  diamondRef: RefObject<HTMLDivElement | null>
}

export default function LogoSection({ methodology, expandedMethodology, setExpandedMethodology, diamondRef }: LogoSectionProps) {
  return (
    <div className="text-center pt-4 sm:pt-8 pb-4 px-4">
      <h1 className="text-2xl sm:text-3xl font-light text-relic-slate dark:text-white tracking-[0.2em] sm:tracking-[0.3em] mb-1">
        A K H A I
      </h1>
      <p className="text-xs sm:text-sm font-light text-relic-silver/60 dark:text-white/50 tracking-wide mb-0.5">
        school of thoughts
      </p>
      <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-relic-slate/50 dark:text-white/40 mb-6">
        SOVEREIGNINTELLIGENCE
      </p>
      {/* Diamond Logo with INLINE methodology explorer */}
      <div className="group relative inline-block">
        <div ref={diamondRef} data-diamond-logo className="cursor-pointer">
          <span className="text-4xl font-extralight text-relic-mist dark:text-relic-silver/30 group-hover:text-relic-silver dark:group-hover:text-relic-ghost group-hover:scale-110 transition-all duration-500 inline-block">
            ◊
          </span>
          <p className="text-[8px] tracking-[0.2em] text-relic-silver/40 mt-2">
            <span className="hidden sm:inline">hover to explore</span>
            <span className="sm:hidden">tap to explore</span>
          </p>
        </div>

        {/* Inline Methodology Explorer */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 mt-4 transition-all duration-300 z-50 ${
            expandedMethodology
              ? 'opacity-100 visible'
              : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'
          }`}
        >
          {expandedMethodology ? (
            /* Rich Data View */
            <div className="bg-white dark:bg-relic-void backdrop-blur-md border border-relic-mist dark:border-relic-slate/30 shadow-2xl w-[calc(100vw-2rem)] sm:w-[380px]">
              {(() => {
                const detail = METHODOLOGY_DETAILS.find((m) => m.id === expandedMethodology);
                if (!detail) return null;
                const isCoding = detail.id === 'pot';
                const isResearch = detail.id === 'react';
                return (
                  <>
                    {/* Header */}
                    <div className="border-b border-relic-mist/30 dark:border-relic-slate/20 px-3 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-xl text-relic-slate dark:text-white">
                          {detail.symbol}
                        </div>
                        <div>
                          <h2 className="text-sm font-mono text-relic-slate dark:text-white">
                            {detail.name}
                          </h2>
                          <p className="text-[9px] text-relic-silver dark:text-relic-ghost">
                            {detail.fullName}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setExpandedMethodology(null)}
                        className="text-xs text-relic-silver dark:text-relic-ghost hover:text-relic-slate dark:hover:text-white"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Content */}
                    <div className="px-3 py-2 space-y-2">
                      {/* Type badges */}
                      <div className="flex gap-1.5">
                        {isCoding && (
                          <span className="text-[8px] px-1.5 py-0.5 bg-relic-ghost dark:bg-relic-slate/20 text-relic-slate dark:text-relic-ghost border border-relic-mist/30 dark:border-relic-slate/30">
                            CODE
                          </span>
                        )}
                        {isResearch && (
                          <span className="text-[8px] px-1.5 py-0.5 bg-relic-ghost dark:bg-relic-slate/20 text-relic-slate dark:text-relic-ghost border border-relic-mist/30 dark:border-relic-slate/30">
                            WEB
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-[9px] text-relic-slate dark:text-relic-ghost leading-tight">
                        {detail.description}
                      </p>

                      {/* Process steps */}
                      <div className="space-y-0.5">
                        <p className="text-[8px] uppercase tracking-wider text-relic-silver dark:text-relic-ghost">
                          Process
                        </p>
                        {detail.howItWorks.slice(0, 2).map((step, i) => (
                          <p
                            key={i}
                            className="text-[9px] text-relic-slate dark:text-relic-ghost leading-tight flex gap-1"
                          >
                            <span className="text-relic-silver dark:text-relic-ghost">→</span>
                            <span>{step}</span>
                          </p>
                        ))}
                      </div>

                      {/* Format */}
                      <div>
                        <p className="text-[8px] uppercase tracking-wider text-relic-silver dark:text-relic-ghost mb-0.5">
                          Format
                        </p>
                        <p className="text-[9px] font-mono text-relic-slate dark:text-white">
                          {detail.format}
                        </p>
                      </div>

                      {/* Metrics */}
                      <div className="pt-1.5 border-t border-relic-mist/20 dark:border-relic-slate/10 grid grid-cols-3 gap-2">
                        <div>
                          <span className="text-[8px] uppercase text-relic-silver dark:text-relic-ghost block">Tokens</span>
                          <span className="text-[10px] font-mono text-relic-slate dark:text-white">{detail.metrics.tokens}</span>
                        </div>
                        <div>
                          <span className="text-[8px] uppercase text-relic-silver dark:text-relic-ghost block">Latency</span>
                          <span className="text-[10px] font-mono text-relic-slate dark:text-white">{detail.metrics.latency}</span>
                        </div>
                        <div>
                          <span className="text-[8px] uppercase text-relic-silver dark:text-relic-ghost block">Cost</span>
                          <span className="text-[10px] font-mono text-relic-slate dark:text-white">{detail.metrics.cost}</span>
                        </div>
                      </div>

                      {/* Example */}
                      {detail.examples[0] && (
                        <div className="pt-1.5 border-t border-relic-mist/20 dark:border-relic-slate/10">
                          <p className="text-[8px] uppercase tracking-wider text-relic-silver dark:text-relic-ghost mb-0.5">Example</p>
                          <p className="text-[9px] italic text-relic-slate dark:text-relic-ghost leading-tight">{detail.examples[0]}</p>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            /* Horizontal List */
            <div className="bg-white dark:bg-relic-void border border-relic-mist dark:border-relic-slate/30 shadow-xl p-3">
              <div className="flex gap-2">
                {METHODOLOGIES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setExpandedMethodology(m.id);
                    }}
                    className={`
                      flex flex-col items-center justify-center w-24 h-16
                      border transition-all duration-200 bg-white dark:bg-relic-slate/20
                      ${
                        methodology === m.id
                          ? 'border-relic-slate dark:border-white text-relic-slate dark:text-white'
                          : 'border-relic-mist dark:border-relic-slate/30 hover:border-relic-slate/60 dark:hover:border-relic-ghost text-relic-slate dark:text-relic-ghost'
                      }
                    `}
                  >
                    <span className="text-lg">{m.symbol}</span>
                    <span className="text-[9px] font-mono mt-1">{m.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
