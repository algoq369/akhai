import { create } from 'zustand';
import type { FrameworkPositions } from '@/lib/esoteric/cycle-engine';
import type { ConvergenceData } from '@/lib/esoteric/types';
import type { CrossCivInsight } from '@/lib/esoteric/cross-civilizational';
import type { DalioNation, BarbaultYear } from '@/lib/esoteric/types';

export interface EsotericAnalysis {
  positions: FrameworkPositions;
  convergence: ConvergenceData;
  patterns: CrossCivInsight[];
  chart: { years: BarbaultYear[]; pairCycles: unknown[] };
  powerIndex: DalioNation[];
  synthesis: string;
}

interface EsotericState {
  mode: 'secular' | 'esoteric';
  analysis: EsotericAnalysis | null;
  isLoading: boolean;
  isEnabled: boolean;
  setMode: (mode: 'secular' | 'esoteric') => void;
  setAnalysis: (analysis: EsotericAnalysis | null) => void;
  setLoading: (loading: boolean) => void;
  toggleEnabled: () => void;
  reset: () => void;
}

export const useEsotericStore = create<EsotericState>()((set) => ({
  mode: 'secular',
  analysis: null,
  isLoading: false,
  isEnabled: true,
  setMode: (mode) => set({ mode }),
  setAnalysis: (analysis) => set({ analysis }),
  setLoading: (loading) => set({ isLoading: loading }),
  toggleEnabled: () => set((state) => ({ isEnabled: !state.isEnabled })),
  reset: () => set({ analysis: null, isLoading: false }),
}));
