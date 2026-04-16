'use client';

import Link from 'next/link';
import { useMacroStore } from '@/lib/stores/macro-store';

interface MacroPanelProps {
  queryId: string;
}

export default function MacroPanel({ queryId }: MacroPanelProps) {
  const { results, expandedPanels } = useMacroStore();
  const result = results.find((r) => r.queryId === queryId);
  const isExpanded = expandedPanels[queryId];

  if (!result || !isExpanded) return null;

  if (result.error) {
    return (
      <div className="mt-2 border border-red-200 dark:border-red-900/40 rounded-lg p-3 text-xs text-red-600 dark:text-red-400">
        ◇ Macro analysis failed: {result.error}
      </div>
    );
  }

  if (!result.relevant) {
    return (
      <div className="mt-2 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-xs text-zinc-500">
        ◇ No significant macro-cyclical correlation detected for this query.
      </div>
    );
  }

  const conv = result.convergence?.current;

  return (
    <div className="mt-2 border border-purple-200 dark:border-purple-900/40 rounded-lg p-3 border-l-2 border-l-[#7F77DD] bg-purple-50/20 dark:bg-purple-900/10">
      <div className="text-[11px] font-mono font-medium text-purple-700 dark:text-purple-300 mb-1">
        ◇ MACRO-CYCLICAL ANALYSIS
        {conv && (
          <span className="ml-2 text-[10px] text-zinc-500">
            · {conv.score}/{conv.maxScore} convergence · {conv.label}
          </span>
        )}
      </div>

      {result.synthesis && (
        <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed mt-2">
          {result.synthesis}
        </p>
      )}

      {result.positions && (
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] font-mono">
          {result.positions.barbault && (
            <div>
              <span className="text-zinc-400">Barbault:</span>{' '}
              <span className="text-zinc-700 dark:text-zinc-300">
                {result.positions.barbault.currentIndex} ({result.positions.barbault.trend})
              </span>
            </div>
          )}
          {result.positions.turchin && (
            <div>
              <span className="text-zinc-400">Turchin PSI:</span>{' '}
              <span className="text-zinc-700 dark:text-zinc-300">
                {result.positions.turchin.psi} ({result.positions.turchin.phase})
              </span>
            </div>
          )}
          {result.positions.kondratieff && (
            <div>
              <span className="text-zinc-400">K-wave:</span>{' '}
              <span className="text-zinc-700 dark:text-zinc-300">
                {result.positions.kondratieff.phase}
              </span>
            </div>
          )}
          {result.positions.straussHowe && (
            <div>
              <span className="text-zinc-400">Strauss-Howe:</span>{' '}
              <span className="text-zinc-700 dark:text-zinc-300">
                {result.positions.straussHowe.turning}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center gap-3">
        <Link
          href="/constellation"
          className="text-[10px] font-mono text-purple-500 hover:text-purple-700 underline"
        >
          Explore in Constellation →
        </Link>
        {result.cost !== undefined && (
          <span className="text-[9px] font-mono text-zinc-400">${result.cost.toFixed(4)}</span>
        )}
      </div>
    </div>
  );
}
