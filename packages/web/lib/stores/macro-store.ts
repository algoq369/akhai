import { create } from 'zustand';
import type { FrameworkPositions, CrossCivilizationalInsight } from '@/lib/esoteric/cycle-engine';
import type { ConvergenceData, DalioNation, BarbaultYear, BarbaultData } from '@/lib/esoteric/types';

export interface MacroResult {
  queryId: string;
  relevant: boolean;
  strongRelevance?: boolean;
  positions?: FrameworkPositions;
  convergence?: ConvergenceData;
  synthesis?: string;
  crossCiv?: CrossCivilizationalInsight[];
  powerIndex?: DalioNation[];
  chart?: { years: BarbaultYear[]; pairCycles: BarbaultData['pairCycles'] };
  cost?: number;
  error?: string;
}

interface MacroStore {
  results: MacroResult[];
  isLoading: boolean;
  activeQueryId: string | null;
  expandedPanels: Record<string, boolean>;
  setLoading: (loading: boolean, queryId?: string | null) => void;
  addResult: (result: MacroResult) => void;
  togglePanel: (queryId: string) => void;
}

export const useMacroStore = create<MacroStore>((set) => ({
  results: [],
  isLoading: false,
  activeQueryId: null,
  expandedPanels: {},
  setLoading: (loading, queryId = null) => set({ isLoading: loading, activeQueryId: queryId }),
  addResult: (result) =>
    set((state) => ({
      results: [...state.results.filter((r) => r.queryId !== result.queryId), result],
    })),
  togglePanel: (queryId) =>
    set((state) => ({
      expandedPanels: { ...state.expandedPanels, [queryId]: !state.expandedPanels[queryId] },
    })),
}));
