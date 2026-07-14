'use client';

/**
 * mindmap-tunnel-v2 — the depth machinery: receding shaft rings, entrance shockwave, and
 * particle energy-motes. Split from TunnelOverlay.tsx to keep both files under the 500-line
 * ceiling. All pure SVG + framer-motion; every looping animation is gated by `reduced`.
 * tunnel-adaptive: structural colors + contrast weights come from the TunnelTheme so rings,
 * shockwave and motes read on both the light and dark map backgrounds.
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { TunnelTheme } from './tunnel-theme';

export interface Pt {
  x: number;
  y: number;
}

/** Sample the quadratic Bézier the strand is drawn with (M mouth Q control target). */
export function quadPoint(t: number, p0: Pt, c: Pt, p1: Pt): Pt {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * c.x + t * t * p1.x,
    y: mt * mt * p0.y + 2 * mt * t * c.y + t * t * p1.y,
  };
}

// ---------------------------------------------------------------------------
// [1] TUNNEL GEOMETRY — concentric elliptical rings receding down the shaft.
// Each ring sits on the strand's Bézier, oriented along the mouth→target axis
// (squashed along the travel direction = a ring seen at an angle), smaller,
// dimmer and blurrier the deeper it sits. A slow inward drift (scale+fade
// loop) implies motion down the shaft; reduced-motion renders them static.
// ---------------------------------------------------------------------------
const RING_STEPS = [
  { f: 0.2, r: 30, o: 0.2, blur: 0 },
  { f: 0.44, r: 21, o: 0.16, blur: 0.6 },
  { f: 0.66, r: 14, o: 0.12, blur: 1.1 },
  { f: 0.85, r: 8.5, o: 0.09, blur: 1.6 },
];

export function TunnelRings({
  mouth,
  control,
  target,
  color,
  depthScale,
  depthOpacity,
  reduced,
  theme,
}: {
  mouth: Pt;
  control: Pt;
  target: Pt;
  color: string;
  depthScale: number;
  depthOpacity: number;
  reduced: boolean;
  theme: TunnelTheme;
}) {
  const angle = (Math.atan2(target.y - mouth.y, target.x - mouth.x) * 180) / Math.PI;
  return (
    <g>
      {RING_STEPS.map((ring, i) => {
        const p = quadPoint(ring.f, mouth, control, target);
        const o = ring.o * depthOpacity * theme.ringOpacityFactor;
        return (
          <g key={i} transform={`translate(${p.x}, ${p.y}) rotate(${angle})`}>
            <motion.ellipse
              rx={ring.r * 0.34 * depthScale}
              ry={ring.r * depthScale}
              fill="none"
              stroke={theme.ringStroke(color)}
              strokeWidth={theme.ringWidth}
              style={{
                transformBox: 'fill-box',
                transformOrigin: 'center',
                filter: ring.blur ? `blur(${ring.blur}px)` : undefined,
              }}
              initial={{ opacity: 0 }}
              animate={
                reduced
                  ? { opacity: o }
                  : { opacity: [o, o * 0.35, o], scale: [1, 0.86, 1] }
              }
              transition={
                reduced
                  ? { duration: 0.3 }
                  : { duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: i * 0.55 }
              }
            />
          </g>
        );
      })}
    </g>
  );
}

// ---------------------------------------------------------------------------
// [4] THE SHOCKWAVE — a single expanding burst from the mouth on entry.
// ---------------------------------------------------------------------------
export function Shockwave({
  radius,
  color,
  reduced,
  theme,
}: {
  radius: number;
  color: string;
  reduced: boolean;
  theme: TunnelTheme;
}) {
  if (reduced) return null;
  return (
    <motion.circle
      r={radius}
      fill="none"
      stroke={theme.shockStroke(color)}
      strokeWidth={2.2}
      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      initial={{ scale: 0.25, opacity: theme.shockOpacity }}
      animate={{ scale: 2.6, opacity: 0 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
    />
  );
}

// ---------------------------------------------------------------------------
// [6] PARTICLE TRAVELERS — discrete glowing motes streaming mouth→target along
// the Bézier (keyframe-sampled cx/cy; framer drives them on rAF outside React
// render). #1 gets 3 motes, deeper strands 2. Skipped under reduced-motion.
// ---------------------------------------------------------------------------
const MOTE_SAMPLES = 22;

export function Motes({
  mouth,
  control,
  target,
  color,
  rank,
  reduced,
  theme,
}: {
  mouth: Pt;
  control: Pt;
  target: Pt;
  color: string;
  rank: number;
  reduced: boolean;
  theme: TunnelTheme;
}) {
  if (reduced) return null;
  const count = rank === 0 ? 3 : 2;
  const pts = Array.from({ length: MOTE_SAMPLES + 1 }, (_, i) =>
    quadPoint(i / MOTE_SAMPLES, mouth, control, target)
  );
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const dur = 1.35 + rank * 0.35;
  // fade in off the mouth, ride bright, sink into the target
  const fade = [0, 0.9, 0.9, 0.9, 0.25];
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const delay = (dur / count) * i;
        const t = { duration: dur, repeat: Infinity, ease: 'linear' as const, delay };
        return (
          <g key={i}>
            <motion.circle
              r={3.6}
              fill={color}
              style={{ filter: 'blur(2.5px)' }}
              initial={{ cx: xs[0], cy: ys[0], opacity: 0 }}
              animate={{ cx: xs, cy: ys, opacity: fade.map((f) => f * 0.7) }}
              transition={t}
            />
            <motion.circle
              r={1.7}
              fill={theme.moteCore(color)}
              initial={{ cx: xs[0], cy: ys[0], opacity: 0 }}
              animate={{ cx: xs, cy: ys, opacity: fade }}
              transition={t}
            />
          </g>
        );
      })}
    </>
  );
}
