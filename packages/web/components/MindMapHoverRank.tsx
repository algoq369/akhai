'use client';

import React, { useEffect, useState } from 'react';
import type { Node } from './MindMap';

/**
 * M4a — top-3 richest connected topics overlay, shown near the hovered node.
 * useHoverRank fetches the $0 graph rank from /api/mindmap/rank; the component renders it.
 */

export interface HoverRankItem {
  topicId: string;
  name: string;
  category: string;
  score: number;
}

export interface HoverRankState {
  topicId: string;
  ranked: HoverRankItem[];
}

/**
 * On hover, fetch the top-3 richest connected topics ($0 graph rank, no provider call). Debounced
 * so a quick sweep across nodes doesn't fire a request per node; aborts the in-flight one on change.
 */
export function useHoverRank(hoveredNode: string | null): HoverRankState | null {
  const [hoverRank, setHoverRank] = useState<HoverRankState | null>(null);
  useEffect(() => {
    if (!hoveredNode) {
      setHoverRank(null);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/mindmap/rank?topicId=${encodeURIComponent(hoveredNode)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        setHoverRank({ topicId: hoveredNode, ranked: data.ranked || [] });
      } catch {
        /* aborted or offline — leave the previous overlay */
      }
    }, 160);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [hoveredNode]);
  return hoverRank;
}

interface MindMapHoverRankProps {
  hoverRank: HoverRankState | null;
  hoveredNode: string | null;
  getPos: (id: string) => { x: number; y: number } | null;
  zoom: number;
  pan: { x: number; y: number };
  allNodes: Node[];
}

export default function MindMapHoverRank({
  hoverRank,
  hoveredNode,
  getPos,
  zoom,
  pan,
  allNodes,
}: MindMapHoverRankProps) {
  if (!hoverRank || !hoveredNode || hoverRank.topicId !== hoveredNode || hoverRank.ranked.length === 0)
    return null;
  const p = getPos(hoveredNode);
  if (!p) return null;
  const left = p.x * zoom + pan.x + 16;
  const top = p.y * zoom + pan.y - 8;
  return (
    <div
      className="absolute z-20 pointer-events-none rounded-md border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-[#111]/95 shadow-lg px-2.5 py-1.5"
      style={{ left, top, fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
    >
      <div className="text-[8px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
        richest connections
      </div>
      {hoverRank.ranked.map((r, i) => {
        const color = allNodes.find((n) => n.id === r.topicId)?.color || '#94a3b8';
        return (
          <div key={r.topicId} className="flex items-center gap-1.5 py-0.5">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 w-3">{i + 1}</span>
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-[10px] text-slate-700 dark:text-slate-200 max-w-[160px] truncate">
              {r.name}
            </span>
            <span className="text-[8px] text-slate-400 dark:text-slate-500 ml-1">
              {Math.round(r.score * 100)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
