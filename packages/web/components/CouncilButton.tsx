'use client';

import { useCouncilStore } from '@/lib/stores/council-store';

interface CouncilButtonProps {
  queryId: string;
  query: string;
  response: string;
}

export default function CouncilButton({ queryId, query, response }: CouncilButtonProps) {
  const { results, isLoading, activeQueryId, setLoading, addResult } = useCouncilStore();
  const wordCount = response.split(/\s+/).length;
  const hasResult = results.some((r) => r.queryId === queryId);

  if (wordCount < 100) return null;

  const isActive = isLoading && activeQueryId === queryId;

  const handleClick = async () => {
    if (isLoading || hasResult) return;
    setLoading(true, queryId);
    const timeout = setTimeout(() => {
      console.error('Council timeout after 30s');
      setLoading(false);
    }, 30000);
    try {
      const res = await fetch('/api/god-view/council', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, response: response.slice(0, 4000) }),
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`Council: ${res.status}`);
      const data = await res.json();
      addResult({
        queryId,
        query,
        perspectives: data.perspectives,
        synthesis: data.synthesis,
        totalCost: data.totalCost,
        timestamp: Date.now(),
      });
    } catch (err) {
      clearTimeout(timeout);
      console.error('Council error:', err);
      setLoading(false);
    }
  };

  const result = results.find((r) => r.queryId === queryId);
  const totalLatency = result ? Math.max(...result.perspectives.map((p) => p.latencyMs)) / 1000 : 0;

  return (
    <span className="inline-flex items-center gap-2">
      <button
        onClick={handleClick}
        disabled={isActive || hasResult}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded border transition-colors font-mono text-[9px] ${
          isActive
            ? 'border-indigo-300 dark:border-indigo-600 text-indigo-400 animate-pulse'
            : hasResult
              ? 'border-purple-300 dark:border-purple-700 text-purple-500 dark:text-purple-400'
              : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
        }`}
      >
        <span className="text-[10px]">◊</span>
        <span className="uppercase tracking-wider">
          {isActive ? 'Convening...' : hasResult ? 'Council \u2713' : 'Council'}
        </span>
      </button>
      <span className="text-[8px] text-zinc-400 italic font-mono">
        {hasResult && result
          ? `4 perspectives · $${result.totalCost.toFixed(4)} · ${totalLatency.toFixed(1)}s`
          : '5 AI agents analyze this response from different perspectives'}
      </span>
    </span>
  );
}
