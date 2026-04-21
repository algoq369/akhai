'use client';

/**
 * CANVAS SYNTHESIS DRAWER — right-edge collapsible panel.
 * Shows TOPICS, ANALYSIS, PROGRESSION. Open state persists to localStorage.
 */

import { useEffect, type CSSProperties } from 'react';

export const SYNTHESIS_EXPANDED_WIDTH = 320;
export const SYNTHESIS_COLLAPSED_WIDTH = 40;
const STORAGE_KEY = 'akhai-canvas-synthesis-open';

export interface SynthesisTopic {
  name: string;
  count: number;
}

export interface SynthesisStats {
  queryCount: number;
  topicCount: number;
  connectionCount: number;
}

interface CanvasSynthesisDrawerProps {
  synthesis?: string;
  topics: SynthesisTopic[];
  stats: SynthesisStats;
  open: boolean;
  onToggleOpen: () => void;
}

// Styles grouped at top to keep JSX compact.
const S = {
  aside: (w: number): CSSProperties => ({
    position: 'fixed',
    right: 0,
    top: 64,
    bottom: 0,
    width: w,
    transition: 'width 200ms ease',
    background: '#0c0d10',
    color: '#cbd5e1',
    borderLeft: '1px solid rgba(148,163,184,0.12)',
    zIndex: 40,
    fontFamily: "'JetBrains Mono','SF Mono',ui-monospace,monospace",
    display: 'flex',
    flexDirection: 'column',
  }),
  collapsedBtn: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '12px 0',
    fontSize: 10,
    lineHeight: 1.4,
    writingMode: 'vertical-rl',
    textOrientation: 'mixed',
    letterSpacing: '0.22em',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  } as CSSProperties,
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    borderBottom: '1px solid rgba(148,163,184,0.12)',
    minHeight: 40,
  } as CSSProperties,
  headerLabel: {
    fontSize: 10,
    letterSpacing: '0.22em',
    color: '#94a3b8',
    fontWeight: 600,
  } as CSSProperties,
  chevron: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: 4,
    fontSize: 12,
    lineHeight: 1,
  } as CSSProperties,
  body: { flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 14px' } as CSSProperties,
  section: { marginBottom: 20 } as CSSProperties,
  sectionLabel: {
    fontSize: 9,
    letterSpacing: '0.22em',
    color: '#64748b',
    fontWeight: 600,
    marginBottom: 8,
  } as CSSProperties,
  topicRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 11,
    color: '#cbd5e1',
    padding: '3px 0',
  } as CSSProperties,
  topicName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } as CSSProperties,
  analysis: {
    fontSize: 11,
    lineHeight: 1.6,
    color: '#cbd5e1',
    whiteSpace: 'pre-wrap',
    margin: 0,
  } as CSSProperties,
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 11,
    padding: '2px 0',
  } as CSSProperties,
  muted: { fontSize: 10, color: '#475569' } as CSSProperties,
};

export default function CanvasSynthesisDrawer({
  synthesis,
  topics,
  stats,
  open,
  onToggleOpen,
}: CanvasSynthesisDrawerProps) {
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, open ? '1' : '0');
    } catch {
      /* noop */
    }
  }, [open]);

  const width = open ? SYNTHESIS_EXPANDED_WIDTH : SYNTHESIS_COLLAPSED_WIDTH;

  return (
    <aside aria-label="Canvas synthesis drawer" style={S.aside(width)}>
      {!open && (
        <button
          onClick={onToggleOpen}
          title="Expand synthesis"
          aria-label="Expand synthesis"
          style={S.collapsedBtn}
        >
          <span style={{ fontSize: 12 }}>◀</span>
          <span>SYNTHESIS</span>
        </button>
      )}
      {open && (
        <>
          <div style={S.header}>
            <span style={S.headerLabel}>≡ SYNTHESIS</span>
            <button
              onClick={onToggleOpen}
              title="Collapse synthesis"
              aria-label="Collapse synthesis"
              style={S.chevron}
            >
              ▶
            </button>
          </div>
          <div style={S.body}>
            <div style={S.section}>
              <div style={S.sectionLabel}>TOPICS</div>
              {topics.length === 0 ? (
                <div style={S.muted}>no topics yet</div>
              ) : (
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {topics.map((t) => (
                    <li key={t.name} style={S.topicRow}>
                      <span style={S.topicName}>{t.name}</span>
                      <span style={{ color: '#64748b', marginLeft: 8 }}>{t.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div style={S.section}>
              <div style={S.sectionLabel}>ANALYSIS</div>
              {synthesis && synthesis.trim().length > 0 ? (
                <p style={S.analysis}>{synthesis}</p>
              ) : (
                <div style={S.muted}>no synthesis yet</div>
              )}
            </div>
            <div style={S.section}>
              <div style={S.sectionLabel}>PROGRESSION</div>
              <StatRow label="queries" value={stats.queryCount} />
              <StatRow label="topics" value={stats.topicCount} />
              <StatRow label="connections" value={stats.connectionCount} />
            </div>
          </div>
        </>
      )}
    </aside>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div style={S.statRow}>
      <span style={{ color: '#94a3b8' }}>{label}</span>
      <span style={{ color: '#cbd5e1' }}>{value}</span>
    </div>
  );
}

export function readSynthesisDrawerOpenFromStorage(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return true;
    return raw === '1';
  } catch {
    return true;
  }
}
