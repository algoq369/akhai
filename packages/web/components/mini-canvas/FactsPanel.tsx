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

export default function FactsPanel({ facts }: FactsPanelProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showMore, setShowMore] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-0.5 p-1.5 max-h-[400px] overflow-y-auto">
      {BOX_CONFIG.map((box) => {
        const content = facts[box.key];
        const isOpen = !!expanded[box.key];
        const isFull = !!showMore[box.key];
        return (
          <div
            key={box.key}
            className={`border-l-2 ${box.color} bg-white dark:bg-relic-void/40 rounded-r-lg shadow-sm`}
          >
            <button
              onClick={() => setExpanded((p) => ({ ...p, [box.key]: !p[box.key] }))}
              className="w-full flex items-center gap-1.5 px-1.5 py-1 text-left"
            >
              <span className="text-[9px]">{box.icon}</span>
              <span className="text-[10px] font-medium uppercase tracking-wide text-relic-slate dark:text-relic-ghost flex-1">
                {box.title}
              </span>
              <span className="text-[8px] px-1 bg-zinc-100 dark:bg-relic-slate/20 rounded text-relic-silver font-mono">
                {wordCount(content)}w
              </span>
              <span className="text-[8px] text-relic-silver">{isOpen ? '▲' : '▼'}</span>
            </button>
            {isOpen && (
              <div className="px-1.5 pb-1.5">
                <p
                  className={`text-[9px] text-relic-slate dark:text-relic-ghost leading-relaxed ${!isFull ? 'line-clamp-2' : ''}`}
                >
                  {content}
                </p>
                {content.length > 120 && (
                  <button
                    onClick={() => setShowMore((p) => ({ ...p, [box.key]: !p[box.key] }))}
                    className="text-[8px] text-blue-500 hover:underline mt-0.5"
                  >
                    {isFull ? 'show less' : 'show more'}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
