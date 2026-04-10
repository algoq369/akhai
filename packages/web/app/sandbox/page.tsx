'use client';

import { useCallback, useState } from 'react';
import { useSandboxStore } from '@/lib/stores/sandbox-store';
import SandboxInput from '@/components/god-view/SandboxInput';
import ScenarioTimeline from '@/components/god-view/ScenarioTimeline';
import ScenarioReport from '@/components/god-view/ScenarioReport';
import ScenarioChat from '@/components/god-view/ScenarioChat';
import EntityGraph from '@/components/god-view/EntityGraph';
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

  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [chatBranchId, setChatBranchId] = useState<string | null>(null);

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

  const chatBranch = chatBranchId ? branches.find((b) => b.id === chatBranchId) : null;

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

        {/* Entity Graph */}
        {entities && entities.entities.length > 0 && (
          <div className="mb-6">
            <EntityGraph entities={entities} />
          </div>
        )}

        {/* Scenario Timeline */}
        {(branches.length > 0 || isLoading) && (
          <div className="mb-8">
            <ScenarioTimeline
              branches={branches}
              onSelect={(id) => setSelectedBranch(id)}
              isLoading={isLoading && branches.length === 0}
            />
          </div>
        )}

        {/* Scenario Report Cards */}
        {branches.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {branches.map((branch) => (
              <ScenarioReport
                key={branch.id}
                branch={branch}
                isSelected={selectedBranch === branch.id}
                onSelect={() => setSelectedBranch(branch.id)}
                onChat={() => setChatBranchId(branch.id)}
              />
            ))}
          </div>
        )}

        {/* Scenario Chat */}
        {chatBranch && (
          <div className="mb-6">
            <ScenarioChat branch={chatBranch} onClose={() => setChatBranchId(null)} />
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
