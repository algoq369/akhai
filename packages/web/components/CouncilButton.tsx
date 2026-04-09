'use client';

import { useCouncilStore } from '@/lib/stores/council-store';

interface CouncilButtonProps {
  queryId: string;
  query: string;
  response: string;
}

export default function CouncilButton({ queryId, query, response }: CouncilButtonProps) {
  const { isLoading, activeQueryId, setLoading } = useCouncilStore();
  const wordCount = response.split(/\s+/).length;

  if (wordCount < 100) return null;

  const isActive = isLoading && activeQueryId === queryId;

  const handleClick = async () => {
    if (isLoading) return;
    setLoading(true, queryId);
    try {
      const res = await fetch('/api/god-view/council', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, response: response.slice(0, 4000) }),
      });
      const data = await res.json();
      if (res.status === 501) {
        console.log('Council stub:', data.message, data.agents);
      }
    } catch (err) {
      console.error('Council error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isActive}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded border transition-colors font-mono text-[9px] ${
        isActive
          ? 'border-indigo-300 dark:border-indigo-600 text-indigo-400 animate-pulse'
          : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
      }`}
    >
      <span className="text-[10px]">◊</span>
      <span className="uppercase tracking-wider">{isActive ? 'Convening...' : 'Council'}</span>
    </button>
  );
}
