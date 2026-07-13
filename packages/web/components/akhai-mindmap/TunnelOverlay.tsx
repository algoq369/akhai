'use client';

/**
 * M4b — 2.5D tunnel-vision overlay.
 *
 * On node hover, renders M4a's top-3 ranked connections as a tunnel FROM the hovered node
 * (the mouth, foreground) TO the three targets: animated subject-colored light-strands, glow
 * halos, depth layering (#1 closest/brightest → #3 furthest/dimmer+blurred) and a subtle
 * mouse parallax. Pure SVG + framer-motion — no WebGL (full 3D is a future upgrade).
 *
 * Renders INSIDE MindMapSVG's `translate(pan) scale(zoom)` group, in layout coordinates, so
 * strands stay attached to the actual node centers under pan/zoom. pointerEvents: none
 * throughout — the ORIGINAL (dimmed) hovered dot keeps catching the mouse, so re-drawing the
 * bright mouth on top cannot break the hover state.
 *
 * Honesty: the 3 targets are exactly M4a's ranking (score included) — no decorative edges.
 * Only 4 nodes + 3 strands animate; the other ~1,800 rendered elements just dim (one <g>).
 */

import React, { useEffect } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
  AnimatePresence,
} from 'framer-motion';

/**
 * Subject → strand/halo color. Stable per category (unlike getClusterColor, which assigns by
 * cluster index). Covers every category present in the real DB plus the roadmap subjects
 * (crypto, esoteric-occult, holistic-medicine). Unknown categories hash into ACCENT_POOL.
 */
export const SUBJECT_COLORS: Record<string, string> = {
  technology: '#6366f1', // indigo
  science: '#0ea5e9', // sky
  finance: '#f59e0b', // amber
  crypto: '#f97316', // orange
  business: '#10b981', // emerald
  education: '#8b5cf6', // violet
  health: '#ec4899', // pink
  'holistic-medicine': '#f43f5e', // rose
  psychology: '#a855f7', // purple
  philosophy: '#c084fc', // light purple
  'esoteric-occult': '#d946ef', // fuchsia
  society: '#e879f9', // light fuchsia
  social: '#e879f9',
  politics: '#ef4444', // red
  policy: '#ef4444',
  regulation: '#fb7185', // light rose
  history: '#eab308', // yellow
  geography: '#22c55e', // green
  environment: '#059669', // deep emerald
  mathematics: '#14b8a6', // teal
  engineering: '#d97706', // dark amber
  infrastructure: '#06b6d4', // cyan
  sports: '#84cc16', // lime
  other: '#94a3b8', // slate
};

const ACCENT_POOL = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#d946ef', '#14b8a6'];

export function subjectColor(category: string | null | undefined): string {
  const cat = (category || 'other').toLowerCase();
  if (SUBJECT_COLORS[cat]) return SUBJECT_COLORS[cat];
  let h = 0;
  for (let i = 0; i < cat.length; i++) h = (h * 31 + cat.charCodeAt(i)) >>> 0;
  return ACCENT_POOL[h % ACCENT_POOL.length];
}

export interface TunnelTarget {
  topicId: string;
  name: string;
  category: string;
  score: number; // M4a richness score 0-1
  x: number;
  y: number;
}

interface TunnelOverlayProps {
  mouth: { x: number; y: number; radius: number; color: string; name: string };
  targets: TunnelTarget[]; // rank order (index 0 = #1)
  zoom: number;
}

// Depth styling per rank: #1 closest (bright, crisp, big) → #3 furthest (dim, blurred, small).
const DEPTH = [
  { scale: 1.0, opacity: 1.0, blur: 0, halo: 16, dot: 8, parallax: 2.5, flowDur: 1.1 },
  { scale: 0.85, opacity: 0.8, blur: 0.4, halo: 12, dot: 6.5, parallax: 5, flowDur: 1.4 },
  { scale: 0.72, opacity: 0.62, blur: 0.8, halo: 9, dot: 5.5, parallax: 8, flowDur: 1.8 },
];

/** One layer of the parallax: deeper layers drift more, smoothed with a spring. */
function useParallax(factor: number, enabled: boolean) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });
  useEffect(() => {
    if (!enabled) {
      mx.set(0);
      my.set(0);
      return;
    }
    const onMove = (e: MouseEvent) => {
      // normalized viewport offset from center, [-1, 1]
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      // deep layers drift opposite the viewer — looking around inside the tunnel
      mx.set(-nx * factor);
      my.set(-ny * factor);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [enabled, factor, mx, my]);
  return { x: sx, y: sy };
}

function Strand({
  mouth,
  target,
  rank,
  color,
  reduced,
  zoom,
}: {
  mouth: { x: number; y: number };
  target: TunnelTarget;
  rank: number;
  color: string;
  reduced: boolean;
  zoom: number;
}) {
  const d = DEPTH[rank];
  const par = useParallax(d.parallax / Math.max(zoom, 0.3), !reduced);

  // gentle arc: control point offset perpendicular to the chord
  const mx = (mouth.x + target.x) / 2;
  const my = (mouth.y + target.y) / 2;
  const dx = target.x - mouth.x;
  const dy = target.y - mouth.y;
  const len = Math.max(Math.hypot(dx, dy), 1);
  const arc = Math.min(len * 0.12, 26);
  const cx = mx - (dy / len) * arc;
  const cy = my + (dx / len) * arc;
  const path = `M ${mouth.x} ${mouth.y} Q ${cx} ${cy} ${target.x} ${target.y}`;

  const gradId = `tunnel-strand-${rank}`;
  const coreW = 1.4 + target.score * 2.2;
  const strandOpacity = (0.5 + target.score * 0.45) * d.opacity;
  const label = target.name.length > 26 ? target.name.slice(0, 23) + '…' : target.name;

  return (
    <motion.g
      style={{ x: par.x, y: par.y }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, delay: rank * 0.06 }}
    >
      <defs>
        {/* userSpaceOnUse so the gradient follows the actual strand geometry */}
        <linearGradient
          id={gradId}
          gradientUnits="userSpaceOnUse"
          x1={mouth.x}
          y1={mouth.y}
          x2={target.x}
          y2={target.y}
        >
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.9} />
          <stop offset="25%" stopColor={color} stopOpacity={0.55} />
          <stop offset="100%" stopColor={color} stopOpacity={1} />
        </linearGradient>
      </defs>

      {/* glow underlay */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={coreW * 3.2}
        opacity={strandOpacity * 0.35}
        strokeLinecap="round"
        filter="url(#tunnel-glow)"
        style={{ filter: d.blur ? `blur(${d.blur}px)` : undefined }}
      />
      {/* crisp core */}
      <path
        d={path}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={coreW}
        opacity={strandOpacity}
        strokeLinecap="round"
      />
      {/* energy flow — dashes travel mouth → target */}
      {!reduced && (
        <motion.path
          d={path}
          fill="none"
          stroke="#ffffff"
          strokeWidth={Math.max(coreW * 0.5, 0.8)}
          strokeLinecap="round"
          strokeDasharray="4 22"
          opacity={strandOpacity * 0.85}
          animate={{ strokeDashoffset: [0, -26] }}
          transition={{ duration: d.flowDur, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* target node: halo (pulsing) + dot + label — depth-scaled */}
      <g
        transform={`translate(${target.x}, ${target.y}) scale(${d.scale})`}
        style={{ filter: d.blur ? `blur(${d.blur}px)` : undefined }}
      >
        <motion.circle
          r={d.halo}
          fill={color}
          opacity={0.22 * d.opacity}
          filter="url(#tunnel-glow)"
          animate={reduced ? undefined : { scale: [1, 1.35, 1], opacity: [0.22, 0.4, 0.22] }}
          transition={
            reduced ? undefined : { duration: 2.2 - rank * 0.3, repeat: Infinity, ease: 'easeInOut' }
          }
        />
        <circle r={d.dot} fill={color} opacity={d.opacity} stroke="#ffffff" strokeWidth={1.2} />
        <text
          y={-d.dot - 7}
          textAnchor="middle"
          fontSize={10}
          fontWeight={600}
          fill={color}
          opacity={Math.min(d.opacity + 0.15, 1)}
          fontFamily="'JetBrains Mono', ui-monospace, monospace"
          className="select-none"
        >
          {label}
        </text>
        <text
          y={-d.dot + 5 - 7 + 11}
          textAnchor="middle"
          fontSize={7.5}
          fill={color}
          opacity={0.75 * d.opacity}
          fontFamily="'JetBrains Mono', ui-monospace, monospace"
          className="select-none"
        >
          #{rank + 1} · {target.category} · {Math.round(target.score * 100)}
        </text>
      </g>
    </motion.g>
  );
}

export default function TunnelOverlay({ mouth, targets, zoom }: TunnelOverlayProps) {
  const reduced = useReducedMotion() ?? false;

  return (
    <AnimatePresence>
      <motion.g
        key="tunnel"
        style={{ pointerEvents: 'none' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
      >
        <defs>
          <filter id="tunnel-glow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>

        {/* strands + targets, furthest first so #1 paints on top */}
        {[...targets.entries()]
          .reverse()
          .map(([rank, t]) => (
            <Strand
              key={t.topicId}
              mouth={mouth}
              target={t}
              rank={rank}
              color={subjectColor(t.category)}
              reduced={reduced}
              zoom={zoom}
            />
          ))}

        {/* tunnel mouth — the hovered node re-drawn bright in the foreground (anchored, no
            parallax: the original dot below keeps the pointer events) */}
        <g transform={`translate(${mouth.x}, ${mouth.y})`}>
          <motion.circle
            r={mouth.radius + 7}
            fill="none"
            stroke={mouth.color}
            strokeWidth={1.4}
            opacity={0.7}
            animate={
              reduced
                ? undefined
                : { scale: [1, 1.5], opacity: [0.7, 0], transition: { duration: 1.6, repeat: Infinity, ease: 'easeOut' } }
            }
          />
          <circle
            r={mouth.radius + 3}
            fill="none"
            stroke={mouth.color}
            strokeWidth={0.8}
            opacity={0.5}
          />
          <circle r={mouth.radius} fill={mouth.color} stroke="#ffffff" strokeWidth={1.6} filter="url(#tunnel-glow)" />
        </g>
      </motion.g>
    </AnimatePresence>
  );
}
