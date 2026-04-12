'use client';

import { useState, useRef, type ReactNode } from 'react';
import type { LexiconTerm } from '@/lib/esoteric/types';
import lexiconRaw from '@/lib/esoteric/data/lexicon.json';

const terms = lexiconRaw.terms as LexiconTerm[];

interface EsotericTooltipProps {
  termId: string;
  children: ReactNode;
}

export default function EsotericTooltip({ termId, children }: EsotericTooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const term = terms.find((t) => t.id === termId);

  if (!term) return <>{children}</>;

  const handleEnter = () => {
    timerRef.current = setTimeout(() => setVisible(true), 300);
  };

  const handleLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  };

  return (
    <span
      className="relative inline-block cursor-help"
      style={{ borderBottom: '1px dotted #d4d4d8' }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {children}
      {visible && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 w-[250px] bg-zinc-900/95 backdrop-blur text-zinc-200 p-2.5 rounded-md border border-zinc-700/50 pointer-events-auto">
          <span className="block text-[11px] font-bold mb-1">{term.name}</span>
          <span className="block text-[10px] text-zinc-400 leading-relaxed line-clamp-2">
            {term.plain}
          </span>
          <a
            href="/guide"
            className="block text-[9px] text-purple-400 mt-1.5 hover:text-purple-300 transition-colors"
          >
            Full definition {'\u2192'}
          </a>
        </span>
      )}
    </span>
  );
}
