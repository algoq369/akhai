'use client';

import { useMacroStore } from '@/lib/stores/macro-store';

interface MacroButtonProps {
  queryId: string;
  query: string;
  topics?: string[];
}

export default function MacroButton({ queryId, query, topics = [] }: MacroButtonProps) {
  const { results, isLoading, activeQueryId, setLoading, addResult, togglePanel } = useMacroStore();
  const hasResult = results.some((r) => r.queryId === queryId);
  const result = results.find((r) => r.queryId === queryId);
  const isActive = isLoading && activeQueryId === queryId;

  const handleClick = async () => {
    if (isLoading) return;
    if (hasResult) {
      togglePanel(queryId);
      return;
    }
    setLoading(true, queryId);
    const timeout = setTimeout(() => {
      console.error('Macro analysis timeout after 30s');
      setLoading(false);
      addResult({ queryId, relevant: false, error: 'Analysis timed out' });
    }, 30000);

    try {
      const res = await fetch('/api/esoteric/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, topics, mode: 'secular' }),
      });
      clearTimeout(timeout);
      const data = await res.json();
      addResult({ queryId, ...data });
      togglePanel(queryId);
    } catch (e) {
      clearTimeout(timeout);
      addResult({ queryId, relevant: false, error: (e as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const label = isActive
    ? 'ANALYZING...'
    : hasResult
      ? result?.relevant
        ? '◇ MACRO ✓'
        : '◇ MACRO'
      : '◇ MACRO';
  const title = hasResult
    ? result?.relevant
      ? 'View macro-cyclical analysis for this query'
      : 'No macro correlation found'
    : 'Analyze macro-cyclical patterns for this query';

  return (
    <span className="inline-flex items-center gap-2">
      <button
        onClick={handleClick}
        disabled={isActive}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded border transition-colors font-mono text-[9px] ${
          isActive
            ? 'border-purple-300 dark:border-purple-600 text-purple-400 animate-pulse'
            : hasResult
              ? 'border-purple-300 dark:border-purple-700 text-purple-500 dark:text-purple-400'
              : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
        }`}
        title={title}
      >
        <span className="text-[10px]">◇</span>
        <span className="uppercase tracking-wider">{label}</span>
      </button>
    </span>
  );
}
