'use client';

import { useState } from 'react';
import type { FactBoxes, ChartConfig } from '@/lib/mini-canvas/content-classifier';

interface FactsPanelProps {
  facts: FactBoxes;
  charts: ChartConfig[];
}

const BOX_CONFIG = [
  { key: 'tangibleData' as const, title: 'TANGIBLE DATA', icon: '◆', color: 'border-l-blue-500' },
  { key: 'verifiable' as const, title: 'VERIFIABLE', icon: '✓', color: 'border-l-emerald-500' },
  { key: 'unrefutable' as const, title: 'UNREFUTABLE', icon: '◉', color: 'border-l-amber-500' },
  { key: 'nonBiased' as const, title: 'NON-BIASED', icon: '◎', color: 'border-l-purple-500' },
  {
    key: 'straightForward' as const,
    title: 'STRAIGHT FORWARD',
    icon: '→',
    color: 'border-l-red-500',
  },
];

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function firstTwoSentences(text: string): { preview: string; hasMore: boolean } {
  const parts = text.split(/(?<=[.!?])\s+/);
  if (parts.length <= 2) return { preview: text, hasMore: false };
  return { preview: parts.slice(0, 2).join(' ').trim(), hasMore: true };
}

export default function FactsPanel({ facts }: FactsPanelProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-0.5 p-1.5 max-h-[400px] overflow-y-auto">
      {BOX_CONFIG.map((box) => {
        const content = facts[box.key];
        const isOpen = !!expanded[box.key];
        const { preview, hasMore } = firstTwoSentences(content);
        return (
          <div
            key={box.key}
            className={`border-l-2 ${box.color} bg-white dark:bg-relic-void/40 rounded-r-lg shadow-sm`}
          >
            <div className="flex items-center gap-1.5 px-1.5 py-1">
              <span className="text-[9px]">{box.icon}</span>
              <span className="text-[10px] font-medium uppercase tracking-wide text-relic-slate dark:text-relic-ghost flex-1">
                {box.title}
              </span>
              <span className="text-[8px] px-1 bg-zinc-100 dark:bg-relic-slate/20 rounded text-relic-silver font-mono">
                {wordCount(content)}w
              </span>
            </div>
            <div className="px-3 pb-2 text-[10px] text-relic-slate dark:text-relic-ghost/80 leading-relaxed">
              {isOpen ? content : preview}
              {hasMore && (
                <button
                  onClick={() => setExpanded((p) => ({ ...p, [box.key]: !p[box.key] }))}
                  className="ml-1 text-[8px] text-relic-silver hover:text-relic-slate"
                >
                  {isOpen ? '▲ less' : '▼ more'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
