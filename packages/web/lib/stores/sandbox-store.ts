import { create } from 'zustand';
import type { EntityResult, ScenarioBranch } from '@/lib/god-view/scenario-engine';

interface SandboxState {
  isLoading: boolean;
  entities: EntityResult | null;
  branches: ScenarioBranch[];
  totalCost: number;
  totalLatency: number;
  error: string | null;
  seed: string;
  question: string;
  domain: string;
  status: string;
  setLoading: (loading: boolean) => void;
  setEntities: (entities: EntityResult) => void;
  addBranch: (branch: ScenarioBranch) => void;
  setComplete: (cost: number, latency: number) => void;
  setError: (error: string) => void;
  setStatus: (status: string) => void;
  setInput: (seed: string, question: string, domain: string) => void;
  reset: () => void;
}

export const useSandboxStore = create<SandboxState>()((set) => ({
  isLoading: false,
  entities: null,
  branches: [],
  totalCost: 0,
  totalLatency: 0,
  error: null,
  seed: '',
  question: '',
  domain: 'auto',
  status: '',
  setLoading: (loading) => set({ isLoading: loading, error: null }),
  setEntities: (entities) => set({ entities }),
  addBranch: (branch) => set((state) => ({ branches: [...state.branches, branch] })),
  setComplete: (cost, latency) =>
    set({ isLoading: false, totalCost: cost, totalLatency: latency, status: 'Complete' }),
  setError: (error) => set({ error, isLoading: false, status: '' }),
  setStatus: (status) => set({ status }),
  setInput: (seed, question, domain) => set({ seed, question, domain }),
  reset: () =>
    set({
      isLoading: false,
      entities: null,
      branches: [],
      totalCost: 0,
      totalLatency: 0,
      error: null,
      status: '',
      seed: '',
      question: '',
      domain: 'auto',
    }),
}));
