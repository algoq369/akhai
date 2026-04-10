'use client';

import { useCallback } from 'react';
import { useSandboxStore } from '@/lib/stores/sandbox-store';
import SandboxInput from '@/components/god-view/SandboxInput';
import type { ScenarioBranch, EntityResult } from '@/lib/god-view/scenario-engine';

export default function SandboxPage() {
  const {
    isLoading,
    entities,
    branches,
    totalCost,
    totalLatency,
    error,
    status,
    setLoading,
    setEntities,
    addBranch,
    setComplete,
    setError,
    setStatus,
    setInput,
    reset,
  } = useSandboxStore();

  const handleSubmit = useCallback(
    async (data: { seed: string; url: string; question: string; domain: string }) => {
      reset();
      setInput(data.seed, data.question, data.domain);
      setLoading(true);
      setStatus('Connecting...');

      try {
        const res = await fetch('/api/god-view/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seed: data.seed, question: data.question, domain: data.domain }),
        });

        if (!res.ok) {
          const err = await res.json();
          setError(err.error || 'Request failed');
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          setError('No response stream');
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let eventType = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith('data: ') && eventType) {
              const payload = JSON.parse(line.slice(6));
              switch (eventType) {
                case 'status':
                  setStatus(payload as string);
                  break;
                case 'entities':
                  setEntities(payload as EntityResult);
                  break;
                case 'branch':
                  addBranch(payload as ScenarioBranch);
                  break;
                case 'complete': {
                  const { totalCost: cost, totalLatency: latency } = payload as {
                    totalCost: number;
                    totalLatency: number;
                  };
                  setComplete(cost, latency);
                  break;
                }
                case 'error':
                  setError((payload as { error: string }).error);
                  break;
              }
              eventType = '';
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Connection failed');
      }
    },
    [reset, setInput, setLoading, setStatus, setEntities, addBranch, setComplete, setError]
  );

  const confidenceColor = (c: number) => {
    if (c >= 70) return 'text-emerald-500';
    if (c >= 40) return 'text-amber-500';
    return 'text-red-400';
  };

  const lensAccent = (id: string) => {
    if (id === 'optimistic') return 'border-emerald-500/30';
    if (id === 'pessimistic') return 'border-red-500/30';
    return 'border-slate-400/30 dark:border-relic-ghost/30';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-relic-void dark:to-relic-void/90">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-mono text-lg text-slate-800 dark:text-white tracking-wide">
            SCENARIO SANDBOX
          </h1>
          <p className="font-mono text-[11px] text-slate-500 dark:text-relic-ghost mt-1">
            Predict divergent futures from any seed material
          </p>
        </div>

        {/* Input Form */}
        <div className="border border-slate-200 dark:border-relic-slate/30 rounded-lg p-5 mb-8 bg-white/50 dark:bg-relic-void/50 backdrop-blur-sm">
          <SandboxInput onSubmit={handleSubmit} isLoading={isLoading} />
        </div>

        {/* Status */}
        {status && isLoading && (
          <div className="font-mono text-[11px] text-slate-500 dark:text-relic-ghost mb-6 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            {status}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="font-mono text-[11px] text-red-500 border border-red-500/20 rounded px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {/* Entity Summary */}
        {entities && entities.entities.length > 0 && (
          <div className="mb-6">
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-slate-500 dark:text-relic-ghost mb-2">
              Entities Detected
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {entities.entities.map((e, i) => (
                <span
                  key={i}
                  className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-relic-slate/20 text-slate-600 dark:text-relic-ghost"
                >
                  {e.name}
                  <span className="ml-1 text-slate-400 dark:text-relic-ghost/50">{e.type}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Branch Results */}
        {branches.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-slate-500 dark:text-relic-ghost">
              Scenario Branches ({branches.length}/3)
            </h2>
            {branches.map((branch) => (
              <div
                key={branch.id}
                className={`border ${lensAccent(branch.id)} rounded-lg p-5 bg-white/50 dark:bg-relic-void/50 backdrop-blur-sm`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 dark:text-relic-ghost/60">
                      {branch.id}
                    </span>
                    <h3 className="font-mono text-sm text-slate-800 dark:text-white mt-0.5">
                      {branch.title}
                    </h3>
                  </div>
                  <span className={`font-mono text-xs ${confidenceColor(branch.confidence)}`}>
                    {branch.confidence}%
                  </span>
                </div>
                <p className="font-mono text-xs text-slate-600 dark:text-relic-ghost leading-relaxed">
                  {branch.summary.split('. ').slice(0, 2).join('. ')}.
                </p>
                {branch.keyEvents.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {branch.keyEvents.slice(0, 3).map((evt, i) => (
                      <div
                        key={i}
                        className="font-mono text-[10px] text-slate-500 dark:text-relic-ghost/60"
                      >
                        {evt}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Cost Summary */}
        {totalCost > 0 && !isLoading && (
          <div className="mt-6 font-mono text-[10px] text-slate-400 dark:text-relic-ghost/50 flex items-center gap-4">
            <span>Cost: ${totalCost.toFixed(4)}</span>
            <span>Latency: {(totalLatency / 1000).toFixed(1)}s</span>
          </div>
        )}
      </div>
    </div>
  );
}
