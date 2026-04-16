import { create } from 'zustand';

export interface MacroResult {
  queryId: string;
  relevant: boolean;
  strongRelevance?: boolean;
  positions?: any;
  convergence?: any;
  synthesis?: string;
  crossCiv?: any[];
  powerIndex?: any[];
  chart?: any;
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
