import { create } from 'zustand';

interface DashboardStats {
  queriesToday: number;
  queriesThisMonth: number;
  totalTokens: number;
  totalCost: number;
  avgResponseTime: number;
  providers: {
    anthropic: {
      status: 'active' | 'inactive' | 'error';
      queries: number;
      cost: number;
    };
    deepseek: {
      status: 'active' | 'inactive' | 'error';
      queries: number;
      cost: number;
    };
    xai: {
      status: 'active' | 'inactive' | 'error';
      queries: number;
      cost: number;
    };
    openrouter: {
      status: 'active' | 'inactive' | 'error';
      queries: number;
      cost: number;
    };
  };
}

interface DashboardStore {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  fetchStats: () => Promise<void>;
  resetStats: () => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  stats: null,
  loading: false,
  error: null,

  fetchStats: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      set({ stats: data, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false,
      });
    }
  },

  resetStats: () => {
    set({ stats: null, loading: false, error: null });
  },
}));
