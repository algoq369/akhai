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
        <div>
          <LayerResponse
            content={message.content}
            query={previousUserQuery}
            methodology={message.methodology || methodology}
            intelligence={message.intelligence}
            onSwitchToInsight={() => onSetVizMode('insight')}
            onOpenMindMap={onOpenMindMap}
            onDeepDive={(query) => onDeepDive(query)}
          />
          {/* Guaranteed fallback — always visible */}
          <div className="mt-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded text-[10px] text-slate-500 dark:text-slate-400 font-mono">
            ◎ {message.content.split(/\s+/).length} words ·{' '}
            {message.content.split(/[.!?]+/).filter((s: string) => s.trim()).length} sentences ·{' '}
            {message.methodology || methodology}
          </div>
        </div>
      )}

      {/* INSIGHT MINDMAP - Always show when tab selected + content > 200 */}
      {globalVizMode !== 'off' && currentVizMode === 'insight' && message.content.length > 200 && (
        <div>
          <InsightMindmap
            content={message.content}
            query={previousUserQuery}
            methodology={message.methodology || methodology}
            onSwitchToLayers={() => onSetVizMode('layers')}
            onOpenMindMap={onOpenMindMap}
            onDeepDive={(q) => onDeepDive(q)}
          />
          {/* Guaranteed fallback — key sentences always visible */}
          <div className="mt-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded">
            <div className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              Key sentences
            </div>
            <ul className="space-y-0.5">
              {message.content
                .split(/[.!?]+/)
                .filter((s: string) => s.trim().length > 20)
                .slice(0, 4)
                .map((s: string, i: number) => (
                  <li
                    key={i}
                    className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed"
                  >
                    · {s.replace(/[#*`\-]/g, '').trim()}
                  </li>
                ))}
            </ul>
          </div>
        </div>
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
          {/* Guaranteed fallback — keywords always visible */}
          <div className="mt-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded">
            <div className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              Topics
            </div>
            <div className="flex flex-wrap gap-1">
              {[
                ...new Set(
                  message.content
                    .split(/\s+/)
                    .filter((w: string) => w.length > 5 && /^[a-zA-Z]+$/.test(w))
                    .map((w: string) => w.toLowerCase())
                ),
              ]
                .slice(0, 8)
                .map((w: string, i: number) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[9px] text-slate-500 dark:text-slate-400 font-mono"
                  >
                    {w}
                  </span>
                ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
