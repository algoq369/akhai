'use client';

import LayerResponse from '@/components/LayerResponse';
import InsightMindmap from '@/components/InsightMindmap';
import ResponseMindmap from '@/components/ResponseMindmap';
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

      {/* LAYERS VIEW - Always show when tab visible (content > 200 chars) */}
      {globalVizMode !== 'off' && effectiveVizMode === 'layers' && message.content.length > 200 && (
        <LayerResponse
          content={message.content}
          query={previousUserQuery}
          methodology={message.methodology || methodology}
          onSwitchToInsight={() => onSetVizMode('insight')}
          onOpenMindMap={onOpenMindMap}
          onDeepDive={(query) => onDeepDive(query)}
        />
      )}

      {/* INSIGHT MINDMAP - Always show when tab selected + content > 200 */}
      {globalVizMode !== 'off' && currentVizMode === 'insight' && message.content.length > 200 && (
        <InsightMindmap
          content={message.content}
          query={previousUserQuery}
          methodology={message.methodology || methodology}
          onSwitchToLayers={() => onSetVizMode('layers')}
          onOpenMindMap={onOpenMindMap}
        />
      )}

      {/* MINDMAP VIEW - Always show when tab selected + content > 200 */}
      {globalVizMode !== 'off' && currentVizMode === 'mindmap' && message.content.length > 200 && (
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
