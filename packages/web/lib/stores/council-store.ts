import { create } from 'zustand';

export interface PerspectiveResult {
  agentId: string;
  text: string;
  latencyMs: number;
  cost: number;
}

export interface CouncilResult {
  queryId: string;
  query: string;
  perspectives: PerspectiveResult[];
  synthesis: string;
  totalCost: number;
  timestamp: number;
}

interface CouncilState {
  results: CouncilResult[];
  isLoading: boolean;
  activeQueryId: string | null;
  addResult: (result: CouncilResult) => void;
  setLoading: (loading: boolean, queryId?: string | null) => void;
  clear: () => void;
}

export const useCouncilStore = create<CouncilState>()((set) => ({
  results: [],
  isLoading: false,
  activeQueryId: null,
  addResult: (result) =>
    set((state) => ({
      results: [result, ...state.results].slice(0, 50),
      isLoading: false,
      activeQueryId: null,
    })),
  setLoading: (loading, queryId = null) => set({ isLoading: loading, activeQueryId: queryId }),
  clear: () => set({ results: [], isLoading: false, activeQueryId: null }),
}));
