'use client';

/**
 * tunnel-adaptive — background-adaptive palette for the M4b hover tunnel. The v2 effect was
 * authored for a dark stage (white-hot cores, near-black vignette) and vanished on the light
 * map background (#fafbfc: white core on white bg, dark vignette pooling into nothing). One
 * palette object per theme swaps every structural white/black and the dark-tuned opacities;
 * SUBJECT_COLORS hues stay identical in both themes.
 *
 * DARK — the original white-hot tunnel: white cores bleeding into subject color, near-black
 * vignette, white dot strokes and mote cores.
 * LIGHT — saturated colored beams: the core is a darkened shade of the subject color with a
 * thin white hot-highlight riding on top of it (white reads there because it sits over the
 * colored bloom), bloom opacities raised (color-on-white needs more weight to glow), and the
 * vignette inverts to a wash of the page background so the far graph fades TO light — the same
 * "pool of clarity at the mouth" read, achieved with light instead of darkness. Rings and
 * shockwave darken + thicken a step so pale hues (amber/yellow) still contrast on white.
 *
 * Theme detection reads html.dark directly (useIsDarkTheme) — the same class every dark-mode
 * toggle path writes and the same truth Tailwind's dark: variants (incl. the map bg in
 * MindMapDiagramView) key on. A MutationObserver keeps it live, so toggling the theme recolors
 * an open tunnel without reload. SSR-safe: defaults to light, the map's default theme.
 */

import { useEffect, useState } from 'react';

/** Mix a #rrggbb hex toward black (amt < 0) or white (amt > 0). |amt| = mix fraction 0..1. */
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const t = amt < 0 ? 0 : 255;
  const a = Math.abs(amt);
  const mix = (c: number) => Math.round(c + (t - c) * a);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export interface TunnelGradientStop {
  offset: string;
  color: string;
  opacity: number;
}

export interface TunnelTheme {
  isDark: boolean;
  /** strand core gradient mouth→target — the "hot" end sits at the mouth */
  coreStops: (color: string) => TunnelGradientStop[];
  /** thin specular filament drawn over the core (light mode only — rides on the bloom) */
  highlight: { widthFactor: number; color: string; opacity: number } | null;
  bloomOuterOpacity: number;
  bloomMidOpacity: number;
  vignetteColor: string;
  /** vignette opacity ramp at the 0 / 32 / 66 / 100% radial stops */
  vignetteStops: [number, number, number, number];
  dotStroke: (color: string) => string;
  labelFill: (color: string) => string;
  labelHalo: string;
  haloOpacity: number;
  moteCore: (color: string) => string;
  ringStroke: (color: string) => string;
  ringWidth: number;
  ringOpacityFactor: number;
  shockStroke: (color: string) => string;
  shockOpacity: number;
}

const DARK_THEME: TunnelTheme = {
  isDark: true,
  coreStops: (color) => [
    { offset: '0%', color: '#ffffff', opacity: 1 },
    { offset: '20%', color: '#ffffff', opacity: 0.85 },
    { offset: '55%', color, opacity: 0.85 },
    { offset: '100%', color, opacity: 1 },
  ],
  highlight: null,
  bloomOuterOpacity: 0.18,
  bloomMidOpacity: 0.5,
  vignetteColor: '#05060e',
  vignetteStops: [0, 0.05, 0.32, 0.55],
  dotStroke: () => '#ffffff',
  labelFill: (color) => color,
  labelHalo: '#0b0d16',
  haloOpacity: 0.3,
  moteCore: () => '#ffffff',
  ringStroke: (color) => color,
  ringWidth: 1.1,
  ringOpacityFactor: 1,
  shockStroke: (color) => color,
  shockOpacity: 0.65,
};

const LIGHT_THEME: TunnelTheme = {
  isDark: false,
  coreStops: (color) => [
    { offset: '0%', color: shade(color, -0.45), opacity: 1 },
    { offset: '20%', color: shade(color, -0.3), opacity: 0.95 },
    { offset: '55%', color, opacity: 0.9 },
    { offset: '100%', color: shade(color, -0.15), opacity: 1 },
  ],
  highlight: { widthFactor: 0.38, color: '#ffffff', opacity: 0.85 },
  bloomOuterOpacity: 0.28,
  bloomMidOpacity: 0.6,
  vignetteColor: '#fafbfc',
  vignetteStops: [0, 0.08, 0.5, 0.8],
  dotStroke: (color) => shade(color, -0.5),
  labelFill: (color) => shade(color, -0.45),
  labelHalo: '#ffffff',
  haloOpacity: 0.35,
  moteCore: (color) => shade(color, -0.35),
  ringStroke: (color) => shade(color, -0.3),
  ringWidth: 1.3,
  ringOpacityFactor: 1.6,
  shockStroke: (color) => shade(color, -0.3),
  shockOpacity: 0.75,
};

export function getTunnelTheme(isDark: boolean): TunnelTheme {
  return isDark ? DARK_THEME : LIGHT_THEME;
}

/** Live html.dark reader — reacts to theme toggles via MutationObserver, SSR-safe. */
export function useIsDarkTheme(): boolean {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    const read = () => setIsDark(el.classList.contains('dark'));
    read();
    const observer = new MutationObserver(read);
    observer.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}
