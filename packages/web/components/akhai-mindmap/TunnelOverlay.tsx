'use client';

/**
 * mindmap-tunnel-v2 — 2.5D tunnel-vision overlay, redesigned for drama.
 *
 * On node hover, M4a's top-3 ranked connections render as a tunnel of light FROM the hovered
 * node (the mouth) INTO the three targets:
 *   [1] receding concentric rings along each strand — the shaft geometry (TunnelEffects)
 *   [2] 3-layer bloomed strands — light, not lines (white-hot core bleeding into subject color)
 *   [3] radial vignette centered on the mouth — a pool of clarity, dark at the edges
 *   [4] cinematic entrance — shockwave, strands growing mouth→target, halos igniting in
 *       sequence, a subtle dolly-in
 *   [5] steep depth ladder — #1 close and blazing, #3 small, dim, blurred
 *   [6] particle energy-motes streaming down each strand (TunnelEffects)
 *
 * Same architecture as v1: pure SVG + framer-motion (no WebGL), rendered INSIDE MindMapSVG's
 * `translate(pan) scale(zoom)` group in layout coordinates (pan/zoom keeps everything attached),
 * pointerEvents: none throughout (the original dimmed dot keeps the hover alive), and only the
 * mouth + 3 targets + their strands/rings/motes animate — the other ~1,800 elements just dim.
 *
 * Honesty: the 3 targets are exactly M4a's ranking (score shown) — no decorative edges.
 * prefers-reduced-motion: no growth/shockwave/dolly/ring-drift/motes/parallax/pulses — a clean
 * static bloomed tunnel + vignette remains.
 *
 * tunnel-adaptive: every structural white/black + dark-tuned opacity comes from
 * getTunnelTheme(isDark) (see tunnel-theme.ts) so the tunnel is cinematic on BOTH the light
 * (#fafbfc) and dark (#0a0a0a) map backgrounds, and recolors live on theme toggle.
 */

import React, { useEffect } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
  AnimatePresence,
} from 'framer-motion';
import { TunnelRings, Shockwave, Motes } from './TunnelEffects';
import { getTunnelTheme, useIsDarkTheme, type TunnelTheme } from './tunnel-theme';

/**
 * Subject → strand/halo color. Stable per category (unlike getClusterColor, which assigns by
 * cluster index). v2: saturated a step for vivid strands — still harmonious with the relic
 * palette; the white-hot cores carry the brightness. Unknown categories hash into ACCENT_POOL.
 */
export const SUBJECT_COLORS: Record<string, string> = {
  technology: '#818cf8', // indigo
  science: '#38bdf8', // sky
  finance: '#fbbf24', // amber
  crypto: '#fb923c', // orange
  business: '#34d399', // emerald
  education: '#a78bfa', // violet
  health: '#f472b6', // pink
  'holistic-medicine': '#fb7185', // rose
  psychology: '#c084fc', // purple
  philosophy: '#d8b4fe', // light purple
  'esoteric-occult': '#e879f9', // fuchsia
  society: '#f0abfc', // light fuchsia
  social: '#f0abfc',
  politics: '#f87171', // red
  policy: '#f87171',
  regulation: '#fda4af', // light rose
  history: '#facc15', // yellow
  geography: '#4ade80', // green
  environment: '#2dd4bf', // teal-emerald
  mathematics: '#5eead4', // light teal
  engineering: '#fbbf24', // amber
  infrastructure: '#22d3ee', // cyan
  sports: '#a3e635', // lime
  other: '#a5b4c9', // luminous slate
};

const ACCENT_POOL = ['#818cf8', '#38bdf8', '#34d399', '#fbbf24', '#e879f9', '#5eead4'];

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

// [5] Aggressive depth ladder: #1 closest (blazing, crisp, big) → #3 deep in the shaft.
const DEPTH = [
  { scale: 1.0, opacity: 1.0, blur: 0, halo: 20, dot: 9, parallax: 2.5 },
  { scale: 0.78, opacity: 0.82, blur: 1.2, halo: 13, dot: 6.5, parallax: 5 },
  { scale: 0.58, opacity: 0.62, blur: 2.6, halo: 9, dot: 5, parallax: 8 },
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
  theme,
}: {
  mouth: { x: number; y: number };
  target: TunnelTarget;
  rank: number;
  color: string;
  reduced: boolean;
  zoom: number;
  theme: TunnelTheme;
}) {
  const d = DEPTH[rank];
  const par = useParallax(d.parallax / Math.max(zoom, 0.3), !reduced);

  // [2] a real swoop: control point offset perpendicular to the chord
  const mx = (mouth.x + target.x) / 2;
  const my = (mouth.y + target.y) / 2;
  const dx = target.x - mouth.x;
  const dy = target.y - mouth.y;
  const len = Math.max(Math.hypot(dx, dy), 1);
  const arc = Math.min(len * 0.22, 48);
  const control = { x: mx - (dy / len) * arc, y: my + (dx / len) * arc };
  const path = `M ${mouth.x} ${mouth.y} Q ${control.x} ${control.y} ${target.x} ${target.y}`;

  const gradId = `tunnel-strand-${rank}`;
  const coreW = 1.4 + target.score * 2.2;
  const label = target.name.length > 26 ? target.name.slice(0, 23) + '…' : target.name;
  const grow = reduced
    ? undefined
    : {
        initial: { pathLength: 0 },
        animate: { pathLength: 1 },
        transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] as const, delay: rank * 0.08 },
      };

  return (
    <motion.g
      style={{ x: par.x, y: par.y }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, delay: rank * 0.08 }}
    >
      <defs>
        {/* [2] hot entrance bleeding into subject color (userSpaceOnUse follows geometry) —
            dark: white-hot mouth; light: deep-saturated mouth (theme.coreStops) */}
        <linearGradient
          id={gradId}
          gradientUnits="userSpaceOnUse"
          x1={mouth.x}
          y1={mouth.y}
          x2={target.x}
          y2={target.y}
        >
          {theme.coreStops(color).map((s) => (
            <stop key={s.offset} offset={s.offset} stopColor={s.color} stopOpacity={s.opacity} />
          ))}
        </linearGradient>
      </defs>

      {/* [1] the shaft — receding rings under the light */}
      <TunnelRings
        mouth={mouth}
        control={control}
        target={target}
        color={color}
        depthScale={d.scale}
        depthOpacity={d.opacity}
        reduced={reduced}
        theme={theme}
      />

      {/* [2] 3-layer bloom: outer haze / mid glow / hot core (+ light-mode white filament) */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={coreW * 5}
        opacity={theme.bloomOuterOpacity * d.opacity}
        strokeLinecap="round"
        style={{ filter: 'blur(3px)' }}
      />
      <motion.path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={coreW * 2.4}
        opacity={theme.bloomMidOpacity * d.opacity}
        strokeLinecap="round"
        style={{ filter: 'blur(1.2px)' }}
        {...grow}
      />
      <motion.path
        d={path}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={coreW}
        opacity={0.95 * d.opacity}
        strokeLinecap="round"
        {...grow}
      />
      {theme.highlight && (
        <motion.path
          d={path}
          fill="none"
          stroke={theme.highlight.color}
          strokeWidth={coreW * theme.highlight.widthFactor}
          opacity={theme.highlight.opacity * d.opacity}
          strokeLinecap="round"
          {...grow}
        />
      )}

      {/* [6] energy motes streaming into the connection */}
      <Motes
        mouth={mouth}
        control={control}
        target={target}
        color={color}
        rank={rank}
        reduced={reduced}
        theme={theme}
      />

      {/* target node: ignites on entry, then breathes — depth-scaled and blurred by rank */}
      <g
        transform={`translate(${target.x}, ${target.y}) scale(${d.scale})`}
        style={{ filter: d.blur ? `blur(${d.blur}px)` : undefined }}
      >
        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          initial={reduced ? { opacity: 0 } : { scale: 0, opacity: 0 }}
          animate={reduced ? { opacity: 1 } : { scale: 1, opacity: 1 }}
          transition={
            reduced
              ? { duration: 0.3 }
              : { type: 'spring', bounce: 0.45, duration: 0.55, delay: 0.15 + rank * 0.08 }
          }
        >
          <motion.circle
            r={d.halo}
            fill={color}
            opacity={theme.haloOpacity}
            filter="url(#tunnel-glow)"
            animate={
              reduced
                ? undefined
                : {
                    scale: [1, 1.4, 1],
                    opacity: [theme.haloOpacity, theme.haloOpacity + 0.2, theme.haloOpacity],
                  }
            }
            transition={
              reduced
                ? undefined
                : { duration: 2.2 - rank * 0.3, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }
            }
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          />
          <circle r={d.dot} fill={color} stroke={theme.dotStroke(color)} strokeWidth={1.4} />
          <text
            y={-d.dot - 8}
            textAnchor="middle"
            fontSize={10.5}
            fontWeight={700}
            fill={theme.labelFill(color)}
            stroke={theme.labelHalo}
            strokeWidth={3}
            strokeLinejoin="round"
            style={{ paintOrder: 'stroke' }}
            fontFamily="'JetBrains Mono', ui-monospace, monospace"
            className="select-none"
          >
            {label}
          </text>
          <text
            y={-d.dot + 4}
            textAnchor="middle"
            fontSize={7.5}
            fill={theme.labelFill(color)}
            stroke={theme.labelHalo}
            strokeWidth={2.5}
            strokeLinejoin="round"
            style={{ paintOrder: 'stroke' }}
            opacity={0.9}
            fontFamily="'JetBrains Mono', ui-monospace, monospace"
            className="select-none"
          >
            #{rank + 1} · {target.category} · {Math.round(target.score * 100)}
          </text>
        </motion.g>
      </g>
    </motion.g>
  );
}

export default function TunnelOverlay({ mouth, targets, zoom }: TunnelOverlayProps) {
  const reduced = useReducedMotion() ?? false;
  const theme = getTunnelTheme(useIsDarkTheme());
  // [3] vignette sized in layout units but screen-constant: divide by zoom
  const vigR = 760 / Math.max(zoom, 0.3);
  const vigSpan = 4200 / Math.max(zoom, 0.3);

  return (
    <AnimatePresence>
      <motion.g
        key="tunnel"
        style={{
          pointerEvents: 'none',
          transformBox: 'view-box',
          transformOrigin: `${mouth.x}px ${mouth.y}px`,
        }}
        initial={{ opacity: 0, scale: 1 }}
        // [4] dolly-in: the whole tunnel eases toward the viewer on entry
        animate={{ opacity: 1, scale: reduced ? 1 : 1.035 }}
        exit={{ opacity: 0, scale: 1 }}
        transition={{ opacity: { duration: 0.18 }, scale: { duration: 0.6, ease: 'easeOut' } }}
      >
        <defs>
          <filter id="tunnel-glow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          {/* [3] pool of clarity at the mouth — dark theme fades the edges to darkness, light
              theme washes them toward the page background (recession TO light) */}
          <radialGradient
            id="tunnel-vignette"
            gradientUnits="userSpaceOnUse"
            cx={mouth.x}
            cy={mouth.y}
            r={vigR}
          >
            <stop offset="0%" stopColor={theme.vignetteColor} stopOpacity={theme.vignetteStops[0]} />
            <stop offset="32%" stopColor={theme.vignetteColor} stopOpacity={theme.vignetteStops[1]} />
            <stop offset="66%" stopColor={theme.vignetteColor} stopOpacity={theme.vignetteStops[2]} />
            <stop offset="100%" stopColor={theme.vignetteColor} stopOpacity={theme.vignetteStops[3]} />
          </radialGradient>
        </defs>

        <rect
          x={mouth.x - vigSpan}
          y={mouth.y - vigSpan}
          width={vigSpan * 2}
          height={vigSpan * 2}
          fill="url(#tunnel-vignette)"
        />

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
              theme={theme}
            />
          ))}

        {/* tunnel mouth — the hovered node re-drawn blazing in the foreground (anchored, no
            parallax: the original dot below keeps the pointer events) */}
        <g transform={`translate(${mouth.x}, ${mouth.y})`}>
          {/* [4] entry burst */}
          <Shockwave radius={mouth.radius + 8} color={mouth.color} reduced={reduced} theme={theme} />
          <motion.circle
            r={mouth.radius + 7}
            fill="none"
            stroke={mouth.color}
            strokeWidth={1.4}
            opacity={0.7}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            animate={
              reduced
                ? undefined
                : {
                    scale: [1, 1.5],
                    opacity: [0.7, 0],
                    transition: { duration: 1.6, repeat: Infinity, ease: 'easeOut' },
                  }
            }
          />
          <circle
            r={mouth.radius + 3}
            fill="none"
            stroke={mouth.color}
            strokeWidth={0.8}
            opacity={0.5}
          />
          <circle
            r={mouth.radius}
            fill={mouth.color}
            stroke={theme.dotStroke(mouth.color)}
            strokeWidth={1.6}
            filter="url(#tunnel-glow)"
          />
        </g>
      </motion.g>
    </AnimatePresence>
  );
}
