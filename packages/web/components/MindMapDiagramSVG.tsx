'use client';

import React from 'react';

interface MindMapDiagramHeaderProps {
  totalTopics: number;
  totalClusters: number;
  sharedCount: number;
  isLive: boolean;
  localSearch: string;
  setLocalSearch: (v: string) => void;
  zoom: number;
  zoomIn: () => void;
  zoomOut: () => void;
  fitView: () => void;
}

export function MindMapDiagramHeader({
  totalTopics,
  totalClusters,
  sharedCount,
  isLive,
  localSearch,
  setLocalSearch,
  zoom,
  zoomIn,
  zoomOut,
  fitView,
}: MindMapDiagramHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-1 bg-white dark:bg-[#111] border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-3">
        <span
          className="text-[9px] font-medium text-slate-700 dark:text-slate-300"
          style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
        >
          knowledge graph
        </span>
        <span className="text-[9px] text-neutral-400 dark:text-neutral-500 font-mono tracking-wide">
          {totalTopics} topics · {totalClusters} clusters
          {sharedCount > 0 && ` · ${sharedCount} shared`}
        </span>
        {isLive && (
          <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            live
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <svg
            className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="filter..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-32 pl-7 pr-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-slate-300 text-slate-700 dark:text-slate-300"
            style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
          />
        </div>

        <button
          onClick={zoomOut}
          className="px-2 py-0.5 text-[9px] text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
        >
          -
        </button>
        <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 w-10 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={zoomIn}
          className="px-2 py-0.5 text-[9px] text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
        >
          +
        </button>
        <button
          onClick={fitView}
          className="px-2 py-0.5 text-[9px] text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
        >
          fit
        </button>
      </div>
    </div>
  );
}

interface MindMapDiagramBottomBarProps {
  visibleLinksCount: number;
}

export function MindMapDiagramBottomBar({ visibleLinksCount }: MindMapDiagramBottomBarProps) {
  return (
    <>
      {visibleLinksCount > 0 && (
        <div className="absolute bottom-14 left-4 text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
          {visibleLinksCount} connections
        </div>
      )}
      <div
        className="px-4 py-1.5 bg-white dark:bg-[#111] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-500"
        style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
      >
        <div className="flex items-center gap-4">
          <span>drag to pan</span>
          <span>scroll to zoom</span>
          <span>click node to analyse</span>
          <span>&#x25C7; = shared topic</span>
        </div>
        <span>akhai clusplot</span>
      </div>
    </>
  );
}
