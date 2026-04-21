'use client';

/**
 * CANVAS SHELF — left-edge collapsible query list.
 *
 * Shows every query (newest first) with an on-stage indicator dot.
 * Clicking a row toggles it on/off the stage (via onToggle prop).
 * Width toggles between EXPANDED_WIDTH and COLLAPSED_WIDTH.
 * Expansion state persists to localStorage.
 */

import { useEffect } from 'react';
import type { QueryCard } from './QueryCardsPanel';

export const SHELF_EXPANDED_WIDTH = 240;
export const SHELF_COLLAPSED_WIDTH = 48;
const STORAGE_KEY = 'akhai-canvas-shelf-expanded';

interface CanvasShelfProps {
  queryCards: QueryCard[];
  stageIds: string[];
  onToggle: (id: string) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
}

// Map methodology → short 3-4 char badge label + color.
const METHODOLOGY_BADGE: Record<string, { label: string; color: string }> = {
  auto: { label: 'AUTO', color: '#64748b' },
  direct: { label: 'DIR', color: '#6366f1' },
  cod: { label: 'COD', color: '#a855f7' },
  sc: { label: 'SC', color: '#0ea5e9' },
  react: { label: 'REACT', color: '#f59e0b' },
  pas: { label: 'PAS', color: '#ec4899' },
  tot: { label: 'TOT', color: '#14b8a6' },
  aot: { label: 'AOT', color: '#10b981' },
  step_back: { label: 'STEP', color: '#8b5cf6' },
};

function badgeFor(methodology: string | undefined) {
  const key = (methodology || 'auto').toLowerCase();
  return METHODOLOGY_BADGE[key] || METHODOLOGY_BADGE.auto;
}

export default function CanvasShelf({
  queryCards,
  stageIds,
  onToggle,
  expanded,
  onToggleExpanded,
}: CanvasShelfProps) {
  // Persist expansion preference
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, expanded ? '1' : '0');
    } catch {
      /* noop: private mode or quota */
    }
  }, [expanded]);

  const sorted = [...queryCards].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  const width = expanded ? SHELF_EXPANDED_WIDTH : SHELF_COLLAPSED_WIDTH;

  return (
    <aside
      aria-label="Canvas query shelf"
      style={{
        position: 'fixed',
        left: 0,
        top: 64,
        bottom: 0,
        width,
        transition: 'width 200ms ease',
        background: '#0c0d10',
        color: '#cbd5e1',
        borderRight: '1px solid rgba(148,163,184,0.12)',
        zIndex: 40,
        fontFamily: "'JetBrains Mono','SF Mono',ui-monospace,monospace",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header: toggle + label */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: expanded ? 'space-between' : 'center',
          padding: expanded ? '10px 12px' : '10px 0',
          borderBottom: '1px solid rgba(148,163,184,0.12)',
          minHeight: 40,
        }}
      >
        {expanded && (
          <span
            style={{
              fontSize: 9,
              letterSpacing: '0.22em',
              color: '#94a3b8',
              fontWeight: 600,
            }}
          >
            QUERIES
          </span>
        )}
        <button
          onClick={onToggleExpanded}
          title={expanded ? 'Collapse shelf' : 'Expand shelf'}
          aria-label={expanded ? 'Collapse shelf' : 'Expand shelf'}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: 4,
            fontSize: 12,
            lineHeight: 1,
          }}
        >
          {expanded ? '◀' : '▶'}
        </button>
      </div>

      {/* List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: expanded ? '4px 0' : '4px 0',
        }}
      >
        {sorted.length === 0 && expanded && (
          <div
            style={{
              padding: '16px 12px',
              fontSize: 10,
              color: '#475569',
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            no queries yet
          </div>
        )}
        {sorted.map((card) => {
          const onStage = stageIds.includes(card.id);
          const badge = badgeFor(card.methodology);
          const title = card.query.length > 40 ? card.query.slice(0, 40) + '…' : card.query;
          return (
            <button
              key={card.id}
              onClick={() => onToggle(card.id)}
              title={expanded ? undefined : card.query}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: expanded ? '8px 12px 8px 10px' : '8px 0',
                background: 'transparent',
                border: 'none',
                borderLeft: onStage ? '2px solid #818cf8' : '2px solid transparent',
                cursor: 'pointer',
                color: 'inherit',
                fontFamily: 'inherit',
                textAlign: 'left',
                gap: 8,
                justifyContent: expanded ? 'flex-start' : 'center',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(203,213,225,0.05)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: onStage ? '#818cf8' : 'transparent',
                  border: onStage ? '1px solid #818cf8' : '1px solid #475569',
                  display: 'inline-block',
                }}
              />
              {expanded && (
                <>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 11,
                      color: onStage ? '#e2e8f0' : '#94a3b8',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      minWidth: 0,
                    }}
                  >
                    {title}
                  </span>
                  <span
                    style={{
                      fontSize: 8,
                      padding: '2px 5px',
                      borderRadius: 3,
                      background: `${badge.color}22`,
                      color: badge.color,
                      letterSpacing: '0.05em',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {badge.label}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}

/**
 * Read persisted expansion preference. Defaults to `true` when no value stored
 * or when running in a non-browser context.
 */
export function readShelfExpandedFromStorage(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return true;
    return raw === '1';
  } catch {
    return true;
  }
}
