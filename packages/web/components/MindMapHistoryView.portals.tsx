'use client';

import { createPortal } from 'react-dom';
import { QueryHistoryItem, TopicCluster, METHODOLOGY_COLORS } from './MindMapHistoryView.types';

interface HoverTooltipProps {
  hoveredQuery: { query: QueryHistoryItem; x: number; y: number };
  hoverHideTimeout: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  setHoveredQuery: (val: null) => void;
  onContinueToChat?: (query: string) => void;
}

export function HoverTooltip({
  hoveredQuery,
  hoverHideTimeout,
  setHoveredQuery,
  onContinueToChat,
}: HoverTooltipProps) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      onMouseEnter={() => {
        if (hoverHideTimeout.current) clearTimeout(hoverHideTimeout.current);
      }}
      onMouseLeave={() => {
        hoverHideTimeout.current = setTimeout(() => setHoveredQuery(null), 300);
      }}
      style={{
        position: 'fixed',
        left: Math.min(hoveredQuery.x + 12, window.innerWidth - 320),
        top: Math.max(hoveredQuery.y - 80, 10),
        zIndex: 9999,
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        padding: '10px 14px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        maxWidth: 300,
        pointerEvents: 'auto' as const,
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      <p style={{ fontSize: 11, color: '#1e293b', lineHeight: 1.5, marginBottom: 6 }}>
        {hoveredQuery.query.query.slice(0, 150)}
        {hoveredQuery.query.query.length > 150 ? '...' : ''}
      </p>
      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          fontSize: 9,
          color: '#94a3b8',
        }}
      >
        <span
          style={{
            padding: '1px 5px',
            borderRadius: 3,
            background: (METHODOLOGY_COLORS[hoveredQuery.query.flow] || '#8b5cf6') + '18',
            color: METHODOLOGY_COLORS[hoveredQuery.query.flow] || '#8b5cf6',
            fontWeight: 600,
            textTransform: 'uppercase' as const,
            fontSize: 8,
          }}
        >
          {hoveredQuery.query.flow}
        </span>
        <span>{(hoveredQuery.query.tokens_used || 0).toLocaleString()} tok</span>
        <span>${(hoveredQuery.query.cost || 0).toFixed(4)}</span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setHoveredQuery(null);
          onContinueToChat?.(hoveredQuery.query.query);
        }}
        style={{
          marginTop: 6,
          fontSize: 9,
          color: '#8b5cf6',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          fontFamily: 'inherit',
        }}
      >
        ◇ analyse in mini-chat
      </button>
    </div>,
    document.body
  );
}

interface ClusterInsightTooltipProps {
  clusterInsight: { topic: string; text: string; x: number; y: number };
  clusterHoverTimeout: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  setClusterInsight: (val: null) => void;
  filteredClusters: TopicCluster[];
  onContinueToChat?: (query: string) => void;
}

export function ClusterInsightTooltip({
  clusterInsight,
  clusterHoverTimeout,
  setClusterInsight,
  filteredClusters,
  onContinueToChat,
}: ClusterInsightTooltipProps) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      onMouseEnter={() => {
        if (clusterHoverTimeout.current) clearTimeout(clusterHoverTimeout.current);
      }}
      onMouseLeave={() => setClusterInsight(null)}
      style={{
        position: 'fixed',
        left: Math.min(clusterInsight.x + 12, window.innerWidth - 320),
        top: Math.max(clusterInsight.y - 100, 10),
        zIndex: 9999,
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        padding: '10px 14px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        maxWidth: 320,
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>
          {clusterInsight.topic}
        </span>
        <span style={{ fontSize: 8, color: '#94a3b8' }}>
          {filteredClusters.find((c) => c.topic === clusterInsight.topic)?.queries.length || 0}{' '}
          conversations
        </span>
      </div>
      <p style={{ fontSize: 9, color: '#64748b', lineHeight: 1.5, margin: 0, marginBottom: 8 }}>
        {clusterInsight.text}
      </p>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onContinueToChat?.(clusterInsight.topic);
          setClusterInsight(null);
        }}
        style={{
          fontSize: 8,
          padding: '3px 8px',
          border: '1px solid #e2e8f0',
          borderRadius: 4,
          background: 'white',
          cursor: 'pointer',
          color: '#64748b',
          fontFamily: 'inherit',
        }}
      >
        ◇ analyse in mini-chat
      </button>
    </div>,
    document.body
  );
}

interface ClickPopupProps {
  clickedQuery: { query: QueryHistoryItem; x: number; y: number };
  setClickedQuery: (val: null) => void;
  onContinueToChat?: (query: string) => void;
  onClose?: () => void;
}

export function ClickPopup({
  clickedQuery,
  setClickedQuery,
  onContinueToChat,
  onClose,
}: ClickPopupProps) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        left: clickedQuery.x - 90,
        top: clickedQuery.y - 20,
        zIndex: 9999,
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        padding: '6px 8px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        display: 'flex',
        gap: 6,
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      <button
        onClick={() => {
          onContinueToChat?.(clickedQuery.query.query);
          setClickedQuery(null);
        }}
        style={{
          fontSize: 9,
          padding: '5px 12px',
          border: '1px solid #e2e8f0',
          borderRadius: 5,
          background: 'white',
          cursor: 'pointer',
          color: '#64748b',
          fontFamily: 'inherit',
        }}
      >
        ◇ analyse
      </button>
      <button
        onClick={() => {
          setClickedQuery(null);
          onClose?.();
          setTimeout(() => {
            window.location.href = `/?continue=${clickedQuery.query.id}`;
          }, 150);
        }}
        style={{
          fontSize: 9,
          padding: '5px 12px',
          border: 'none',
          borderRadius: 5,
          background: '#1e293b',
          cursor: 'pointer',
          color: 'white',
          fontFamily: 'inherit',
        }}
      >
        → continue
      </button>
    </div>,
    document.body
  );
}
