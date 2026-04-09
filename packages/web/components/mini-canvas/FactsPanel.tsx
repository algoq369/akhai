'use client';

import { useState } from 'react';
import type { FactBoxes, ChartConfig } from '@/lib/mini-canvas/content-classifier';

interface FactsPanelProps {
  facts: FactBoxes;
  charts: ChartConfig[];
}

const BOX_CONFIG = [
  {
    key: 'tangibleData' as const,
    title: 'TANGIBLE DATA',
    icon: '◆',
    color: 'border-l-blue-500',
  },
  {
    key: 'verifiable' as const,
    title: 'VERIFIABLE',
    icon: '✓',
    color: 'border-l-emerald-500',
  },
  {
    key: 'unrefutable' as const,
    title: 'UNREFUTABLE',
    icon: '◉',
    color: 'border-l-amber-500',
  },
  {
    key: 'nonBiased' as const,
    title: 'NON-BIASED',
    icon: '◎',
    color: 'border-l-purple-500',
  },
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

export default function FactsPanel({ facts, charts }: FactsPanelProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-1 p-2 max-h-[300px] overflow-y-auto">
      {BOX_CONFIG.map((box) => {
        const content = facts[box.key];
        const isOpen = !!expanded[box.key];
        const preview = content.split(/[.!?]/)[0]?.slice(0, 60) || content.slice(0, 60);
        return (
          <div
            key={box.key}
            className={`border-l-4 ${box.color} bg-white dark:bg-relic-void/40 rounded-r-lg shadow-sm`}
          >
            <button
              onClick={() => setExpanded((p) => ({ ...p, [box.key]: !p[box.key] }))}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 text-left"
            >
              <span className="text-[9px]">{box.icon}</span>
              <span className="text-[9px] font-medium uppercase tracking-wider text-relic-slate dark:text-relic-ghost flex-1">
                {box.title}
              </span>
              <span className="text-[8px] px-1 py-0.5 bg-relic-ghost/50 dark:bg-relic-slate/20 rounded text-relic-silver font-mono">
                {wordCount(content)}w
              </span>
              <span className="text-[8px] text-relic-silver">{isOpen ? '▲' : '▼'}</span>
            </button>
            {!isOpen && (
              <div className="px-2 pb-1.5 text-[9px] text-relic-silver/60 truncate">
                {preview}...
              </div>
            )}
            {isOpen && (
              <p className="px-2 pb-2 text-[9px] text-relic-slate dark:text-relic-ghost leading-relaxed">
                {content}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
