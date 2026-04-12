/**
 * Client-safe static data module for the constellation page.
 * Imports JSON directly (bundled by Next.js) — no fs.readFileSync.
 * Mirrors computation logic from cycle-engine.ts for client-side use.
 */

import type {
  BarbaultData,
  BarbaultYear,
  TurchinData,
  KondratieffData,
  StraussHoweData,
  DalioData,
  DalioNation,
  CrossCivilizationalData,
  ConvergenceData,
} from './types';
import type {
  FrameworkPositions,
  BarbaultPosition,
  TurchinPosition,
  KondratieffPosition,
  StraussHowePosition,
  DalioPosition,
} from './cycle-engine';

import rawBarbault from './data/barbault.json';
import rawTurchin from './data/turchin.json';
import rawKondratieff from './data/kondratieff.json';
import rawStraussHowe from './data/strauss-howe.json';
import rawDalio from './data/dalio.json';
import rawCrossCiv from './data/cross-civilizational.json';
import rawConvergence from './data/convergence.json';

const barbault = rawBarbault as unknown as BarbaultData;
const turchin = rawTurchin as unknown as TurchinData;
const kondratieff = rawKondratieff as unknown as KondratieffData;
const straussHowe = rawStraussHowe as unknown as StraussHoweData;
const dalio = rawDalio as unknown as DalioData;
const crossCiv = rawCrossCiv as unknown as CrossCivilizationalData;
const convergenceJson = rawConvergence as unknown as ConvergenceData;

// === Position computations (mirrors cycle-engine.ts) ===

function getBarbaultPosition(currentYear: number): BarbaultPosition {
  const years = barbault.years;
  let closest = years[0];
  let closestIdx = 0;
  for (let i = 0; i < years.length; i++) {
    if (Math.abs(years[i].year - currentYear) < Math.abs(closest.year - currentYear)) {
      closest = years[i];
      closestIdx = i;
    }
  }
  const prev = closestIdx > 0 ? years[closestIdx - 1] : closest;
  const diff = closest.index - prev.index;
  const trend: 'rising' | 'falling' | 'stable' =
    diff > 5 ? 'rising' : diff < -5 ? 'falling' : 'stable';
  return {
    currentYear: closest.year,
    currentIndex: closest.index,
    trend,
    previousIndex: prev.index,
    nearestEvent: closest.event,
  };
}

function getTurchinPosition(): TurchinPosition {
  const latest = turchin.us.psiHistory[turchin.us.psiHistory.length - 1];
  return {
    psi: latest.psi,
    mmp: latest.mmp,
    emp: latest.emp,
    sfd: latest.sfd,
    phase: turchin.us.currentAssessment.phase,
    assessment: turchin.us.currentAssessment,
  };
}

function getKondratieffPosition(): KondratieffPosition {
  const pos = kondratieff.currentPosition;
  const currentWave = kondratieff.waves.find((w) => w.id === pos.wave);
  return {
    wave: pos.wave,
    waveName: currentWave?.name ?? 'Unknown',
    phase: pos.phase,
    perezStage: pos.perezStage,
    perezNote: pos.perezNote,
  };
}

function getStraussHowePosition(currentYear: number): StraussHowePosition {
  const pos = straussHowe.currentPosition;
  return {
    turning: pos.turning,
    turningName: pos.turningName,
    startYear: pos.startYear,
    projectedEnd: pos.projectedEnd,
    yearsRemaining: Math.max(0, pos.projectedEnd - currentYear),
    climax: pos.climax,
  };
}

function getDalioPosition(): DalioPosition {
  const nations = [...dalio.powerIndex.nations].sort((a, b) => b.score - a.score);
  const us = nations.find((n) => n.name === 'United States');
  const usStage = us?.stage ?? 5;
  const usStageName = dalio.stages.find((s) => s.id === usStage)?.name ?? 'Unknown';
  return { usStage, usStageName, topNations: nations.slice(0, 5) };
}

// === Exported static data functions ===

export function getStaticPositions(): FrameworkPositions {
  const now = new Date();
  const currentYear = now.getFullYear();
  return {
    barbault: getBarbaultPosition(currentYear),
    turchin: getTurchinPosition(),
    kondratieff: getKondratieffPosition(),
    straussHowe: getStraussHowePosition(currentYear),
    dalio: getDalioPosition(),
    timestamp: now.toISOString(),
  };
}

export function getStaticConvergence(): ConvergenceData {
  return convergenceJson;
}

export function getStaticChart(): {
  years: BarbaultYear[];
  pairCycles: BarbaultData['pairCycles'];
} {
  return { years: barbault.years, pairCycles: barbault.pairCycles };
}

export function getStaticPowerIndex(limit = 5): DalioNation[] {
  return [...dalio.powerIndex.nations].sort((a, b) => b.score - a.score).slice(0, limit);
}

export interface StaticPattern {
  traditionName: string;
  sigil: string;
  color: string;
  topic: string;
  formatted: string;
}

export function getStaticPatterns(
  topics: string[],
  mode: 'secular' | 'esoteric' = 'secular'
): StaticPattern[] {
  if (!topics.length) return [];
  const normalizedTopics = topics.map((t) => t.toLowerCase().trim());
  const results: StaticPattern[] = [];
  const seenTraditions = new Set<string>();

  for (const tradition of crossCiv.traditions) {
    if (seenTraditions.size >= 4) break;
    for (const pattern of tradition.patterns) {
      if (seenTraditions.has(tradition.id)) break;
      const matches = normalizedTopics.some(
        (t) => pattern.topic.includes(t) || t.includes(pattern.topic)
      );
      if (matches) {
        seenTraditions.add(tradition.id);
        const formatted =
          mode === 'secular'
            ? `Historical cyclical analysis suggests: ${pattern.insight}`
            : `${tradition.sigil} ${tradition.name} \u2014 ${tradition.principle}: ${pattern.insight}`;
        results.push({
          traditionName: mode === 'secular' ? 'Historical Pattern Analysis' : tradition.name,
          sigil: mode === 'secular' ? '\u25C6' : tradition.sigil,
          color: tradition.color,
          topic: pattern.topic,
          formatted,
        });
      }
    }
  }
  return results;
}
