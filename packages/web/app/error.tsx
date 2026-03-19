'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[AkhAI Error Boundary]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-relic-white dark:bg-relic-void">
      <div className="text-center max-w-md px-6">
        <div className="text-4xl font-light text-relic-slate dark:text-white mb-2">⚠</div>
        <h2 className="text-lg font-mono text-relic-slate dark:text-white mb-4">
          Something went wrong
        </h2>
        <p className="text-sm text-relic-silver dark:text-relic-ghost mb-8 font-mono">
          {error.digest ? `Error ID: ${error.digest}` : 'An unexpected error occurred'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 text-sm font-mono text-relic-slate dark:text-relic-ghost border border-relic-mist dark:border-relic-slate/30 hover:bg-relic-ghost dark:hover:bg-relic-slate/20 transition-colors"
        >
          ↻ Try again
        </button>
      </div>
    </div>
  );
}
