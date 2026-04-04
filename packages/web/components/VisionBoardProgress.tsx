'use client';

import React from 'react';
import { TopicProgress } from './VisionBoardTypes';

// ── Types ─────────────────────────────────────────────────────────────────────

interface VisionBoardProgressProps {
  topics: TopicProgress[];
  topicsLoading: boolean;
  maxQueries: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function VisionBoardProgress({
  topics,
  topicsLoading,
  maxQueries,
}: VisionBoardProgressProps) {
  return (
    <div className="w-52 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col">
      <div className="px-3 py-2 border-b border-slate-100">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          progress
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {topicsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
          </div>
        ) : topics.length === 0 ? (
          <p className="text-[10px] text-slate-400 text-center py-4">no topics yet</p>
        ) : (
          topics.map((t, i) => (
            <div
              key={i}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('topic-name', t.name);
                e.dataTransfer.setData('node-type', 'conversation');
                e.dataTransfer.setData('topic-data', JSON.stringify(t));
              }}
              className="group px-2 py-1.5 rounded-md hover:bg-slate-50 cursor-grab active:cursor-grabbing"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor:
                      t.category === 'technology'
                        ? '#6366f1'
                        : t.category === 'finance'
                          ? '#f59e0b'
                          : t.category === 'health'
                            ? '#db2777'
                            : t.category === 'science'
                              ? '#0284c7'
                              : '#64748b',
                  }}
                />
                <span className="text-[10px] text-slate-700 truncate flex-1">{t.name}</span>
              </div>
              <div className="mt-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-400 rounded-full transition-all"
                  style={{ width: `${(t.queryCount / maxQueries) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
