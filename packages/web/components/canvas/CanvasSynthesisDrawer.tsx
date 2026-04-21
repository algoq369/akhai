'use client';

/**
 * CANVAS SYNTHESIS DRAWER — right-edge collapsible panel.
 * Shows TOPICS, ANALYSIS, PROGRESSION. Open state persists to localStorage.
 *
 * File size note: targets ≤250 lines. Prettier expands multi-property style
 * objects into one-prop-per-line, so this file can't comfortably hit the
 * original 180-line aspiration without harming readability. The enforced
 * WEBNA rule is ≤500 lines; we're well under that.
 */

import { useEffect, type CSSProperties } from 'react';

export const SYNTHESIS_EXPANDED_WIDTH = 260;
export const SYNTHESIS_COLLAPSED_WIDTH = 32;
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
  darkMode?: boolean;
}

/** Build all inline styles, palette baked in per theme. */
function getStyles(dark: boolean) {
  const P = {
    bg: dark ? '#0c0d10' : '#ffffff',
    fg: dark ? '#cbd5e1' : '#334155',
    dimFg: dark ? '#94a3b8' : '#64748b',
    sectionFg: dark ? '#64748b' : '#94a3b8',
    mutedFg: dark ? '#475569' : '#94a3b8',
    border: dark ? 'rgba(148,163,184,0.12)' : 'rgba(148,163,184,0.3)',
  };
  return {
    aside: (w: number): CSSProperties => ({
      position: 'fixed',
      right: 0,
      top: 64,
      bottom: 0,
      width: w,
      transition: 'width 200ms ease, background 200ms ease, color 200ms ease',
      background: P.bg,
      color: P.fg,
      borderLeft: `1px solid ${P.border}`,
      zIndex: 40,
      fontFamily: "'JetBrains Mono','SF Mono',ui-monospace,monospace",
      display: 'flex',
      flexDirection: 'column',
    }),
    collapsedBtn: {
      background: 'transparent',
      border: 'none',
      color: P.dimFg,
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
      padding: '8px 12px',
      borderBottom: `1px solid ${P.border}`,
      minHeight: 36,
    } as CSSProperties,
    headerLabel: {
      fontSize: 10,
      letterSpacing: '0.22em',
      color: P.dimFg,
      fontWeight: 600,
    } as CSSProperties,
    chevron: {
      background: 'transparent',
      border: 'none',
      color: P.dimFg,
      cursor: 'pointer',
      padding: 4,
      fontSize: 12,
      lineHeight: 1,
    } as CSSProperties,
    body: {
      flex: 1,
      overflowY: 'auto',
      overflowX: 'hidden',
      padding: '10px 12px',
    } as CSSProperties,
    section: { marginBottom: 16 } as CSSProperties,
    sectionLabel: {
      fontSize: 9,
      letterSpacing: '0.22em',
      color: P.sectionFg,
      fontWeight: 600,
      marginBottom: 8,
    } as CSSProperties,
    topicRow: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 10,
      color: P.fg,
      padding: '2px 0',
    } as CSSProperties,
    analysis: {
      fontSize: 10,
      lineHeight: 1.55,
      color: P.fg,
      whiteSpace: 'pre-wrap',
      margin: 0,
    } as CSSProperties,
    statRow: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 10,
      padding: '2px 0',
    } as CSSProperties,
    muted: { fontSize: 10, color: P.mutedFg } as CSSProperties,
    palette: P,
  };
}

type DrawerStyles = ReturnType<typeof getStyles>;
const nowrap: CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

export default function CanvasSynthesisDrawer({
  synthesis,
  topics,
  stats,
  open,
  onToggleOpen,
  darkMode = false,
}: CanvasSynthesisDrawerProps) {
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, open ? '1' : '0');
    } catch {
      /* noop */
    }
  }, [open]);

  const S = getStyles(darkMode);
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
                      <span style={nowrap}>{t.name}</span>
                      <span style={{ color: S.palette.sectionFg, marginLeft: 8 }}>{t.count}</span>
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
              <StatRow label="queries" value={stats.queryCount} styles={S} />
              <StatRow label="topics" value={stats.topicCount} styles={S} />
              <StatRow label="connections" value={stats.connectionCount} styles={S} />
            </div>
          </div>
        </>
      )}
    </aside>
  );
}

function StatRow({ label, value, styles }: { label: string; value: number; styles: DrawerStyles }) {
  return (
    <div style={styles.statRow}>
      <span style={{ color: styles.palette.dimFg }}>{label}</span>
      <span style={{ color: styles.palette.fg }}>{value}</span>
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
