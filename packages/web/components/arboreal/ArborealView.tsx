'use client';

/**
 * ARBOREAL VIEW
 *
 * Tree-layout view of the response. Same text as classic view, re-dispatched
 * visually into colored paragraph blocks positioned at Sefirot tree coordinates.
 *
 * Stack (top to bottom):
 *   1. Query metadata bar          (shared with classic)
 *   2. AI layers + mindmap panels  (shared with classic)
 *   3. Neural tree (compact)       (embedded GodViewTree)
 *   4. Paragraph tree              (NEW — commits 2-3)
 *   5. 5-line synthesis footer     (NEW — commit 6)
 *   6. Per-block chat              (NEW — commit 5)
 *
 * This commit is the empty shell only. Subsequent commits fill each slot.
 *
 * @module ArborealView
 */

import type { Message } from '@/lib/chat-store';

export interface ArborealViewProps {
  messages: Message[];
  isLoading: boolean;
}

export default function ArborealView({ messages, isLoading }: ArborealViewProps) {
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');

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
      <div className="h-12 flex items-center justify-center text-[9px] uppercase tracking-widest text-relic-silver/40 font-mono border border-dashed border-relic-mist/20 rounded">
        ai layers · mindmap · council — panels slot
      </div>
      <div className="h-40 flex items-center justify-center text-[9px] uppercase tracking-widest text-relic-silver/40 font-mono border border-dashed border-relic-mist/20 rounded">
        neural tree (compact GodViewTree) — slot
      </div>
      <div className="h-96 flex items-center justify-center text-[9px] uppercase tracking-widest text-relic-silver/40 font-mono border border-dashed border-emerald-500/30 rounded">
        ◇ paragraph tree — NEW · sefirot-positioned colored blocks · commit 2
      </div>
      <div className="h-24 flex items-center justify-center text-[9px] uppercase tracking-widest text-relic-silver/40 font-mono border border-dashed border-relic-mist/20 rounded">
        5-line synthesis footer — commit 6
      </div>
    </div>
  );
}
