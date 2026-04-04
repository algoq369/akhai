'use client';

import React from 'react';
import { BoardNode, NODE_COLORS } from './VisionBoardTypes';
import { VIZ_RENDERERS } from './VisionBoardRenderers';

// ── Types ─────────────────────────────────────────────────────────────────────

interface VisionBoardNodeProps {
  node: BoardNode;
  isSelected: boolean;
  isEditing: boolean;
  onMouseDown: (e: React.MouseEvent, id: string) => void;
  onDoubleClick: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateData: (id: string, patch: Partial<BoardNode['data']>) => void;
  onStopEditing: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function VisionBoardNode({
  node,
  isSelected,
  isEditing,
  onMouseDown,
  onDoubleClick,
  onDelete,
  onUpdateData,
  onStopEditing,
}: VisionBoardNodeProps) {
  const style = NODE_COLORS[node.type] || NODE_COLORS.note;
  const VizRenderer = VIZ_RENDERERS[node.type];

  return (
    <div
      onMouseDown={(e) => onMouseDown(e, node.id)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (!VizRenderer) onDoubleClick(node.id);
      }}
      className="absolute rounded-lg border shadow-sm select-none"
      style={{
        left: node.x,
        top: node.y,
        width: node.w,
        height: node.h,
        backgroundColor: style.bg,
        borderColor: isSelected ? '#18181b' : style.border,
        borderWidth: isSelected ? 2 : 1,
        zIndex: isSelected ? 10 : 1,
      }}
    >
      <div
        className="flex items-center justify-between px-2 py-1 border-b"
        style={{ borderColor: style.border + '40' }}
      >
        <span
          className="text-[8px] font-semibold uppercase tracking-wider"
          style={{ color: style.border }}
        >
          {style.label}
        </span>
        {isSelected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.id);
            }}
            className="text-[10px] text-slate-400 hover:text-red-500"
          >
            x
          </button>
        )}
      </div>
      <div className="overflow-hidden" style={{ height: node.h - 28 }}>
        {VizRenderer && node.data?.vizData ? (
          <VizRenderer data={node.data?.vizData} />
        ) : isEditing ? (
          <div className="px-2 py-1 space-y-1">
            <input
              autoFocus
              value={node.data?.title || ''}
              onChange={(e) => onUpdateData(node.id, { title: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onStopEditing();
              }}
              placeholder="title"
              className="w-full text-[10px] font-medium text-slate-800 bg-transparent outline-none border-b border-slate-200 pb-0.5"
            />
            <textarea
              value={node.data?.body || ''}
              onChange={(e) => onUpdateData(node.id, { body: e.target.value })}
              placeholder="notes..."
              className="w-full text-[9px] text-slate-600 bg-transparent outline-none resize-none"
              style={{ height: node.h - 56 }}
            />
          </div>
        ) : node.type === 'conversation' ? (
          <div className="px-2 py-1.5">
            <div
              className="text-[11px] font-medium text-slate-800 overflow-hidden"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical' as any,
                wordBreak: 'break-word',
                lineHeight: 1.4,
              }}
            >
              {node.data?.title || 'untitled'}
            </div>
            <div
              className="text-[9px] text-slate-500 mt-1.5 overflow-hidden"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical' as any,
              }}
            >
              {node.data?.body || ''}
            </div>
            {node.data?.source && (
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="px-1 py-0.5 rounded text-[7px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-500">
                  {node.data?.source}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="px-2 py-1">
            <div className="text-[10px] font-medium text-slate-800 truncate">
              {node.data?.title || 'untitled'}
            </div>
            <div
              className="text-[9px] text-slate-500 mt-0.5 overflow-hidden"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical' as any,
              }}
            >
              {node.data?.body || ''}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
