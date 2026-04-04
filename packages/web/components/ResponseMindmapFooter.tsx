'use client';

import type { MindmapNode } from './ResponseMindmap.types';

interface MindmapFooterProps {
  conceptCount: number;
  nodes: MindmapNode[];
  methodology: string;
  accentGradient: { from: string; to: string };
  footerContent: { focus: string; quality: string; action: string };
}

export default function MindmapFooter({
  conceptCount,
  nodes,
  methodology,
  accentGradient,
  footerContent,
}: MindmapFooterProps) {
  return (
    <div className="px-4 py-3 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-850 dark:via-slate-900 dark:to-slate-850 border-t border-slate-200 dark:border-slate-700">
      {/* High-Level Stats Row */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${accentGradient.from}, ${accentGradient.to})`,
              }}
            />
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
              Topics:
            </span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {conceptCount}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
              Root:
            </span>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium max-w-[150px] truncate">
              {nodes[0]?.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
              Method:
            </span>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium uppercase">
              {methodology}
            </span>
          </div>
        </div>
      </div>

      {/* 3-Line Synthetic Explanation - Tailored to Query */}
      <div className="space-y-1.5">
        <div className="flex items-start gap-2">
          <span className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wide flex-shrink-0">
            Focus:
          </span>
          <p className="text-[10px] text-slate-700 dark:text-slate-300 leading-relaxed">
            {footerContent.focus}
          </p>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wide flex-shrink-0">
            Quality:
          </span>
          <p className="text-[10px] text-slate-700 dark:text-slate-300 leading-relaxed">
            {footerContent.quality}
          </p>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-[9px] text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wide flex-shrink-0">
            Action:
          </span>
          <p className="text-[10px] text-slate-700 dark:text-slate-300 leading-relaxed">
            {footerContent.action}
          </p>
        </div>
      </div>
    </div>
  );
}
