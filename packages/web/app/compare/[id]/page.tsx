'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { LiquidEther } from '@/components/ui/LiquidEther';

// Force dynamic rendering to avoid prerender errors
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ queries?: string }>;
}

interface MethodologyResult {
  methodology: string;
  queryId: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  answer?: string;
  elapsed?: number;
  cost?: number;
  error?: string;
}

const METHODOLOGY_INFO: Record<string, { label: string }> = {
  direct: { label: 'Direct' },
  cot: { label: 'Chain of Thought' },
  aot: { label: 'Atom of Thoughts' },
  gtp: { label: 'Flash (GTP)' },
  auto: { label: 'Auto' },
};

export default function ComparePage({ params, searchParams }: PageProps) {
  const { id } = use(params);
  const { queries: queriesParam } = use(searchParams);

  const [results, setResults] = useState<MethodologyResult[]>([]);
  const [query, setQuery] = useState<string>('');

  useEffect(() => {
    if (!queriesParam) return;

    try {
      const parsedQueries = JSON.parse(decodeURIComponent(queriesParam));
      setQuery(parsedQueries.query || '');

      const initial: MethodologyResult[] = parsedQueries.queries.map((q: any) => ({
        methodology: q.methodology,
        queryId: q.queryId,
        status: 'pending',
      }));

      setResults(initial);

      // Subscribe to all query streams
      initial.forEach((result) => {
        const eventSource = new EventSource(`/api/stream/${result.queryId}`);
        const startTime = Date.now();

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'init' || data.type === 'advisor-start') {
              setResults(prev => prev.map(r =>
                r.queryId === result.queryId
                  ? { ...r, status: 'processing', elapsed: Math.floor((Date.now() - startTime) / 1000) }
                  : r
              ));
            } else if (data.type === 'complete') {
              setResults(prev => prev.map(r =>
                r.queryId === result.queryId
                  ? {
                      ...r,
                      status: 'complete',
                      elapsed: Math.floor((Date.now() - startTime) / 1000),
                      cost: data.data?.totalCost,
                    }
                  : r
              ));

              // Fetch final answer
              fetch(`/api/stream/${result.queryId}`)
                .then(res => res.text())
                .then(text => {
                  // Parse SSE events to get final answer
                  const events = text.split('\n\n').filter(e => e.trim());
                  const lastEvent = events[events.length - 1];
                  if (lastEvent) {
                    const match = lastEvent.match(/data: (.+)/);
                    if (match) {
                      const eventData = JSON.parse(match[1]);
                      if (eventData.type === 'complete' && eventData.data?.finalAnswer) {
                        setResults(prev => prev.map(r =>
                          r.queryId === result.queryId
                            ? { ...r, answer: eventData.data.finalAnswer }
                            : r
                        ));
                      }
                    }
                  }
                });

              eventSource.close();
            } else if (data.type === 'error') {
              setResults(prev => prev.map(r =>
                r.queryId === result.queryId
                  ? { ...r, status: 'error', error: data.message || 'Unknown error' }
                  : r
              ));
              eventSource.close();
            }
          } catch (err) {
            console.error('Failed to parse event:', err);
          }
        };

        eventSource.onerror = () => {
          setResults(prev => prev.map(r =>
            r.queryId === result.queryId && r.status !== 'complete'
              ? { ...r, status: 'error', error: 'Connection lost' }
              : r
          ));
          eventSource.close();
        };
      });
    } catch (error) {
      console.error('Failed to parse queries:', error);
    }
  }, [queriesParam]);

  const completedCount = results.filter(r => r.status === 'complete').length;
  const totalCount = results.length;

  return (
    <>
      <LiquidEther />
      <div className="min-h-screen pt-16 relative">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/"
              className="text-gray-400 hover:text-white text-xs mb-2 inline-block transition-colors"
            >
              ← Back to Search
            </Link>
            <h1 className="text-xl font-semibold text-white">
              Methodology Comparison
            </h1>
            {query && (
              <p className="text-xs text-gray-400 mt-2 bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded px-3 py-2">
                <span className="font-medium">Query:</span> {query}
              </p>
            )}
            <div className="text-xs text-gray-500 mt-2">
              {completedCount}/{totalCount} methodologies complete
            </div>
          </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((result) => {
            const info = METHODOLOGY_INFO[result.methodology] || { label: result.methodology };

            return (
              <div
                key={result.queryId}
                className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg overflow-hidden flex flex-col"
              >
                {/* Card Header */}
                <div className="bg-gray-800/50 border-b border-gray-700 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{info.label}</span>
                    </div>
                    <div>
                      {result.status === 'processing' && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <span className="animate-spin">●</span>
                          {result.elapsed}s
                        </span>
                      )}
                      {result.status === 'complete' && (
                        <span className="text-xs text-white">{result.elapsed}s</span>
                      )}
                      {result.status === 'error' && (
                        <span className="text-xs text-gray-500">Error</span>
                      )}
                      {result.status === 'pending' && (
                        <span className="text-xs text-gray-600">Waiting</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col">
                  {result.status === 'processing' && (
                    <div className="flex items-center justify-center py-8">
                      <div>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                        <p className="text-xs text-gray-500 text-center">Processing...</p>
                      </div>
                    </div>
                  )}

                  {result.status === 'complete' && (
                    <div className="space-y-3 flex-1 flex flex-col">
                      {result.answer ? (
                        <div className="flex-1">
                          <p className="text-xs text-gray-300 leading-relaxed line-clamp-12">
                            {result.answer}
                          </p>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center">
                          <p className="text-xs text-gray-500">Loading answer...</p>
                        </div>
                      )}

                      <div className="pt-3 border-t border-gray-800 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Time:</span>
                          <span className="text-gray-300 font-medium">{result.elapsed}s</span>
                        </div>
                        {result.cost !== undefined && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Cost:</span>
                            <span className="text-gray-300 font-medium">${result.cost.toFixed(4)}</span>
                          </div>
                        )}
                        <Link
                          href={`/query/${result.queryId}`}
                          className="block text-xs text-gray-400 hover:text-white mt-2 transition-colors"
                        >
                          View full details →
                        </Link>
                      </div>
                    </div>
                  )}

                  {result.status === 'error' && (
                    <div className="bg-gray-800/50 border border-gray-700 rounded p-3">
                      <p className="text-xs text-gray-400">{result.error || 'Unknown error'}</p>
                      <Link
                        href={`/query/${result.queryId}`}
                        className="text-xs text-gray-400 hover:text-white mt-2 inline-block transition-colors"
                      >
                        View details →
                      </Link>
                    </div>
                  )}

                  {result.status === 'pending' && (
                    <div className="flex items-center justify-center py-8">
                      <p className="text-xs text-gray-500">Waiting to start...</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        {completedCount === totalCount && totalCount > 0 && (
          <div className="mt-6 bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Comparison Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {results.map((result) => {
                const info = METHODOLOGY_INFO[result.methodology] || {};
                return (
                  <div key={result.queryId} className="text-center">
                    <div className="text-xs text-gray-500 mb-1">{info.label}</div>
                    <div className="text-base font-semibold text-white">{result.elapsed || '-'}s</div>
                    {result.cost !== undefined && (
                      <div className="text-xs text-gray-600">${result.cost.toFixed(4)}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}
