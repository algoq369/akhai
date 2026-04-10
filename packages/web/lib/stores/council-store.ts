import { create } from 'zustand';
import { COUNCIL_AGENTS } from '@/lib/god-view/agents';

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
  activeAgentLayers: number[];
  drillAgentId: string | null;
  drillQueryId: string | null;
  addResult: (result: CouncilResult) => void;
  setLoading: (loading: boolean, queryId?: string | null) => void;
  setDrillAgent: (agentId: string | null, queryId?: string | null) => void;
  clear: () => void;
}

const AGENT_LAYERS = COUNCIL_AGENTS.map((a) => a.layerId);

export const useCouncilStore = create<CouncilState>()((set) => ({
  results: [],
  isLoading: false,
  activeQueryId: null,
  activeAgentLayers: [],
  drillAgentId: null,
  drillQueryId: null,
  addResult: (result) =>
    set((state) => ({
      results: [result, ...state.results].slice(0, 50),
      isLoading: false,
      activeQueryId: null,
      activeAgentLayers: AGENT_LAYERS,
    })),
  setLoading: (loading, queryId = null) => set({
    isLoading: loading,
    activeQueryId: queryId,
    activeAgentLayers: loading ? AGENT_LAYERS : [],
  }),
  setDrillAgent: (agentId, queryId = null) => set({ drillAgentId: agentId, drillQueryId: queryId }),
  clear: () => set({ results: [], isLoading: false, activeQueryId: null, activeAgentLayers: [], drillAgentId: null, drillQueryId: null }),
}));
