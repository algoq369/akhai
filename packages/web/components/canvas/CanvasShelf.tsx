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

export const SHELF_EXPANDED_WIDTH = 160;
export const SHELF_COLLAPSED_WIDTH = 32;
const STORAGE_KEY = 'akhai-canvas-shelf-expanded';

interface CanvasShelfProps {
  queryCards: QueryCard[];
  stageIds: string[];
  onToggle: (id: string) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
  darkMode?: boolean;
}

/** Semantic color tokens resolved once per render from the active theme. */
function getPalette(dark: boolean) {
  return {
    bg: dark ? '#0c0d10' : '#ffffff',
    fg: dark ? '#cbd5e1' : '#334155',
    dimFg: dark ? '#94a3b8' : '#64748b',
    mutedFg: dark ? '#475569' : '#94a3b8',
    border: dark ? 'rgba(148,163,184,0.12)' : 'rgba(148,163,184,0.3)',
    rowHover: dark ? 'rgba(203,213,225,0.05)' : 'rgba(148,163,184,0.08)',
    emptyDotBorder: dark ? '#475569' : '#cbd5e1',
    onStageFg: dark ? '#e2e8f0' : '#1e293b',
    accent: '#818cf8',
  };
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
  darkMode = false,
}: CanvasShelfProps) {
  // Persist expansion preference
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, expanded ? '1' : '0');
    } catch {
      /* noop: private mode or quota */
    }
  }, [expanded]);

  const P = getPalette(darkMode);
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
        transition: 'width 200ms ease, background 200ms ease, color 200ms ease',
        background: P.bg,
        color: P.fg,
        borderRight: `1px solid ${P.border}`,
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
          padding: expanded ? '8px 10px' : '8px 0',
          borderBottom: `1px solid ${P.border}`,
          minHeight: 40,
        }}
      >
        {expanded && (
          <span
            style={{
              fontSize: 9,
              letterSpacing: '0.22em',
              color: P.dimFg,
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
            color: P.dimFg,
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
              color: P.mutedFg,
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
                padding: expanded ? '4px 6px' : '4px 0',
                background: 'transparent',
                border: 'none',
                borderLeft: onStage ? `2px solid ${P.accent}` : '2px solid transparent',
                cursor: 'pointer',
                color: 'inherit',
                fontFamily: 'inherit',
                textAlign: 'left',
                gap: 6,
                justifyContent: expanded ? 'flex-start' : 'center',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = P.rowHover;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: onStage ? P.accent : 'transparent',
                  border: onStage ? `1px solid ${P.accent}` : `1px solid ${P.emptyDotBorder}`,
                  display: 'inline-block',
                }}
              />
              {expanded && (
                <>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 10,
                      color: onStage ? P.onStageFg : P.dimFg,
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
                      fontSize: 7,
                      padding: '2px 3px',
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
