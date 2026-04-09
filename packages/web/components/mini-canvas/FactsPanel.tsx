'use client';

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
    desc: 'Concrete, measurable data points',
    color: 'border-l-blue-500',
  },
  {
    key: 'verifiable' as const,
    title: 'VERIFIABLE',
    icon: '✓',
    desc: 'Independently verifiable with sources',
    color: 'border-l-emerald-500',
  },
  {
    key: 'unrefutable' as const,
    title: 'UNREFUTABLE',
    icon: '◉',
    desc: 'Consensus conclusions',
    color: 'border-l-amber-500',
  },
  {
    key: 'nonBiased' as const,
    title: 'NON-BIASED',
    icon: '◎',
    desc: 'Neutral factual synthesis',
    color: 'border-l-purple-500',
  },
  {
    key: 'straightForward' as const,
    title: 'STRAIGHT FORWARD',
    icon: '→',
    desc: 'Direct factual conclusion',
    color: 'border-l-red-500',
  },
];

export default function FactsPanel({ facts, charts }: FactsPanelProps) {
  return (
    <div className="space-y-2 p-2">
      {BOX_CONFIG.map((box) => {
        const content = facts[box.key];
        return (
          <div
            key={box.key}
            className={`border-l-4 ${box.color} bg-white dark:bg-relic-void/40 rounded-r-lg p-2.5 shadow-sm`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px]">{box.icon}</span>
              <span className="text-[9px] font-medium uppercase tracking-wider text-relic-slate dark:text-relic-ghost">
                {box.title}
              </span>
            </div>
            <div className="text-[8px] text-relic-silver/50 italic mb-1.5">{box.desc}</div>
            <p className="text-[10px] text-relic-slate dark:text-relic-ghost leading-relaxed">
              {content}
            </p>
          </div>
        );
      })}
    </div>
  );
}
