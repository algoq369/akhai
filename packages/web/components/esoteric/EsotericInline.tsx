'use client';

import Link from 'next/link';
import { useEsotericStore } from '@/lib/stores/esoteric-store';
import { detectEsotericRelevance } from '@/lib/esoteric/relevance';
import convergenceRaw from '@/lib/esoteric/data/convergence.json';

interface EsotericInlineProps {
  query: string;
  messageId: string;
}

const conv = convergenceRaw.current;

export default function EsotericInline({ query, messageId }: EsotericInlineProps) {
  const isEnabled = useEsotericStore((s) => s.isEnabled);

  if (!isEnabled) return null;
  if (!query || !detectEsotericRelevance(query)) return null;

  const signals = conv.frameworks
    .filter((f) => f.signal.includes('crisis'))
    .map((f) => f.name)
    .slice(0, 3);

  return (
    <div className="mt-2 border border-zinc-200 rounded-lg p-2.5 border-l-2 border-l-[#7F77DD]">
      <div className="text-[10px] font-mono font-medium text-zinc-600">
        {'\u25CA'} MACRO-CYCLICAL SIGNAL · {conv.score}/{conv.maxScore} convergence
      </div>
      <div className="text-[9px] font-mono text-zinc-400 mt-0.5">
        {signals.join(' + ')} — {conv.label.toLowerCase()}
      </div>
      <Link
        href="/constellation"
        className="text-[9px] font-mono text-purple-500 hover:text-purple-700 underline mt-1 inline-block"
      >
        Explore in Constellation {'\u2192'}
      </Link>
    </div>
  );
}
