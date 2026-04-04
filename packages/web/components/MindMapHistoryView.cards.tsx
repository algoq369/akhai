'use client';

import React from 'react';
import { QueryHistoryItem, TopicCluster, METHODOLOGY_COLORS } from './MindMapHistoryView.types';
import { formatDate, formatTime } from './MindMapHistoryView.utils';

/* ── Shared query row used in ExpandedCluster and ListItem ── */

interface QueryRowProps {
  query: QueryHistoryItem;
  onQueryClick: (e: React.MouseEvent, query: QueryHistoryItem) => void;
  onQueryContextMenu: (e: React.MouseEvent, query: QueryHistoryItem) => void;
  onQueryMouseEnter: (e: React.MouseEvent, query: QueryHistoryItem) => void;
  onQueryMouseLeave: () => void;
  variant: 'expanded' | 'list';
}

function QueryRow({
  query,
  onQueryClick,
  onQueryContextMenu,
  onQueryMouseEnter,
  onQueryMouseLeave,
  variant,
}: QueryRowProps) {
  if (variant === 'expanded') {
    return (
      <div
        key={query.id}
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          onQueryClick(e, query);
        }}
        onContextMenu={(e) => onQueryContextMenu(e, query)}
        onKeyDown={(e) => e.key === 'Enter' && onQueryClick(e as any, query)}
        onMouseEnter={(e) => onQueryMouseEnter(e, query)}
        onMouseLeave={onQueryMouseLeave}
        className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 dark:border-[#334155] last:border-0 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-[#334155]/20"
      >
        <div
          className="w-0.5 h-8 rounded-full flex-shrink-0"
          style={{ backgroundColor: METHODOLOGY_COLORS[query.flow] || '#8B5CF6' }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-slate-700 dark:text-[#94a3b8] line-clamp-2">
            {query.query}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="px-1 py-0.5 rounded text-[7px] font-semibold uppercase tracking-wider text-white"
              style={{
                backgroundColor: METHODOLOGY_COLORS[query.flow] || '#8B5CF6',
              }}
            >
              {query.flow}
            </span>
            <span className="text-[8px] text-slate-400 dark:text-[#64748b]">
              {formatDate(query.created_at)} {formatTime(query.created_at)}
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-[9px] text-slate-500 dark:text-[#94a3b8]">
            {(query.tokens_used || 0).toLocaleString()} tok
          </div>
          <div className="text-[8px] text-slate-400 dark:text-[#64748b]">
            ${(query.cost || 0).toFixed(4)}
          </div>
        </div>
        <span className="text-[10px] text-slate-300 dark:text-[#64748b]">→</span>
      </div>
    );
  }

  // list variant
  return (
    <div
      key={query.id}
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onQueryClick(e, query);
      }}
      onContextMenu={(e) => onQueryContextMenu(e, query)}
      onKeyDown={(e) => e.key === 'Enter' && onQueryClick(e as any, query)}
      onMouseEnter={(e) => onQueryMouseEnter(e, query)}
      onMouseLeave={onQueryMouseLeave}
      className={
        'flex items-center gap-2 px-3 py-2 border-b border-slate-100 dark:border-[#334155] last:border-0 cursor-pointer transition-colors hover:bg-white dark:hover:bg-[#334155]/20'
      }
    >
      <div
        className="w-0.5 h-5 rounded-full flex-shrink-0"
        style={{ backgroundColor: METHODOLOGY_COLORS[query.flow] || '#8B5CF6' }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-slate-600 dark:text-[#94a3b8] truncate">{query.query}</p>
        <p className="text-[8px] text-slate-400 dark:text-[#64748b] flex items-center gap-1.5 mt-0.5">
          <span>{formatTime(query.created_at)}</span>
          <span className="uppercase tracking-wider">{query.flow}</span>
        </p>
      </div>
      <span className="text-[8px] text-slate-400 dark:text-[#64748b]">
        ${(query.cost || 0).toFixed(4)}
      </span>
    </div>
  );
}

/* ── Expanded cluster detail view ── */

interface ExpandedClusterViewProps {
  cluster: TopicCluster;
  onCollapse: () => void;
  onQueryClick: (e: React.MouseEvent, query: QueryHistoryItem) => void;
  onQueryContextMenu: (e: React.MouseEvent, query: QueryHistoryItem) => void;
  onQueryMouseEnter: (e: React.MouseEvent, query: QueryHistoryItem) => void;
  onQueryMouseLeave: () => void;
}

export function ExpandedClusterView({
  cluster,
  onCollapse,
  onQueryClick,
  onQueryContextMenu,
  onQueryMouseEnter,
  onQueryMouseLeave,
}: ExpandedClusterViewProps) {
  return (
    <div className="bg-white dark:bg-[#18181b]/50 rounded-lg border border-slate-200 dark:border-[#334155] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-[#334155] bg-slate-50/50 dark:bg-[#334155]/10">
        <div className="flex items-center gap-3">
          <h2 className="text-[11px] font-semibold text-slate-700 dark:text-white">
            {cluster.topic}
          </h2>
          <span className="text-[9px] text-slate-400 dark:text-[#64748b]">
            {cluster.queries.length} conversations
          </span>
          <span className="text-[9px] text-slate-400 dark:text-[#64748b]">
            {cluster.totalTokens.toLocaleString()} tok
          </span>
          <span className="text-[9px] text-slate-400 dark:text-[#64748b]">
            ${cluster.totalCost.toFixed(4)}
          </span>
        </div>
        <button
          onClick={() => onCollapse()}
          className="px-2 py-0.5 text-[9px] font-medium text-slate-500 dark:text-[#94a3b8] hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#334155]/30 rounded transition-colors"
        >
          ✕ close
        </button>
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        {cluster.queries.map((query) => (
          <QueryRow
            key={query.id}
            query={query}
            onQueryClick={onQueryClick}
            onQueryContextMenu={onQueryContextMenu}
            onQueryMouseEnter={onQueryMouseEnter}
            onQueryMouseLeave={onQueryMouseLeave}
            variant="expanded"
          />
        ))}
      </div>
    </div>
  );
}

/* ── Grid card for a cluster ── */

interface ClusterGridCardProps {
  cluster: TopicCluster;
  onExpand: (topic: string) => void;
  onContextMenu: (e: React.MouseEvent, query: QueryHistoryItem) => void;
  onClusterHover: (e: React.MouseEvent, cluster: TopicCluster) => void;
  onClusterHoverLeave: () => void;
}

export function ClusterGridCard({
  cluster,
  onExpand,
  onContextMenu,
  onClusterHover,
  onClusterHoverLeave,
}: ClusterGridCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onExpand(cluster.topic)}
      onContextMenu={(e) => {
        e.preventDefault();
        const firstQ = cluster.queries[0];
        if (firstQ) onContextMenu(e, firstQ);
      }}
      onKeyDown={(e) => e.key === 'Enter' && onExpand(cluster.topic)}
      onMouseEnter={(e) => onClusterHover(e, cluster)}
      onMouseLeave={onClusterHoverLeave}
      className={
        'group relative bg-white dark:bg-[#18181b]/50 rounded-lg border transition-all duration-200 text-left overflow-hidden cursor-pointer border-slate-200 dark:border-[#334155] hover:border-slate-300 dark:hover:border-[#64748b] hover:shadow-sm'
      }
    >
      {/* Preview area */}
      <div className="aspect-[4/3] bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-[#334155]/20 dark:to-[#334155]/10 flex items-center justify-center p-2 relative overflow-hidden">
        <div className="relative w-full h-full">
          {cluster.queries.slice(0, 3).map((q, i) => (
            <div
              key={q.id}
              className="absolute bg-white dark:bg-[#18181b] rounded shadow-sm border border-slate-200/80 dark:border-[#334155] p-1.5"
              style={{
                width: '75%',
                height: '65%',
                left: `${12 + i * 4}%`,
                top: `${18 + i * 4}%`,
                transform: `rotate(${-1 + i * 1.5}deg)`,
                zIndex: 3 - i,
              }}
            >
              <div
                className="w-0.5 h-full absolute left-0 top-0 rounded-l"
                style={{ backgroundColor: METHODOLOGY_COLORS[q.flow] || '#8B5CF6' }}
              />
              <p className="text-[6px] text-slate-500 dark:text-[#64748b] line-clamp-2 pl-1.5 leading-tight">
                {q.query}
              </p>
            </div>
          ))}
        </div>

        {/* Count badge */}
        <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-slate-700/80 dark:bg-[#334155]/80 rounded text-[7px] text-white font-medium">
          {cluster.queries.length}
        </div>
      </div>

      {/* Info */}
      <div className="p-2 border-t border-slate-100 dark:border-[#334155]">
        <h3 className="text-[10px] font-medium text-slate-700 dark:text-white truncate">
          {cluster.topic}
        </h3>
        <div className="flex items-center justify-between text-[8px] text-slate-400 dark:text-[#64748b] mt-0.5">
          <span>{formatDate(cluster.lastActivity)}</span>
          <span>${cluster.totalCost.toFixed(4)}</span>
        </div>
      </div>
    </div>
  );
}

/* ── List item for a cluster ── */

interface ClusterListItemProps {
  cluster: TopicCluster;
  isExpanded: boolean;
  onToggle: (topic: string) => void;
  onClusterHover: (e: React.MouseEvent, cluster: TopicCluster) => void;
  onClusterHoverLeave: () => void;
  onQueryClick: (e: React.MouseEvent, query: QueryHistoryItem) => void;
  onQueryContextMenu: (e: React.MouseEvent, query: QueryHistoryItem) => void;
  onQueryMouseEnter: (e: React.MouseEvent, query: QueryHistoryItem) => void;
  onQueryMouseLeave: () => void;
}

export function ClusterListItem({
  cluster,
  isExpanded,
  onToggle,
  onClusterHover,
  onClusterHoverLeave,
  onQueryClick,
  onQueryContextMenu,
  onQueryMouseEnter,
  onQueryMouseLeave,
}: ClusterListItemProps) {
  return (
    <div className="bg-white dark:bg-[#18181b]/50 rounded-lg border border-slate-200 dark:border-[#334155] overflow-hidden hover:border-slate-300 dark:hover:border-[#64748b] transition-all">
      <button
        onClick={() => onToggle(cluster.topic)}
        onMouseEnter={(e) => onClusterHover(e, cluster)}
        onMouseLeave={onClusterHoverLeave}
        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-[#334155]/20 transition-colors"
      >
        <div
          className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold text-white"
          style={{
            backgroundColor: METHODOLOGY_COLORS[cluster.queries[0]?.flow] || '#8B5CF6',
          }}
        >
          {cluster.queries.length}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-[10px] font-medium text-slate-700 dark:text-white">
            {cluster.topic}
          </h3>
          <p className="text-[9px] text-slate-400 dark:text-[#64748b] truncate">
            {formatDate(cluster.lastActivity)}
          </p>
        </div>

        <div className="text-right text-[9px] text-slate-400 dark:text-[#64748b]">
          <div>{cluster.totalTokens.toLocaleString()} tok</div>
          <div>${cluster.totalCost.toFixed(4)}</div>
        </div>

        <span
          className={`text-[10px] text-slate-400 dark:text-[#64748b] transition-transform inline-block ${isExpanded ? 'rotate-180' : ''}`}
        >
          ▾
        </span>
      </button>

      {/* Expanded queries */}
      {isExpanded && (
        <div className="border-t border-slate-100 dark:border-[#334155] bg-slate-50/50 dark:bg-[#334155]/10">
          {cluster.queries.map((query) => (
            <QueryRow
              key={query.id}
              query={query}
              onQueryClick={onQueryClick}
              onQueryContextMenu={onQueryContextMenu}
              onQueryMouseEnter={onQueryMouseEnter}
              onQueryMouseLeave={onQueryMouseLeave}
              variant="list"
            />
          ))}
        </div>
      )}
    </div>
  );
}
