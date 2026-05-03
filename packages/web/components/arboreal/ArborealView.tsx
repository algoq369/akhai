'use client';

import { useEffect, useMemo } from 'react';
import type { Message } from '@/lib/chat-store';
import ParagraphTree from './ParagraphTree';
import CouncilButton from '@/components/CouncilButton';
import CouncilPanel from '@/components/CouncilPanel';
import { useCouncilStore } from '@/lib/stores/council-store';
import { parseIntoSections } from '@/components/ResponseRenderer';

export interface ArborealViewProps {
  messages: Message[];
  isLoading: boolean;
  queryId?: string;
}

export default function ArborealView({ messages, isLoading, queryId }: ArborealViewProps) {
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const resolvedQueryId = queryId ?? lastUser?.id ?? '';

  const sections = useMemo(() => {
    if (!lastAssistant?.content) return [];
    return parseIntoSections(lastAssistant.content);
  }, [lastAssistant?.content]);

  const { results, isLoading: councilLoading } = useCouncilStore();
  const hasCouncilResult = results.some((r) => r.queryId === resolvedQueryId);

  // Auto-trigger council when arboreal view loads with a substantial response.
  useEffect(() => {
    if (!lastAssistant?.content || !lastUser?.content || !resolvedQueryId) return;
    if (lastAssistant.content.split(/\s+/).length < 100) return;
    if (hasCouncilResult || councilLoading) return;

    const query = lastUser.content;
    const response = lastAssistant.content;
    const timer = setTimeout(async () => {
      const store = useCouncilStore.getState();
      if (store.isLoading || store.results.some((r) => r.queryId === resolvedQueryId)) return;
      store.setLoading(true, resolvedQueryId);
      try {
        const res = await fetch('/api/god-view/council', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, response: response.slice(0, 4000) }),
        });
        if (!res.ok) throw new Error(`Council: ${res.status}`);
        const data = await res.json();
        store.addResult({
          queryId: resolvedQueryId,
          query,
          perspectives: data.perspectives,
          synthesis: data.synthesis,
          totalCost: data.totalCost,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error('[arboreal-council]', err);
        useCouncilStore.getState().setLoading(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    lastAssistant?.content,
    lastUser?.content,
    resolvedQueryId,
    hasCouncilResult,
    councilLoading,
  ]);

  if (!lastAssistant && !isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8 text-center">
        <span className="text-[10px] uppercase tracking-[0.3em] text-relic-silver/40 font-mono">
          ◇ arboreal view · awaiting response
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-4 space-y-6">
      {lastUser && (
        <div className="border-b border-relic-mist/20 dark:border-relic-slate/20 pb-3">
          <p className="text-sm text-relic-slate dark:text-relic-ghost font-mono">
            {lastUser.content}
          </p>
        </div>
      )}
      <div className="py-4">
        {sections.length > 0 ? (
          <ParagraphTree
            sections={sections}
            queryId={resolvedQueryId}
            query={lastUser?.content ?? ''}
          />
        ) : (
          <div className="h-40 flex items-center justify-center text-[9px] uppercase tracking-widest text-relic-silver/40 font-mono border border-dashed border-emerald-500/30 rounded">
            no sections detected in response
          </div>
        )}
      </div>
      {lastAssistant && !isLoading && (
        <div className="max-w-3xl mx-auto px-4 py-2">
          <CouncilButton
            queryId={resolvedQueryId}
            query={lastUser?.content ?? ''}
            response={lastAssistant.content}
          />
          <CouncilPanel queryId={resolvedQueryId} />
        </div>
      )}
    </div>
  );
}
