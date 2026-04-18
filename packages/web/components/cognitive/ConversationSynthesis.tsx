'use client';

/**
 * ConversationSynthesis — Zone 2 of the right panel.
 * Chapter-structured living narrative of the conversation.
 * Clicking a chapter highlights linked exchanges in Zone 1.
 */

import type { SynthesisChapter } from '@/lib/cognitive/llm-extractor';

interface ConversationSynthesisProps {
  chapters: SynthesisChapter[];
  onChapterClick: (exchangeIds: string[]) => void;
}

export default function ConversationSynthesis({
  chapters,
  onChapterClick,
}: ConversationSynthesisProps) {
  if (chapters.length === 0) return null;

  return (
    <div>
      <div className="px-4 pt-4 pb-2">
        <span className="text-[8px] uppercase tracking-[0.2em] text-relic-silver/40 font-mono">
          Conversation Story
        </span>
      </div>
      <div className="px-4 pb-4 space-y-3">
        {chapters.map((chapter, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onChapterClick(chapter.exchanges)}
            className="w-full text-left block border border-relic-mist/15 dark:border-relic-slate/10 rounded-md px-3 py-2.5 hover:bg-indigo-500/5 hover:border-indigo-500/20 transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h4 className="text-[10px] font-serif text-indigo-400/80 group-hover:text-indigo-400 transition-colors">
                {chapter.title}
              </h4>
              <span className="text-[7px] text-relic-silver/20 font-mono shrink-0">
                {chapter.exchanges.length} exchange{chapter.exchanges.length !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-[9px] leading-relaxed text-relic-slate/60 dark:text-relic-silver/40">
              {chapter.body}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
