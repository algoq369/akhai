'use client';

import { useState } from 'react';
import { COUNCIL_AGENTS } from '@/lib/god-view/agents';
import { useCouncilStore } from '@/lib/stores/council-store';

interface CouncilPanelProps {
  queryId: string;
}

const STRENGTH_COLOR: Record<string, string> = {
  visionary: 'border-t-indigo-400',
  analyst: 'border-t-emerald-400',
  advocate: 'border-t-amber-400',
  skeptic: 'border-t-red-400',
  synthesizer: 'border-t-purple-400',
};

function SkeletonCard() {
  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 animate-pulse">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-4 h-4 bg-zinc-200 dark:bg-zinc-700 rounded" />
        <div className="w-16 h-3 bg-zinc-200 dark:bg-zinc-700 rounded" />
      </div>
      <div className="space-y-1.5">
        <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded" />
        <div className="w-3/4 h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded" />
      </div>
    </div>
  );
}

export default function CouncilPanel({ queryId }: CouncilPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const { results, isLoading, activeQueryId } = useCouncilStore();
  const result = results.find((r) => r.queryId === queryId);
  const isActive = isLoading && activeQueryId === queryId;

  if (!result && !isActive) return null;

  return (
    <div className="mt-2 border border-zinc-200 dark:border-zinc-700/50 rounded-lg overflow-hidden font-mono">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
      >
        <span className="text-[10px] text-purple-400">◊</span>
        <span className="text-[9px] uppercase tracking-wider text-zinc-500">
          Council — 5 perspectives
        </span>
        <span className="text-[8px] text-zinc-400 ml-auto">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="p-3 space-y-3">
          {/* Synthesis (top) */}
          {result?.synthesis && (
            <div className="bg-purple-50 dark:bg-purple-900/10 rounded-lg px-3 py-2 border-l-2 border-purple-400">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px]">◎</span>
                <span className="text-[8px] uppercase tracking-wider text-purple-500">
                  Synthesis
                </span>
              </div>
              <p className="text-[9px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {result.synthesis}
              </p>
            </div>
          )}

          {/* Agent cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {isActive
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
              : COUNCIL_AGENTS.filter((a) => a.id !== 'synthesizer').map((agent) => {
                  const perspective = result?.perspectives.find((p) => p.agentId === agent.id);
                  return (
                    <div
                      key={agent.id}
                      className={`border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 border-t-2 ${STRENGTH_COLOR[agent.id] || 'border-t-zinc-300'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-[11px]">{agent.sigil}</span>
                        <span className="text-[8px] uppercase tracking-wider text-zinc-500">
                          {agent.name}
                        </span>
                        {perspective && (
                          <span className="text-[7px] text-zinc-400 ml-auto">
                            {perspective.latencyMs}ms
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {perspective?.text || (
                          <span className="italic text-zinc-400">Awaiting perspective...</span>
                        )}
                      </p>
                    </div>
                  );
                })}
          </div>

          {/* Cost footer */}
          {result && (
            <div className="text-[7px] text-zinc-400 text-center">
              Total: ${result.totalCost.toFixed(4)} · {result.perspectives.length} perspectives
            </div>
          )}
        </div>
      )}
    </div>
  );
}
