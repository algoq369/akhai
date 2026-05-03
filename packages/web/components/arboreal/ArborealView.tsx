'use client';

/**
 * ARBOREAL VIEW
 *
 * Tree-layout view of the response. Same text as classic view, re-dispatched
 * visually into colored paragraph blocks positioned at Sefirot tree coordinates.
 *
 * Stack (top to bottom):
 *   1. Query bar
 *   2. Paragraph tree (colored blocks at Sefirot positions)
 *   3. 5-line synthesis footer
 *
 * @module ArborealView
 */

import { useMemo } from 'react';
import type { Message } from '@/lib/chat-store';
import ParagraphTree from './ParagraphTree';
import SynthesisFooter from './SynthesisFooter';
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
      {lastAssistant?.content && <SynthesisFooter responseText={lastAssistant.content} />}
    </div>
  );
}
