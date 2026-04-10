'use client';

import { useState } from 'react';
import type { ScenarioBranch } from '@/lib/god-view/scenario-engine';

interface ScenarioReportProps {
  branch: ScenarioBranch;
  isSelected: boolean;
  onSelect: () => void;
  onChat: () => void;
}

const SIGILS: Record<string, string> = {
  optimistic: '◇',
  balanced: '◎',
  pessimistic: '◉',
};

const BORDER_COLORS: Record<string, string> = {
  optimistic: 'border-l-emerald-400',
  balanced: 'border-l-zinc-400',
  pessimistic: 'border-l-amber-400',
};

function confidenceColor(c: number): string {
  if (c >= 70) return 'text-emerald-500';
  if (c >= 40) return 'text-amber-500';
  return 'text-red-400';
}

export default function ScenarioReport({
  branch,
  isSelected,
  onSelect,
  onChat,
}: ScenarioReportProps) {
  const [expanded, setExpanded] = useState(false);
  const sigil = SIGILS[branch.id] || '◊';
  const borderColor = BORDER_COLORS[branch.id] || 'border-l-zinc-400';

  const firstTwoSentences = branch.summary.split('. ').slice(0, 2).join('. ') + '.';

  return (
    <div
      className={`border border-slate-200 dark:border-relic-slate/30 ${borderColor} border-l-[3px] rounded-lg bg-white/50 dark:bg-relic-void/50 backdrop-blur-sm transition-all ${isSelected ? 'ring-1 ring-zinc-400 dark:ring-zinc-500' : ''}`}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => {
          setExpanded(!expanded);
          onSelect();
        }}
        className="w-full text-left px-4 py-3 flex items-start justify-between gap-2"
      >
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            {sigil} {branch.id}
          </div>
          <div className="font-mono text-xs text-slate-800 dark:text-white mt-0.5 truncate">
            {branch.title}
          </div>
        </div>
        <span className={`font-mono text-xs shrink-0 ${confidenceColor(branch.confidence)}`}>
          {branch.confidence}%
        </span>
      </button>

      {/* Preview (always visible) */}
      <div className="px-4 pb-3">
        <p className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {firstTwoSentences}
        </p>
      </div>

      {/* Expanded sections */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-100 dark:border-relic-slate/20 pt-3">
          {/* Summary */}
          <section>
            <h4 className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 mb-1">
              ◊ Summary
            </h4>
            <p className="font-mono text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
              {branch.summary}
            </p>
          </section>

          {/* Key Events */}
          {branch.keyEvents.length > 0 && (
            <section>
              <h4 className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 mb-1">
                → Key Events
              </h4>
              <ol className="space-y-0.5">
                {branch.keyEvents.map((evt, i) => (
                  <li key={i} className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
                    <span className="text-zinc-400 mr-1">{i + 1}.</span> {evt}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Confidence */}
          <section>
            <h4 className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 mb-1">
              △ Confidence
            </h4>
            <div className="flex items-center gap-3">
              <div className="h-1.5 flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-zinc-500 rounded-full transition-all duration-500"
                  style={{ width: `${branch.confidence}%` }}
                />
              </div>
              <span className={`font-mono text-[11px] ${confidenceColor(branch.confidence)}`}>
                {branch.confidence}%
              </span>
            </div>
          </section>

          {/* Assumptions */}
          {branch.assumptions.length > 0 && (
            <section>
              <h4 className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 mb-1">
                ○ Assumptions
              </h4>
              <ul className="space-y-0.5">
                {branch.assumptions.map((a, i) => (
                  <li key={i} className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
                    ○ {a}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Risks */}
          {branch.risks.length > 0 && (
            <section>
              <h4 className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 mb-1">
                ⊕ Risks
              </h4>
              <ul className="space-y-0.5">
                {branch.risks.map((r, i) => (
                  <li key={i} className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
                    ⊕ {r}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Chat button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChat();
            }}
            className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors mt-2"
          >
            Chat with this world →
          </button>
        </div>
      )}
    </div>
  );
}
