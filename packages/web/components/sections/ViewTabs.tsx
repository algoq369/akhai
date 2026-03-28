'use client';

import LayerResponse, { shouldShowLayers } from '@/components/LayerResponse';
import InsightMindmap, { shouldShowInsightMap } from '@/components/InsightMindmap';
import ResponseMindmap, { shouldShowMindmap } from '@/components/ResponseMindmap';
import type { Message } from '@/lib/chat-store';

export interface ViewTabsProps {
  message: Message;
  previousUserQuery: string;
  currentVizMode: 'layers' | 'insight' | 'text' | 'mindmap' | undefined;
  globalVizMode: 'off' | 'synthesis' | 'insight';
  methodology: string;
  onSetVizMode: (mode: 'layers' | 'insight' | 'text' | 'mindmap') => void;
  onOpenMindMap: () => void;
  onDeepDive: (query: string) => void;
}

export default function ViewTabs({
  message,
  previousUserQuery,
  currentVizMode,
  globalVizMode,
  methodology,
  onSetVizMode,
  onOpenMindMap,
  onDeepDive,
}: ViewTabsProps) {
  const effectiveVizMode = currentVizMode || 'layers';

  return (
    <>
      {/* View Mode Toggle */}
      {globalVizMode !== 'off' && message.content.length > 200 && (
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-relic-mist/30">
          <span className="text-[9px] text-relic-silver uppercase tracking-wide">View:</span>
          <button
            onClick={() => onSetVizMode('layers')}
            className={`px-2 py-1 text-[9px] rounded-md transition-all ${
              effectiveVizMode === 'layers'
                ? 'bg-indigo-100 text-indigo-700 font-medium'
                : 'text-relic-silver hover:bg-relic-ghost'
            }`}
          >
            ◎ AI Layers
          </button>
          <button
            onClick={() => onSetVizMode('insight')}
            className={`px-2 py-1 text-[9px] rounded-md transition-all ${
              currentVizMode === 'insight'
                ? 'bg-purple-100 text-purple-700 font-medium'
                : 'text-relic-silver hover:bg-relic-ghost'
            }`}
          >
            ◇ Insight
          </button>
          <button
            onClick={() => onSetVizMode('mindmap')}
            className={`px-2 py-1 text-[9px] rounded-md transition-all ${
              currentVizMode === 'mindmap'
                ? 'bg-emerald-100 text-emerald-700 font-medium'
                : 'text-relic-silver hover:bg-relic-ghost'
            }`}
          >
            ◈ Mindmap
          </button>
        </div>
      )}

      {/* LAYERS VIEW - Sovereign Intelligence Tree */}
      {globalVizMode !== 'off' &&
        effectiveVizMode === 'layers' &&
        shouldShowLayers(message.content, !!message.gnostic) && (
          <LayerResponse
            content={message.content}
            query={previousUserQuery}
            methodology={message.methodology || methodology}
            onSwitchToInsight={() => onSetVizMode('insight')}
            onOpenMindMap={onOpenMindMap}
            onDeepDive={(query) => onDeepDive(query)}
          />
        )}

      {/* INSIGHT MINDMAP - Grokipedia-style knowledge graph */}
      {globalVizMode !== 'off' &&
        currentVizMode === 'insight' &&
        shouldShowInsightMap(message.content, !!message.gnostic) && (
          <InsightMindmap
            content={message.content}
            query={previousUserQuery}
            methodology={message.methodology || methodology}
            onSwitchToLayers={() => onSetVizMode('layers')}
            onOpenMindMap={onOpenMindMap}
          />
        )}

      {/* MINDMAP VIEW - Visual concept map */}
      {globalVizMode !== 'off' &&
        currentVizMode === 'mindmap' &&
        shouldShowMindmap(message.content, message.topics) && (
          <div className="mb-6">
            <ResponseMindmap
              content={message.content}
              topics={message.topics}
              isVisible={true}
              onToggle={() => {}}
              methodology={message.methodology || methodology}
              query={previousUserQuery}
            />
          </div>
        )}
    </>
  );
}
