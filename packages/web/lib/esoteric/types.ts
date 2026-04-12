// Esoteric Layer — TypeScript interfaces for all macro-cyclical framework datasets

// === Barbault Cyclical Index ===

export interface BarbaultYear {
  year: number;
  index: number;
  event?: string;
}

export interface PairCycle {
  pair: string;
  period: number;
  theme: string;
  conjunctions: number[];
  note: string;
}

export interface BarbaultData {
  years: BarbaultYear[];
  pairCycles: PairCycle[];
}

// === Turchin SDT / Ibn Khaldun ===

export interface TurchinPSI {
  year: number;
  psi: number;
  mmp: number;
  emp: number;
  sfd: number;
}

export interface TurchinAssessment {
  phase: string;
  secularCyclePosition: string;
  fathersSonsCycle: string;
  eliteOverproduction: { value: string; metric: string };
  massWellbeing: { value: string; metric: string };
  stateFiscalHealth: { value: string; metric: string };
  institutionalTrust: { value: number; metric: string };
  politicalPolarization: { value: string; metric: string };
}

export interface TurchinNation {
  name: string;
  phase: string;
  psi: number;
  notes: string;
}

export interface IbnKhaldunCycle {
  stages: string[];
  westernCycle: {
    startYear: number;
    currentStage: number;
    stageLabel: string;
    cycleLength: number;
    note: string;
  };
  asabiyyahIndicators: Record<string, string>;
}

export interface TurchinData {
  us: {
    psiHistory: TurchinPSI[];
    currentAssessment: TurchinAssessment;
  };
  otherNations: TurchinNation[];
  ibnKhaldun: IbnKhaldunCycle;
}

// === Kondratieff / Perez ===

export interface KWave {
  id: number;
  name: string;
  tech: string;
  start: number;
  end: number | null;
  spring: [number, number] | null;
  summer: [number, number] | null;
  autumn: [number, number] | null;
  winter: [number, number] | null;
  phase?: string;
  hegemon: string;
  crisisEvent: string | null;
}

export interface PerezPhase {
  name: string;
  character: string;
  duration: string;
}

export interface KondratieffData {
  waves: KWave[];
  currentPosition: {
    wave: number;
    phase: string;
    perezStage: string;
    perezNote: string;
    confidence: string;
    perezPhases: PerezPhase[];
  };
}

// === Strauss-Howe ===

export interface StraussHoweTurning {
  id: number;
  name: string;
  character: string;
  duration: string;
  mood: string;
  example: string;
}

export interface GenerationalArchetype {
  name: string;
  turningBorn: number;
  crisisRole: string;
  example: string;
}

export interface Saeculum {
  name: string;
  span: [number, number | null];
  crisis: [number, number];
  crisisEvent: string;
  resolution: string | null;
  current?: boolean;
}

export interface StraussHoweData {
  turnings: StraussHoweTurning[];
  archetypes: GenerationalArchetype[];
  saecula: Saeculum[];
  currentPosition: {
    turning: number;
    turningName: string;
    startYear: number;
    projectedEnd: number;
    catalysts: string[];
    climax: string;
    generationInCrisis: Record<string, string>;
  };
  credibilityNote: string;
}

// === Dalio Big Cycle ===

export interface DalioStage {
  id: number;
  name: string;
  character: string;
  duration: string;
}

export interface DalioNation {
  name: string;
  score: number;
  stage: number;
  trend: string;
  strengths: string[];
  weaknesses: string[];
  reserveCurrencyShare?: number;
  debtToGdp?: number;
}

export interface DalioData {
  stages: DalioStage[];
  eightPowers: string[];
  powerIndex: {
    updated: string;
    nations: DalioNation[];
  };
  debtCycle: {
    shortTerm: { period: string; currentPhase: string; note: string };
    longTerm: { period: string; currentPhase: string; note: string };
  };
}

// === Cross-Civilizational Patterns ===

export interface TraditionPattern {
  topic: string;
  insight: string;
}

export interface CrossCivilizationalTradition {
  id: string;
  name: string;
  sigil: string;
  principle: string;
  color: string;
  origin: string;
  patterns: TraditionPattern[];
}

export interface CrossCivilizationalData {
  traditions: CrossCivilizationalTradition[];
}

// === Lexicon ===

export interface LexiconTerm {
  id: string;
  category: string;
  sigil: string;
  name: string;
  secularName: string;
  type: string;
  color: string;
  plain: string;
  example: string;
  related: string[];
}

export interface LexiconData {
  terms: LexiconTerm[];
}

// === Convergence ===

export interface ConvergenceFramework {
  name: string;
  tradition: string;
  status: string;
  signal: string;
  detail: string;
}

export interface HistoricalConvergence {
  year: number;
  frameworks: number;
  event: string;
  alignment: string[];
  outcome: string;
}

export interface ConvergenceData {
  current: {
    score: number;
    maxScore: number;
    label: string;
    assessed: string;
    frameworks: ConvergenceFramework[];
    synthesis: string;
  };
  historicalConvergences: HistoricalConvergence[];
  caveat: string;
}
