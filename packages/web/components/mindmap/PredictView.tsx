'use client';

import { useCallback, useState } from 'react';
import { useSandboxStore } from '@/lib/stores/sandbox-store';
import SandboxInput from '@/components/god-view/SandboxInput';
import ScenarioTimeline from '@/components/god-view/ScenarioTimeline';
import ScenarioReport from '@/components/god-view/ScenarioReport';
import ScenarioChat from '@/components/god-view/ScenarioChat';
import EntityGraph from '@/components/god-view/EntityGraph';
import type { ScenarioBranch, EntityResult } from '@/lib/god-view/scenario-engine';

export default function PredictView() {
  const {
    isLoading, entities, branches, totalCost, totalLatency, error, status,
    setLoading, setEntities, addBranch, setComplete, setError, setStatus, setInput, reset,
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
        if (!reader) { setError('No response stream'); return; }

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
                case 'status': setStatus(payload as string); break;
                case 'entities': setEntities(payload as EntityResult); break;
                case 'branch': addBranch(payload as ScenarioBranch); break;
                case 'complete': {
                  const { totalCost: cost, totalLatency: latency } = payload as { totalCost: number; totalLatency: number };
                  setComplete(cost, latency);
                  break;
                }
                case 'error': setError((payload as { error: string }).error); break;
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
    <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-120px)]">
      <div className="border border-slate-200 dark:border-relic-slate/30 rounded-lg p-4 bg-white/50 dark:bg-relic-void/50">
        <SandboxInput onSubmit={handleSubmit} isLoading={isLoading} />
      </div>

      {status && isLoading && (
        <div className="font-mono text-[11px] text-slate-500 flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          {status}
        </div>
      )}

      {error && (
        <div className="font-mono text-[11px] border border-red-500/20 bg-red-50/50 rounded px-3 py-2">
          <span className="text-red-500">{error}</span>
        </div>
      )}

      {entities && entities.entities.length > 0 && <EntityGraph entities={entities} />}

      {(branches.length > 0 || isLoading) && (
        <ScenarioTimeline branches={branches} onSelect={setSelectedBranch} isLoading={isLoading && branches.length === 0} />
      )}

      {branches.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
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

      {chatBranch && <ScenarioChat branch={chatBranch} onClose={() => setChatBranchId(null)} />}

      {totalCost > 0 && !isLoading && (
        <div className="font-mono text-[10px] text-slate-400 flex gap-4">
          <span>Cost: ${totalCost.toFixed(4)}</span>
          <span>Latency: {(totalLatency / 1000).toFixed(1)}s</span>
        </div>
      )}
    </div>
  );
}
