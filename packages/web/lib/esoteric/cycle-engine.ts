import { readFileSync } from 'fs';
import { join } from 'path';
import type {
  BarbaultData,
  BarbaultYear,
  TurchinData,
  KondratieffData,
  StraussHoweData,
  DalioData,
  DalioNation,
  CrossCivilizationalData,
  LexiconData,
  LexiconTerm,
  ConvergenceData,
} from './types';

function loadJson<T>(filename: string): T {
  const filePath = join(process.cwd(), 'lib/esoteric/data', filename);
  return JSON.parse(readFileSync(filePath, 'utf-8')) as T;
}

const barbault = loadJson<BarbaultData>('barbault.json');
const turchin = loadJson<TurchinData>('turchin.json');
const kondratieff = loadJson<KondratieffData>('kondratieff.json');
const straussHowe = loadJson<StraussHoweData>('strauss-howe.json');
const dalio = loadJson<DalioData>('dalio.json');
const crossCiv = loadJson<CrossCivilizationalData>('cross-civilizational.json');
const lexicon = loadJson<LexiconData>('lexicon.json');
const convergence = loadJson<ConvergenceData>('convergence.json');

// === Types for engine output ===

export interface BarbaultPosition {
  currentYear: number;
  currentIndex: number;
  trend: 'rising' | 'falling' | 'stable';
  previousIndex: number;
  nearestEvent?: string;
}

export interface TurchinPosition {
  psi: number;
  mmp: number;
  emp: number;
  sfd: number;
  phase: string;
  assessment: TurchinData['us']['currentAssessment'];
}

export interface KondratieffPosition {
  wave: number;
  waveName: string;
  phase: string;
  perezStage: string;
  perezNote: string;
}

export interface StraussHowePosition {
  turning: number;
  turningName: string;
  startYear: number;
  projectedEnd: number;
  yearsRemaining: number;
  climax: string;
}

export interface DalioPosition {
  usStage: number;
  usStageName: string;
  topNations: DalioNation[];
}

export interface FrameworkPositions {
  barbault: BarbaultPosition;
  turchin: TurchinPosition;
  kondratieff: KondratieffPosition;
  straussHowe: StraussHowePosition;
  dalio: DalioPosition;
  timestamp: string;
}

export interface CrossCivilizationalInsight {
  traditionId: string;
  traditionName: string;
  sigil: string;
  principle: string;
  color: string;
  topic: string;
  insight: string;
}

// === Engine functions ===

export function getCurrentPositions(): FrameworkPositions {
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
  return {
    usStage,
    usStageName,
    topNations: nations.slice(0, 5),
  };
}

export function getConvergence(): ConvergenceData {
  return convergence;
}

export function getRelevantPatterns(topics: string[]): CrossCivilizationalInsight[] {
  if (!topics.length) return [];
  const normalizedTopics = topics.map((t) => t.toLowerCase().trim());
  const results: CrossCivilizationalInsight[] = [];

  for (const tradition of crossCiv.traditions) {
    for (const pattern of tradition.patterns) {
      if (normalizedTopics.some((t) => pattern.topic.includes(t) || t.includes(pattern.topic))) {
        results.push({
          traditionId: tradition.id,
          traditionName: tradition.name,
          sigil: tradition.sigil,
          principle: tradition.principle,
          color: tradition.color,
          topic: pattern.topic,
          insight: pattern.insight,
        });
      }
    }
  }

  return results;
}

export function getBarbaultChart(): {
  years: BarbaultYear[];
  pairCycles: BarbaultData['pairCycles'];
} {
  return {
    years: barbault.years,
    pairCycles: barbault.pairCycles,
  };
}

export function getPowerIndex(limit: number = 5): DalioNation[] {
  return [...dalio.powerIndex.nations].sort((a, b) => b.score - a.score).slice(0, limit);
}

export function getLexiconTerm(id: string): LexiconTerm | undefined {
  return lexicon.terms.find((t) => t.id === id);
}

export function searchLexicon(query: string): LexiconTerm[] {
  const q = query.toLowerCase();
  return lexicon.terms.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.secularName.toLowerCase().includes(q) ||
      t.plain.toLowerCase().includes(q)
  );
}

// Keyword list moved to ./relevance.ts (single source of truth, client-safe).
// Re-export here for backward compatibility with existing imports.
export { detectEsotericRelevance } from './relevance';

export function getAllLexiconTerms(): LexiconTerm[] {
  return lexicon.terms;
}

export function getTurchinData(): TurchinData {
  return turchin;
}

export function getDalioData(): DalioData {
  return dalio;
}
