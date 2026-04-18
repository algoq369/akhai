'use client';

/**
 * Shared lens entry rendering — used by both InlineDialogue and MetadataMirror
 * to avoid duplicating the 12-lens display logic.
 */

import { LENS_MAP } from '@/lib/cognitive/lenses';
import type { InlineDialogueEntry } from '@/lib/cognitive/llm-extractor';

interface LensEntriesProps {
  entries: InlineDialogueEntry[];
}

export default function LensEntries({ entries }: LensEntriesProps) {
  return (
    <div className="space-y-2">
      {entries.map((entry, i) => {
        const lens = LENS_MAP.get(entry.lens_id);
        if (!lens) return null;
        return (
          <div key={i} className="flex items-start gap-2">
            <span style={{ color: lens.color }} className="shrink-0 mt-0.5 text-[11px]">
              {lens.sigil}
            </span>
            <div className="min-w-0">
              <span
                className="text-[7px] uppercase tracking-[0.15em] font-serif"
                style={{ color: lens.color }}
              >
                {lens.name}
              </span>
              <p className="text-[9px] leading-relaxed text-relic-slate/70 dark:text-relic-silver/50 mt-0.5">
                {entry.text}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
